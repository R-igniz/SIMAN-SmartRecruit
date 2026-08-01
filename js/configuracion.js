// ==========================================
// DATA STORE - Persistencia en localStorage
// ==========================================
var CONFIG_STORE_KEY = 'siman_config_data';

function obtenerDatosConfig() {
  var data = localStorage.getItem(CONFIG_STORE_KEY);
  if (data) return JSON.parse(data);
  
  var inicial = {
    usuarios: [
      { id: 1, nombre: 'Carlos Aranda', estado: 'activo' },
      { id: 2, nombre: 'María Gómez', estado: 'activo' },
      { id: 3, nombre: 'Ana López', estado: 'activo' }
    ],
    roles: [
      { id: 1, nombre: 'Administrador', estado: 'activo' },
      { id: 2, nombre: 'Gerente RH', estado: 'activo' },
      { id: 3, nombre: 'Reclutadora', estado: 'activo' },
      { id: 4, nombre: 'Ejecutivo', estado: 'activo' }
    ],
    comerciales: [
      { id: 1, nombre: 'Gran Vía', estado: 'activo' },
      { id: 2, nombre: 'Multiplaza', estado: 'activo' },
      { id: 3, nombre: 'Galerías', estado: 'activo' }
    ],
    tiendas: [
      { id: 1, nombre: 'Electrónica', estado: 'activo' },
      { id: 2, nombre: 'Ropa', estado: 'activo' },
      { id: 3, nombre: 'Calzado', estado: 'activo' }
    ],
    departamentos: [
      { id: 1, nombre: 'Financiero', estado: 'activo' },
      { id: 2, nombre: 'Marketing', estado: 'activo' },
      { id: 3, nombre: 'RRHH', estado: 'activo' }
    ],
    estados: [
      { id: 1, nombre: 'Nueva', estado: 'activo' },
      { id: 2, nombre: 'Revisando', estado: 'activo' },
      { id: 3, nombre: 'Publicada', estado: 'activo' },
      { id: 4, nombre: 'Cerrado', estado: 'activo' }
    ],
    prioridades: [
      { id: 1, nombre: 'Alta', estado: 'activo' },
      { id: 2, nombre: 'Media', estado: 'activo' },
      { id: 3, nombre: 'Baja', estado: 'activo' }
    ],
    motivos: [
      { id: 1, nombre: 'Nueva posición', estado: 'activo' },
      { id: 2, nombre: 'Reemplazo', estado: 'activo' },
      { id: 3, nombre: 'Expansión', estado: 'activo' }
    ],
    tiposContratacion: [
      { id: 1, nombre: 'Directa', estado: 'activo' },
      { id: 2, nombre: 'Temporal', estado: 'activo' },
      { id: 3, nombre: 'Prácticas', estado: 'activo' }
    ],
    asignaciones: [
      { id: 1, nombre: 'Automática por centro', estado: 'activo' },
      { id: 2, nombre: 'Manual', estado: 'activo' }
    ],
    correos: [
      { id: 1, nombre: 'Notificación de requisición', estado: 'activo' },
      { id: 2, nombre: 'Confirmación de contratación', estado: 'activo' }
    ],
    plantillas: [
      { id: 1, nombre: 'Perfil de puesto', estado: 'activo' },
      { id: 2, nombre: 'Carta de oferta', estado: 'activo' }
    ]
  };
  localStorage.setItem(CONFIG_STORE_KEY, JSON.stringify(inicial));
  return inicial;
}

function guardarDatosConfig(data) {
  localStorage.setItem(CONFIG_STORE_KEY, JSON.stringify(data));
  actualizarContadores();
}

// ==========================================
// SINCRONIZACIÓN ENTRE PESTAÑAS
// ==========================================
window.addEventListener('storage', function(e) {
  if (e.key === CONFIG_STORE_KEY) {
    // Actualizar contadores en la interfaz
    actualizarContadores();
    // Si estamos viendo una tabla, recargarla
    if (tipoActual) {
      var data = obtenerDatosConfig();
      datosActuales = data[tipoActual] || [];
      renderizarTabla();
    }
  }
});

// ==========================================
// VARIABLES GLOBALES
// ==========================================
var tipoActual = '';
var datosActuales = [];

// ==========================================
// INICIALIZAR
// ==========================================
document.addEventListener('DOMContentLoaded', function() {
  var user = JSON.parse(sessionStorage.getItem('currentUser') || '{}');
  if (!user.username) {
    window.location.href = '/login.html';
    return;
  }
  if (user.role !== 'Administrador') {
    alert('⚠️ Acceso denegado. Solo administradores.');
    window.location.href = '/dashboard.html';
    return;
  }
  actualizarContadores();
});

