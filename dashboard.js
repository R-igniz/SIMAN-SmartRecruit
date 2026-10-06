// ============================================================
// SIMAN SMARTRECRUIT
// DASHBOARD.JS - FASE 3
// DATOS 100% DESDE SUPABASE + REALTIME
// ============================================================

console.log('📊 Dashboard Fase 3 cargando...');

document.addEventListener(
    'DOMContentLoaded',
    async function () {

        // ====================================================
        // ESPERAR AUTENTICACIÓN
        // ====================================================

        var user = null;

        try {

            if (typeof requireAuth === 'function') {

                user = await requireAuth();

            } else if (
                typeof getCurrentUser === 'function'
            ) {

                user = getCurrentUser();
            }

        } catch (error) {

            console.error(
                '❌ Error obteniendo usuario:',
                error
            );

            return;
        }


        if (!user) {

            console.warn(
                '⚠️ Dashboard sin usuario autenticado'
            );

            return;
        }


        console.log(
            '📊 Dashboard real para:',
            user.nombre ||
            user.name ||
            user.email
        );


        // ====================================================
        // VARIABLES
        // ====================================================

        var cargandoDashboard = false;

        var ultimaActualizacion = null;


        // ====================================================
        // UTILIDADES
        // ====================================================

        function setText(
            id,
            value
        ) {

            var elemento =
                document.getElementById(id);


            if (elemento) {

                elemento.textContent =
                    value;
            }
        }


        function escapeHtml(value) {

            return String(
                value == null
                    ? ''
                    : value
            ).replace(
                /[&<>"']/g,
                function (caracter) {

                    var mapa = {

                        '&': '&amp;',

                        '<': '&lt;',

                        '>': '&gt;',

                        '"': '&quot;',

                        "'": '&#039;'
                    };


                    return mapa[
                        caracter
                    ];
                }
            );
        }


        function normalizarEstado(
            estado
        ) {

            return String(
                estado || ''
            )
                .trim()
                .toLowerCase();
        }


        function normalizarPrioridad(
            prioridad
        ) {

            return String(
                prioridad || ''
            )
                .trim()
                .toLowerCase();
        }


        // ====================================================
        // ESTADOS
        // ====================================================

        function estadoCerrado(
            estado
        ) {

            var e =
                normalizarEstado(
                    estado
                );


            return [
                'cerrada',
                'cerrado',

                'contratado',
                'contratada',

                'finalizada',
                'finalizado',

                'completada',
                'completado'
            ].indexOf(e) >= 0;
        }


        function estadoPendiente(
            estado
        ) {

            var e =
                normalizarEstado(
                    estado
                );


            return [
                'nueva',
                'nuevo',

                'revisando',

                'pendiente',

                'solicitada',
                'solicitado'
            ].indexOf(e) >= 0;
        }


        function prioridadUrgente(
            prioridad
        ) {

            var p =
                normalizarPrioridad(
                    prioridad
                );


            return (
                p === 'urgente' ||
                p === 'alta' ||
                p.indexOf('urgent') >= 0
            );
        }


        // ====================================================
        // BADGE
        // ====================================================

        function badge(
            estado
        ) {

            var texto =
                String(
                    estado ||
                    'Sin estado'
                );


            var e =
                normalizarEstado(
                    estado
                );


            var clase =
                'badge-blue';


            if (
                estadoCerrado(e)
            ) {

                clase =
                    'badge-green';

            } else if (
                e.indexOf(
                    'cancel'
                ) >= 0
            ) {

                clase =
                    'badge-red';

            } else if (
                e.indexOf(
                    'pend'
                ) >= 0 ||
                e.indexOf(
                    'revis'
                ) >= 0
            ) {

                clase =
                    'badge-yellow';
            }


            return (
                '<span class="badge ' +
                clase +
                '">' +
                escapeHtml(texto) +
                '</span>'
            );
        }


        // ====================================================
        // FECHA
        // ====================================================

        function convertirFecha(
            fecha
        ) {

            if (!fecha) {

                return null;
            }


            var resultado =
                new Date(fecha);


            if (
                isNaN(
                    resultado.getTime()
                )
            ) {

                return null;
            }


            return resultado;
        }


        function calcularDias(
            inicio,
            fin
        ) {

            var fechaInicio =
                convertirFecha(
                    inicio
                );


            var fechaFin =
                convertirFecha(
                    fin
                );


            if (
                !fechaInicio ||
                !fechaFin
            ) {

                return null;
            }


            var diferencia =
                fechaFin -
                fechaInicio;


            return Math.max(
                0,
                Math.round(
                    diferencia /
                    86400000
                )
            );
        }


        // ====================================================
        // MOSTRAR ESTADO DE CARGA
        // ====================================================

        function mostrarCargando() {

            setText(
                'kpiAbiertas',
                '...'
            );

            setText(
                'kpiCerradas',
                '...'
            );

            setText(
                'kpiContrataciones',
                '...'
            );

            setText(
                'kpiTiempo',
                '...'
            );

            setText(
                'kpiPendientes',
                '...'
            );

            setText(
                'kpiAlertas',
                '...'
            );
        }


        // ====================================================
        // CARGAR DASHBOARD
        // ====================================================

        async function cargarDashboard() {

            if (
                cargandoDashboard
            ) {

                return;
            }


            cargandoDashboard =
                true;


            console.log(
                '🔄 Actualizando Dashboard desde Supabase...'
            );


            try {

                // ============================================
                // SUPABASE ES LA ÚNICA FUENTE
                // ============================================

                var result =
                    await obtenerDeSupabase(
                        'requisiciones',
                        null,
                        {
                            campo:
                                'created_at',

                            ascendente:
                                false
                        }
                    );


                if (
                    !result.success
                ) {

                    throw new Error(
                        result.error ||
                        'No se pudieron obtener las requisiciones.'
                    );
                }


                var reqs =
                    result.data ||
                    [];


                console.log(
                    '📦 Requisiciones recibidas:',
                    reqs.length
                );


                // ============================================
                // ABIERTAS
                // ============================================

                var abiertas =
                    reqs.filter(
                        function (r) {

                            return (
                                !estadoCerrado(
                                    r.estado
                                )
                            );
                        }
                    );


                // ============================================
                // CERRADAS
                // ============================================

                var cerradas =
                    reqs.filter(
                        function (r) {

                            return estadoCerrado(
                                r.estado
                            );
                        }
                    );


                // ============================================
                // PENDIENTES
                // ============================================

                var pendientes =
                    reqs.filter(
                        function (r) {

                            return estadoPendiente(
                                r.estado
                            );
                        }
                    );


                // ============================================
                // ALERTAS
                // ============================================

                var alertas =
                    abiertas.filter(
                        function (r) {

                            return prioridadUrgente(
                                r.prioridad
                            );
                        }
                    );


                // ============================================
                // CONTRATACIONES DEL MES
                // ============================================

                var ahora =
                    new Date();


                var contrataciones =
                    reqs.filter(
                        function (r) {

                            var estado =
                                normalizarEstado(
                                    r.estado
                                );


                            if (
                                estado.indexOf(
                                    'contrat'
                                ) < 0
                            ) {

                                return false;
                            }


                            var fecha =
                                convertirFecha(
                                    r.fecha_cierre ||
                                    r.updated_at ||
                                    r.created_at ||
                                    r.fecha
                                );


                            if (!fecha) {

                                return false;
                            }


                            return (
                                fecha.getMonth() ===
                                    ahora.getMonth() &&

                                fecha.getFullYear() ===
                                    ahora.getFullYear()
                            );
                        }
                    );


                // ============================================
                // TIEMPO PROMEDIO
                // ============================================

                var dias =
                    cerradas
                        .map(
                            function (r) {

                                return calcularDias(

                                    r.created_at ||
                                    r.fecha,

                                    r.fecha_cierre ||
                                    r.updated_at
                                );
                            }
                        )
                        .filter(
                            function (valor) {

                                return (
                                    valor !== null
                                );
                            }
                        );


                var promedio =
                    dias.length
                        ? Math.round(
                            dias.reduce(
                                function (
                                    total,
                                    valor
                                ) {

                                    return (
                                        total +
                                        valor
                                    );
                                },
                                0
                            ) /
                            dias.length
                        )
                        : 0;


                // ============================================
                // KPIs
                // ============================================

                setText(
                    'kpiAbiertas',
                    abiertas.length
                );


                setText(
                    'kpiCerradas',
                    cerradas.length
                );


                setText(
                    'kpiContrataciones',
                    contrataciones.length
                );


                setText(
                    'kpiTiempo',
                    promedio + 'd'
                );


                setText(
                    'kpiPendientes',
                    pendientes.length
                );


                setText(
                    'kpiAlertas',
                    alertas.length
                );


                // ============================================
                // SUBTÍTULOS
                // ============================================

                setText(
                    'trendAbiertas',
                    'Total activo'
                );


                setText(
                    'trendCerradas',
                    'Total histórico'
                );


                setText(
                    'trendContrataciones',
                    'Mes actual'
                );


                setText(
                    'trendTiempo',

                    dias.length
                        ? 'Cobertura promedio'
                        : 'Sin cierres medibles'
                );


                setText(
                    'trendPendientes',
                    pendientes.length +
                    ' pendientes'
                );


                setText(
                    'trendAlertas',
                    alertas.length +
                    ' prioridad alta/urgente'
                );


                // ============================================
                // VACANTES POR CENTRO
                // ============================================

                var porCentro = {};


                abiertas.forEach(
                    function (r) {

                        var centro =
                            r.centro ||
                            'Sin centro';


                        if (
                            !porCentro[
                                centro
                            ]
                        ) {

                            porCentro[
                                centro
                            ] = 0;
                        }


                        porCentro[
                            centro
                        ]++;
                    }
                );


                var pares =
                    Object
                        .keys(
                            porCentro
                        )
                        .map(
                            function (centro) {

                                return [
                                    centro,
                                    porCentro[
                                        centro
                                    ]
                                ];
                            }
                        )
                        .sort(
                            function (
                                a,
                                b
                            ) {

                                return (
                                    b[1] -
                                    a[1]
                                );
                            }
                        )
                        .slice(
                            0,
                            7
                        );


                var valores =
                    pares.map(
                        function (item) {

                            return item[1];
                        }
                    );


                valores.push(1);


                var max =
                    Math.max.apply(
                        null,
                        valores
                    );


                var chart =
                    document.getElementById(
                        'chartComerciales'
                    );


                var labels =
                    document.getElementById(
                        'chartLabels'
                    );


                if (chart) {

                    if (
                        pares.length ===
                        0
                    ) {

                        chart.innerHTML =
                            '<span class="empty-state">' +
                            'Sin vacantes abiertas' +
                            '</span>';

                    } else {

                        chart.innerHTML =
                            pares
                                .map(
                                    function (
                                        item
                                    ) {

                                        var altura =
                                            Math.max(
                                                12,

                                                Math.round(
                                                    item[1] /
                                                    max *
                                                    90
                                                )
                                            );


                                        return (
                                            '<div ' +
                                            'class="bar" ' +
                                            'title="' +
                                            escapeHtml(
                                                item[0]
                                            ) +
                                            ': ' +
                                            item[1] +
                                            '" ' +
                                            'style="height:' +
                                            altura +
                                            'px;">' +
                                            '</div>'
                                        );
                                    }
                                )
                                .join('');
                    }
                }


                if (labels) {

                    labels.innerHTML =
                        pares
                            .map(
                                function (
                                    item
                                ) {

                                    return (
                                        '<span>' +
                                        escapeHtml(
                                            item[0]
                                        ) +
                                        '</span>'
                                    );
                                }
                            )
                            .join('');
                }


                // ============================================
                // ÚLTIMAS REQUISICIONES
                // ============================================

                var ultimas =
                    document.getElementById(
                        'ultimasRequisiciones'
                    );


                if (ultimas) {

                    if (
                        reqs.length ===
                        0
                    ) {

                        ultimas.innerHTML =
                            '<div class="item">' +
                            '<span>' +
                            'No hay requisiciones registradas.' +
                            '</span>' +
                            '</div>';

                    } else {

                        ultimas.innerHTML =
                            reqs
                                .slice(
                                    0,
                                    5
                                )
                                .map(
                                    function (r) {

                                        return (
                                            '<div class="item">' +

                                            '<span>' +

                                            '<strong>#' +
                                            escapeHtml(
                                                r.codigo ||
                                                r.id
                                            ) +
                                            '</strong>' +

                                            ' · ' +

                                            escapeHtml(
                                                r.puesto ||
                                                'Sin puesto'
                                            ) +

                                            ' · ' +

                                            escapeHtml(
                                                r.centro ||
                                                'Sin centro'
                                            ) +

                                            '</span>' +

                                            badge(
                                                r.estado
                                            ) +

                                            '</div>'
                                        );
                                    }
                                )
                                .join('');
                    }
                }


                // ============================================
                // ACTIVIDAD RECIENTE
                // ============================================

                var actividad =
                    document.getElementById(
                        'actividadReciente'
                    );


                if (actividad) {

                    if (
                        reqs.length ===
                        0
                    ) {

                        actividad.innerHTML =
                            '<div class="item">' +
                            '<span>' +
                            'Sin actividad reciente.' +
                            '</span>' +
                            '</div>';

                    } else {

                        actividad.innerHTML =
                            reqs
                                .slice(
                                    0,
                                    4
                                )
                                .map(
                                    function (r) {

                                        return (
                                            '<div class="item">' +

                                            '<span>' +

                                            '<i class="fas fa-file-alt"></i> ' +

                                            escapeHtml(
                                                r.codigo ||
                                                r.id
                                            ) +

                                            ' · ' +

                                            escapeHtml(
                                                r.puesto ||
                                                'Sin puesto'
                                            ) +

                                            '</span>' +

                                            badge(
                                                r.estado
                                            ) +

                                            '</div>'
                                        );
                                    }
                                )
                                .join('');
                    }
                }


                // ============================================
                // ÚLTIMA ACTUALIZACIÓN
                // ============================================

                ultimaActualizacion =
                    new Date();


                console.log(
                    '✅ Dashboard actualizado:',
                    reqs.length,
                    'requisiciones reales'
                );


            } catch (error) {

                console.error(
                    '❌ Error cargando Dashboard:',
                    error
                );


                setText(
                    'kpiAbiertas',
                    '0'
                );

                setText(
                    'kpiCerradas',
                    '0'
                );

                setText(
                    'kpiContrataciones',
                    '0'
                );

                setText(
                    'kpiTiempo',
                    '0d'
                );

                setText(
                    'kpiPendientes',
                    '0'
                );

                setText(
                    'kpiAlertas',
                    '0'
                );


                var ultimasError =
                    document.getElementById(
                        'ultimasRequisiciones'
                    );


                if (ultimasError) {

                    ultimasError.innerHTML =
                        '<div class="item">' +
                        '<span>' +
                        'No se pudieron cargar las requisiciones.' +
                        '</span>' +
                        '</div>';
                }


            } finally {

                cargandoDashboard =
                    false;
            }
        }


        // ====================================================
        // CARGA INICIAL
        // ====================================================

        mostrarCargando();


        await cargarDashboard();


        // ====================================================
        // REALTIME REQUISICIONES
        // ====================================================

        if (
            typeof suscribirseATabla ===
            'function'
        ) {

            await suscribirseATabla(
                'requisiciones',
                function (payload) {

                    console.log(
                        '📡 Cambio de requisición detectado:',
                        payload.eventType
                    );


                    cargarDashboard();
                }
            );
        }


        // ====================================================
        // REALTIME CANDIDATOS
        // ====================================================
        // Aunque todavía los KPI principales son de
        // requisiciones, dejamos preparada la actualización
        // para la siguiente etapa.
        // ====================================================

        if (
            typeof suscribirseATabla ===
            'function'
        ) {

            await suscribirseATabla(
                'candidatos',
                function (payload) {

                    console.log(
                        '📡 Cambio de candidato detectado:',
                        payload.eventType
                    );


                    cargarDashboard();
                }
            );
        }


        console.log(
            '📡 Dashboard Realtime inicializado'
        );
    }
);
