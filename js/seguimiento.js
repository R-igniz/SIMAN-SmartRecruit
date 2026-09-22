// ============================================================
// SIMAN SMARTRECRUIT
// seguimiento.js
// FASE 3
// SUPABASE + AUTH + RLS + REALTIME
// ============================================================

console.log('📋 seguimiento.js Fase 3 cargando...');


// ============================================================
// VARIABLES
// ============================================================

var seguimientoRequisiciones = [];

var seguimientoUsuario = null;

var seguimientoRealtimeIniciado = false;

var seguimientoCargando = false;


// ============================================================
// ESCAPAR HTML
// ============================================================

function escapeSeguimiento(valor) {

    return String(
        valor == null ? '' : valor
    )
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}


// ============================================================
// NORMALIZAR TEXTO
// ============================================================

function normalizarSeguimiento(valor) {

    return String(valor || '')
        .trim()
        .toLowerCase();
}


// ============================================================
// VERIFICAR SI ESTÁ CERRADO
// ============================================================

function esProcesoCerrado(estado) {

    var valor =
        normalizarSeguimiento(
            estado
        );


    return [
        'cerrado',
        'cerrada',
        'cancelado',
        'cancelada',
        'finalizado',
        'finalizada'
    ].indexOf(valor) !== -1;
}


// ============================================================
// CALCULAR PROGRESO
// ============================================================

function calcularProgreso(estado) {

    var estados = {

        'nueva': 10,

        'revisando': 20,

        'publicada': 35,

        'en proceso': 50,

        'preselección': 55,

        'preseleccion': 55,

        'entrevistas': 70,

        'entrevista': 70,

        'oferta': 90,

        'contratado': 100,

        'contratada': 100,

        'cerrado': 100,

        'cerrada': 100,

        'finalizado': 100,

        'finalizada': 100
    };


    var estadoNormalizado =
        normalizarSeguimiento(
            estado
        );


    if (
        estados[estadoNormalizado] !==
        undefined
    ) {

        return estados[
            estadoNormalizado
        ];
    }


    return 10;
}


// ============================================================
// COLOR PRIORIDAD
// ============================================================

function colorPrioridad(prioridad) {

    switch (
        normalizarSeguimiento(
            prioridad
        )
    ) {

        case 'alta':
        case 'urgente':

            return 'var(--danger)';


        case 'media':

            return 'var(--warning)';


        case 'baja':

            return 'var(--success)';


        default:

            return 'var(--primary)';
    }
}


// ============================================================
// COLOR PROGRESO
// ============================================================

function colorProgreso(progreso) {

    if (progreso >= 80) {

        return 'var(--success)';
    }


    if (progreso >= 50) {

        return 'var(--primary)';
    }


    return 'var(--warning)';
}


// ============================================================
// CLASE BADGE ESTADO
// ============================================================

function claseEstado(estado) {

    var valor =
        normalizarSeguimiento(
            estado
        );


    if (
        valor === 'cerrado' ||
        valor === 'cerrada' ||
        valor === 'contratado' ||
        valor === 'contratada' ||
        valor === 'finalizado' ||
        valor === 'finalizada'
    ) {

        return 'badge-green';
    }


    if (
        valor === 'entrevista' ||
        valor === 'entrevistas' ||
        valor === 'preselección' ||
        valor === 'preseleccion'
    ) {

        return 'badge-yellow';
    }


    if (
        valor === 'cancelado' ||
        valor === 'cancelada'
    ) {

        return 'badge-red';
    }


    return 'badge-blue';
}


// ============================================================
// OBTENER REQUISICIONES DE SUPABASE
// ============================================================

async function obtenerRequisicionesSeguimiento() {

    var client =
        await initSupabase();


    var consulta =
        client
            .from('requisiciones')
            .select('*')
            .order(
                'created_at',
                {
                    ascending: false
                }
            );


    // ========================================================
    // RECLUTADORA
    //
    // Administrador:
    // ve lo permitido por RLS.
    //
    // Reclutadora:
    // adicionalmente filtramos por reclutador_id.
    // ========================================================

    if (
        seguimientoUsuario &&
        seguimientoUsuario.role ===
            'Reclutadora' &&
        seguimientoUsuario.id
    ) {

        consulta =
            consulta.eq(
                'reclutador_id',
                seguimientoUsuario.id
            );
    }


    var resultado =
        await consulta;


    if (resultado.error) {

        console.error(
            '❌ Error Supabase requisiciones:',
            resultado.error
        );

        throw resultado.error;
    }


    return resultado.data || [];
}


// ============================================================
// OBTENER PROCESOS ACTIVOS
// ============================================================