// ==========================================
// ACTUALIZAR CONTADORES
// ==========================================
function actualizarContadores() {
  var data = obtenerDatosConfig();
  var tipos = ['usuarios', 'roles', 'comerciales', 'tiendas', 'departamentos', 'estados', 'prioridades', 'motivos', 'tiposContratacion', 'asignaciones', 'correos', 'plantillas'];
  tipos.forEach(function(tipo) {
    var badge = document.getElementById('badge' + tipo.charAt(0).toUpperCase() + tipo.slice(1));
    if (badge) {
      var items = data[tipo] || [];
      var activos = items.filter(function(i) { return i.estado === 'activo'; });
      badge.textContent = activos.length;
    }
  });
}

// ==========================================
// ABRIR GESTIÓN
// ==========================================
function abrirGestion(tipo) {
  tipoActual = tipo;
  var data = obtenerDatosConfig();
  datosActuales = data[tipo] || [];
  
  var nombres = {
    'usuarios': 'Usuarios',
    'roles': 'Roles',
    'comerciales': 'Comerciales',
    'tiendas': 'Tiendas',
    'departamentos': 'Departamentos',
    'estados': 'Estados',
    'prioridades': 'Prioridades',
    'motivos': 'Motivos',
    'tiposContratacion': 'Tipos de Contratación',
    'asignaciones': 'Asignaciones Automáticas',
    'correos': 'Correos',
    'plantillas': 'Plantillas'
  };
  
  document.getElementById('gestionTitulo').innerHTML = '<i class="fas fa-list"></i> ' + (nombres[tipo] || tipo);
  document.getElementById('gestionPanel').style.display = 'block';
  
  renderizarTabla();
}

// ==========================================
// RENDERIZAR TABLA
// ==========================================
function renderizarTabla() {
  var tbody = document.getElementById('gestionBody');
  tbody.innerHTML = '';
  
  if (!datosActuales || datosActuales.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" class="empty-state"><i class="fas fa-inbox"></i>No hay elementos registrados</td></tr>';
    return;
  }
  
  datosActuales.forEach(function(item) {
    var tr = document.createElement('tr');
    var estadoClass = item.estado === 'activo' ? 'badge-green' : 'badge-red';
    tr.innerHTML = 
      '<td>' + item.id + '</td>' +
      '<td><strong>' + item.nombre + '</strong></td>' +
      '<td><span class="badge ' + estadoClass + '">' + item.estado + '</span></td>' +
      '<td style="text-align:center;">' +
        '<button class="btn-accion" onclick="editarItem(' + item.id + ')" title="Editar"><i class="fas fa-edit"></i></button>' +
        '<button class="btn-accion danger" onclick="eliminarItem(' + item.id + ')" title="Eliminar"><i class="fas fa-trash"></i></button>' +
      '</td>';
    tbody.appendChild(tr);
  });
}

// ==========================================
// MODALES
// ==========================================
function abrirModal(id) {
  document.getElementById(id).classList.add('show');
}

function cerrarModal(id) {
  document.getElementById(id).classList.remove('show');
}

// Cerrar modal al hacer clic fuera
document.addEventListener('click', function(e) {
  if (e.target.classList.contains('modal-overlay')) {
    e.target.classList.remove('show');
  }
});

// ==========================================
// ABRIR MODAL AGREGAR
// ==========================================
function abrirModalAgregar() {
  document.getElementById('modalGestionTitulo').innerHTML = '<i class="fas fa-plus"></i> Agregar ' + tipoActual;
  document.getElementById('formGestion').reset();
  document.getElementById('gestionId').value = '';
  document.getElementById('gestionTipo').value = tipoActual;
  document.getElementById('gestionEstado').value = 'activo';
  
  var labels = {
    'usuarios': 'Nombre del usuario',
    'roles': 'Nombre del rol',
    'comerciales': 'Nombre del comercial',
    'tiendas': 'Nombre de la tienda',
    'departamentos': 'Nombre del departamento',
    'estados': 'Nombre del estado',
    'prioridades': 'Nombre de la prioridad',
    'motivos': 'Nombre del motivo',
    'tiposContratacion': 'Nombre del tipo',
    'asignaciones': 'Nombre de la asignación',
    'correos': 'Nombre del correo',
    'plantillas': 'Nombre de la plantilla'
  };
  
  document.getElementById('labelNombre').textContent = labels[tipoActual] || 'Nombre';
  abrirModal('modalGestion');
}

