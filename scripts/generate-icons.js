// Regenera os icones do PWA a partir de public/logo_app_final.png.
//
//   node scripts/generate-icons.js
//
// Sem dependencia nenhuma: decodifica o PNG com o zlib da propria Node,
// redimensiona por media de area e reescreve o PNG. Nao usa sharp/canvas
// de proposito, para nao addicionar dependencia nativa a um projeto que
// hoje so tem 4 pacotes de runtime.
//
// Os quatro arquivos saem daqui, e nao de um editor grafico, porque a
// distincao entre "any" e "maskable" e o que faz o icone parecer certo na
// tela de inicio do celular:
//
//   icon-<N>.png          purpose "any"      -> o logo preenche o canvas
//   icon-<N>-maskable.png purpose "maskable" -> o SO recorta ate 20% de cada
//                                               borda (circulo ou squircle),
//                                               entao o logo vai reduzido para
//                                               80% do canvas sobre um fundo
//                                               opaco. Sem essa folga o emblema
//                                               aparece cortado.
//
// Apos rodar, lembrar de subir o ?v= das referencias em public/manifest.json
// e public/sw.js, senao quem ja instalou o PWA continua vendo o icone antigo.

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const PUBLIC = path.join(__dirname, '..', 'public');
const SRC = path.join(PUBLIC, 'logo_app_final.png');
const OUT_DIR = path.join(PUBLIC, 'icons');
const SIZES = [192, 512];

// diametro da area segura do maskable (o SO descarta ate 20% de cada borda)
const MASKABLE_SCALE = 0.8;
// respiro entre o emblema e a borda dos icones "any"
const ANY_PADDING = 0.06;
// quanto um pixel precisa se afastar da cor do canto para contar como conteudo
const BG_TOLERANCE = 16;

// ============================== leitura de PNG ==============================

function decodePng(buf) {
  if (buf.readUInt32BE(0) !== 0x89504e47) throw new Error('o arquivo nao e um PNG');
  let pos = 8;
  let ihdr = null;
  const idat = [];
  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos);
    const type = buf.toString('ascii', pos + 4, pos + 8);
    const data = buf.subarray(pos + 8, pos + 8 + len);
    if (type === 'IHDR') {
      ihdr = {
        width: data.readUInt32BE(0),
        height: data.readUInt32BE(4),
        bitDepth: data[8],
        colorType: data[9],
        interlace: data[12],
      };
    } else if (type === 'IDAT') {
      idat.push(data);
    } else if (type === 'IEND') {
      break;
    }
    pos += 12 + len;
  }
  if (!ihdr) throw new Error('PNG sem IHDR');
  if (ihdr.bitDepth !== 8) throw new Error('so bitDepth 8, veio ' + ihdr.bitDepth);
  if (ihdr.colorType !== 2 && ihdr.colorType !== 6) {
    throw new Error('so RGB (2) ou RGBA (6), veio colorType ' + ihdr.colorType);
  }
  if (ihdr.interlace !== 0) throw new Error('PNG entrelacado nao suportado');

  const channels = ihdr.colorType === 6 ? 4 : 3;
  const raw = zlib.inflateSync(Buffer.concat(idat));
  const { width, height } = ihdr;
  const stride = width * channels;
  const out = Buffer.alloc(stride * height);

  // cada scanline vem com um byte de filtro que depende da linha de cima e da
  // esquerda; sem desfazer isso os pixels sao lixo
  let src = 0;
  for (let y = 0; y < height; y++) {
    const filter = raw[src++];
    const line = raw.subarray(src, src + stride);
    src += stride;
    const cur = out.subarray(y * stride, (y + 1) * stride);
    const prev = y > 0 ? out.subarray((y - 1) * stride, y * stride) : null;
    for (let i = 0; i < stride; i++) {
      const a = i >= channels ? cur[i - channels] : 0;
      const b = prev ? prev[i] : 0;
      const c = prev && i >= channels ? prev[i - channels] : 0;
      let v = line[i];
      if (filter === 1) v += a;
      else if (filter === 2) v += b;
      else if (filter === 3) v += (a + b) >> 1;
      else if (filter === 4) {
        const p = a + b - c;
        const pa = Math.abs(p - a);
        const pb = Math.abs(p - b);
        const pc = Math.abs(p - c);
        v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
      } else if (filter !== 0) {
        throw new Error('filtro de PNG desconhecido: ' + filter);
      }
      cur[i] = v & 0xff;
    }
  }
  return { width, height, channels, data: out };
}

