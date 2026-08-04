// ==========================================
// CONFIGURACIÓN - DATA STORE CON SUPABASE
// ==========================================
var CONFIG_STORE_KEY = 'siman_config_data';

// ==========================================
// VARIABLES GLOBALES
// ==========================================
var tipoActual = '';
var datosActuales = [];

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
        tiendas: [
            { id: 1, nombre: 'Electrónica', comercial: 'Gran Vía', estado: 'activo' },
            { id: 2, nombre: 'Ropa', comercial: 'Gran Vía', estado: 'activo' },
            { id: 3, nombre: 'Calzado', comercial: 'Multiplaza', estado: 'activo' },
            { id: 4, nombre: 'Hogar', comercial: 'Multiplaza', estado: 'activo' },
            { id: 5, nombre: 'Deportes', comercial: 'Galerías', estado: 'activo' }
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
        asignaciones: [],
        correos: [],
        plantillas: [],
        cartasOferta: []
    };
    localStorage.setItem(CONFIG_STORE_KEY, JSON.stringify(inicial));
    return inicial;
}

// ==========================================
// GUARDAR DATOS (LOCAL + SUPABASE)
// ==========================================
function guardarDatosConfig(data) {
    // Guardar localmente
    localStorage.setItem(CONFIG_STORE_KEY, JSON.stringify(data));
    
    // Sincronizar con Supabase
    sincronizarTodoConSupabase(data);
    
    // Refrescar auth
    if (typeof refreshAuthUsers === 'function') {
        refreshAuthUsers();
    }
    
    // Notificar a otras pestañas
    try {
        window.dispatchEvent(new StorageEvent('storage', {
            key: CONFIG_STORE_KEY,
            newValue: JSON.stringify(data)
        }));
    } catch (e) {}
    
    if (typeof actualizarContadores === 'function') {
        actualizarContadores();
    }
}

// ==========================================
// SINCRONIZAR TODAS LAS TABLAS CON SUPABASE
// ==========================================
function sincronizarTodoConSupabase(data) {
    if (typeof guardarEnSupabase !== 'function') return;
    
    // Usuarios
    if (data.usuarios) {
        data.usuarios.forEach(function(u) {
            guardarEnSupabase('usuarios', {
                id: u.id,
                nombre: u.nombre,
                email: u.email,
                password: u.password,
                rol: u.rol || 'Reclutadora',
                centro: u.centro || 'Central',
                estado: u.estado || 'activo'
            }).then(function(result) {
                if (!result.success) console.warn('Error guardando usuario:', u.nombre, result.error);
            });
        });
    }
    // Roles
    if (data.roles) {
        data.roles.forEach(function(r) {
            guardarEnSupabase('roles', r).then(function(result) {
                if (!result.success) console.warn('Error guardando rol:', r.nombre, result.error);
            });
        });
    }
    // Comerciales
    if (data.comerciales) {
        data.comerciales.forEach(function(c) {
            guardarEnSupabase('comerciales', c).then(function(result) {
                if (!result.success) console.warn('Error guardando comercial:', c.nombre, result.error);
            });
        });
    }
    // Tiendas
    if (data.tiendas) {
        data.tiendas.forEach(function(t) {
            guardarEnSupabase('tiendas', t).then(function(result) {
                if (!result.success) console.warn('Error guardando tienda:', t.nombre, result.error);
            });
        });
    }
    // Departamentos
    if (data.departamentos) {
        data.departamentos.forEach(function(d) {
            guardarEnSupabase('departamentos', d).then(function(result) {
                if (!result.success) console.warn('Error guardando departamento:', d.nombre, result.error);
            });
        });
    }
    // Estados
    if (data.estados) {
        data.estados.forEach(function(e) {
            guardarEnSupabase('estados', e).then(function(result) {
                if (!result.success) console.warn('Error guardando estado:', e.nombre, result.error);
            });
        });
    }
    // Prioridades
    if (data.prioridades) {
        data.prioridades.forEach(function(p) {
            guardarEnSupabase('prioridades', p).then(function(result) {
                if (!result.success) console.warn('Error guardando prioridad:', p.nombre, result.error);
            });
        });
    }
    // Motivos
    if (data.motivos) {
        data.motivos.forEach(function(m) {
            guardarEnSupabase('motivos', m).then(function(result) {
                if (!result.success) console.warn('Error guardando motivo:', m.nombre, result.error);
            });
        });
    }
    // Tipos de contratación
    if (data.tiposContratacion) {
        data.tiposContratacion.forEach(function(t) {
            guardarEnSupabase('tiposContratacion', t).then(function(result) {
                if (!result.success) console.warn('Error guardando tipo de contratación:', t.nombre, result.error);
            });
        });
    }
}

