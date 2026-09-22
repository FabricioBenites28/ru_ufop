const $ = (s) => document.querySelector(s);

const DAYS = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
const MENU_EDITOR_EMAIL = 'carlos.rodriguez@aluno.ufop.edu.br';
const state = {
  session: localStorage.getItem('ru_session') || '',
  name: localStorage.getItem('ru_name') || '',
  email: localStorage.getItem('ru_email') || '',
  photo: localStorage.getItem('ru_photo') || '',
  course: localStorage.getItem('ru_course') || '',
  started: false,
  exact: '19:00',
  menuTab: null,
  pendingMenu: null,
  pendingPhoto: '',
  editingId: '',
  scope: localStorage.getItem('ru_scope') || 'all',
  groups: [],
  groupId: '',
  announceGroup: '',
};

const canEditMenu = () => state.email === MENU_EDITOR_EMAIL;

const COURSES = [
  'Administração', 'Arquitetura e Urbanismo', 'Artes Cênicas', 'Ciência da Computação',
  'Ciência e Tecnologia de Alimentos', 'Ciências Biológicas', 'Ciências Econômicas', 'Direito',
  'Educação Física', 'Estatística e Ciência de Dados', 'Farmácia', 'Filosofia',
  'Física', 'Engenharia Ambiental', 'Engenharia Civil',
  'Engenharia de Controle e Automação', 'Engenharia de Minas',
  'Engenharia de Produção', 'Engenharia Geológica', 'Engenharia Mecânica',
  'Engenharia Metalúrgica', 'Engenharia Urbana', 'História', 'Inteligência Artificial',
  'Jornalismo', 'Letras', 'Matemática', 'Medicina', 'Museologia', 'Música', 'Nutrição',
  'Pedagogia', 'Química', 'Química Industrial', 'Serviço Social', 'Turismo',
];
const COURSE_OPTIONS = COURSES.map((c) => `<option value="${c}">${c}</option>`).join('');

const icon = (inner, size = 18) =>
  `<svg class="icon icon-${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${inner}</svg>`;

const ICONS = {
  bell: icon('<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>'),
  users: icon('<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>'),
  user: icon('<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>'),
  pencil: icon('<path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>', 14),
};

function authHeaders() {
  const headers = { 'Content-Type': 'application/json' };
  if (state.session) headers.Authorization = 'Bearer ' + state.session;
  return headers;
}

function applyProfile(p) {
  state.name = p.name || state.name;
  state.email = p.email || state.email;
  state.photo = p.photo || '';
  state.course = p.course || '';
  localStorage.setItem('ru_name', state.name);
  localStorage.setItem('ru_email', state.email);
  localStorage.setItem('ru_photo', state.photo);
  localStorage.setItem('ru_course', state.course);
  const pb = $('#profileBtn');
  pb.textContent = '';
  if (state.photo) {
    const img = document.createElement('img');
    img.src = state.photo;
    img.alt = 'perfil';
    pb.appendChild(img);
  } else {
    pb.innerHTML = ICONS.user;
  }
  pb.classList.remove('hidden');
  $('#logoutBtn').classList.remove('hidden');
  $('#announceBtn').classList.remove('hidden');
  $('#friendsBtn').classList.remove('hidden');
  $('#scopeBar').classList.remove('hidden');
  syncScopeTabs();
  $('#brandSub').textContent = `oi, ${state.name.split(' ')[0]} 👋`;
}

function setGreeting() {
  $('#brandSub').textContent = `oi, ${state.name.split(' ')[0]} 👋`;
}

function logout() {
  localStorage.removeItem('ru_session');
  localStorage.removeItem('ru_name');
  localStorage.removeItem('ru_email');
  localStorage.removeItem('ru_photo');
  localStorage.removeItem('ru_course');
  openLogin();
}

function openLogin() {
  state.session = '';
  state.name = '';
  state.email = '';
  state.photo = '';
  state.course = '';
  state.groups = [];
  state.groupId = '';
  state.announceGroup = '';
  $('#logoutBtn').classList.add('hidden');
  $('#profileBtn').classList.add('hidden');
  $('#announceBtn').classList.add('hidden');
  $('#friendsBtn').classList.add('hidden');
  $('#scopeBar').classList.add('hidden');
  $('#groupBar').classList.add('hidden');
  $('#emailOverlay').classList.remove('hidden');
  $('#gButton').innerHTML = '';
  $('#authError').classList.add('hidden');
  initGoogle();
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

async function getCurrentPush(reg) {
  const { publicKey } = await (await fetch('/api/vapid')).json();
  let sub = await reg.pushManager.getSubscription();
  const reset = !sub ||
    !sub.keys ||
    !sub.keys.p256dh ||
    !sub.keys.auth ||
    localStorage.getItem('ru_vapid') !== publicKey;
  if (sub && reset) {
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
  return sub;
}

async function storeSubscription(sub) {
  if (!sub || !state.email) return false;
  const resp = await fetch('/api/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...sub.toJSON(), email: state.email }),
  });
  return resp.ok;
}

async function enablePush() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
  if (typeof Notification !== 'undefined' && Notification.permission !== 'granted') return;
  if (!state.email) return;
  try {
    const reg = await navigator.serviceWorker.register('/sw.js');
    const sub = await getCurrentPush(reg);
    await storeSubscription(sub);
  } catch (err) {
    console.error('push falhou:', err);
  }
}

function isIOS() {
  return /iPhone|iPad|iPod/i.test(navigator.userAgent);
}

function isStandaloneApp() {
  return (typeof navigator.standalone !== 'undefined' && navigator.standalone === true) ||
    window.matchMedia('(display-mode: standalone)').matches;
}

