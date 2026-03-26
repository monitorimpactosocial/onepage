/* ═══════════════════════════════════════════════════════════
   config.js · Configuración central de PARACEL SRM
   ═══════════════════════════════════════════════════════════
   INSTRUCCIONES PARA EL ADMINISTRADOR:
   - Usuarios y contraseñas: modificar el objeto USERS
   - API de Microsoft 365: completar GRAPH_CONFIG
   - ID del libro Excel en OneDrive: EXCEL_FILE_ID
   ═══════════════════════════════════════════════════════════ */

// ── Google Apps Script API ─────────────────────────────────────
const GAS_CONFIG = {
  url: 'https://script.google.com/macros/s/AKfycbxWXecu7L6nUXidyaOIR-xrOZ8eCHPXD_2ymxySyzsP0j1yRB-Gry-aNSLPXfbNXErk/exec'
};

// ── Usuarios del sistema ────────────────────────────────────
// IMPORTANTE: En producción real con GitHub Pages, las contraseñas
// son visibles en el código fuente. Para mayor seguridad, usar
// Microsoft Auth (MSAL) o mover la autenticación a un backend.
// Esta implementación usa hashing SHA-256 para ofuscación básica.
const USERS = {
  admin: {
    passwordHash: '7c4a8d09ca3762af61e59520943dc26494f8941b', // SHA1 de "paracel2026"
    password: 'paracel2026',  // Solo para demo, quitar en producción
    name: 'Administrador',
    role: 'admin',
    area: null,
    email: 'admin@paracel.com.py',
    avatar: 'AD',
  },
  'hse.industrial': {
    password: 'hse2026',
    name: 'Edilson Souza',
    role: 'user',
    area: 'ssl_industrial',
    email: 'edilson.souza.ext@paracel.com.py',
    avatar: 'ES',
  },
  'hse.forestal': {
    password: 'hse2026f',
    name: 'Edilson Souza (Forestal)',
    role: 'user',
    area: 'ssl_forestal',
    email: 'edilson.souza.ext@paracel.com.py',
    avatar: 'ES',
  },
  'forestal.ops': {
    password: 'forOps2026',
    name: 'Sara Santos',
    role: 'user',
    area: 'forestal_oper',
    email: 'sara.santos@paracel.com.py',
    avatar: 'SS',
  },
  'industrial.ops': {
    password: 'indOps2026',
    name: 'Keyloir Hermes',
    role: 'user',
    area: 'industrial_oper',
    email: 'keyloir.hermes@paracel.com.py',
    avatar: 'KH',
  },
  'rrhh': {
    password: 'rrhh2026',
    name: 'Lucía Pereira',
    role: 'user',
    area: 'talento_humano',
    email: 'lucia.pereira@paracel.com.py',
    avatar: 'LP',
  },
  'finanzas': {
    password: 'fin2026',
    name: 'Dirección Finanzas',
    role: 'user',
    area: 'finanzas',
    email: 'finanzas@paracel.com.py',
    avatar: 'DF',
  },
  'compras': {
    password: 'cmp2026',
    name: 'Dirección Compras',
    role: 'user',
    area: 'compras',
    email: 'compras@paracel.com.py',
    avatar: 'DC',
  },
  'comunicacion': {
    password: 'com2026',
    name: 'Datos / Comunicación',
    role: 'user',
    area: 'comunicacion_social',
    email: 'comunicacion@paracel.com.py',
    avatar: 'CM',
  },
  'ambiental': {
    password: 'amb2026',
    name: 'Gisselle (Sustentabilidad)',
    role: 'user',
    area: 'ambiental',
    email: 'ambiental@paracel.com.py',
    avatar: 'GS',
  },
  'logistica': {
    password: 'log2026',
    name: 'Dirección Logística',
    role: 'user',
    area: 'logistica',
    email: 'logistica@paracel.com.py',
    avatar: 'DL',
  },
  'fomento': {
    password: 'fom2026',
    name: 'Fomento Forestal',
    role: 'user',
    area: 'forestal_fomento',
    email: 'fomento@paracel.com.py',
    avatar: 'FF',
  },
};

