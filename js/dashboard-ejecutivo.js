// ==========================================
// DASHBOARD EJECUTIVO - MÉTRICAS AVANZADAS
// ==========================================

function cargarDashboardEjecutivo() {
    var container = document.getElementById('dashboardEjecutivoContainer');
    if (!container) return;
    
    var data = obtenerDatosConfig();
    var requisiciones = JSON.parse(localStorage.getItem('requisiciones_data') || '[]');
    
    // Métricas
    var totalUsuarios = data.usuarios ? data.usuarios.length : 0;
    var totalRequisiciones = requisiciones.length;
    var abiertas = requisiciones.filter(function(r) { return r.estado !== 'Cerrado'; }).length;
    var cerradas = requisiciones.filter(function(r) { return r.estado === 'Cerrado'; }).length;
    var tasaExito = totalRequisiciones > 0 ? Math.round((cerradas / totalRequisiciones) * 100) : 0;
    
    // Reclutadores más activos
    var reclutadores = {};
    requisiciones.forEach(function(r) {
        var reclutador = r.reclutador || 'Sin asignar';
        if (!reclutadores[reclutador]) reclutadores[reclutador] = 0;
        reclutadores[reclutador]++;
    });
    
    var topReclutadores = Object.keys(reclutadores).map(function(key) {
        return { nombre: key, cantidad: reclutadores[key] };
    }).sort(function(a, b) { return b.cantidad - a.cantidad; }).slice(0, 5);
    
    container.innerHTML = `
        <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap:16px; margin-bottom:20px;">
            <div class="kpi-card">
                <div class="label">Total Usuarios</div>
                <div class="value">${totalUsuarios}</div>
            </div>
            <div class="kpi-card">
                <div class="label">Total Requisiciones</div>
                <div class="value">${totalRequisiciones}</div>
            </div>
            <div class="kpi-card">
                <div class="label">Tasa de Éxito</div>
                <div class="value">${tasaExito}%</div>
            </div>
            <div class="kpi-card">
                <div class="label">Requisiciones Abiertas</div>
                <div class="value">${abiertas}</div>
            </div>
            <div class="kpi-card">
                <div class="label">Requisiciones Cerradas</div>
                <div class="value">${cerradas}</div>
            </div>
        </div>
        <div class="card">
            <div class="card-header"><span>Top Reclutadores</span></div>
            <div style="display:flex; flex-direction:column; gap:8px;">
                ${topReclutadores.map(function(r, index) {
                    return `<div style="display:flex; justify-content:space-between; padding:8px; background:var(--bg-body); border-radius:8px;">
                        <span>${index+1}. ${r.nombre}</span>
                        <span class="badge badge-blue">${r.cantidad}</span>
                    </div>`;
                }).join('')}
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
    if (!tienePermiso('ver_dashboard_ejecutivo')) {
        alert('⚠️ Acceso denegado. No tienes permisos para ver el Dashboard Ejecutivo.');
        window.location.href = '/dashboard.html';
        return;
    }
    
    cargarDashboardEjecutivo();
});

window.cargarDashboardEjecutivo = cargarDashboardEjecutivo;