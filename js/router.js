// ===== NAVEGACIÓN =====
function navigateTo(path) {
  if (!path.startsWith('/')) {
    path = '/' + path;
  }
  
  // Mapeo de rutas a archivos HTML
  const routes = {
    '/': '/dashboard',
    '/dashboard': '/dashboard.html',
    '/nueva-requisicion': '/nueva-requisicion.html',
    '/mis-requisiciones': '/mis-requisiciones.html',
    '/reclutamiento': '/reclutamiento.html',
    '/vacantes': '/vacantes.html',
    '/seguimiento': '/seguimiento.html',
    '/reportes': '/reportes.html',
    '/ejecutivo': '/dashboard-ejecutivo.html',
    '/usuarios': '/usuarios.html',
    '/configuracion': '/configuracion.html',
    '/notificaciones': '/notificaciones.html',
    '/perfil': '/perfil.html',
    '/ia': '/ia.html',
    '/detalle': '/detalle-requisicion.html',
    '/reclutadora': '/reclutadora.html',
    '/administrar': '/administrar-requisicion.html'
  };
  
  const destination = routes[path] || '/dashboard.html';
  window.location.href = destination;
}

// ===== SIDEBAR NAVIGATION =====
document.addEventListener('DOMContentLoaded', function() {
  // Marcar elemento activo en sidebar según la URL actual
  const currentPage = window.location.pathname.split('/').pop() || 'dashboard.html';
  const navItems = document.querySelectorAll('.nav-item[data-page]');
  
  navItems.forEach(item => {
    const page = item.getAttribute('data-page');
    if (page === currentPage) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });
});