function canPush() {
  return 'Notification' in window && 'serviceWorker' in navigator;
}

function openNotifs() {
  $('#notifOverlay').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
  renderNotifState();
}

function closeNotifs() {
  $('#notifOverlay').classList.add('hidden');
  document.body.style.overflow = '';
}

function renderNotifState() {
  const hint = $('#notifHint');
  const btn = $('#notifEnable');
  const test = $('#notifTest');
  const dot = $('#notifDot');
  hint.classList.add('hidden');
  test.classList.add('hidden');
  dot.classList.add('hidden');
  btn.classList.remove('hidden');
  btn.textContent = 'Ativar notificações';
  if (!('Notification' in window) || !('serviceWorker' in navigator)) {
    $('#notifStatus').textContent = 'Seu navegador não suporta notificações.';
    btn.classList.add('hidden');
    return;
  }
  if (Notification.permission === 'granted') {
    $('#notifStatus').textContent = 'Notificações ativas neste navegador.';
    btn.textContent = 'Verificar / atualizar inscrição';
    test.classList.remove('hidden');
  } else if (Notification.permission === 'denied') {
    $('#notifStatus').textContent = 'Notificações bloqueadas neste navegador.';
    hint.textContent = 'Libere as notificações nas configurações do navegador (ícone de cadeado ao lado do endereço) e volte aqui para ativar.';
    hint.classList.remove('hidden');
    return;
  } else {
    $('#notifStatus').textContent = 'Ative para receber cardápio, pedidos de amizade e amigos indo ao RU.';
    if (canPush()) dot.classList.remove('hidden');
  }
  if (!isIOS()) return;
  if (!isStandaloneApp()) {
    hint.textContent = 'No iPhone/iPad o Safari só envia notificações em apps instalados: toque em Compartilhar ➜ “Adicionar à Tela de Início”, abra o app instalado e ative aqui.';
    hint.classList.remove('hidden');
  } else {
    hint.textContent = 'App instalado! Toque em “Ativar notificações” e permita.';
    hint.classList.remove('hidden');
  }
}

function shortErr(err) {
  const msg = String(err && err.name || err && err.message || err) || 'erro desconhecido';
  if (/InvalidAccess|InvalidCharacter/i.test(msg)) {
    return 'Chave VAPID do servidor inválida. Configure VAPID_PUBLIC_KEY e VAPID_PRIVATE_KEY corretas no Render.';
  }
  if (/NotAllowed|abort|SecurityError/i.test(msg)) {
    return 'Permissão de notificação não permitida neste Safari. Abra pelo ícone instalado.';
  }
  return 'Erro de ativação: ' + msg.slice(0, 140);
}

async function enableNotifs() {
  const btn = $('#notifEnable');
  if (!('Notification' in window) || !('serviceWorker' in navigator)) {
    toast('Seu navegador não suporta notificações.');
    return;
  }
  btn.disabled = true;
  const old = btn.textContent;
  btn.textContent = 'Ativando…';
  if (isIOS() && !isStandaloneApp()) {
    renderNotifState();
    toast('No iPhone, instale o app primeiro: Compartilhar ➜ Adicionar à Tela de Início.');
    btn.disabled = false;
    btn.textContent = old;
    return;
  }
  const perm = await Notification.requestPermission();
  if (perm !== 'granted') {
    renderNotifState();
    toast('Permissão não concedida.');
    btn.disabled = false;
    btn.textContent = old;
    return;
  }
  try {
    let reg;
    if (navigator.serviceWorker.controller) {
      reg = await navigator.serviceWorker.ready;
    } else {
      reg = await navigator.serviceWorker.register('/sw.js');
    }
    const sub = await getCurrentPush(reg);
    const ok = await storeSubscription(sub);
    if (ok) {
      toast('Notificações ativadas!');
      enablePush();
    } else {
      toast('Não foi possível registrar este navegador (inscrição não aceita). Tente de novo.');
    }
  } catch (err) {
    console.error('push falhou:', err);
    toast(shortErr(err));
  }
  renderNotifState();
  btn.disabled = false;
  btn.textContent = old;
}

