// ==========================================
// BUSCADOR GLOBAL
// ==========================================
function buscarGlobal(query) {
  var resultados = [];
  if (!query || query.length < 2) return resultados;
  
  var q = query.toLowerCase().trim();
  
  // Buscar en usuarios (desde configuración)
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
    if (r.centroComercial && r.centroComercial.toLowerCase().includes(q)) {
      resultados.push({
        tipo: 'Requisición',
        nombre: r.centroComercial,
        descripcion: 'Puesto: ' + (r.puesto || 'Sin título'),
        link: '/detalle',
        icon: 'fas fa-store'
      });
    }
  });
  
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
  
  return resultados.slice(0, 10);
}

// ==========================================
// RENDERIZAR RESULTADOS DE BÚSQUEDA
// ==========================================
function renderizarResultadosBusqueda(resultados) {
  var container = document.getElementById('searchResults');
  if (!container) return;
  
  if (!resultados || resultados.length === 0) {
    container.innerHTML = '<div class="search-empty">No se encontraron resultados</div>';
    return;
  }
  
  container.innerHTML = resultados.map(function(r) {
    return '<div class="search-result-item" onclick="window.location.href=\'' + r.link + '\'">' +
      '<i class="' + r.icon + '" style="color:#0056A6;"></i>' +
      '<div class="search-result-content">' +
        '<div class="search-result-title">' + r.nombre + '</div>' +
        '<div class="search-result-desc">' + r.tipo + ' · ' + r.descripcion + '</div>' +
      '</div>' +
    '</div>';
  }).join('');
}

// ==========================================
// INICIALIZAR BUSCADOR
// ==========================================
document.addEventListener('DOMContentLoaded', function() {
  var searchInput = document.querySelector('.search-box input');
  if (searchInput) {
    var resultsContainer = document.createElement('div');
    resultsContainer.id = 'searchResults';
    resultsContainer.className = 'search-results-dropdown';
    searchInput.parentNode.appendChild(resultsContainer);
    
    searchInput.addEventListener('input', function() {
      var query = this.value;
      if (query.length >= 2) {
        var resultados = buscarGlobal(query);
        renderizarResultadosBusqueda(resultados);
        resultsContainer.style.display = 'block';
      } else {
        resultsContainer.style.display = 'none';
      }
    });
    
    document.addEventListener('click', function(e) {
      if (!searchInput.contains(e.target) && !resultsContainer.contains(e.target)) {
        resultsContainer.style.display = 'none';
      }
    });
  }
});