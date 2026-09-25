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
  html = html.replace('/logo_app.png?v=4', `/logo_app.png?v=${assetVersion('logo_app.png')}`);
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

let db = { announcements: [], menus: [], subscriptions: [], users: {}, groups: [] };

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
  if (!Array.isArray(db.groups)) db.groups = [];
  else db.groups = db.groups.filter((g) => g && typeof g === 'object' && g.id && g.name);
  for (const g of db.groups) {
    g.members = Array.isArray(g.members)
      ? g.members.map((m) => String(m).trim().toLowerCase()).filter(Boolean)
      : [];
    g.owner = String(g.owner || '').trim().toLowerCase();
    g.code = String(g.code || '').trim().toUpperCase();
    if (g.owner && !g.members.includes(g.owner)) g.members.push(g.owner);
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
    db = { announcements: [], menus: [], subscriptions: [], users: {}, groups: [] };
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

function isValidVapidKeys(publicKey, privateKey) {
  try {
    const pub = Buffer.from(String(publicKey).trim(), 'base64url');
    const priv = Buffer.from(String(privateKey).trim(), 'base64url');
    return pub.length === 65 && priv.length === 32;
  } catch {
    return false;
  }
}

const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'https://ru-ufop.onrender.com';

function loadVapid() {
  if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY &&
      isValidVapidKeys(process.env.VAPID_PUBLIC_KEY, process.env.VAPID_PRIVATE_KEY)) {
    return {
      subject: VAPID_SUBJECT,
      publicKey: process.env.VAPID_PUBLIC_KEY,
      privateKey: process.env.VAPID_PRIVATE_KEY,
      envKeys: true,
    };
  }
  if (process.env.VAPID_PUBLIC_KEY && !isValidVapidKeys(process.env.VAPID_PUBLIC_KEY, process.env.VAPID_PRIVATE_KEY)) {
    console.error('VAPID_PUBLIC_KEY/VAPID_PRIVATE_KEY inválidas no ambiente; usando chaves geradas no servidor.');
  }
  try {
    const saved = JSON.parse(fs.readFileSync(VAPID_FILE, 'utf8'));
    return {
      subject: VAPID_SUBJECT,
      publicKey: saved.publicKey,
      privateKey: saved.privateKey,
      envKeys: false,
    };
  } catch {
    const keys = webpush.generateVAPIDKeys();
    const config = {
      subject: VAPID_SUBJECT,
      publicKey: keys.publicKey,
      privateKey: keys.privateKey,
      envKeys: false,
    };
    fs.writeFileSync(VAPID_FILE, JSON.stringify(config));
    return config;
  }
}

const vapid = loadVapid();
webpush.setVapidDetails(vapid.subject, vapid.publicKey, vapid.privateKey);

const APP_HOST = process.env.APP_HOST || 'ru-ufop.onrender.com';
let externalHost = APP_HOST;
app.use((req, _res, next) => {
  if (!process.env.APP_HOST && req.hostname) {
    const h = req.hostname;
    if (h && h !== 'localhost' && !/^\d+\.\d+\.\d+\.\d+$/.test(h)) externalHost = h;
  }
  next();
});

function pushOptionsFor(endpoint) {
  if (!String(endpoint).includes('web.push.apple.com')) return {};
  return {
    headers: {
      'apns-topic': 'web.' + externalHost,
      'apns-push-type': 'alert',
      'apns-priority': '10',
    },
  };
}

function pushHost(endpoint) {
  const e = String(endpoint || '');
  if (e.includes('web.push.apple.com')) return 'apple';
  if (e.includes('fcm.googleapis.com')) return 'fcm';
  if (e.includes('push.mozilla.org')) return 'mozilla';
  return '?';
}

function pushReason(err) {
  let reason = '';
  try { reason = JSON.parse(err.body || '').reason || ''; } catch {}
  return reason;
}

