// ==========================================
// CONFIGURACIÓN DEL MENÚ POR ROL
// ==========================================
var MENU_ITEMS = {
  'Administrador': [
    { icon: 'fas fa-chart-pie', label: 'Dashboard', link: '/dashboard', permiso: 'ver_dashboard' },
    { icon: 'fas fa-plus-circle', label: 'Nueva Requisición', link: '/nueva-requisicion', permiso: 'crear_requisicion' },
    { icon: 'fas fa-list-ul', label: 'Mis Requisiciones', link: '/mis-requisiciones', permiso: 'ver_requisiciones' },
    { icon: 'fas fa-user-tie', label: 'Reclutamiento', link: '/reclutadora', permiso: 'ver_reclutadora' },
    { icon: 'fas fa-briefcase', label: 'Vacantes', link: '/vacantes', permiso: 'ver_requisiciones' },
    { icon: 'fas fa-tasks', label: 'Seguimiento', link: '/seguimiento', permiso: 'ver_requisiciones' },
    { icon: 'fas fa-chart-line', label: 'Reportes', link: '/reportes', permiso: 'ver_reportes' },
    { icon: 'fas fa-crown', label: 'Dashboard Ejecutivo', link: '/ejecutivo', permiso: 'ver_dashboard_ejecutivo' },
    { icon: 'fas fa-users-cog', label: 'Usuarios', link: '/usuarios', permiso: 'ver_usuarios' },
    { icon: 'fas fa-cog', label: 'Configuración', link: '/configuracion', permiso: 'ver_configuracion' },
    { divider: true },
    { icon: 'fas fa-bell', label: 'Notificaciones', link: '/notificaciones', permiso: 'ver_notificaciones' },
    { icon: 'fas fa-user-circle', label: 'Perfil', link: '/perfil', permiso: null },
    { icon: 'fas fa-robot', label: 'SmartRecruit AI', link: '/ia', permiso: 'ver_ia' }
  ],
  'Gerente RH': [
    { icon: 'fas fa-chart-pie', label: 'Dashboard', link: '/dashboard', permiso: 'ver_dashboard' },
    { icon: 'fas fa-plus-circle', label: 'Nueva Requisición', link: '/nueva-requisicion', permiso: 'crear_requisicion' },
    { icon: 'fas fa-list-ul', label: 'Mis Requisiciones', link: '/mis-requisiciones', permiso: 'ver_requisiciones' },
    { icon: 'fas fa-user-tie', label: 'Reclutamiento', link: '/reclutadora', permiso: 'ver_reclutadora' },
    { icon: 'fas fa-briefcase', label: 'Vacantes', link: '/vacantes', permiso: 'ver_requisiciones' },
    { icon: 'fas fa-tasks', label: 'Seguimiento', link: '/seguimiento', permiso: 'ver_requisiciones' },
    { icon: 'fas fa-chart-line', label: 'Reportes', link: '/reportes', permiso: 'ver_reportes' },
    { divider: true },
    { icon: 'fas fa-bell', label: 'Notificaciones', link: '/notificaciones', permiso: 'ver_notificaciones' },
    { icon: 'fas fa-user-circle', label: 'Perfil', link: '/perfil', permiso: null },
    { icon: 'fas fa-robot', label: 'SmartRecruit AI', link: '/ia', permiso: 'ver_ia' }
  ],
  'Reclutadora': [
    { icon: 'fas fa-chart-pie', label: 'Dashboard', link: '/dashboard', permiso: 'ver_dashboard' },
    { icon: 'fas fa-list-ul', label: 'Mis Requisiciones', link: '/mis-requisiciones', permiso: 'ver_requisiciones' },
    { icon: 'fas fa-user-tie', label: 'Panel Reclutadora', link: '/reclutadora', permiso: 'ver_reclutadora' },
    { icon: 'fas fa-briefcase', label: 'Vacantes', link: '/vacantes', permiso: 'ver_requisiciones' },
    { icon: 'fas fa-tasks', label: 'Administrar', link: '/administrar', permiso: 'administrar_requisicion' },
    { divider: true },
    { icon: 'fas fa-bell', label: 'Notificaciones', link: '/notificaciones', permiso: 'ver_notificaciones' },
    { icon: 'fas fa-user-circle', label: 'Perfil', link: '/perfil', permiso: null },
    { icon: 'fas fa-robot', label: 'SmartRecruit AI', link: '/ia', permiso: 'ver_ia' }
  ],
  'Ejecutivo': [
    { icon: 'fas fa-chart-pie', label: 'Dashboard', link: '/dashboard', permiso: 'ver_dashboard' },
    { icon: 'fas fa-crown', label: 'Dashboard Ejecutivo', link: '/ejecutivo', permiso: 'ver_dashboard_ejecutivo' },
    { icon: 'fas fa-chart-line', label: 'Reportes', link: '/reportes', permiso: 'ver_reportes' },
    { icon: 'fas fa-list-ul', label: 'Requisiciones', link: '/mis-requisiciones', permiso: 'ver_requisiciones' },
    { divider: true },
    { icon: 'fas fa-bell', label: 'Notificaciones', link: '/notificaciones', permiso: 'ver_notificaciones' },
    { icon: 'fas fa-user-circle', label: 'Perfil', link: '/perfil', permiso: null },
    { icon: 'fas fa-robot', label: 'SmartRecruit AI', link: '/ia', permiso: 'ver_ia' }
  ]
};

