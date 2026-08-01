// ==========================================
// MENÚ LATERAL POR ROL
// ==========================================
var MENU_CONFIG = {
    'Administrador': [
        { icon: 'fas fa-th-large', label: 'Dashboard', link: '/dashboard.html' },
        { icon: 'fas fa-plus-circle', label: 'Nueva Requisición', link: '/nueva-requisicion.html' },
        { icon: 'fas fa-list-ul', label: 'Requisiciones', link: '/requisiciones.html' },
        { icon: 'fas fa-briefcase', label: 'Vacantes', link: '/vacantes.html' },
        { icon: 'fas fa-tasks', label: 'Seguimiento', link: '/seguimiento.html' },
        { icon: 'fas fa-user-tie', label: 'Reclutamiento', link: '/reclutadora.html' },
        { divider: true },
        { icon: 'fas fa-chart-line', label: 'Reportes', link: '/reportes.html' },
        { icon: 'fas fa-crown', label: 'Ejecutivo', link: '/dashboard-ejecutivo.html' },
        { divider: true },
        { icon: 'fas fa-cog', label: 'Configuración', link: '/configuracion.html' },
        { icon: 'fas fa-bell', label: 'Notificaciones', link: '/notificaciones.html' },
        { icon: 'fas fa-user-circle', label: 'Perfil', link: '/perfil.html' },
        { icon: 'fas fa-robot', label: 'Smart AI', link: '/ia.html' }
    ],
    'Gerente RH': [
        { icon: 'fas fa-th-large', label: 'Dashboard', link: '/dashboard.html' },
        { icon: 'fas fa-plus-circle', label: 'Nueva Requisición', link: '/nueva-requisicion.html' },
        { icon: 'fas fa-list-ul', label: 'Requisiciones', link: '/requisiciones.html' },
        { icon: 'fas fa-briefcase', label: 'Vacantes', link: '/vacantes.html' },
        { icon: 'fas fa-tasks', label: 'Seguimiento', link: '/seguimiento.html' },
        { divider: true },
        { icon: 'fas fa-chart-line', label: 'Reportes', link: '/reportes.html' },
        { divider: true },
        { icon: 'fas fa-bell', label: 'Notificaciones', link: '/notificaciones.html' },
        { icon: 'fas fa-user-circle', label: 'Perfil', link: '/perfil.html' },
        { icon: 'fas fa-robot', label: 'Smart AI', link: '/ia.html' }
    ],
    'Reclutadora': [
        { icon: 'fas fa-th-large', label: 'Dashboard', link: '/dashboard.html' },
        { icon: 'fas fa-list-ul', label: 'Mis Requisiciones', link: '/requisiciones.html' },
        { icon: 'fas fa-briefcase', label: 'Vacantes', link: '/vacantes.html' },
        { icon: 'fas fa-tasks', label: 'Seguimiento', link: '/seguimiento.html' },
        { divider: true },
        { icon: 'fas fa-bell', label: 'Notificaciones', link: '/notificaciones.html' },
        { icon: 'fas fa-user-circle', label: 'Perfil', link: '/perfil.html' },
        { icon: 'fas fa-robot', label: 'Smart AI', link: '/ia.html' }
    ],
    'Ejecutivo': [
        { icon: 'fas fa-th-large', label: 'Dashboard', link: '/dashboard.html' },
        { icon: 'fas fa-crown', label: 'Dashboard Ejecutivo', link: '/dashboard-ejecutivo.html' },
        { icon: 'fas fa-chart-line', label: 'Reportes', link: '/reportes.html' },
        { divider: true },
        { icon: 'fas fa-bell', label: 'Notificaciones', link: '/notificaciones.html' },
        { icon: 'fas fa-user-circle', label: 'Perfil', link: '/perfil.html' },
        { icon: 'fas fa-robot', label: 'Smart AI', link: '/ia.html' }
    ]
};

