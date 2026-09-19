const express = require('express');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const webpush = require('web-push');
const { OAuth2Client } = require('google-auth-library');

try {
  const env = fs.readFileSync(path.join(__dirname, '.env'), 'utf8');
  for (const line of env.split(/\r?\n/)) {
    const m = line.match(/^([A-Za-z_][\w]*)\s*=\s*(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
  }
} catch {}

const PORT = process.env.PORT || 3000;
const DATA_DIR = process.env.DATA_DIR || __dirname;
const DATA_FILE = path.join(DATA_DIR, 'data.json');
const VAPID_FILE = path.join(DATA_DIR, '.vapid.json');
const SECRET_FILE = path.join(DATA_DIR, '.session-secret');
const SESSION_DAYS = 30;

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const MENU_EDITOR_EMAIL = (process.env.MENU_EDITOR_EMAIL || 'carlos.rodriguez@aluno.ufop.edu.br').toLowerCase();
const googleClient = GOOGLE_CLIENT_ID ? new OAuth2Client(GOOGLE_CLIENT_ID) : null;
const MAX_AGE = 24 * 60 * 60 * 1000;
const REDIS_KEY = 'ru:data';
const APP_TZ = process.env.APP_TZ || 'America/Sao_Paulo';

const app = express();
const PUBLIC = path.join(__dirname, 'public');
app.use(express.json());

function assetVersion(name) {
  try {
    return crypto.createHash('md5').update(fs.readFileSync(path.join(PUBLIC, name))).digest('hex').slice(0, 10);
  } catch {
    return 'dev';
  }
}

let INDEX_HTML = '';
function buildIndex() {
  let html = fs.readFileSync(path.join(PUBLIC, 'index.html'), 'utf8');
  html = html.replace('/app.js?v=res', `/app.js?v=${assetVersion('app.js')}`);
  html = html.replace('/style.css?v=7', `/style.css?v=${assetVersion('style.css')}`);
  INDEX_HTML = html;
}
buildIndex();

const noCache = (req, res, next) => {
  res.setHeader('Cache-Control', 'no-cache');
  next();
};
app.get('/', noCache, (req, res) => res.send(INDEX_HTML));
app.get('/index.html', noCache, (req, res) => res.send(INDEX_HTML));
app.get('/sw.js', noCache, (req, res) => res.sendFile(path.join(PUBLIC, 'sw.js')));
app.get('/manifest.json', noCache, (req, res) => res.sendFile(path.join(PUBLIC, 'manifest.json')));
app.use(express.static(PUBLIC));

let redis = null;
if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  const { Redis } = require('@upstash/redis');
  redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
}

let db = { announcements: [], menus: [], subscriptions: [], users: {} };

function normalizeDb() {
  if (!Array.isArray(db.announcements)) db.announcements = [];
  else db.announcements = db.announcements.filter((a) => a && typeof a === 'object' && a.id);
  for (const a of db.announcements) {
    a.joins = Array.isArray(a.joins) ? a.joins.filter((j) => j && j.email) : [];
  }
  if (!Array.isArray(db.menus)) db.menus = [];
  if (!Array.isArray(db.subscriptions)) db.subscriptions = [];
  else db.subscriptions = db.subscriptions.filter((s) => s && typeof s === 'object' && s.endpoint);
  for (const s of db.subscriptions) s.email = String(s.email || '').trim().toLowerCase().slice(0, 80);
  if (!db.users || typeof db.users !== 'object') db.users = {};
  for (const k of Object.keys(db.users)) {
    const u = db.users[k];
    if (!u || typeof u !== 'object') {
      delete db.users[k];
      continue;
    }
    u.friends = Array.isArray(u.friends) ? u.friends : [];
    u.incoming = Array.isArray(u.incoming) ? u.incoming : [];
    u.outgoing = Array.isArray(u.outgoing) ? u.outgoing : [];
  }
  return db;
}

async function loadData() {
  if (redis) {
    try {
      const data = await redis.get(REDIS_KEY);
      if (data) db = typeof data === 'string' ? JSON.parse(data) : data;
    } catch (err) {
      console.error('erro ao ler do Redis:', err.message);
    }
    normalizeDb();
    return;
  }
  try {
    db = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    if (!db || typeof db !== 'object') throw new Error('dados corrompidos');
  } catch {
    db = { announcements: [], menus: [], subscriptions: [], users: {} };
  }
  normalizeDb();
}

function writeDbFile() {
  const tmp = DATA_FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(db));
  fs.renameSync(tmp, DATA_FILE);
}

