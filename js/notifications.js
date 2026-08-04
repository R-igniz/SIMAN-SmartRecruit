// ==========================================
// SISTEMA DE NOTIFICACIONES
// ==========================================

function agregarNotificacion(tipo, mensaje, link, icono) {
    var notificaciones = JSON.parse(localStorage.getItem('notificaciones') || '[]');
    var user = getCurrentUser();
    
    var notificacion = {
        id: Date.now(),
        tipo: tipo, // 'success', 'warning', 'danger', 'info'
        mensaje: mensaje,
        link: link || '#',
        icono: icono || obtenerIconoPorTipo(tipo),
        leida: false,
        fecha: new Date().toISOString(),
        usuario: user ? user.name : 'Sistema'
    };
    
    notificaciones.unshift(notificacion);
    localStorage.setItem('notificaciones', JSON.stringify(notificaciones));
    
    actualizarBadgeNotificaciones();
    mostrarNotificacionToast(notificacion);
}

function obtenerIconoPorTipo(tipo) {
    var iconos = {
        'success': 'fas fa-check-circle',
        'warning': 'fas fa-exclamation-triangle',
        'danger': 'fas fa-times-circle',
        'info': 'fas fa-info-circle'
    };
    return iconos[tipo] || 'fas fa-bell';
}

function mostrarNotificacionToast(notificacion) {
    var toastContainer = document.getElementById('toastContainer');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toastContainer';
        toastContainer.style.cssText = 'position:fixed; top:20px; right:20px; z-index:9999; max-width:350px;';
        document.body.appendChild(toastContainer);
    }
    
    var colores = {
        'success': '#2b8c4a',
        'warning': '#d4a017',
        'danger': '#b33c3c',
        'info': '#0056A6'
    };
    
    var toast = document.createElement('div');
    toast.style.cssText = `
        background: var(--bg-card, #ffffff);
        color: var(--text-primary, #404040);
        border-left: 4px solid ${colores[notificacion.tipo] || '#0056A6'};
        border-radius: 8px;
        padding: 12px 16px;
        margin-bottom: 8px;
        box-shadow: var(--shadow-hover, 0 8px 30px rgba(0,0,0,0.12));
        display: flex;
        align-items: center;
        gap: 12px;
        animation: slideIn 0.3s ease;
        cursor: pointer;
        transition: opacity 0.3s ease;
        max-width: 350px;
    `;
    toast.innerHTML = `
        <i class="${notificacion.icono}" style="color:${colores[notificacion.tipo] || '#0056A6'}; font-size:20px;"></i>
        <div style="flex:1; min-width:0;">
            <div style="font-weight:500; font-size:14px; word-wrap:break-word;">${notificacion.mensaje}</div>
            <div style="font-size:11px; color:var(--text-muted, #5f6b7a);">${new Date(notificacion.fecha).toLocaleTimeString()}</div>
        </div>
        <button onclick="this.parentElement.remove()" style="background:none; border:none; color:var(--text-muted, #5f6b7a); cursor:pointer; font-size:16px; flex-shrink:0;">×</button>
    `;
    
    toast.onclick = function(e) {
        if (e.target.tagName !== 'BUTTON') {
            if (notificacion.link !== '#') {
                window.location.href = notificacion.link;
            }
            this.remove();
            marcarNotificacionLeida(notificacion.id);
        }
    };
    
    toastContainer.appendChild(toast);
    
    setTimeout(function() {
        if (toast.parentElement) {
            toast.style.opacity = '0';
            setTimeout(function() {
                if (toast.parentElement) toast.remove();
            }, 300);
        }
    }, 5000);
}

function actualizarBadgeNotificaciones() {
    var notificaciones = JSON.parse(localStorage.getItem('notificaciones') || '[]');
    var noLeidas = notificaciones.filter(function(n) { return !n.leida; }).length;
    
    var badge = document.querySelector('.icon-btn .notification-badge');
    if (!badge) {
        var iconBtn = document.querySelector('.icon-btn');
        if (iconBtn) {
            badge = document.createElement('span');
            badge.className = 'notification-badge';
            badge.style.cssText = `
                position: absolute;
                top: -4px;
                right: -4px;
                background: #b33c3c;
                color: white;
                border-radius: 50%;
                width: 18px;
                height: 18px;
                font-size: 10px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: 600;
            `;
            iconBtn.style.position = 'relative';
            iconBtn.appendChild(badge);
        }
    }
    
    if (badge) {
        badge.textContent = noLeidas > 9 ? '9+' : noLeidas;
        badge.style.display = noLeidas > 0 ? 'flex' : 'none';
    }
}

function marcarNotificacionLeida(id) {
    var notificaciones = JSON.parse(localStorage.getItem('notificaciones') || '[]');
    var notificacion = notificaciones.find(function(n) { return n.id === id; });
    if (notificacion) {
        notificacion.leida = true;
        localStorage.setItem('notificaciones', JSON.stringify(notificaciones));
        actualizarBadgeNotificaciones();
    }
}

function marcarTodasLeidas() {
    var notificaciones = JSON.parse(localStorage.getItem('notificaciones') || '[]');
    notificaciones.forEach(function(n) { n.leida = true; });
    localStorage.setItem('notificaciones', JSON.stringify(notificaciones));
    actualizarBadgeNotificaciones();
}

function obtenerNotificaciones(filtro) {
    var notificaciones = JSON.parse(localStorage.getItem('notificaciones') || '[]');
    if (filtro === 'noLeidas') {
        return notificaciones.filter(function(n) { return !n.leida; });
    }
    if (filtro === 'leidas') {
        return notificaciones.filter(function(n) { return n.leida; });
    }
    return notificaciones;
}

// ==========================================
// ESTILOS PARA NOTIFICACIONES
// ==========================================
var styleNotif = document.createElement('style');
styleNotif.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
`;
document.head.appendChild(styleNotif);

// ==========================================
// INICIALIZAR
// ==========================================
document.addEventListener('DOMContentLoaded', function() {
    actualizarBadgeNotificaciones();
});

// ==========================================
// EXPONER FUNCIONES GLOBALMENTE
// ==========================================
window.agregarNotificacion = agregarNotificacion;
window.marcarTodasLeidas = marcarTodasLeidas;
window.obtenerNotificaciones = obtenerNotificaciones;
window.marcarNotificacionLeida = marcarNotificacionLeida;