const $ = (s) => document.querySelector(s);

const MODAL_MINUTES = [5, 10, 15, 30, 45, 60, 90, 120];
const DAYS = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
const WEEKDAYS = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
const EMAIL_RE = /^[a-z0-9._%+\-]+@(?:aluno\.)?ufop\.edu\.br$/i;

const state = {
  email: localStorage.getItem('ru_email') || '',
  userId: localStorage.getItem('ru_userId') || crypto.randomUUID(),
  mode: 'in',
  minutes: 30,
  exact: '19:00',
  menuTab: null,
  pendingMenu: null,
};

localStorage.setItem('ru_userId', state.userId);

function nameFromEmail(email) {
  const local = email.split('@')[0].replace(/[._]+/g, ' ').trim();
  return local
    .split(' ')
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(' ');
}

function fmtClock(iso) {
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function urlBase64ToUint8Array(base64) {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + padding).replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

function toast(msg) {
  const el = $('#toast');
  el.textContent = msg;
  el.classList.remove('hidden');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => el.classList.add('hidden'), 3000);
}

function setStatus(ok) {
  const el = $('#status');
  el.textContent = ok ? 'online' : 'offline';
  el.className = 'badge ' + (ok ? 'online' : 'offline');
}

async function enablePush() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
  try {
    const reg = await navigator.serviceWorker.register('/sw.js');
    const { publicKey } = await (await fetch('/api/vapid')).json();
    const perm = await Notification.requestPermission();
    if (perm !== 'granted') return;
    let sub = await reg.pushManager.getSubscription();
    if (sub && localStorage.getItem('ru_vapid') !== publicKey) {
      await sub.unsubscribe();
      sub = null;
    }
    if (!sub) {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });
      localStorage.setItem('ru_vapid', publicKey);
    }
    if (sub) {
      await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sub),
      });
    }
  } catch (err) {
    console.error('push falhou:', err);
  }
}

function dayLabel(iso) {
  const d = new Date(iso);
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (d.toDateString() === today.toDateString()) return 'Hoje';
  if (d.toDateString() === tomorrow.toDateString()) return 'Amanhã';
  return `${DAYS[d.getDay()]}, ${d.getDate()}/${d.getMonth() + 1}`;
}

async function renderTimeline() {
  let list = [];
  try {
    list = await (await fetch('/api/announcements')).json();
    setStatus(true);
  } catch {
    setStatus(false);
  }
  list.sort((a, b) => new Date(a.arrive) - new Date(b.arrive) || new Date(a.announceAt) - new Date(b.announceAt));

  const container = $('#timeline');
  container.innerHTML = '';
  $('#empty').classList.toggle('hidden', list.length > 0);

  let lastDay = '';
  for (const a of list) {
    const label = dayLabel(a.arrive);
    if (label !== lastDay) {
      lastDay = label;
      const group = document.createElement('div');
      group.className = 'day-group';
      group.textContent = label;
      container.appendChild(group);
    }
    const card = document.createElement('div');
    card.className = 'card ann';

    const avatar = document.createElement('div');
    avatar.className = 'avatar';
    avatar.textContent = a.name.trim().charAt(0).toUpperCase();

    const info = document.createElement('div');
    info.className = 'info';
    const name = document.createElement('div');
    name.className = 'name';
    name.textContent = a.name;
    const when = document.createElement('div');
    when.className = 'when';
    when.textContent = `Vai comer no RU ${a.label}`;
    info.append(name, when);

    const clock = document.createElement('div');
    clock.className = 'clock';
    clock.textContent = fmtClock(a.arrive);

    card.append(avatar, info, clock);
    container.appendChild(card);
  }
}

function buildChips() {
  const wrap = $('#chips');
  wrap.innerHTML = '';
  for (const m of MODAL_MINUTES) {
    const btn = document.createElement('button');
    btn.dataset.m = m;
    btn.className = 'chip' + (m === state.minutes ? ' selected' : '');
    btn.textContent = m >= 60 ? `${m / 60} h` : `${m} min`;
    btn.addEventListener('click', () => {
      state.minutes = m;
      state.mode = 'in';
      syncModal();
    });
    wrap.appendChild(btn);
  }
}

function arrival() {
  const now = Date.now();
  if (state.mode === 'in') {
    const arrive = new Date(now + state.minutes * 60000);
    return { when: 'in', arrive: arrive.toISOString(), label: `em ${state.minutes} min` };
  }
  const [h, m] = state.exact.split(':').map(Number);
  const d = new Date();
  d.setHours(h || 0, m || 0, 0, 0);
  if (d.getTime() <= now) d.setDate(d.getDate() + 1);
  return { when: 'exact', arrive: d.toISOString(), label: `às ${state.exact}` };
}

function syncModal() {
  $('#tabIn').classList.toggle('active', state.mode === 'in');
  $('#tabExact').classList.toggle('active', state.mode === 'exact');
  $('#panelIn').classList.toggle('hidden', state.mode !== 'in');
  $('#panelExact').classList.toggle('hidden', state.mode !== 'exact');
  for (const chip of $('#chips').children) {
    chip.classList.toggle('selected', state.mode === 'in' && state.minutes === parseInt(chip.dataset.m, 10));
  }
  $('#preview').textContent = `Você vai comer no RU ${arrival().label}`;
}

