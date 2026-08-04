// ==========================================
// SEGUIMIENTO - CON DATOS REALES
// ==========================================

function cargarSeguimiento() {
    var container = document.getElementById('seguimientoContainer');
    if (!container) return;
    
    var requisiciones = JSON.parse(localStorage.getItem('requisiciones_data') || '[]');
    var data = obtenerDatosConfig();
    var reclutadores = data.usuarios ? data.usuarios.filter(function(u) { return u.rol === 'Reclutadora'; }) : [];
    
    container.innerHTML = '';
    
    if (requisiciones.length === 0) {
        container.innerHTML = '<div class="empty-state"><i class="fas fa-inbox"></i>No hay procesos activos</div>';
        return;
    }
    
    var activas = requisiciones.filter(function(r) {
        return r.estado !== 'Cerrado';
    });
    
    if (activas.length === 0) {
        container.innerHTML = '<div class="empty-state"><i class="fas fa-check-circle" style="color:var(--success);"></i>Todos los procesos están cerrados</div>';
        return;
    }
    
    var prioridadColor = {
        'Alta': 'var(--danger)',
        'Media': 'var(--warning)',
        'Baja': 'var(--success)'
    };
    
    activas.forEach(function(r) {
        var card = document.createElement('div');
        card.className = 'card';
        card.style.cssText = 'border-left:4px solid ' + (prioridadColor[r.prioridad] || 'var(--primary)') + '; margin-bottom:12px;';
        
        var estados = ['Nueva', 'Revisando', 'Publicada', 'En Proceso', 'Entrevistas', 'Oferta'];
        var index = estados.indexOf(r.estado);
        var progreso = index >= 0 ? Math.round((index / (estados.length - 1)) * 100) : 20;
        
        var reclutadorNombre = r.reclutador || 'No asignado';
        if (r.reclutador && reclutadores.length > 0) {
            var reclutador = reclutadores.find(function(u) { return u.nombre === r.reclutador; });
            if (reclutador) reclutadorNombre = reclutador.nombre;
        }
        
        card.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
                <div>
                    <strong>${r.id}</strong> - ${r.puesto || 'Sin título'}
                    <span style="color:var(--text-muted); font-size:13px; margin-left:8px;">
                        <i class="fas fa-store"></i> ${r.centro || '-'}
                        ${r.tienda ? '· ' + r.tienda : ''}
                    </span>
                </div>
                <div>
                    <span class="badge ${r.estado === 'Urgente' ? 'badge-red' : 'badge-blue'}">${r.estado || 'Nueva'}</span>
                    <span style="font-size:12px; color:var(--text-muted); margin-left:8px;">
                        <i class="fas fa-user-tie"></i> ${reclutadorNombre}
                    </span>
                </div>
            </div>
            <div style="margin-top:12px;">
                <div style="display:flex; gap:8px; flex-wrap:wrap; align-items:center;">
                    <span style="font-size:12px; color:var(--text-muted);">Progreso:</span>
                    <div style="flex:1; height:6px; background:var(--bg-body); border-radius:10px; min-width:100px;">
                        <div style="width:${progreso}%; height:100%; background:${progreso > 80 ? 'var(--success)' : progreso > 50 ? 'var(--primary)' : 'var(--warning)'}; border-radius:10px;"></div>
                    </div>
                    <span style="font-size:12px; font-weight:500;">${progreso}%</span>
                </div>
                <div style="display:flex; gap:8px; margin-top:8px; flex-wrap:wrap;">
                    <span class="badge ${r.estado === 'Nueva' ? 'badge-blue' : 'badge-green'}">
                        <i class="fas ${r.estado === 'Nueva' ? 'fa-spinner' : 'fa-check'}"></i>
                        ${r.estado || 'Nueva'}
                    </span>
                    <span style="font-size:12px; color:var(--text-muted);">
                        <i class="far fa-calendar-alt"></i> ${r.fecha || 'Sin fecha'}
                    </span>
                    <button class="btn btn-outline" style="padding:4px 12px; font-size:12px; margin-left:auto;" onclick="navigateTo('/administrar-requisicion.html')">
                        <i class="fas fa-arrow-right"></i> Gestionar
                    </button>
                </div>
            </div>
        `;
        container.appendChild(card);
    });
}

window.addEventListener('storage', function(e) {
    if (e.key === 'requisiciones_data' || e.key === 'siman_config_data') {
        cargarSeguimiento();
    }
});

document.addEventListener('DOMContentLoaded', function() {
    var user = getCurrentUser();
    if (!user) return;
    cargarSeguimiento();
});

window.cargarSeguimiento = cargarSeguimiento;