async function sendTestPush() {
  const btn = $('#notifTest');
  btn.disabled = true;
  btn.textContent = 'Enviando…';
  try {
    if (canPush() && Notification.permission === 'granted' && state.email) {
      try {
        const reg = navigator.serviceWorker.controller
          ? await navigator.serviceWorker.ready
          : await navigator.serviceWorker.register('/sw.js');
        const sub = await getCurrentPush(reg);
        await storeSubscription(sub);
      } catch (err) {
        console.error('reparo de sub falhou:', err);
        return toast(shortErr(err));
      }
    }
    const resp = await fetch('/api/test-push', { method: 'POST', headers: authHeaders() });
    if (resp.status === 401) return handleAuthExpired();
    const j = await resp.json();
    if (j.total === 0) {
      toast('Sem inscrição de push. Toque em Ativar e permita a notificação.');
    } else if (j.ok > 0) {
      toast('Notificação de teste enviada! Confira seu celular.');
    } else {
      const codes = (j.errorCodes || []).join(',');
      if (codes.includes(401) || /VAPID|mismatch/i.test((j.errors || []).join(' '))) {
        toast('Chave push desatualizada: toque em Ativar para regenerar a inscrição.');
      } else {
        toast('Falhou (código ' + codes + '): ' + ((j.errors || [])[0] || 'erro desconhecido'));
      }
    }
  } catch {
    toast('Falha ao enviar teste.');
  }
  btn.disabled = false;
  btn.textContent = 'Enviar notificação de teste';
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
    let query = '';
    if (state.scope === 'friends' || state.scope === 'me') query = '?scope=' + state.scope;
    else if (state.scope === 'group' && state.groupId) query = '?scope=group&groupId=' + encodeURIComponent(state.groupId);
    const resp = await fetch('/api/announcements' + query, { headers: authHeaders() });
    if (resp.status === 401) return handleAuthExpired();
    if (resp.status === 403) {
      state.scope = 'all';
      localStorage.setItem('ru_scope', 'all');
      syncScopeTabs();
      return;
    }
    list = await resp.json();
  } catch {
  }
  list.sort((a, b) => new Date(a.arrive) - new Date(b.arrive) || new Date(a.announceAt) - new Date(b.announceAt));

  const container = $('#timeline');
  container.innerHTML = '';
  const empty = $('#empty');
  const emptyTitle = empty.querySelector('p');
  const emptySub = empty.querySelector('.sub');
  if (state.scope === 'friends') {
    emptyTitle.textContent = 'Nada dos seus amigos por aqui.';
    emptySub.textContent = 'Peça para eles anunciarem — ou adicione mais amigos.';
  } else if (state.scope === 'me') {
    emptyTitle.textContent = 'Você ainda não anunciou nada.';
    emptySub.textContent = 'Toque em + Anunciar para avisar o pessoal.';
  } else if (state.scope === 'group') {
    emptyTitle.textContent = 'Ninguém anunciou neste grupo ainda.';
    emptySub.textContent = 'Toque em + Anunciar e escolha o grupo.';
  } else {
    emptyTitle.textContent = 'Ninguém anunciou ainda.';
    emptySub.textContent = 'Quando for, toque em + Anunciar para avisar o pessoal.';
  }
  empty.classList.toggle('hidden', list.length > 0);

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
    if (a.photo) {
      const img = document.createElement('img');
      img.src = a.photo;
      img.alt = a.name;
      img.referrerPolicy = 'no-referrer';
      avatar.appendChild(img);
    } else {
      avatar.textContent = a.name.trim().charAt(0).toUpperCase();
    }

    const info = document.createElement('div');
    info.className = 'info';
    const name = document.createElement('div');
    name.className = 'name';
    name.textContent = a.name;
    const when = document.createElement('div');
    when.className = 'when';
    when.textContent = `Vai comer no RU ${a.label}`;
    info.append(name, when);
    if (a.groupName) {
      const gtag = document.createElement('div');
      gtag.className = 'course';
      gtag.textContent = a.groupName;
      info.appendChild(gtag);
    }
    if (a.course) {
      const course = document.createElement('div');
      course.className = 'course';
      course.textContent = a.course;
      info.appendChild(course);
    }

    const clock = document.createElement('div');
    clock.className = 'clock';
    clock.textContent = fmtClock(a.arrive);

    card.append(avatar, info, clock);
    if (a.email === state.email) {
      const edit = document.createElement('button');
      edit.className = 'edit-ann';
      edit.innerHTML = ICONS.pencil;
      edit.title = 'Editar horário';
      edit.addEventListener('click', () => openEditModal(a));
      card.appendChild(edit);
    }

    const joins = Array.isArray(a.joins) ? a.joins : [];
    const iJoined = joins.some((j) => j.email === state.email);

    const foot = document.createElement('div');
    foot.className = 'ann-foot';
    const avs = document.createElement('div');
    avs.className = 'joins';
    const show = joins.slice(0, 6);
    for (const j of show) {
      const av = document.createElement('span');
      av.className = 'join-av';
      av.title = j.name;
      if (j.photo) {
        const im = document.createElement('img');
        im.src = j.photo;
        im.alt = j.name;
        im.referrerPolicy = 'no-referrer';
        av.appendChild(im);
      } else {
        av.textContent = String(j.name || '?').trim().charAt(0).toUpperCase();
      }
      avs.appendChild(av);
    }
    if (joins.length > show.length) {
      const more = document.createElement('span');
      more.className = 'join-more';
      more.textContent = `+${joins.length - show.length}`;
      avs.appendChild(more);
    }
    if (avs.children.length) foot.appendChild(avs);
    if (a.email === state.email) {
      const cnt = document.createElement('span');
      cnt.className = 'join-count';
      cnt.textContent = joins.length
        ? `${joins.length} ${joins.length === 1 ? 'pessoa vai' : 'pessoas vão'} junto`
        : 'Você anunciou. A galera pode se unir aqui.';
      foot.appendChild(cnt);
    } else {
      const btn = document.createElement('button');
      if (iJoined) {
        btn.className = 'mini-act joined';
        btn.innerHTML = icon('<polyline points="20 6 9 17 4 12"/>', 14) + ' Você vai';
        btn.addEventListener('click', () => unjoinEvent(a.id));
      } else {
        btn.className = 'mini-act primary';
        btn.textContent = 'Vou junto';
        btn.addEventListener('click', () => joinEvent(a.id));
      }
      foot.appendChild(btn);
    }
    card.appendChild(foot);
    container.appendChild(card);
  }
}

function arrival() {
  const now = Date.now();
  const [h, m] = state.exact.split(':').map(Number);
  const d = new Date();
  d.setHours(h || 0, m || 0, 0, 0);
  if (d.getTime() <= now) d.setDate(d.getDate() + 1);
  return { when: 'exact', arrive: d.toISOString(), label: `às ${state.exact}` };
}

function syncModal() {
  $('#exactTime').value = state.exact;
  syncGroupSelect();
  $('#preview').textContent = `Você vai comer no RU ${arrival().label}`;
}