function obtenerProcesosActivos() {

    return seguimientoRequisiciones
        .filter(
            function(requisicion) {

                return !esProcesoCerrado(
                    requisicion.estado
                );
            }
        );
}


// ============================================================
// ACTUALIZAR CONTADOR
// ============================================================

function actualizarContadorSeguimiento(
    cantidad
) {

    var contador =
        document.getElementById(
            'seguimientoContador'
        );


    if (!contador) {

        console.warn(
            '⚠️ seguimientoContador no existe'
        );

        return;
    }


    contador.textContent =
        cantidad +
        (
            cantidad === 1
                ? ' activo'
                : ' activos'
        );
}


// ============================================================
// MOSTRAR ESTADO VACÍO
// ============================================================

function mostrarSeguimientoVacio(
    mensaje,
    icono
) {

    var container =
        document.getElementById(
            'seguimientoContainer'
        );


    if (!container) {

        return;
    }


    container.innerHTML = `

        <div
            style="
                padding:45px 20px;
                text-align:center;
                color:var(--text-muted);
            "
        >

            <i
                class="fas ${escapeSeguimiento(
                    icono ||
                    'fa-inbox'
                )}"
                style="
                    font-size:30px;
                    margin-bottom:15px;
                "
            ></i>

            <div>
                ${escapeSeguimiento(
                    mensaje
                )}
            </div>

        </div>
    `;
}


// ============================================================
// RENDERIZAR SEGUIMIENTO
// ============================================================

