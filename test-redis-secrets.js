// Regressao para o secret de sessao e as chaves VAPID: em hosting com disco
// efemero (Render free, Heroku, Cloud Run) o arquivo .session-secret e o
// .vapid.json somem a cada deploy, o secret novo invalida todos os cookies de
// sessao e todo mundo e deslogado. Aqui eles sao guardados no Redis.
//
// O teste sobe um stub do Upstash REST (POST /pipeline) e prova que:
//   1. o secret e as chaves nascem no Redis, e nao em arquivo no disco
//   2. um token emitido antes do restart continua valido depois
//   3. a publicKey do VAPID nao muda entre reinicios
//   4. se o Redis for apagado, o secret e as chaves mudam (comportamento atual)
const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');

const TEST_EMAIL = 'joao.teste@aluno.ufop.edu.br';
const TEST_NAME = 'Joao Teste';
const SECRET_KEY = 'ru:session-secret';
const VAPID_KEY = 'ru:vapid';
const DATA_KEY = 'ru:data';

const sandboxes = [];
let failures = 0;
function check(ok, msg, extra) {
  console.log((ok ? '  PASS  ' : '  FAIL  ') + msg + (extra ? ' :: ' + extra : ''));
  if (!ok) failures++;
}

function b64url(obj) {
  return Buffer.from(JSON.stringify(obj)).toString('base64url');
}

function forgeToken(secret, sub, email, name, days) {
  const body = b64url({
    sub,
    email,
    name,
    exp: Math.floor(Date.now() / 1000) + (days || 30) * 86400,
  });
  const sig = crypto.createHmac('sha256', secret).update(body).digest('base64url');
  return body + '.' + sig;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// --- stub do Upstash REST -------------------------------------------------
// O @upstash/redis 1.38 usa auto-pipelining: POST /pipeline com um array de
// comandos [["GET",k],["SET",k,v]] e responde [{result,error}].
//
// O gateway real devolve strings codificadas em base64, e o decode() do cliente
// (chunk-2JFYL2VL.mjs:307) faz base64decode em toda string, so escapando quando
// o atob falha. O stub reproduz isso de proposito: e mais estrito que precisar
// ser, e e o que garante que o teste pegue o caso de um secret de 64 hex (que e
// base64 valido) voltando corrompido em vez de silently errado.
function startStubRedis() {
  const store = new Map();
  const server = http.createServer((req, res) => {
    let raw = '';
    req.on('data', (d) => (raw += d));
    req.on('end', () => {
      let commands = [];
      if (req.url === '/pipeline') {
        try { commands = JSON.parse(raw || '[]'); } catch { commands = []; }
      } else {
        commands = [req.url.replace(/^\//, '').split('/').filter(Boolean)];
      }
      const out = commands.map((cmd) => {
        const name = String(cmd[0] || '').toUpperCase();
        if (name === 'GET') {
          if (!store.has(cmd[1])) return { result: null };
          const v = store.get(cmd[1]);
          if (typeof v !== 'string') return { result: v };
          return { result: v === 'OK' ? 'OK' : Buffer.from(v, 'utf8').toString('base64') };
        }
        if (name === 'SET') { store.set(cmd[1], cmd[2]); return { result: 'OK' }; }
        if (name === 'DEL') { const had = store.delete(cmd[1]); return { result: had ? 1 : 0 }; }
        if (name === 'EXPIRE' || name === 'PEXPIRE') return { result: 1 };
        if (name === 'PING') return { result: 'PONG' };
        return { error: 'stub: comando nao suportado: ' + name };
      });
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(out));
    });
  });
  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      resolve({ store, url: 'http://127.0.0.1:' + server.address().port, close: () => server.close() });
    });
  });
}

function copyRecursive(src, dst) {
  fs.mkdirSync(dst, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dst, entry.name);
    if (entry.isDirectory()) copyRecursive(s, d);
    else fs.copyFileSync(s, d);
  }
}

function buildSandbox() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ru-redis-'));
  fs.copyFileSync(path.join(__dirname, 'server.js'), path.join(dir, 'server.js'));
  copyRecursive(path.join(__dirname, 'public'), path.join(dir, 'public'));
  fs.symlinkSync(path.join(__dirname, 'node_modules'), path.join(dir, 'node_modules'), 'junction');
  return dir;
}

