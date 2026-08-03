// ==========================================
// MENÚ LATERAL - CONFIGURACIÓN POR ROL
// ==========================================

var MENU_CONFIG = {
    'Administrador': [
        { icon: 'fas fa-chart-pie', label: 'Dashboard', link: '/dashboard.html' },
        { icon: 'fas fa-plus-circle', label: 'Nueva Requisición', link: '/nueva-requisicion.html' },
        { icon: 'fas fa-list-ul', label: 'Requisiciones', link: '/requisiciones.html' },
        { icon: 'fas fa-user-tie', label: 'Reclutamiento', link: '/reclutadora.html' },
        { icon: 'fas fa-briefcase', label: 'Vacantes', link: '/vacantes.html' },
        { icon: 'fas fa-tasks', label: 'Seguimiento', link: '/seguimiento.html' },
        { divider: true },
        { icon: 'fas fa-chart-line', label: 'Reportes', link: '/reportes.html' },
        { icon: 'fas fa-crown', label: 'Dashboard Ejecutivo', link: '/dashboard-ejecutivo.html' },
        { divider: true },
        { icon: 'fas fa-users-cog', label: 'Usuarios', link: '/usuarios.html' },
        { icon: 'fas fa-cog', label: 'Configuración', link: '/configuracion.html' },
        { icon: 'fas fa-bell', label: 'Notificaciones', link: '/notificaciones.html' },
        { icon: 'fas fa-user-circle', label: 'Perfil', link: '/perfil.html' },
        { icon: 'fas fa-robot', label: 'Smart AI', link: '/ia.html' }
    ],
    'Gerente RH': [
        { icon: 'fas fa-chart-pie', label: 'Dashboard', link: '/dashboard.html' },
        { icon: 'fas fa-plus-circle', label: 'Nueva Requisición', link: '/nueva-requisicion.html' },
        { icon: 'fas fa-list-ul', label: 'Requisiciones', link: '/requisiciones.html' },
        { icon: 'fas fa-user-tie', label: 'Reclutamiento', link: '/reclutadora.html' },
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
        { icon: 'fas fa-chart-pie', label: 'Dashboard', link: '/dashboard.html' },
        { icon: 'fas fa-list-ul', label: 'Mis Requisiciones', link: '/requisiciones.html' },
        { icon: 'fas fa-user-tie', label: 'Panel Reclutadora', link: '/reclutadora.html' },
        { icon: 'fas fa-briefcase', label: 'Vacantes', link: '/vacantes.html' },
        { icon: 'fas fa-tasks', label: 'Seguimiento', link: '/seguimiento.html' },
        { divider: true },
        { icon: 'fas fa-bell', label: 'Notificaciones', link: '/notificaciones.html' },
        { icon: 'fas fa-user-circle', label: 'Perfil', link: '/perfil.html' },
        { icon: 'fas fa-robot', label: 'Smart AI', link: '/ia.html' }
    ],
    'Ejecutivo': [
        { icon: 'fas fa-chart-pie', label: 'Dashboard', link: '/dashboard.html' },
        { icon: 'fas fa-crown', label: 'Dashboard Ejecutivo', link: '/dashboard-ejecutivo.html' },
        { icon: 'fas fa-chart-line', label: 'Reportes', link: '/reportes.html' },
        { divider: true },
        { icon: 'fas fa-bell', label: 'Notificaciones', link: '/notificaciones.html' },
        { icon: 'fas fa-user-circle', label: 'Perfil', link: '/perfil.html' },
        { icon: 'fas fa-robot', label: 'Smart AI', link: '/ia.html' }
    ]
};