function renderSeguimiento() {

    var container =
        document.getElementById(
            'seguimientoContainer'
        );


    if (!container) {

        console.warn(
            '⚠️ seguimientoContainer no existe'
        );

        return;
    }


    // ========================================================
    // PROCESOS ACTIVOS
    // ========================================================

    var requisiciones =
        obtenerProcesosActivos();


    // ========================================================
    // ACTUALIZAR CONTADOR
    // ========================================================

    actualizarContadorSeguimiento(
        requisiciones.length
    );


    console.log(
        '📊 Procesos activos:',
        requisiciones.length
    );


    // ========================================================
    // SIN REQUISICIONES
    // ========================================================

    if (
        seguimientoRequisiciones.length ===
        0
    ) {

        mostrarSeguimientoVacio(
            'No hay requisiciones registradas.',
            'fa-inbox'
        );

        return;
    }


    // ========================================================
    // TODAS CERRADAS
    // ========================================================

    if (
        requisiciones.length ===
        0
    ) {

        mostrarSeguimientoVacio(
            'Todos los procesos están cerrados.',
            'fa-check-circle'
        );

        return;
    }


    // ========================================================
    // LIMPIAR CONTENEDOR
    // ========================================================

    container.innerHTML = '';


    // ========================================================
    // CREAR TARJETAS
    // ========================================================

    requisiciones.forEach(
        function(r) {

            var card =
                document.createElement(
                    'div'
                );


            card.className =
                'card';


            card.style.cssText =
                'border-left:4px solid ' +
                colorPrioridad(
                    r.prioridad
                ) +
                ';margin-bottom:0;';


            // =================================================
            // DATOS
            // =================================================

            var progreso =
                calcularProgreso(
                    r.estado
                );


            var codigo =
                r.codigo ||
                (
                    'REQ-' +
                    r.id
                );


            var puesto =
                r.puesto ||
                'Sin título';


            var centro =
                r.centro ||
                'Sin centro comercial';


            var tienda =
                r.tienda ||
                '';


            var reclutador =
                r.reclutador ||
                r.reclutadora ||
                'No asignado';


            var estado =
                r.estado ||
                'Nueva';


            var prioridad =
                r.prioridad ||
                'Sin prioridad';


            var fecha =
                r.fecha ||
                (
                    r.created_at
                        ? String(
                            r.created_at
                        ).slice(
                            0,
                            10
                        )
                        : 'Sin fecha'
                );


            // =================================================
            // HTML TARJETA
            // =================================================

            card.innerHTML = `

                <div
                    style="
                        display:flex;
                        justify-content:space-between;
                        align-items:flex-start;
                        flex-wrap:wrap;
                        gap:15px;
                    "
                >

                    <!-- INFORMACIÓN PRINCIPAL -->

                    <div
                        style="
                            flex:1;
                            min-width:250px;
                        "
                    >

                        <div
                            style="
                                display:flex;
                                align-items:center;
                                flex-wrap:wrap;
                                gap:8px;
                            "
                        >

                            <strong
                                style="
                                    font-size:15px;
                                "
                            >
                                ${escapeSeguimiento(
                                    codigo
                                )}
                            </strong>


                            <span>
                                -
                                ${escapeSeguimiento(
                                    puesto
                                )}
                            </span>

                        </div>


                        <div
                            style="
                                margin-top:7px;
                                color:var(--text-muted);
                                font-size:13px;
                            "
                        >

                            <i
                                class="fas fa-store"
                            ></i>

                            ${escapeSeguimiento(
                                centro
                            )}

                            ${
                                tienda
                                    ? ' · ' +
                                      escapeSeguimiento(
                                          tienda
                                      )
                                    : ''
                            }

                        </div>

                    </div>


                    <!-- ESTADO / RECLUTADOR -->

                    <div
                        style="
                            display:flex;
                            align-items:center;
                            flex-wrap:wrap;
                            gap:10px;
                        "
                    >

                        <span
                            class="
                                badge
                                ${claseEstado(
                                    estado
                                )}
                            "
                        >

                            ${escapeSeguimiento(
                                estado
                            )}

                        </span>


                        <span
                            style="
                                font-size:12px;
                                color:var(--text-muted);
                            "
                        >

                            <i
                                class="fas fa-user-tie"
                            ></i>

                            ${escapeSeguimiento(
                                reclutador
                            )}

                        </span>

                    </div>

                </div>


                <!-- =========================================
                     PROGRESO
                ========================================== -->

                <div
                    style="
                        margin-top:18px;
                    "
                >

                    <div
                        style="
                            display:flex;
                            align-items:center;
                            gap:10px;
                        "
                    >

                        <span
                            style="
                                font-size:12px;
                                color:var(--text-muted);
                            "
                        >
                            Progreso:
                        </span>


                        <div
                            style="
                                flex:1;
                                height:7px;
                                background:var(--bg-body);
                                border-radius:20px;
                                overflow:hidden;
                            "
                        >

                            <div
                                style="
                                    width:${progreso}%;
                                    height:100%;
                                    background:${colorProgreso(
                                        progreso
                                    )};
                                    border-radius:20px;
                                    transition:
                                        width .3s ease;
                                "
                            ></div>

                        </div>


                        <span
                            style="
                                font-size:12px;
                                font-weight:600;
                                min-width:35px;
                                text-align:right;
                            "
                        >

                            ${progreso}%

                        </span>

                    </div>

                </div>


                <!-- =========================================
                     INFORMACIÓN INFERIOR
                ========================================== -->

                <div
                    style="
                        display:flex;
                        gap:10px;
                        margin-top:14px;
                        flex-wrap:wrap;
                        align-items:center;
                    "
                >

                    <!-- ESTADO -->

                    <span
                        class="
                            badge
                            ${claseEstado(
                                estado
                            )}
                        "
                    >

                        <i
                            class="fas fa-circle-notch"
                        ></i>

                        ${escapeSeguimiento(
                            estado
                        )}

                    </span>


                    <!-- FECHA -->

                    <span
                        style="
                            font-size:12px;
                            color:var(--text-muted);
                        "
                    >

                        <i
                            class="far fa-calendar-alt"
                        ></i>

                        ${escapeSeguimiento(
                            fecha
                        )}

                    </span>


                    <!-- PRIORIDAD -->

                    <span
                        style="
                            font-size:12px;
                            color:var(--text-muted);
                        "
                    >

                        <i
                            class="fas fa-flag"
                        ></i>

                        ${escapeSeguimiento(
                            prioridad
                        )}

                    </span>


                    <!-- BOTÓN -->

                    <button
                        type="button"
                        class="btn btn-outline"
                        style="
                            padding:6px 14px;
                            font-size:12px;
                            margin-left:auto;
                        "
                        data-requisicion-id="${escapeSeguimiento(
                            r.id
                        )}"
                    >

                        <i
                            class="fas fa-arrow-right"
                        ></i>

                        Gestionar

                    </button>

                </div>
            `;


            // =================================================
            // BOTÓN GESTIONAR
            // =================================================

            var boton =
                card.querySelector(
                    '[data-requisicion-id]'
                );


            if (boton) {

                boton.addEventListener(
                    'click',
                    function() {

                        var id =
                            this.dataset
                                .requisicionId;


                        console.log(
                            '➡️ Gestionando requisición:',
                            id
                        );


                        var destino =
                            'administrar-requisicion.html?id=' +
                            encodeURIComponent(
                                id
                            );


                        if (
                            typeof navigateTo ===
                            'function'
                        ) {

                            navigateTo(
                                destino
                            );

                        } else {

                            window.location.href =
                                destino;
                        }
                    }
                );
            }


            container.appendChild(
                card
            );
        }
    );
}


// ============================================================
// CARGAR DATOS
// ============================================================

