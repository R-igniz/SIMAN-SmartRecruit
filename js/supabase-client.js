// ==========================================
// SUPABASE CLIENT - CONFIGURACIÓN
// ==========================================

var SUPABASE_URL = 'https://kmqantnfueparuwycgdz.supabase.co';
var SUPABASE_KEY = 'sb_publishable_FOF12VLnddzD-V52S2h--g_EqZEvQ_s';

var supabaseInitialized = false;
var supabaseClient = null;

// ==========================================
// INICIALIZAR SUPABASE
// ==========================================
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
    console.log('🔄 Iniciando sincronización con Supabase...');
    
    try {
        if (!navigator.onLine) {
            if (typeof agregarNotificacion === 'function') {
                agregarNotificacion('danger', '❌ Sin conexión a Internet. No se puede sincronizar.', '#');
            }
            return { error: 'Sin conexión a Internet' };
        }
        
        // ✅ Asegurar que Supabase esté inicializado
        await initSupabase();
        
        var data = JSON.parse(localStorage.getItem('siman_config_data') || '{}');
        var requisiciones = JSON.parse(localStorage.getItem('requisiciones_data') || '[]');
        
        var resultados = {
            usuarios: 0,
            roles: 0,
            comerciales: 0,
            tiendas: 0,
            departamentos: 0,
            estados: 0,
            prioridades: 0,
            motivos: 0,
            tiposContratacion: 0,
            requisiciones: 0,
            errores: 0
        };
        
        // Función auxiliar
        async function guardarConteo(tabla, items, contador) {
            if (!items || items.length === 0) return;
            for (var i = 0; i < items.length; i++) {
                var result = await guardarEnSupabase(tabla, items[i]);
                if (result.success) {
                    resultados[contador]++;
                } else {
                    resultados.errores++;
                    console.warn('Error guardando en', tabla, ':', result.error);
                }
            }
        }
        
        // Guardar cada tabla
        await guardarConteo('usuarios', data.usuarios, 'usuarios');
        await guardarConteo('roles', data.roles, 'roles');
        await guardarConteo('comerciales', data.comerciales, 'comerciales');
        await guardarConteo('tiendas', data.tiendas, 'tiendas');
        await guardarConteo('departamentos', data.departamentos, 'departamentos');
        await guardarConteo('estados', data.estados, 'estados');
        await guardarConteo('prioridades', data.prioridades, 'prioridades');
        await guardarConteo('motivos', data.motivos, 'motivos');
        await guardarConteo('tiposContratacion', data.tiposContratacion, 'tiposContratacion');
        await guardarConteo('requisiciones', requisiciones, 'requisiciones');
        
        console.log('✅ Sincronización completada:', resultados);
        
        var mensaje = '✅ Datos sincronizados: ' +
            resultados.usuarios + ' usuarios, ' +
            resultados.roles + ' roles, ' +
            resultados.comerciales + ' comerciales, ' +
            resultados.tiendas + ' tiendas, ' +
            resultados.departamentos + ' departamentos, ' +
            resultados.estados + ' estados, ' +
            resultados.prioridades + ' prioridades, ' +
            resultados.motivos + ' motivos, ' +
            resultados.tiposContratacion + ' tipos de contratación, ' +
            resultados.requisiciones + ' requisiciones';
        
        if (resultados.errores > 0) {
            mensaje += ' ⚠️ ' + resultados.errores + ' errores (ver consola)';
        }
        
        if (typeof agregarNotificacion === 'function') {
            agregarNotificacion(resultados.errores > 0 ? 'warning' : 'success', mensaje, '#');
        }
        
        return resultados;
    } catch (error) {
        console.error('❌ Error en sincronización:', error);
        if (typeof agregarNotificacion === 'function') {
            agregarNotificacion('danger', '❌ Error al sincronizar: ' + error.message, '#');
        }
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

function fusionarDatos(datosLocales, datosRemotos, claveUnica) {
    var mapaLocal = {};
    datosLocales.forEach(function(item) {
        mapaLocal[item[claveUnica]] = item;
    });
    
    datosRemotos.forEach(function(item) {
        var key = item[claveUnica];
        if (mapaLocal[key]) {
            mapaLocal[key] = item;
        } else {
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
        
        // Fusionar cada tipo
        dataLocal.usuarios = fusionarDatos(dataLocal.usuarios || [], usuariosRemotos, 'email');
        dataLocal.roles = fusionarDatos(dataLocal.roles || [], rolesRemotos, 'id');
        dataLocal.comerciales = fusionarDatos(dataLocal.comerciales || [], comercialesRemotos, 'id');
        dataLocal.tiendas = fusionarDatos(dataLocal.tiendas || [], tiendasRemotos, 'id');
        dataLocal.departamentos = fusionarDatos(dataLocal.departamentos || [], departamentosRemotos, 'id');
        dataLocal.estados = fusionarDatos(dataLocal.estados || [], estadosRemotos, 'id');
        dataLocal.prioridades = fusionarDatos(dataLocal.prioridades || [], prioridadesRemotos, 'id');
        dataLocal.motivos = fusionarDatos(dataLocal.motivos || [], motivosRemotos, 'id');
        dataLocal.tiposContratacion = fusionarDatos(dataLocal.tiposContratacion || [], tiposContratacionRemotos, 'id');
        
        localStorage.setItem('siman_config_data', JSON.stringify(dataLocal));
        localStorage.setItem('requisiciones_data', JSON.stringify(requisicionesRemotos));
        
        console.log('✅ Datos cargados y fusionados desde Supabase');
        console.log('👥 Usuarios totales:', dataLocal.usuarios.length);
        
        if (typeof actualizarContadores === 'function') {
            actualizarContadores();
        }
        
        if (typeof cargarUsuarios === 'function') {
            cargarUsuarios();
        }
        
        if (typeof cargarRequisiciones === 'function') {
            cargarRequisiciones();
        }
        
        if (typeof refreshAuthUsers === 'function') {
            refreshAuthUsers();
        }
        
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
            // Recargar datos afectados
            cargarDesdeSupabase(tabla).then(function(data) {
                var dataLocal = JSON.parse(localStorage.getItem('siman_config_data') || '{}');
                if (tabla === 'usuarios') {
                    dataLocal.usuarios = fusionarDatos(dataLocal.usuarios || [], data, 'email');
                } else if (tabla === 'requisiciones') {
                    localStorage.setItem('requisiciones_data', JSON.stringify(data));
                    if (typeof cargarRequisiciones === 'function') cargarRequisiciones();
                } else {
                    dataLocal[tabla] = fusionarDatos(dataLocal[tabla] || [], data, 'id');
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