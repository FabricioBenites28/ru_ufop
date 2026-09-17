const $ = (s) => document.querySelector(s);

const MODAL_MINUTES = [5, 10, 15, 30, 45, 60, 90, 120];
const DAYS = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];

const state = {
  name: localStorage.getItem('ru_name') || '',
  userId: localStorage.getItem('ru_userId') || crypto.randomUUID(),
  mode: 'in',
  minutes: 30,
  exact: '19:00',
};

localStorage.setItem('ru_userId', state.userId);

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
    const perm = await Notification.requestPermission();
    if (perm !== 'granted') return;
    let sub = await reg.pushManager.getSubscription();
    if (!sub) {
      const { publicKey } = await (await fetch('/api/vapid')).json();
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });
    }
    if (sub) {
      await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sub),
      });
    }
  } catch (err) {
    console.error('push fallhou:', err);
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
  list.sort((a, b) => new Date(a.arrive) - new Date(b.arrive));

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

function syncModal() {
  $('#tabIn').classList.toggle('active', state.mode === 'in');
  $('#tabExact').classList.toggle('active', state.mode === 'exact');
  $('#panelIn').classList.toggle('hidden', state.mode !== 'in');
  $('#panelExact').classList.toggle('hidden', state.mode !== 'exact');
  for (const chip of $('#chips').children) {
    chip.classList.toggle('selected', state.mode === 'in' && state.minutes === parseInt(chip.dataset.m, 10));
  }
  const preview = $('#preview');
  if (state.mode === 'in') {
    preview.textContent = `Você vai comer no RU em ${state.minutes} min`;
  } else {
    preview.textContent = `Você vai comer no RU às ${state.exact}`;
  }
}

function openModal() {
  $('#modal').classList.remove('hidden');
  $('#announceBtn').style.display = 'none';
}

function closeModal() {
  $('#modal').classList.add('hidden');
  $('#announceBtn').style.display = '';
}

async function confirmAnnounce() {
  const payload = { name: state.name, userId: state.userId };
  if (state.mode === 'in') {
    payload.when = 'in';
    payload.minutes = state.minutes;
  } else {
    payload.when = 'exact';
    payload.time = state.exact;
  }
  $('#confirmBtn').textContent = 'Enviando…';
  $('#confirmBtn').disabled = true;
  try {
    await fetch('/api/announce', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
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

  $('#nameOk').addEventListener('click', () => {
    const name = $('#nameInput').value.trim();
    if (!name) return;
    state.name = name;
    localStorage.setItem('ru_name', name);
    $('#nameOverlay').classList.add('hidden');
    renderTimeline();
    enablePush();
  });

  setInterval(renderTimeline, 30000);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) renderTimeline();
  });
  renderTimeline();
}

if (state.name) {
  start();
} else {
  $('#nameOverlay').classList.remove('hidden');
  $('#nameInput').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') $('#nameOk').click();
  });
  start();
}