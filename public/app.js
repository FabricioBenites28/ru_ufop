const $ = (s) => document.querySelector(s);

const I18N = {
  pt: {
    greet: 'oi, {name}',
    brandSubDefault: 'quem vai comer?',
    logout: 'sair',
    creditsBtn: 'AUTORES',
    creditsTitle: 'AUTORES',
    creditsText: 'Mastermind: Jordana Roza (B. Jordan)<br>Creator: Fabricio Benites (Perú Power)',
    close: 'Fechar',
    cancel: 'Cancelar',
    confirm: 'Confirmar',
    save: 'Salvar',
    saving: 'Salvando…',
    back: 'Voltar',
    edit: 'Editar',
    remove: 'Remover',
    sending: 'Enviando…',
    welcomeTitle: 'Bem-vindo ao RU',
    welcomeSub: 'Entre com sua conta da UFOP.<br>Somente e-mails @aluno.ufop.edu.br.',
    googleNotConfigured: 'Login do Google ainda não configurado no servidor.',
    notUfop: 'Essa conta não é da UFOP. Use seu e-mail @aluno.ufop.edu.br.',
    loginFailed: 'Falha ao entrar. Tente de novo.',
    coursePlaceholder: 'Escolha seu curso…',
    courseRequiredMsg: 'Conta pra gente seu curso pra confirmar.',
    courseEditMsg: 'Seu perfil: mude a foto ou o curso quando quiser.',
    courseError: 'Informe seu curso para continuar.',
    courseSaved: 'Perfil atualizado!',
    courseSaveFailed: 'Falha ao salvar. Tente de novo.',
    changePhoto: 'Mudar foto',
    profileTitle: 'Meu perfil',
    language: 'Idioma',
    langPt: 'Português',
    langEn: 'English',
    navLabel: 'Navegação',
    navAll: 'Todos',
    navFriends: 'Amigos',
    navGroups: 'Grupos',
    navMenu: 'Cardápio',
    announce: 'Anunciar',
    announceTitle: 'Vou comer no RU…',
    editTime: 'Editar horário',
    labelAt: 'às',
    previewGoing: 'Você vai comer no RU {label}',
    groupAllFeed: 'Todos (feed geral)',
    hoursSub: 'Segunda a sexta · 10:30–13:30 ou 18:00–19:30.',
    timeInvalid: 'Escolha um horário entre {windows}.',
    announceSent: 'Aviso enviado!',
    announceUpdated: 'Horário atualizado!',
    announceFailed: 'Falha ao enviar. Tente de novo.',
    goToRU: 'Vai comer no RU {label}',
    peopleGoingOne: '{n} pessoa vai',
    peopleGoingMany: '{n} pessoas vão junto',
    youAnnounced: 'Você anunciou. A galera pode se unir aqui.',
    joinBtn: 'Vou junto',
    joinedBtn: 'Você vai',
    joinToast: 'Você vai junto!',
    leftAnnounce: 'Você saiu do aviso.',
    arrivedBtn: 'Cheguei ao RU',
    arrivedDone: 'Você chegou',
    arrivedSent: 'Aviso enviado! Todos que vão ficam sabendo.',
    arrivedFailed: 'Falha ao avisar que você chegou.',
    emptyAll: 'Ninguém anunciou ainda.',
    emptyAllSub: 'Quando for, toque em + Anunciar para avisar o pessoal.',
    emptyFriends: 'Nada dos seus amigos por aqui.',
    emptyFriendsSub: 'Peça para eles anunciarem — ou adicione mais amigos.',
    emptyMe: 'Você ainda não anunciou nada.',
    emptyMeSub: 'Toque em + Anunciar para avisar o pessoal.',
    emptyGroup: 'Ninguém anunciou neste grupo ainda.',
    emptyGroupSub: 'Toque em + Anunciar e escolha o grupo.',
    dayToday: 'Hoje',
    dayTomorrow: 'Amanhã',
    menuTitle: 'Cardápio',
    menuEmptySub: 'O cardápio de hoje vem do Telegram. Dá pra colar aqui pra todo mundo ver.',
    addMenu: 'Adicionar cardápio',
    editMenu: 'Editar cardápio',
    menuOfDay: 'Cardápio do dia',
    menuPasteHint: 'Cole o cardápio. Linhas que começam com AVISO 1: viram aviso; pratos com * ou ** no final destacam na mesma cor do aviso.',
    menuPastePh: 'Cardápio do Jantar - Dia 17/09/2026 (Quinta-feira)\n\n- Cubos de lombo ao molho escuro\n- Arroz branco\n- Arroz integral\n- Feijão\n- Sopa de moranga\n- Vegetariano: hambúrguer de lentilha*\n- Macarrão ao queijo**\n- AVISO 1: *Contém OVO e GLÚTEN*\n- AVISO 2: *Contém LACTOSE e GLÚTEN**',
    pasteFirst: 'Cole o cardápio primeiro.',
    whichMeal: 'Qual refeição?',
    whichMealSub: 'Escolha para qual horário é esse cardápio.',
    continue: 'Continuar',
    lunch: 'Almoço',
    dinner: 'Jantar',
    menuPreviewTitle: 'Prévia do cardápio',
    publish: 'Publicar',
    publishing: 'Publicando…',
    menuPublished: 'Cardápio publicado!',
    menuPublishFailed: 'Falha ao publicar. Tente de novo.',
    noMenuMeal: 'Ainda não tem cardápio desse horário.',
    itemCount: '{n} itens',
    friendsTitle: 'Amigos',
    friendsSub: 'Adicione colegas para ver os avisos só deles no feed Amigos.',
    searchFriendsPh: 'Buscar por e-mail ou nome…',
    friendReq: 'Pedidos de amizade',
    myFriends: 'Meus amigos',
    requestsSent: 'Pedidos enviados',
    accept: 'Aceitar',
    decline: 'Recusar',
    add: 'Adicionar',
    cancelReq: 'Cancelar',
    removeFriend: 'Remover',
    noOneFound: 'Ninguém com esse nome ou e-mail por aqui.',
    searchFailed: 'Falha na busca.',
    friendsLoadFailed: 'Falha ao carregar amigos.',
    requestSent: 'Pedido de amizade enviado!',
    nowFriends: 'Agora vocês são amigos!',
    requestDeclined: 'Pedido recusado.',
    requestCancelled: 'Pedido cancelado.',
    friendRemoved: 'Amigo removido.',
    actionFailed: 'Falha. Tente de novo.',
    groupsTitle: 'Grupos',
    groupsSub: 'Crie um grupo e compartilhe o código com os colegas para eles entrarem. Só o criador vê o código e pode remover membros. Todo membro pode anunciar.',
    yourGroups: 'Seus grupos',
    createGroup: 'Criar grupo',
    groupNamePh: 'Nome do grupo (ex: Turma 2026)…',
    groupDescPh: 'Descrição (opcional)…',
    joinCode: 'Entrar com código',
    joinGroupBtn: 'Entrar no grupo',
    codePh: 'Código (ex: ABC234)…',
    creating: 'Criando…',
    joining: 'Entrando…',
    noGroups: 'Você ainda não está em nenhum grupo. Crie um acima ou entre com um código.',
    groupNameRequired: 'Dê um nome ao grupo.',
    groupCreated: 'Grupo criado! Código: {code}',
    groupCreateFailed: 'Falha ao criar grupo.',
    codeRequired: 'Digite o código.',
    enteredGroup: 'Você entrou em {name}!',
    joinFailed: 'Falha ao entrar no grupo.',
    leftGroup: 'Você saiu do grupo.',
    leaveFailed: 'Falha ao sair do grupo.',
    deleteGroup: 'Excluir',
    deleteHint: 'Exclui o grupo e todos os avisos dele',
    leave: 'Sair',
    membersLabel: 'Membros',
    memberOne: '{n} membro',
    memberMany: '{n} membros',
    codeLabel: 'Código: {code}',
    creatorLabel: '(criador)',
    memberRemoved: 'Membro removido do grupo.',
    memberRemovedFailed: 'Falha ao remover o membro.',
    deleteGroupConfirm: 'Excluir o grupo e todos os avisos dele?',
    groupDeleted: 'Grupo excluído.',
    deleteFailed: 'Falha ao excluir o grupo.',
    newOrCode: '＋ Novo / Código',
    notifTitle: 'Notificações',
    notifUnsupported: 'Seu navegador não suporta notificações.',
    notifActive: 'Notificações ativas neste navegador.',
    notifVerify: 'Verificar / atualizar inscrição',
    notifDenied: 'Notificações bloqueadas neste navegador.',
    notifDeniedHint: 'Libere as notificações nas configurações do navegador (ícone de cadeado ao lado do endereço) e volte aqui para ativar.',
    notifEnableMsg: 'Ative para receber cardápio, pedidos de amizade e amigos indo ao RU.',
    notifIosHint: 'No iPhone/iPad o Safari só envia notificações em apps instalados: toque em Compartilhar ➜ "Adicionar à Tela de Início", abra o app instalado e ative aqui.',
    notifIosStandaloneHint: 'App instalado! Toque em "Ativar notificações" e permita.',
    notifEnable: 'Ativar notificações',
    notifActivating: 'Ativando…',
    notifTest: 'Enviar notificação de teste',
    notifSending: 'Enviando…',
    notifTestSent: 'Notificação de teste enviada! Confira seu celular.',
    notifNoSub: 'Sem inscrição de push. Toque em Ativar e permita a notificação.',
    notifEnabled: 'Notificações ativadas!',
    notifRegisterFailed: 'Não foi possível registrar este navegador (inscrição não aceita). Tente de novo.',
    notifPermDenied: 'Permissão não concedida.',
    notifIosFirst: 'No iPhone, instale o app primeiro: Compartilhar ➜ Adicionar à Tela de Início.',
    notifStaleKey: 'Chave push desatualizada: toque em Ativar para regenerar a inscrição.',
    notifTestFailed: 'Falhou (código {codes}): {err}',
    notifTestFailGeneric: 'Falha ao enviar teste.',
    notifVapidInvalid: 'Chave VAPID do servidor inválida. Configure VAPID_PUBLIC_KEY e VAPID_PRIVATE_KEY corretas no Render.',
    notifSafariBlock: 'Permissão de notificação não permitida neste Safari. Abra pelo ícone instalado.',
    notifActivationErr: 'Erro de ativação: {msg}',
    notifListMenu: 'Cardápio do dia publicado',
    notifListFriendReq: 'Alguém te manda um pedido de amizade',
    notifListFriendGoing: 'Um amigo anuncia que vai ao RU',
    notifListJoin: 'Alguém se une a um aviso seu',
    sessionExpired: 'Sessão expirada. Entre de novo.',
    logoutTitle: 'Trocar de conta',
    groupBarAddTitle: 'Criar grupo ou entrar com código',
    unknownError: 'erro desconhecido',
    invalidCode: 'Código inválido.',
    enterFailed: 'Falha ao entrar.',
    unjoinFailed: 'Falha ao sair.',
    tagVeg: 'vegetariano',
    tagWarn: 'aviso',
    tagLac: 'lactose',
  },
  en: {
    greet: 'hi, {name}',
    brandSubDefault: "who's eating?",
    logout: 'logout',
    creditsBtn: 'AUTHORS',
    creditsTitle: 'AUTHORS',
    creditsText: 'Mastermind: Jordana Roza (B. Jordan)<br>Creator: Fabricio Benites (Perú Power)',
    close: 'Close',
    cancel: 'Cancel',
    confirm: 'Confirm',
    save: 'Save',
    saving: 'Saving…',
    back: 'Back',
    edit: 'Edit',
    remove: 'Remove',
    sending: 'Sending…',
    welcomeTitle: 'Welcome to the RU',
    welcomeSub: 'Sign in with your UFOP account.<br>Only @aluno.ufop.edu.br emails.',
    googleNotConfigured: 'Google login is not configured on the server yet.',
    notUfop: "That account is not UFOP. Use your @aluno.ufop.edu.br email.",
    loginFailed: 'Failed to sign in. Try again.',
    coursePlaceholder: 'Choose your course…',
    courseRequiredMsg: 'Tell us your course to confirm.',
    courseEditMsg: 'Your profile: change your photo or course anytime.',
    courseError: 'Enter your course to continue.',
    courseSaved: 'Profile updated!',
    courseSaveFailed: 'Failed to save. Try again.',
    changePhoto: 'Change photo',
    profileTitle: 'My profile',
    language: 'Language',
    langPt: 'Português',
    langEn: 'English',
    navLabel: 'Navigation',
    navAll: 'Everyone',
    navFriends: 'Friends',
    navGroups: 'Groups',
    navMenu: 'Menu',
    announce: 'Announce',
    announceTitle: 'Going to eat at the RU…',
    editTime: 'Edit time',
    labelAt: 'at',
    previewGoing: "You'll eat at the RU {label}",
    groupAllFeed: 'Everyone (general feed)',
    hoursSub: 'Mon–Fri · 10:30 AM–1:30 PM or 6 PM–7:30 PM.',
    timeInvalid: 'Pick a time between {windows}.',
    announceSent: 'Announcement sent!',
    announceUpdated: 'Time updated!',
    announceFailed: 'Failed to send. Try again.',
    goToRU: 'Going to the RU {label}',
    peopleGoingOne: '{n} person going',
    peopleGoingMany: '{n} people going',
    youAnnounced: 'You announced it. Friends can join here.',
    joinBtn: 'Count me in',
    joinedBtn: "You're in",
    joinToast: "You're in!",
    leftAnnounce: 'You left this announcement.',
    arrivedBtn: 'I arrived at the RU',
    arrivedDone: 'You arrived',
    arrivedSent: 'Sent! Everyone going now knows you arrived.',
    arrivedFailed: "Failed to let them know you arrived.",
    emptyAll: 'No one has announced yet.',
    emptyAllSub: 'Heading there? Tap + Announce to let everyone know.',
    emptyFriends: 'Nothing from your friends here.',
    emptyFriendsSub: 'Ask them to announce — or add more friends.',
    emptyMe: "You haven't announced anything yet.",
    emptyMeSub: 'Tap + Announce to let everyone know.',
    emptyGroup: 'No one has announced in this group yet.',
    emptyGroupSub: 'Tap + Announce and pick the group.',
    dayToday: 'Today',
    dayTomorrow: 'Tomorrow',
    menuTitle: 'Menu',
    menuEmptySub: "Today's menu comes from Telegram. Paste it here so everyone can see it.",
    addMenu: 'Add menu',
    editMenu: 'Edit menu',
    menuOfDay: "Today's menu",
    menuPasteHint: 'Paste the menu. Lines starting with AVISO 1 become warnings; dishes ending with * or ** get highlighted in the warning color.',
    menuPastePh: 'Dinner menu - Day 17/09/2026 (Thursday)\n\n- Cubos de lombo ao molho escuro\n- Arroz branco\n- Arroz integral\n- Feijão\n- Sopa de moranga\n- Vegetariano: hambúrguer de lentilha*\n- Macarrão ao queijo**\n- AVISO 1: *Contém OVO e GLÚTEN*\n- AVISO 2: *Contém LACTOSE e GLÚTEN**',
    pasteFirst: 'Paste the menu first.',
    whichMeal: 'Which meal?',
    whichMealSub: 'Pick the meal this menu is for.',
    continue: 'Continue',
    lunch: 'Lunch',
    dinner: 'Dinner',
    menuPreviewTitle: 'Menu preview',
    publish: 'Publish',
    publishing: 'Publishing…',
    menuPublished: 'Menu published!',
    menuPublishFailed: 'Failed to publish. Try again.',
    noMenuMeal: 'No menu for this meal yet.',
    itemCount: '{n} items',
    friendsTitle: 'Friends',
    friendsSub: 'Add classmates to see only their announcements in the Friends feed.',
    searchFriendsPh: 'Search by email or name…',
    friendReq: 'Friend requests',
    myFriends: 'My friends',
    requestsSent: 'Requests sent',
    accept: 'Accept',
    decline: 'Decline',
    add: 'Add',
    cancelReq: 'Cancel',
    removeFriend: 'Remove',
    noOneFound: 'No one with that name or email here.',
    searchFailed: 'Search failed.',
    friendsLoadFailed: 'Failed to load friends.',
    requestSent: 'Friend request sent!',
    nowFriends: "You're now friends!",
    requestDeclined: 'Request declined.',
    requestCancelled: 'Request cancelled.',
    friendRemoved: 'Friend removed.',
    actionFailed: 'Failed. Try again.',
    groupsTitle: 'Groups',
    groupsSub: 'Create a group and share the code so classmates can join. Only the creator sees the code and can remove members. Any member can announce.',
    yourGroups: 'Your groups',
    createGroup: 'Create group',
    groupNamePh: 'Group name (ex: Class 2026)…',
    groupDescPh: 'Description (optional)…',
    joinCode: 'Join with code',
    joinGroupBtn: 'Join group',
    codePh: 'Code (ex: ABC234)…',
    creating: 'Creating…',
    joining: 'Joining…',
    noGroups: "You're not in any group yet. Create one above or join with a code.",
    groupNameRequired: 'Give the group a name.',
    groupCreated: 'Group created! Code: {code}',
    groupCreateFailed: 'Failed to create group.',
    codeRequired: 'Enter the code.',
    enteredGroup: 'You joined {name}!',
    joinFailed: 'Failed to join group.',
    leftGroup: 'You left the group.',
    leaveFailed: 'Failed to leave group.',
    deleteGroup: 'Delete',
    deleteHint: 'Deletes the group and all its announcements',
    leave: 'Leave',
    membersLabel: 'Members',
    memberOne: '{n} member',
    memberMany: '{n} members',
    codeLabel: 'Code: {code}',
    creatorLabel: '(creator)',
    memberRemoved: 'Member removed from group.',
    memberRemovedFailed: 'Failed to remove member.',
    deleteGroupConfirm: 'Delete the group and all its announcements?',
    groupDeleted: 'Group deleted.',
    deleteFailed: 'Failed to delete group.',
    newOrCode: '＋ New / Code',
    notifTitle: 'Notifications',
    notifUnsupported: 'Your browser does not support notifications.',
    notifActive: 'Notifications active on this browser.',
    notifVerify: 'Check / update subscription',
    notifDenied: 'Notifications blocked on this browser.',
    notifDeniedHint: 'Enable notifications in your browser settings (padlock icon next to the address bar) and come back to activate.',
    notifEnableMsg: 'Turn on to get menu, friend requests and friends heading to the RU.',
    notifIosHint: 'On iPhone/iPad, Safari only sends notifications in installed apps: tap Share ➜ "Add to Home Screen", open the installed app and activate here.',
    notifIosStandaloneHint: 'App installed! Tap "Turn on notifications" and allow.',
    notifEnable: 'Turn on notifications',
    notifActivating: 'Activating…',
    notifTest: 'Send test notification',
    notifSending: 'Sending…',
    notifTestSent: 'Test notification sent! Check your phone.',
    notifNoSub: 'No push subscription. Tap Turn on and allow the notification.',
    notifEnabled: 'Notifications on!',
    notifRegisterFailed: "Couldn't register this browser (subscription not accepted). Try again.",
    notifPermDenied: 'Permission not granted.',
    notifIosFirst: 'On iPhone, install the app first: Share ➜ Add to Home Screen.',
    notifStaleKey: 'Stale push key: tap Turn on to regenerate the subscription.',
    notifTestFailed: 'Failed (code {codes}): {err}',
    notifTestFailGeneric: 'Failed to send test.',
    notifVapidInvalid: 'Invalid VAPID key on the server. Set correct VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY on Render.',
    notifSafariBlock: 'Notification permission not allowed on this Safari. Open it from the installed icon.',
    notifActivationErr: 'Activation error: {msg}',
    notifListMenu: 'Today menu published',
    notifListFriendReq: 'Someone sends you a friend request',
    notifListFriendGoing: 'A friend announces they are going to the RU',
    notifListJoin: 'Someone joins one of your announcements',
    sessionExpired: 'Session expired. Sign in again.',
    logoutTitle: 'Switch account',
    groupBarAddTitle: 'Create a group or join with a code',
    unknownError: 'unknown error',
    invalidCode: 'Invalid code.',
    enterFailed: "Couldn't join.",
    unjoinFailed: "Couldn't leave.",
    tagVeg: 'vegetarian',
    tagWarn: 'notice',
    tagLac: 'lactose',
  },
};