function openModal() {
  syncModal();
  $('#modal').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  $('#modal').classList.add('hidden');
  document.body.style.overflow = '';
}

async function confirmAnnounce() {
  const r = arrival();
  const payload = { email: state.email, userId: state.userId, when: r.when, arrive: r.arrive, label: r.label };
  $('#confirmBtn').textContent = 'Enviando…';
  $('#confirmBtn').disabled = true;
  try {
    const resp = await fetch('/api/announce', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!resp.ok) throw new Error('invalid');
    closeModal();
    toast('Aviso enviado! 🔔');
    renderTimeline();
  } catch {
    toast('Falha ao enviar. Tente de novo.');
  }
  $('#confirmBtn').textContent = 'Confirmar';
  $('#confirmBtn').disabled = false;
}

function start() {
  buildChips();
  syncModal();

  $('#announceBtn').addEventListener('click', openModal);
  $('#tabIn').addEventListener('click', () => { state.mode = 'in'; syncModal(); });
  $('#tabExact').addEventListener('click', () => { state.mode = 'exact'; syncModal(); });
  $('#cancelBtn').addEventListener('click', closeModal);
  $('#confirmBtn').addEventListener('click', confirmAnnounce);
  $('#exactTime').addEventListener('change', (e) => { state.exact = e.target.value; syncModal(); });

  $('#detectBtn').addEventListener('click', refreshMenuPreview);
  $('#mealSelect').addEventListener('change', refreshMenuPreview);
  $('#menuText').addEventListener('input', refreshMenuPreview);
  $('#menuCancel').addEventListener('click', closeMenuModal);
  $('#menuSave').addEventListener('click', saveMenu);

  setInterval(renderTimeline, 30000);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) { renderTimeline(); renderMenu(); }
  });
  renderTimeline();
  renderMenu();
  enablePush();
}

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function nowMeal() {
  return new Date().getHours() < 15 ? 'almoço' : 'jantar';
}

function parseMenuText(raw) {
  const text = raw || '';
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  let meal = null;
  const mm = text.match(/card[aá]pio\s+do\s+(alm[oô]ço|jantar)/i);
  if (mm) meal = mm[1].toLowerCase().includes('jantar') ? 'jantar' : 'almoço';
  let date = todayStr();
  let dateLabel = '';
  const dm = text.match(/dia\s+(\d{1,2})\s*[/\-]\s*(\d{1,2})\s*[/\-]\s*(\d{4})/i);
  if (dm) {
    const d = Number(dm[1]);
    const m = Number(dm[2]);
    const y = Number(dm[3]);
    date = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    dateLabel = `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y} (${WEEKDAYS[new Date(y, m - 1, d).getDay()]})`;
  }
  const items = [];
  for (const line of lines) {
    if (/card[aá]pio\s+do\s+(alm[oô]ço|jantar)/i.test(line)) continue;
    if (/cont[eé]m\s*lactose/i.test(line)) continue;
    const clean = line.replace(/^[•\-\*\s]+/, '').replace(/\s+/g, ' ').trim();
    if (!clean) continue;
    items.push({
      text: clean.replace(/\*+/g, '').trim(),
      veg: /vegetariano/i.test(clean),
      lactose: /\*/.test(clean) || /lactose/i.test(clean),
    });
  }
  return { meal, date, dateLabel, items };
}

function tagify(li, item) {
  if (item.veg) {
    const s = document.createElement('span');
    s.className = 'tag veg';
    s.textContent = 'vegetariano';
    li.appendChild(s);
  }
  if (item.lactose) {
    const s = document.createElement('span');
    s.className = 'tag lac';
    s.textContent = 'lactose';
    li.appendChild(s);
  }
}

function openMenuModal(meal) {
  if (meal) $('#mealSelect').value = meal;
  $('#menuText').value = '';
  $('#menuPreview').classList.add('hidden');
  state.pendingMenu = null;
  $('#menuModal').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
  $('#menuText').focus();
}

function closeMenuModal() {
  $('#menuModal').classList.add('hidden');
  $('#menuPreview').classList.add('hidden');
  document.body.style.overflow = '';
}

function refreshMenuPreview() {
  const p = parseMenuText($('#menuText').value);
  p.meal = $('#mealSelect').value;
  const prev = $('#menuPreview');
  if (!p.items.length) {
    prev.classList.add('hidden');
    state.pendingMenu = null;
    return;
  }
  state.pendingMenu = p;
  prev.classList.remove('hidden');
  prev.innerHTML = '';
  const head = document.createElement('div');
  head.className = 'fv';
  const meal = p.meal === 'jantar' ? 'Jantar' : 'Almoço';
  head.textContent = `${meal} · ${p.dateLabel || p.date} · ${p.items.length} itens`;
  prev.appendChild(head);
  const ul = document.createElement('ul');
  ul.className = 'menu-items';
  for (const it of p.items.slice(0, 24)) {
    const li = document.createElement('li');
    li.textContent = it.text;
    tagify(li, it);
    ul.appendChild(li);
  }
  prev.appendChild(ul);
}

