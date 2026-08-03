// ==========================================
// SUPABASE CLIENT - CONFIGURACIÓN
// ==========================================

var SUPABASE_URL = 'https://kmqantnfueparuwycgdz.supabase.co';
var SUPABASE_KEY = 'sb_publishable_FOF12VLnddzD-V52S2h--g_EqZEvQ_s';

var supabaseInitialized = false;
var supabaseClient = null;

function initSupabase() {
    return new Promise(function(resolve, reject) {
        if (supabaseInitialized && supabaseClient) {
            resolve(supabaseClient);
            return;
        }

        var script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
        script.onload = function() {
            try {
                var supabase = window.supabase;
                supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
                supabaseInitialized = true;
                console.log('✅ Supabase inicializado correctamente');
                resolve(supabaseClient);
            } catch (error) {
                console.error('❌ Error al inicializar Supabase:', error);
                reject(error);
            }
        };
        script.onerror = function() {
            reject(new Error('Error al cargar la librería de Supabase'));
        };
        document.head.appendChild(script);
    });
}

// ==========================================
// FUNCIONES CRUD
// ==========================================

async function guardarEnSupabase(tabla, datos) {
    try {
        var client = await initSupabase();
        var { data, error } = await client
            .from(tabla)
            .upsert(datos, { onConflict: 'id' });
        
        if (error) throw error;
        return { success: true, data: data };
    } catch (error) {
        console.error('Error guardando en Supabase:', error);
        return { success: false, error: error.message };
    }
}

async function obtenerDeSupabase(tabla, filtros, orden) {
    try {
        var client = await initSupabase();
        var query = client.from(tabla).select('*');
        
        if (filtros) {
            Object.keys(filtros).forEach(function(key) {
                query = query.eq(key, filtros[key]);
            });
        }
        
        if (orden) {
            query = query.order(orden.campo, { ascending: orden.ascendente !== false });
        }
        
        var { data, error } = await query;
        if (error) throw error;
        return { success: true, data: data };
    } catch (error) {
        console.error('Error obteniendo de Supabase:', error);
        return { success: false, error: error.message, data: [] };
    }
}

async function eliminarDeSupabase(tabla, id) {
    try {
        var client = await initSupabase();
        var { data, error } = await client
            .from(tabla)
            .delete()
            .eq('id', id);
        
        if (error) throw error;
        return { success: true, data: data };
    } catch (error) {
        console.error('Error eliminando de Supabase:', error);
        return { success: false, error: error.message };
    }
}

// ==========================================
    // SUSCRIPCIÓN EN TIEMPO REAL
// ==========================================

function suscribirseATabla(tabla, callback) {
    initSupabase().then(function(client) {
        client
            .channel('tabla_changes_' + tabla)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: tabla
                },
                function(payload) {
                    console.log('🔄 Cambio detectado en', tabla, ':', payload);
                    callback(payload);
                }
            )
            .subscribe();
    }).catch(function(error) {
        console.error('Error al suscribirse:', error);
    });
}

// ==========================================
// SINCRONIZAR DATOS LOCALES CON SUPABASE
// ==========================================

async function sincronizarConSupabase() {
    console.log('🔄 Sincronizando datos con Supabase...');
    
    try {
        var data = JSON.parse(localStorage.getItem('siman_config_data') || '{}');
        var resultados = {
            usuarios: 0,
            roles: 0,
            comerciales: 0,
            requisiciones: 0
        };
        
        // Sincronizar usuarios
        if (data.usuarios && data.usuarios.length > 0) {
            for (var i = 0; i < data.usuarios.length; i++) {
                var result = await guardarEnSupabase('usuarios', data.usuarios[i]);
                if (result.success) resultados.usuarios++;
            }
        }
        
        // Sincronizar roles
        if (data.roles && data.roles.length > 0) {
            for (var i = 0; i < data.roles.length; i++) {
                var result = await guardarEnSupabase('roles', data.roles[i]);
                if (result.success) resultados.roles++;
            }
        }
        
        // Sincronizar comerciales
        if (data.comerciales && data.comerciales.length > 0) {
            for (var i = 0; i < data.comerciales.length; i++) {
                var result = await guardarEnSupabase('comerciales', data.comerciales[i]);
                if (result.success) resultados.comerciales++;
            }
        }
        
        // Sincronizar requisiciones
        var requisiciones = JSON.parse(localStorage.getItem('requisiciones_data') || '[]');
        if (requisiciones.length > 0) {
            for (var i = 0; i < requisiciones.length; i++) {
                var result = await guardarEnSupabase('requisiciones', requisiciones[i]);
                if (result.success) resultados.requisiciones++;
            }
        }
        
        console.log('✅ Sincronización completada:', resultados);
        
        if (typeof agregarNotificacion === 'function') {
            agregarNotificacion('success', 
                '✅ Datos sincronizados: ' + 
                resultados.usuarios + ' usuarios, ' + 
                resultados.roles + ' roles, ' + 
                resultados.comerciales + ' comerciales',
                '#'
            );
        }
        
        return resultados;
    } catch (error) {
        console.error('❌ Error en sincronización:', error);
        return { error: error.message };
    }
}

