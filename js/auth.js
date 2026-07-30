// ===== USUARIOS DE PRUEBA =====
const USERS = [
  { username: 'carlos.aranda@siman.com', password: '12345678', name: 'Carlos Aranda', role: 'Gerente RH', store: 'Gran Vía' },
  { username: 'maria.gomez@siman.com', password: '12345678', name: 'María Gómez', role: 'Reclutadora', store: 'Multiplaza' },
  { username: 'ana.lopez@siman.com', password: '12345678', name: 'Ana López', role: 'Reclutadora', store: 'Galerías' },
  { username: 'luis.perez@siman.com', password: '12345678', name: 'Luis Pérez', role: 'Ejecutivo', store: 'Metrocentro' },
  { username: 'admin@siman.com', password: 'admin123', name: 'Administrador', role: 'Administrador', store: 'Central' }
];

// ===== SESSION MANAGEMENT =====
function login(username, password) {
  const user = USERS.find(u => u.username === username && u.password === password);
  if (user) {
    sessionStorage.setItem('currentUser', JSON.stringify(user));
    sessionStorage.setItem('isAuthenticated', 'true');
    return user;
  }
  return null;
}

function logout() {
  sessionStorage.removeItem('currentUser');
  sessionStorage.removeItem('isAuthenticated');
  window.location.href = '/login.html';
}

function getCurrentUser() {
  const data = sessionStorage.getItem('currentUser');
  return data ? JSON.parse(data) : null;
}

function isAuthenticated() {
  return sessionStorage.getItem('isAuthenticated') === 'true' && getCurrentUser() !== null;
}

function requireAuth() {
  if (!isAuthenticated()) {
    window.location.href = '/login.html';
    return null;
  }
  return getCurrentUser();
}

// ===== PROTECTED ROUTES =====
document.addEventListener('DOMContentLoaded', function() {
  // Verificar autenticación en todas las páginas excepto login
  const currentPage = window.location.pathname;
  if (!currentPage.includes('login.html') && currentPage !== '/') {
    const user = requireAuth();
    if (!user) {
      // Redirigir al login
      window.location.href = '/login.html';
    }
  }
});