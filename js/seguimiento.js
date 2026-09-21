// ============================================================
// SIMAN SMARTRECRUIT
// SEGUIMIENTO.JS - FASE 3
// SUPABASE + RLS + REALTIME
// ============================================================

console.log('📋 seguimiento.js Fase 3 cargando...');

var seguimientoRequisiciones = [];
var seguimientoUsuario = null;
var seguimientoRealtimeIniciado = false;
var seguimientoCargando = false;


// ============================================================
// ESCAPAR HTML
// ============================================================

function escapeSeguimiento(valor) {
    return String(valor == null ? '' : valor)
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
// ESTADO CERRADO
// ============================================================

function esProcesoCerrado(estado) {

    var valor =
        normalizarSeguimiento(estado);

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
// PROGRESO
// ============================================================

function calcularProgreso(estado) {

    var estados = {
        'nueva': 10,
        'revisando': 20,
        'publicada': 35,
        'en proceso': 50,
        'entrevistas': 70,
        'oferta': 90,
        'cerrado': 100,
        'cerrada': 100,
        'finalizado': 100,
        'finalizada': 100
    };

    var estadoNormalizado =
        normalizarSeguimiento(estado);

    return estados[estadoNormalizado] !== undefined
        ? estados[estadoNormalizado]
        : 10;
}


// ============================================================
// COLOR PRIORIDAD
// ============================================================

function colorPrioridad(prioridad) {

    switch (
        normalizarSeguimiento(prioridad)
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
// OBTENER REQUISICIONES
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


    /*
     * IMPORTANTE:
     *
     * RLS continúa siendo la seguridad real.
     *
     * Además filtramos para Reclutadora desde
     * frontend para evitar mostrar registros
     * que no le corresponden si la política
     * actual todavía permite SELECT general.
     */

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

        throw resultado.error;
    }


    return resultado.data || [];
}


// ============================================================
// FILTRAR ACTIVAS
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
// ESTADO VACÍO
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


    container.innerHTML =
        '<div class="empty-state">' +
            '<i class="fas ' +
                escapeSeguimiento(
                    icono ||
                    'fa-inbox'
                ) +
            '"></i>' +
            '<div>' +
                escapeSeguimiento(
                    mensaje
                ) +
            '</div>' +
        '</div>';
}


// ============================================================
// RENDER
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


    var requisiciones =
        obtenerProcesosActivos();


    console.log(
        '📊 Procesos activos:',
        requisiciones.length
    );


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


    container.innerHTML = '';


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
                ';margin-bottom:12px;';


            var progreso =
                calcularProgreso(
                    r.estado
                );


            var codigo =
                r.codigo ||
                ('REQ-' + r.id);


            var puesto =
                r.puesto ||
                'Sin título';


            var centro =
                r.centro ||
                '-';


            var tienda =
                r.tienda ||
                '';


            var reclutador =
                r.reclutador ||
                'No asignado';


            var estado =
                r.estado ||
                'Nueva';


            var fecha =
                r.fecha ||
                (
                    r.created_at
                        ? String(
                            r.created_at
                        ).slice(0, 10)
                        : 'Sin fecha'
                );


            var prioridad =
                r.prioridad ||
                'Sin prioridad';


            card.innerHTML = `
                <div
                    style="
                        display:flex;
                        justify-content:space-between;
                        align-items:center;
                        flex-wrap:wrap;
                        gap:8px;
                    "
                >

                    <div>

                        <strong>
                            ${escapeSeguimiento(codigo)}
                        </strong>

                        -
                        ${escapeSeguimiento(puesto)}

                        <span
                            style="
                                color:var(--text-muted);
                                font-size:13px;
                                margin-left:8px;
                            "
                        >

                            <i class="fas fa-store"></i>

                            ${escapeSeguimiento(centro)}

                            ${
                                tienda
                                    ? ' · ' +
                                      escapeSeguimiento(tienda)
                                    : ''
                            }

                        </span>

                    </div>


                    <div>

                        <span class="badge badge-blue">
                            ${escapeSeguimiento(estado)}
                        </span>

                        <span
                            style="
                                font-size:12px;
                                color:var(--text-muted);
                                margin-left:8px;
                            "
                        >

                            <i class="fas fa-user-tie"></i>

                            ${escapeSeguimiento(reclutador)}

                        </span>

                    </div>

                </div>


                <div style="margin-top:12px;">

                    <div
                        style="
                            display:flex;
                            gap:8px;
                            flex-wrap:wrap;
                            align-items:center;
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
                                height:6px;
                                background:var(--bg-body);
                                border-radius:10px;
                                min-width:100px;
                            "
                        >

                            <div
                                style="
                                    width:${progreso}%;
                                    height:100%;
                                    background:${colorProgreso(progreso)};
                                    border-radius:10px;
                                    transition:width .3s ease;
                                "
                            ></div>

                        </div>


                        <span
                            style="
                                font-size:12px;
                                font-weight:500;
                            "
                        >
                            ${progreso}%
                        </span>

                    </div>


                    <div
                        style="
                            display:flex;
                            gap:8px;
                            margin-top:8px;
                            flex-wrap:wrap;
                            align-items:center;
                        "
                    >

                        <span
                            class="badge ${
                                normalizarSeguimiento(estado) ===
                                'nueva'
                                    ? 'badge-blue'
                                    : 'badge-green'
                            }"
                        >

                            <i
                                class="fas ${
                                    normalizarSeguimiento(estado) ===
                                    'nueva'
                                        ? 'fa-spinner'
                                        : 'fa-check'
                                }"
                            ></i>

                            ${escapeSeguimiento(estado)}

                        </span>


                        <span
                            style="
                                font-size:12px;
                                color:var(--text-muted);
                            "
                        >

                            <i class="far fa-calendar-alt"></i>

                            ${escapeSeguimiento(fecha)}

                        </span>


                        <span
                            style="
                                font-size:12px;
                                color:var(--text-muted);
                            "
                        >

                            <i class="fas fa-flag"></i>

                            ${escapeSeguimiento(prioridad)}

                        </span>


                        <button
                            type="button"
                            class="btn btn-outline"
                            style="
                                padding:4px 12px;
                                font-size:12px;
                                margin-left:auto;
                            "
                            data-requisicion-id="${escapeSeguimiento(r.id)}"
                        >

                            <i class="fas fa-arrow-right"></i>
                            Gestionar

                        </button>

                    </div>

                </div>
            `;


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


                        var destino =
                            '/administrar-requisicion.html?id=' +
                            encodeURIComponent(id);


                        if (
                            typeof navigateTo ===
                            'function'
                        ) {

                            navigateTo(destino);

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
// CARGAR
// ============================================================

async function cargarSeguimiento() {

    if (seguimientoCargando) {
        return;
    }


    seguimientoCargando = true;


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


        mostrarSeguimientoVacio(
            'No se pudo cargar el seguimiento.',
            'fa-exclamation-triangle'
        );


    } finally {

        seguimientoCargando = false;
    }
}


// ============================================================
// REALTIME
// ============================================================

async function iniciarRealtimeSeguimiento() {

    if (seguimientoRealtimeIniciado) {
        return;
    }


    if (
        typeof suscribirseATabla !==
        'function'
    ) {

        console.warn(
            '⚠️ Realtime no disponible para seguimiento'
        );

        return;
    }


    seguimientoRealtimeIniciado =
        true;


    await suscribirseATabla(
        'requisiciones',
        function(payload) {

            console.log(
                '📡 Cambio en requisiciones:',
                payload
                    ? payload.eventType
                    : 'evento'
            );


            /*
             * Volvemos a consultar Supabase.
             *
             * Esto garantiza que se respeten
             * RLS, filtros y asignaciones.
             */

            cargarSeguimiento()
                .catch(
                    function(error) {

                        console.error(
                            '❌ Error actualizando seguimiento:',
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
// INICIALIZACIÓN
// ============================================================

async function iniciarSeguimiento() {

    try {

        console.log(
            '🚀 Inicializando Seguimiento Fase 3'
        );


        // ----------------------------------------------------
        // AUTENTICACIÓN
        // ----------------------------------------------------

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


        if (!seguimientoUsuario) {

            window.location.href =
                '/login.html';

            return;
        }


        // ----------------------------------------------------
        // PERMISO
        // ----------------------------------------------------

        if (
            typeof tienePermiso ===
                'function' &&
            !tienePermiso(
                'ver_seguimiento'
            )
        ) {

            console.warn(
                '⛔ Sin permiso ver_seguimiento'
            );


            window.location.href =
                '/dashboard.html';

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


        // ----------------------------------------------------
        // SUPABASE
        // ----------------------------------------------------

        await initSupabase();


        // ----------------------------------------------------
        // DATOS
        // ----------------------------------------------------

        await cargarSeguimiento();


        // ----------------------------------------------------
        // REALTIME
        // ----------------------------------------------------

        await iniciarRealtimeSeguimiento();


        console.log(
            '✅ Seguimiento Fase 3 inicializado'
        );


    } catch (error) {

        console.error(
            '❌ Error inicializando seguimiento:',
            error
        );


        mostrarSeguimientoVacio(
            'No se pudo inicializar el módulo.',
            'fa-exclamation-triangle'
        );
    }
}


// ============================================================
// EXPORTAR
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
