const express = require('express');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const webpush = require('web-push');

const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data.json');
const VAPID_FILE = path.join(__dirname, '.vapid.json');
const MAX_AGE = 24 * 60 * 60 * 1000;
const REDIS_KEY = 'ru:data';

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

let redis = null;
if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  const { Redis } = require('@upstash/redis');
  redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
}

let db = { announcements: [], subscriptions: [] };

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
    db = { announcements: [], subscriptions: [] };
  }
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

app.post('/api/announce', async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase().slice(0, 80);
  if (!EMAIL_RE.test(email)) return res.status(400).json({ error: 'e-mail UFOP inválido' });
  const info = arrivalInfo(req.body);
  if (!info) return res.status(400).json({ error: 'horário inválido' });
  const userId = String(req.body.userId || '');
  const now = Date.now();
  db.announcements = db.announcements.filter(
    (a) =>
      new Date(a.arrive).getTime() > now - MAX_AGE &&
      (a.userId !== userId || new Date(a.arrive).getTime() <= now)
  );
  const name = nameFromEmail(email);
  const announcement = {
    id: crypto.randomUUID(),
    userId,
    email,
    name,
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

loadData().then(() => {
  app.listen(PORT, () => {
    console.log(`RU UFOP rodando na porta ${PORT}`);
    if (redis) console.log('persistência: Upstash Redis');
  });
});
