// ============================================================
// SIMAN SMARTRECRUIT
// CONFIGURACION.JS - FASE 3
// SUPABASE = FUENTE ÚNICA DE CONFIGURACIÓN
// ============================================================

console.log('⚙️ Configuración Supabase Fase 3 cargando...');


// ============================================================
// ESTADO
// ============================================================

var datosConfiguracion = {

    comerciales: [],
    tiendas: [],
    departamentos: [],
    tiposContratacion: [],
    prioridades: [],
    motivos: [],
    reclutadores: []
};


var datosCargados = false;
var cargandoConfiguracion = false;
var promesaConfiguracion = null;


// ============================================================
// UTILIDADES
// ============================================================

function ordenarPorNombre(array) {

    return (array || [])
        .slice()
        .sort(function (a, b) {

            return String(a.nombre || '')
                .localeCompare(
                    String(b.nombre || ''),
                    'es',
                    {
                        sensitivity: 'base'
                    }
                );
        });
}


function solamenteActivos(array) {

    return (array || [])
        .filter(function (item) {

            return item.activo !== false;
        });
}


// ============================================================
// CARGAR CENTROS COMERCIALES
// ============================================================

async function cargarCentrosComerciales() {

    var client =
        await initSupabase();


    var resultado =
        await client
            .from('centros_comerciales')
            .select('*')
            .eq('activo', true)
            .order('nombre');


    if (resultado.error) {

        throw resultado.error;
    }


    return resultado.data || [];
}


// ============================================================
// CARGAR TIENDAS
// ============================================================

async function cargarTiendas() {

    var client =
        await initSupabase();


    var resultado =
        await client
            .from('tiendas')
            .select(`
                id,
                nombre,
                centro_comercial_id,
                activo,
                centros_comerciales (
                    id,
                    nombre
                )
            `)
            .eq('activo', true)
            .order('nombre');


    if (resultado.error) {

        throw resultado.error;
    }


    return (resultado.data || [])
        .map(function (tienda) {

            return {

                id:
                    tienda.id,

                nombre:
                    tienda.nombre,

                activo:
                    tienda.activo,

                centro_comercial_id:
                    tienda.centro_comercial_id,

                comercial:
                    tienda.centros_comerciales
                        ? tienda.centros_comerciales.nombre
                        : null,

                centro:
                    tienda.centros_comerciales
                        ? tienda.centros_comerciales.nombre
                        : null
            };
        });
}


// ============================================================
// CARGAR DEPARTAMENTOS
// ============================================================

async function cargarDepartamentos() {

    var client =
        await initSupabase();


    var resultado =
        await client
            .from('departamentos')
            .select('*')
            .eq('activo', true)
            .order('nombre');


    if (resultado.error) {

        throw resultado.error;
    }


    return resultado.data || [];
}


// ============================================================
// TIPOS DE CONTRATACIÓN
// ============================================================

async function cargarTiposContratacion() {

    var client =
        await initSupabase();


    var resultado =
        await client
            .from('tipos_contratacion')
            .select('*')
            .eq('activo', true)
            .order('nombre');


    if (resultado.error) {

        throw resultado.error;
    }


    return resultado.data || [];
}


// ============================================================
// PRIORIDADES
// ============================================================

async function cargarPrioridades() {

    var client =
        await initSupabase();


    var resultado =
        await client
            .from('prioridades')
            .select('*')
            .eq('activo', true)
            .order('nombre');


    if (resultado.error) {

        throw resultado.error;
    }


    return resultado.data || [];
}


// ============================================================
// MOTIVOS
// ============================================================

async function cargarMotivos() {

    var client =
        await initSupabase();


    var resultado =
        await client
            .from('motivos_requisicion')
            .select('*')
            .eq('activo', true)
            .order('nombre');


    if (resultado.error) {

        throw resultado.error;
    }


    return resultado.data || [];
}


// ============================================================
// RECLUTADORES
// ============================================================

async function cargarReclutadores() {

    var client =
        await initSupabase();


    var resultado =
        await client
            .from('profiles')
            .select(`
                id,
                email,
                nombre,
                role_code,
                activo
            `)
            .eq('activo', true)
            .in(
                'role_code',
                [
                    'reclutadora',
                    'admin'
                ]
            )
            .order('nombre');


    if (resultado.error) {

        throw resultado.error;
    }


    return (resultado.data || [])
        .map(function (profile) {

            return {

                id:
                    profile.id,

                uuid:
                    profile.id,

                nombre:
                    profile.nombre,

                name:
                    profile.nombre,

                email:
                    profile.email,

                role_code:
                    profile.role_code,

                activo:
                    profile.activo
            };
        });
}