let lang = localStorage.getItem('ru_lang');
if (lang !== 'pt' && lang !== 'en') lang = (navigator.language || '').toLowerCase().startsWith('pt') ? 'pt' : 'en';

function t(key, params) {
  const table = I18N[lang] || I18N.pt;
  let s = table[key] !== undefined ? table[key] : I18N.pt[key] !== undefined ? I18N.pt[key] : key;
  if (params) for (const k of Object.keys(params)) s = s.split('{' + k + '}').join(String(params[k]));
  return s;
}

function dayNames() {
  return lang === 'en'
    ? ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    : ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
}

function applyStaticLang() {
  document.documentElement.lang = lang === 'en' ? 'en' : 'pt-BR';
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    el.textContent = t(el.getAttribute('data-i18n'));
  });
  document.querySelectorAll('[data-i18n-html]').forEach((el) => {
    el.innerHTML = t(el.getAttribute('data-i18n-html'));
  });
  document.querySelectorAll('[data-i18n-ph]').forEach((el) => {
    el.setAttribute('placeholder', t(el.getAttribute('data-i18n-ph')));
  });
  document.querySelectorAll('[data-i18n-title]').forEach((el) => {
    el.setAttribute('title', t(el.getAttribute('data-i18n-title')));
  });
  const langSel = document.getElementById('langSelect');
  if (langSel) langSel.value = lang;
}

