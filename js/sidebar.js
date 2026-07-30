// ===== SIDEBAR HTML =====
function getSidebarHTML() {
  return `
    <aside class="sidebar">
      <div class="logo-area">
        <div class="logo-icon">S</div>
        <div>
          <span class="logo-text">SIMAN</span>
          <span class="logo-sub">SmartRecruit</span>
        </div>
      </div>
      
      <nav class="nav">
        <a class="nav-item" data-page="dashboard.html" href="/dashboard">
          <i class="fas fa-chart-pie"></i><span>Dashboard</span>
        </a>
        <a class="nav-item" data-page="nueva-requisicion.html" href="/nueva-requisicion">
          <i class="fas fa-plus-circle"></i><span>Nueva Requisición</span>
        </a>
        <a class="nav-item" data-page="mis-requisiciones.html" href="#">
          <i class="fas fa-list-ul"></i><span>Mis Requisiciones</span>
        </a>
        <a class="nav-item" data-page="reclutadora.html" href="/reclutadora">
          <i class="fas fa-user-tie"></i><span>Reclutamiento</span>
        </a>
        <a class="nav-item" data-page="vacantes.html" href="#">
          <i class="fas fa-briefcase"></i><span>Vacantes</span>
        </a>
        <a class="nav-item" data-page="seguimiento.html" href="#">
          <i class="fas fa-tasks"></i><span>Seguimiento</span>
        </a>
        <a class="nav-item" data-page="reportes.html" href="/reportes">
          <i class="fas fa-chart-line"></i><span>Reportes</span>
        </a>
        <a class="nav-item" data-page="dashboard-ejecutivo.html" href="/ejecutivo">
          <i class="fas fa-crown"></i><span>Dashboard Ejecutivo</span>
        </a>
        <a class="nav-item" data-page="usuarios.html" href="#">
          <i class="fas fa-users-cog"></i><span>Usuarios</span>
        </a>
        <a class="nav-item" data-page="configuracion.html" href="/configuracion">
          <i class="fas fa-cog"></i><span>Configuración</span>
        </a>
        
        <div class="nav-divider"></div>
        
        <a class="nav-item" data-page="notificaciones.html" href="/notificaciones">
          <i class="fas fa-bell"></i><span>Centro de Notificaciones</span>
        </a>
        <a class="nav-item" data-page="perfil.html" href="/perfil">
          <i class="fas fa-user-circle"></i><span>Perfil</span>
        </a>
        <a class="nav-item" data-page="ia.html" href="/ia">
          <i class="fas fa-robot"></i><span>SmartRecruit AI</span>
        </a>
        
        <div class="nav-divider"></div>
        
        <a class="nav-item" onclick="logout()" style="color: var(--danger); cursor: pointer;">
          <i class="fas fa-sign-out-alt"></i><span>Cerrar sesión</span>
        </a>
      </nav>
    </aside>
  `;
}

// ===== TOPBAR HTML =====
function getTopbarHTML(user) {
  const name = user ? user.name : 'Usuario';
  const role = user ? user.role : 'Colaborador';
  const store = user ? user.store : 'Centro Comercial';
  const initial = name.charAt(0).toUpperCase();
  
  const today = new Date();
  const dateStr = today.toLocaleDateString('es-ES', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  
  return `
    <div class="topbar">
      <div class="greeting">
        <h2>Bienvenido, ${name}</h2>
        <p>
          <span><i class="fas fa-store"></i> ${store}</span>
          <span><i class="fas fa-user-tag"></i> ${role}</span>
          <span><i class="far fa-calendar-alt"></i> ${dateStr}</span>
        </p>
      </div>
      <div class="topbar-right">
        <div class="search-box">
          <i class="fas fa-search"></i>
          <input placeholder="Buscar..." />
        </div>
        <div class="icon-btn" onclick="navigateTo('/notificaciones')">
          <i class="far fa-bell"></i>
        </div>
        <div class="avatar" onclick="navigateTo('/perfil')">${initial}</div>
      </div>
    </div>
  `;
}

// ===== INICIALIZAR LAYOUT =====
function initLayout() {
  const user = getCurrentUser();
  if (!user) return;
  
  // Insertar sidebar en el contenedor
  const sidebarContainer = document.getElementById('sidebar-container');
  if (sidebarContainer) {
    sidebarContainer.innerHTML = getSidebarHTML();
  }
  
  // Insertar topbar
  const topbarContainer = document.getElementById('topbar-container');
  if (topbarContainer) {
    topbarContainer.innerHTML = getTopbarHTML(user);
  }
}

// ===== CARGAR LAYOUT =====
document.addEventListener('DOMContentLoaded', function() {
  // Solo inicializar en páginas protegidas
  const currentPage = window.location.pathname;
  if (!currentPage.includes('login.html') && currentPage !== '/') {
    const user = getCurrentUser();
    if (user) {
      initLayout();
    }
  }
});