async function save() {
  try {
    if (redis) {
      db = normalizeDb();
      await redis.set(REDIS_KEY, db);
    } else {
      normalizeDb();
      fs.mkdirSync(DATA_DIR, { recursive: true });
      writeDbFile();
    }
  } catch (err) {
    console.error('erro ao salvar:', err.message);
  }
}

function loadVapid() {
  if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    return {
      subject: process.env.VAPID_SUBJECT || 'mailto:ru@ufop.local',
      publicKey: process.env.VAPID_PUBLIC_KEY,
      privateKey: process.env.VAPID_PRIVATE_KEY,
    };
  }
  try {
    return JSON.parse(fs.readFileSync(VAPID_FILE, 'utf8'));
  } catch {
    const keys = webpush.generateVAPIDKeys();
    const config = {
      subject: 'mailto:ru@ufop.local',
      publicKey: keys.publicKey,
      privateKey: keys.privateKey,
    };
    fs.writeFileSync(VAPID_FILE, JSON.stringify(config));
    return config;
  }
}

const vapid = loadVapid();
webpush.setVapidDetails(vapid.subject, vapid.publicKey, vapid.privateKey);

function sendNotifications(subs, payload) {
  const dead = [];
  const jobs = subs.map((sub) =>
    webpush
      .sendNotification(sub, payload)
      .catch((err) => {
        if (err.statusCode === 404 || err.statusCode === 410) dead.push(sub);
      })
  );
  Promise.all(jobs).then(async () => {
    if (dead.length) {
      const deadSet = new Set(dead);
      db.subscriptions = db.subscriptions.filter((s) => !deadSet.has(s));
      await save();
    }
  });
}

function sendPush(title, body) {
  sendNotifications(db.subscriptions, JSON.stringify({ title, body }));
}

function sendPushToEmails(emails, title, body) {
  const set = new Set((emails || []).map((e) => String(e).trim().toLowerCase()));
  const subs = db.subscriptions.filter((s) => set.has(s.email));
  if (subs.length) sendNotifications(subs, JSON.stringify({ title, body }));
}

function friendsOfEmail(email) {
  const u = db.users[email];
  return u && Array.isArray(u.friends) ? u.friends : [];
}

const EMAIL_RE = /^[a-z0-9._%+\-]+@(?:aluno\.)?ufop\.edu\.br$/i;

function loadSessionSecret() {
  if (process.env.SESSION_SECRET) return process.env.SESSION_SECRET;
  try {
    return fs.readFileSync(SECRET_FILE, 'utf8').trim();
  } catch {
    const secret = crypto.randomBytes(32).toString('hex');
    fs.writeFileSync(SECRET_FILE, secret);
    console.error('SESSION_SECRET não definido: gerei um local em', SECRET_FILE);
    return secret;
  }
}

const sessionSecret = loadSessionSecret();

function b64url(obj) {
  return Buffer.from(JSON.stringify(obj)).toString('base64url');
}

function signSession(user) {
  const body = b64url({
    sub: user.sub,
    email: user.email,
    name: user.name,
    exp: Math.floor(Date.now() / 1000) + SESSION_DAYS * 86400,
  });
  const sig = crypto.createHmac('sha256', sessionSecret).update(body).digest('base64url');
  return `${body}.${sig}`;
}

function verifySession(token) {
  try {
    const parts = String(token || '').split('.');
    if (parts.length !== 2) return null;
    const [body, sig] = parts;
    const expected = crypto.createHmac('sha256', sessionSecret).update(body).digest('base64url');
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString());
    if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) return null;
    if (!payload.sub || !payload.email) return null;
    return payload;
  } catch {
    return null;
  }
}

function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  const user = verifySession(token);
  if (!user) return res.status(401).json({ error: 'faça login com a conta UFOP' });
  req.user = user;
  next();
}