function toRgba(img) {
  if (img.channels === 4) return img;
  const { width, height, data } = img;
  const out = Buffer.alloc(width * height * 4);
  for (let i = 0, j = 0; j < out.length; i++, j += 4) {
    out[j] = data[i * 3];
    out[j + 1] = data[i * 3 + 1];
    out[j + 2] = data[i * 3 + 2];
    out[j + 3] = 255;
  }
  return { width, height, channels: 4, data: out };
}

// ============================== escrita de PNG ==============================

const CRC_TABLE = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();

function crc32(buf) {
  let c = -1;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

function encodePng(img) {
  const { width, height, data } = img;
  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0; // filtro None: o deflate do zlib ja resolve
    data.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// ============================== recorte e escala ==============================

// Algum pixel do logo e translucido? Se sim, o fundo e transparency e o
// criterio do que e "conteudo" passa a ser o alfa. Sem isso, num PNG com
// alfa o RGB guardado sob alfa 0 (que o navegador descarta e que nao tem
// por que ser a cor do fundo) viraria a referencia de tudo.
function hasAlpha(img) {
  for (let i = 3; i < img.data.length; i += 4) {
    if (img.data[i] < 250) return true;
  }
  return false;
}

// Cor de fundo para a sobra do recorte e para o canvas dos maskable.
// Numa imagem opaca e a cor do canto. Numa com alfa o canto nao serve, entao
// usa a cor opaca mais comum da borda; se a borda toda for transparente, cai
// no background_color do manifest, que e o que o SO mostra atras do icone.
function backgroundColor(img, transparent) {
  if (!transparent) return [img.data[0], img.data[1], img.data[2]];
  const buckets = new Map();
  const edge = Math.max(2, Math.round(Math.min(img.width, img.height) * 0.06));
  for (let y = 0; y < img.height; y++) {
    for (let x = 0; x < img.width; x++) {
      if (x >= edge && y >= edge && x < img.width - edge && y < img.height - edge) continue;
      const i = (y * img.width + x) * 4;
      if (img.data[i + 3] < 250) continue;
      const key = ((img.data[i] >> 4) << 8) | ((img.data[i + 1] >> 4) << 4) | (img.data[i + 2] >> 4);
      const hit = buckets.get(key);
      if (hit) hit.n++;
      else buckets.set(key, { n: 1, r: img.data[i], g: img.data[i + 1], b: img.data[i + 2] });
    }
  }
  let best = null;
  for (const hit of buckets.values()) if (!best || hit.n > best.n) best = hit;
  return best ? [best.r, best.g, best.b] : manifestBackground();
}

function manifestBackground() {
  const manifest = JSON.parse(fs.readFileSync(path.join(PUBLIC, 'manifest.json'), 'utf8'));
  const hex = String(manifest.background_color || '').replace('#', '');
  if (!/^[0-9a-f]{6}$/i.test(hex)) return [242, 247, 251];
  return [parseInt(hex.slice(0, 2), 16), parseInt(hex.slice(2, 4), 16), parseInt(hex.slice(4, 6), 16)];
}

// o logo vem com uma margem em volta do emblema; sem recortar, o icone sai
// com o emblema pequeno e a margem fantasma
function contentBox(img, transparent) {
  const { width, height, data } = img;
  const bg = [data[0], data[1], data[2]];
  let minX = width, minY = height, maxX = -1, maxY = -1;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      if (transparent) {
        if (data[i + 3] <= BG_TOLERANCE) continue;
      } else {
        const d = Math.max(
          Math.abs(data[i] - bg[0]),
          Math.abs(data[i + 1] - bg[1]),
          Math.abs(data[i + 2] - bg[2])
        );
        if (d <= BG_TOLERANCE) continue;
      }
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }
  if (maxX < 0) throw new Error('o logo e todo igual ao fundo, nao achei conteudo');
  return { minX, minY, maxX, maxY };
}

function cropSquare(img, box, padRatio, bg, transparent) {
  const w = box.maxX - box.minX + 1;
  const h = box.maxY - box.minY + 1;
  const side = Math.round(Math.max(w, h) * (1 + padRatio * 2));
  // sobra em cima e em baixo (ou dos lados), centrada no canvas novo
  const offX = Math.round((side - w) / 2);
  const offY = Math.round((side - h) / 2);
  const out = Buffer.alloc(side * side * 4);
  // A sobra leva a cor de fundo do logo, e nao preto transparente: um logo
  // exportado sem alfa tem o canto opaco, e sem esse preenchimento o "any"
  // icon sai com o canto transparente (vira buraco preto na tela de inicio).
  // Com alfa a sobra fica transparente de proposito, para o emblema nao
  // aparecer dentro de um quadrado.
  if (!transparent) {
    for (let i = 0; i < side * side; i++) {
      out[i * 4] = bg[0];
      out[i * 4 + 1] = bg[1];
      out[i * 4 + 2] = bg[2];
      out[i * 4 + 3] = 255;
    }
  }
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const src = ((box.minY + y) * img.width + (box.minX + x)) * 4;
      const dst = ((offY + y) * side + (offX + x)) * 4;
      img.data.copy(out, dst, src, src + 4);
    }
  }
  return { width: side, height: side, channels: 4, data: out };
}

