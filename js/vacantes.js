// ==========================================
// VACANTES - CON DATOS REALES
// ==========================================

function cargarVacantes() {
    var container = document.getElementById('vacantesContainer');
    if (!container) return;
    
    var requisiciones = JSON.parse(localStorage.getItem('requisiciones_data') || '[]');
    var data = obtenerDatosConfig();
    var reclutadores = data.usuarios ? data.usuarios.filter(function(u) { return u.rol === 'Reclutadora'; }) : [];
    
    container.innerHTML = '';
    
    var activas = requisiciones.filter(function(r) {
        return r.estado !== 'Cerrado';
    });
    
    if (activas.length === 0) {
        container.innerHTML = '<div class="empty-state"><i class="fas fa-briefcase"></i>No hay vacantes disponibles</div>';
        return;
    }
    
    var prioridadBadge = {
        'Alta': 'badge-red',
        'Media': 'badge-yellow',
        'Baja': 'badge-blue'
    };
    
    activas.forEach(function(r) {
        var reclutadorNombre = r.reclutador || 'No asignado';
        if (r.reclutador && reclutadores.length > 0) {
            var reclutador = reclutadores.find(function(u) { return u.nombre === r.reclutador; });
            if (reclutador) reclutadorNombre = reclutador.nombre;
        }
        
        var card = document.createElement('div');
        card.className = 'card';
        card.style.cssText = 'border-left:4px solid ' + (r.prioridad === 'Alta' ? 'var(--danger)' : r.prioridad === 'Media' ? 'var(--warning)' : 'var(--primary)') + ';';
        
        card.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                <div>
                    <h4 style="font-size:16px;">${r.puesto || 'Sin título'}</h4>
                    <p style="color:var(--text-muted); font-size:13px;">
                        <i class="fas fa-store"></i> ${r.centro || '-'}
                        ${r.tienda ? '· ' + r.tienda : ''}
                    </p>
                    <p style="color:var(--text-muted); font-size:12px; margin-top:4px;">
                        <i class="fas fa-user-tie"></i> Reclutador: ${reclutadorNombre}
                    </p>
                </div>
                <div style="text-align:right;">
                    <span class="badge ${prioridadBadge[r.prioridad] || 'badge-gray'}">${r.prioridad || 'Media'}</span>
                    <span class="badge ${r.estado === 'Urgente' ? 'badge-red' : 'badge-blue'}" style="display:block; margin-top:4px;">${r.estado || 'Nueva'}</span>
                </div>
            </div>
            <div style="margin-top:12px; display:flex; gap:8px; flex-wrap:wrap; align-items:center; justify-content:space-between;">
                <div>
                    <span style="font-size:12px; color:var(--text-muted);">
                        <i class="far fa-clock"></i> ${r.fecha || 'Sin fecha'}
                    </span>
                    <span style="font-size:12px; color:var(--text-muted); margin-left:12px;">
                        <i class="fas fa-users"></i> ${r.cantidad || 1} plaza(s)
                    </span>
                </div>
                <button class="btn btn-primary" style="padding:6px 16px; font-size:12px;" onclick="navigateTo('/detalle-requisicion.html')">
                    <i class="fas fa-file-alt"></i> Ver Detalle
                </button>
            </div>
        `;
        container.appendChild(card);
    });
}

window.addEventListener('storage', function(e) {
    if (e.key === 'requisiciones_data' || e.key === 'siman_config_data') {
        cargarVacantes();
    }
});

document.addEventListener('DOMContentLoaded', function() {
    var user = getCurrentUser();
    if (!user) return;
    cargarVacantes();
});

window.cargarVacantes = cargarVacantes;