// ==========================================
// GENERAR SIDEBAR HTML
// ==========================================
function getSidebarHTML() {
  var user = getCurrentUser();
  if (!user) return '';
  
  var items = MENU_ITEMS[user.role] || MENU_ITEMS['Reclutadora'];
  var navHTML = '';
  
  items.forEach(function(item) {
    if (item.divider) {
      navHTML += '<div class="nav-divider"></div>';
      return;
    }
    
    // Verificar permiso si existe
    if (item.permiso && !tienePermiso(item.permiso)) {
      return;
    }
    
    var isActive = window.location.pathname.includes(item.link.replace('/', '')) || 
                   (item.link === '/dashboard' && window.location.pathname === '/') ||
                   (item.link === '/dashboard' && window.location.pathname === '/dashboard.html');
    
    var activeClass = isActive ? 'active' : '';
    var badgeHTML = '';
    
    // Badge para roles específicos
    if (user.role === 'Administrador' && item.label === 'Configuración') {
      badgeHTML = '<span class="badge-role admin">Admin</span>';
    } else if (user.role === 'Gerente RH' && item.label === 'Dashboard') {
      badgeHTML = '<span class="badge-role rh">RH</span>';
    } else if (user.role === 'Reclutadora' && item.label === 'Panel Reclutadora') {
      badgeHTML = '<span class="badge-role recruiter">Rec</span>';
    }
    
    navHTML += `
      <a class="nav-item ${activeClass}" href="${item.link}" data-page="${item.link.replace('/', '')}.html">
        <i class="${item.icon}"></i>
        <span>${item.label}</span>
        ${badgeHTML}
      </a>
    `;
  });
  
  // Agregar logout al final
  navHTML += `
    <div class="nav-divider"></div>
    <a class="nav-item logout" onclick="logout()" style="color: var(--danger); cursor: pointer;">
      <i class="fas fa-sign-out-alt"></i>
      <span>Cerrar sesión</span>
    </a>
  `;
  
  var initial = user.name ? user.name.charAt(0).toUpperCase() : 'U';
  var roleBadge = user.role || 'Colaborador';
  
  // Determinar si el sidebar está colapsado
  var isCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
  var collapsedClass = isCollapsed ? 'collapsed' : '';
  var iconClass = isCollapsed ? 'fas fa-chevron-right' : 'fas fa-chevron-left';
  var toggleText = isCollapsed ? 'Expandir' : 'Colapsar';
  
  return `
    <aside class="sidebar ${collapsedClass}" id="sidebar">
      <div class="logo-area">
        <div class="logo-icon">S</div>
        <div>
          <span class="logo-text">SIMAN</span>
          <span class="logo-sub">SmartRecruit</span>
        </div>
        <button class="sidebar-toggle" onclick="toggleSidebar()" title="${toggleText} menú">
          <i class="${iconClass}" id="sidebarToggleIcon"></i>
          <span>${toggleText}</span>
        </button>
      </div>
      
      <div class="sidebar-user-info">
        <div class="user-avatar">${initial}</div>
        <div>
          <div class="user-name">${user.name || 'Usuario'}</div>
          <div class="user-role">${roleBadge}</div>
        </div>
      </div>
      
      <nav class="nav">
        ${navHTML}
      </nav>
    </aside>
  `;
}