function resize(img, size) {
  const out = Buffer.alloc(size * size * 4);
  const scale = img.width / size;
  for (let y = 0; y < size; y++) {
    const y0 = Math.floor(y * scale);
    const y1 = Math.min(img.height, Math.max(y0 + 1, Math.floor((y + 1) * scale)));
    for (let x = 0; x < size; x++) {
      const x0 = Math.floor(x * scale);
      const x1 = Math.min(img.width, Math.max(x0 + 1, Math.floor((x + 1) * scale)));
      // media de area com peso de alfa, para nao sujar a borda de um pixel
      // translucido com a cor de quem esta atras
      let r = 0, g = 0, b = 0, a = 0, n = 0;
      for (let sy = y0; sy < y1; sy++) {
        for (let sx = x0; sx < x1; sx++) {
          const i = (sy * img.width + sx) * 4;
          r += img.data[i] * img.data[i + 3];
          g += img.data[i + 1] * img.data[i + 3];
          b += img.data[i + 2] * img.data[i + 3];
          a += img.data[i + 3];
          n++;
        }
      }
      const j = (y * size + x) * 4;
      if (a > 0) {
        out[j] = Math.round(r / a);
        out[j + 1] = Math.round(g / a);
        out[j + 2] = Math.round(b / a);
        out[j + 3] = Math.round(a / n);
      }
    }
  }
  return { width: size, height: size, channels: 4, data: out };
}

function renderAny(crop, size) {
  return resize(crop, size);
}

function renderMaskable(crop, size, bg) {
  const inner = Math.round(size * MASKABLE_SCALE);
  const logo = resize(crop, inner);
  const out = Buffer.alloc(size * size * 4);
  for (let i = 0; i < size * size; i++) {
    out[i * 4] = bg[0];
    out[i * 4 + 1] = bg[1];
    out[i * 4 + 2] = bg[2];
    out[i * 4 + 3] = 255;
  }
  const off = Math.round((size - inner) / 2);
  for (let y = 0; y < inner; y++) {
    for (let x = 0; x < inner; x++) {
      const src = (y * inner + x) * 4;
      const dst = ((y + off) * size + (x + off)) * 4;
      out[dst] = logo.data[src];
      out[dst + 1] = logo.data[src + 1];
      out[dst + 2] = logo.data[src + 2];
      out[dst + 3] = 255;
    }
  }
  return { width: size, height: size, channels: 4, data: out };
}

// ============================== main ==============================

function main() {
  const src = toRgba(decodePng(fs.readFileSync(SRC)));
  const transparent = hasAlpha(src);
  const bg = backgroundColor(src, transparent);
  const box = contentBox(src, transparent);
  const crop = cropSquare(src, box, ANY_PADDING, bg, transparent);

  fs.mkdirSync(OUT_DIR, { recursive: true });
  console.log('logo ' + src.width + 'x' + src.height +
    '  fundo ' + (transparent ? 'transparente' : 'opaco rgb(' + bg.join(',') + ')') +
    '  emblema ' + (box.maxX - box.minX + 1) + 'x' + (box.maxY - box.minY + 1) +
    '  recorte ' + crop.width + 'x' + crop.height);

  for (const size of SIZES) {
    const any = path.join(OUT_DIR, 'icon-' + size + '.png');
    const mask = path.join(OUT_DIR, 'icon-' + size + '-maskable.png');
    fs.writeFileSync(any, encodePng(renderAny(crop, size)));
    fs.writeFileSync(mask, encodePng(renderMaskable(crop, size, bg)));
    console.log('  ' + path.basename(any) + ' (' + fs.statSync(any).size + ' B)  ' +
      path.basename(mask) + ' (' + fs.statSync(mask).size + ' B)');
  }

  console.log('');
  console.log('FALTA SUBIR O ?v= em public/manifest.json e public/sw.js, senao quem ja');
  console.log('instalou o app continua no icone antigo.');
}

main();
