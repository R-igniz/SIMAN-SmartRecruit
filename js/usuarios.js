// ==========================================
// USUARIOS - LISTA DE USUARIOS
// ==========================================

function cargarUsuarios() {
    var tbody = document.getElementById('usuariosBody');
    if (!tbody) return;
    
    var data = obtenerDatosConfig();
    var usuarios = data.usuarios || [];
    
    tbody.innerHTML = '';
    if (usuarios.length === 0) {
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
    if (!tienePermiso('ver_usuarios')) {
        alert('⚠️ Acceso denegado. No tienes permisos para ver usuarios.');
        window.location.href = '/dashboard.html';
        return;
    }
    
    cargarUsuarios();
});

window.cargarUsuarios = cargarUsuarios;