// ==========================================
// EXPORTACIÓN A EXCEL
// ==========================================
function exportarExcel(tipo, data) {
  // Cargar SheetJS desde CDN
  if (!window.XLSX) {
    var script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
    script.onload = function() {
      generarExcel(tipo, data);
    };
    document.head.appendChild(script);
  } else {
    generarExcel(tipo, data);
  }
}

function generarExcel(tipo, data) {
  var ws_data = [];
  var titulo = '';
  
  if (tipo === 'usuarios') {
    titulo = 'Usuarios';
    ws_data = [['ID', 'Nombre', 'Email', 'Rol', 'Estado']];
    (data || []).forEach(function(u) {
      ws_data.push([u.id, u.nombre, u.email, u.rol, u.estado]);
    });
  } else if (tipo === 'roles') {
    titulo = 'Roles';
    ws_data = [['ID', 'Nombre', 'Estado']];
    (data || []).forEach(function(r) {
      ws_data.push([r.id, r.nombre, r.estado]);
    });
  } else if (tipo === 'requisiciones') {
    titulo = 'Requisiciones';
    ws_data = [['ID', 'Puesto', 'Centro', 'Estado', 'Fecha']];
    (data || []).forEach(function(r) {
      ws_data.push([r.id, r.puesto || '', r.centroComercial || '', r.estado || '', r.fecha || '']);
    });
  } else if (tipo === 'cartasOferta') {
    titulo = 'Cartas Oferta';
    ws_data = [['ID', 'Nombre', 'Monto ($)', 'Archivo', 'Estado']];
    (data || []).forEach(function(c) {
      ws_data.push([c.id, c.nombre, c.monto || 0, c.archivo || '', c.estado]);
    });
  } else {
    ws_data = [['Datos']];
  }
  
  var wb = XLSX.utils.book_new();
  var ws = XLSX.utils.aoa_to_sheet(ws_data);
  XLSX.utils.book_append_sheet(wb, ws, titulo);
  XLSX.writeFile(wb, titulo + '_' + new Date().toISOString().split('T')[0] + '.xlsx');
}

// ==========================================
// EXPORTAR REPORTE COMPLETO
// ==========================================
function exportarReporteCompleto() {
  var data = localStorage.getItem('siman_config_data');
  if (data) {
    var config = JSON.parse(data);
    exportarExcel('usuarios', config.usuarios);
    // Esperar un poco y exportar el siguiente
    setTimeout(function() {
      exportarExcel('roles', config.roles);
    }, 500);
    setTimeout(function() {
      exportarExcel('cartasOferta', config.cartasOferta);
    }, 1000);
  }
  var requisiciones = JSON.parse(localStorage.getItem('requisiciones') || '[]');
  setTimeout(function() {
    exportarExcel('requisiciones', requisiciones);
  }, 1500);
}