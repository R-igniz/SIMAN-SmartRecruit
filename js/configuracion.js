// ==========================================
// CONFIGURACIÓN - DATA STORE
// ==========================================
var CONFIG_STORE_KEY = 'siman_config_data';

// ==========================================
// OBTENER DATOS DE CONFIGURACIÓN
// ==========================================
function obtenerDatosConfig() {
    try {
        var data = localStorage.getItem(CONFIG_STORE_KEY);
        if (data) {
            return JSON.parse(data);
        }
    } catch (e) {
        console.error('Error al leer datos:', e);
    }
    
    // Datos iniciales - SOLO ADMIN
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
        comerciales: [
            { id: 1, nombre: 'Gran Vía', estado: 'activo' },
            { id: 2, nombre: 'Multiplaza', estado: 'activo' },
            { id: 3, nombre: 'Galerías', estado: 'activo' }
        ],
        tiendas: [],
        departamentos: [],
        estados: [],
        prioridades: [],
        motivos: [],
        tiposContratacion: [],
        asignaciones: [],
        correos: [],
        plantillas: [],
        cartasOferta: []
    };
    localStorage.setItem(CONFIG_STORE_KEY, JSON.stringify(inicial));
    return inicial;
}

// ==========================================
// GUARDAR DATOS Y SINCRONIZAR
// ==========================================
function guardarDatosConfig(data) {
    localStorage.setItem(CONFIG_STORE_KEY, JSON.stringify(data));
    
    if (typeof refreshAuthUsers === 'function') {
        refreshAuthUsers();
    }
    
    try {
        window.dispatchEvent(new StorageEvent('storage', { 
            key: CONFIG_STORE_KEY, 
            newValue: JSON.stringify(data) 
        }));
    } catch (e) {
        console.log('Datos guardados:', data);
    }
    
    if (typeof actualizarContadores === 'function') {
        actualizarContadores();
    }
}

// ==========================================
// SINCRONIZAR ENTRE PESTAÑAS
// ==========================================
window.addEventListener('storage', function(e) {
    if (e.key === CONFIG_STORE_KEY) {
        console.log('🔄 Datos sincronizados desde otra pestaña');
        
        if (typeof actualizarContadores === 'function') {
            actualizarContadores();
        }
        
        if (typeof tipoActual !== 'undefined' && tipoActual) {
            var data = obtenerDatosConfig();
            datosActuales = data[tipoActual] || [];
            if (typeof renderizarTabla === 'function') {
                renderizarTabla();
            }
        }
        
        if (document.getElementById('usuariosBody')) {
            cargarUsuarios();
        }
    }
});

// ==========================================
// VARIABLES GLOBALES
// ==========================================
var tipoActual = '';
var datosActuales = [];

// ==========================================
// INICIALIZAR CONFIGURACIÓN
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
    cargarSelects();
});