function sendNotifications(subs, payload) {
  const dead = [];
  const broken = [];
  const jobs = subs.map((sub) => {
    if (!sub || !sub.endpoint || !sub.keys || !sub.keys.p256dh || !sub.keys.auth) {
      broken.push(sub);
      return Promise.resolve();
    }
    return webpush
      .sendNotification(sub, payload, pushOptionsFor(sub.endpoint))
      .catch((err) => {
        if (err.statusCode === 404 || err.statusCode === 410) dead.push(sub);
        else {
          const reason = pushReason(err);
          console.error(`push[${err.statusCode || '?'} ${pushHost(sub.endpoint)}]:`, reason ? `${reason} — ` : '', String(err.message || err).slice(0, 200));
        }
      });
  });
  Promise.all(jobs).then(async () => {
    const remove = new Set([...dead, ...broken].filter(Boolean).map((s) => String(s.endpoint)));
    if (remove.size) {
      db.subscriptions = db.subscriptions.filter((s) => !remove.has(String(s.endpoint)));
      await save();
    }
  });
}

const PUSH_TEXT = {
  going: { pt: 'Vai comer no RU {label}{group}', en: 'Going to the RU {label}{group}' },
  updated: { pt: 'Atualizou o horário: vai comer no RU {label}', en: 'Updated the time: going to the RU {label}' },
  joinsYou: { pt: 'Vai junto com você: {label}', en: 'Joining you: {label}' },
  arrived: { pt: 'chegou ao RU! {label}', en: 'arrived at the RU! {label}' },
  friendAccept: { pt: 'aceitou seu pedido de amizade', en: 'accepted your friend request' },
  friendRequest: { pt: 'te mandou um pedido de amizade', en: 'sent you a friend request' },
  groupJoin: { pt: 'entrou no grupo {group}', en: 'joined the group {group}' },
  menuTitle: { pt: '🍽️ Cardápio atualizado', en: '🍽️ Menu updated' },
};

function pushFill(s, params) {
  for (const k of Object.keys(params || {})) s = s.split('{' + k + '}').join(String(params[k]));
  return s;
}

function subLang(sub) {
  return String((sub && sub.lang) || '').toLowerCase() === 'en' ? 'en' : 'pt';
}

function sendPushToEmails(emails, who, key, args) {
  const set = new Set((emails || []).map((e) => String(e).trim().toLowerCase()));
  const subs = db.subscriptions.filter((s) => set.has(s.email));
  if (!subs.length) return;
  const byLang = { pt: [], en: [] };
  for (const s of subs) byLang[subLang(s)].push(s);
  for (const l of ['pt', 'en']) {
    if (!byLang[l].length) continue;
    const body = pushFill(PUSH_TEXT[key][l] || '', args);
    sendNotifications(byLang[l], JSON.stringify({ title: who, body }));
  }
}

function sendPushMenu(meal, dateLabel) {
  const byLang = { pt: [], en: [] };
  for (const s of db.subscriptions) byLang[subLang(s)].push(s);
  const mealName = (l) => (l === 'en' ? (meal === 'jantar' ? 'Dinner' : 'Lunch') : meal === 'jantar' ? 'Jantar' : 'Almoço');
  for (const l of ['pt', 'en']) {
    if (!byLang[l].length) continue;
    sendNotifications(byLang[l], JSON.stringify({ title: PUSH_TEXT.menuTitle[l], body: `${mealName(l)} — ${dateLabel}` }));
  }
}

function friendsOfEmail(email) {
  const u = db.users[email];
  return u && Array.isArray(u.friends) ? u.friends : [];
}

function groupById(id) {
  return (db.groups || []).find((g) => g.id === id);
}

function groupMemberEmails(gid) {
  const g = groupById(gid);
  return g && Array.isArray(g.members) ? g.members : [];
}

function publicGroup(g, viewerEmail) {
  const canSeeCode = viewerEmail && g.owner === viewerEmail;
  return {
    id: g.id,
    name: g.name,
    description: g.description || '',
    owner: g.owner,
    code: canSeeCode ? g.code : '',
    memberCount: g.members.length,
    createdAt: g.createdAt,
  };
}