// ==========================================
// ELIMINAR DE SUPABASE
// ==========================================
function eliminarDeSupabasePorTipo(tipo, id) {
    if (typeof eliminarDeSupabase !== 'function') return;
    
    // Mapeo de tipos a nombres de tabla en Supabase
    var tablaMap = {
        'usuarios': 'usuarios',
        'roles': 'roles',
        'comerciales': 'comerciales',
        'tiendas': 'tiendas',
        'departamentos': 'departamentos',
        'estados': 'estados',
        'prioridades': 'prioridades',
        'motivos': 'motivos',
        'tiposContratacion': 'tiposContratacion',
        'cartasOferta': 'cartasOferta',
        'asignaciones': 'asignaciones',
        'correos': 'correos',
        'plantillas': 'plantillas'
    };
    var tabla = tablaMap[tipo];
    if (tabla) {
        eliminarDeSupabase(tabla, id).then(function(result) {
            if (result.success) {
                console.log('✅ Eliminado de Supabase:', tipo, id);
            } else {
                console.warn('Error eliminando de Supabase:', result.error);
            }
        });
    }
}

// ==========================================
// FUNCIONES DE OBTENCIÓN
// ==========================================
function obtenerReclutadores() {
    var data = obtenerDatosConfig();
    var usuarios = data.usuarios || [];
    return usuarios.filter(function(u) {
        return u.rol === 'Reclutadora' && u.estado === 'activo';
    });
}

function obtenerTiendasPorComercial(comercial) {
    var data = obtenerDatosConfig();
    var tiendas = data.tiendas || [];
    if (!comercial) return tiendas;
    return tiendas.filter(function(t) {
        return t.comercial === comercial && t.estado === 'activo';
    });
}

function obtenerComerciales() {
    var data = obtenerDatosConfig();
    return (data.comerciales || []).filter(function(c) {
        return c.estado === 'activo';
    });
}

function obtenerTiendas() {
    var data = obtenerDatosConfig();
    return (data.tiendas || []).filter(function(t) {
        return t.estado === 'activo';
    });
}

