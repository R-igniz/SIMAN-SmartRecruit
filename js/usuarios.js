document.addEventListener('DOMContentLoaded', function() {
    var user = getCurrentUser();
    if (!user) return;
    
    cargarUsuarios();
});

function cargarUsuarios() {
    var tbody = document.getElementById('usuariosBody');
    if (!tbody) return;
    
    var data = localStorage.getItem('siman_config_data');
    var usuarios = [];
    
    if (data) {
        try {
            var parsed = JSON.parse(data);
            usuarios = parsed.usuarios || [];
        } catch (e) {
            console.error('Error al cargar usuarios:', e);
        }
    }
    
    tbody.innerHTML = '';
    
    if (!usuarios || usuarios.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="empty-state"><i class="fas fa-inbox"></i>No hay usuarios registrados</td></tr>';
        return;
    }
    
    var rolBadge = {
        'Administrador': 'badge-red',
        'Gerente RH': 'badge-blue',
        'Reclutadora': 'badge-yellow',
        'Ejecutivo': 'badge-green'
    };
    
    usuarios.forEach(function(u) {
        var tr = document.createElement('tr');
        var rolClass = rolBadge[u.rol] || 'badge-gray';
        var estadoClass = u.estado === 'activo' ? 'badge-green' : 'badge-red';
        tr.innerHTML = `
            <td>${u.id}</td>
            <td><strong>${u.nombre}</strong></td>
            <td>${u.email}</td>
            <td><span class="badge ${rolClass}">${u.rol}</span></td>
            <td><span class="badge ${estadoClass}">${u.estado}</span></td>
        `;
        tbody.appendChild(tr);
    });
}

// Sincronizar cuando hay cambios en otra pestaña
window.addEventListener('storage', function(e) {
    if (e.key === 'siman_config_data') {
        cargarUsuarios();
    }
});