// ==========================================
// GUARDAR ITEM
// ==========================================
function guardarItem(e) {
  e.preventDefault();
  
  var id = document.getElementById('gestionId').value;
  var nombre = document.getElementById('gestionNombre').value.trim();
  var estado = document.getElementById('gestionEstado').value;
  var tipo = document.getElementById('gestionTipo').value;
  
  if (!nombre) {
    alert('⚠️ El nombre es obligatorio.');
    return;
  }
  
  var data = obtenerDatosConfig();
  var items = data[tipo] || [];
  
  // Validar duplicado
  var existe = items.some(function(item) {
    return item.nombre.toLowerCase() === nombre.toLowerCase() && item.id != id;
  });
  if (existe) {
    alert('⚠️ Ya existe un elemento con ese nombre.');
    return;
  }
  
  if (id) {
    // Editar
    var item = items.find(function(i) { return i.id == id; });
    if (item) {
      item.nombre = nombre;
      item.estado = estado;
    }
    guardarDatosConfig(data);
    mostrarConfirmacion('Actualizado', 'El elemento ha sido actualizado correctamente.');
  } else {
    // Nuevo
    var maxId = 0;
    items.forEach(function(i) { if (i.id > maxId) maxId = i.id; });
    var nuevo = {
      id: maxId + 1,
      nombre: nombre,
      estado: estado
    };
    items.push(nuevo);
    data[tipo] = items;
    guardarDatosConfig(data);
    mostrarConfirmacion('Agregado', 'El elemento ha sido agregado correctamente.');
  }
  
  cerrarModal('modalGestion');
  datosActuales = data[tipo] || [];
  renderizarTabla();
}

// ==========================================
// EDITAR ITEM
// ==========================================
function editarItem(id) {
  var item = datosActuales.find(function(i) { return i.id === id; });
  if (!item) return;
  
  document.getElementById('modalGestionTitulo').innerHTML = '<i class="fas fa-edit"></i> Editar ' + tipoActual;
  document.getElementById('gestionId').value = item.id;
  document.getElementById('gestionNombre').value = item.nombre;
  document.getElementById('gestionEstado').value = item.estado;
  document.getElementById('gestionTipo').value = tipoActual;
  
  abrirModal('modalGestion');
}

// ==========================================
// ELIMINAR ITEM
// ==========================================
function eliminarItem(id) {
  if (!confirm('¿Eliminar este elemento?')) return;
  
  var data = obtenerDatosConfig();
  var items = data[tipoActual] || [];
  var item = items.find(function(i) { return i.id === id; });
  if (!item) return;
  
  items = items.filter(function(i) { return i.id !== id; });
  data[tipoActual] = items;
  guardarDatosConfig(data);
  
  datosActuales = items;
  renderizarTabla();
  mostrarConfirmacion('Eliminado', 'El elemento ha sido eliminado correctamente.');
}

// ==========================================
// CONFIRMACIÓN
// ==========================================
function mostrarConfirmacion(titulo, mensaje) {
  document.getElementById('confirmacionTitulo').textContent = titulo;
  document.getElementById('confirmacionMensaje').textContent = mensaje;
  abrirModal('modalConfirmacion');
}

// ==========================================
// LIMPIAR DATOS (CONSERVANDO USUARIOS Y ASIGNACIONES)
// ==========================================
function limpiarDatos() {
  if (!confirm('⚠️ ¿Estás seguro de limpiar los datos del sistema?\n\nSe ELIMINARÁN:\n- Roles\n- Centros comerciales\n- Tiendas\n- Departamentos\n- Estados\n- Prioridades\n- Motivos\n- Tipos de contratación\n- Correos\n- Plantillas\n\nSe CONSERVARÁN:\n- Usuarios (con sus datos)\n- Asignaciones automáticas\n\nEsta acción no se puede deshacer.')) {
    return;
  }
  
  var data = obtenerDatosConfig();
  
  // Conservar usuarios y asignaciones
  var usuarios = data.usuarios || [];
  var asignaciones = data.asignaciones || [];
  
  // Reiniciar el resto a cero (arrays vacíos)
  data.usuarios = usuarios;
  data.asignaciones = asignaciones;
  data.roles = [];
  data.comerciales = [];
  data.tiendas = [];
  data.departamentos = [];
  data.estados = [];
  data.prioridades = [];
  data.motivos = [];
  data.tiposContratacion = [];
  data.correos = [];
  data.plantillas = [];
  
  guardarDatosConfig(data);
  
  alert('✅ Datos limpiados correctamente.\n\nUsuarios y asignaciones se han conservado.\nEl resto de datos se ha puesto a cero.');
  location.reload();
}

// ==========================================
// EXPORTAR DATOS
// ==========================================
function exportarDatos() {
  var data = obtenerDatosConfig();
  var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url;
  a.download = 'configuracion_' + new Date().toISOString().split('T')[0] + '.json';
  a.click();
  URL.revokeObjectURL(url);
}

// ==========================================
// FUNCIÓN DE LOGOUT
// ==========================================
function logout() {
  sessionStorage.removeItem('currentUser');
  sessionStorage.removeItem('isAuthenticated');
  window.location.href = '/login.html';

  // ==========================================
// ACTUALIZAR AUTH DESPUÉS DE GUARDAR USUARIOS
// ==========================================
function guardarDatosConfig(data) {
  localStorage.setItem(CONFIG_STORE_KEY, JSON.stringify(data));
  // Refrescar usuarios en auth.js
  if (typeof refreshAuthUsers === 'function') {
    refreshAuthUsers();
  }
  // Disparar evento para sincronizar otras pestañas
  window.dispatchEvent(new StorageEvent('storage', { key: CONFIG_STORE_KEY, newValue: JSON.stringify(data) }));
}
}