function obtenerComercialesParaSelect() {
    var data = obtenerDatosConfig();
    return (data.comerciales || []).filter(function(c) {
        return c.estado === 'activo';
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
    if (!tienePermiso('ver_configuracion')) {
        window.location.href = '/dashboard.html';
        return;
    }
    
    actualizarContadores();
    cargarSelects();
    
    setTimeout(function() {
        if (typeof initSupabase === 'function') {
            initSupabase().then(function() {
                console.log('✅ Supabase listo');
                if (typeof suscribirseATodas === 'function') {
                    suscribirseATodas();
                }
                if (typeof initSupabaseData === 'function') {
                    initSupabaseData();
                }
            }).catch(function(error) {
                console.warn('⚠️ Usando modo offline (Supabase no disponible)');
            });
        }
    }, 500);
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
    
    var selectRol = document.getElementById('usuarioRol');
    if (selectRol) {
        selectRol.innerHTML = '<option value="">Seleccionar rol...</option>';
        data.roles.forEach(function(r) {
            if (r.estado === 'activo') {
                var opt = document.createElement('option');
                opt.value = r.nombre;
                opt.textContent = r.nombre;
                selectRol.appendChild(opt);
            }
        });
    }
    
    var selectComercial = document.getElementById('tiendaComercial');
    if (selectComercial) {
        selectComercial.innerHTML = '<option value="">Seleccionar centro...</option>';
        data.comerciales.forEach(function(c) {
            if (c.estado === 'activo') {
                var opt = document.createElement('option');
                opt.value = c.nombre;
                opt.textContent = c.nombre;
                selectComercial.appendChild(opt);
            }
        });
    }
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
        alert('Error: Panel de gestión no encontrado');
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
    } else if (tipoActual === 'tiendas') {
        columnas = ['ID', 'Nombre', 'Centro Comercial', 'Estado', 'Acciones'];
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
        } else if (tipoActual === 'tiendas') {
            celdas = [
                item.id,
                '<strong>' + item.nombre + '</strong>',
                item.comercial || 'Sin asignar',
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
    var campoComercial = document.getElementById('campoComercial');
    var campoNombre = document.getElementById('campoNombre');
    var labelNombre = document.getElementById('labelNombre');
    
    if (camposUsuario) camposUsuario.style.display = 'none';
    if (camposCarta) camposCarta.style.display = 'none';
    if (campoComercial) campoComercial.style.display = 'none';
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
    } else if (tipoActual === 'tiendas') {
        titulo += 'Tienda';
        if (campoComercial) {
            campoComercial.style.display = 'block';
            cargarComercialesEnSelect();
        }
        if (labelNombre) labelNombre.textContent = 'Nombre de la tienda';
    } else if (tipoActual === 'cartasOferta') {
        titulo += 'Carta Oferta';
        if (camposCarta) {
            camposCarta.style.display = 'block';
            if (labelNombre) labelNombre.textContent = 'Nombre de la carta';
        }
    } else if (tipoActual === 'comerciales') {
        titulo += 'Centro Comercial';
        if (labelNombre) labelNombre.textContent = 'Nombre del centro';
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

function cargarComercialesEnSelect() {
    var data = obtenerDatosConfig();
    var comerciales = data.comerciales || [];
    var select = document.getElementById('tiendaComercial');
    if (!select) return;
    
    select.innerHTML = '<option value="">Seleccionar centro...</option>';
    comerciales.forEach(function(c) {
        if (c.estado === 'activo') {
            var opt = document.createElement('option');
            opt.value = c.nombre;
            opt.textContent = c.nombre;
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

    if (tipo === 'tiendas') {
        var comercial = document.getElementById('tiendaComercial').value;
        if (!comercial) {
            alert('⚠️ Por favor seleccione un centro comercial para esta tienda.');
            return;
        }
        nuevoItem.comercial = comercial;
    }

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
        var index = items.findIndex(function(i) { return i.id == id; });
        if (index !== -1) {
            nuevoItem.id = parseInt(id);
            if (tipo === 'usuarios' && !document.getElementById('usuarioPassword').value) {
                nuevoItem.password = items[index].password;
            }
            if (tipo === 'tiendas' && !document.getElementById('tiendaComercial').value) {
                nuevoItem.comercial = items[index].comercial || 'Sin asignar';
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
    var campoComercial = document.getElementById('campoComercial');
    var campoNombre = document.getElementById('campoNombre');
    var labelNombre = document.getElementById('labelNombre');
    
    if (camposUsuario) camposUsuario.style.display = 'none';
    if (camposCarta) camposCarta.style.display = 'none';
    if (campoComercial) campoComercial.style.display = 'none';
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
    } else if (tipoActual === 'tiendas') {
        titulo += 'Tienda';
        if (campoComercial) {
            campoComercial.style.display = 'block';
            cargarComercialesEnSelect();
            document.getElementById('tiendaComercial').value = item.comercial || '';
        }
        if (labelNombre) labelNombre.textContent = 'Nombre de la tienda';
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
    } else if (tipoActual === 'comerciales') {
        titulo += 'Centro Comercial';
        if (labelNombre) labelNombre.textContent = 'Nombre del centro';
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

    // No permitir eliminar admin
    if (tipoActual === 'usuarios' && item.email === 'admin@siman.com') {
        alert('⚠️ No se puede eliminar al usuario administrador por defecto.');
        return;
    }

    // Eliminar localmente
    items = items.filter(function(i) { return i.id !== id; });
    data[tipoActual] = items;
    localStorage.setItem(CONFIG_STORE_KEY, JSON.stringify(data));
    
    // ✅ Eliminar de Supabase
    eliminarDeSupabasePorTipo(tipoActual, id);
    
    // Actualizar datos actuales
    datosActuales = items;
    renderizarTabla();
    actualizarContadores();
    cargarSelects();
    
    // Refrescar auth
    if (typeof refreshAuthUsers === 'function') {
        refreshAuthUsers();
    }
    
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
// LIMPIAR DATOS
// ==========================================
function limpiarDatos() {
    if (!confirm('⚠️ ¿Estás seguro de limpiar todos los datos del sistema?\n\nSe ELIMINARÁN todos los datos excepto el administrador.')) {
        return;
    }

    var data = obtenerDatosConfig();
    var admin = data.usuarios.find(function(u) { return u.email === 'admin@siman.com'; });
    data.usuarios = admin ? [admin] : [];
    data.roles = [];
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
    alert('✅ Datos limpiados correctamente.');
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
// FUNCIONES DE SINCRONIZACIÓN
// ==========================================
function ejecutarSincronizacion() {
    if (typeof window.sincronizarConSupabase === 'function') {
        if (confirm('⚠️ ¿Deseas subir tus datos a la nube?\n\nEsto guardará todos los cambios en la nube.')) {
            var btn = document.querySelector('.btn-success');
            if (btn) {
                btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sincronizando...';
                btn.disabled = true;
            }
            window.sincronizarConSupabase().then(function(resultado) {
                if (typeof agregarNotificacion === 'function') {
                    if (resultado && resultado.error) {
                        agregarNotificacion('danger', '❌ Error al sincronizar: ' + resultado.error, '#');
                    } else {
                        agregarNotificacion('success', '✅ Datos sincronizados correctamente', '#');
                    }
                }
                if (tipoActual) {
                    var data = obtenerDatosConfig();
                    datosActuales = data[tipoActual] || [];
                    renderizarTabla();
                }
                if (btn) {
                    btn.innerHTML = '<i class="fas fa-cloud-upload-alt"></i> Subir a nube';
                    btn.disabled = false;
                }
            }).catch(function(error) {
                if (typeof agregarNotificacion === 'function') {
                    agregarNotificacion('danger', '❌ Error al sincronizar: ' + error.message, '#');
                }
                console.error('Error en sincronización:', error);
                if (btn) {
                    btn.innerHTML = '<i class="fas fa-cloud-upload-alt"></i> Subir a nube';
                    btn.disabled = false;
                }
            });
        }
    } else {
        alert('⚠️ La función de sincronización no está disponible.');
        console.error('Error: window.sincronizarConSupabase no está definida');
    }
}

function ejecutarCargaNube() {
    if (typeof window.initSupabaseData === 'function') {
        if (confirm('⚠️ ¿Deseas cargar los datos desde la nube?\n\nEsto fusionará los datos locales con los de la nube.')) {
            window.initSupabaseData().then(function() {
                if (typeof agregarNotificacion === 'function') {
                    agregarNotificacion('success', '✅ Datos cargados desde la nube correctamente', '#');
                }
                if (tipoActual) {
                    var data = obtenerDatosConfig();
                    datosActuales = data[tipoActual] || [];
                    renderizarTabla();
                }
            }).catch(function(error) {
                if (typeof agregarNotificacion === 'function') {
                    agregarNotificacion('danger', '❌ Error al cargar desde la nube: ' + error.message, '#');
                }
                console.error('Error cargando desde nube:', error);
            });
        }
    } else {
        alert('⚠️ La función de carga desde la nube no está disponible.');
        console.error('Error: window.initSupabaseData no está definida');
    }
}

// ==========================================
// EXPONER FUNCIONES GLOBALMENTE
// ==========================================
window.obtenerDatosConfig = obtenerDatosConfig;
window.obtenerReclutadores = obtenerReclutadores;
window.obtenerTiendasPorComercial = obtenerTiendasPorComercial;
window.obtenerComerciales = obtenerComerciales;
window.obtenerTiendas = obtenerTiendas;
window.obtenerComercialesParaSelect = obtenerComercialesParaSelect;
window.guardarDatosConfig = guardarDatosConfig;
window.eliminarDeSupabasePorTipo = eliminarDeSupabasePorTipo;
window.ejecutarSincronizacion = ejecutarSincronizacion;
window.ejecutarCargaNube = ejecutarCargaNube;
window.limpiarDatos = limpiarDatos;
window.abrirGestion = abrirGestion;
window.abrirModalAgregar = abrirModalAgregar;
window.guardarItem = guardarItem;
window.editarItem = editarItem;
window.eliminarItem = eliminarItem;
window.cerrarModal = cerrarModal;
window.exportarDatos = exportarDatos;

console.log('✅ Configuración cargada correctamente (con sincronización bidireccional)');