function setLang(l) {
  lang = l === 'en' ? 'en' : 'pt';
  localStorage.setItem('ru_lang', lang);
  applyStaticLang();
  setGreeting();
  if (state.email) {
    syncModal();
    refreshActiveScope();
    renderNotifState();
    renderFriends();
    renderGroupsList();
    enablePush().catch(() => {});
  }
}
const TIME_WINDOWS = [
  { start: '10:30', end: '13:30', label: '10:30–13:30' },
  { start: '18:00', end: '19:30', label: '18:00–19:30' },
];

function toMinutes(t) {
  const [h, m] = String(t || '').split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

function validTime(t) {
  const min = toMinutes(t);
  return TIME_WINDOWS.some((w) => min >= toMinutes(w.start) && min <= toMinutes(w.end));
}

function timeInvalidMsg() {
  return t('timeInvalid', { windows: TIME_WINDOWS.map((w) => w.label).join(lang === 'en' ? ' or ' : ' ou ') });
}

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
  $('#announceBtn').classList.remove('hidden');
  $('#friendsBtn').classList.remove('hidden');
  $('#bottomNav').classList.remove('hidden');
  syncScopeTabs();
  setGreeting();
}

function setGreeting() {
  $('#brandSub').textContent = t('greet', { name: state.name.split(' ')[0] });
}

