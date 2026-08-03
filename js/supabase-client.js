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
// SINCRONIZAR DATOS LOCALES CON SUPABASE (ENVIAR)
// ==========================================

async function sincronizarConSupabase() {
    console.log('🔄 Iniciando sincronización con Supabase...');
    
    try {
        // Verificar conexión a Internet
        if (!navigator.onLine) {
            if (typeof agregarNotificacion === 'function') {
                agregarNotificacion('danger', '❌ Sin conexión a Internet. No se puede sincronizar.', '#');
            }
            return { error: 'Sin conexión a Internet' };
        }
        
        // Inicializar Supabase
        await initSupabase();
        
        var data = JSON.parse(localStorage.getItem('siman_config_data') || '{}');
        var requisiciones = JSON.parse(localStorage.getItem('requisiciones_data') || '[]');
        
        var resultados = {
            usuarios: 0,
            roles: 0,
            comerciales: 0,
            requisiciones: 0,
            errores: 0
        };
        
        // Sincronizar usuarios
        if (data.usuarios && data.usuarios.length > 0) {
            for (var i = 0; i < data.usuarios.length; i++) {
                var result = await guardarEnSupabase('usuarios', data.usuarios[i]);
                if (result.success) {
                    resultados.usuarios++;
                } else {
                    resultados.errores++;
                    console.warn('Error guardando usuario:', data.usuarios[i].nombre, result.error);
                }
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
        if (requisiciones.length > 0) {
            for (var i = 0; i < requisiciones.length; i++) {
                var result = await guardarEnSupabase('requisiciones', requisiciones[i]);
                if (result.success) resultados.requisiciones++;
            }
        }
        
        console.log('✅ Sincronización completada:', resultados);
        
        var mensaje = '✅ Datos sincronizados: ' + 
            resultados.usuarios + ' usuarios, ' + 
            resultados.roles + ' roles, ' + 
            resultados.comerciales + ' comerciales, ' +
            resultados.requisiciones + ' requisiciones';
        
        if (resultados.errores > 0) {
            mensaje += ' ⚠️ ' + resultados.errores + ' errores';
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
// CARGAR DATOS DESDE SUPABASE (RECIBIR) - FUSIONAR
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

// ==========================================
// INICIALIZAR DATOS DESDE SUPABASE (FUSIONANDO)
// ==========================================

async function initSupabaseData(forceLoad) {
    console.log('🔄 Cargando datos desde Supabase...');
    
    try {
        // Verificar conexión
        if (!navigator.onLine) {
            if (typeof agregarNotificacion === 'function') {
                agregarNotificacion('warning', '⚠️ Sin conexión a Internet. Usando datos locales.', '#');
            }
            return null;
        }
        
        await initSupabase();
        
        var [usuariosRemotos, rolesRemotos, comercialesRemotos, requisicionesRemotos] = await Promise.all([
            cargarDesdeSupabase('usuarios'),
            cargarDesdeSupabase('roles'),
            cargarDesdeSupabase('comerciales'),
            cargarDesdeSupabase('requisiciones')
        ]);
        
        var dataLocal = JSON.parse(localStorage.getItem('siman_config_data') || '{}');
        
        // Asegurar admin
        var adminLocal = dataLocal.usuarios ? dataLocal.usuarios.find(function(u) { return u.email === 'admin@siman.com'; }) : null;
        var adminRemoto = usuariosRemotos.find(function(u) { return u.email === 'admin@siman.com'; });
        
        if (!adminRemoto && adminLocal) {
            await guardarEnSupabase('usuarios', adminLocal);
            usuariosRemotos.push(adminLocal);
        }
        
        if (!adminLocal && adminRemoto) {
            if (!dataLocal.usuarios) dataLocal.usuarios = [];
            dataLocal.usuarios.push(adminRemoto);
        }
        
        // Fusionar
        var usuariosFusionados = fusionarDatos(dataLocal.usuarios || [], usuariosRemotos, 'email');
        var rolesFusionados = fusionarDatos(dataLocal.roles || [], rolesRemotos, 'id');
        var comercialesFusionados = fusionarDatos(dataLocal.comerciales || [], comercialesRemotos, 'id');
        
        var dataFinal = {
            usuarios: usuariosFusionados,
            roles: rolesFusionados,
            comerciales: comercialesFusionados,
            tiendas: dataLocal.tiendas || [],
            departamentos: dataLocal.departamentos || [],
            estados: dataLocal.estados || [],
            prioridades: dataLocal.prioridades || [],
            motivos: dataLocal.motivos || [],
            tiposContratacion: dataLocal.tiposContratacion || [],
            asignaciones: dataLocal.asignaciones || [],
            correos: dataLocal.correos || [],
            plantillas: dataLocal.plantillas || [],
            cartasOferta: dataLocal.cartasOferta || []
        };
        
        localStorage.setItem('siman_config_data', JSON.stringify(dataFinal));
        localStorage.setItem('requisiciones_data', JSON.stringify(requisicionesRemotos));
        
        console.log('✅ Datos cargados y fusionados desde Supabase');
        console.log('👥 Usuarios totales:', usuariosFusionados.length);
        
        // Actualizar interfaces
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
                '✅ Datos cargados: ' + usuariosFusionados.length + ' usuarios, ' + 
                rolesFusionados.length + ' roles, ' + 
                comercialesFusionados.length + ' comerciales', 
                '#'
            );
        }
        
        return dataFinal;
    } catch (error) {
        console.error('❌ Error cargando datos:', error);
        if (typeof agregarNotificacion === 'function') {
            agregarNotificacion('danger', '❌ Error al cargar datos: ' + error.message, '#');
        }
        return null;
    }
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
                var dataLocal = JSON.parse(localStorage.getItem('siman_config_data') || '{}');
                
                if (tabla === 'usuarios') {
                    var usuariosLocales = dataLocal.usuarios || [];
                    var usuariosFusionados = fusionarDatos(usuariosLocales, data, 'email');
                    dataLocal.usuarios = usuariosFusionados;
                    localStorage.setItem('siman_config_data', JSON.stringify(dataLocal));
                    if (typeof cargarUsuarios === 'function') cargarUsuarios();
                    if (typeof refreshAuthUsers === 'function') refreshAuthUsers();
                } else if (tabla === 'requisiciones') {
                    localStorage.setItem('requisiciones_data', JSON.stringify(data));
                    if (typeof cargarRequisiciones === 'function') cargarRequisiciones();
                } else {
                    dataLocal[tabla] = data;
                    localStorage.setItem('siman_config_data', JSON.stringify(dataLocal));
                }
                
                if (typeof actualizarContadores === 'function') {
                    actualizarContadores();
                }
                
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

console.log('✅ Supabase client cargado - Funciones disponibles: sincronizarConSupabase, initSupabaseData');