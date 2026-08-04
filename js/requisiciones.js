// ==========================================
// REQUISICIONES - LISTA CON RECLUTADOR
// ==========================================

function cargarRequisiciones() {
    var tbody = document.getElementById('requisicionesBody');
    if (!tbody) return;
    
    var requisiciones = JSON.parse(localStorage.getItem('requisiciones_data') || '[]');
    var data = obtenerDatosConfig();
    var reclutadores = data.usuarios ? data.usuarios.filter(function(u) { return u.rol === 'Reclutadora'; }) : [];
    
    tbody.innerHTML = '';
    
    if (requisiciones.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="empty-state"><i class="fas fa-inbox"></i>No hay requisiciones registradas</td></tr>';
        return;
    }
    
    var estadoMap = {
        'Nueva': 'badge-blue',
        'Revisando': 'badge-yellow',
        'Publicada': 'badge-blue',
        'En Proceso': 'badge-yellow',
        'Entrevistas': 'badge-green',
        'Urgente': 'badge-red',
        'Cerrado': 'badge-gray'
    };
    
    requisiciones.forEach(function(r) {
        var tr = document.createElement('tr');
        var estadoClass = estadoMap[r.estado] || 'badge-gray';
        
        var reclutadorNombre = r.reclutador || 'No asignado';
        if (r.reclutador && reclutadores.length > 0) {
            var reclutador = reclutadores.find(function(u) { return u.nombre === r.reclutador; });
            if (reclutador) reclutadorNombre = reclutador.nombre;
        }
        
        tr.innerHTML = `
            <td><strong>${r.id}</strong></td>
            <td>${r.puesto || '-'}</td>
            <td>${r.centro || '-'}</td>
            <td>${r.tienda || '-'}</td>
            <td><span class="badge ${estadoClass}">${r.estado || 'Nueva'}</span></td>
            <td>${reclutadorNombre}</td>
            <td>${r.fecha || '-'}</td>
            <td style="text-align:center;">
                <button class="btn-icon" onclick="navigateTo('/detalle-requisicion.html')"><i class="fas fa-eye"></i></button>
                <button class="btn-icon" onclick="navigateTo('/administrar-requisicion.html')"><i class="fas fa-edit"></i></button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// ==========================================
// SINCRONIZAR CON SUPABASE
// ==========================================
function sincronizarRequisiciones() {
    if (typeof obtenerDeSupabase === 'function') {
        obtenerDeSupabase('requisiciones').then(function(result) {
            if (result.success && result.data) {
                localStorage.setItem('requisiciones_data', JSON.stringify(result.data));
                cargarRequisiciones();
            }
        });
    }
}

// ==========================================
// ESCUCHAR CAMBIOS
// ==========================================
window.addEventListener('storage', function(e) {
    if (e.key === 'requisiciones_data' || e.key === 'siman_config_data') {
        cargarRequisiciones();
    }
});

// ==========================================
// INICIALIZAR
// ==========================================
document.addEventListener('DOMContentLoaded', function() {
    var user = getCurrentUser();
    if (!user) {
        window.location.href = '/login.html';
        return;
    }
    
    cargarRequisiciones();
    
    if (typeof initSupabase === 'function') {
        initSupabase().then(function() {
            sincronizarRequisiciones();
        });
    }
});

window.cargarRequisiciones = cargarRequisiciones;
window.sincronizarRequisiciones = sincronizarRequisiciones;