function logout() {
  localStorage.removeItem('ru_session');
  localStorage.removeItem('ru_name');
  localStorage.removeItem('ru_email');
  localStorage.removeItem('ru_photo');
  localStorage.removeItem('ru_course');
  $('#courseOverlay').classList.add('hidden');
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
  $('#profileBtn').classList.add('hidden');
  $('#announceBtn').classList.add('hidden');
  $('#friendsBtn').classList.add('hidden');
  $('#bottomNav').classList.add('hidden');
  $('#groupBar').classList.add('hidden');
  $('#emailOverlay').classList.remove('hidden');
  $('#gButton').innerHTML = '';
  $('#authError').classList.add('hidden');
  initGoogle();
}

function fmtClock(iso) {
  return new Date(iso).toLocaleTimeString(lang === 'en' ? 'en-US' : 'pt-BR', { hour: '2-digit', minute: '2-digit' });
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
    body: JSON.stringify({ ...sub.toJSON(), email: state.email, lang }),
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
  btn.textContent = t('notifEnable');
  if (!('Notification' in window) || !('serviceWorker' in navigator)) {
    $('#notifStatus').textContent = t('notifUnsupported');
    btn.classList.add('hidden');
    return;
  }
  if (Notification.permission === 'granted') {
    $('#notifStatus').textContent = t('notifActive');
    btn.textContent = t('notifVerify');
    test.classList.remove('hidden');
  } else if (Notification.permission === 'denied') {
    $('#notifStatus').textContent = t('notifDenied');
    hint.textContent = t('notifDeniedHint');
    hint.classList.remove('hidden');
    return;
  } else {
    $('#notifStatus').textContent = t('notifEnableMsg');
    if (canPush()) dot.classList.remove('hidden');
  }
  if (!isIOS()) return;
  if (!isStandaloneApp()) {
    hint.textContent = t('notifIosHint');
    hint.classList.remove('hidden');
  } else {
    hint.textContent = t('notifIosStandaloneHint');
    hint.classList.remove('hidden');
  }
}

function shortErr(err) {
  const msg = String(err && err.name || err && err.message || err) || t('unknownError');
  if (/InvalidAccess|InvalidCharacter/i.test(msg)) {
    return t('notifVapidInvalid');
  }
  if (/NotAllowed|abort|SecurityError/i.test(msg)) {
    return t('notifSafariBlock');
  }
  return t('notifActivationErr', { msg: msg.slice(0, 140) });
}

