document.addEventListener('DOMContentLoaded', function() {
  var user = getCurrentUser();
  if (!user) return;

  // Datos de ejemplo - en producción vendrían de localStorage o API
  var requisiciones = [
    { id: 'R-145', puesto: 'Analista Financiero', centro: 'Gran Vía', estado: 'Revisando', fecha: '2026-07-24' },
    { id: 'R-142', puesto: 'Cajero', centro: 'Multiplaza', estado: 'Publicada', fecha: '2026-07-22' },
    { id: 'R-138', puesto: 'Jefe de Marketing', centro: 'Galerías', estado: 'Entrevistas', fecha: '2026-07-20' },
    { id: 'R-130', puesto: 'Auxiliar RH', centro: 'La Pradera', estado: 'Urgente', fecha: '2026-07-15' }
  ];

  var tbody = document.getElementById('requisicionesBody');
  tbody.innerHTML = '';

  if (!requisiciones || requisiciones.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="empty-state"><i class="fas fa-inbox"></i>No hay requisiciones registradas</td></tr>';
    return;
  }

  var estadoMap = {
    'Revisando': 'badge-yellow',
    'Publicada': 'badge-blue',
    'Entrevistas': 'badge-green',
    'Urgente': 'badge-red',
    'Cerrada': 'badge-gray',
    'Nueva': 'badge-blue'
  };

  requisiciones.forEach(function(r) {
    var tr = document.createElement('tr');
    var estadoClass = estadoMap[r.estado] || 'badge-gray';
    tr.innerHTML = `
      <td><strong>${r.id}</strong></td>
      <td>${r.puesto}</td>
      <td>${r.centro}</td>
      <td><span class="badge ${estadoClass}">${r.estado}</span></td>
      <td>${r.fecha}</td>
      <td style="text-align:center;">
        <button class="btn-icon" onclick="navigateTo('/detalle-requisicion.html')"><i class="fas fa-eye"></i></button>
        <button class="btn-icon" onclick="navigateTo('/administrar-requisicion.html')"><i class="fas fa-edit"></i></button>
      </td>
    `;
    tbody.appendChild(tr);
  });
});