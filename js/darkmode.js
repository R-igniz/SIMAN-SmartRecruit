// ==========================================
// MODO OSCURO - APLICACIÓN GLOBAL
// ==========================================

// Función principal para activar/desactivar modo oscuro
function toggleDarkMode() {
    var isDark = document.body.classList.toggle('dark-mode');
    localStorage.setItem('darkMode', isDark ? 'true' : 'false');
    
    // Actualizar toggle si existe en la página actual
    var toggle = document.getElementById('darkModeToggle');
    if (toggle) {
        toggle.checked = isDark;
    }
    
    console.log('🌙 Modo oscuro:', isDark ? 'activado' : 'desactivado');
}

// Función para inicializar el modo oscuro
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
        // Remover listeners anteriores para evitar duplicados
        var newToggle = toggle.cloneNode(true);
        toggle.parentNode.replaceChild(newToggle, toggle);
        
        newToggle.addEventListener('change', function() {
            toggleDarkMode();
        });
    }
    
    console.log('🌙 Modo oscuro inicializado, estado:', darkMode ? 'activado' : 'desactivado');
}

// ==========================================
// APLICAR MODO OSCURO A TODAS LAS PÁGINAS
// ==========================================
// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    initDarkMode();
});

// Si el DOM ya está cargado, inicializar inmediatamente
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    initDarkMode();
}

// Escuchar cambios en localStorage desde otras pestañas
window.addEventListener('storage', function(e) {
    if (e.key === 'darkMode') {
        var isDark = e.newValue === 'true';
        document.body.classList.toggle('dark-mode', isDark);
        console.log('🌙 Modo oscuro sincronizado desde otra pestaña:', isDark);
    }
});

// ==========================================
// FUNCIÓN PARA FORZAR MODO OSCURO (útil para debugging)
// ==========================================
function forceDarkMode(enable) {
    if (enable === undefined) {
        toggleDarkMode();
    } else {
        if (enable) {
            document.body.classList.add('dark-mode');
            localStorage.setItem('darkMode', 'true');
        } else {
            document.body.classList.remove('dark-mode');
            localStorage.setItem('darkMode', 'false');
        }
        var toggle = document.getElementById('darkModeToggle');
        if (toggle) {
            toggle.checked = enable;
        }
    }
}