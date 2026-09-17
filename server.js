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

function fmtTime(date) {
  return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function arrivalInfo(body) {
  const now = Date.now();
  if (body.when === 'in') {
    const minutes = Math.min(Math.max(parseInt(body.minutes, 10) || 30, 1), 1440);
    return {
      arrive: new Date(now + minutes * 60000),
      inMinutes: minutes,
      exact: false,
      label: `em ${minutes} min`,
    };
  }
  const parts = String(body.time || '12:00').split(':').map(Number);
  const date = new Date();
  date.setHours(parts[0] || 12, parts[1] || 0, 0, 0);
  if (date.getTime() < now) date.setDate(date.getDate() + 1);
  return {
    arrive: date,
    inMinutes: Math.round((date.getTime() - now) / 60000),
    exact: true,
    label: `às ${fmtTime(date)}`,
  };
}

app.get('/api/announcements', (req, res) => {
  const now = Date.now();
  const list = db.announcements.filter((a) => new Date(a.arrive).getTime() > now - MAX_AGE);
  res.json(list);
});

app.post('/api/announce', async (req, res) => {
  const name = String(req.body.name || '').trim().slice(0, 40);
  if (!name) return res.status(400).json({ error: 'nome obrigatório' });
  const userId = String(req.body.userId || '');
  const info = arrivalInfo(req.body);
  const now = Date.now();
  db.announcements = db.announcements.filter(
    (a) =>
      new Date(a.arrive).getTime() > now - MAX_AGE &&
      (a.userId !== userId || new Date(a.arrive).getTime() <= now)
  );
  const announcement = {
    id: crypto.randomUUID(),
    userId,
    name,
    announceAt: new Date().toISOString(),
    arrive: info.arrive.toISOString(),
    inMinutes: info.inMinutes,
    exact: info.exact,
    label: info.label,
  };
  db.announcements.push(announcement);
  await save();
  const body = info.exact
    ? `Vai comer no RU ${info.label} (${fmtTime(info.arrive)})`
    : `Vai comer no RU ${info.label}`;
  sendPush(name, body);
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
