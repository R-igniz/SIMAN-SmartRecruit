// ==========================================
// REPORTES - VISUALIZACIÓN DE REPORTES
// ==========================================

function cargarReportes() {
    var container = document.getElementById('reportesContainer');
    if (!container) return;
    
    var data = obtenerDatosConfig();
    var requisiciones = JSON.parse(localStorage.getItem('requisiciones_data') || '[]');
    
    // Generar reporte básico
    var reporte = {
        totalUsuarios: data.usuarios ? data.usuarios.length : 0,
        totalRoles: data.roles ? data.roles.length : 0,
        totalRequisiciones: requisiciones.length,
        requisicionesAbiertas: requisiciones.filter(function(r) { return r.estado !== 'Cerrado'; }).length,
        requisicionesCerradas: requisiciones.filter(function(r) { return r.estado === 'Cerrado'; }).length,
        prioridades: {
            Alta: requisiciones.filter(function(r) { return r.prioridad === 'Alta'; }).length,
            Media: requisiciones.filter(function(r) { return r.prioridad === 'Media'; }).length,
            Baja: requisiciones.filter(function(r) { return r.prioridad === 'Baja'; }).length
        }
    };
    
    container.innerHTML = `
        <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap:16px;">
            <div class="kpi-card">
                <div class="label">Total Usuarios</div>
                <div class="value">${reporte.totalUsuarios}</div>
            </div>
            <div class="kpi-card">
                <div class="label">Total Requisiciones</div>
                <div class="value">${reporte.totalRequisiciones}</div>
            </div>
            <div class="kpi-card">
                <div class="label">Abiertas</div>
                <div class="value">${reporte.requisicionesAbiertas}</div>
            </div>
            <div class="kpi-card">
                <div class="label">Cerradas</div>
                <div class="value">${reporte.requisicionesCerradas}</div>
            </div>
            <div class="kpi-card">
                <div class="label">Prioridad Alta</div>
                <div class="value">${reporte.prioridades.Alta}</div>
            </div>
            <div class="kpi-card">
                <div class="label">Prioridad Media</div>
                <div class="value">${reporte.prioridades.Media}</div>
            </div>
        </div>
    `;
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
    // ✅ CORRECCIÓN: usar tienePermiso
    if (!tienePermiso('ver_reportes')) {
        alert('⚠️ Acceso denegado. No tienes permisos para ver reportes.');
        window.location.href = '/dashboard.html';
        return;
    }
    
    cargarReportes();
});

window.cargarReportes = cargarReportes;