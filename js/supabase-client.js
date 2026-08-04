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

// ✅ FUNCIÓN DE ELIMINAR (BIEN DEFINIDA)
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
// SINCRONIZAR DATOS LOCALES CON SUPABASE (SOLO SUBIR)
// ==========================================
async function sincronizarConSupabase() {
    console.log('🔄 Iniciando sincronización con Supabase (subiendo y eliminando)...');
    
    try {
        if (!navigator.onLine) {
            if (typeof agregarNotificacion === 'function') {
                agregarNotificacion('danger', '❌ Sin conexión a Internet. No se puede sincronizar.', '#');
            }
            return { error: 'Sin conexión a Internet' };
        }
        
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
            eliminados: 0,
            errores: 0
        };
        
        // 1. Obtener todos los IDs actuales en Supabase para cada tabla
        // 2. Eliminar los que no estén en local
        async function sincronizarTabla(tabla, itemsLocales, idKey) {
            // Obtener todos los registros de Supabase
            var resultadoRemoto = await obtenerDeSupabase(tabla);
            if (!resultadoRemoto.success) {
                console.warn('⚠️ No se pudo obtener', tabla, 'de Supabase:', resultadoRemoto.error);
                return;
            }
            var remotos = resultadoRemoto.data || [];
            
            // IDs locales
            var idsLocales = itemsLocales.map(function(item) { return item[idKey]; });
            
            // Eliminar los que no están en local
            for (var i = 0; i < remotos.length; i++) {
                var remoto = remotos[i];
                if (idsLocales.indexOf(remoto[idKey]) === -1) {
                    var delResult = await eliminarDeSupabase(tabla, remoto[idKey]);
                    if (delResult.success) {
                        resultados.eliminados++;
                        console.log('🗑️ Eliminado de Supabase:', tabla, remoto[idKey]);
                    } else {
                        resultados.errores++;
                        console.warn('Error eliminando de Supabase:', tabla, remoto[idKey], delResult.error);
                    }
                }
            }
            
            // Subir los locales (ya sea nuevos o actualizados)
            for (var j = 0; j < itemsLocales.length; j++) {
                var item = itemsLocales[j];
                var result = await guardarEnSupabase(tabla, item);
                if (result.success) {
                    resultados[tabla] = (resultados[tabla] || 0) + 1;
                } else {
                    resultados.errores++;
                    console.warn('Error guardando en', tabla, ':', result.error);
                }
            }
        }
        
        // Sincronizar cada tabla
        await sincronizarTabla('usuarios', data.usuarios || [], 'id');
        await sincronizarTabla('roles', data.roles || [], 'id');
        await sincronizarTabla('comerciales', data.comerciales || [], 'id');
        await sincronizarTabla('tiendas', data.tiendas || [], 'id');
        await sincronizarTabla('departamentos', data.departamentos || [], 'id');
        await sincronizarTabla('estados', data.estados || [], 'id');
        await sincronizarTabla('prioridades', data.prioridades || [], 'id');
        await sincronizarTabla('motivos', data.motivos || [], 'id');
        await sincronizarTabla('tiposContratacion', data.tiposContratacion || [], 'id');
        await sincronizarTabla('requisiciones', requisiciones || [], 'id');
        
        console.log('✅ Sincronización completada:', resultados);
        
        var mensaje = '✅ Sincronización completada: ' +
            resultados.usuarios + ' usuarios subidos, ' +
            resultados.roles + ' roles subidos, ' +
            resultados.comerciales + ' comerciales subidos, ' +
            resultados.tiendas + ' tiendas subidas, ' +
            resultados.departamentos + ' departamentos subidos, ' +
            resultados.estados + ' estados subidos, ' +
            resultados.prioridades + ' prioridades subidas, ' +
            resultados.motivos + ' motivos subidos, ' +
            resultados.tiposContratacion + ' tipos contratación subidos, ' +
            resultados.requisiciones + ' requisiciones subidas, ' +
            resultados.eliminados + ' eliminados en Supabase';
        
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
// CARGAR DATOS DESDE SUPABASE (FUSIONAR CON LOCALES)
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
        // Si existe en local, actualizar solo si el remoto es más reciente (aquí se decide priorizar remoto)
        // Para evitar que vuelvan eliminados, solo fusionamos si NO existe en local.
        // Así los eliminados locales no son reemplazados.
        if (!mapaLocal[key]) {
            mapaLocal[key] = item;
        }
    });
    
    return Object.values(mapaLocal);
}

async function initSupabaseData() {
    console.log('🔄 Cargando datos desde Supabase y fusionando con locales (sin sobrescribir eliminados)...');
    
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
        
        // Fusionar sin sobrescribir eliminados locales (previene que vuelvan usuarios borrados)
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
        
        console.log('✅ Datos fusionados desde Supabase (respetando eliminaciones locales)');
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
            // Si el cambio es un DELETE, no lo traemos de vuelta si no existe localmente
            if (payload.eventType === 'DELETE') {
                // Eliminar localmente si existe
                var dataLocal = JSON.parse(localStorage.getItem('siman_config_data') || '{}');
                if (tabla === 'usuarios') {
                    dataLocal.usuarios = dataLocal.usuarios.filter(function(u) { return u.id !== payload.old.id; });
                } else if (tabla === 'requisiciones') {
                    var reqs = JSON.parse(localStorage.getItem('requisiciones_data') || '[]');
                    reqs = reqs.filter(function(r) { return r.id !== payload.old.id; });
                    localStorage.setItem('requisiciones_data', JSON.stringify(reqs));
                } else {
                    dataLocal[tabla] = dataLocal[tabla].filter(function(item) { return item.id !== payload.old.id; });
                }
                localStorage.setItem('siman_config_data', JSON.stringify(dataLocal));
                if (typeof actualizarContadores === 'function') actualizarContadores();
                if (typeof cargarUsuarios === 'function') cargarUsuarios();
                if (typeof cargarRequisiciones === 'function') cargarRequisiciones();
                return;
            }
            // Para INSERT/UPDATE, fusionar normalmente
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
window.fusionarDatos = fusionarDatos;

console.log('✅ Supabase client cargado correctamente (con eliminación y fusión mejorada)');