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
const DATA_FILE = path.join(__dirname, 'data.json');
const VAPID_FILE = path.join(__dirname, '.vapid.json');
const SECRET_FILE = path.join(__dirname, '.session-secret');
const SESSION_DAYS = 30;

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const MENU_EDITOR_EMAIL = (process.env.MENU_EDITOR_EMAIL || 'carlos.rodriguez@aluno.ufop.edu.br').toLowerCase();
const googleClient = GOOGLE_CLIENT_ID ? new OAuth2Client(GOOGLE_CLIENT_ID) : null;
const MAX_AGE = 24 * 60 * 60 * 1000;
const REDIS_KEY = 'ru:data';

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

async function loadData() {
  if (redis) {
    try {
      const data = await redis.get(REDIS_KEY);
      if (data) db = typeof data === 'string' ? JSON.parse(data) : data;
    } catch (err) {
      console.error('erro ao ler do Redis:', err.message);
    }
    return;
  }
  try {
    db = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  } catch {
    db = { announcements: [], menus: [], subscriptions: [], users: {} };
  }
  if (!db.users) db.users = {};
}

async function save() {
  try {
    if (redis) {
      await redis.set(REDIS_KEY, db);
    } else {
      fs.writeFileSync(DATA_FILE, JSON.stringify(db));
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

function sendPush(title, body) {
  const payload = JSON.stringify({ title, body });
  const dead = [];
  const jobs = db.subscriptions.map((sub) =>
    webpush
      .sendNotification(sub, payload)
      .catch((err) => {
        if (err.statusCode === 404 || err.statusCode === 410) dead.push(sub);
      })
  );
  Promise.all(jobs).then(async () => {
    if (dead.length) {
      db.subscriptions = db.subscriptions.filter((s) => !dead.includes(s));
      await save();
    }
  });
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

app.get('/api/announcements', (req, res) => {
  const now = Date.now();
  const list = db.announcements.filter((a) => new Date(a.arrive).getTime() > now - MAX_AGE);
  res.json(list);
});

app.post('/api/announce', requireAuth, async (req, res) => {
  const email = req.user.email;
  const info = arrivalInfo(req.body);
  if (!info) return res.status(400).json({ error: 'horário inválido' });
  const userId = req.user.sub;
  const now = Date.now();
  db.announcements = db.announcements.filter(
    (a) =>
      new Date(a.arrive).getTime() > now - MAX_AGE &&
      (a.userId !== userId || new Date(a.arrive).getTime() <= now)
  );
  const name = req.user.name || nameFromEmail(email);
  const profile = db.users[userId] || {};
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
  sendPush(name, `Vai comer no RU ${info.label}`);
  res.json(announcement);
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
  if (!db.subscriptions.some((s) => s.endpoint === sub.endpoint)) {
    db.subscriptions.push(sub);
    await save();
  }
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
  const existing = db.users[user.sub] || {};
  db.users[user.sub] = {
    sub: user.sub,
    email: user.email,
    name: user.name,
    photo: user.photo || existing.photo || '',
    course: existing.course || '',
    updatedAt: new Date().toISOString(),
  };
  await save();
  res.json({
    token: signSession(user),
    email: user.email,
    name: user.name,
    photo: db.users[user.sub].photo,
    course: db.users[user.sub].course,
    needsCourse: !db.users[user.sub].course,
  });
});

app.get('/api/me', requireAuth, (req, res) => {
  const u = db.users[req.user.sub] || { sub: req.user.sub, email: req.user.email, name: req.user.name, photo: '', course: '' };
  res.json({ email: u.email, name: u.name, photo: u.photo || '', course: u.course || '' });
});

app.post('/api/me', requireAuth, async (req, res) => {
  const course = String(req.body.course || '').trim().slice(0, 80);
  if (!course) return res.status(400).json({ error: 'informe seu curso' });
  const u = db.users[req.user.sub] || {};
  db.users[req.user.sub] = {
    sub: req.user.sub,
    email: req.user.email,
    name: req.user.name,
    photo: u.photo || '',
    course,
    updatedAt: new Date().toISOString(),
  };
  await save();
  res.json(db.users[req.user.sub]);
});

loadData().then(() => {
  app.listen(PORT, () => {
    console.log(`RU UFOP rodando na porta ${PORT}`);
    if (redis) console.log('persistência: Upstash Redis');
  });
});
