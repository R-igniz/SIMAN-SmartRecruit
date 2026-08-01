document.addEventListener('DOMContentLoaded', function() {
  var user = getCurrentUser();
  if (!user) return;

  // Obtener usuarios desde localStorage
  var data = localStorage.getItem('siman_config_data');
  var usuarios = [];

  if (data) {
    var parsed = JSON.parse(data);
    usuarios = parsed.usuarios || [];
  }

  var tbody = document.getElementById('usuariosBody');
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
});