async function verifyGoogleCredential(credential) {
  if (!googleClient) return null;
  const ticket = await googleClient.verifyIdToken({
    idToken: credential,
    audience: GOOGLE_CLIENT_ID,
  });
  const p = ticket.getPayload();
  if (!p || !p.email_verified || !p.sub) return null;
  const email = String(p.email || '').trim().toLowerCase().slice(0, 80);
  if (!EMAIL_RE.test(email)) return null;
  return {
    sub: String(p.sub).slice(0, 80),
    email,
    name: String(p.name || p.given_name || nameFromEmail(email)).slice(0, 60),
    photo: String(p.picture || '').slice(0, 400),
  };
}

function nameFromEmail(email) {
  const local = email.split('@')[0].replace(/[._]+/g, ' ').trim();
  return local
    .split(' ')
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(' ');
}

function arrivalInfo(body) {
  const arrive = new Date(body.arrive);
  if (isNaN(arrive.getTime())) return null;
  const minutes = Math.max(1, Math.round((arrive.getTime() - Date.now()) / 60000));
  const label = String(body.label || '').trim().slice(0, 40);
  return {
    arrive,
    inMinutes: minutes,
    exact: body.when !== 'in',
    label: label || `em ${minutes} min`,
  };
}

function startOfToday() {
  const now = new Date();
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: APP_TZ,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false,
  }).formatToParts(now);
  const p = {};
  for (const part of parts) p[part.type] = part.value;
  const hour = p.hour === '24' ? '00' : p.hour;
  const wall = Date.UTC(+p.year, +p.month - 1, +p.day, +hour, +p.minute, +p.second);
  const offset = wall - now.getTime();
  return Date.UTC(+p.year, +p.month - 1, +p.day) - offset;
}

function purgeExpiredAnnouncements() {
  const cutoff = startOfToday();
  const before = db.announcements.length;
  db.announcements = db.announcements.filter((a) => new Date(a.arrive).getTime() >= cutoff);
  return db.announcements.length !== before;
}

app.get('/api/announcements', optionalAuth, (req, res) => {
  if (purgeExpiredAnnouncements()) save();
  let list = db.announcements;
  if (req.query.scope === 'friends') {
    if (!req.user) return res.status(401).json({ error: 'faça login com a conta UFOP' });
    const me = ensureUser(req.user);
    const allowed = new Set([...me.friends, req.user.email]);
    list = list.filter((a) => a.email && allowed.has(a.email));
  }
  res.json(
    list.map((a) => {
      if (!a.email) return a;
      const prof = profileOf(a.email);
      if (!prof || !prof.email) return a;
      return { ...a, name: prof.name || a.name, photo: prof.photo || '', course: prof.course || a.course || '' };
    })
  );
});

function profileOf(email, sub) {
  return db.users[email] || db.users[sub] || {};
}

function ensureUser(user) {
  let u = db.users[user.email];
  if (!u) {
    u = {
      sub: user.sub || '',
      email: user.email,
      name: user.name || '',
      photo: '',
      course: '',
      friends: [],
      incoming: [],
      outgoing: [],
      updatedAt: new Date().toISOString(),
    };
    db.users[user.email] = u;
  }
  u.friends = Array.isArray(u.friends) ? u.friends : [];
  u.incoming = Array.isArray(u.incoming) ? u.incoming : [];
  u.outgoing = Array.isArray(u.outgoing) ? u.outgoing : [];
  return u;
}

function relation(email, me) {
  if (email === me.email) return 'self';
  if (me.friends.includes(email)) return 'friend';
  if (me.incoming.includes(email)) return 'incoming';
  if (me.outgoing.includes(email)) return 'outgoing';
  return 'none';
}

function friendProfile(email) {
  const u = db.users[email] || {};
  return { email, name: u.name || '', photo: u.photo || '', course: u.course || '' };
}

function optionalAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  req.user = verifySession(token) || null;
  next();
}