async function cargarSeguimiento() {

    if (seguimientoCargando) {

        return;
    }


    seguimientoCargando =
        true;


    try {

        console.log(
            '🔄 Cargando seguimiento desde Supabase...'
        );


        seguimientoRequisiciones =
            await obtenerRequisicionesSeguimiento();


        console.log(
            '✅ Requisiciones cargadas:',
            seguimientoRequisiciones.length
        );


        renderSeguimiento();


    } catch (error) {

        console.error(
            '❌ Error cargando seguimiento:',
            error
        );


        actualizarContadorSeguimiento(
            0
        );


        mostrarSeguimientoVacio(
            'No se pudo cargar el seguimiento.',
            'fa-exclamation-triangle'
        );


    } finally {

        seguimientoCargando =
            false;
    }
}


// ============================================================
// REALTIME
// ============================================================

async function iniciarRealtimeSeguimiento() {

    if (
        seguimientoRealtimeIniciado
    ) {

        return;
    }


    if (
        typeof suscribirseATabla !==
        'function'
    ) {

        console.warn(
            '⚠️ suscribirseATabla no está disponible'
        );

        return;
    }


    seguimientoRealtimeIniciado =
        true;


    await suscribirseATabla(
        'requisiciones',

        function(payload) {

            console.log(
                '📡 Cambio Realtime requisiciones:',
                payload
                    ? payload.eventType
                    : 'evento'
            );


            cargarSeguimiento()
                .catch(
                    function(error) {

                        console.error(
                            '❌ Error refrescando seguimiento:',
                            error
                        );
                    }
                );
        }
    );


    console.log(
        '📡 Realtime Seguimiento activo'
    );
}

// ============================================================
// GESTIONAR REQUISICIÓN
// ============================================================

function gestionarRequisicion(id) {

    console.log("🔎 gestionarRequisicion() recibió:", id);

    const requisicionId = Number(id);

    if (!Number.isInteger(requisicionId) || requisicionId <= 0) {
        console.error("❌ ID de requisición inválido:", id);
        alert("No se pudo identificar la requisición.");
        return;
    }

    const url =
        `/administrar-requisicion.html?id=${encodeURIComponent(requisicionId)}`;

    console.log("➡️ Abriendo:", url);

    window.location.href = url;
}

// Necesario porque las tarjetas se generan dinámicamente
window.gestionarRequisicion = gestionarRequisicion;



// ============================================================
// INICIALIZAR
// ============================================================

async function iniciarSeguimiento() {

    try {

        console.log(
            '🚀 Inicializando Seguimiento Fase 3'
        );


        // ====================================================
        // USUARIO
        // ====================================================

        if (
            typeof requireAuth ===
            'function'
        ) {

            seguimientoUsuario =
                await requireAuth();

        } else if (
            typeof getCurrentUser ===
            'function'
        ) {

            seguimientoUsuario =
                getCurrentUser();
        }


        if (
            !seguimientoUsuario
        ) {

            console.warn(
                '⚠️ Usuario no autenticado'
            );


            window.location.href =
                'login.html';


            return;
        }


        // ====================================================
        // PERMISOS
        // ====================================================

        if (
            typeof tienePermiso ===
                'function' &&
            !tienePermiso(
                'ver_seguimiento'
            )
        ) {

            console.warn(
                '⛔ Usuario sin permiso ver_seguimiento'
            );


            window.location.href =
                'dashboard.html';


            return;
        }


        console.log(
            '👤 Seguimiento:',
            seguimientoUsuario.email,
            '|',
            seguimientoUsuario.role,
            '|',
            seguimientoUsuario.id
        );


        // ====================================================
        // INICIAR SUPABASE
        // ====================================================

        await initSupabase();


        // ====================================================
        // CARGAR REQUISICIONES
        // ====================================================

        await cargarSeguimiento();


        // ====================================================
        // REALTIME
        // ====================================================

        await iniciarRealtimeSeguimiento();


        console.log(
            '✅ Seguimiento Fase 3 inicializado'
        );


    } catch (error) {

        console.error(
            '❌ Error inicializando seguimiento:',
            error
        );


        actualizarContadorSeguimiento(
            0
        );


        mostrarSeguimientoVacio(
            'No se pudo inicializar el módulo de seguimiento.',
            'fa-exclamation-triangle'
        );
    }
}


// ============================================================
// EXPORTAR FUNCIONES
// ============================================================

window.cargarSeguimiento =
    cargarSeguimiento;

window.renderSeguimiento =
    renderSeguimiento;


// ============================================================
// DOM READY
// ============================================================

document.addEventListener(
    'DOMContentLoaded',

    function() {

        iniciarSeguimiento();
    }
);


console.log(
    '✅ seguimiento.js Fase 3 cargado'
);
