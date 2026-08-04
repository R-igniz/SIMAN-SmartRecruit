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
// GUARDAR DATOS Y SINCRONIZAR CON SUPABASE
// ==========================================
function guardarDatosConfig(data) {
    localStorage.setItem(CONFIG_STORE_KEY, JSON.stringify(data));
    
    if (typeof guardarEnSupabase === 'function') {
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
                });
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
        if (data.tiendas) {
            data.tiendas.forEach(function(t) {
                guardarEnSupabase('tiendas', t);
            });
        }
        if (data.departamentos) {
            data.departamentos.forEach(function(d) {
                guardarEnSupabase('departamentos', d);
            });
        }
        if (data.estados) {
            data.estados.forEach(function(e) {
                guardarEnSupabase('estados', e);
            });
        }
        if (data.prioridades) {
            data.prioridades.forEach(function(p) {
                guardarEnSupabase('prioridades', p);
            });
        }
        if (data.motivos) {
            data.motivos.forEach(function(m) {
                guardarEnSupabase('motivos', m);
            });
        }
        if (data.tiposContratacion) {
            data.tiposContratacion.forEach(function(t) {
                guardarEnSupabase('tiposContratacion', t);
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
// FUNCIONES DE OBTENCIÓN DE DATOS
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
// INICIALIZAR - VERIFICAR PERMISO (NO ADMIN)
// ==========================================
document.addEventListener('DOMContentLoaded', function() {
    var user = getCurrentUser();
    if (!user) {
        window.location.href = '/login.html';
        return;
    }
    // ✅ CORRECCIÓN: usar tienePermiso, NO esAdministrador
    if (!tienePermiso('ver_configuracion')) {
        alert('⚠️ Acceso denegado. No tienes permisos para acceder a Configuración.');
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

// ... (resto de las funciones igual que antes, con los mismos nombres)
// Asegúrate de que todas las funciones estén completas, incluyendo abrirGestion, renderizarTabla, guardarItem, etc.
// Las funciones de CRUD ya están bien, solo cambia la verificación de entrada.