// ==========================================
// CARGAR DATOS DESDE SUPABASE
// ==========================================

async function cargarDesdeSupabase(tabla) {
    var result = await obtenerDeSupabase(tabla);
    if (result.success) {
        return result.data;
    }
    return [];
}

// ==========================================
// INICIALIZAR TODO
// ==========================================

function initSupabaseData() {
    Promise.all([
        cargarDesdeSupabase('usuarios'),
        cargarDesdeSupabase('roles'),
        cargarDesdeSupabase('comerciales'),
        cargarDesdeSupabase('requisiciones')
    ]).then(function(results) {
        var data = {
            usuarios: results[0] || [],
            roles: results[1] || [],
            comerciales: results[2] || [],
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
        
        localStorage.setItem('siman_config_data', JSON.stringify(data));
        localStorage.setItem('requisiciones_data', JSON.stringify(results[3] || []));
        
        console.log('✅ Datos cargados desde Supabase');
        
        if (typeof actualizarContadores === 'function') {
            actualizarContadores();
        }
        
        if (typeof cargarUsuarios === 'function') {
            cargarUsuarios();
        }
        
        if (typeof cargarRequisiciones === 'function') {
            cargarRequisiciones();
        }
    }).catch(function(error) {
        console.error('Error cargando datos:', error);
    });
}

// ==========================================
// SUSCRIBIRSE A TODAS LAS TABLAS
// ==========================================

function suscribirseATodas() {
    var tablas = ['usuarios', 'roles', 'comerciales', 'requisiciones'];
    
    tablas.forEach(function(tabla) {
        suscribirseATabla(tabla, function(payload) {
            console.log('🔄 Cambio en ' + tabla + ':', payload);
            
            cargarDesdeSupabase(tabla).then(function(data) {
                if (tabla === 'usuarios') {
                    var config = JSON.parse(localStorage.getItem('siman_config_data') || '{}');
                    config.usuarios = data;
                    localStorage.setItem('siman_config_data', JSON.stringify(config));
                    if (typeof cargarUsuarios === 'function') cargarUsuarios();
                    if (typeof refreshAuthUsers === 'function') refreshAuthUsers();
                } else if (tabla === 'requisiciones') {
                    localStorage.setItem('requisiciones_data', JSON.stringify(data));
                    if (typeof cargarRequisiciones === 'function') cargarRequisiciones();
                } else {
                    var config = JSON.parse(localStorage.getItem('siman_config_data') || '{}');
                    config[tabla] = data;
                    localStorage.setItem('siman_config_data', JSON.stringify(config));
                }
                
                if (typeof actualizarContadores === 'function') {
                    actualizarContadores();
                }
                
                if (typeof agregarNotificacion === 'function') {
                    agregarNotificacion('info', '🔄 Datos actualizados: ' + tabla, '#');
                }
            });
        });
    });
}

// ==========================================
// EXPORTAR FUNCIONES
// ==========================================

window.initSupabase = initSupabase;
window.guardarEnSupabase = guardarEnSupabase;
window.obtenerDeSupabase = obtenerDeSupabase;
window.eliminarDeSupabase = eliminarDeSupabase;
window.sincronizarConSupabase = sincronizarConSupabase;
window.cargarDesdeSupabase = cargarDesdeSupabase;
window.initSupabaseData = initSupabaseData;
window.suscribirseATodas = suscribirseATodas;
window.suscribirseATabla = suscribirseATabla;