// ============================================================
// SIMAN SMARTRECRUIT
// SUPABASE CLIENT - FASE 3
// SUPABASE = ÚNICA FUENTE DE VERDAD
// ============================================================

var SUPABASE_URL =
    'https://kmqantnfueparuwycgdz.supabase.co';

var SUPABASE_KEY =
    'sb_publishable_FOF12VLnddzD-V52S2h--g_EqZEvQ_s';

var supabaseClient = null;
var supabaseInitPromise = null;

var realtimeChannels = {};


// ============================================================
// INICIALIZAR SUPABASE
// ============================================================

async function initSupabase() {

    if (supabaseClient) {
        return supabaseClient;
    }

    if (supabaseInitPromise) {
        return supabaseInitPromise;
    }

    supabaseInitPromise =
        new Promise(function (resolve, reject) {

            function crearCliente() {

                try {

                    if (
                        !window.supabase ||
                        typeof window.supabase.createClient !== 'function'
                    ) {
                        throw new Error(
                            'La librería Supabase JS no está disponible.'
                        );
                    }

                    supabaseClient =
                        window.supabase.createClient(
                            SUPABASE_URL,
                            SUPABASE_KEY,
                            {
                                auth: {
                                    persistSession: true,
                                    autoRefreshToken: true,
                                    detectSessionInUrl: true
                                }
                            }
                        );

                    console.log(
                        '✅ Supabase inicializado correctamente'
                    );

                    resolve(supabaseClient);

                } catch (error) {

                    supabaseInitPromise = null;

                    console.error(
                        '❌ Error inicializando Supabase:',
                        error
                    );

                    reject(error);
                }
            }


            // La librería ya fue cargada por HTML
            if (
                window.supabase &&
                typeof window.supabase.createClient === 'function'
            ) {

                crearCliente();
                return;
            }


            // Evitar cargar varias veces el CDN
            var scriptExistente =
                document.querySelector(
                    'script[data-siman-supabase="true"]'
                );


            if (scriptExistente) {

                scriptExistente.addEventListener(
                    'load',
                    crearCliente,
                    { once: true }
                );

                scriptExistente.addEventListener(
                    'error',
                    function () {

                        supabaseInitPromise = null;

                        reject(
                            new Error(
                                'No se pudo cargar Supabase JS.'
                            )
                        );
                    },
                    { once: true }
                );

                return;
            }


            var script =
                document.createElement('script');

            script.src =
                'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';

            script.async = true;

            script.dataset.simanSupabase =
                'true';

            script.onload =
                crearCliente;

            script.onerror =
                function () {

                    supabaseInitPromise = null;

                    reject(
                        new Error(
                            'No se pudo cargar Supabase JS.'
                        )
                    );
                };

            document.head.appendChild(
                script
            );
        });


    return supabaseInitPromise;
}


// ============================================================
// OBTENER CLIENTE
// ============================================================

async function getSupabaseClient() {

    return await initSupabase();
}


// ============================================================
// INSERTAR
// ============================================================

async function insertarEnSupabase(
    tabla,
    datos
) {

    try {

        var client =
            await initSupabase();

        var resultado =
            await client
                .from(tabla)
                .insert(datos)
                .select();


        if (resultado.error) {
            throw resultado.error;
        }


        return {
            success: true,
            data: resultado.data || []
        };


    } catch (error) {

        console.error(
            '❌ Error insertando en ' +
            tabla + ':',
            error
        );

        return {
            success: false,
            error:
                error.message ||
                String(error),
            data: []
        };
    }
}


// ============================================================
// ACTUALIZAR
// ============================================================

async function actualizarEnSupabase(
    tabla,
    id,
    cambios
) {

    try {

        var client =
            await initSupabase();


        var resultado =
            await client
                .from(tabla)
                .update(cambios)
                .eq('id', id)
                .select();


        if (resultado.error) {
            throw resultado.error;
        }


        return {
            success: true,
            data: resultado.data || []
        };


    } catch (error) {

        console.error(
            '❌ Error actualizando ' +
            tabla + ':',
            error
        );


        return {
            success: false,
            error:
                error.message ||
                String(error),
            data: []
        };
    }
}


// ============================================================
// UPSERT
// ============================================================

async function guardarEnSupabase(
    tabla,
    datos,
    conflicto
) {

    try {

        var client =
            await initSupabase();


        var query =
            client
                .from(tabla)
                .upsert(
                    datos,
                    conflicto
                        ? {
                            onConflict:
                                conflicto
                        }
                        : undefined
                )
                .select();


        var resultado =
            await query;


        if (resultado.error) {
            throw resultado.error;
        }


        return {
            success: true,
            data: resultado.data || []
        };


    } catch (error) {

        console.error(
            '❌ Error guardando en ' +
            tabla + ':',
            error
        );


        return {
            success: false,
            error:
                error.message ||
                String(error),
            data: []
        };
    }
}


// ============================================================
// OBTENER DATOS
// ============================================================

async function obtenerDeSupabase(
    tabla,
    filtros,
    orden
) {

    try {

        var client =
            await initSupabase();


        var query =
            client
                .from(tabla)
                .select('*');


        if (filtros) {

            Object.keys(filtros)
                .forEach(function (campo) {

                    var valor =
                        filtros[campo];


                    if (
                        valor !== undefined &&
                        valor !== null &&
                        valor !== ''
                    ) {

                        query =
                            query.eq(
                                campo,
                                valor
                            );
                    }
                });
        }


        if (
            orden &&
            orden.campo
        ) {

            query =
                query.order(
                    orden.campo,
                    {
                        ascending:
                            orden.ascendente !==
                            false
                    }
                );
        }


        var resultado =
            await query;


        if (resultado.error) {
            throw resultado.error;
        }


        return {
            success: true,
            data: resultado.data || []
        };


    } catch (error) {

        console.error(
            '❌ Error obteniendo ' +
            tabla + ':',
            error
        );


        return {
            success: false,
            error:
                error.message ||
                String(error),
            data: []
        };
    }
}


