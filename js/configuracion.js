// ==========================================
// DATA STORE
// ==========================================
var CONFIG_STORE_KEY = 'siman_config_data';

function obtenerDatosConfig() {
    var data = localStorage.getItem(CONFIG_STORE_KEY);
    if (data) return JSON.parse(data);

    var inicial = {
        usuarios: [
            { id: 1, nombre: 'Administrador', email: 'admin@siman.com', password: 'admin123', rol: 'Administrador', centro: 'Central', estado: 'activo' }
        ],
        roles: [
            { id: 1, nombre: 'Administrador', estado: 'activo' },
            { id: 2, nombre: 'Gerente RH', estado: 'activo' },
            { id: 3, nombre: 'Reclutadora', estado: 'activo' },
            { id: 4, nombre: 'Ejecutivo', estado: 'activo' }
        ],
        cartasOferta: [],
        comerciales: [],
        tiendas: [],
        departamentos: [],
        estados: [],
        prioridades: [],
        motivos: [],
        tiposContratacion: [],
        asignaciones: [],
        correos: [],
        plantillas: []
    };
    localStorage.setItem(CONFIG_STORE_KEY, JSON.stringify(inicial));
    return inicial;
}

function guardarDatosConfig(data) {
    localStorage.setItem(CONFIG_STORE_KEY, JSON.stringify(data));
    if (typeof refreshAuthUsers === 'function') {
        refreshAuthUsers();
    }
    window.dispatchEvent(new StorageEvent('storage', { key: CONFIG_STORE_KEY, newValue: JSON.stringify(data) }));
}

// ==========================================
// VARIABLES GLOBALES
// ==========================================
var tipoActual = '';
var datosActuales = [];