// ==========================================
// ACTUALIZAR CONTADORES
// ==========================================
function actualizarContadores() {
    var data = obtenerDatosConfig();
    var tipos = ['usuarios', 'roles', 'comerciales', 'tiendas', 'departamentos', 
                 'estados', 'prioridades', 'motivos', 'tiposContratacion', 
                 'asignaciones', 'correos', 'plantillas', 'cartasOferta'];
    
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
// CARGAR SELECTS
// ==========================================
function cargarSelects() {
    var data = obtenerDatosConfig();
    var selects = ['usuarioRol', 'filtroRol', 'filtroCentro'];
    selects.forEach(function(id) {
        var select = document.getElementById(id);
        if (select) {
            var options = select.options;
            while (options.length > 1) {
                select.remove(1);
            }
            if (id === 'usuarioRol' || id === 'filtroRol') {
                data.roles.forEach(function(r) {
                    if (r.estado === 'activo') {
                        var opt = document.createElement('option');
                        opt.value = r.nombre;
                        opt.textContent = r.nombre;
                        select.appendChild(opt);
                    }
                });
            } else if (id === 'filtroCentro') {
                data.comerciales.forEach(function(c) {
                    if (c.estado === 'activo') {
                        var opt = document.createElement('option');
                        opt.value = c.nombre;
                        opt.textContent = c.nombre;
                        select.appendChild(opt);
                    }
                });
            }
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
        'plantillas': 'Plantillas',
        'cartasOferta': 'Cartas Oferta'
    };

    var panel = document.getElementById('gestionPanel');
    if (panel) {
        document.getElementById('gestionTitulo').innerHTML = '<i class="fas fa-list"></i> ' + (nombres[tipo] || tipo);
        panel.style.display = 'block';
        renderizarTabla();
    } else {
        navigateTo('/configuracion.html?tab=' + tipo);
    }
}

// ==========================================
// RENDERIZAR TABLA
// ==========================================
function renderizarTabla() {
    var thead = document.getElementById('gestionThead');
    var tbody = document.getElementById('gestionBody');
    
    if (!thead || !tbody) return;
    
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
    } else if (tipoActual === 'cartasOferta') {
        columnas = ['ID', 'Nombre', 'Monto ($)', 'Archivo', 'Estado', 'Acciones'];
    } else {
        columnas = ['ID', 'Nombre', 'Estado', 'Acciones'];
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
    var modal = document.getElementById(id);
    if (modal) modal.classList.add('show');
}

function cerrarModal(id) {
    var modal = document.getElementById(id);
    if (modal) modal.classList.remove('show');
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
    var form = document.getElementById('formGestion');
    if (!form) return;
    
    form.reset();
    document.getElementById('gestionId').value = '';
    document.getElementById('gestionTipo').value = tipoActual;
    document.getElementById('gestionEstado').value = 'activo';

    var camposUsuario = document.getElementById('camposUsuario');
    var camposCarta = document.getElementById('camposCarta');
    var campoNombre = document.getElementById('campoNombre');
    var labelNombre = document.getElementById('labelNombre');
    
    if (camposUsuario) camposUsuario.style.display = 'none';
    if (camposCarta) camposCarta.style.display = 'none';
    if (campoNombre) campoNombre.style.display = 'block';
    if (labelNombre) labelNombre.textContent = 'Nombre';

    var titulo = 'Agregar ';
    if (tipoActual === 'usuarios') {
        titulo += 'Usuario';
        if (camposUsuario) {
            camposUsuario.style.display = 'block';
            cargarRolesEnSelect();
            document.getElementById('usuarioPassword').required = true;
        }
    } else if (tipoActual === 'cartasOferta') {
        titulo += 'Carta Oferta';
        if (camposCarta) {
            camposCarta.style.display = 'block';
            if (labelNombre) labelNombre.textContent = 'Nombre de la carta';
        }
    } else if (tipoActual === 'roles') {
        titulo += 'Rol';
    } else {
        titulo += tipoActual.charAt(0).toUpperCase() + tipoActual.slice(1);
    }

    var modalTitulo = document.getElementById('modalGestionTitulo');
    if (modalTitulo) {
        modalTitulo.innerHTML = '<i class="fas fa-plus"></i> ' + titulo;
    }
    abrirModal('modalGestion');
}

function cargarRolesEnSelect() {
    var data = obtenerDatosConfig();
    var roles = data.roles || [];
    var select = document.getElementById('usuarioRol');
    if (!select) return;
    
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
// GUARDAR ITEM (CREAR O EDITAR)
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

    var nuevoItem = { id: id ? parseInt(id) : 0, nombre: nombre, estado: estado };

    // Campos específicos para usuarios
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

    // Campos específicos para cartas oferta
    if (tipo === 'cartasOferta') {
        var monto = parseFloat(document.getElementById('cartaMonto').value) || 0;
        var archivoInput = document.getElementById('cartaArchivo');
        var archivoNombre = '';
        if (archivoInput && archivoInput.files && archivoInput.files.length > 0) {
            archivoNombre = archivoInput.files[0].name;
        } else if (id) {
            var existente = items.find(function(c) { return c.id == id; });
            if (existente) archivoNombre = existente.archivo || '';
        }
        nuevoItem.monto = monto;
        nuevoItem.archivo = archivoNombre;
    }

    if (id) {
        // Editar
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
        // Nuevo
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
    actualizarContadores();
    cargarSelects();
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

    var camposUsuario = document.getElementById('camposUsuario');
    var camposCarta = document.getElementById('camposCarta');
    var campoNombre = document.getElementById('campoNombre');
    var labelNombre = document.getElementById('labelNombre');
    
    if (camposUsuario) camposUsuario.style.display = 'none';
    if (camposCarta) camposCarta.style.display = 'none';
    if (campoNombre) campoNombre.style.display = 'block';
    if (labelNombre) labelNombre.textContent = 'Nombre';

    var titulo = 'Editar ';
    if (tipoActual === 'usuarios') {
        titulo += 'Usuario';
        if (camposUsuario) {
            camposUsuario.style.display = 'block';
            document.getElementById('usuarioEmail').value = item.email || '';
            document.getElementById('usuarioPassword').value = '';
            document.getElementById('usuarioPassword').placeholder = 'Dejar en blanco para mantener';
            document.getElementById('usuarioPassword').required = false;
            cargarRolesEnSelect();
            document.getElementById('usuarioRol').value = item.rol || '';
        }
    } else if (tipoActual === 'cartasOferta') {
        titulo += 'Carta Oferta';
        if (camposCarta) {
            camposCarta.style.display = 'block';
            if (labelNombre) labelNombre.textContent = 'Nombre de la carta';
            document.getElementById('cartaMonto').value = item.monto || '';
            var archivoLabel = document.querySelector('#camposCarta small');
            if (archivoLabel) {
                if (item.archivo) {
                    archivoLabel.textContent = 'Archivo actual: ' + item.archivo + ' (subir uno nuevo para reemplazar)';
                } else {
                    archivoLabel.textContent = 'Opcional: sube un archivo PDF';
                }
            }
        }
    } else {
        titulo += tipoActual.charAt(0).toUpperCase() + tipoActual.slice(1);
    }

    var modalTitulo = document.getElementById('modalGestionTitulo');
    if (modalTitulo) {
        modalTitulo.innerHTML = '<i class="fas fa-edit"></i> ' + titulo;
    }
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

    // No permitir eliminar al administrador por defecto
    if (tipoActual === 'usuarios' && item.email === 'admin@siman.com') {
        alert('⚠️ No se puede eliminar al usuario administrador por defecto.');
        return;
    }

    items = items.filter(function(i) { return i.id !== id; });
    data[tipoActual] = items;
    guardarDatosConfig(data);

    datosActuales = items;
    renderizarTabla();
    actualizarContadores();
    cargarSelects();
    mostrarConfirmacion('Eliminado', 'El elemento ha sido eliminado correctamente.');
}

// ==========================================
// CONFIRMACIÓN
// ==========================================
function mostrarConfirmacion(titulo, mensaje) {
    var tituloEl = document.getElementById('confirmacionTitulo');
    var mensajeEl = document.getElementById('confirmacionMensaje');
    if (tituloEl) tituloEl.textContent = titulo;
    if (mensajeEl) mensajeEl.textContent = mensaje;
    abrirModal('modalConfirmacion');
}

// ==========================================
// LIMPIAR DATOS (CONSERVAR ADMIN)
// ==========================================
function limpiarDatos() {
    if (!confirm('⚠️ ¿Estás seguro de limpiar los datos del sistema?\n\nSe ELIMINARÁN:\n- Comerciales\n- Tiendas\n- Departamentos\n- Estados\n- Prioridades\n- Motivos\n- Tipos de contratación\n- Asignaciones\n- Correos\n- Plantillas\n- Cartas Oferta\n\nSe CONSERVARÁN:\n- Usuario administrador\n- Roles')) {
        return;
    }

    var data = obtenerDatosConfig();
    // Conservar solo el admin
    var admin = data.usuarios.find(function(u) { return u.email === 'admin@siman.com'; });
    data.usuarios = admin ? [admin] : [];
    data.roles = data.roles || [];
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
    data.cartasOferta = [];

    guardarDatosConfig(data);
    alert('✅ Datos limpiados correctamente.\n\nUsuario administrador y Roles se han conservado.');
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
// CARGAR USUARIOS EN TABLA
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