function startServer(dir, port, stubUrl) {
  // Herda o ambiente pero apaga as credenciais reais antes de apontar para o
  // stub: assim o teste nao alcanca o Redis de producao nunca, mesmo que o
  // .env do repo exista (o server so le .env de chaves ainda nao definidas).
  const env = { ...process.env, PORT: String(port), NODE_ENV: 'test' };
  delete env.UPSTASH_REDIS_REST_URL;
  delete env.UPSTASH_REDIS_REST_TOKEN;
  delete env.SESSION_SECRET;
  delete env.GOOGLE_CLIENT_ID;
  delete env.VAPID_PUBLIC_KEY;
  delete env.VAPID_PRIVATE_KEY;
  delete env.RENDER;
  env.UPSTASH_REDIS_REST_URL = stubUrl;
  env.UPSTASH_REDIS_REST_TOKEN = 'stub-token';
  const child = spawn(process.execPath, ['server.js'], {
    cwd: dir,
    env,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let logs = '';
  child.stdout.on('data', (d) => (logs += d));
  child.stderr.on('data', (d) => (logs += d));
  return { child, logs: () => logs };
}

function stopServer(p) {
  return new Promise((resolve) => {
    if (!p.child || p.child.exitCode !== null) return resolve();
    p.child.once('exit', resolve);
    p.child.kill();
    setTimeout(() => { try { p.child.kill('SIGKILL'); } catch {} }, 2000);
  });
}

async function waitForServer(base, ms) {
  const start = Date.now();
  while (Date.now() - start < (ms || 15000)) {
    try {
      const r = await fetch(base + '/api/config');
      if (r.ok) return;
    } catch {}
    await sleep(200);
  }
  throw new Error('el servidor no arranco en ' + base);
}

function getFreePort() {
  return new Promise((resolve) => {
    const net = require('net');
    const srv = net.createServer();
    srv.listen(0, '127.0.0.1', () => {
      const p = srv.address().port;
      srv.close(() => resolve(p));
    });
  });
}

function isHex64(s) {
  return typeof s === 'string' && /^[0-9a-f]{64}$/.test(s);
}

function b64Len65(s) {
  try { return Buffer.from(String(s).trim(), 'base64url').length === 65; } catch { return false; }
}

async function main() {
  const stub = await startStubRedis();
  const sandbox = buildSandbox();
  sandboxes.push(sandbox);

  const port = await getFreePort();
  const base = 'http://127.0.0.1:' + port;
  const secretFile = path.join(sandbox, '.session-secret');
  const vapidFile = path.join(sandbox, '.vapid.json');

  console.log('== BOOT 1: Redis vazio, o server tem que gerar e salvar as chaves ==');
  let server = startServer(sandbox, port, stub.url);
  await waitForServer(base);

  const rawSecret1 = stub.store.get(SECRET_KEY);
  const secret1 = rawSecret1 ? JSON.parse(rawSecret1).v : null;
  check(isHex64(secret1), '1. SESSION_SECRET foi criado no Redis (64 hex)', 'valor=' + (secret1 || '(ausente)'));
  check(rawSecret1 && !isHex64(rawSecret1),
    '2. o secret foi guardado envelopado em JSON, nao como hex cru (armadilha do base64)',
    'armazenado=' + (rawSecret1 || '(ausente)').slice(0, 24) + '...');

  const rawVapid1 = stub.store.get(VAPID_KEY);
  const vapid1 = rawVapid1 ? (typeof rawVapid1 === 'string' ? JSON.parse(rawVapid1) : rawVapid1) : null;
  check(!!vapid1 && b64Len65(vapid1.publicKey), '3. chaves VAPID foram criadas no Redis', 'publicKey=' + (vapid1 ? vapid1.publicKey : '(ausente)'));

  let r = await fetch(base + '/api/vapid');
  const served1 = await r.json();
  check(served1.publicKey === (vapid1 && vapid1.publicKey) && served1.envKeys === false,
    '4. /api/vapid serve a chave do Redis e segue envKeys=false', 'envKeys=' + served1.envKeys);

  check(!fs.existsSync(secretFile) && !fs.existsSync(vapidFile),
    '5. nenhum arquivo .session-secret/.vapid.json foi criado no disco',
    'secret=' + fs.existsSync(secretFile) + ' vapid=' + fs.existsSync(vapidFile));

  const token = forgeToken(secret1, 'sub-abc', TEST_EMAIL, TEST_NAME);
  r = await fetch(base + '/api/me', { headers: { Authorization: 'Bearer ' + token } });
  check(r.status === 200, '6. token assinado com o secret do Redis e aceito', 'status=' + r.status);

  await stopServer(server);
  await sleep(500);

  console.log('== BOOT 2: mesmo Redis, e o login tem que sobreviver (a regressao) ==');
  server = startServer(sandbox, port, stub.url);
  await waitForServer(base);

  const secret2 = JSON.parse(stub.store.get(SECRET_KEY)).v;
  check(secret2 === secret1, '7. o secret nao foi regenerado no restart', 'antes=' + secret1 + ' depois=' + secret2);

  r = await fetch(base + '/api/me', { headers: { Authorization: 'Bearer ' + token } });
  check(r.status === 200, '8. APOS REINICIO o MESMO token continua valido (ninguem deslogado)', 'status=' + r.status);

  r = await fetch(base + '/api/vapid');
  const served2 = await r.json();
  check(served2.publicKey === served1.publicKey, '9. a publicKey do VAPID nao mudou no restart',
    'antes=' + served1.publicKey + ' depois=' + served2.publicKey);

  await stopServer(server);
  await sleep(500);

  console.log('== BOOT 3: Redis apagado, o secret tem que mudar (o que acontece se perder a base) ==');
  stub.store.delete(SECRET_KEY);
  stub.store.delete(VAPID_KEY);
  server = startServer(sandbox, port, stub.url);
  await waitForServer(base);

  const secret3 = JSON.parse(stub.store.get(SECRET_KEY)).v;
  check(isHex64(secret3) && secret3 !== secret1, '10. Redis vazio gera um secret novo', 'novo=' + secret3);

  r = await fetch(base + '/api/vapid');
  const served3 = await r.json();
  check(served3.publicKey !== served1.publicKey, '11. Redis vazio gera chaves VAPID novas',
    'antes=' + served1.publicKey + ' depois=' + served3.publicKey);

  r = await fetch(base + '/api/me', { headers: { Authorization: 'Bearer ' + token } });
  check(r.status === 401, '12. com secret novo, o token antigo e rejeitado', 'status=' + r.status);

  await stopServer(server);

  console.log('');
  if (failures) {
    console.log('RESULTADO: ' + failures + ' cheque(s) FALLARAM');
    process.exitCode = 1;
  } else {
    console.log('RESULTADO: TODO OK.');
  }
  stub.close();
}

main().catch((err) => {
  console.error('ERRO no teste:', err.message);
  process.exitCode = 1;
}).finally(() => {
  for (const dir of sandboxes) {
    try { fs.rmSync(dir, { recursive: true, force: true }); } catch {}
  }
});