async function enableNotifs() {
  const btn = $('#notifEnable');
  if (!('Notification' in window) || !('serviceWorker' in navigator)) {
    toast(t('notifUnsupported'));
    return;
  }
  btn.disabled = true;
  const old = btn.textContent;
  btn.textContent = t('notifActivating');
  if (isIOS() && !isStandaloneApp()) {
    renderNotifState();
    toast(t('notifIosFirst'));
    btn.disabled = false;
    btn.textContent = old;
    return;
  }
  const perm = await Notification.requestPermission();
  if (perm !== 'granted') {
    renderNotifState();
    toast(t('notifPermDenied'));
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
      toast(t('notifEnabled'));
      enablePush();
    } else {
      toast(t('notifRegisterFailed'));
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
  btn.textContent = t('notifSending');
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
      toast(t('notifNoSub'));
    } else if (j.ok > 0) {
      toast(t('notifTestSent'));
    } else {
      const codes = (j.errorCodes || []).join(',');
      if (codes.includes(401) || /VAPID|mismatch/i.test((j.errors || []).join(' '))) {
        toast(t('notifStaleKey'));
      } else {
        toast(t('notifTestFailed', { codes, err: (j.errors || [])[0] || t('unknownError') }));
      }
    }
  } catch {
    toast(t('notifTestFailGeneric'));
  }
  btn.disabled = false;
  btn.textContent = t('notifTest');
}

function dayLabel(iso) {
  const d = new Date(iso);
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (d.toDateString() === today.toDateString()) return t('dayToday');
  if (d.toDateString() === tomorrow.toDateString()) return t('dayTomorrow');
  return `${dayNames()[d.getDay()]}, ${d.getDate()}/${d.getMonth() + 1}`;
}

async function renderTimeline() {
  if (state.scope === 'menu') return;
  const scope = state.scope;
  const groupId = state.groupId;
  let list = [];
  try {
    let query = '';
    if (scope === 'friends' || scope === 'me') query = '?scope=' + scope;
    else if (scope === 'group' && groupId) query = '?scope=group&groupId=' + encodeURIComponent(groupId);
    const resp = await fetch('/api/announcements' + query, { headers: authHeaders() });
    if (state.scope !== scope || (scope === 'group' && state.groupId !== groupId)) return;
    if (resp.status === 401) return handleAuthExpired();
    if (resp.status === 403) {
      state.scope = 'all';
      localStorage.setItem('ru_scope', 'all');
      syncScopeTabs();
      return;
    }
    list = await resp.json();
    if (state.scope !== scope || (scope === 'group' && state.groupId !== groupId)) return;
  } catch {
  }
  list.sort((a, b) => new Date(a.arrive) - new Date(b.arrive) || new Date(a.announceAt) - new Date(b.announceAt));

  const container = $('#timeline');
  container.innerHTML = '';
  const empty = $('#empty');
  const emptyTitle = empty.querySelector('p');
  const emptySub = empty.querySelector('.sub');
  if (state.scope === 'friends') {
    emptyTitle.textContent = t('emptyFriends');
    emptySub.textContent = t('emptyFriendsSub');
  } else if (state.scope === 'me') {
    emptyTitle.textContent = t('emptyMe');
    emptySub.textContent = t('emptyMeSub');
  } else if (state.scope === 'group') {
    emptyTitle.textContent = t('emptyGroup');
    emptySub.textContent = t('emptyGroupSub');
  } else {
    emptyTitle.textContent = t('emptyAll');
    emptySub.textContent = t('emptyAllSub');
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
    avatar.title = a.name;
    avatar.addEventListener('click', () => openProfileView(a.name || '', a.photo || '', a.email || ''));

    const info = document.createElement('div');
    info.className = 'info';
    const name = document.createElement('div');
    name.className = 'name';
    name.textContent = a.name;
    const when = document.createElement('div');
    when.className = 'when';
    when.textContent = t('goToRU', { label: a.label });
    info.append(name, when);
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
      edit.title = t('editTime');
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
      av.addEventListener('click', () => openProfileView(j.name || '', j.photo || '', j.email || ''));
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
        ? t(joins.length === 1 ? 'peopleGoingOne' : 'peopleGoingMany', { n: joins.length })
        : t('youAnnounced');
      foot.appendChild(cnt);
    } else {
      const btn = document.createElement('button');
      if (iJoined) {
        btn.className = 'mini-act joined';
        btn.innerHTML = icon('<polyline points="20 6 9 17 4 12"/>', 14) + ' ' + t('joinedBtn');
        btn.addEventListener('click', () => unjoinEvent(a.id));
      } else {
        btn.className = 'mini-act primary';
        btn.textContent = t('joinBtn');
        btn.addEventListener('click', () => joinEvent(a.id));
      }
      foot.appendChild(btn);
    }
    card.appendChild(foot);

    const stillOpen = new Date(a.arrive).getTime() > Date.now();
    const canArrive = stillOpen && (a.email === state.email || joins.some((j) => j.email === state.email));
    if (canArrive) {
      const arrivedBar = document.createElement('div');
      arrivedBar.className = 'arrived-bar';
      const hasArrived = Array.isArray(a.arrived) && a.arrived.includes(state.email);
      const btn = document.createElement('button');
      btn.className = 'mini-act arrived' + (hasArrived ? ' joined' : ' primary');
      btn.innerHTML = hasArrived
        ? icon('<polyline points="20 6 9 17 4 12"/>', 14) + ' ' + t('arrivedDone')
        : t('arrivedBtn');
      btn.title = t('arrivedSent');
      btn.addEventListener('click', () => arrivedEvent(a.id, btn));
      arrivedBar.appendChild(btn);
      card.appendChild(arrivedBar);
    }

    container.appendChild(card);
  }
}

function arrival() {
  const now = new Date();
  const [h, m] = state.exact.split(':').map(Number);
  const d = new Date(now);
  d.setHours(h || 0, m || 0, 0, 0);
  d.setMilliseconds(0);
  while (d.getTime() <= now.getTime() || d.getDay() === 0 || d.getDay() === 6) {
    d.setDate(d.getDate() + 1);
  }
  return { when: 'exact', arrive: d.toISOString(), label: `${t('labelAt')} ${state.exact}` };
}

function syncModal() {
  $('#exactTime').value = state.exact;
  syncGroupSelect();
  $('#preview').textContent = t('previewGoing', { label: arrival().label });
}

