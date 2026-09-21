// ============================================================
// SIMAN SMARTRECRUIT
// VACANTES.JS - FASE 3
// SUPABASE + AUTH + RLS + REALTIME
// ============================================================

console.log('💼 vacantes.js Fase 3 cargando...');


// ============================================================
// VARIABLES
// ============================================================

var vacantesUsuario = null;

var vacantesData = [];

var vacantesCargando = false;

var vacantesRealtimeIniciado = false;


// ============================================================
// ESCAPAR HTML
// ============================================================

function escapeVacante(valor) {

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
// NORMALIZAR
// ============================================================

function normalizarVacante(valor) {

    return String(valor || '')
        .trim()
        .toLowerCase();
}


// ============================================================
// VERIFICAR ESTADO CERRADO
// ============================================================

function vacanteEstaCerrada(estado) {

    var valor =
        normalizarVacante(estado);


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
// CLASE PRIORIDAD
// ============================================================

function clasePrioridadVacante(prioridad) {

    switch (
        normalizarVacante(prioridad)
    ) {

        case 'alta':
        case 'urgente':

            return 'badge-red';


        case 'media':

            return 'badge-yellow';


        case 'baja':

            return 'badge-blue';


        default:

            return 'badge-gray';
    }
}


// ============================================================
// COLOR LATERAL
// ============================================================

function colorPrioridadVacante(prioridad) {

    switch (
        normalizarVacante(prioridad)
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
// CLASE ESTADO
// ============================================================

function claseEstadoVacante(estado) {

    var valor =
        normalizarVacante(estado);


    if (
        valor === 'entrevista' ||
        valor === 'entrevistas' ||
        valor === 'contratado' ||
        valor === 'contratada'
    ) {

        return 'badge-green';
    }


    if (
        valor === 'revisando' ||
        valor === 'en proceso' ||
        valor === 'preselección' ||
        valor === 'preseleccion'
    ) {

        return 'badge-yellow';
    }


    if (
        valor === 'urgente' ||
        valor === 'cancelado' ||
        valor === 'cancelada'
    ) {

        return 'badge-red';
    }


    return 'badge-blue';
}


// ============================================================
// FORMATEAR FECHA
// ============================================================

function formatearFechaVacante(fecha) {

    if (!fecha) {

        return 'Sin fecha';
    }


    try {

        var partes =
            String(fecha)
                .slice(0, 10)
                .split('-');


        if (partes.length === 3) {

            return (
                partes[2] +
                '/' +
                partes[1] +
                '/' +
                partes[0]
            );
        }


        return String(fecha);


    } catch (error) {

        return String(fecha);
    }
}


// ============================================================
// CONSULTAR SUPABASE
// ============================================================

async function obtenerVacantesSupabase() {

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
    // Filtramos usando UUID, NO nombre.
    // ========================================================

    if (
        vacantesUsuario &&
        vacantesUsuario.role ===
            'Reclutadora' &&
        vacantesUsuario.id
    ) {

        consulta =
            consulta.eq(
                'reclutador_id',
                vacantesUsuario.id
            );
    }


    var resultado =
        await consulta;


    if (resultado.error) {

        console.error(
            '❌ Error consultando vacantes:',
            resultado.error
        );

        throw resultado.error;
    }


    return resultado.data || [];
}


// ============================================================
// FILTRAR ACTIVAS
// ============================================================

function obtenerVacantesActivas() {

    return vacantesData.filter(
        function(vacante) {

            return !vacanteEstaCerrada(
                vacante.estado
            );
        }
    );
}


// ============================================================
// CONTADOR
// ============================================================

function actualizarTotalVacantes(cantidad) {

    var badge =
        document.getElementById(
            'totalVacantes'
        );


    if (!badge) {

        return;
    }


    badge.textContent =
        cantidad +
        (
            cantidad === 1
                ? ' activa'
                : ' activas'
        );
}


// ============================================================
// ESTADO VACÍO
// ============================================================

function mostrarVacantesVacias(
    mensaje,
    icono
) {

    var container =
        document.getElementById(
            'vacantesContainer'
        );


    if (!container) {

        return;
    }


    container.innerHTML = `

        <div
            class="empty-state"
            style="
                grid-column:1 / -1;
                padding:50px 20px;
            "
        >

            <i
                class="fas ${escapeVacante(
                    icono || 'fa-briefcase'
                )}"
            ></i>

            <div>
                ${escapeVacante(mensaje)}
            </div>

        </div>
    `;
}


// ============================================================
// RENDER VACANTES
// ============================================================

function renderVacantes() {

    var container =
        document.getElementById(
            'vacantesContainer'
        );


    if (!container) {

        console.warn(
            '⚠️ vacantesContainer no existe'
        );

        return;
    }


    var activas =
        obtenerVacantesActivas();


    actualizarTotalVacantes(
        activas.length
    );


    console.log(
        '💼 Vacantes activas:',
        activas.length
    );


    if (
        vacantesData.length === 0
    ) {

        mostrarVacantesVacias(
            'No hay requisiciones registradas.',
            'fa-briefcase'
        );

        return;
    }


    if (
        activas.length === 0
    ) {

        mostrarVacantesVacias(
            'No hay vacantes activas.',
            'fa-check-circle'
        );

        return;
    }


    container.innerHTML = '';


    activas.forEach(
        function(r) {

            var card =
                document.createElement(
                    'div'
                );


            card.className =
                'card vacante-card';


            card.style.borderLeft =
                '4px solid ' +
                colorPrioridadVacante(
                    r.prioridad
                );


            // =================================================
            // DATOS
            // =================================================

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


            var prioridad =
                r.prioridad ||
                'Sin prioridad';


            var estado =
                r.estado ||
                'Nueva';


            var cantidad =
                Number(
                    r.cantidad || 1
                );


            var fecha =
                formatearFechaVacante(
                    r.fecha ||
                    r.created_at
                );


            // =================================================
            // HTML
            // =================================================

            card.innerHTML = `

                <div
                    style="
                        display:flex;
                        justify-content:space-between;
                        align-items:flex-start;
                        gap:15px;
                    "
                >

                    <div
                        style="
                            flex:1;
                            min-width:0;
                        "
                    >

                        <div
                            style="
                                color:var(--text-muted);
                                font-size:11px;
                                margin-bottom:5px;
                                font-weight:600;
                            "
                        >

                            ${escapeVacante(codigo)}

                        </div>


                        <h4 class="vacante-title">

                            ${escapeVacante(puesto)}

                        </h4>


                        <p class="vacante-info">

                            <i class="fas fa-store"></i>

                            ${escapeVacante(centro)}

                            ${
                                tienda
                                    ? ' · ' +
                                      escapeVacante(tienda)
                                    : ''
                            }

                        </p>


                        <p class="vacante-info">

                            <i class="fas fa-user-tie"></i>

                            Reclutador:

                            ${escapeVacante(reclutador)}

                        </p>

                    </div>


                    <div
                        style="
                            text-align:right;
                            display:flex;
                            flex-direction:column;
                            align-items:flex-end;
                            gap:6px;
                        "
                    >

                        <span
                            class="
                                badge
                                ${clasePrioridadVacante(
                                    prioridad
                                )}
                            "
                        >

                            ${escapeVacante(prioridad)}

                        </span>


                        <span
                            class="
                                badge
                                ${claseEstadoVacante(
                                    estado
                                )}
                            "
                        >

                            ${escapeVacante(estado)}

                        </span>

                    </div>

                </div>


                <div class="vacante-footer">

                    <div class="vacante-meta">

                        <span>

                            <i
                                class="far fa-calendar-alt"
                            ></i>

                            ${escapeVacante(fecha)}

                        </span>


                        <span>

                            <i
                                class="fas fa-users"
                            ></i>

                            ${cantidad}

                            ${
                                cantidad === 1
                                    ? ' plaza'
                                    : ' plazas'
                            }

                        </span>

                    </div>


                    <div class="vacante-actions">

                        <button
                            type="button"
                            class="btn btn-primary"
                            data-action="detalle"
                            data-id="${escapeVacante(
                                r.id
                            )}"
                            style="
                                padding:6px 14px;
                                font-size:12px;
                            "
                        >

                            <i class="fas fa-file-alt"></i>

                            Ver Detalle

                        </button>


                        <button
                            type="button"
                            class="btn btn-outline"
                            data-action="gestionar"
                            data-id="${escapeVacante(
                                r.id
                            )}"
                            style="
                                padding:6px 14px;
                                font-size:12px;
                            "
                        >

                            <i class="fas fa-tasks"></i>

                            Gestionar

                        </button>

                    </div>

                </div>
            `;


            // =================================================
            // BOTÓN DETALLE
            // =================================================

            var btnDetalle =
                card.querySelector(
                    '[data-action="detalle"]'
                );


            if (btnDetalle) {

                btnDetalle.addEventListener(
                    'click',
                    function() {

                        var id =
                            this.dataset.id;


                        var destino =
                            '/detalle-requisicion.html?id=' +
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


            // =================================================
            // BOTÓN GESTIONAR
            // =================================================

            var btnGestionar =
                card.querySelector(
                    '[data-action="gestionar"]'
                );


            if (btnGestionar) {

                btnGestionar.addEventListener(
                    'click',
                    function() {

                        var id =
                            this.dataset.id;


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
// CARGAR VACANTES
// ============================================================

async function cargarVacantes() {

    if (vacantesCargando) {

        return;
    }


    vacantesCargando =
        true;


    var boton =
        document.getElementById(
            'btnRecargarVacantes'
        );


    if (boton) {

        boton.disabled = true;

        var icono =
            boton.querySelector('i');

        if (icono) {

            icono.classList.add(
                'fa-spin'
            );
        }
    }


    try {

        console.log(
            '🔄 Cargando vacantes desde Supabase...'
        );


        vacantesData =
            await obtenerVacantesSupabase();


        console.log(
            '✅ Requisiciones para vacantes:',
            vacantesData.length
        );


        renderVacantes();


    } catch (error) {

        console.error(
            '❌ Error cargando vacantes:',
            error
        );


        actualizarTotalVacantes(0);


        mostrarVacantesVacias(
            'No se pudieron cargar las vacantes.',
            'fa-exclamation-triangle'
        );


    } finally {

        vacantesCargando =
            false;


        if (boton) {

            boton.disabled = false;

            var iconoFinal =
                boton.querySelector('i');


            if (iconoFinal) {

                iconoFinal.classList.remove(
                    'fa-spin'
                );
            }
        }
    }
}


// ============================================================
// REALTIME
// ============================================================

async function iniciarRealtimeVacantes() {

    if (
        vacantesRealtimeIniciado
    ) {

        return;
    }


    if (
        typeof suscribirseATabla !==
        'function'
    ) {

        console.warn(
            '⚠️ Realtime no disponible para Vacantes'
        );

        return;
    }


    vacantesRealtimeIniciado =
        true;


    await suscribirseATabla(
        'requisiciones',

        function(payload) {

            console.log(
                '📡 Cambio Realtime Vacantes:',
                payload
                    ? payload.eventType
                    : 'evento'
            );


            cargarVacantes()
                .catch(
                    function(error) {

                        console.error(
                            '❌ Error refrescando Vacantes:',
                            error
                        );
                    }
                );
        }
    );


    console.log(
        '📡 Realtime Vacantes activo'
    );
}


// ============================================================
// INICIALIZAR
// ============================================================

async function iniciarVacantes() {

    try {

        console.log(
            '🚀 Inicializando Vacantes Fase 3'
        );


        // ====================================================
        // AUTH
        // ====================================================

        if (
            typeof requireAuth ===
            'function'
        ) {

            vacantesUsuario =
                await requireAuth();

        } else if (
            typeof getCurrentUser ===
            'function'
        ) {

            vacantesUsuario =
                getCurrentUser();
        }


        if (!vacantesUsuario) {

            console.warn(
                '⚠️ Usuario no autenticado'
            );


            window.location.href =
                '/login.html';


            return;
        }


        // ====================================================
        // PERMISO
        // ====================================================

        if (
            typeof tienePermiso ===
                'function' &&
            !tienePermiso(
                'ver_vacantes'
            )
        ) {

            console.warn(
                '⛔ Sin permiso ver_vacantes'
            );


            window.location.href =
                '/dashboard.html';


            return;
        }


        console.log(
            '👤 Vacantes:',
            vacantesUsuario.email,
            '|',
            vacantesUsuario.role,
            '|',
            vacantesUsuario.id
        );


        // ====================================================
        // SUPABASE
        // ====================================================

        await initSupabase();


        // ====================================================
        // BOTÓN RECARGAR
        // ====================================================

        var boton =
            document.getElementById(
                'btnRecargarVacantes'
            );


        if (boton) {

            boton.addEventListener(
                'click',
                function() {

                    cargarVacantes();
                }
            );
        }


        // ====================================================
        // CARGAR
        // ====================================================

        await cargarVacantes();


        // ====================================================
        // REALTIME
        // ====================================================

        await iniciarRealtimeVacantes();


        console.log(
            '✅ Vacantes Fase 3 inicializado'
        );


    } catch (error) {

        console.error(
            '❌ Error inicializando Vacantes:',
            error
        );


        actualizarTotalVacantes(0);


        mostrarVacantesVacias(
            'No se pudo inicializar el módulo de vacantes.',
            'fa-exclamation-triangle'
        );
    }
}


// ============================================================
// EXPORTAR
// ============================================================

window.cargarVacantes =
    cargarVacantes;

window.renderVacantes =
    renderVacantes;


// ============================================================
// DOM READY
// ============================================================

document.addEventListener(
    'DOMContentLoaded',

    function() {

        iniciarVacantes();
    }
);


console.log(
    '✅ vacantes.js Fase 3 cargado'
);