function syncGroupSelect() {
  const sel = $('#announceGroup');
  if (!sel) return;
  const prev = state.announceGroup || (state.scope === 'group' ? state.groupId : '');
  sel.innerHTML = '<option value="">Todos (feed geral)</option>';
  for (const g of state.groups) {
    const o = document.createElement('option');
    o.value = g.id;
    o.textContent = g.name;
    sel.appendChild(o);
  }
  sel.value = prev;
  state.announceGroup = sel.value;
}

function openModal() {
  state.editingId = '';
  $('#announceTitle').textContent = 'Vou comer no RU…';
  $('#announceGroupWrap').classList.remove('hidden');
  if (!state.groups.length) fetchMyGroups();
  syncModal();
  $('#modal').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function openEditModal(a) {
  state.editingId = a.id;
  $('#announceTitle').textContent = 'Editar horário';
  $('#announceGroupWrap').classList.add('hidden');
  const d = new Date(a.arrive);
  state.exact = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
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
  const payload = { when: r.when, arrive: r.arrive, label: r.label };
  if (!state.editingId && state.announceGroup) payload.groupId = state.announceGroup;
  const isEdit = !!state.editingId;
  $('#confirmBtn').textContent = 'Enviando…';
  $('#confirmBtn').disabled = true;
  try {
    const resp = await fetch(isEdit ? `/api/announce/${state.editingId}` : '/api/announce', {
      method: isEdit ? 'PUT' : 'POST',
      headers: authHeaders(),
      body: JSON.stringify(payload),
    });
    if (resp.status === 401) return handleAuthExpired();
    if (!resp.ok) throw new Error('invalid');
    state.editingId = '';
    closeModal();
    toast(isEdit ? 'Horário atualizado!' : 'Aviso enviado!');
    renderTimeline();
  } catch {
    toast('Falha ao enviar. Tente de novo.');
  }
  $('#confirmBtn').textContent = 'Confirmar';
  $('#confirmBtn').disabled = false;
}

function start() {
  if (state.started) return;
  state.started = true;

  syncModal();

  $('#announceBtn').addEventListener('click', openModal);
  $('#cancelBtn').addEventListener('click', closeModal);
  $('#confirmBtn').addEventListener('click', confirmAnnounce);
  $('#exactTime').addEventListener('change', (e) => { state.exact = e.target.value; syncModal(); });

  $('#menuCancel').addEventListener('click', closeMenuModal);
  $('#menuNext').addEventListener('click', menuNext);
  $('#mealAlmoco').addEventListener('click', () => chooseMeal('almoço'));
  $('#mealJantar').addEventListener('click', () => chooseMeal('jantar'));
  $('#mealBack').addEventListener('click', () => goMenuStep(0));
  $('#previewBack').addEventListener('click', () => goMenuStep(0));
  $('#menuSave').addEventListener('click', saveMenu);
  $('#logoutBtn').addEventListener('click', logout);

  $('#notifBtn').addEventListener('click', openNotifs);
  $('#notifClose').addEventListener('click', closeNotifs);
  $('#notifEnable').addEventListener('click', enableNotifs);
  $('#notifTest').addEventListener('click', sendTestPush);

  $('#friendsBtn').addEventListener('click', openFriends);
  $('#friendsClose').addEventListener('click', closeFriends);
  $('#scopeAllBtn').addEventListener('click', () => setScope('all'));
  $('#scopeFriendsBtn').addEventListener('click', () => setScope('friends'));
  $('#scopeMeBtn').addEventListener('click', () => setScope('me'));
  $('#scopeGroupsBtn').addEventListener('click', () => setScope('group'));
  $('#groupCreate').addEventListener('click', createGroup);
  $('#groupJoin').addEventListener('click', joinGroup);
  $('#groupsClose').addEventListener('click', closeGroups);
  $('#announceGroup').addEventListener('change', (e) => { state.announceGroup = e.target.value; });
  $('#friendSearch').addEventListener('input', onFriendSearch);
  $('#friendsOverlay').addEventListener('click', (e) => {
    const btn = e.target.closest('.mini-act');
    if (btn && btn.dataset.action) friendAction(btn.dataset.action, btn.dataset.email);
  });
  syncScopeTabs();

  setInterval(renderTimeline, 30000);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) { renderTimeline(); renderMenu(); }
  });
  renderTimeline();
  renderMenu();
  fetchMyGroups();
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => {});
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
  const dm = text.match(/dia\s+(\d{1,2})\s*\/\s*(\d{1,2})\s*\/\s*(\d{4})/i);
  if (dm) {
    const d = Number(dm[1]);
    const m = Number(dm[2]);
    const y = Number(dm[3]);
    date = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    dateLabel = `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y} (${DAYS[new Date(y, m - 1, d).getDay()]})`;
  }
  const items = [];
  for (const line of lines) {
    if (/card[aá]pio\s+do\s+(alm[oô]ço|jantar)/i.test(line)) continue;
    const trimmed = line.trim();
    const lead = trimmed.replace(/^[•\-\s.]+/, '');
    const leadStars = (lead.match(/^\*+/) || [''])[0].length;
    const trailStars = (trimmed.match(/\*+$/) || [''])[0].length;
    const stars = Math.max(leadStars, trailStars);
    const clean = lead
      .replace(/^\*+/, '')
      .replace(/\*/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (!clean) continue;
    let type = '';
    if (stars >= 2) type = 'ref2';
    else if (stars === 1) type = 'ref1';
    else if (/^aviso\s*\d*\s*[:.\-]?\s*/i.test(clean)) type = 'ref1';
    items.push({
      text: clean,
      veg: /vegetariano/i.test(clean),
      type,
      mark: type === 'ref1' ? 1 : type === 'ref2' ? 2 : 0,
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
  const type = item.mark != null
    ? (item.mark >= 2 ? 'ref2' : item.mark === 1 ? 'ref1' : '')
    : (item.type === 'aviso' ? 'ref1' : item.type || (item.aviso ? 'ref1' : ''));
  if (type === 'ref1') {
    li.classList.add('ref-line');
    const s = document.createElement('span');
    s.className = 'tag aviso';
    s.textContent = 'aviso';
    li.appendChild(s);
  } else if (type === 'ref2') {
    li.classList.add('ref2-line');
  } else if (item.lactose) {
    const s = document.createElement('span');
    s.className = 'tag lac';
    s.textContent = 'lactose';
    li.appendChild(s);
  }
}

const MENU_STEPS = ['stepPaste', 'stepMeal', 'stepPreview'];

function goMenuStep(n) {
  for (let i = 0; i < MENU_STEPS.length; i++) {
    $(`#${MENU_STEPS[i]}`).classList.toggle('hidden', i !== n);
  }
  const sheet = $('#menuModal .sheet');
  if (sheet) sheet.scrollTop = 0;
}

function openMenuModal() {
  $('#menuText').value = '';
  state.pendingMenu = null;
  goMenuStep(0);
  $('#menuModal').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
  $('#menuText').focus();
}

function closeMenuModal() {
  $('#menuModal').classList.add('hidden');
  document.body.style.overflow = '';
}

function menuNext() {
  const p = parseMenuText($('#menuText').value);
  if (!p.items.length) {
    toast('Cole o cardápio primeiro.');
    return;
  }
  state.pendingMenu = p;
  goMenuStep(1);
}

function chooseMeal(meal) {
  state.pendingMenu.meal = meal;
  goMenuStep(2);
  renderMenuPreview();
}

function renderMenuPreview() {
  const p = state.pendingMenu;
  if (!p) return;
  const prev = $('#menuPreview');
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
  if (!p || !p.meal) return;
  $('#menuSave').textContent = 'Publicando…';
  $('#menuSave').disabled = true;
  try {
    const resp = await fetch('/api/menu', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({
        meal: p.meal,
        date: p.date,
        dateLabel: p.dateLabel,
        items: p.items,
      }),
    });
    if (resp.status === 401) return handleAuthExpired();
    if (!resp.ok) throw new Error('invalid');
    closeMenuModal();
    toast('Cardápio publicado!');
    renderMenu();
  } catch {
    toast('Falha ao publicar. Tente de novo.');
  }
  $('#menuSave').textContent = 'Publicar';
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
    card.className = 'card menu';
    const title = document.createElement('div');
    title.className = 'menu-title';
    title.textContent = 'Cardápio';
    const sub = document.createElement('p');
    sub.className = 'sub';
    sub.textContent = 'O cardápio de hoje vem do Telegram. Dá pra colar aqui pra todo mundo ver.';
    card.append(title, sub);
    if (canEditMenu()) {
      const btn = document.createElement('button');
      btn.className = 'primary with-icon';
      btn.innerHTML = icon('<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>', 16) + ' Adicionar cardápio';
      btn.onclick = () => openMenuModal();
      card.appendChild(btn);
    }
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
  title.textContent = 'Cardápio';
  const date = document.createElement('div');
  date.className = 'menu-date';
  const any = almoço || jantar;
  date.textContent = any ? any.dateLabel : day;
  titles.append(title, date);
  if (canEditMenu()) {
    const editBtn = document.createElement('button');
    editBtn.className = 'menu-edit';
    editBtn.innerHTML = ICONS.pencil;
    editBtn.title = 'Editar cardápio';
    editBtn.onclick = () => openMenuModal();
    head.append(titles, editBtn);
  } else {
    head.appendChild(titles);
  }
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

function syncScopeTabs() {
  $('#scopeAllBtn').classList.toggle('active', state.scope === 'all');
  $('#scopeFriendsBtn').classList.toggle('active', state.scope === 'friends');
  $('#scopeMeBtn').classList.toggle('active', state.scope === 'me');
  $('#scopeGroupsBtn').classList.toggle('active', state.scope === 'group');
  renderGroupBar();
}

function setScope(s) {
  state.scope = s;
  localStorage.setItem('ru_scope', s);
  syncScopeTabs();
  if (s === 'group') {
    if (state.groups.length && !state.groups.some((g) => g.id === state.groupId)) {
      state.groupId = state.groups[0].id;
    }
    fetchMyGroups();
  }
  renderTimeline();
}

function openFriends() {
  $('#friendsOverlay').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
  renderFriends();
  $('#friendSearch').focus();
}

function closeFriends() {
  $('#friendsOverlay').classList.add('hidden');
  document.body.style.overflow = '';
  $('#friendSearch').value = '';
  $('#friendResults').innerHTML = '';
}

async function renderFriends() {
  let data = { friends: [], incoming: [], outgoing: [] };
  try {
    const resp = await fetch('/api/friends', { headers: authHeaders() });
    if (resp.status === 401) return handleAuthExpired();
    if (!resp.ok) throw new Error('invalid');
    data = await resp.json();
  } catch {
    toast('Falha ao carregar amigos.');
  }
  const wrap = $('#friendSections');
  wrap.innerHTML = '';
  if (data.incoming.length) wrap.appendChild(friendSection('Pedidos de amizade', data.incoming, 'incoming'));
  if (data.friends.length) wrap.appendChild(friendSection('Meus amigos', data.friends, 'friend'));
  if (data.outgoing.length) wrap.appendChild(friendSection('Pedidos enviados', data.outgoing, 'outgoing'));
}

function friendSection(title, rows, kind) {
  const box = document.createElement('div');
  box.className = 'friend-group';
  const h = document.createElement('div');
  h.className = 'day-group';
  h.textContent = title;
  box.appendChild(h);
  for (const u of rows) box.appendChild(friendRow(u, kind));
  return box;
}

function friendRow(u, kind) {
  const row = document.createElement('div');
  row.className = 'friend-row';

  const av = document.createElement('span');
  av.className = 'avatar mini';
  if (u.photo) {
    const img = document.createElement('img');
    img.src = u.photo;
    img.alt = u.name;
    img.referrerPolicy = 'no-referrer';
    av.appendChild(img);
  } else {
    av.textContent = (u.name || u.email).trim().charAt(0).toUpperCase();
  }

  const info = document.createElement('div');
  info.className = 'f-info';
  const nm = document.createElement('div');
  nm.className = 'name';
  nm.textContent = u.name || u.email;
  const em = document.createElement('div');
  em.className = 'when';
  em.textContent = u.course ? `${u.email} · ${u.course}` : u.email;
  info.append(nm, em);

  const acts = document.createElement('div');
  acts.className = 'mini-acts';
  const mk = (txt, action, cls) => {
    const b = document.createElement('button');
    b.className = 'mini-act' + (cls ? ' ' + cls : '');
    b.dataset.email = u.email;
    b.dataset.action = action;
    b.textContent = txt;
    acts.appendChild(b);
  };
  if (kind === 'friend') mk('Remover', 'remove');
  else if (kind === 'incoming') { mk('Aceitar', 'accept', 'primary'); mk('Recusar', 'decline', 'ghost'); }
  else if (kind === 'outgoing') mk('Cancelar', 'cancel');
  else mk('Adicionar', 'add', 'primary');

  row.append(av, info, acts);
  return row;
}

let searchTimer = null;
function onFriendSearch(e) {
  clearTimeout(searchTimer);
  const q = e.target.value.trim();
  const box = $('#friendResults');
  box.innerHTML = '';
  if (!q) return;
  searchTimer = setTimeout(async () => {
    try {
      const resp = await fetch('/api/users?q=' + encodeURIComponent(q), { headers: authHeaders() });
      if (resp.status === 401) return handleAuthExpired();
      if (!resp.ok) throw new Error('invalid');
      const list = await resp.json();
      box.innerHTML = '';
      if (!list.length) {
        const p = document.createElement('p');
        p.className = 'sub friends-hint';
        p.textContent = 'Ninguém com esse nome ou e-mail por aqui.';
        box.appendChild(p);
        return;
      }
      for (const u of list) {
        const kind = u.state === 'friend' ? 'friend' : u.state === 'incoming' ? 'incoming' : u.state === 'outgoing' ? 'outgoing' : 'add';
        box.appendChild(friendRow(u, kind));
      }
    } catch {
      toast('Falha na busca.');
    }
  }, 300);
}

async function friendAction(action, email) {
  const opts = { method: 'POST', headers: authHeaders() };
  let url = '';
  if (action === 'add') url = '/api/friends';
  else if (action === 'accept' || action === 'decline') url = '/api/friends/' + action;
  else if (action === 'cancel' || action === 'remove') {
    url = '/api/friends/' + encodeURIComponent(email);
    opts.method = 'DELETE';
  }
  try {
    const resp = await fetch(url, { ...opts, body: JSON.stringify({ email }) });
    if (resp.status === 401) return handleAuthExpired();
    if (!resp.ok) {
      const j = await resp.json().catch(() => ({}));
      toast(j.error || 'Falha na ação.');
      return;
    }
    const msg =
      action === 'add' ? 'Pedido de amizade enviado!' :
      action === 'accept' ? 'Agora vocês são amigos!' :
      action === 'decline' ? 'Pedido recusado.' :
      action === 'cancel' ? 'Pedido cancelado.' : 'Amigo removido.';
    toast(msg);
    renderFriends();
    const q = $('#friendSearch').value.trim();
    if (q) onFriendSearch({ target: { value: q } });
    if (state.scope === 'friends') renderTimeline();
  } catch {
    toast('Falha. Tente de novo.');
  }
}

async function fetchMyGroups() {
  try {
    const resp = await fetch('/api/groups', { headers: authHeaders() });
    if (resp.status === 401) return handleAuthExpired();
    if (!resp.ok) return;
    state.groups = await resp.json();
  } catch {
  }
  if (state.scope === 'group' && state.groups.length && !state.groups.some((g) => g.id === state.groupId)) {
    state.groupId = state.groups[0].id;
  }
  renderGroupBar();
}

function renderGroupBar() {
  const bar = $('#groupBar');
  if (state.scope !== 'group') {
    bar.classList.add('hidden');
    bar.innerHTML = '';
    return;
  }
  bar.classList.remove('hidden');
  bar.innerHTML = '';
  for (const g of state.groups) {
    const b = document.createElement('button');
    b.className = 'tab' + (state.groupId === g.id ? ' active' : '');
    b.textContent = g.name;
    b.title = 'Código: ' + g.code;
    b.addEventListener('click', () => {
      state.groupId = g.id;
      syncScopeTabs();
      renderTimeline();
    });
    bar.appendChild(b);
  }
  const add = document.createElement('button');
  add.className = 'tab add-chip';
  add.textContent = '＋ Novo / Código';
  add.title = 'Criar grupo ou entrar com código';
  add.addEventListener('click', openGroups);
  bar.appendChild(add);
}

function openGroups() {
  $('#groupsOverlay').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
  renderGroupsList();
}

function closeGroups() {
  $('#groupsOverlay').classList.add('hidden');
  document.body.style.overflow = '';
}

async function renderGroupsList() {
  await fetchMyGroups();
  const wrap = $('#groupsList');
  wrap.innerHTML = '';
  if (!state.groups.length) {
    const p = document.createElement('p');
    p.className = 'sub friends-hint';
    p.textContent = 'Você ainda não está em nenhum grupo. Crie um acima ou entre com um código.';
    wrap.appendChild(p);
    return;
  }
  for (const g of state.groups) {
    const row = document.createElement('div');
    row.className = 'friend-row';

    const info = document.createElement('div');
    info.className = 'f-info';
    const nm = document.createElement('div');
    nm.className = 'name';
    nm.textContent = g.name;
    const em = document.createElement('div');
    em.className = 'when';
    em.textContent = `${g.description ? g.description + ' · ' : ''}${g.memberCount} membro(s) · Código: ${g.code}`;
    info.append(nm, em);

    const acts = document.createElement('div');
    acts.className = 'mini-acts';
    const btn = document.createElement('button');
    if (g.owner === state.email) {
      btn.className = 'mini-act ghost';
      btn.textContent = 'Excluir';
      btn.title = 'Exclui o grupo e todos os avisos dele';
      btn.addEventListener('click', () => deleteGroup(g.id));
    } else {
      btn.className = 'mini-act ghost';
      btn.textContent = 'Sair';
      btn.addEventListener('click', () => leaveGroup(g.id));
    }
    acts.appendChild(btn);

    row.append(info, acts);
    wrap.appendChild(row);
  }
}

async function createGroup() {
  const name = $('#groupName').value.trim();
  if (!name) return toast('Dê um nome ao grupo.');
  const btn = $('#groupCreate');
  btn.disabled = true;
  btn.textContent = 'Criando…';
  try {
    const resp = await fetch('/api/groups', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ name, description: $('#groupDesc').value.trim() }),
    });
    if (resp.status === 401) return handleAuthExpired();
    if (!resp.ok) {
      const j = await resp.json().catch(() => ({}));
      return toast(j.error || 'Falha ao criar grupo.');
    }
    const g = await resp.json();
    $('#groupName').value = '';
    $('#groupDesc').value = '';
    toast(`Grupo criado! Código: ${g.code}`);
    await fetchMyGroups();
    state.scope = 'group';
    state.groupId = g.id;
    localStorage.setItem('ru_scope', 'group');
    syncScopeTabs();
    renderGroupsList();
    renderTimeline();
  } catch {
    toast('Falha ao criar grupo.');
  }
  btn.disabled = false;
  btn.textContent = 'Criar grupo';
}

