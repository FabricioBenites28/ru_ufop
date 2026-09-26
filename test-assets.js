// Regressao do cache-bust dos assets estaticos.
//
// O buildIndex() reescreve as referencias de /app.js, /style.css e do logo para
// carregar ?v=<md5 do conteudo>. A implementacao anterior fazia isso com
// String.replace() de um literal exato ('/logo_app.png?v=4'), acoplado ao valor
// do placeholder na hora. Dois jeitos de quebrar sem erro nenhum:
//   1. renomear o arquivo e esquecer de atualizar o literal  -> replace() nao
//      casa, o HTML sai com ?v=4 para sempre e todo mundo ve o logo velho
//   2. mexer no valor do placeholder (?v=5) sem mexer no literal -> mesmo efeito
// Foi exatamente o que aconteceu no 3f8de45. assetVersion() tambem engole
// exceptions e devolve 'dev', entao um arquivo faltando tb nao quebra nada: o
// HTML simplesmente passa a apontar para /logo_app.png?v=dev, que da 404.
//
// Aqui o teste prova tres coisas:
//   1. o HTML servido traz o md5 real, e nao o placeholder nem 'dev'
//   2. o hash nao depende do valor do placeholder (renomear o ?v=6 continua
//      funcionando) -- a regressao do 3f8de45
//   3. TODO asset local referenciado pelo index/manifest/sw responde 200, o
//      que pega o outro jeito de quebrar: referenciar um arquivo que nao existe
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');

const LOGO = 'logo_app_final.png';
const HASHED = ['app.js', 'style.css', LOGO];

const sandboxes = [];
let failures = 0;
function check(ok, msg, extra) {
  console.log((ok ? '  PASS  ' : '  FAIL  ') + msg + (extra ? ' :: ' + extra : ''));
  if (!ok) failures++;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
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
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ru-assets-'));
  fs.copyFileSync(path.join(__dirname, 'server.js'), path.join(dir, 'server.js'));
  copyRecursive(path.join(__dirname, 'public'), path.join(dir, 'public'));
  fs.symlinkSync(path.join(__dirname, 'node_modules'), path.join(dir, 'node_modules'), 'junction');
  return dir;
}

function startServer(dir, port) {
  // Apaga as credenciais reais: este teste nao precisa de Redis e nao pode
  // encostar em producao. O .env so preenche chaves ainda nao definidas, e o
  // server sobe mesmo sem nenhuma delas.
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

// mesmo md5 do assetVersion() em server.js:36
function md5(file) {
  return crypto.createHash('md5').update(fs.readFileSync(file)).digest('hex').slice(0, 10);
}

// todos os caminhos locais citados no HTML servido
function htmlRefs(html) {
  const out = [];
  const re = /(?:src|href)="(\/[^"#][^"]*)"/g;
  let m;
  while ((m = re.exec(html))) out.push(m[1]);
  return out;
}

function manifestRefs(text) {
  const out = [];
  const re = /"(?:src|href)"\s*:\s*"(\/[^"]+)"/g;
  let m;
  while ((m = re.exec(text))) out.push(m[1]);
  return out;
}

function swRefs(text) {
  const out = [];
  const re = /['"]\.\/([^'"]+)['"]/g;
  let m;
  while ((m = re.exec(text))) out.push('/' + m[1]);
  return out;
}

