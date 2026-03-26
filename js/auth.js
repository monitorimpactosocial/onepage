/* auth.js · Gestión de autenticación */

const Auth = (() => {
  const SESSION_KEY = 'paracel_session';

  function login(username, password) {
    const user = USERS[username.toLowerCase()];
    if (!user) return false;
    if (user.password !== password) return false;
    const session = {
      username: username.toLowerCase(),
      name: user.name,
      role: user.role,
      area: user.area,
      email: user.email,
      avatar: user.avatar,
      loginAt: Date.now(),
    };
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return true;
  }

  function logout() {
    sessionStorage.removeItem(SESSION_KEY);
    window.location.reload();
  }

  function getSession() {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  }

  function isAdmin() {
    const s = getSession();
    return s && s.role === 'admin';
  }

  function isLoggedIn() {
    return !!getSession();
  }

  function getUserArea() {
    const s = getSession();
    return s ? s.area : null;
  }

  return { login, logout, getSession, isAdmin, isLoggedIn, getUserArea };
})();