app.post('/api/announce', requireAuth, async (req, res) => {
  const email = req.user.email;
  const info = arrivalInfo(req.body);
  if (!info) return res.status(400).json({ error: 'horário inválido' });
  const userId = req.user.email;
  const now = Date.now();
  db.announcements = db.announcements.filter(
    (a) =>
      new Date(a.arrive).getTime() > now - MAX_AGE &&
      (a.userId !== userId || new Date(a.arrive).getTime() <= now)
  );
  const name = req.user.name || nameFromEmail(email);
  const profile = profileOf(email, req.user.sub);
  const announcement = {
    id: crypto.randomUUID(),
    userId,
    email,
    name,
    photo: profile.photo || '',
    course: profile.course || '',
    announceAt: new Date().toISOString(),
    arrive: info.arrive.toISOString(),
    inMinutes: info.inMinutes,
    exact: info.exact,
    label: info.label,
  };
  db.announcements.push(announcement);
  await save();
  sendPushToEmails(friendsOfEmail(email), name, `Vai comer no RU ${info.label}`);
  res.json(announcement);
});

app.put('/api/announce/:id', requireAuth, async (req, res) => {
  const email = req.user.email;
  const idx = db.announcements.findIndex((a) => a.id === req.params.id && a.email === email);
  if (idx === -1) return res.status(404).json({ error: 'aviso não encontrado' });
  const info = arrivalInfo(req.body);
  if (!info) return res.status(400).json({ error: 'horário inválido' });
  const name = db.announcements[idx].name || req.user.name || nameFromEmail(email);
  db.announcements[idx] = {
    ...db.announcements[idx],
    arrive: info.arrive.toISOString(),
    inMinutes: info.inMinutes,
    exact: info.exact,
    label: info.label,
    updatedAt: new Date().toISOString(),
  };
  await save();
  sendPushToEmails(friendsOfEmail(email), name, `Atualizou o horário: vai comer no RU ${info.label}`);
  res.json(db.announcements[idx]);
});

app.post('/api/announce/:id/join', requireAuth, async (req, res) => {
  const ann = db.announcements.find((a) => a.id === req.params.id);
  if (!ann) return res.status(404).json({ error: 'aviso não encontrado' });
  if (new Date(ann.arrive).getTime() <= Date.now()) {
    return res.status(400).json({ error: 'esse aviso já passou' });
  }
  ann.joins = Array.isArray(ann.joins) ? ann.joins : [];
  const already = ann.joins.some((j) => j.email === req.user.email);
  if (!already && ann.email !== req.user.email) {
    const profile = profileOf(req.user.email, req.user.sub);
    ann.joins.push({
      email: req.user.email,
      name: req.user.name || profile.name || nameFromEmail(req.user.email),
      photo: profile.photo || '',
      course: profile.course || '',
      joinedAt: new Date().toISOString(),
    });
    await save();
    if (ann.email) {
      sendPushToEmails([ann.email], req.user.name || nameFromEmail(req.user.email), `Vai junto com você: ${ann.label}`);
    }
  }
  res.json(ann);
});

app.delete('/api/announce/:id/join', requireAuth, async (req, res) => {
  const ann = db.announcements.find((a) => a.id === req.params.id);
  if (!ann) return res.status(404).json({ error: 'aviso não encontrado' });
  ann.joins = Array.isArray(ann.joins) ? ann.joins : [];
  ann.joins = ann.joins.filter((j) => j.email !== req.user.email);
  await save();
  res.json(ann);
});

app.get('/api/menu', (req, res) => {
  const menus = (db.menus || []).slice(-40).sort((a, b) => b.date.localeCompare(a.date));
  res.json(menus);
});

app.post('/api/menu', requireAuth, (req, res, next) => {
  if (req.user.email !== MENU_EDITOR_EMAIL) {
    return res.status(403).json({ error: 'só o editor do cardápio pode alterar' });
  }
  next();
}, async (req, res) => {
  const email = req.user.email;
  const meal = String(req.body.meal || '');
  if (!['almoço', 'jantar'].includes(meal)) return res.status(400).json({ error: 'refeição inválida' });
  const date = String(req.body.date || '');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return res.status(400).json({ error: 'data inválida' });
  const items = Array.isArray(req.body.items)
    ? req.body.items
        .map((i) => ({
          text: String(i.text || '').trim().slice(0, 80),
          veg: !!i.veg,
          lactose: !!i.lactose,
          aviso: !!i.aviso,
        }))
        .filter((i) => i.text)
    : [];
  if (!items.length) return res.status(400).json({ error: 'cardápio vazio' });
  const dateLabel = String(req.body.dateLabel || date).trim().slice(0, 60);
  db.menus = (db.menus || []).filter((m) => !(m.meal === meal && m.date === date));
  const menu = {
    id: crypto.randomUUID(),
    meal,
    date,
    dateLabel,
    items,
    addedBy: email,
    addedAt: new Date().toISOString(),
  };
  db.menus.push(menu);
  await save();
  sendPush('🍽️ Cardápio atualizado', `${meal === 'jantar' ? 'Jantar' : 'Almoço'} — ${dateLabel}`);
  res.json(menu);
});