async function joinGroup() {
  const code = $('#groupCodeInput').value.trim().toUpperCase();
  if (!code) return toast('Digite o código.');
  const btn = $('#groupJoin');
  btn.disabled = true;
  btn.textContent = 'Entrando…';
  try {
    const resp = await fetch('/api/groups/join', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ code }),
    });
    if (resp.status === 401) return handleAuthExpired();
    if (!resp.ok) {
      const j = await resp.json().catch(() => ({}));
      return toast(j.error || 'Código inválido.');
    }
    const g = await resp.json();
    $('#groupCodeInput').value = '';
    toast(`Você entrou em ${g.name}!`);
    await fetchMyGroups();
    state.groupId = g.id;
    state.scope = 'group';
    localStorage.setItem('ru_scope', 'group');
    syncScopeTabs();
    renderGroupsList();
    renderTimeline();
  } catch {
    toast('Falha ao entrar no grupo.');
  }
  btn.disabled = false;
  btn.textContent = 'Entrar no grupo';
}

async function leaveGroup(id) {
  try {
    const resp = await fetch(`/api/groups/${id}/leave`, { method: 'POST', headers: authHeaders() });
    if (resp.status === 401) return handleAuthExpired();
    if (!resp.ok) {
      const j = await resp.json().catch(() => ({}));
      return toast(j.error || 'Falha ao sair do grupo.');
    }
    toast('Você saiu do grupo.');
    await fetchMyGroups();
    if (state.groupId === id) state.groupId = state.groups[0] ? state.groups[0].id : '';
    renderGroupsList();
    if (state.scope === 'group') renderTimeline();
  } catch {
    toast('Falha ao sair do grupo.');
  }
}