// ==========================================
// GENERAR SIDEBAR
// ==========================================
function getSidebarHTML() {
    var user = getCurrentUser();
    if (!user) return '';

    var items = MENU_CONFIG[user.role] || MENU_CONFIG['Reclutadora'];
    var navHTML = '';
    var currentPage = window.location.pathname.split('/').pop() || 'dashboard.html';

    items.forEach(function(item) {
        if (item.divider) {
            navHTML += '<div class="nav-divider"></div>';
            return;
        }

        var linkPage = item.link.split('/').pop();
        var isActive = linkPage === currentPage || (item.link === '/dashboard.html' && currentPage === '');

        navHTML += `
            <a class="nav-item ${isActive ? 'active' : ''}" href="${item.link}">
                <i class="${item.icon}"></i>
                <span>${item.label}</span>
            </a>
        `;
    });

    navHTML += `
        <div class="nav-divider"></div>
        <a class="nav-item" onclick="logout()" style="color: var(--danger); cursor: pointer;">
            <i class="fas fa-sign-out-alt"></i>
            <span>Cerrar sesión</span>
        </a>
    `;

    var initial = user.name ? user.name.charAt(0).toUpperCase() : 'U';
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
                <button class="sidebar-toggle" onclick="toggleSidebar()" title="${toggleText}">
                    <i class="${iconClass}" id="sidebarToggleIcon"></i>
                    <span>${toggleText}</span>
                </button>
            </div>

            <div class="sidebar-user">
                <div class="avatar">${initial}</div>
                <div>
                    <div class="user-name">${user.name || 'Usuario'}</div>
                    <div class="user-role">${user.role || 'Colaborador'}</div>
                </div>
            </div>

            <nav class="nav">
                ${navHTML}
            </nav>
        </aside>
    `;
}

// ==========================================
// TOPBAR
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
                    <input placeholder="Buscar..." />
                </div>
                <div class="icon-btn" onclick="navigateTo('/notificaciones.html')">
                    <i class="far fa-bell"></i>
                    <span class="dot"></span>
                </div>
                <div class="avatar-user" onclick="navigateTo('/perfil.html')">${initial}</div>
            </div>
        </div>
    `;
}

// ==========================================
// TOGGLES
// ==========================================
function toggleSidebar() {
    var sidebar = document.getElementById('sidebar');
    var mainContent = document.querySelector('.main-content');
    var icon = document.getElementById('sidebarToggleIcon');
    var toggleText = sidebar ? sidebar.querySelector('.sidebar-toggle span') : null;

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

function toggleSidebarMobile() {
    var sidebar = document.getElementById('sidebar');
    var overlay = document.getElementById('sidebarOverlay');
    if (!sidebar) return;

    sidebar.classList.toggle('mobile-open');
    if (overlay) overlay.classList.toggle('active');
}

// ==========================================
// INICIALIZAR LAYOUT
// ==========================================
function initLayout() {
    var user = getCurrentUser();
    if (!user) return;

    var sidebarContainer = document.getElementById('sidebar-container');
    if (sidebarContainer) {
        sidebarContainer.innerHTML = getSidebarHTML();

        if (!document.getElementById('sidebarOverlay')) {
            var overlay = document.createElement('div');
            overlay.id = 'sidebarOverlay';
            overlay.className = 'sidebar-overlay';
            overlay.onclick = function() { toggleSidebarMobile(); };
            document.body.prepend(overlay);
        }

        var mainContent = document.querySelector('.main-content');
        var isCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
        if (mainContent && isCollapsed) {
            mainContent.classList.add('expanded');
        }
    }

    var topbarContainer = document.getElementById('topbar-container');
    if (topbarContainer) {
        topbarContainer.innerHTML = getTopbarHTML(user);
    }
}

document.addEventListener('DOMContentLoaded', function() {
    var currentPage = window.location.pathname;
    if (!currentPage.includes('login.html') && currentPage !== '/') {
        var user = getCurrentUser();
        if (user) {
            initLayout();
        }
    }
});