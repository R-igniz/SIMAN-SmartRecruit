// ==========================================
// MODO OSCURO GLOBAL - SIMAN SMARTRECRUIT
// ==========================================
(function () {
    var STORAGE_KEY = 'darkMode';

    function aplicarTema(isDark) {
        document.body.classList.toggle('dark-mode', !!isDark);
        document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
        var toggle = document.getElementById('darkModeToggle');
        if (toggle) toggle.checked = !!isDark;
    }

    function estadoGuardado() {
        return localStorage.getItem(STORAGE_KEY) === 'true';
    }

    function toggleDarkMode() {
        var nuevo = !document.body.classList.contains('dark-mode');
        localStorage.setItem(STORAGE_KEY, nuevo ? 'true' : 'false');
        aplicarTema(nuevo);
        console.log('🌙 Modo oscuro:', nuevo ? 'activado' : 'desactivado');
    }

    function initDarkMode() {
        aplicarTema(estadoGuardado());
        var toggle = document.getElementById('darkModeToggle');
        if (toggle && toggle.dataset.darkBound !== '1') {
            toggle.dataset.darkBound = '1';
            toggle.addEventListener('change', function () {
                localStorage.setItem(STORAGE_KEY, toggle.checked ? 'true' : 'false');
                aplicarTema(toggle.checked);
            });
        }
        console.log('🌙 Modo oscuro inicializado, estado:', estadoGuardado() ? 'activado' : 'desactivado');
    }

    document.addEventListener('DOMContentLoaded', initDarkMode);
    window.addEventListener('storage', function (e) {
        if (e.key === STORAGE_KEY) aplicarTema(e.newValue === 'true');
    });
    window.toggleDarkMode = toggleDarkMode;
    window.initDarkMode = initDarkMode;
    window.forceDarkMode = function(enable) {
        var value = enable === undefined ? !document.body.classList.contains('dark-mode') : !!enable;
        localStorage.setItem(STORAGE_KEY, value ? 'true' : 'false');
        aplicarTema(value);
    };
})();