function syncGroupSelect() {
  const sel = $('#announceGroup');
  if (!sel) return;
  const prev = state.announceGroup || (state.scope === 'group' ? state.groupId : '');
  sel.innerHTML = `<option value="">${t('groupAllFeed')}</option>`;
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
  $('#announceTitle').textContent = t('announceTitle');
  $('#announceGroupWrap').classList.remove('hidden');
  if (!state.groups.length) fetchMyGroups();
  syncModal();
  $('#modal').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function openEditModal(a) {
  state.editingId = a.id;
  $('#announceTitle').textContent = t('editTime');
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
  if (!validTime(state.exact)) {
    toast(timeInvalidMsg());
    return;
  }
  const r = arrival();
  const payload = { when: r.when, arrive: r.arrive, label: r.label };
  if (!state.editingId && state.announceGroup) payload.groupId = state.announceGroup;
  const isEdit = !!state.editingId;
  $('#confirmBtn').textContent = t('sending');
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
    toast(isEdit ? t('announceUpdated') : t('announceSent'));
    renderTimeline();
  } catch {
    toast(t('announceFailed'));
  }
  $('#confirmBtn').textContent = t('confirm');
  $('#confirmBtn').disabled = false;
}

function start() {
  if (state.started) return;
  state.started = true;

  syncModal();

  $('#announceBtn').addEventListener('click', openModal);
  $('#cancelBtn').addEventListener('click', closeModal);
  $('#confirmBtn').addEventListener('click', confirmAnnounce);
  $('#exactTime').addEventListener('change', (e) => {
    const t = e.target.value;
    if (!validTime(t)) {
      toast(timeInvalidMsg());
      $('#exactTime').value = state.exact;
    } else {
      state.exact = t;
    }
    syncModal();
  });

  $('#menuCancel').addEventListener('click', closeMenuModal);
  $('#menuNext').addEventListener('click', menuNext);
  $('#mealAlmoco').addEventListener('click', () => chooseMeal('almoço'));
  $('#mealJantar').addEventListener('click', () => chooseMeal('jantar'));
  $('#mealBack').addEventListener('click', () => goMenuStep(0));
  $('#previewBack').addEventListener('click', () => goMenuStep(0));
  $('#menuSave').addEventListener('click', saveMenu);

  $('#notifBtn').addEventListener('click', openNotifs);
  $('#notifClose').addEventListener('click', closeNotifs);
  $('#notifEnable').addEventListener('click', enableNotifs);
  $('#notifTest').addEventListener('click', sendTestPush);

  $('#friendsBtn').addEventListener('click', openFriends);
  $('#friendsClose').addEventListener('click', closeFriends);
  $('#scopeAllBtn').addEventListener('click', () => setScope('all'));
  $('#scopeFriendsBtn').addEventListener('click', () => setScope('friends'));
  $('#scopeGroupsBtn').addEventListener('click', () => setScope('group'));
  $('#scopeMenuBtn').addEventListener('click', () => setScope('menu'));
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

  setInterval(refreshActiveScope, 30000);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) refreshActiveScope();
  });
  refreshActiveScope();
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
    dateLabel = `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y} (${dayNames()[new Date(y, m - 1, d).getDay()]})`;
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
    s.textContent = t('tagVeg');
    li.appendChild(s);
  }
  const type = item.mark != null
    ? (item.mark >= 2 ? 'ref2' : item.mark === 1 ? 'ref1' : '')
    : (item.type === 'aviso' ? 'ref1' : item.type || (item.aviso ? 'ref1' : ''));
  if (type === 'ref1') {
    li.classList.add('ref-line');
    const s = document.createElement('span');
    s.className = 'tag aviso';
    s.textContent = t('tagWarn');
    li.appendChild(s);
  } else if (type === 'ref2') {
    li.classList.add('ref2-line');
  } else if (item.lactose) {
    const s = document.createElement('span');
    s.className = 'tag lac';
    s.textContent = t('tagLac');
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
    toast(t('pasteFirst'));
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
  const meal = p.meal === 'jantar' ? t('dinner') : t('lunch');
  head.textContent = `${meal} · ${p.dateLabel || p.date} · ${t('itemCount', { n: p.items.length })}`;
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
  $('#menuSave').textContent = t('publishing');
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
    toast(t('menuPublished'));
    renderMenu();
  } catch {
    toast(t('menuPublishFailed'));
  }
  $('#menuSave').textContent = t('publish');
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
    title.textContent = t('menuTitle');
    const sub = document.createElement('p');
    sub.className = 'sub';
    sub.textContent = t('menuEmptySub');
    card.append(title, sub);
    if (canEditMenu()) {
      const btn = document.createElement('button');
      btn.className = 'primary with-icon';
      btn.innerHTML = icon('<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>', 16) + ' ' + t('addMenu');
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
  title.textContent = t('menuTitle');
  const date = document.createElement('div');
  date.className = 'menu-date';
  const any = almoço || jantar;
  date.textContent = any ? any.dateLabel : day;
  titles.append(title, date);
  if (canEditMenu()) {
    const editBtn = document.createElement('button');
    editBtn.className = 'menu-edit';
    editBtn.innerHTML = ICONS.pencil;
    editBtn.title = t('editMenu');
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
  tabs.append(mkTab('almoço', t('lunch'), !!almoço), mkTab('jantar', t('dinner'), !!jantar));
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
    p.textContent = t('noMenuMeal');
    card.appendChild(p);
  }

  container.appendChild(card);
}

function refreshActiveScope() {
  if (state.scope === 'menu') renderMenu();
  else renderTimeline();
}