async function main() {
  const sandbox = buildSandbox();
  sandboxes.push(sandbox);
  const publicDir = path.join(sandbox, 'public');

  const port = await getFreePort();
  const base = 'http://127.0.0.1:' + port;

  console.log('== BOOT 1: o HTML servido tem que trazer o md5 real ==');
  let server = startServer(sandbox, port);
  await waitForServer(base);

  const r = await fetch(base + '/');
  const html = await r.text();

  check(r.headers.get('cache-control') === 'no-cache',
    '1. / e servido com Cache-Control: no-cache', 'header=' + r.headers.get('cache-control'));

  for (let i = 0; i < HASHED.length; i++) {
    const asset = HASHED[i];
    const expected = md5(path.join(publicDir, asset));
    const escaped = asset.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp('/' + escaped + '\\?v=([0-9a-f]{10})');
    const m = html.match(re);
    check(!!m && m[1] === expected,
      (i + 2) + '. ' + asset + '?v=<md5 do conteudo>', 'esperado=' + expected + ' servido=' + (m ? m[1] : '(ausente)'));
  }

  check(!html.includes('?v=dev'),
    '5. nenhum ?v=dev no HTML (assetVersion nunca caiu no catch)');
  check(!html.includes('?v=res'),
    '6. o placeholder ?v=res do app.js foi substituido');
  check(!new RegExp('/' + LOGO.replace(/\./g, '\\.') + '\\?v=5(?![0-9a-f])').test(html),
    '7. o placeholder ?v=5 do logo foi substituido');
  check(!html.includes('logo_app.png'),
    '8. nenhuma referencia ao nome antigo logo_app.png sobrou');

  const logoRes = await fetch(base + '/' + LOGO);
  check(logoRes.status === 200 && (logoRes.headers.get('content-type') || '').includes('image/png'),
    '9. o logo responde 200 como image/png (o 404 do working tree quebrado)',
    'status=' + logoRes.status + ' type=' + logoRes.headers.get('content-type'));

  console.log('== BOOT 2: o hash nao pode depender do valor do placeholder ==');
  await stopServer(server);
  await sleep(400);

  // a regressao exata do 3f8de45: muda so o ?v= do placeholder, o hash tem que
  // continuar entrando. Com o replace() por literal isso nao acontecia.
  const indexFile = path.join(publicDir, 'index.html');
  const before = fs.readFileSync(indexFile, 'utf8');
  fs.writeFileSync(indexFile, before.replace('/logo_app_final.png?v=5', '/logo_app_final.png?v=9999'));
  if (fs.readFileSync(indexFile, 'utf8') === before) {
    check(false, '10. [setup] nao achei o placeholder do logo no index.html para mexer');
  }

  server = startServer(sandbox, port);
  await waitForServer(base);
  const html2 = await (await fetch(base + '/')).text();
  const expectedLogo = md5(path.join(publicDir, LOGO));
  const mLogo = html2.match(new RegExp('/' + LOGO.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\?v=([0-9a-f]{10})'));

  check(!!mLogo && mLogo[1] === expectedLogo,
    '10. placeholder ?v=9999 ainda recebe o md5 (buildIndex nao esta acoplado ao ?v=)',
    'esperado=' + expectedLogo + ' servido=' + (mLogo ? mLogo[1] : '(ausente)'));

  await stopServer(server);
  await sleep(400);

  console.log('== BOOT 3: todo asset local citado no index/manifest/sw tem que responder 200 ==');
  fs.writeFileSync(indexFile, before);
  server = startServer(sandbox, port);
  await waitForServer(base);

  const html3 = await (await fetch(base + '/')).text();
  const manifest = await (await fetch(base + '/manifest.json')).text();
  const sw = await (await fetch(base + '/sw.js')).text();

  const refs = [...new Set([
    ...htmlRefs(html3),
    ...manifestRefs(manifest),
    ...swRefs(sw),
  ])];

  const assets = [...new Set(refs
    .map((r) => r.split('?')[0].split('#')[0])
    .filter((r) => /\.(png|json|css|js|webmanifest)$/i.test(r)))];

  // guarda contra passagem vazia: se o extrator de refs quebrar, este teste
  // passaria sem checar nada, que e pior do que nao ter teste
  check(assets.length >= 6,
    '11. o extrator de refs achou os assets do index/manifest/sw',
    'encontrados=' + assets.length + ' :: ' + assets.join(' '));

  const broken = [];
  for (const asset of assets) {
    const res = await fetch(base + asset);
    if (res.status !== 200) broken.push(asset + ' -> ' + res.status);
  }

  check(assets.length > 0 && broken.length === 0,
    '12. os ' + assets.length + ' assets locais citados resolvem 200',
    broken.length ? broken.join(' | ') : 'todos ok');
  check(fs.existsSync(path.join(publicDir, LOGO)),
    '13. ' + LOGO + ' existe no disco do public/');

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