// ==========================================
// INICIALIZAR
// ==========================================
document.addEventListener('DOMContentLoaded', function() {
    var user = getCurrentUser();
    if (!user) {
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
        'cartasOferta': 'Cartas Oferta',
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
    var thead = document.getElementById('gestionThead');
    var tbody = document.getElementById('gestionBody');
    thead.innerHTML = '';
    tbody.innerHTML = '';

    if (!datosActuales || datosActuales.length === 0) {
        thead.innerHTML = '<tr><th>ID</th><th>Nombre</th><th>Estado</th><th style="text-align:center;">Acciones</th></tr>';
        tbody.innerHTML = '<tr><td colspan="4" class="empty-state"><i class="fas fa-inbox"></i>No hay elementos registrados</td></tr>';
        return;
    }

    var columnas = [];
    if (tipoActual === 'usuarios') {
        columnas = ['ID', 'Nombre', 'Email', 'Rol', 'Estado', 'Acciones'];
    } else if (tipoActual === 'roles' || tipoActual === 'comerciales' || tipoActual === 'tiendas' || tipoActual === 'departamentos' || tipoActual === 'estados' || tipoActual === 'prioridades' || tipoActual === 'motivos' || tipoActual === 'tiposContratacion' || tipoActual === 'asignaciones' || tipoActual === 'correos' || tipoActual === 'plantillas') {
        columnas = ['ID', 'Nombre', 'Estado', 'Acciones'];
    } else if (tipoActual === 'cartasOferta') {
        columnas = ['ID', 'Nombre', 'Monto ($)', 'Archivo', 'Estado', 'Acciones'];
    }

    var trHead = document.createElement('tr');
    columnas.forEach(function(col) {
        var th = document.createElement('th');
        th.textContent = col;
        if (col === 'Acciones') th.style.textAlign = 'center';
        trHead.appendChild(th);
    });
    thead.appendChild(trHead);

    datosActuales.forEach(function(item) {
        var tr = document.createElement('tr');
        var estadoClass = item.estado === 'activo' ? 'badge-green' : 'badge-red';
        var acciones =
            '<button class="btn-icon" onclick="editarItem(' + item.id + ')" title="Editar"><i class="fas fa-edit"></i></button>' +
            '<button class="btn-icon danger" onclick="eliminarItem(' + item.id + ')" title="Eliminar"><i class="fas fa-trash"></i></button>';

        var celdas = [];
        if (tipoActual === 'usuarios') {
            celdas = [
                item.id,
                '<strong>' + item.nombre + '</strong>',
                item.email || '-',
                item.rol || '-',
                '<span class="badge ' + estadoClass + '">' + item.estado + '</span>',
                acciones
            ];
        } else if (tipoActual === 'cartasOferta') {
            celdas = [
                item.id,
                '<strong>' + item.nombre + '</strong>',
                '$' + (item.monto || 0).toFixed(2),
                item.archivo ? '<i class="fas fa-file-pdf" style="color:#b33c3c;"></i> ' + item.archivo : '-',
                '<span class="badge ' + estadoClass + '">' + item.estado + '</span>',
                acciones
            ];
        } else {
            celdas = [
                item.id,
                '<strong>' + item.nombre + '</strong>',
                '<span class="badge ' + estadoClass + '">' + item.estado + '</span>',
                acciones
            ];
        }

        celdas.forEach(function(contenido) {
            var td = document.createElement('td');
            td.innerHTML = contenido;
            if (contenido === acciones) td.style.textAlign = 'center';
            tr.appendChild(td);
        });
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

document.addEventListener('click', function(e) {
    if (e.target.classList.contains('modal-overlay')) {
        e.target.classList.remove('show');
    }
});

// ==========================================
// ABRIR MODAL AGREGAR
// ==========================================
function abrirModalAgregar() {
    document.getElementById('formGestion').reset();
    document.getElementById('gestionId').value = '';
    document.getElementById('gestionTipo').value = tipoActual;
    document.getElementById('gestionEstado').value = 'activo';

    document.getElementById('camposUsuario').style.display = 'none';
    document.getElementById('camposCarta').style.display = 'none';
    document.getElementById('campoNombre').style.display = 'block';
    document.getElementById('labelNombre').textContent = 'Nombre';

    var titulo = 'Agregar ';
    if (tipoActual === 'usuarios') {
        titulo += 'Usuario';
        document.getElementById('camposUsuario').style.display = 'block';
        cargarRolesEnSelect();
        document.getElementById('usuarioPassword').required = true;
    } else if (tipoActual === 'roles') {
        titulo += 'Rol';
    } else if (tipoActual === 'cartasOferta') {
        titulo += 'Carta Oferta';
        document.getElementById('camposCarta').style.display = 'block';
        document.getElementById('labelNombre').textContent = 'Nombre de la carta';
    } else {
        titulo += tipoActual.charAt(0).toUpperCase() + tipoActual.slice(1);
    }

    document.getElementById('modalGestionTitulo').innerHTML = '<i class="fas fa-plus"></i> ' + titulo;
    abrirModal('modalGestion');
}

function cargarRolesEnSelect() {
    var data = obtenerDatosConfig();
    var roles = data.roles || [];
    var select = document.getElementById('usuarioRol');
    select.innerHTML = '<option value="">Seleccionar rol...</option>';
    roles.forEach(function(r) {
        if (r.estado === 'activo') {
            var opt = document.createElement('option');
            opt.value = r.nombre;
            opt.textContent = r.nombre;
            select.appendChild(opt);
        }
    });
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

    var existe = items.some(function(item) {
        return item.nombre.toLowerCase() === nombre.toLowerCase() && item.id != id;
    });
    if (existe) {
        alert('⚠️ Ya existe un elemento con ese nombre.');
        return;
    }

    var nuevoItem = { id: id ? parseInt(id) : 0, nombre: nombre, estado: estado };

    if (tipo === 'usuarios') {
        var email = document.getElementById('usuarioEmail').value.trim();
        var password = document.getElementById('usuarioPassword').value;
        var rol = document.getElementById('usuarioRol').value;
        if (!email || !rol) {
            alert('⚠️ Email y Rol son obligatorios.');
            return;
        }
        var emailExiste = items.some(function(u) {
            return u.email && u.email.toLowerCase() === email.toLowerCase() && u.id != id;
        });
        if (emailExiste) {
            alert('⚠️ Ya existe un usuario con ese email.');
            return;
        }
        nuevoItem.email = email;
        nuevoItem.rol = rol;
        if (password) {
            if (password.length < 6) {
                alert('⚠️ La contraseña debe tener al menos 6 caracteres.');
                return;
            }
            nuevoItem.password = password;
        } else {
            if (id) {
                var existente = items.find(function(u) { return u.id == id; });
                if (existente) nuevoItem.password = existente.password;
            } else {
                alert('⚠️ La contraseña es obligatoria para nuevos usuarios.');
                return;
            }
        }
    }

    if (tipo === 'cartasOferta') {
        var monto = parseFloat(document.getElementById('cartaMonto').value) || 0;
        var archivoInput = document.getElementById('cartaArchivo');
        var archivoNombre = '';
        if (archivoInput.files && archivoInput.files.length > 0) {
            archivoNombre = archivoInput.files[0].name;
        } else if (id) {
            var existente = items.find(function(c) { return c.id == id; });
            if (existente) archivoNombre = existente.archivo || '';
        }
        nuevoItem.monto = monto;
        nuevoItem.archivo = archivoNombre;
    }

    if (id) {
        var index = items.findIndex(function(i) { return i.id == id; });
        if (index !== -1) {
            nuevoItem.id = parseInt(id);
            if (tipo === 'usuarios' && !document.getElementById('usuarioPassword').value) {
                nuevoItem.password = items[index].password;
            }
            items[index] = nuevoItem;
        } else {
            alert('⚠️ Error: elemento no encontrado.');
            return;
        }
        guardarDatosConfig(data);
        mostrarConfirmacion('Actualizado', 'El elemento ha sido actualizado correctamente.');
    } else {
        var maxId = 0;
        items.forEach(function(i) { if (i.id > maxId) maxId = i.id; });
        nuevoItem.id = maxId + 1;
        items.push(nuevoItem);
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

    document.getElementById('gestionId').value = item.id;
    document.getElementById('gestionNombre').value = item.nombre;
    document.getElementById('gestionEstado').value = item.estado;
    document.getElementById('gestionTipo').value = tipoActual;

    document.getElementById('camposUsuario').style.display = 'none';
    document.getElementById('camposCarta').style.display = 'none';
    document.getElementById('campoNombre').style.display = 'block';
    document.getElementById('labelNombre').textContent = 'Nombre';

    var titulo = 'Editar ';
    if (tipoActual === 'usuarios') {
        titulo += 'Usuario';
        document.getElementById('camposUsuario').style.display = 'block';
        document.getElementById('usuarioEmail').value = item.email || '';
        document.getElementById('usuarioPassword').value = '';
        document.getElementById('usuarioPassword').placeholder = 'Dejar en blanco para mantener';
        document.getElementById('usuarioPassword').required = false;
        cargarRolesEnSelect();
        document.getElementById('usuarioRol').value = item.rol || '';
    } else if (tipoActual === 'cartasOferta') {
        titulo += 'Carta Oferta';
        document.getElementById('camposCarta').style.display = 'block';
        document.getElementById('labelNombre').textContent = 'Nombre de la carta';
        document.getElementById('cartaMonto').value = item.monto || '';
        var archivoLabel = document.querySelector('#camposCarta small');
        if (item.archivo) {
            archivoLabel.textContent = 'Archivo actual: ' + item.archivo + ' (subir uno nuevo para reemplazar)';
        } else {
            archivoLabel.textContent = 'Opcional: sube un archivo PDF';
        }
    } else {
        titulo += tipoActual.charAt(0).toUpperCase() + tipoActual.slice(1);
    }

    document.getElementById('modalGestionTitulo').innerHTML = '<i class="fas fa-edit"></i> ' + titulo;
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
// LIMPIAR DATOS (CONSERVAR USUARIOS Y ROLES)
// ==========================================
function limpiarDatos() {
    if (!confirm('⚠️ ¿Estás seguro de limpiar los datos del sistema?\n\nSe ELIMINARÁN:\n- Comerciales\n- Tiendas\n- Departamentos\n- Estados\n- Prioridades\n- Motivos\n- Tipos de contratación\n- Asignaciones\n- Correos\n- Plantillas\n\nSe CONSERVARÁN:\n- Usuarios\n- Roles\n- Cartas Oferta')) {
        return;
    }

    var data = obtenerDatosConfig();
    data.usuarios = data.usuarios || [];
    data.roles = data.roles || [];
    data.cartasOferta = data.cartasOferta || [];
    data.comerciales = [];
    data.tiendas = [];
    data.departamentos = [];
    data.estados = [];
    data.prioridades = [];
    data.motivos = [];
    data.tiposContratacion = [];
    data.asignaciones = [];
    data.correos = [];
    data.plantillas = [];

    guardarDatosConfig(data);
    alert('✅ Datos limpiados correctamente.\n\nUsuarios, Roles y Cartas Oferta se han conservado.');
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