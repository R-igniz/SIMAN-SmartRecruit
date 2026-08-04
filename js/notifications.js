// ==========================================
// NOTIFICACIONES - CENTRO DE NOTIFICACIONES
// ==========================================

function cargarNotificaciones() {
    var container = document.getElementById('notificacionesContainer');
    if (!container) return;
    
    var notificaciones = JSON.parse(localStorage.getItem('notificaciones') || '[]');
    
    if (notificaciones.length === 0) {
        container.innerHTML = '<div class="empty-state"><i class="fas fa-inbox"></i>No hay notificaciones</div>';
        return;
    }
    
    container.innerHTML = notificaciones.map(function(n) {
        var fecha = new Date(n.fecha).toLocaleString();
        var leidaClass = n.leida ? 'badge-gray' : 'badge-blue';
        return `
            <div style="padding:12px 16px; border-bottom:1px solid var(--border-color); display:flex; justify-content:space-between; align-items:center;">
                <div>
                    <div style="font-weight:500;">${n.mensaje}</div>
                    <div style="font-size:12px; color:var(--text-muted);">${fecha}</div>
                </div>
                <span class="badge ${leidaClass}">${n.leida ? 'Leída' : 'Nueva'}</span>
            </div>
        `;
    }).join('');
}

// ==========================================
// INICIALIZAR
// ==========================================
document.addEventListener('DOMContentLoaded', function() {
    var user = getCurrentUser();
    if (!user) {
        window.location.href = '/login.html';
        return;
    }
    // ✅ Permitir a todos los autenticados (sin verificación de administrador)
    cargarNotificaciones();
});

window.cargarNotificaciones = cargarNotificaciones;