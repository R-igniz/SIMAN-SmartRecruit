// ==========================================
// CONFIGURACIÓN DE ROLES Y PERMISOS
// ==========================================
var ROLES = {
  ADMINISTRADOR: 'Administrador',
  GERENTE_RH: 'Gerente RH',
  RECLUTADORA: 'Reclutadora',
  EJECUTIVO: 'Ejecutivo'
};

var PERMISOS = {
  'Administrador': [
    'ver_dashboard', 'ver_configuracion', 'ver_usuarios', 'crear_usuario',
    'editar_usuario', 'eliminar_usuario', 'ver_roles', 'crear_rol',
    'editar_rol', 'eliminar_rol', 'ver_cartas_oferta', 'crear_carta_oferta',
    'editar_carta_oferta', 'eliminar_carta_oferta', 'ver_reportes',
    'ver_dashboard_ejecutivo', 'ver_notificaciones', 'ver_ia',
    'crear_requisicion', 'ver_requisiciones', 'editar_requisicion',
    'eliminar_requisicion', 'ver_reclutadora', 'administrar_requisicion'
  ],
  'Gerente RH': [
    'ver_dashboard', 'crear_requisicion', 'ver_requisiciones',
    'editar_requisicion', 'ver_reportes', 'ver_notificaciones', 'ver_ia',
    'ver_reclutadora', 'administrar_requisicion', 'ver_cartas_oferta',
    'crear_carta_oferta', 'editar_carta_oferta', 'eliminar_carta_oferta'
  ],
  'Reclutadora': [
    'ver_dashboard', 'ver_requisiciones', 'ver_reclutadora',
    'administrar_requisicion', 'ver_notificaciones', 'ver_ia',
    'ver_cartas_oferta', 'editar_requisicion'
  ],
  'Ejecutivo': [
    'ver_dashboard', 'ver_dashboard_ejecutivo', 'ver_reportes',
    'ver_requisiciones', 'ver_notificaciones', 'ver_ia'
  ]
};

// ==========================================
// OBTENER USUARIOS DESDE STORAGE
// ==========================================
function getUsersFromStorage() {
  var data = localStorage.getItem('siman_config_data');
  if (data) {
    var parsed = JSON.parse(data);
    return (parsed.usuarios || []).map(function(u) {
      return {
        username: u.email,
        password: u.password,
        name: u.nombre,
        role: u.rol || 'Reclutadora',
        store: u.centro || 'Central'
      };
    });
  }
  // Fallback
  return [
    { username: 'admin@siman.com', password: 'admin123', name: 'Administrador', role: 'Administrador', store: 'Central' },
    { username: 'carlos.aranda@siman.com', password: '12345678', name: 'Carlos Aranda', role: 'Gerente RH', store: 'Gran Vía' },
    { username: 'maria.gomez@siman.com', password: '12345678', name: 'María Gómez', role: 'Reclutadora', store: 'Multiplaza' },
    { username: 'ana.lopez@siman.com', password: '12345678', name: 'Ana López', role: 'Reclutadora', store: 'Galerías' }
  ];
}

// ==========================================
// SESSION MANAGEMENT
// ==========================================
function login(username, password) {
  var users = getUsersFromStorage();
  var user = users.find(function(u) {
    return u.username === username && u.password === password;
  });
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
  var data = sessionStorage.getItem('currentUser');
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

// ==========================================
// VERIFICAR PERMISOS
// ==========================================
function tienePermiso(permiso) {
  var user = getCurrentUser();
  if (!user) return false;
  var permisos = PERMISOS[user.role] || [];
  return permisos.indexOf(permiso) !== -1;
}

function tieneRol(rol) {
  var user = getCurrentUser();
  if (!user) return false;
  return user.role === rol;
}

function esAdministrador() {
  return tieneRol(ROLES.ADMINISTRADOR);
}

// ==========================================
// PROTEGER RUTAS POR ROL
// ==========================================
function protegerRuta(permisoRequerido, redirectUrl) {
  var user = getCurrentUser();
  if (!user) {
    window.location.href = '/login.html';
    return false;
  }
  if (permisoRequerido && !tienePermiso(permisoRequerido)) {
    window.location.href = redirectUrl || '/dashboard';
    return false;
  }
  return true;
}

// Proteger páginas automáticamente
document.addEventListener('DOMContentLoaded', function() {
  var currentPage = window.location.pathname;
  if (!currentPage.includes('login.html') && currentPage !== '/') {
    var user = requireAuth();
    if (user) {
      var permisosPorPagina = {
        '/configuracion': 'ver_configuracion',
        '/configuracion.html': 'ver_configuracion',
        '/dashboard-ejecutivo': 'ver_dashboard_ejecutivo',
        '/reportes': 'ver_reportes',
        '/usuarios': 'ver_usuarios'
      };
      var permiso = permisosPorPagina[currentPage];
      if (permiso && !tienePermiso(permiso)) {
        window.location.href = '/dashboard';
      }
    }
  }
});