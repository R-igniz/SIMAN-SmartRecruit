// ==========================================
// CONFIGURACIÓN - DATA STORE CON SUPABASE
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
// GUARDAR DATOS Y SINCRONIZAR CON SUPABASE
// ==========================================
function guardarDatosConfig(data) {
    // Guardar localmente
    localStorage.setItem(CONFIG_STORE_KEY, JSON.stringify(data));
    
    // Guardar en Supabase (sin esperar para no bloquear)
    if (typeof guardarEnSupabase === 'function') {
        // Guardar usuarios
        if (data.usuarios) {
            data.usuarios.forEach(function(u) {
                guardarEnSupabase('usuarios', u).then(function(result) {
                    if (!result.success) {
                        console.warn('Error guardando usuario en Supabase:', u.nombre, result.error);
                    }
                });
            });
        }
        // Guardar roles
        if (data.roles) {
            data.roles.forEach(function(r) {
                guardarEnSupabase('roles', r);
            });
        }
        // Guardar comerciales
        if (data.comerciales) {
            data.comerciales.forEach(function(c) {
                guardarEnSupabase('comerciales', c);
            });
        }
    }
    
    // Refrescar auth
    if (typeof refreshAuthUsers === 'function') {
        refreshAuthUsers();
    }
    
    // Disparar evento para sincronizar pestañas
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
// INICIALIZAR CON SUPABASE
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
    
    // Inicializar Supabase en segundo plano
    if (typeof initSupabase === 'function') {
        initSupabase().then(function() {
            console.log('✅ Supabase listo');
            if (typeof suscribirseATodas === 'function') {
                suscribirseATodas();
            }
            // Cargar datos desde Supabase (sin sobrescribir)
            if (typeof initSupabaseData === 'function') {
                initSupabaseData();
            }
        }).catch(function(error) {
            console.warn('⚠️ Usando modo offline (Supabase no disponible)');
        });
    }
});

// ==========================================
// ELIMINAR USUARIO (con confirmación mejorada)
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
// FORZAR RECARGA DESDE SUPABASE (sin perder datos locales)
// ==========================================
function recargarDesdeNube() {
    if (typeof initSupabaseData === 'function') {
        initSupabaseData();
    }
}

// Exponer función
window.recargarDesdeNube = recargarDesdeNube;