function syncScopeTabs() {
  if (state.scope === 'me') {
    state.scope = 'all';
    localStorage.setItem('ru_scope', 'all');
  }
  const menuVisible = state.scope === 'menu';
  $('#scopeAllBtn').classList.toggle('active', state.scope === 'all');
  $('#scopeFriendsBtn').classList.toggle('active', state.scope === 'friends');
  $('#scopeGroupsBtn').classList.toggle('active', state.scope === 'group');
  $('#scopeMenuBtn').classList.toggle('active', menuVisible);
  $('#menuSection').classList.toggle('hidden', !menuVisible);
  $('#timeline').classList.toggle('hidden', menuVisible);
  $('#empty').classList.add('hidden');
  $('#announceBtn').classList.toggle('hidden', menuVisible);
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
  refreshActiveScope();
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
    toast(t('friendsLoadFailed'));
  }
  const wrap = $('#friendSections');
  wrap.innerHTML = '';
  if (data.incoming.length) wrap.appendChild(friendSection(t('friendReq'), data.incoming, 'incoming'));
  if (data.friends.length) wrap.appendChild(friendSection(t('myFriends'), data.friends, 'friend'));
  if (data.outgoing.length) wrap.appendChild(friendSection(t('requestsSent'), data.outgoing, 'outgoing'));
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
  if (kind === 'friend') mk(t('removeFriend'), 'remove');
  else if (kind === 'incoming') { mk(t('accept'), 'accept', 'primary'); mk(t('decline'), 'decline', 'ghost'); }
  else if (kind === 'outgoing') mk(t('cancelReq'), 'cancel');
  else mk(t('add'), 'add', 'primary');

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
        p.textContent = t('noOneFound');
        box.appendChild(p);
        return;
      }
      for (const u of list) {
        const kind = u.state === 'friend' ? 'friend' : u.state === 'incoming' ? 'incoming' : u.state === 'outgoing' ? 'outgoing' : 'add';
        box.appendChild(friendRow(u, kind));
      }
    } catch {
      toast(t('searchFailed'));
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
      toast(j.error || t('actionFailed'));
      return;
    }
    const msg =
      action === 'add' ? t('requestSent') :
      action === 'accept' ? t('nowFriends') :
      action === 'decline' ? t('requestDeclined') :
      action === 'cancel' ? t('requestCancelled') : t('friendRemoved');
    toast(msg);
    renderFriends();
    const q = $('#friendSearch').value.trim();
    if (q) onFriendSearch({ target: { value: q } });
    if (state.scope === 'friends') renderTimeline();
  } catch {
    toast(t('actionFailed'));
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
    if (g.owner === state.email) b.title = t('codeLabel', { code: g.code });
    b.addEventListener('click', () => {
      state.groupId = g.id;
      syncScopeTabs();
      renderTimeline();
    });
    bar.appendChild(b);
  }
  const add = document.createElement('button');
  add.className = 'tab add-chip';
  add.textContent = t('newOrCode');
  add.title = t('groupBarAddTitle');
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
    $('#groupsHeading').classList.add('hidden');
    const p = document.createElement('p');
    p.className = 'sub friends-hint';
    p.textContent = t('noGroups');
    wrap.appendChild(p);
    return;
  }
  $('#groupsHeading').classList.remove('hidden');
  for (const g of state.groups) wrap.appendChild(groupRow(g));
}

function groupRow(g) {
  const isOwner = g.owner === state.email;
  const row = document.createElement('div');
  row.className = 'group-row';

  const info = document.createElement('div');
  info.className = 'f-info';
  const nm = document.createElement('div');
  nm.className = 'name';
  nm.textContent = g.name;
  const em = document.createElement('div');
  em.className = 'when';
  const bits = [];
  if (g.description) bits.push(g.description);
  bits.push(g.memberCount === 1 ? t('memberOne', { n: g.memberCount }) : t('memberMany', { n: g.memberCount }));
  if (isOwner && g.code) bits.push(t('codeLabel', { code: g.code }));
  em.textContent = bits.join(' · ');
  info.append(nm, em);
  row.appendChild(info);

  const acts = document.createElement('div');
  acts.className = 'mini-acts';
  const btn = document.createElement('button');
  btn.className = 'mini-act ghost';
  if (isOwner) {
    btn.textContent = t('deleteGroup');
    btn.title = t('deleteHint');
    btn.addEventListener('click', () => deleteGroup(g.id));
  } else {
    btn.textContent = t('leave');
    btn.addEventListener('click', () => leaveGroup(g.id));
  }
  acts.appendChild(btn);
  row.appendChild(acts);

  if (isOwner && Array.isArray(g.members)) row.appendChild(groupMembers(g));
  return row;
}

function groupMembers(g) {
  const box = document.createElement('div');
  box.className = 'group-members';
  const h = document.createElement('div');
  h.className = 'gm-title';
  h.textContent = t('membersLabel');
  box.appendChild(h);
  for (const m of g.members) {
    const chip = document.createElement('div');
    chip.className = 'friend-row';

    const av = document.createElement('span');
    av.className = 'avatar mini';
    if (m.photo) {
      const img = document.createElement('img');
      img.src = m.photo;
      img.alt = m.name;
      img.referrerPolicy = 'no-referrer';
      av.appendChild(img);
    } else {
      av.textContent = (m.name || m.email || '?').trim().charAt(0).toUpperCase();
    }

    const mi = document.createElement('div');
    mi.className = 'f-info';
    const mn = document.createElement('div');
    mn.className = 'name';
    mn.textContent = m.isOwner ? `${m.name || m.email} ${t('creatorLabel')}` : (m.name || m.email);
    const me = document.createElement('div');
    me.className = 'when';
    me.textContent = m.course || m.email;
    mi.append(mn, me);

    chip.append(av, mi);

    if (!m.isOwner) {
      const kick = document.createElement('button');
      kick.className = 'mini-act ghost';
      kick.textContent = t('remove');
      kick.addEventListener('click', () => kickMember(g.id, m.email));
      chip.appendChild(kick);
    }
    box.appendChild(chip);
  }
  return box;
}

async function kickMember(id, email) {
  try {
    const resp = await fetch(`/api/groups/${id}/kick`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ email }),
    });
    if (resp.status === 401) return handleAuthExpired();
    if (!resp.ok) {
      const j = await resp.json().catch(() => ({}));
      return toast(j.error || t('memberRemovedFailed'));
    }
    toast(t('memberRemoved'));
    renderGroupsList();
  } catch {
    toast(t('memberRemovedFailed'));
  }
}

async function createGroup() {
  const name = $('#groupName').value.trim();
  if (!name) return toast(t('groupNameRequired'));
  const btn = $('#groupCreate');
  btn.disabled = true;
  btn.textContent = t('creating');
  try {
    const resp = await fetch('/api/groups', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ name, description: $('#groupDesc').value.trim() }),
    });
    if (resp.status === 401) return handleAuthExpired();
    if (!resp.ok) {
      const j = await resp.json().catch(() => ({}));
      return toast(j.error || t('groupCreateFailed'));
    }
    const g = await resp.json();
    $('#groupName').value = '';
    $('#groupDesc').value = '';
    toast(t('groupCreated', { code: g.code }));
    await fetchMyGroups();
    state.scope = 'group';
    state.groupId = g.id;
    localStorage.setItem('ru_scope', 'group');
    syncScopeTabs();
    renderGroupsList();
    renderTimeline();
  } catch {
    toast(t('groupCreateFailed'));
  }
  btn.disabled = false;
  btn.textContent = t('createGroup');
}