app.post('/api/subscribe', async (req, res) => {
  const sub = req.body;
  if (!sub || !sub.endpoint) return res.status(400).json({ error: 'assinatura inválida' });
  const email = String(sub.email || '').trim().toLowerCase().slice(0, 80);
  const entry = { ...sub, email };
  const i = db.subscriptions.findIndex((s) => s.endpoint === sub.endpoint);
  if (i === -1) db.subscriptions.push(entry);
  else db.subscriptions[i] = entry;
  await save();
  res.json({ ok: true });
});

app.get('/api/vapid', (req, res) => {
  res.json({ publicKey: vapid.publicKey });
});

app.get('/api/config', (req, res) => {
  res.json({ googleClientId: GOOGLE_CLIENT_ID });
});

app.post('/api/auth/google', async (req, res) => {
  const credential = String(req.body.credential || '');
  if (!GOOGLE_CLIENT_ID || !credential) {
    return res.status(400).json({ error: 'credencial inválida' });
  }
  let user;
  try {
    user = await verifyGoogleCredential(credential);
  } catch (err) {
    return res.status(401).json({ error: 'a verificação do Google falhou' });
  }
  if (!user) return res.status(401).json({ error: 'use sua conta @aluno.ufop.edu.br' });
  const legacy = db.users[user.sub] || {};
  const existing = profileOf(user.email, user.sub);
  db.users[user.email] = {
    sub: user.sub,
    email: user.email,
    name: user.name,
    photo: user.photo || existing.photo || legacy.photo || '',
    course: existing.course || legacy.course || '',
    friends: Array.isArray(existing.friends) ? existing.friends : [],
    incoming: Array.isArray(existing.incoming) ? existing.incoming : [],
    outgoing: Array.isArray(existing.outgoing) ? existing.outgoing : [],
    updatedAt: new Date().toISOString(),
  };
  if (db.users[user.sub] && user.sub !== user.email) delete db.users[user.sub];
  await save();
  res.json({
    token: signSession(user),
    email: user.email,
    name: user.name,
    photo: db.users[user.email].photo,
    course: db.users[user.email].course,
    needsCourse: !db.users[user.email].course,
  });
});

app.get('/api/me', requireAuth, (req, res) => {
  const u = profileOf(req.user.email, req.user.sub);
  res.json({ email: u.email || req.user.email, name: u.name || req.user.name, photo: u.photo || '', course: u.course || '' });
});

app.post('/api/me', requireAuth, async (req, res) => {
  const course = String(req.body.course || '').trim().slice(0, 80);
  if (!course) return res.status(400).json({ error: 'informe seu curso' });
  let photo = String(req.body.photo || '').trim().slice(0, 400000);
  if (photo && !photo.startsWith('data:image/')) photo = '';
  const u = ensureUser(req.user);
  db.users[req.user.email] = {
    sub: req.user.sub,
    email: req.user.email,
    name: req.user.name,
    photo: photo || u.photo || '',
    course,
    friends: u.friends,
    incoming: u.incoming,
    outgoing: u.outgoing,
    updatedAt: new Date().toISOString(),
  };
  await save();
  res.json(db.users[req.user.email]);
});

app.get('/api/users', requireAuth, (req, res) => {
  const q = String(req.query.q || '').trim().toLowerCase().slice(0, 80);
  if (!q) return res.json([]);
  const me = ensureUser(req.user);
  const out = [];
  for (const email of Object.keys(db.users)) {
    if (email === req.user.email) continue;
    const u = db.users[email];
    const name = String(u.name || '').toLowerCase();
    if (!email.includes(q) && !name.includes(q)) continue;
    out.push({ email, name: u.name || '', photo: u.photo || '', course: u.course || '', state: relation(email, me) });
    if (out.length >= 10) break;
  }
  res.json(out);
});