// ============================================================
// OBTENER POR ID
// ============================================================

async function obtenerPorId(
    tabla,
    id
) {

    try {

        var client =
            await initSupabase();


        var resultado =
            await client
                .from(tabla)
                .select('*')
                .eq('id', id)
                .maybeSingle();


        if (resultado.error) {
            throw resultado.error;
        }


        return {
            success: true,
            data:
                resultado.data ||
                null
        };


    } catch (error) {

        console.error(
            '❌ Error obteniendo registro:',
            error
        );


        return {
            success: false,
            error:
                error.message ||
                String(error),
            data: null
        };
    }
}


// ============================================================
// ELIMINAR
// ============================================================

async function eliminarDeSupabase(
    tabla,
    id
) {

    try {

        var client =
            await initSupabase();


        var resultado =
            await client
                .from(tabla)
                .delete()
                .eq('id', id)
                .select();


        if (resultado.error) {
            throw resultado.error;
        }


        return {
            success: true,
            data: resultado.data || []
        };


    } catch (error) {

        console.error(
            '❌ Error eliminando de ' +
            tabla + ':',
            error
        );


        return {
            success: false,
            error:
                error.message ||
                String(error),
            data: []
        };
    }
}


// ============================================================
// CARGAR TABLA
// ============================================================

async function cargarDesdeSupabase(
    tabla,
    filtros,
    orden
) {

    var resultado =
        await obtenerDeSupabase(
            tabla,
            filtros,
            orden
        );


    if (!resultado.success) {

        throw new Error(
            resultado.error ||
            'No se pudo cargar ' +
            tabla
        );
    }


    return resultado.data;
}


// ============================================================
// REALTIME
// ============================================================

async function suscribirseATabla(
    tabla,
    callback
) {

    try {

        var client =
            await initSupabase();


        // Evitar múltiples canales de la misma tabla
        if (realtimeChannels[tabla]) {

            console.log(
                'ℹ️ Realtime ya activo:',
                tabla
            );

            return realtimeChannels[
                tabla
            ];
        }


        var nombreCanal =
            'siman_' +
            tabla +
            '_' +
            Date.now();


        var canal =
            client
                .channel(nombreCanal)
                .on(
                    'postgres_changes',
                    {
                        event: '*',
                        schema: 'public',
                        table: tabla
                    },
                    function (payload) {

                        console.log(
                            '🔄 Realtime:',
                            tabla,
                            payload.eventType
                        );


                        if (
                            typeof callback ===
                            'function'
                        ) {

                            callback(
                                payload
                            );
                        }
                    }
                )
                .subscribe(
                    function (estado) {

                        if (
                            estado ===
                            'SUBSCRIBED'
                        ) {

                            console.log(
                                '📡 Realtime activo:',
                                tabla
                            );
                        }
                    }
                );


        realtimeChannels[tabla] =
            canal;


        return canal;


    } catch (error) {

        console.error(
            '❌ Error activando Realtime:',
            tabla,
            error
        );

        return null;
    }
}


// ============================================================
// CANCELAR REALTIME
// ============================================================

async function cancelarSuscripcion(
    tabla
) {

    try {

        if (!realtimeChannels[tabla]) {
            return;
        }


        var client =
            await initSupabase();


        await client.removeChannel(
            realtimeChannels[tabla]
        );


        delete realtimeChannels[
            tabla
        ];


        console.log(
            '📴 Realtime detenido:',
            tabla
        );


    } catch (error) {

        console.error(
            '❌ Error cerrando Realtime:',
            error
        );
    }
}


// ============================================================
// SUSCRIBIR VARIAS TABLAS
// ============================================================

async function suscribirseATodas(
    tablas,
    callback
) {

    tablas =
        Array.isArray(tablas)
            ? tablas
            : [
                'requisiciones',
                'candidatos'
            ];


    for (
        var i = 0;
        i < tablas.length;
        i++
    ) {

        await suscribirseATabla(
            tablas[i],
            callback
        );
    }
}


// ============================================================
// ESTADO DE CONEXIÓN
// ============================================================

function estaOnline() {

    return navigator.onLine;
}


// ============================================================
// COMPATIBILIDAD TEMPORAL
// ============================================================

async function sincronizarConSupabase() {

    console.log(
        'ℹ️ Supabase es ahora la fuente principal.'
    );


    return {
        success: true
    };
}


// ============================================================
// EXPORTAR
// ============================================================

window.initSupabase =
    initSupabase;

window.getSupabaseClient =
    getSupabaseClient;

window.insertarEnSupabase =
    insertarEnSupabase;

window.actualizarEnSupabase =
    actualizarEnSupabase;

window.guardarEnSupabase =
    guardarEnSupabase;

window.obtenerDeSupabase =
    obtenerDeSupabase;

window.obtenerPorId =
    obtenerPorId;

window.eliminarDeSupabase =
    eliminarDeSupabase;

window.cargarDesdeSupabase =
    cargarDesdeSupabase;

window.suscribirseATabla =
    suscribirseATabla;

window.cancelarSuscripcion =
    cancelarSuscripcion;

window.suscribirseATodas =
    suscribirseATodas;

window.sincronizarConSupabase =
    sincronizarConSupabase;

window.estaOnline =
    estaOnline;


console.log(
    '✅ Supabase Client Fase 3 cargado'
);