async function deleteGroup(id) {
  if (!confirm('Excluir o grupo e todos os avisos dele?')) return;
  try {
    const resp = await fetch(`/api/groups/${id}`, { method: 'DELETE', headers: authHeaders() });
    if (resp.status === 401) return handleAuthExpired();
    if (!resp.ok) {
      const j = await resp.json().catch(() => ({}));
      return toast(j.error || 'Falha ao excluir o grupo.');
    }
    toast('Grupo excluído.');
    await fetchMyGroups();
    if (state.groupId === id) state.groupId = state.groups[0] ? state.groups[0].id : '';
    renderGroupsList();
    if (state.scope === 'group') renderTimeline();
  } catch {
    toast('Falha ao excluir o grupo.');
  }
}

async function joinEvent(id) {
  try {
    const resp = await fetch(`/api/announce/${id}/join`, { method: 'POST', headers: authHeaders() });
    if (resp.status === 401) return handleAuthExpired();
    if (!resp.ok) {
      const j = await resp.json().catch(() => ({}));
      toast(j.error || 'Falha ao entrar.');
      return;
    }
    toast('Você vai junto!');
    renderTimeline();
  } catch {
    toast('Falha. Tente de novo.');
  }
}

async function unjoinEvent(id) {
  try {
    const resp = await fetch(`/api/announce/${id}/join`, { method: 'DELETE', headers: authHeaders() });
    if (resp.status === 401) return handleAuthExpired();
    if (!resp.ok) {
      const j = await resp.json().catch(() => ({}));
      toast(j.error || 'Falha ao sair.');
      return;
    }
    toast('Você saiu do aviso.');
    renderTimeline();
  } catch {
    toast('Falha. Tente de novo.');
  }
}

