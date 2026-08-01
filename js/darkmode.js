// ==========================================
// MODO OSCURO - COMPLETO
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

// Inicializar al cargar la página
document.addEventListener('DOMContentLoaded', function() {
  initDarkMode();
});

// Si el DOM ya está cargado, inicializar inmediatamente
if (document.readyState === 'complete' || document.readyState === 'interactive') {
  initDarkMode();
}