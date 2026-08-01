// ==========================================
// MODO OSCURO - COMPLETO Y FUNCIONAL
// ==========================================

// Aplicar CSS del modo oscuro al cargar la página
(function() {
  var darkModeCSS = `
    /* Estilos adicionales para modo oscuro */
    body.dark-mode .sidebar {
      background: #1e293b;
    }
    body.dark-mode .sidebar .logo-text {
      color: #60a5fa;
    }
    body.dark-mode .sidebar .logo-sub {
      color: #94a3b8;
    }
    body.dark-mode .nav-item {
      color: #94a3b8;
    }
    body.dark-mode .nav-item:hover {
      background: #334155;
      color: #60a5fa;
    }
    body.dark-mode .nav-item.active {
      background: #1e3a5f;
      color: #60a5fa;
    }
    body.dark-mode .nav-item.active i {
      color: #60a5fa;
    }
    body.dark-mode .nav-divider {
      border-color: #334155;
    }
    body.dark-mode .sidebar-user-info {
      background: #1e3a5f;
    }
    body.dark-mode .sidebar-user-info .user-name {
      color: #e2e8f0;
    }
    body.dark-mode .sidebar-user-info .user-role {
      color: #94a3b8;
    }
    body.dark-mode .sidebar-toggle {
      color: #94a3b8;
    }
    body.dark-mode .sidebar-toggle:hover {
      background: #334155;
      color: #60a5fa;
    }
    body.dark-mode .badge-blue {
      background: #1e3a5f;
      color: #60a5fa;
    }
    body.dark-mode .badge-green {
      background: #1a3a2a;
      color: #4ade80;
    }
    body.dark-mode .badge-red {
      background: #3a1a1a;
      color: #f87171;
    }
    body.dark-mode .badge-yellow {
      background: #3a2a1a;
      color: #fbbf24;
    }
    body.dark-mode .badge-gray {
      background: #334155;
      color: #94a3b8;
    }
    body.dark-mode .modal-overlay {
      background: rgba(0, 0, 0, 0.7);
    }
    body.dark-mode .empty-state {
      color: #94a3b8;
    }
    body.dark-mode .search-results-dropdown {
      background: #1e293b;
      border-color: #334155;
    }
    body.dark-mode .search-result-item {
      border-color: #334155;
    }
    body.dark-mode .search-result-item:hover {
      background: #0f172a;
    }
    body.dark-mode .search-result-title {
      color: #e2e8f0;
    }
    body.dark-mode .search-result-desc {
      color: #94a3b8;
    }
    body.dark-mode .search-empty {
      color: #94a3b8;
    }
    body.dark-mode .switch .slider {
      background: #334155;
    }
    body.dark-mode .switch input:checked + .slider {
      background: #60a5fa;
    }
  `;
  
  var styleEl = document.createElement('style');
  styleEl.textContent = darkModeCSS;
  document.head.appendChild(styleEl);
})();

// ==========================================
// TOGGLE MODO OSCURO
// ==========================================
function toggleDarkMode() {
  var isDark = document.body.classList.toggle('dark-mode');
  localStorage.setItem('darkMode', isDark ? 'true' : 'false');
  
  // Actualizar toggle si existe
  var toggle = document.getElementById('darkModeToggle');
  if (toggle) {
    toggle.checked = isDark;
  }
}

// ==========================================
// INICIALIZAR MODO OSCURO
// ==========================================
function initDarkMode() {
  var darkMode = localStorage.getItem('darkMode') === 'true';
  
  if (darkMode) {
    document.body.classList.add('dark-mode');
    var toggle = document.getElementById('darkModeToggle');
    if (toggle) {
      toggle.checked = true;
    }
  }
  
  // Sincronizar toggle cuando se carga
  var toggle = document.getElementById('darkModeToggle');
  if (toggle) {
    toggle.addEventListener('change', function() {
      toggleDarkMode();
    });
  }
}

// ==========================================
// EJECUTAR AL CARGAR LA PÁGINA
// ==========================================
document.addEventListener('DOMContentLoaded', function() {
  initDarkMode();
});

// Ejecutar también inmediatamente si el DOM ya está cargado
if (document.readyState === 'complete' || document.readyState === 'interactive') {
  initDarkMode();
}