// ==========================================
// TOPBAR HTML
// ==========================================
function getTopbarHTML(user) {
  var name = user ? user.name : 'Usuario';
  var role = user ? user.role : 'Colaborador';
  var store = user ? user.store : 'Centro Comercial';
  var initial = name.charAt(0).toUpperCase();
  var dateStr = new Date().toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  var notificacionesNoLeidas = 0;
  try {
    var notifData = JSON.parse(localStorage.getItem('notificaciones') || '[]');
    notificacionesNoLeidas = notifData.filter(function(n) { return !n.leida; }).length;
  } catch(e) {}
  
  var notifDot = notificacionesNoLeidas > 0 ? '<span class="notification-dot"></span>' : '';
  
  return `
    <div class="topbar">
      <div class="greeting">
        <button class="sidebar-toggle-mobile" onclick="toggleSidebarMobile()">
          <i class="fas fa-bars"></i>
        </button>
        <div>
          <h2>Bienvenido, ${name}</h2>
          <p>
            <span><i class="fas fa-store"></i> ${store}</span>
            <span><i class="fas fa-user-tag"></i> ${role}</span>
            <span><i class="far fa-calendar-alt"></i> ${dateStr}</span>
          </p>
        </div>
      </div>
      <div class="topbar-right">
        <div class="search-box">
          <i class="fas fa-search"></i>
          <input placeholder="Buscar..." id="globalSearch" />
          <div class="search-results-dropdown" id="searchResults"></div>
        </div>
        <div class="icon-btn" onclick="navigateTo('/notificaciones')">
          <i class="far fa-bell"></i>
          ${notifDot}
        </div>
        <div class="avatar" onclick="navigateTo('/perfil')">${initial}</div>
      </div>
    </div>
  `;
}

// ==========================================
// SIDEBAR TOGGLE
// ==========================================
function toggleSidebar() {
  var sidebar = document.getElementById('sidebar');
  var mainContent = document.querySelector('.main-content');
  var icon = document.getElementById('sidebarToggleIcon');
  var toggleText = sidebar.querySelector('.sidebar-toggle span');
  
  if (!sidebar) return;
  
  var isCollapsed = sidebar.classList.toggle('collapsed');
  if (mainContent) mainContent.classList.toggle('expanded');
  
  if (icon) {
    icon.className = isCollapsed ? 'fas fa-chevron-right' : 'fas fa-chevron-left';
  }
  if (toggleText) {
    toggleText.textContent = isCollapsed ? 'Expandir' : 'Colapsar';
  }
  
  localStorage.setItem('sidebarCollapsed', isCollapsed ? 'true' : 'false');
}

// ==========================================
// SIDEBAR TOGGLE MÓVIL
// ==========================================
function toggleSidebarMobile() {
  var sidebar = document.getElementById('sidebar');
  var overlay = document.getElementById('sidebarOverlay');
  
  if (!sidebar) return;
  
  sidebar.classList.toggle('mobile-open');
  if (overlay) overlay.classList.toggle('active');
}

