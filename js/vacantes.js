// ==========================================
// VACANTES - CON DATOS REALES
// ==========================================

function cargarVacantes() {
    var container = document.getElementById('vacantesContainer');
    if (!container) return;

    var user = getCurrentUser();
    if (!user) {
        window.location.href = '/login.html';
        return;
    }

    // ✅ VERIFICACIÓN CORRECTA: usa tienePermiso
    if (!tienePermiso('ver_vacantes')) {
        console.warn('⛔ Acceso denegado: sin permiso ver_vacantes');
        alert('⚠️ No tienes permisos para acceder a esta sección.');
        window.location.href = '/dashboard.html';
        return;
    }

    var requisiciones = JSON.parse(localStorage.getItem('requisiciones_data') || '[]');
    var data = obtenerDatosConfig();
    var reclutadores = data.usuarios ? data.usuarios.filter(function(u) { return u.rol === 'Reclutadora'; }) : [];

    container.innerHTML = '';

    var vacantes = requisiciones;
    if (user.role === 'Reclutadora') {
        vacantes = requisiciones.filter(function(r) {
            return r.reclutador === user.name;
        });
    }

    var activas = vacantes.filter(function(r) {
        return r.estado !== 'Cerrado' && r.estado !== 'Cerrada';
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

    var estadoMap = {
        'Nueva': 'badge-blue',
        'Revisando': 'badge-yellow',
        'Publicada': 'badge-blue',
        'En Proceso': 'badge-yellow',
        'Entrevistas': 'badge-green',
        'Urgente': 'badge-red'
    };

    activas.forEach(function(r) {
        var reclutadorNombre = r.reclutador || 'No asignado';
        if (r.reclutador && reclutadores.length > 0) {
            var reclutador = reclutadores.find(function(u) { return u.nombre === r.reclutador; });
            if (reclutador) reclutadorNombre = reclutador.nombre;
        }

        var card = document.createElement('div');
        card.className = 'card vacante-card';
        card.style.cssText = 'border-left:4px solid ' + (r.prioridad === 'Alta' ? 'var(--danger)' : r.prioridad === 'Media' ? 'var(--warning)' : 'var(--primary)') + ';';

        var fecha = r.fecha ? new Date(r.fecha).toLocaleDateString('es-ES') : 'Sin fecha';

        card.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                <div>
                    <h4 style="font-size:16px; color:var(--text-secondary);">${r.puesto || 'Sin título'}</h4>
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
                    <div style="margin-top:4px;">
                        <span class="badge ${estadoMap[r.estado] || 'badge-gray'}">${r.estado || 'Nueva'}</span>
                    </div>
                </div>
            </div>
            <div style="margin-top:12px; display:flex; gap:8px; flex-wrap:wrap; align-items:center; justify-content:space-between;">
                <div>
                    <span style="font-size:12px; color:var(--text-muted);">
                        <i class="far fa-calendar-alt"></i> ${fecha}
                    </span>
                    <span style="font-size:12px; color:var(--text-muted); margin-left:12px;">
                        <i class="fas fa-users"></i> ${r.cantidad || 1} plaza(s)
                    </span>
                </div>
                <div style="display:flex; gap:6px;">
                    <button class="btn btn-primary" style="padding:6px 16px; font-size:12px;" onclick="navigateTo('/detalle-requisicion.html?id=${r.id}')">
                        <i class="fas fa-file-alt"></i> Ver Detalle
                    </button>
                    <button class="btn btn-outline" style="padding:6px 16px; font-size:12px;" onclick="navigateTo('/administrar-requisicion.html?id=${r.id}')">
                        <i class="fas fa-tasks"></i> Gestionar
                    </button>
                </div>
            </div>
        `;
        container.appendChild(card);
    });

    var totalBadge = document.getElementById('totalVacantes');
    if (totalBadge) {
        totalBadge.textContent = activas.length + ' activas';
    }
}

function sincronizarVacantes() {
    if (typeof obtenerDeSupabase === 'function') {
        obtenerDeSupabase('requisiciones').then(function(result) {
            if (result.success && result.data) {
                localStorage.setItem('requisiciones_data', JSON.stringify(result.data));
                cargarVacantes();
            }
        });
    }
}

window.addEventListener('storage', function(e) {
    if (e.key === 'requisiciones_data' || e.key === 'siman_config_data') {
        cargarVacantes();
    }
});

document.addEventListener('DOMContentLoaded', function() {
    var user = getCurrentUser();
    if (!user) {
        window.location.href = '/login.html';
        return;
    }

    // ✅ VERIFICACIÓN CORRECTA: usa tienePermiso
    if (!tienePermiso('ver_vacantes')) {
        console.warn('⛔ Acceso denegado: sin permiso ver_vacantes');
        alert('⚠️ No tienes permisos para acceder a esta sección.');
        window.location.href = '/dashboard.html';
        return;
    }

    cargarVacantes();

    if (typeof initSupabase === 'function') {
        initSupabase().then(function() {
            sincronizarVacantes();
        });
    }
});

window.cargarVacantes = cargarVacantes;
window.sincronizarVacantes = sincronizarVacantes;