// ============================================================
// CARGAR TODA LA CONFIGURACIÓN
// ============================================================

async function cargarConfiguracionSupabase(
    forzar
) {

    if (
        datosCargados &&
        !forzar
    ) {

        return datosConfiguracion;
    }


    if (
        promesaConfiguracion &&
        !forzar
    ) {

        return promesaConfiguracion;
    }


    cargandoConfiguracion = true;


    promesaConfiguracion =
        (async function () {

            try {

                console.log(
                    '🔄 Cargando configuración desde Supabase...'
                );


                var resultados =
                    await Promise.all([

                        cargarCentrosComerciales(),

                        cargarTiendas(),

                        cargarDepartamentos(),

                        cargarTiposContratacion(),

                        cargarPrioridades(),

                        cargarMotivos(),

                        cargarReclutadores()
                    ]);


                datosConfiguracion.comerciales =
                    ordenarPorNombre(
                        resultados[0]
                    );


                datosConfiguracion.tiendas =
                    ordenarPorNombre(
                        resultados[1]
                    );


                datosConfiguracion.departamentos =
                    ordenarPorNombre(
                        resultados[2]
                    );


                datosConfiguracion.tiposContratacion =
                    ordenarPorNombre(
                        resultados[3]
                    );


                datosConfiguracion.prioridades =
                    ordenarPorNombre(
                        resultados[4]
                    );


                datosConfiguracion.motivos =
                    ordenarPorNombre(
                        resultados[5]
                    );


                datosConfiguracion.reclutadores =
                    ordenarPorNombre(
                        resultados[6]
                    );


                datosCargados = true;


                console.log(
                    '✅ Configuración cargada desde Supabase'
                );


                console.log(
                    '🏢 Centros:',
                    datosConfiguracion
                        .comerciales
                        .length
                );


                console.log(
                    '🛒 Tiendas:',
                    datosConfiguracion
                        .tiendas
                        .length
                );


                console.log(
                    '🏛️ Departamentos:',
                    datosConfiguracion
                        .departamentos
                        .length
                );


                console.log(
                    '👩‍💼 Reclutadores:',
                    datosConfiguracion
                        .reclutadores
                        .length
                );


                // --------------------------------------------
                // EVENTO PARA NUEVA REQUISICIÓN
                // --------------------------------------------

                window.dispatchEvent(
                    new CustomEvent(
                        'datosConfiguracionListos',
                        {
                            detail:
                                datosConfiguracion
                        }
                    )
                );


                return datosConfiguracion;


            } catch (error) {

                datosCargados = false;


                console.error(
                    '❌ Error cargando configuración:',
                    error
                );


                throw error;


            } finally {

                cargandoConfiguracion =
                    false;

                promesaConfiguracion =
                    null;
            }
        })();


    return promesaConfiguracion;
}


// ============================================================
// COMPATIBILIDAD CON NUEVA-REQUISICION.JS
// ============================================================

function obtenerDatosConfig() {

    return datosConfiguracion;
}


function obtenerComerciales() {

    return solamenteActivos(
        datosConfiguracion.comerciales
    );
}


function obtenerTiendas() {

    return solamenteActivos(
        datosConfiguracion.tiendas
    );
}


function obtenerDepartamentos() {

    return solamenteActivos(
        datosConfiguracion.departamentos
    );
}


function obtenerTiposContratacion() {

    return solamenteActivos(
        datosConfiguracion.tiposContratacion
    );
}


function obtenerPrioridades() {

    return solamenteActivos(
        datosConfiguracion.prioridades
    );
}


function obtenerMotivos() {

    return solamenteActivos(
        datosConfiguracion.motivos
    );
}


function obtenerReclutadores() {

    return solamenteActivos(
        datosConfiguracion.reclutadores
    );
}


// ============================================================
// TIENDAS POR CENTRO COMERCIAL
// ============================================================

function obtenerTiendasPorComercial(
    comercial
) {

    if (!comercial) {

        return obtenerTiendas();
    }


    var nombreComercial = null;
    var idComercial = null;


    if (
        typeof comercial ===
        'object'
    ) {

        nombreComercial =
            comercial.nombre ||
            comercial.comercial ||
            comercial.centro ||
            null;


        idComercial =
            comercial.id ||
            comercial.centro_comercial_id ||
            null;

    } else {

        nombreComercial =
            String(comercial);
    }


    return obtenerTiendas()
        .filter(function (tienda) {

            if (
                idComercial &&
                String(
                    tienda.centro_comercial_id
                ) ===
                String(
                    idComercial
                )
            ) {

                return true;
            }


            return (
                String(
                    tienda.comercial ||
                    tienda.centro ||
                    ''
                )
                    .trim()
                    .toLowerCase()
                ===
                String(
                    nombreComercial ||
                    ''
                )
                    .trim()
                    .toLowerCase()
            );
        });
}