function handleAuthExpired() {
  toast('Sessão expirada. Entre de novo.');
  setTimeout(logout, 1200);
}

async function initGoogle() {
  let cfg;
  try {
    cfg = await (await fetch('/api/config')).json();
  } catch {
    return;
  }
  if (!cfg.googleClientId) {
    $('#authError').textContent = 'Login do Google ainda não configurado no servidor.';
    $('#authError').classList.remove('hidden');
    return;
  }
  if (typeof google === 'undefined' || !google.accounts) {
    setTimeout(() => initGoogle(), 300);
    return;
  }
  google.accounts.id.initialize({
    client_id: cfg.googleClientId,
    auto_select: false,
    callback: handleCredential,
  });
  google.accounts.id.renderButton(document.getElementById('gButton'), {
    theme: 'filled_black',
    size: 'large',
    shape: 'pill',
    text: 'continue_with',
    width: 290,
  });
}

async function handleCredential(response) {
  try {
    const resp = await fetch('/api/auth/google', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ credential: response.credential }),
    });
    if (resp.status === 401) {
      $('#authError').textContent = 'Essa conta não é da UFOP. Use seu e-mail @aluno.ufop.edu.br.';
      $('#authError').classList.remove('hidden');
      return;
    }
    if (!resp.ok) throw new Error('invalid');
    const data = await resp.json();
    state.session = data.token;
    localStorage.setItem('ru_session', data.token);
    applyProfile({ name: data.name, email: data.email, photo: data.photo, course: data.course });
    $('#emailOverlay').classList.add('hidden');
    if (data.needsCourse) {
      openCourseSheet(true);
    } else {
      start();
    }
  } catch {
    $('#authError').textContent = 'Falha ao entrar. Tente de novo.';
    $('#authError').classList.remove('hidden');
  }
}