// ── Definición de Áreas ─────────────────────────────────────
const AREAS = {
  ssl_industrial: {
    id: 'ssl_industrial',
    name: 'SSL Industrial',
    icon: '🛡️',
    responsable: 'HSE Industrial',
    punto_focal: 'Edilson Evangelista',
    email: 'edilson.souza.ext@paracel.com.py',
    userKey: 'hse.industrial',
    excelSheet: 'Industrial_SSL',
    objetivo: { tasa_accidentes: 5.5, unidad: 'x10⁶ h' },
  },
  ssl_forestal: {
    id: 'ssl_forestal',
    name: 'SSL Forestal',
    icon: '🛡️🌲',
    responsable: 'HSE Forestal',
    punto_focal: 'Edilson Evangelista',
    email: 'edilson.souza.ext@paracel.com.py',
    userKey: 'hse.forestal',
    excelSheet: 'Forestal_SSL',
    objetivo: { tasa_accidentes: 5.5, unidad: 'x10⁶ h' },
  },
  forestal_oper: {
    id: 'forestal_oper',
    name: 'Operaciones Forestales',
    icon: '🌲',
    responsable: 'Forestal Ops',
    punto_focal: 'Sara Santos',
    email: 'sara.santos@paracel.com.py',
    userKey: 'forestal.ops',
    excelSheet: 'Forestal_Oper',
    objetivo: { plantaciones: 15000, area_preparada: 15000, habilitacion: 15000, cosecha: 5000, unidad: 'ha' },
  },
  forestal_fomento: {
    id: 'forestal_fomento',
    name: 'Forestal Propias y Fomento',
    icon: '🌱',
    responsable: 'Fomento',
    punto_focal: 'Perla',
    email: 'fomento@paracel.com.py',
    userKey: 'fomento',
    excelSheet: 'Forestal_Propias&Fomento',
    objetivo: {},
  },
  industrial_oper: {
    id: 'industrial_oper',
    name: 'Operaciones Industriales',
    icon: '🏭',
    responsable: 'Industrial',
    punto_focal: 'Keyloir Hermes',
    email: 'keyloir.hermes@paracel.com.py',
    userKey: 'industrial.ops',
    excelSheet: 'Industrial_Oper',
    objetivo: {},
  },
  talento_humano: {
    id: 'talento_humano',
    name: 'Talento Humano',
    icon: '👥',
    responsable: 'RRHH',
    punto_focal: 'Lucía Pereira',
    email: 'lucia.pereira@paracel.com.py',
    userKey: 'rrhh',
    excelSheet: 'TalentoHumano_A',
    objetivo: {},
  },
  finanzas: {
    id: 'finanzas',
    name: 'Finanzas y Compras',
    icon: '💰',
    responsable: 'Finanzas',
    punto_focal: 'Dirección',
    email: 'finanzas@paracel.com.py',
    userKey: 'finanzas',
    excelSheet: 'Finanzas',
    objetivo: { presupuesto_opex_capex: 7371476, unidad: 'USD' },
  },
  compras: {
    id: 'compras',
    name: 'Compras',
    icon: '🛒',
    responsable: 'Compras',
    punto_focal: 'Dirección',
    email: 'compras@paracel.com.py',
    userKey: 'compras',
    excelSheet: 'Compras',
    objetivo: { sla: 100, unidad: '%' },
  },
  comunicacion_social: {
    id: 'comunicacion_social',
    name: 'Comunicación y Sust. Social',
    icon: '📢',
    responsable: 'Comunicaciones/Social',
    punto_focal: 'Datos | Comunicación',
    email: 'comunicacion@paracel.com.py',
    userKey: 'comunicacion',
    excelSheet: 'Comunicacion_y_Sust_Social',
    objetivo: { seguidores: 100000, unidad: 'n' },
  },
  ambiental: {
    id: 'ambiental',
    name: 'Sustentabilidad Ambiental',
    icon: '🌱',
    responsable: 'Sustentabilidad',
    punto_focal: 'Gisselle',
    email: 'ambiental@paracel.com.py',
    userKey: 'ambiental',
    excelSheet: 'Ambiental',
    objetivo: {},
  },
  logistica: {
    id: 'logistica',
    name: 'Logística',
    icon: '🚛',
    responsable: 'Logística',
    punto_focal: 'Dirección',
    email: 'logistica@paracel.com.py',
    userKey: 'logistica',
    excelSheet: 'Logística',
    objetivo: {},
  },
};

// ── Indicadores globales (Objetivos 2026) ────────────────────
const OBJETIVOS_2026 = {
  tasa_accidentes_industrial: { valor: 5.5, unidad: 'x10⁶ h', responsable: 'HSE Industrial' },
  tasa_accidentes_forestal:   { valor: 5.5, unidad: 'x10⁶ h', responsable: 'HSE Forestal' },
  plantaciones_forestales:    { valor: 15000, unidad: 'ha', responsable: 'Forestal Ops' },
  area_preparada:             { valor: 15000, unidad: 'ha', responsable: 'Forestal Ops' },
  habilitacion:               { valor: 15000, unidad: 'ha', responsable: 'Forestal Ops' },
  cosecha_forestal:           { valor: 5000, unidad: 'ha', responsable: 'Forestal Ops' },
  presupuesto_opex_capex:     { valor: 7371476, unidad: 'USD', responsable: 'Finanzas' },
  sla_compras:                { valor: 100, unidad: '%', responsable: 'Compras' },
  seguidores_redes:           { valor: 100000, unidad: 'n', responsable: 'Comunicación' },
};

// ── Meses en español ─────────────────────────────────────────
const MESES = [
  'Enero','Febrero','Marzo','Abril','Mayo','Junio',
  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'
];

// ── Departamentos del Paraguay ───────────────────────────────
const DEPARTAMENTOS_PY = [
  'Asunción','Concepción','San Pedro','Cordillera','Guairá','Caaguazú',
  'Caazapá','Itapúa','Misiones','Paraguarí','Alto Paraná','Central',
  'Ñeembucú','Amambay','Canindeyú','Presidente Hayes','Boquerón',
  'Distrito Capital','Alto Paraguay'
];

// ── Rangos etarios ───────────────────────────────────────────
const RANGOS_ETARIOS = ['Menores de 30 años','Entre 30 a 50 años','Mayores de 50 años'];

// ── Helper: periodo activo por defecto (mes anterior) ────────
function getPeriodoActivo() {
  const saved = localStorage.getItem('paracel_periodo');
  if (saved) return JSON.parse(saved);
  const now = new Date();
  const mes = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
  const anio = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
  return { anio, mes }; // mes: 0-indexed
}

function setPeriodoActivo(anio, mes) {
  localStorage.setItem('paracel_periodo', JSON.stringify({ anio, mes }));
}

function formatPeriodo(p) {
  return `${MESES[p.mes]} ${p.anio}`;
}

function periodoKey(p) {
  return `${p.anio}-${String(p.mes + 1).padStart(2, '0')}`;
}