app.get('/api/friends', requireAuth, (req, res) => {
  const me = ensureUser(req.user);
  res.json({
    friends: me.friends.map(friendProfile),
    incoming: me.incoming.map((e) => ({ ...friendProfile(e), state: 'incoming' })),
    outgoing: me.outgoing.map((e) => ({ ...friendProfile(e), state: 'outgoing' })),
  });
});

app.post('/api/friends', requireAuth, async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  if (!EMAIL_RE.test(email)) return res.status(400).json({ error: 'e-mail UFOP inválido' });
  if (email === req.user.email) return res.status(400).json({ error: 'você não pode se adicionar' });
  const me = ensureUser(req.user);
  const target = db.users[email];
  if (!target) return res.status(404).json({ error: 'usuário não encontrado. Peça para ele entrar no app primeiro.' });
  if (me.friends.includes(email)) return res.json({ ok: true, state: 'friend' });
  if (me.outgoing.includes(email)) return res.json({ ok: true, state: 'outgoing' });
  if (me.incoming.includes(email)) {
    me.incoming = me.incoming.filter((e) => e !== email);
    if (!me.friends.includes(email)) me.friends.push(email);
    target.outgoing = target.outgoing.filter((e) => e !== me.email);
    if (!target.friends.includes(me.email)) target.friends.push(me.email);
    await save();
    sendPushToEmails([email], req.user.name || nameFromEmail(req.user.email), 'aceitou seu pedido de amizade');
    return res.json({ ok: true, state: 'friend' });
  }
  me.outgoing.push(email);
  if (!target.incoming.includes(me.email)) target.incoming.push(me.email);
  await save();
  sendPushToEmails([email], req.user.name || nameFromEmail(req.user.email), 'te mandou um pedido de amizade');
  res.json({ ok: true, state: 'outgoing' });
});

app.post('/api/friends/accept', requireAuth, async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const me = ensureUser(req.user);
  if (!me.incoming.includes(email)) return res.status(404).json({ error: 'pedido não encontrado' });
  const target = db.users[email];
  if (!target) return res.status(404).json({ error: 'usuário não encontrado' });
  me.incoming = me.incoming.filter((e) => e !== email);
  if (!me.friends.includes(email)) me.friends.push(email);
  target.outgoing = target.outgoing.filter((e) => e !== me.email);
  if (!target.friends.includes(me.email)) target.friends.push(me.email);
  await save();
  sendPushToEmails([email], req.user.name || nameFromEmail(req.user.email), 'aceitou seu pedido de amizade');
  res.json({ ok: true, state: 'friend' });
});

app.post('/api/friends/decline', requireAuth, async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const me = ensureUser(req.user);
  me.incoming = me.incoming.filter((e) => e !== email);
  const target = db.users[email];
  if (target) target.outgoing = target.outgoing.filter((e) => e !== me.email);
  await save();
  res.json({ ok: true });
});

app.delete('/api/friends/:email', requireAuth, async (req, res) => {
  const email = String(req.params.email || '').trim().toLowerCase();
  const me = ensureUser(req.user);
  me.friends = me.friends.filter((e) => e !== email);
  me.incoming = me.incoming.filter((e) => e !== email);
  me.outgoing = me.outgoing.filter((e) => e !== email);
  const target = db.users[email];
  if (target) {
    target.friends = target.friends.filter((e) => e !== me.email);
    target.incoming = target.incoming.filter((e) => e !== me.email);
    target.outgoing = target.outgoing.filter((e) => e !== me.email);
  }
  await save();
  res.json({ ok: true });
});

loadData().then(() => {
  app.listen(PORT, () => {
    console.log(`RU UFOP rodando na porta ${PORT}`);
    if (redis) {
      console.log('persistência: Upstash Redis');
    } else {
      console.log(`persistência: arquivo local em ${DATA_FILE}`);
      if (process.env.RENDER && !process.env.DATA_DIR) {
        console.error('\nAVISO: você está no Render sem persistência permanente!');
        console.error('data.json (perfis, amigos, cardápios e avisos) some a cada restart/deploy.');
        console.error('Resolva com uma das opções:');
        console.error('  1) Disco persistente do Render + variável de ambiente DATA_DIR=/data');
        console.error('  2) Upstash Redis (UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN)\n');
      }
    }
  });
});
