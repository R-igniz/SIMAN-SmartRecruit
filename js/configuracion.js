// ==========================================
// CONFIGURACIÓN - DATA STORE
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
// NOTIFICACIONES DE RESPALDO
// ==========================================
if (typeof agregarNotificacion !== 'function') {
    function agregarNotificacion(tipo, mensaje, link) {
        console.log('📢 [' + tipo + '] ' + mensaje);
        alert(mensaje);
    }
    window.agregarNotificacion = agregarNotificacion;
}

// ==========================================
// GUARDAR DATOS Y SINCRONIZAR CON SUPABASE
// ==========================================
function guardarDatosConfig(data) {
    localStorage.setItem(CONFIG_STORE_KEY, JSON.stringify(data));
    
    if (typeof guardarEnSupabase === 'function') {
        if (data.usuarios) {
            data.usuarios.forEach(function(u) {
                guardarEnSupabase('usuarios', u);
            });
        }
        if (data.roles) {
            data.roles.forEach(function(r) {
                guardarEnSupabase('roles', r);
            });
        }
        if (data.comerciales) {
            data.comerciales.forEach(function(c) {
                guardarEnSupabase('comerciales', c);
            });
        }
    }
    
    if (typeof refreshAuthUsers === 'function') {
        refreshAuthUsers();
    }
    
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
    cargarSelects();
    
    // Inicializar Supabase después de que todo esté cargado
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
    var select = document.getElementById('usuarioRol');
    if (select) {
        select.innerHTML = '<option value="">Seleccionar rol...</option>';
        data.roles.forEach(function(r) {
            if (r.estado === 'activo') {
                var opt = document.createElement('option');
                opt.value = r.nombre;
                opt.textContent = r.nombre;
                select.appendChild(opt);
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
// LIMPIAR DATOS
// ==========================================
function limpiarDatos() {
    if (!confirm('⚠️ ¿Estás seguro de limpiar los datos del sistema?\n\nSe ELIMINARÁN todos los datos excepto el administrador.')) {
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
// FUNCIONES DE SINCRONIZACIÓN (WRAPPERS)
// ==========================================

function ejecutarSincronizacion() {
    console.log('🔄 Ejecutando sincronización desde configuracion.js');
    
    // Verificar que la función global exista
    if (typeof window.sincronizarConSupabase === 'function') {
        if (confirm('⚠️ ¿Deseas subir tus datos a la nube?\n\nEsto guardará todos los cambios en la nube.')) {
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
            }).catch(function(error) {
                if (typeof agregarNotificacion === 'function') {
                    agregarNotificacion('danger', '❌ Error al sincronizar: ' + error.message, '#');
                }
                console.error('Error en sincronización:', error);
            });
        }
    } else {
        console.warn('⚠️ window.sincronizarConSupabase no está definida');
        alert('⚠️ La función de sincronización no está disponible. Asegúrate de que supabase-client.js esté cargado.');
    }
}

function ejecutarCargaNube() {
    console.log('🔄 Ejecutando carga desde nube desde configuracion.js');
    
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
        console.warn('⚠️ window.initSupabaseData no está definida');
        alert('⚠️ La función de carga desde la nube no está disponible. Asegúrate de que supabase-client.js esté cargado.');
    }
}

// Exponer funciones globalmente
window.ejecutarSincronizacion = ejecutarSincronizacion;
window.ejecutarCargaNube = ejecutarCargaNube;
window.abrirGestion = abrirGestion;
window.abrirModalAgregar = abrirModalAgregar;
window.guardarItem = guardarItem;
window.editarItem = editarItem;
window.eliminarItem = eliminarItem;
window.cerrarModal = cerrarModal;
window.exportarDatos = exportarDatos;
window.limpiarDatos = limpiarDatos;