async function saveMenu() {
  const p = state.pendingMenu;
  if (!p) return;
  $('#menuSave').textContent = 'Salvando…';
  $('#menuSave').disabled = true;
  try {
    const resp = await fetch('/api/menu', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: state.email,
        meal: p.meal,
        date: p.date,
        dateLabel: p.dateLabel,
        items: p.items,
      }),
    });
    if (!resp.ok) throw new Error('invalid');
    closeMenuModal();
    state.menuTab = p.meal;
    toast('Cardápio salvo! 🍽️');
    renderMenu();
  } catch {
    toast('Falha ao salvar. Tente de novo.');
  }
  $('#menuSave').textContent = 'Salvar cardápio';
  $('#menuSave').disabled = false;
}

async function renderMenu() {
  let menus = [];
  try {
    menus = await (await fetch('/api/menu')).json();
  } catch {
    return;
  }
  menus.sort((a, b) => b.date.localeCompare(a.date));
  const container = $('#menuSection');
  container.innerHTML = '';

  if (!menus.length) {
    const card = document.createElement('div');
    card.className = 'card menu empty-menu';
    const title = document.createElement('div');
    title.className = 'menu-title';
    title.textContent = '🍽️ Cardápio';
    const sub = document.createElement('p');
    sub.className = 'sub';
    sub.textContent = 'O cardápio de hoje vem do Telegram. Dá pra colar aqui pra todo mundo ver.';
    const btn = document.createElement('button');
    btn.className = 'primary';
    btn.textContent = 'Adicionar cardápio';
    btn.onclick = () => openMenuModal(nowMeal());
    card.append(title, sub, btn);
    container.appendChild(card);
    return;
  }

  const day = menus[0].date;
  const dayMenus = menus.filter((m) => m.date === day);
  const almoço = dayMenus.find((m) => m.meal === 'almoço');
  const jantar = dayMenus.find((m) => m.meal === 'jantar');
  if (!state.menuTab || !dayMenus.some((m) => m.meal === state.menuTab)) {
    state.menuTab = jantar ? 'jantar' : 'almoço';
  }
  const current = state.menuTab === 'jantar' ? jantar : almoço;

  const card = document.createElement('div');
  card.className = 'card menu';

  const head = document.createElement('div');
  head.className = 'menu-head';
  const titles = document.createElement('div');
  const title = document.createElement('div');
  title.className = 'menu-title';
  title.textContent = '🍽️ Cardápio';
  const date = document.createElement('div');
  date.className = 'menu-date';
  const any = almoço || jantar;
  date.textContent = any ? any.dateLabel : day;
  titles.append(title, date);
  const editBtn = document.createElement('button');
  editBtn.className = 'menu-edit';
  editBtn.textContent = '✏️';
  editBtn.title = 'Editar cardápio';
  editBtn.onclick = () => openMenuModal(current ? current.meal : null);
  head.append(titles, editBtn);
  card.appendChild(head);

  const tabs = document.createElement('div');
  tabs.className = 'tabs';
  const mkTab = (meal, label, has) => {
    const b = document.createElement('button');
    b.className = 'tab' + (state.menuTab === meal ? ' active' : '');
    b.textContent = has ? label : `${label} —`;
    b.onclick = () => { state.menuTab = meal; renderMenu(); };
    return b;
  };
  tabs.append(mkTab('almoço', 'Almoço', !!almoço), mkTab('jantar', 'Jantar', !!jantar));
  card.appendChild(tabs);

  if (current) {
    const ul = document.createElement('ul');
    ul.className = 'menu-items';
    for (const it of current.items) {
      const li = document.createElement('li');
      li.textContent = it.text;
      tagify(li, it);
      ul.appendChild(li);
    }
    card.appendChild(ul);
  } else {
    const p = document.createElement('p');
    p.className = 'sub';
    p.textContent = 'Ainda não tem cardápio desse horário.';
    card.appendChild(p);
  }

  container.appendChild(card);
}

function initEmail() {
  const input = $('#emailInput');
  const error = $('#emailError');
  const ok = () => {
    const email = input.value.trim().toLowerCase();
    if (!EMAIL_RE.test(email)) {
      error.classList.remove('hidden');
      return;
    }
    error.classList.add('hidden');
    state.email = email;
    localStorage.setItem('ru_email', email);
    $('#emailOverlay').classList.add('hidden');
    const name = nameFromEmail(email);
    $('.brand-sub').textContent = `oi, ${name.split(' ')[0]} 👋`;
    start();
  };
  $('#emailOk').addEventListener('click', ok);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') ok();
  });
  input.focus();
}

if (state.email) {
  $('.brand-sub').textContent = `oi, ${nameFromEmail(state.email).split(' ')[0]} 👋`;
  start();
} else {
  $('#emailOverlay').classList.remove('hidden');
  initEmail();
}