function groupView(g, viewerEmail) {
  const view = publicGroup(g, viewerEmail);
  if (g.owner === viewerEmail) {
    view.members = g.members.map((email) => {
      const u = db.users[email] || {};
      return {
        email,
        name: u.name || nameFromEmail(email),
        photo: u.photo || '',
        course: u.course || '',
        isOwner: email === g.owner,
      };
    });
  }
  return view;
}

function groupCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  do {
    code = '';
    for (let i = 0; i < 6; i++) code += chars[crypto.randomInt(chars.length)];
  } while ((db.groups || []).some((g) => g.code === code));
  return code;
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

function tzParts(date) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: APP_TZ,
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(date);
  const p = {};
  for (const part of parts) p[part.type] = part.value;
  if (p.hour === '24') p.hour = '00';
  return p;
}

const OPEN_WINDOWS = [
  { start: 10 * 60 + 30, end: 13 * 60 + 30 },
  { start: 18 * 60, end: 19 * 60 + 30 },
];
const WEEKDAY = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

function arrivalInfo(body) {
  const arrive = new Date(body.arrive);
  if (isNaN(arrive.getTime())) return null;
  const p = tzParts(arrive);
  const week = WEEKDAY[p.weekday];
  if (week < 1 || week > 5) return null;
  const minutes = +p.hour * 60 + +p.minute;
  if (!OPEN_WINDOWS.some((w) => minutes >= w.start && minutes <= w.end)) return null;
  const inMinutes = Math.max(1, Math.round((arrive.getTime() - Date.now()) / 60000));
  const label = String(body.label || '').trim().slice(0, 40);
  return {
    arrive,
    inMinutes,
    exact: body.when !== 'in',
    label: label || `em ${inMinutes} min`,
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
  if (req.query.scope === 'group') {
    if (!req.user) return res.status(401).json({ error: 'faça login com a conta UFOP' });
    const g = groupById(String(req.query.groupId || ''));
    if (!g || !g.members.includes(req.user.email)) {
      return res.status(403).json({ error: 'grupo não encontrado' });
    }
    list = list.filter((a) => a.groupId === g.id);
  } else {
    list = list.filter((a) => !a.groupId);
    if (req.query.scope === 'friends') {
      if (!req.user) return res.status(401).json({ error: 'faça login com a conta UFOP' });
      const me = ensureUser(req.user);
      const allowed = new Set(me.friends);
      list = list.filter((a) => a.email && allowed.has(a.email));
    } else if (req.query.scope === 'me') {
      if (!req.user) return res.status(401).json({ error: 'faça login com a conta UFOP' });
      list = list.filter((a) => a.email === req.user.email);
    }
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
  const groupId = String(req.body.groupId || '').trim();
  let groupName = '';
  if (groupId) {
    const g = groupById(groupId);
    if (!g || !g.members.includes(email)) {
      return res.status(403).json({ error: 'você não pertence a esse grupo' });
    }
    groupName = g.name;
  }
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
    groupId: groupId || '',
    groupName: groupName || '',
  };
  db.announcements.push(announcement);
  await save();
  const pushEmails = groupId
    ? groupMemberEmails(groupId).filter((e) => e && e !== email)
    : friendsOfEmail(email);
  if (pushEmails.length) {
    sendPushToEmails(pushEmails, name, 'going', { label: info.label, group: groupName ? ` (${groupName})` : '' });
  }
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
  sendPushToEmails(friendsOfEmail(email), name, 'updated', { label: info.label });
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
      sendPushToEmails([ann.email], req.user.name || nameFromEmail(req.user.email), 'joinsYou', { label: ann.label });
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

app.post('/api/announce/:id/arrived', requireAuth, async (req, res) => {
  const ann = db.announcements.find((a) => a.id === req.params.id);
  if (!ann) return res.status(404).json({ error: 'aviso não encontrado' });
  if (new Date(ann.arrive).getTime() <= Date.now()) {
    return res.status(400).json({ error: 'esse aviso já passou' });
  }
  const email = req.user.email;
  const isAuthor = ann.email === email;
  const isJoiner = (ann.joins || []).some((j) => j.email === email);
  if (!isAuthor && !isJoiner) {
    return res.status(403).json({ error: 'você precisa anunciar ou marcar "vou junto" nesse aviso' });
  }
  ann.arrived = Array.isArray(ann.arrived) ? ann.arrived : [];
  if (!ann.arrived.includes(email)) ann.arrived.push(email);
  await save();
  const going = new Set(
    [ann.email, ...(ann.joins || []).map((j) => j.email)]
      .filter(Boolean)
      .map((e) => String(e).trim().toLowerCase())
  );
  going.delete(email);
  const name = req.user.name || nameFromEmail(email);
  if (going.size) sendPushToEmails([...going], name, 'arrived', { label: ann.label });
  res.json({ ok: true, arrived: ann.arrived });
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
        .map((i) => {
          const type = String(i.type || '');
          const mark = Number(i.mark);
          return {
            text: String(i.text || '').trim().slice(0, 80),
            veg: !!i.veg,
            lactose: !!i.lactose,
            aviso: !!i.aviso || (Number.isFinite(mark) && mark >= 1),
            type: ['', 'ref1', 'ref2', 'aviso', 'veg'].includes(type) ? type : '',
            mark: Number.isFinite(mark) && mark >= 0 && mark <= 9 ? Math.floor(mark) : 0,
          };
        })
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
  sendPushMenu(meal, dateLabel);
  res.json(menu);
});

app.post('/api/subscribe', async (req, res) => {
  const sub = req.body;
  if (!sub || !sub.endpoint) return res.status(400).json({ error: 'assinatura inválida' });
  const email = String(sub.email || '').trim().toLowerCase().slice(0, 80);
  const lang = String(sub.lang || '').toLowerCase() === 'en' ? 'en' : 'pt';
  const entry = { ...sub, email, lang };
  const i = db.subscriptions.findIndex((s) => s.endpoint === sub.endpoint);
  if (i === -1) db.subscriptions.push(entry);
  else db.subscriptions[i] = entry;
  await save();
  res.json({ ok: true });
});

app.get('/api/vapid', (req, res) => {
  const envHasKeys = !!(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY);
  res.json({
    publicKey: vapid.publicKey,
    envKeys: !!vapid.envKeys,
    envInvalid: envHasKeys && !vapid.envKeys,
  });
});

app.post('/api/test-push', requireAuth, async (req, res) => {
  const mine = db.subscriptions.filter((s) => s.email === req.user.email);
  const results = [];
  for (const sub of mine) {
    if (!sub.keys || !sub.keys.p256dh || !sub.keys.auth) {
      results.push({ ok: false, code: 'no-keys', message: 'inscrição sem chaves (toque em Ativar para recriar)' });
      db.subscriptions = db.subscriptions.filter((s) => s.endpoint !== sub.endpoint);
      continue;
    }
    try {
      const body = subLang(sub) === 'en' ? 'Your notifications are working!' : 'Suas notificações estão funcionando!';
      await webpush.sendNotification(sub, JSON.stringify({ title: '🔔 RU UFOP', body }), pushOptionsFor(sub.endpoint));
      results.push({ ok: true, code: 201 });
    } catch (err) {
      results.push({ ok: false, code: err.statusCode || 500, message: String(err.message || err).slice(0, 200), reason: pushReason(err) });
    }
  }
  await save();
  const byHost = {};
  for (const s of mine) {
    const h = pushHost(s.endpoint);
    byHost[h] = (byHost[h] || 0) + 1;
  }
  res.json({
    total: results.length,
    ok: results.filter((r) => r.ok).length,
    fail: results.filter((r) => !r.ok).length,
    errorCodes: results.filter((r) => !r.ok).map((r) => r.code),
    reasons: results.filter((r) => r.reason).map((r) => r.reason),
    errors: results.filter((r) => !r.ok).map((r) => r.message),
    byHost,
    vapidPublicKey: vapid.publicKey,
    vapidSubject: vapid.subject,
    orphans: db.subscriptions.filter((s) => !s.email).length,
  });
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
    sendPushToEmails([email], req.user.name || nameFromEmail(req.user.email), 'friendAccept');
    return res.json({ ok: true, state: 'friend' });
  }
  me.outgoing.push(email);
  if (!target.incoming.includes(me.email)) target.incoming.push(me.email);
  await save();
  sendPushToEmails([email], req.user.name || nameFromEmail(req.user.email), 'friendRequest');
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
  sendPushToEmails([email], req.user.name || nameFromEmail(req.user.email), 'friendAccept');
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

app.get('/api/groups', requireAuth, (req, res) => {
  const mine = (db.groups || [])
    .filter((g) => g.members.includes(req.user.email))
    .map((g) => groupView(g, req.user.email));
  res.json(mine);
});

app.post('/api/groups', requireAuth, async (req, res) => {
  const name = String(req.body.name || '').trim().slice(0, 60);
  if (!name) return res.status(400).json({ error: 'dê um nome ao grupo' });
  const description = String(req.body.description || '').trim().slice(0, 200);
  const group = {
    id: crypto.randomUUID(),
    name,
    description,
    owner: req.user.email,
    members: [req.user.email],
    code: groupCode(),
    createdAt: new Date().toISOString(),
  };
  db.groups = db.groups || [];
  db.groups.push(group);
  await save();
  res.json(publicGroup(group, req.user.email));
});

app.post('/api/groups/join', requireAuth, async (req, res) => {
  const code = String(req.body.code || '').trim().toUpperCase();
  const g = (db.groups || []).find((x) => x.code === code);
  if (!g) return res.status(404).json({ error: 'código inválido' });
  if (g.members.includes(req.user.email)) return res.json(publicGroup(g, req.user.email));
  g.members.push(req.user.email);
  await save();
  sendPushToEmails([g.owner], req.user.name || nameFromEmail(req.user.email), 'groupJoin', { group: g.name });
  res.json(publicGroup(g, req.user.email));
});

app.post('/api/groups/:id/kick', requireAuth, async (req, res) => {
  const g = groupById(req.params.id);
  if (!g) return res.status(404).json({ error: 'grupo não encontrado' });
  if (g.owner !== req.user.email) {
    return res.status(403).json({ error: 'só o criador do grupo pode remover membros' });
  }
  const email = String(req.body.email || '').trim().toLowerCase();
  if (!g.members.includes(email)) {
    return res.status(404).json({ error: 'membro não encontrado' });
  }
  if (email === g.owner) {
    return res.status(400).json({ error: 'o criador não pode ser removido' });
  }
  g.members = g.members.filter((e) => e !== email);
  db.announcements = db.announcements.filter((a) => !(a.groupId === g.id && a.email === email));
  await save();
  res.json(groupView(g, req.user.email));
});

app.post('/api/groups/:id/leave', requireAuth, async (req, res) => {
  const g = groupById(req.params.id);
  if (!g) return res.status(404).json({ error: 'grupo não encontrado' });
  if (!g.members.includes(req.user.email)) {
    return res.status(403).json({ error: 'você não é membro desse grupo' });
  }
  g.members = g.members.filter((e) => e !== req.user.email);
  db.announcements = db.announcements.filter((a) => !(a.groupId === g.id && a.email === req.user.email));
  await save();
  if (!g.members.length) {
    db.groups = db.groups.filter((x) => x.id !== g.id);
    db.announcements = db.announcements.filter((a) => a.groupId !== g.id);
    await save();
  }
  res.json({ ok: true });
});

app.delete('/api/groups/:id', requireAuth, async (req, res) => {
  const g = groupById(req.params.id);
  if (!g) return res.status(404).json({ error: 'grupo não encontrado' });
  if (g.owner !== req.user.email) {
    return res.status(403).json({ error: 'só o criador do grupo pode excluir' });
  }
  db.groups = db.groups.filter((x) => x.id !== g.id);
  db.announcements = db.announcements.filter((a) => a.groupId !== g.id);
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