async function bootstrap() {
  try {
    const resp = await fetch('/api/me', { headers: authHeaders() });
    if (resp.status === 401) return logout();
    if (!resp.ok) return start();
    const p = await resp.json();
    applyProfile(p);
    if (!p.course) return openCourseSheet(true);
    start();
  } catch {
    start();
  }
}

function fillCourseDatalist() {
  const el = $('#courseInput');
  el.innerHTML = `<option value="">Escolha seu curso…</option>${COURSE_OPTIONS}`;
}

function openCourseSheet(required) {
  state.pendingPhoto = '';
  const ov = $('#courseOverlay');
  const photo = $('#coursePhoto');
  if (state.photo) {
    photo.src = state.photo;
    photo.classList.remove('hidden');
    $('#coursePhotoFbk').classList.add('hidden');
  } else {
    photo.classList.add('hidden');
    $('#coursePhotoFbk').classList.remove('hidden');
  }
  $('#courseName').textContent = state.name;
  $('#courseMsg').textContent = required
    ? 'Conta pra gente seu curso pra confirmar.'
    : 'Seu perfil: mude a foto ou o curso quando quiser.';
  $('#courseInput').value = COURSES.includes(state.course) ? state.course : '';
  $('#courseError').classList.add('hidden');
  ov.classList.remove('hidden');
  $('#courseInput').focus();
}

function closeCourseSheet() {
  $('#courseOverlay').classList.add('hidden');
  if (!state.started) start();
}

async function saveCourse() {
  const course = $('#courseInput').value.trim();
  if (!course) {
    $('#courseError').textContent = 'Informe seu curso para continuar.';
    $('#courseError').classList.remove('hidden');
    return;
  }
  $('#courseError').classList.add('hidden');
  $('#courseSave').disabled = true;
  $('#courseSave').textContent = 'Salvando…';
  try {
    const resp = await fetch('/api/me', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ course, photo: state.pendingPhoto || state.photo }),
    });
    if (resp.status === 401) return handleAuthExpired();
    if (!resp.ok) throw new Error('invalid');
    const p = await resp.json();
    applyProfile(p);
    closeCourseSheet();
    toast('Perfil atualizado!');
  } catch {
    toast('Falha ao salvar. Tente de novo.');
  }
  $('#courseSave').textContent = 'Salvar';
  $('#courseSave').disabled = false;
}

$('#courseCancel').addEventListener('click', closeCourseSheet);
$('#courseSave').addEventListener('click', saveCourse);
$('#profileBtn').addEventListener('click', () => openCourseSheet(false));
$('#coursePhotoBtn').addEventListener('click', () => $('#coursePhotoFile').click());
$('#coursePhotoFile').addEventListener('change', (e) => {
  const file = e.target.files && e.target.files[0];
  if (!file) return;
  const img = new Image();
  const reader = new FileReader();
  reader.onload = () => {
    img.onload = () => {
      const size = 160;
      const canvas = document.createElement('canvas');
      const scale = Math.max(1, img.width / size, img.height / size);
      canvas.width = Math.round(img.width / scale);
      canvas.height = Math.round(img.height / scale);
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      state.pendingPhoto = canvas.toDataURL('image/jpeg', 0.85);
      $('#coursePhoto').src = state.pendingPhoto;
      $('#coursePhoto').classList.remove('hidden');
      $('#coursePhotoFbk').classList.add('hidden');
    };
    img.src = reader.result;
  };
  reader.readAsDataURL(file);
  e.target.value = '';
});

fillCourseDatalist();
bootstrap();

const logoImg = document.getElementById('logoImg');
if (logoImg) logoImg.addEventListener('load', () => logoImg.classList.add('loaded'));
