const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');

const TEST_EMAIL = 'maria.teste@aluno.ufop.edu.br';
const TEST_NAME = 'Maria Teste';
const TEST_COURSE = 'Ciencia da Computacao';

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

function buildSandbox() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ru-persist-'));
  fs.copyFileSync(path.join(__dirname, 'server.js'), path.join(dir, 'server.js'));
  copyRecursive(path.join(__dirname, 'public'), path.join(dir, 'public'));
  fs.symlinkSync(path.join(__dirname, 'node_modules'), path.join(dir, 'node_modules'), 'junction');
  return dir;
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

function startServer(dir, port) {
  const env = { ...process.env, PORT: String(port), NODE_ENV: 'test' };
  delete env.UPSTASH_REDIS_REST_URL;
  delete env.UPSTASH_REDIS_REST_TOKEN;
  delete env.SESSION_SECRET;
  delete env.GOOGLE_CLIENT_ID;
  delete env.VAPID_PUBLIC_KEY;
  delete env.VAPID_PRIVATE_KEY;
  delete env.RENDER;
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

async function main() {
  const sandbox = buildSandbox();
  sandboxes.push(sandbox);
  const secret = crypto.randomBytes(32).toString('hex');
  fs.writeFileSync(path.join(sandbox, '.session-secret'), secret);

  const port = await getFreePort();
  const base = 'http://127.0.0.1:' + port;

  console.log('== usuario `' + TEST_EMAIL + '` com curso desconhecido ==');
  const token = forgeToken(secret, 'sub-123', TEST_EMAIL, TEST_NAME);

  let server = startServer(sandbox, port);
  await waitForServer(base);

  let r = await fetch(base + '/api/me', { headers: { Authorization: 'Bearer ' + token } });
  check(r.status === 200, '1. login valido responde 200 em /api/me', 'status=' + r.status);
  const me1 = await r.json();
  check(!me1.course, '2. sem curso registrado (logica "pedir curso")', 'course="' + (me1.course || '') + '"');

  r = await fetch(base + '/api/me', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
    body: JSON.stringify({ course: TEST_COURSE }),
  });
  check(r.status === 200, '3. salva o curso em /api/me', 'status=' + r.status);

  r = await fetch(base + '/api/me', { headers: { Authorization: 'Bearer ' + token } });
  const me2 = await r.json();
  check(me2.course === TEST_COURSE, '4. curso persistiu no servidor', 'course=' + me2.course);

  await stopServer(server);
  await sleep(500);

  console.log('== REINICIO do servidor (mesmo .session-secret e mesmo data.json) ==');
  server = startServer(sandbox, port);
  await waitForServer(base);

  r = await fetch(base + '/api/me', { headers: { Authorization: 'Bearer ' + token } });
  const nok = r.status === 401;
  check(r.status === 200, '5. APOS REINICIO o MESMO token continua valido (login nao se perde)', nok ? '401 -> login perdido' : 'status=' + r.status);
  const me3 = nok ? {} : await r.json();
  check(!nok && me3.course === TEST_COURSE, '6. APOS REINICIO NAO volta a pedir o curso', nok ? '-' : 'course=' + (me3.course || '(vazio)'));
  check(!nok && me3.email === TEST_EMAIL, '7. identidade preservada', nok ? '-' : me3.email);

  r = await fetch(base + '/api/me');
  check(r.status === 401, '8. sem token ainda exige login', 'status=' + r.status);

  const tokenInv = forgeToken('segredo-errado', 'sub-999', 'outro@aluno.ufop.edu.br', 'Outro');
  r = await fetch(base + '/api/me', { headers: { Authorization: 'Bearer ' + tokenInv } });
  check(r.status === 401, '9. token com segredo diferente e rejeitado', 'status=' + r.status);

  await stopServer(server);

  console.log('== Casos que mostram COMO se perde (demonstracao) ==');
  fs.unlinkSync(path.join(sandbox, '.session-secret'));
  server = startServer(sandbox, port);
  await waitForServer(base);
  r = await fetch(base + '/api/me', { headers: { Authorization: 'Bearer ' + token } });
  check(r.status === 401, '10. se .session-secret muda, o login antigo se perde (a causa!)', 'status=' + r.status);
  await stopServer(server);

  fs.writeFileSync(path.join(sandbox, '.session-secret'), secret);
  fs.unlinkSync(path.join(sandbox, 'data.json'));
  server = startServer(sandbox, port);
  await waitForServer(base);
  r = await fetch(base + '/api/me', { headers: { Authorization: 'Bearer ' + token } });
  const me5 = r.status === 200 ? await r.json() : {};
  check(r.status === 200 && !me5.course, '11. se data.json se perde, volta a pedir o curso', 'status=' + r.status + ' course="' + (me5.course || '') + '"');
  await stopServer(server);

  console.log('');
  if (failures) {
    console.log('RESULTADO: ' + failures + ' cheque(s) FALLARAM');
    process.exitCode = 1;
  } else {
    console.log('RESULTADO: TODO OK.');
  }
}

main().catch((err) => {
  console.error('ERRO no teste:', err.message);
  process.exitCode = 1;
}).finally(() => {
  for (const dir of sandboxes) {
    try { fs.rmSync(dir, { recursive: true, force: true }); } catch {}
  }
});