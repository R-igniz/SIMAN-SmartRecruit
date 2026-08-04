// ==========================================
// USUARIOS - LISTA DE USUARIOS
// ==========================================

function cargarUsuarios() {
    var tbody = document.getElementById('usuariosBody');
    if (!tbody) return;
    
    // Usar la función global de configuracion.js
    var data = typeof window.obtenerDatosConfig === 'function' ? window.obtenerDatosConfig() : null;
    if (!data) {
        console.error('❌ No se pudo obtener configuración.');
        tbody.innerHTML = '<tr><td colspan="5" class="empty-state"><i class="fas fa-exclamation-triangle"></i> Error al cargar datos</td></tr>';
        return;
    }
    
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
// SINCRONIZAR AL RECIBIR CAMBIOS
// ==========================================
window.addEventListener('storage', function(e) {
    if (e.key === 'siman_config_data') {
        cargarUsuarios();
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
    if (!tienePermiso('ver_usuarios')) {
        alert('⚠️ No tienes permisos para ver usuarios.');
        window.location.href = '/dashboard.html';
        return;
    }
    
    cargarUsuarios();
    
    // Escuchar cambios desde otras pestañas
    window.addEventListener('storage', function(e) {
        if (e.key === 'siman_config_data') {
            cargarUsuarios();
        }
    });
});

window.cargarUsuarios = cargarUsuarios;