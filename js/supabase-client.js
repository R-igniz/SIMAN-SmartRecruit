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
// CRUD - Guardar
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

// ==========================================
// CRUD - Obtener
// ==========================================
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

// ==========================================
// CRUD - Eliminar
// ==========================================
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
// SINCRONIZAR DATOS LOCALES CON SUPABASE (SUBIENDO Y ELIMINANDO)
// ==========================================
async function sincronizarConSupabase() {
    console.log('🔄 Sincronización segura con Supabase...');
    try {
        if (!navigator.onLine) return { error: 'Sin conexión a Internet' };
        await initSupabase();

        var config = JSON.parse(localStorage.getItem('siman_config_data') || '{}');
        var requisiciones = JSON.parse(localStorage.getItem('requisiciones_data') || '[]');
        var tablas = [
            ['usuarios', config.usuarios || []], ['roles', config.roles || []],
            ['comerciales', config.comerciales || []], ['tiendas', config.tiendas || []],
            ['departamentos', config.departamentos || []], ['estados', config.estados || []],
            ['prioridades', config.prioridades || []], ['motivos', config.motivos || []],
            ['tiposContratacion', config.tiposContratacion || []], ['requisiciones', requisiciones]
        ];
        var resultados = { subidos: 0, errores: 0, eliminados: 0 };

        // IMPORTANTE: nunca se eliminan registros remotos por faltar en localStorage.
        // Las eliminaciones deben ser acciones explícitas del usuario.
        for (var t = 0; t < tablas.length; t++) {
            var tabla = tablas[t][0], items = tablas[t][1];
            for (var i = 0; i < items.length; i++) {
                var r = await guardarEnSupabase(tabla, items[i]);
                if (r.success) resultados.subidos++; else resultados.errores++;
            }
        }
        await initSupabaseData();
        if (typeof agregarNotificacion === 'function') {
            agregarNotificacion(resultados.errores ? 'warning' : 'success',
                'Sincronización finalizada. ' + resultados.subidos + ' registros procesados.', '#');
        }
        return resultados;
    } catch (error) {
        console.error('❌ Error en sincronización:', error);
        return { error: error.message };
    }
}

// ==========================================
// CARGAR DATOS DESDE SUPABASE (FUSIONAR)
// ==========================================
async function cargarDesdeSupabase(tabla) {
    var result = await obtenerDeSupabase(tabla);
    if (result.success) return result.data;
    return [];
}

function fusionarDatos(datosLocales, datosRemotos, claveUnica) {
    var mapaLocal = {};
    datosLocales.forEach(function(item) {
        mapaLocal[item[claveUnica]] = item;
    });
    datosRemotos.forEach(function(item) {
        var key = item[claveUnica];
        if (!mapaLocal[key]) {
            mapaLocal[key] = item;
        }
    });
    return Object.values(mapaLocal);
}