// ==========================================
// GENERAR SIDEBAR HTML
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

    // Botones de sincronización (solo para administradores)
    if (user.role === 'Administrador') {
        navHTML += `
            <div class="nav-divider"></div>
            <div style="padding: 8px 12px; display: flex; flex-direction: column; gap: 6px;">
                <button onclick="sincronizarConSupabase()" style="
                    width: 100%;
                    padding: 10px 12px;
                    border: none;
                    border-radius: 8px;
                    background: var(--primary);
                    color: white;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    font-size: 13px;
                    font-weight: 500;
                    transition: all 0.2s;
                ">
                    <i class="fas fa-cloud-upload-alt"></i> Subir a nube
                </button>
                <button onclick="initSupabaseData()" style="
                    width: 100%;
                    padding: 10px 12px;
                    border: none;
                    border-radius: 8px;
                    background: #2b8c4a;
                    color: white;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    font-size: 13px;
                    font-weight: 500;
                    transition: all 0.2s;
                ">
                    <i class="fas fa-cloud-download-alt"></i> Bajar de nube
                </button>
                <div style="font-size: 10px; color: var(--text-muted); text-align: center; margin-top: 4px;">
                    ${navigator.onLine ? '🟢 En línea' : '🔴 Sin conexión'}
                </div>
            </div>
        `;
    }

    navHTML += `
        <div class="nav-divider"></div>
        <a class="nav-item" onclick="logout()" style="color: var(--danger); cursor: pointer;">
            <i class="fas fa-sign-out-alt"></i>
            <span>Cerrar sesión</span>
        </a>
    `;

    var initial = user.name ? user.name.charAt(0).toUpperCase() : 'U';

    return `
        <aside class="sidebar" id="sidebar">
            <div class="logo-area">
                <div class="logo-icon">S</div>
                <div>
                    <span class="logo-text">SIMAN</span>
                    <span class="logo-sub">SmartRecruit</span>
                </div>
            </div>

            <div style="display:flex; align-items:center; gap:12px; padding:12px 8px; margin-bottom:16px; border-radius:var(--radius); background:var(--bg-body);">
                <div style="width:44px; height:44px; border-radius:50%; background:var(--primary); color:white; display:flex; align-items:center; justify-content:center; font-weight:600; font-size:18px;">${initial}</div>
                <div>
                    <div style="font-weight:500; font-size:14px; color:var(--text-primary);">${user.name || 'Usuario'}</div>
                    <div style="font-size:12px; color:var(--text-muted);">${user.role || 'Colaborador'}</div>
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

    return `
        <div class="topbar">
            <div class="greeting">
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
                </div>
                <div class="icon-btn" onclick="navigateTo('/notificaciones.html')">
                    <i class="far fa-bell"></i>
                    <span class="notification-badge" style="display:none;"></span>
                </div>
                <div class="avatar" onclick="navigateTo('/perfil.html')">${initial}</div>
            </div>
        </div>
    `;
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
    }

    var topbarContainer = document.getElementById('topbar-container');
    if (topbarContainer) {
        topbarContainer.innerHTML = getTopbarHTML(user);
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

// ==========================================
// FUNCIONES DE SINCRONIZACIÓN (wrapper)
// ==========================================

// Esta función llama a la función real de supabase-client.js
function sincronizarConSupabase() {
    if (typeof window.sincronizarConSupabase === 'function') {
        if (confirm('⚠️ ¿Deseas subir tus datos a la nube?\n\nEsto guardará todos los cambios en la nube.')) {
            window.sincronizarConSupabase().then(function(resultado) {
                if (typeof agregarNotificacion === 'function') {
                    if (resultado && resultado.error) {
                        agregarNotificacion('danger', '❌ Error al sincronizar: ' + resultado.error, '#');
                    } else {
                        agregarNotificacion('success', '✅ Datos sincronizados correctamente', '#');
                    }
                }
            }).catch(function(error) {
                if (typeof agregarNotificacion === 'function') {
                    agregarNotificacion('danger', '❌ Error al sincronizar: ' + error.message, '#');
                }
            });
        }
    } else {
        alert('⚠️ La función de sincronización no está disponible. Asegúrate de que supabase-client.js esté cargado.');
    }
}

// Esta función llama a la función real de supabase-client.js
function initSupabaseData() {
    if (typeof window.initSupabaseData === 'function') {
        if (confirm('⚠️ ¿Deseas cargar los datos desde la nube?\n\nEsto fusionará los datos locales con los de la nube.')) {
            window.initSupabaseData().then(function() {
                if (typeof agregarNotificacion === 'function') {
                    agregarNotificacion('success', '✅ Datos cargados desde la nube correctamente', '#');
                }
            }).catch(function(error) {
                if (typeof agregarNotificacion === 'function') {
                    agregarNotificacion('danger', '❌ Error al cargar desde la nube: ' + error.message, '#');
                }
            });
        }
    } else {
        alert('⚠️ La función de carga desde la nube no está disponible. Asegúrate de que supabase-client.js esté cargado.');
    }
}

// Exponer funciones globalmente
window.sincronizarConSupabase = sincronizarConSupabase;
window.initSupabaseData = initSupabaseData;
window.initLayout = initLayout;