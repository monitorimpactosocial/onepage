/* app.js · Controlador principal de la aplicación */

const App = (() => {

  let currentView = null;

  // ── Boot ───────────────────────────────────────────────────
  function init() {
    if (Auth.isLoggedIn()) {
      showApp();
    } else {
      document.getElementById('loginScreen').classList.remove('hidden');
      document.getElementById('appShell').classList.add('hidden');
      document.body.classList.add('login-page');
    }
    bindLoginForm();
  }

  function bindLoginForm() {
    document.getElementById('loginForm').addEventListener('submit', e => {
      e.preventDefault();
      const user = document.getElementById('loginUser').value.trim();
      const pass = document.getElementById('loginPass').value;
      const ok   = Auth.login(user, pass);
      if (ok) {
        document.getElementById('loginScreen').classList.add('hidden');
        showApp();
      } else {
        document.getElementById('loginError').classList.remove('hidden');
      }
    });
  }

  function showApp() {
    document.body.classList.remove('login-page');
    document.getElementById('loginScreen').classList.add('hidden');
    document.getElementById('appShell').classList.remove('hidden');

    const session = Auth.getSession();
    const periodo = getPeriodoActivo();

    // Sidebar user info
    document.getElementById('userName').textContent   = session.name;
    document.getElementById('userRole').textContent   = session.role === 'admin' ? 'Administrador' : (session.area ? (AREAS[session.area]?.name || session.area) : 'Usuario');
    document.getElementById('userAvatar').textContent = session.avatar || session.name[0];
    document.getElementById('sidebarPeriod').textContent = formatPeriodo(periodo);

    // Logout
    document.getElementById('btnLogout').onclick = () => Auth.logout();

    // Sidebar toggle (mobile)
    document.getElementById('sidebarToggle').onclick = () => {
      document.getElementById('sidebar').classList.toggle('open');
    };

    renderNav(session);

    // Auto-navigate
    if (session.role === 'admin') {
      navigate('dashboard');
      Reminders.checkAndTrigger();
    } else if (session.area) {
      navigate('form_' + session.area);
    } else {
      navigate('dashboard');
    }
  }

  // ── Navigation ─────────────────────────────────────────────
  function navigate(view) {
    currentView = view;
    const content = document.getElementById('mainContent');
    content.innerHTML = '<div class="loading-overlay"><div class="spinner"></div><span>Cargando…</span></div>';

    // Update active nav item
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.toggle('active', item.dataset.view === view);
    });

    // Close mobile sidebar
    document.getElementById('sidebar')?.classList.remove('open');

    setTimeout(() => {
      if (view === 'dashboard') {
        Dashboard.render(content);
      } else if (view === 'admin') {
        if (!Auth.isAdmin()) { content.innerHTML = '<div class="page-body"><div class="alert alert-error"><span class="alert-icon">🚫</span>Acceso denegado.</div></div>'; return; }
        Admin.render(content);
      } else if (view.startsWith('form_')) {
        const areaId = view.replace('form_', '');
        const session = Auth.getSession();
        // Non-admins can only access their own area
        if (!Auth.isAdmin() && session.area !== areaId) {
          content.innerHTML = '<div class="page-body"><div class="alert alert-error"><span class="alert-icon">🚫</span>No tiene acceso a esta área.</div></div>';
          return;
        }
        Forms.render(areaId, getPeriodoActivo(), content);
      } else {
        content.innerHTML = '<div class="page-body"><div class="empty-state"><div class="empty-icon">🔍</div><h3>Vista no encontrada</h3></div></div>';
      }
    }, 60);
  }

  // ── Sidebar nav ────────────────────────────────────────────
  function renderNav(session) {
    const nav = document.getElementById('sidebarNav');
    const isAdmin = session.role === 'admin';
    const pKey = periodoKey(getPeriodoActivo());
    const status = Graph.getCompletionStatus(pKey);

    let html = '';

    // Dashboard
    html += `<div class="nav-section-title">Principal</div>`;
    html += navItem('dashboard', '📊', 'Tablero ejecutivo');

    if (isAdmin) {
      html += navItem('admin', '⚙️', 'Administración');
    }

    // Areas
    html += `<div class="nav-section-title">Áreas de reporte</div>`;

    if (isAdmin) {
      // Admin sees all areas
      Object.values(AREAS).forEach(area => {
        const st = status[area.id];
        html += navItem('form_' + area.id, area.icon, area.name, st);
      });
    } else if (session.area) {
      const area = AREAS[session.area];
      if (area) {
        const st = status[session.area];
        html += navItem('form_' + session.area, area.icon, area.name, st);
      }
    }

    nav.innerHTML = html;
    nav.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', () => navigate(item.dataset.view));
    });
  }

  function navItem(view, icon, label, status = null) {
    const badge = status === 'ok'
      ? `<span class="nav-badge ok">✓</span>`
      : status === 'missing'
        ? `<span class="nav-badge">!</span>`
        : '';
    return `<div class="nav-item" data-view="${view}">
      <span class="nav-icon">${icon}</span>
      <span>${label}</span>
      ${badge}
    </div>`;
  }

  // ── Toast ──────────────────────────────────────────────────
  function showToast(msg, type = '') {
    let container = document.getElementById('toastContainer');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toastContainer';
      document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const icons = { success: '✓', error: '✕', warn: '⚠' };
    toast.innerHTML = `<span>${icons[type] || 'ℹ'}</span> ${msg}`;
    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(30px)';
      toast.style.transition = '.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }

  // ── Init on DOM ready ─────────────────────────────────────
  document.addEventListener('DOMContentLoaded', init);

  return { navigate, showToast };
})();