async function initSupabaseData() {
    console.log('🔄 Cargando datos desde Supabase...');
    try {
        if (!navigator.onLine) {
            if (typeof agregarNotificacion === 'function') {
                agregarNotificacion('warning', '⚠️ Sin conexión a Internet. Usando datos locales.', '#');
            }
            return null;
        }
        await initSupabase();
        
        var [usuariosRemotos, rolesRemotos, comercialesRemotos, tiendasRemotos, 
             departamentosRemotos, estadosRemotos, prioridadesRemotos, 
             motivosRemotos, tiposContratacionRemotos, requisicionesRemotos] = await Promise.all([
            cargarDesdeSupabase('usuarios'),
            cargarDesdeSupabase('roles'),
            cargarDesdeSupabase('comerciales'),
            cargarDesdeSupabase('tiendas'),
            cargarDesdeSupabase('departamentos'),
            cargarDesdeSupabase('estados'),
            cargarDesdeSupabase('prioridades'),
            cargarDesdeSupabase('motivos'),
            cargarDesdeSupabase('tiposContratacion'),
            cargarDesdeSupabase('requisiciones')
        ]);
        
        var dataLocal = JSON.parse(localStorage.getItem('siman_config_data') || '{}');
        
        // Supabase es la fuente principal. Solo conservar datos locales si la tabla remota está vacía.
        dataLocal.usuarios = usuariosRemotos.length ? usuariosRemotos : (dataLocal.usuarios || []);
        dataLocal.roles = rolesRemotos.length ? rolesRemotos : (dataLocal.roles || []);
        dataLocal.comerciales = comercialesRemotos.length ? comercialesRemotos : (dataLocal.comerciales || []);
        dataLocal.tiendas = tiendasRemotos.length ? tiendasRemotos : (dataLocal.tiendas || []);
        dataLocal.departamentos = departamentosRemotos.length ? departamentosRemotos : (dataLocal.departamentos || []);
        dataLocal.estados = estadosRemotos.length ? estadosRemotos : (dataLocal.estados || []);
        dataLocal.prioridades = prioridadesRemotos.length ? prioridadesRemotos : (dataLocal.prioridades || []);
        dataLocal.motivos = motivosRemotos.length ? motivosRemotos : (dataLocal.motivos || []);
        dataLocal.tiposContratacion = tiposContratacionRemotos.length ? tiposContratacionRemotos : (dataLocal.tiposContratacion || []);
        
        localStorage.setItem('siman_config_data', JSON.stringify(dataLocal));
        localStorage.setItem('requisiciones_data', JSON.stringify(requisicionesRemotos));
        
        console.log('✅ Datos cargados y fusionados desde Supabase');
        console.log('👥 Usuarios totales:', dataLocal.usuarios.length);
        
        if (typeof actualizarContadores === 'function') actualizarContadores();
        if (typeof cargarUsuarios === 'function') cargarUsuarios();
        if (typeof cargarRequisiciones === 'function') cargarRequisiciones();
        if (typeof refreshAuthUsers === 'function') refreshAuthUsers();
        if (typeof agregarNotificacion === 'function') {
            agregarNotificacion('success', 
                '✅ Datos cargados: ' + dataLocal.usuarios.length + ' usuarios, ' + 
                dataLocal.roles.length + ' roles, ' + 
                dataLocal.comerciales.length + ' comerciales', 
                '#'
            );
        }
        return dataLocal;
    } catch (error) {
        console.error('❌ Error cargando datos:', error);
        if (typeof agregarNotificacion === 'function') {
            agregarNotificacion('danger', '❌ Error al cargar datos: ' + error.message, '#');
        }
        return null;
    }
}

function suscribirseATodas() {
    var tablas = ['usuarios', 'roles', 'comerciales', 'tiendas', 'departamentos', 
                  'estados', 'prioridades', 'motivos', 'tiposContratacion', 'requisiciones'];
    tablas.forEach(function(tabla) {
        suscribirseATabla(tabla, function(payload) {
            console.log('🔄 Cambio en ' + tabla + ':', payload);
            cargarDesdeSupabase(tabla).then(function(data) {
                var dataLocal = JSON.parse(localStorage.getItem('siman_config_data') || '{}');
                if (tabla === 'usuarios') {
                    dataLocal.usuarios = data;
                } else if (tabla === 'requisiciones') {
                    localStorage.setItem('requisiciones_data', JSON.stringify(data));
                    if (typeof cargarRequisiciones === 'function') cargarRequisiciones();
                } else {
                    dataLocal[tabla] = data;
                }
                localStorage.setItem('siman_config_data', JSON.stringify(dataLocal));
                if (typeof actualizarContadores === 'function') actualizarContadores();
                if (typeof agregarNotificacion === 'function') {
                    agregarNotificacion('info', '🔄 Actualización automática: ' + tabla, '#');
                }
            });
        });
    });
}

// ==========================================
// EXPORTAR FUNCIONES GLOBALMENTE
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
window.fusionarDatos = fusionarDatos;

console.log('✅ Supabase client cargado correctamente');