// ============================================================
// REFRESCAR CONFIGURACIÓN
// ============================================================

async function refrescarConfiguracion() {

    return await cargarConfiguracionSupabase(
        true
    );
}


// ============================================================
// REALTIME
// ============================================================

var realtimeConfiguracionIniciado =
    false;


async function iniciarRealtimeConfiguracion() {

    if (
        realtimeConfiguracionIniciado
    ) {

        return;
    }


    if (
        typeof suscribirseATabla !==
        'function'
    ) {

        console.warn(
            '⚠️ Realtime no disponible'
        );

        return;
    }


    realtimeConfiguracionIniciado =
        true;


    var tablas = [

        'centros_comerciales',

        'tiendas',

        'departamentos',

        'tipos_contratacion',

        'prioridades',

        'motivos_requisicion',

        'profiles'
    ];


    for (
        var i = 0;
        i < tablas.length;
        i++
    ) {

        await suscribirseATabla(
            tablas[i],
            function () {

                console.log(
                    '🔄 Cambio detectado en configuración'
                );


                refrescarConfiguracion()
                    .catch(
                        function (error) {

                            console.error(
                                '❌ Error refrescando configuración:',
                                error
                            );
                        }
                    );
            }
        );
    }


    console.log(
        '📡 Realtime de configuración activo'
    );
}


// ============================================================
// CRUD GENÉRICO PARA CONFIGURACIÓN
// ============================================================

async function crearCatalogo(
    tabla,
    datos
) {

    var resultado =
        await insertarEnSupabase(
            tabla,
            datos
        );


    if (
        resultado.success
    ) {

        await refrescarConfiguracion();
    }


    return resultado;
}


async function actualizarCatalogo(
    tabla,
    id,
    datos
) {

    var resultado =
        await actualizarEnSupabase(
            tabla,
            id,
            datos
        );


    if (
        resultado.success
    ) {

        await refrescarConfiguracion();
    }


    return resultado;
}


async function eliminarCatalogo(
    tabla,
    id
) {

    /*
     * Para catálogos es mejor desactivar
     * que borrar físicamente.
     */

    return await actualizarCatalogo(
        tabla,
        id,
        {
            activo: false,
            updated_at:
                new Date()
                    .toISOString()
        }
    );
}


// ============================================================
// EXPORTAR GLOBALMENTE
// ============================================================

window.datosConfiguracion =
    datosConfiguracion;


window.obtenerDatosConfig =
    obtenerDatosConfig;


window.obtenerComerciales =
    obtenerComerciales;


window.obtenerTiendas =
    obtenerTiendas;


window.obtenerDepartamentos =
    obtenerDepartamentos;


window.obtenerTiposContratacion =
    obtenerTiposContratacion;


window.obtenerPrioridades =
    obtenerPrioridades;


window.obtenerMotivos =
    obtenerMotivos;


window.obtenerReclutadores =
    obtenerReclutadores;


window.obtenerTiendasPorComercial =
    obtenerTiendasPorComercial;


window.cargarConfiguracionSupabase =
    cargarConfiguracionSupabase;


window.refrescarConfiguracion =
    refrescarConfiguracion;


window.iniciarRealtimeConfiguracion =
    iniciarRealtimeConfiguracion;


window.crearCatalogo =
    crearCatalogo;


window.actualizarCatalogo =
    actualizarCatalogo;


window.eliminarCatalogo =
    eliminarCatalogo;


// ============================================================
// INICIALIZACIÓN
// ============================================================

document.addEventListener(
    'DOMContentLoaded',
    async function () {

        try {

            // Esperar sesión
            if (
                typeof requireAuth ===
                'function'
            ) {

                var usuario =
                    await requireAuth();


                if (!usuario) {

                    return;
                }
            }


            await cargarConfiguracionSupabase();


            await iniciarRealtimeConfiguracion();


            console.log(
                '✅ Configuración Fase 3 inicializada'
            );


        } catch (error) {

            console.error(
                '❌ No se pudo inicializar configuración:',
                error
            );
        }
    }
);


console.log(
    '✅ configuracion.js Fase 3 cargado'
);