// ==========================================
// BUSCADOR GLOBAL
// ==========================================
function buscarGlobal(query) {
  var resultados = [];
  if (!query || query.length < 2) return resultados;
  
  var q = query.toLowerCase().trim();
  
  // Buscar en usuarios
  var data = localStorage.getItem('siman_config_data');
  if (data) {
    var config = JSON.parse(data);
    (config.usuarios || []).forEach(function(u) {
      if (u.nombre && u.nombre.toLowerCase().includes(q)) {
        resultados.push({
          tipo: 'Usuario',
          nombre: u.nombre,
          descripcion: u.email || '',
          link: '/configuracion',
          icon: 'fas fa-user'
        });
      }
    });
  }
  
  // Buscar en roles
  if (data) {
    var config = JSON.parse(data);
    (config.roles || []).forEach(function(r) {
      if (r.nombre && r.nombre.toLowerCase().includes(q)) {
        resultados.push({
          tipo: 'Rol',
          nombre: r.nombre,
          descripcion: 'Estado: ' + r.estado,
          link: '/configuracion',
          icon: 'fas fa-user-tag'
        });
      }
    });
  }
  
  // Buscar en requisiciones
  var requisiciones = JSON.parse(localStorage.getItem('requisiciones') || '[]');
  requisiciones.forEach(function(r) {
    if (r.puesto && r.puesto.toLowerCase().includes(q)) {
      resultados.push({
        tipo: 'Requisición',
        nombre: r.puesto || 'Sin título',
        descripcion: 'ID: ' + r.id + ' · ' + (r.estado || ''),
        link: '/detalle',
        icon: 'fas fa-file-alt'
      });
    }
  });
  
  return resultados.slice(0, 10);
}

function renderizarResultadosBusqueda(resultados) {
  var container = document.getElementById('searchResults');
  if (!container) return;
  
  if (!resultados || resultados.length === 0) {
    container.innerHTML = '<div class="search-empty">No se encontraron resultados</div>';
    container.classList.add('show');
    return;
  }
  
  container.innerHTML = resultados.map(function(r) {
    return '<div class="search-result-item" onclick="window.location.href=\'' + r.link + '\'">' +
      '<i class="' + r.icon + '"></i>' +
      '<div class="search-result-content">' +
        '<div class="search-result-title">' + r.nombre + '</div>' +
        '<div class="search-result-desc">' + r.tipo + ' · ' + r.descripcion + '</div>' +
      '</div>' +
    '</div>';
  }).join('');
  container.classList.add('show');
}

// ==========================================
// INICIALIZAR LAYOUT
// ==========================================
function initLayout() {
  var user = getCurrentUser();
  if (!user) return;
  
  // Sidebar
  var sidebarContainer = document.getElementById('sidebar-container');
  if (sidebarContainer) {
    sidebarContainer.innerHTML = getSidebarHTML();
    
    // Crear overlay para móvil
    if (!document.getElementById('sidebarOverlay')) {
      var overlay = document.createElement('div');
      overlay.id = 'sidebarOverlay';
      overlay.className = 'sidebar-overlay';
      overlay.onclick = function() {
        toggleSidebarMobile();
      };
      document.body.prepend(overlay);
    }
    
    // Aplicar estado colapsado al main-content
    var mainContent = document.querySelector('.main-content');
    var isCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
    if (mainContent && isCollapsed) {
      mainContent.classList.add('expanded');
    }
  }
  
  // Topbar
  var topbarContainer = document.getElementById('topbar-container');
  if (topbarContainer) {
    topbarContainer.innerHTML = getTopbarHTML(user);
    
    // Inicializar buscador global
    var searchInput = document.getElementById('globalSearch');
    var resultsContainer = document.getElementById('searchResults');
    
    if (searchInput && resultsContainer) {
      searchInput.addEventListener('input', function() {
        var query = this.value;
        if (query.length >= 2) {
          var resultados = buscarGlobal(query);
          renderizarResultadosBusqueda(resultados);
        } else {
          resultsContainer.classList.remove('show');
        }
      });
      
      document.addEventListener('click', function(e) {
        if (!searchInput.contains(e.target) && !resultsContainer.contains(e.target)) {
          resultsContainer.classList.remove('show');
        }
      });
    }
  }
}

// ==========================================
// INICIALIZAR EN DOMContentLoaded
// ==========================================
document.addEventListener('DOMContentLoaded', function() {
  var currentPage = window.location.pathname;
  if (!currentPage.includes('login.html') && currentPage !== '/') {
    var user = getCurrentUser();
    if (user) {
      initLayout();
    }
  }
});