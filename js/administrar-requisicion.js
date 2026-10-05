// ============================================================
// SIMAN SMARTRECRUIT
// ADMINISTRAR REQUISICIÓN
// FASE 4 - PRD TEST
// SUPABASE + AUTH + REALTIME
// ============================================================

console.log('🧩 Administrar Requisición Fase 4 cargando...');


document.addEventListener(
    'DOMContentLoaded',
    async function () {

        // ====================================================
        // VARIABLES
        // ====================================================

        var supabaseAdminReq = null;

        var requisicionId = null;

        var requisicionActual = null;

        var candidatosActuales = [];

        var comentariosActuales = [];

        var historialActual = [];

        var guardandoComentario = false;

        var usuarioActual = null;

        var cargando = false;


        var ESTADOS_REQUISICION = [
            'Nueva',
            'Revisando',
            'Publicada',
            'Recibiendo CV',
            'Entrevistas',
            'Evaluaciones',
            'Oferta',
            'Contratado',
            'Cerrado'
        ];


        var PROGRESO_ESTADOS = {
            'Nueva': 10,
            'Revisando': 20,
            'Publicada': 30,
            'Recibiendo CV': 40,
            'Entrevistas': 55,
            'Evaluaciones': 70,
            'Oferta': 85,
            'Contratado': 100,
            'Cerrado': 100
        };


        // ====================================================
        // UTILIDADES
        // ====================================================

        function escapeHtml(valor) {

            return String(
                valor == null
                    ? ''
                    : valor
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

                    return mapa[caracter];
                }
            );
        }


        function setText(id, valor) {

            var elemento =
                document.getElementById(id);

            if (!elemento) {
                return;
            }

            elemento.textContent =
                valor == null ||
                valor === ''
                    ? '—'
                    : valor;
        }


        function obtenerRequisicionId() {

            var parametros =
                new URLSearchParams(
                    window.location.search
                );

            var valor =
                parametros.get('id') ||
                parametros.get('requisicion_id');

            if (!valor) {
                return null;
            }

            var numero =
                Number(valor);

            if (
                !Number.isInteger(numero) ||
                numero <= 0
            ) {
                return null;
            }

            return numero;
        }


        function convertirFecha(fecha) {

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


        function formatearFecha(fecha) {

            var valor =
                convertirFecha(fecha);

            if (!valor) {
                return '—';
            }

            return valor.toLocaleDateString(
                'es-GT',
                {
                    year: 'numeric',
                    month: 'short',
                    day: '2-digit'
                }
            );
        }


        function calcularDiasAbierta(requisicion) {

            var inicio =
                convertirFecha(
                    requisicion.created_at ||
                    requisicion.fecha
                );

            if (!inicio) {
                return 0;
            }

            var fin;

            if (
                requisicion.estado === 'Cerrado' ||
                requisicion.estado === 'Contratado'
            ) {

                fin =
                    convertirFecha(
                        requisicion.fecha_cierre ||
                        requisicion.updated_at
                    );

            } else {

                fin =
                    new Date();
            }

            if (!fin) {
                return 0;
            }

            return Math.max(
                0,
                Math.floor(
                    (fin - inicio) /
                    86400000
                )
            );
        }


        function obtenerIniciales(nombre) {

            if (!nombre) {
                return 'SR';
            }

            var partes =
                String(nombre)
                    .trim()
                    .split(/\s+/)
                    .filter(Boolean);

            if (!partes.length) {
                return 'SR';
            }

            if (partes.length === 1) {
                return partes[0]
                    .substring(0, 2)
                    .toUpperCase();
            }

            return (
                partes[0].charAt(0) +
                partes[1].charAt(0)
            ).toUpperCase();
        }


        function progresoEstado(estado) {

            return (
                PROGRESO_ESTADOS[estado] ||
                0
            );
        }


        function claseEstado(estado) {

            switch (estado) {

                case 'Nueva':
                    return 'estado-nueva';

                case 'Revisando':
                    return 'estado-revisando';

                case 'Publicada':
                    return 'estado-publicada';

                case 'Contratado':
                case 'Cerrado':
                    return 'estado-completada';

                default:
                    return 'estado-proceso';
            }
        }


        function formatearFechaHora(fecha) {

            var valor = convertirFecha(fecha);

            if (!valor) {
                return '—';
            }

            return valor.toLocaleString(
                'es-GT',
                {
                    year: 'numeric',
                    month: 'short',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit'
                }
            );
        }


        function obtenerUsuarioId() {

            if (!usuarioActual) {
                return null;
            }

            return (
                usuarioActual.id ||
                usuarioActual.user_id ||
                usuarioActual.uuid ||
                null
            );
        }


        function obtenerUsuarioNombre() {

            if (!usuarioActual) {
                return 'Usuario';
            }

            return (
                usuarioActual.nombre ||
                usuarioActual.name ||
                usuarioActual.email ||
                'Usuario'
            );
        }


        // ====================================================
        // AUTENTICACIÓN
        // ====================================================

        async function inicializarAutenticacion() {

            try {

                if (
                    typeof requireAuth ===
                    'function'
                ) {

                    usuarioActual =
                        await requireAuth();

                } else if (
                    typeof getCurrentUser ===
                    'function'
                ) {

                    usuarioActual =
                        getCurrentUser();
                }

            } catch (error) {

                console.error(
                    '❌ Error autenticando usuario:',
                    error
                );

                return false;
            }


            if (!usuarioActual) {

                window.location.href =
                    '/login.html';

                return false;
            }


            if (
                typeof tienePermiso ===
                'function'
            ) {

                var permitido =
                    await Promise.resolve(
                        tienePermiso(
                            'administrar_requisicion'
                        )
                    );

                if (!permitido) {

                    console.warn(
                        '⛔ Usuario sin permiso administrar_requisicion'
                    );

                    window.location.href =
                        '/dashboard.html';

                    return false;
                }
            }


            return true;
        }


        // ====================================================
        // SUPABASE
        // ====================================================

        async function inicializarSupabase() {

            if (
                typeof initSupabase ===
                'function'
            ) {

                supabaseAdminReq =
                    await initSupabase();

            } else if (
                window.supabaseClient
            ) {

                supabaseAdminReq =
                    window.supabaseClient;

            } else if (
                window.supabaseDB
            ) {

                supabaseAdminReq =
                    window.supabaseDB;
            }


            if (!supabaseAdminReq) {

                throw new Error(
                    'No se pudo obtener el cliente de Supabase.'
                );
            }
        }


        // ====================================================
        // ESTADO DE CARGA
        // ====================================================

        function mostrarCarga() {

            setText(
                'tituloRequisicion',
                'Cargando requisición...'
            );

            setText(
                'badgeEstadoActual',
                'CARGANDO'
            );

            setText(
                'kpiProgreso',
                '...'
            );

            setText(
                'kpiCandidatos',
                '...'
            );

            setText(
                'kpiDiasAbierta',
                '...'
            );

            setText(
                'kpiPrioridad',
                '...'
            );
        }


        // ====================================================
        // CARGAR REQUISICIÓN
        // ====================================================

        async function cargarRequisicion() {

            console.log(
                '📄 Cargando requisición:',
                requisicionId
            );


            var resultado =
                await supabaseAdminReq
                    .from('requisiciones')
                    .select('*')
                    .eq('id', requisicionId)
                    .maybeSingle();


            if (resultado.error) {

                console.error(
                    '❌ Error consultando requisición:',
                    resultado.error
                );

                throw resultado.error;
            }


            if (!resultado.data) {

                throw new Error(
                    'REQUISICION_NO_ENCONTRADA'
                );
            }


            requisicionActual =
                resultado.data;


            console.log(
                '✅ Requisición encontrada:',
                requisicionActual
            );
        }


        // ====================================================
        // CANDIDATOS
        // ====================================================

        async function cargarCandidatos() {

            var resultado =
                await supabaseAdminReq
                    .from('candidatos')
                    .select('*')
                    .eq(
                        'requisicion_id',
                        requisicionId
                    )
                    .order(
                        'created_at',
                        {
                            ascending: false
                        }
                    );


            if (resultado.error) {

                console.error(
                    '❌ Error cargando candidatos:',
                    resultado.error
                );

                candidatosActuales = [];

                return;
            }


            candidatosActuales =
                resultado.data || [];


            console.log(
                '👥 Candidatos encontrados:',
                candidatosActuales.length
            );
        }


        // ====================================================
        // COMENTARIOS E HISTORIAL - SUPABASE
        // ====================================================

        async function cargarComentarios() {

            var resultado =
                await supabaseAdminReq
                    .from('requisicion_comentarios')
                    .select('*')
                    .eq('requisicion_id', requisicionId)
                    .order('created_at', { ascending: false });


            if (resultado.error) {

                console.error(
                    '❌ Error cargando comentarios:',
                    resultado.error
                );

                comentariosActuales = [];
                return;
            }


            comentariosActuales =
                resultado.data || [];


            console.log(
                '💬 Comentarios encontrados:',
                comentariosActuales.length
            );
        }


        async function cargarHistorial() {

            var resultado =
                await supabaseAdminReq
                    .from('requisicion_historial')
                    .select('*')
                    .eq('requisicion_id', requisicionId)
                    .order('created_at', { ascending: false });


            if (resultado.error) {

                console.error(
                    '❌ Error cargando historial:',
                    resultado.error
                );

                historialActual = [];
                return;
            }


            historialActual =
                resultado.data || [];


            console.log(
                '🕘 Movimientos de historial:',
                historialActual.length
            );
        }


        function renderizarComentarios() {

            var container =
                document.getElementById(
                    'listaComentarios'
                );


            if (!container) {
                return;
            }


            if (!comentariosActuales.length) {

                container.innerHTML =
                    '<div class="empty-state">' +
                    '<i class="fa-regular fa-comment-dots"></i><br><br>' +
                    'No hay comentarios registrados.' +
                    '</div>';

                return;
            }


            container.innerHTML =
                comentariosActuales
                    .map(
                        function (comentario) {

                            var autor =
                                comentario.usuario_nombre ||
                                'Usuario';

                            return (
                                '<div class="comment-item">' +

                                    '<div class="comment-avatar">' +
                                        escapeHtml(
                                            obtenerIniciales(autor)
                                        ) +
                                    '</div>' +

                                    '<div class="comment-content">' +

                                        '<div class="comment-header">' +
                                            '<strong>' +
                                                escapeHtml(autor) +
                                            '</strong>' +
                                            '<span>' +
                                                escapeHtml(
                                                    formatearFechaHora(
                                                        comentario.created_at
                                                    )
                                                ) +
                                            '</span>' +
                                        '</div>' +

                                        '<p>' +
                                            escapeHtml(
                                                comentario.comentario ||
                                                ''
                                            ) +
                                        '</p>' +

                                    '</div>' +

                                '</div>'
                            );
                        }
                    )
                    .join('');
        }


        function renderizarHistorial() {

            var historial =
                document.getElementById(
                    'listaHistorial'
                );


            if (!historial) {
                return;
            }


            if (!historialActual.length) {

                historial.innerHTML =
                    '<div class="empty-state">' +
                    'Sin movimientos registrados.' +
                    '</div>';

                return;
            }


            historial.innerHTML =
                historialActual
                    .map(
                        function (movimiento) {

                            var titulo =
                                movimiento.tipo === 'cambio_estado'
                                    ? (
                                        'Cambio de estado' +
                                        (
                                            movimiento.estado_anterior ||
                                            movimiento.estado_nuevo
                                                ? ': ' +
                                                  escapeHtml(
                                                      movimiento.estado_anterior ||
                                                      '—'
                                                  ) +
                                                  ' → ' +
                                                  escapeHtml(
                                                      movimiento.estado_nuevo ||
                                                      '—'
                                                  )
                                                : ''
                                        )
                                    )
                                    : (
                                        movimiento.tipo ||
                                        'Movimiento'
                                    );

                            var detalle =
                                movimiento.descripcion ||
                                'Movimiento registrado';

                            var meta =
                                (
                                    movimiento.usuario_nombre ||
                                    'Usuario'
                                ) +
                                ' · ' +
                                formatearFechaHora(
                                    movimiento.created_at
                                );

                            return (
                                '<div class="history-item">' +
                                    '<strong>' +
                                        escapeHtml(titulo) +
                                    '</strong>' +
                                    '<span>' +
                                        escapeHtml(detalle) +
                                    '</span>' +
                                    '<small>' +
                                        escapeHtml(meta) +
                                    '</small>' +
                                '</div>'
                            );
                        }
                    )
                    .join('');
        }


        async function registrarHistorialCambioEstado(
            estadoAnterior,
            estadoNuevo
        ) {

            var usuarioId =
                obtenerUsuarioId();

            if (!usuarioId) {
                throw new Error(
                    'No se pudo identificar el UUID del usuario.'
                );
            }


            var payload = {
                requisicion_id:
                    requisicionId,

                tipo:
                    'cambio_estado',

                estado_anterior:
                    estadoAnterior,

                estado_nuevo:
                    estadoNuevo,

                descripcion:
                    'Estado actualizado de ' +
                    estadoAnterior +
                    ' a ' +
                    estadoNuevo,

                usuario_id:
                    usuarioId,

                usuario_nombre:
                    obtenerUsuarioNombre()
            };


            var resultado =
                await supabaseAdminReq
                    .from('requisicion_historial')
                    .insert(payload)
                    .select('*')
                    .single();


            if (resultado.error) {
                throw resultado.error;
            }


            return resultado.data;
        }


        // ====================================================
        // RENDER PRINCIPAL
        // ====================================================

        function renderizarRequisicion() {

            if (!requisicionActual) {
                return;
            }


            var r =
                requisicionActual;


            // ------------------------------------------------
            // HEADER
            // ------------------------------------------------

            setText(
                'tituloRequisicion',
                r.codigo
                    ? r.codigo + ' · ' +
                      (r.puesto || 'Requisición')
                    : r.puesto || 'Administrar Requisición'
            );


            setText(
                'tiendaRequisicion',
                r.tienda ||
                r.centro ||
                'Sin ubicación'
            );


            setText(
                'puestoRequisicion',
                r.puesto ||
                'Sin puesto'
            );


            var badge =
                document.getElementById(
                    'badgeEstadoActual'
                );


            if (badge) {

                badge.textContent =
                    r.estado || 'Nueva';

                badge.className =
                    'status-badge ' +
                    claseEstado(
                        r.estado || 'Nueva'
                    );
            }


            // ------------------------------------------------
            // KPIS
            // ------------------------------------------------

            var progreso =
                progresoEstado(
                    r.estado || 'Nueva'
                );


            setText(
                'kpiProgreso',
                progreso + '%'
            );


            setText(
                'kpiCandidatos',
                candidatosActuales.length
            );


            setText(
                'kpiDiasAbierta',
                calcularDiasAbierta(r)
            );


            setText(
                'kpiPrioridad',
                r.prioridad || 'Media'
            );


            setText(
                'porcentajeProceso',
                progreso + '%'
            );


            var barra =
                document.getElementById(
                    'barraProgreso'
                );


            if (barra) {

                barra.style.width =
                    progreso + '%';
            }


            // ------------------------------------------------
            // INFORMACIÓN
            // ------------------------------------------------

            setText(
                'infoCodigo',
                r.codigo || r.id
            );


            setText(
                'infoDepartamento',
                r.departamento
            );


            setText(
                'infoCentro',
                r.centro
            );


            setText(
                'infoTienda',
                r.tienda
            );


            setText(
                'infoContratacion',
                r.tipo_contratacion
            );


            setText(
                'infoMotivo',
                r.motivo
            );


            setText(
                'infoCantidad',
                r.cantidad || 1
            );


            setText(
                'infoFechaLimite',
                formatearFecha(
                    r.fecha_limite
                )
            );


            setText(
                'infoDescripcion',
                r.descripcion ||
                'Sin descripción registrada.'
            );


            setText(
                'infoRequisitos',
                r.requisitos ||
                'Sin requisitos registrados.'
            );


            setText(
                'infoObservaciones',
                r.observaciones ||
                'Sin observaciones.'
            );


            // ------------------------------------------------
            // RESPONSABLE
            // ------------------------------------------------

            var responsable =
                r.reclutador ||
                'Sin asignar';


            setText(
                'responsableNombre',
                responsable
            );


            setText(
                'responsableIniciales',
                obtenerIniciales(
                    responsable ===
                    'Sin asignar'
                        ? ''
                        : responsable
                )
            );


            // ------------------------------------------------
            // BOTÓN ESTADO
            // ------------------------------------------------

            actualizarBotonEstado();
        }


        // ====================================================
        // RENDER CANDIDATOS
        // ====================================================

        function renderizarCandidatos() {

            var container =
                document.getElementById(
                    'listaCandidatos'
                );


            setText(
                'contadorCandidatos',
                candidatosActuales.length
            );


            if (!container) {
                return;
            }


            if (
                candidatosActuales.length ===
                0
            ) {

                container.innerHTML =
                    '<div class="empty-state">' +
                    '<i class="fa-regular fa-user"></i><br><br>' +
                    'No hay candidatos registrados para esta requisición.' +
                    '</div>';

                return;
            }


            container.innerHTML =
                candidatosActuales
                    .map(
                        function (candidato) {

                            var nombre =
                                candidato.nombre ||
                                'Candidato';


                            return (
                                '<div class="candidato-item">' +

                                    '<div class="candidato-avatar">' +
                                        escapeHtml(
                                            obtenerIniciales(
                                                nombre
                                            )
                                        ) +
                                    '</div>' +

                                    '<div class="candidato-info">' +

                                        '<strong>' +
                                            escapeHtml(nombre) +
                                        '</strong>' +

                                        '<span>' +
                                            escapeHtml(
                                                candidato.email ||
                                                candidato.telefono ||
                                                'Sin información de contacto'
                                            ) +
                                        '</span>' +

                                    '</div>' +

                                    '<span class="candidato-estado">' +
                                        escapeHtml(
                                            candidato.estado ||
                                            'Registrado'
                                        ) +
                                    '</span>' +

                                '</div>'
                            );
                        }
                    )
                    .join('');
        }


        // ====================================================
        // ESTADO
        // ====================================================

        function actualizarBotonEstado() {

            var boton =
                document.getElementById(
                    'btnAvanzarEstado'
                );


            if (
                !boton ||
                !requisicionActual
            ) {
                return;
            }


            var estado =
                requisicionActual.estado ||
                'Nueva';


            var indice =
                ESTADOS_REQUISICION
                    .indexOf(estado);


            if (
                indice ===
                ESTADOS_REQUISICION.length - 1
            ) {

                boton.disabled =
                    true;

                boton.innerHTML =
                    '<i class="fa-solid fa-circle-check"></i>' +
                    ' Proceso Finalizado';

                return;
            }


            boton.disabled =
                false;


            var siguiente =
                ESTADOS_REQUISICION[
                    Math.max(
                        0,
                        indice + 1
                    )
                ];


            boton.innerHTML =
                '<i class="fa-solid fa-forward"></i>' +
                ' Avanzar a ' +
                escapeHtml(siguiente);
        }


        async function avanzarEstado() {

            if (!requisicionActual) {
                return;
            }


            var estadoActual =
                requisicionActual.estado ||
                'Nueva';


            var indice =
                ESTADOS_REQUISICION
                    .indexOf(
                        estadoActual
                    );


            if (indice < 0) {

                indice = 0;
            }


            if (
                indice >=
                ESTADOS_REQUISICION.length - 1
            ) {

                alert(
                    'La requisición ya se encuentra cerrada.'
                );

                return;
            }


            var nuevoEstado =
                ESTADOS_REQUISICION[
                    indice + 1
                ];


            var confirmar =
                window.confirm(
                    '¿Deseas avanzar la requisición de "' +
                    estadoActual +
                    '" a "' +
                    nuevoEstado +
                    '"?'
                );


            if (!confirmar) {
                return;
            }


            var boton =
                document.getElementById(
                    'btnAvanzarEstado'
                );


            if (boton) {

                boton.disabled =
                    true;

                boton.innerHTML =
                    '<i class="fa-solid fa-spinner fa-spin"></i>' +
                    ' Actualizando...';
            }


            try {

                var cambios = {

                    estado:
                        nuevoEstado,

                    updated_at:
                        new Date()
                            .toISOString()
                };


                if (
                    nuevoEstado ===
                    'Cerrado'
                ) {

                    cambios.fecha_cierre =
                        new Date()
                            .toISOString();
                }


                cambios.updated_by =
                    obtenerUsuarioNombre();


                var resultado =
                    await supabaseAdminReq
                        .from(
                            'requisiciones'
                        )
                        .update(cambios)
                        .eq(
                            'id',
                            requisicionId
                        )
                        .select('*')
                        .single();


                if (resultado.error) {

                    throw resultado.error;
                }


                requisicionActual =
                    resultado.data;


                try {

                    await registrarHistorialCambioEstado(
                        estadoActual,
                        nuevoEstado
                    );

                    await cargarHistorial();
                    renderizarHistorial();

                } catch (historialError) {

                    console.error(
                        '❌ El estado fue actualizado, pero no se pudo registrar el historial:',
                        historialError
                    );

                    alert(
                        'El estado fue actualizado, pero no fue posible registrar el movimiento en el historial. ' +
                        'Por favor informa este evento a soporte.'
                    );
                }


                renderizarRequisicion();


                console.log(
                    '✅ Estado actualizado:',
                    nuevoEstado
                );


                if (
                    typeof agregarNotificacion ===
                    'function'
                ) {

                    agregarNotificacion(
                        'success',
                        'Estado actualizado a: ' +
                        nuevoEstado,
                        '/administrar-requisicion.html?id=' +
                        requisicionId
                    );
                }


            } catch (error) {

                console.error(
                    '❌ Error actualizando estado:',
                    error
                );


                alert(
                    'No fue posible actualizar el estado de la requisición.'
                );


                actualizarBotonEstado();
            }
        }


        // ====================================================
        // COMENTARIOS
        // ====================================================

        function configurarComentarios() {

            var modal =
                document.getElementById(
                    'modalComentario'
                );

            var abrir =
                document.getElementById(
                    'btnNuevoComentario'
                );

            var cerrar =
                document.getElementById(
                    'cerrarModalComentario'
                );

            var cancelar =
                document.getElementById(
                    'cancelarComentario'
                );

            var formulario =
                document.getElementById(
                    'formComentario'
                );

            var textarea =
                document.getElementById(
                    'textoComentario'
                );

            var guardar =
                document.getElementById(
                    'btnGuardarComentario'
                );

            var overlay =
                modal
                    ? modal.querySelector(
                        '.modal-overlay'
                    )
                    : null;


            function abrirModal() {

                if (!modal) {
                    return;
                }

                modal.hidden = false;

                if (textarea) {

                    setTimeout(
                        function () {
                            textarea.focus();
                        },
                        50
                    );
                }
            }


            function cerrarModal() {

                if (!modal) {
                    return;
                }

                modal.hidden = true;

                if (textarea) {
                    textarea.value = '';
                }
            }


            if (abrir) {
                abrir.addEventListener(
                    'click',
                    abrirModal
                );
            }

            if (cerrar) {
                cerrar.addEventListener(
                    'click',
                    cerrarModal
                );
            }

            if (cancelar) {
                cancelar.addEventListener(
                    'click',
                    cerrarModal
                );
            }

            if (overlay) {
                overlay.addEventListener(
                    'click',
                    cerrarModal
                );
            }


            if (formulario) {

                formulario.addEventListener(
                    'submit',
                    async function (event) {

                        event.preventDefault();

                        if (guardandoComentario) {
                            return;
                        }


                        var comentario =
                            textarea
                                ? textarea.value.trim()
                                : '';


                        if (!comentario) {

                            alert(
                                'Escribe un comentario antes de guardar.'
                            );

                            if (textarea) {
                                textarea.focus();
                            }

                            return;
                        }


                        var usuarioId =
                            obtenerUsuarioId();


                        if (!usuarioId) {

                            alert(
                                'No fue posible identificar al usuario autenticado.'
                            );

                            return;
                        }


                        guardandoComentario = true;


                        if (guardar) {

                            guardar.disabled = true;

                            guardar.innerHTML =
                                '<i class="fa-solid fa-spinner fa-spin"></i>' +
                                ' Guardando...';
                        }


                        try {

                            var payload = {
                                requisicion_id:
                                    requisicionId,

                                comentario:
                                    comentario,

                                usuario_id:
                                    usuarioId,

                                usuario_nombre:
                                    obtenerUsuarioNombre()
                            };


                            var resultado =
                                await supabaseAdminReq
                                    .from(
                                        'requisicion_comentarios'
                                    )
                                    .insert(payload)
                                    .select('*')
                                    .single();


                            if (resultado.error) {
                                throw resultado.error;
                            }


                            console.log(
                                '💬 Comentario guardado:',
                                resultado.data
                            );


                            await cargarComentarios();
                            renderizarComentarios();
                            cerrarModal();


                            if (
                                typeof agregarNotificacion ===
                                'function'
                            ) {

                                agregarNotificacion(
                                    'success',
                                    'Comentario agregado a la requisición.',
                                    '/administrar-requisicion.html?id=' +
                                    requisicionId
                                );
                            }


                        } catch (error) {

                            console.error(
                                '❌ Error guardando comentario:',
                                error
                            );

                            alert(
                                'No fue posible guardar el comentario. ' +
                                'Verifica tu sesión y los permisos de Supabase.'
                            );

                        } finally {

                            guardandoComentario = false;

                            if (guardar) {

                                guardar.disabled = false;

                                guardar.innerHTML =
                                    '<i class="fa-solid fa-floppy-disk"></i>' +
                                    ' Guardar';
                            }
                        }
                    }
                );
            }
        }


        // ====================================================
        // BOTONES
        // ====================================================

        function configurarBotones() {

            var avanzar =
                document.getElementById(
                    'btnAvanzarEstado'
                );


            if (avanzar) {

                avanzar.addEventListener(
                    'click',
                    avanzarEstado
                );
            }


            var registrar =
                document.getElementById(
                    'btnRegistrarCandidato'
                );


            var registrarAccion =
                document.getElementById(
                    'btnRegistrarCandidatoAccion'
                );


            function irRegistrarCandidato() {

                window.location.href =
                    '/candidatos.html?requisicion_id=' +
                    requisicionId;
            }


            if (registrar) {

                registrar.addEventListener(
                    'click',
                    irRegistrarCandidato
                );
            }


            if (registrarAccion) {

                registrarAccion.addEventListener(
                    'click',
                    irRegistrarCandidato
                );
            }


            var correo =
                document.getElementById(
                    'btnEnviarCorreo'
                );


            if (correo) {

                correo.addEventListener(
                    'click',
                    function () {

                        alert(
                            'La integración de correo se habilitará en la fase de comunicaciones.'
                        );
                    }
                );
            }


            var reporte =
                document.getElementById(
                    'btnGenerarReporte'
                );


            if (reporte) {

                reporte.addEventListener(
                    'click',
                    function () {

                        alert(
                            'La generación del reporte se habilitará en la fase de reportes.'
                        );
                    }
                );
            }
        }


        // ====================================================
        // CARGA GENERAL
        // ====================================================

        async function cargarTodo() {

            if (cargando) {
                return;
            }


            cargando =
                true;


            try {

                await cargarRequisicion();

                await cargarCandidatos();

                await cargarComentarios();

                await cargarHistorial();


                renderizarRequisicion();

                renderizarCandidatos();

                renderizarComentarios();

                renderizarHistorial();


                console.log(
                    '✅ Administración de requisición actualizada'
                );


            } catch (error) {

                console.error(
                    '❌ Error cargando administración:',
                    error
                );


                if (
                    error &&
                    error.message ===
                    'REQUISICION_NO_ENCONTRADA'
                ) {

                    alert(
                        'La requisición solicitada no existe o no está disponible.'
                    );


                    window.location.href =
                        '/seguimiento.html';

                    return;
                }


                alert(
                    'No fue posible cargar la requisición.'
                );


            } finally {

                cargando =
                    false;
            }
        }


        // ====================================================
        // INICIALIZACIÓN
        // ====================================================

        var autenticado =
            await inicializarAutenticacion();


        if (!autenticado) {
            return;
        }


        requisicionId =
            obtenerRequisicionId();


        if (!requisicionId) {

            alert(
                'No se recibió un ID de requisición válido.'
            );


            window.location.href =
                '/seguimiento.html';

            return;
        }


        try {

            await inicializarSupabase();

        } catch (error) {

            console.error(
                '❌ Error inicializando Supabase:',
                error
            );


            alert(
                'No fue posible conectar con Supabase.'
            );

            return;
        }


        mostrarCarga();

        configurarBotones();

        configurarComentarios();


        await cargarTodo();


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

                    var registro =
                        payload.new ||
                        payload.old;


                    if (
                        registro &&
                        Number(registro.id) ===
                        Number(requisicionId)
                    ) {

                        console.log(
                            '📡 Cambio de requisición detectado:',
                            payload.eventType
                        );


                        cargarTodo();
                    }
                }
            );


            await suscribirseATabla(
                'candidatos',
                function (payload) {

                    var registro =
                        payload.new ||
                        payload.old;


                    if (
                        registro &&
                        Number(
                            registro.requisicion_id
                        ) ===
                        Number(requisicionId)
                    ) {

                        console.log(
                            '📡 Cambio de candidato detectado:',
                            payload.eventType
                        );


                        cargarTodo();
                    }
                }
            );


            await suscribirseATabla(
                'requisicion_comentarios',
                function (payload) {

                    var registro =
                        payload.new ||
                        payload.old;


                    if (
                        registro &&
                        Number(
                            registro.requisicion_id
                        ) ===
                        Number(requisicionId)
                    ) {

                        console.log(
                            '📡 Cambio de comentario detectado:',
                            payload.eventType
                        );

                        cargarComentarios()
                            .then(
                                renderizarComentarios
                            );
                    }
                }
            );


            await suscribirseATabla(
                'requisicion_historial',
                function (payload) {

                    var registro =
                        payload.new ||
                        payload.old;


                    if (
                        registro &&
                        Number(
                            registro.requisicion_id
                        ) ===
                        Number(requisicionId)
                    ) {

                        console.log(
                            '📡 Cambio de historial detectado:',
                            payload.eventType
                        );

                        cargarHistorial()
                            .then(
                                renderizarHistorial
                            );
                    }
                }
            );
        }


        console.log(
            '📡 Administrar Requisición Realtime inicializado'
        );
    }
);