async function joinGroup() {
  const code = $('#groupCodeInput').value.trim().toUpperCase();
  if (!code) return toast(t('codeRequired'));
  const btn = $('#groupJoin');
  btn.disabled = true;
  btn.textContent = t('joining');
  try {
    const resp = await fetch('/api/groups/join', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ code }),
    });
    if (resp.status === 401) return handleAuthExpired();
    if (!resp.ok) {
      const j = await resp.json().catch(() => ({}));
      return toast(j.error || t('invalidCode'));
    }
    const g = await resp.json();
    $('#groupCodeInput').value = '';
    toast(t('enteredGroup', { name: g.name }));
    await fetchMyGroups();
    state.groupId = g.id;
    state.scope = 'group';
    localStorage.setItem('ru_scope', 'group');
    syncScopeTabs();
    renderGroupsList();
    renderTimeline();
  } catch {
    toast(t('joinFailed'));
  }
  btn.disabled = false;
  btn.textContent = t('joinGroupBtn');
}

async function leaveGroup(id) {
  try {
    const resp = await fetch(`/api/groups/${id}/leave`, { method: 'POST', headers: authHeaders() });
    if (resp.status === 401) return handleAuthExpired();
    if (!resp.ok) {
      const j = await resp.json().catch(() => ({}));
      return toast(j.error || t('leaveFailed'));
    }
    toast(t('leftGroup'));
    await fetchMyGroups();
    if (state.groupId === id) state.groupId = state.groups[0] ? state.groups[0].id : '';
    renderGroupsList();
    if (state.scope === 'group') renderTimeline();
  } catch {
    toast(t('leaveFailed'));
  }
}

async function deleteGroup(id) {
  if (!confirm(t('deleteGroupConfirm'))) return;
  try {
    const resp = await fetch(`/api/groups/${id}`, { method: 'DELETE', headers: authHeaders() });
    if (resp.status === 401) return handleAuthExpired();
    if (!resp.ok) {
      const j = await resp.json().catch(() => ({}));
      return toast(j.error || t('deleteFailed'));
    }
    toast(t('groupDeleted'));
    await fetchMyGroups();
    if (state.groupId === id) state.groupId = state.groups[0] ? state.groups[0].id : '';
    renderGroupsList();
    if (state.scope === 'group') renderTimeline();
  } catch {
    toast(t('deleteFailed'));
  }
}

async function joinEvent(id) {
  try {
    const resp = await fetch(`/api/announce/${id}/join`, { method: 'POST', headers: authHeaders() });
    if (resp.status === 401) return handleAuthExpired();
    if (!resp.ok) {
      const j = await resp.json().catch(() => ({}));
      toast(j.error || t('enterFailed'));
      return;
    }
    toast(t('joinToast'));
    renderTimeline();
  } catch {
    toast(t('actionFailed'));
  }
}

async function unjoinEvent(id) {
  try {
    const resp = await fetch(`/api/announce/${id}/join`, { method: 'DELETE', headers: authHeaders() });
    if (resp.status === 401) return handleAuthExpired();
    if (!resp.ok) {
      const j = await resp.json().catch(() => ({}));
      toast(j.error || t('unjoinFailed'));
      return;
    }
    toast(t('leftAnnounce'));
    renderTimeline();
  } catch {
    toast(t('actionFailed'));
  }
}

function handleAuthExpired() {
  toast(t('sessionExpired'));
  setTimeout(logout, 1200);
}

async function arrivedEvent(id, btn) {
  btn.disabled = true;
  try {
    const resp = await fetch(`/api/announce/${id}/arrived`, { method: 'POST', headers: authHeaders() });
    if (resp.status === 401) return handleAuthExpired();
    if (!resp.ok) {
      const j = await resp.json().catch(() => ({}));
      toast(j.error || t('arrivedFailed'));
      return;
    }
    toast(t('arrivedSent'));
    renderTimeline();
  } catch {
    toast(t('arrivedFailed'));
  }
  btn.disabled = false;
}

function openProfileView(name, photo, email) {
  const box = $('#profileViewAvatar');
  box.innerHTML = '';
  if (photo) {
    const img = document.createElement('img');
    img.src = photo;
    img.alt = name;
    box.appendChild(img);
  } else {
    box.textContent = (name || '?').trim().charAt(0).toUpperCase();
  }
  $('#profileViewName').textContent = name;
  $('#profileViewEmail').textContent = email || '';
  $('#profileOverlay').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeProfileView() {
  $('#profileOverlay').classList.add('hidden');
  document.body.style.overflow = '';
}

function openCredits() {
  $('#creditsOverlay').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeCredits() {
  $('#creditsOverlay').classList.add('hidden');
  document.body.style.overflow = '';
}

async function initGoogle() {
  let cfg;
  try {
    cfg = await (await fetch('/api/config')).json();
  } catch {
    return;
  }
  if (!cfg.googleClientId) {
    $('#authError').textContent = t('googleNotConfigured');
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
      $('#authError').textContent = t('notUfop');
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
    $('#authError').textContent = t('loginFailed');
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
  el.innerHTML = `<option value="">${t('coursePlaceholder')}</option>${COURSE_OPTIONS}`;
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
    ? t('courseRequiredMsg')
    : t('courseEditMsg');
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
    $('#courseError').textContent = t('courseError');
    $('#courseError').classList.remove('hidden');
    return;
  }
  $('#courseError').classList.add('hidden');
  $('#courseSave').disabled = true;
  $('#courseSave').textContent = t('saving');
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
    toast(t('courseSaved'));
  } catch {
    toast(t('courseSaveFailed'));
  }
  $('#courseSave').textContent = t('save');
  $('#courseSave').disabled = false;
}

$('#courseCancel').addEventListener('click', closeCourseSheet);
$('#courseSave').addEventListener('click', saveCourse);
$('#courseLogout').addEventListener('click', logout);
$('#profileBtn').addEventListener('click', () => openCourseSheet(false));
$('#creditsBtn').addEventListener('click', openCredits);
$('#creditsClose').addEventListener('click', closeCredits);
$('#profileViewClose').addEventListener('click', closeProfileView);
$('#profileOverlay').addEventListener('click', (e) => {
  if (e.target === $('#profileOverlay')) closeProfileView();
});
$('#creditsOverlay').addEventListener('click', (e) => {
  if (e.target === $('#creditsOverlay')) closeCredits();
});
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

applyStaticLang();
fillCourseDatalist();
bootstrap();

const langSel = document.getElementById('langSelect');
if (langSel) langSel.addEventListener('change', (e) => setLang(e.target.value));

const logoImg = document.getElementById('logoImg');
if (logoImg) logoImg.addEventListener('load', () => logoImg.classList.add('loaded'));
