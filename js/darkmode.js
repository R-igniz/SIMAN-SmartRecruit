// MODO OSCURO GLOBAL - versión TEST productiva
(function () {
    'use strict';
    function estadoGuardado() { return localStorage.getItem('darkMode') === 'true'; }
    function aplicar(enable) {
        document.documentElement.classList.toggle('dark-mode-root', enable);
        if (document.body) document.body.classList.toggle('dark-mode', enable);
        document.querySelectorAll('#darkModeToggle').forEach(function(t){ t.checked = enable; });
        localStorage.setItem('darkMode', enable ? 'true' : 'false');
    }
    window.toggleDarkMode = function () { aplicar(!document.body.classList.contains('dark-mode')); };
    window.forceDarkMode = function (enable) { aplicar(enable === undefined ? !estadoGuardado() : !!enable); };
    function init() {
        aplicar(estadoGuardado());
        document.querySelectorAll('#darkModeToggle').forEach(function(toggle) {
            if (toggle.dataset.darkBound === '1') return;
            toggle.dataset.darkBound = '1';
            toggle.addEventListener('change', function(){ aplicar(toggle.checked); });
        });
    }
    // Evita el destello claro antes de DOMContentLoaded cuando sea posible.
    if (estadoGuardado()) document.documentElement.classList.add('dark-mode-root');
    document.addEventListener('DOMContentLoaded', init);
    window.addEventListener('load', init);
    window.addEventListener('storage', function(e){ if (e.key === 'darkMode') aplicar(e.newValue === 'true'); });
})();
