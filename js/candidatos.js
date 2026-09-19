// ==========================================
// CANDIDATOS
// SMARTRECRUIT FASE 2
// SUPABASE AUTH + UUID
// ==========================================

(function () {

    var candidatos = [];
    var requisiciones = [];


    // ======================================
    // ESCAPAR HTML
    // ======================================

    function escapar(valor) {

        return String(
            valor == null
                ? ''
                : valor
        ).replace(
            /[&<>"']/g,
            function (caracter) {

                return {
                    '&': '&amp;',
                    '<': '&lt;',
                    '>': '&gt;',
                    '"': '&quot;',
                    "'": '&#39;'
                }[caracter];
            }
        );
    }


    // ======================================
    // MODAL
    // ======================================

    function mostrarModal(mostrar) {

        var modal =
            document.getElementById(
                'modalCandidato'
            );

        if (!modal) return;

        modal.hidden =
            !mostrar;
    }


    // ======================================
    // CARGAR DATOS
    // ======================================

    async function cargar() {

        console.log(
            '🔄 Cargando candidatos...'
        );

        var client =
            await initSupabase();


        var resultados =
            await Promise.all([

                client
                    .from('candidatos')
                    .select('*')
                    .order(
                        'created_at',
                        {
                            ascending: false
                        }
                    ),

                client
                    .from('requisiciones')
                    .select(
                        'id,codigo,puesto'
                    )
                    .order(
                        'created_at',
                        {
                            ascending: false
                        }
                    )
            ]);


        var resultadoCandidatos =
            resultados[0];

        var resultadoRequisiciones =
            resultados[1];


        if (
            resultadoCandidatos.error
        ) {

            throw resultadoCandidatos.error;
        }


        if (
            resultadoRequisiciones.error
        ) {

            console.warn(
                '⚠️ Error cargando requisiciones:',
                resultadoRequisiciones.error
            );
        }


        candidatos =
            resultadoCandidatos.data ||
            [];


        requisiciones =
            resultadoRequisiciones.data ||
            [];


        poblarRequisiciones();

        render();


        console.log(
            '✅ Candidatos cargados:',
            candidatos.length
        );
    }


    // ======================================
    // SELECT REQUISICIONES
    // ======================================

    function poblarRequisiciones() {

        var select =
            document.getElementById(
                'candRequisicion'
            );


        if (!select) {
            return;
        }


        select.innerHTML =
            '<option value="">' +
            'Sin asignar' +
            '</option>';


        requisiciones.forEach(
            function (requisicion) {

                var option =
                    document.createElement(
                        'option'
                    );


                option.value =
                    requisicion.id;


                option.textContent =
                    (
                        requisicion.codigo ||
                        '#' +
                        requisicion.id
                    ) +
                    ' - ' +
                    (
                        requisicion.puesto ||
                        ''
                    );


                select.appendChild(
                    option
                );
            }
        );
    }


    // ======================================
    // RENDER
    // ======================================

    function render() {

        var buscar =
            document.getElementById(
                'buscarCandidato'
            );


        var filtro =
            document.getElementById(
                'filtroEstado'
            );


        var query =
            buscar
                ? buscar.value
                    .toLowerCase()
                    .trim()
                : '';


        var estado =
            filtro
                ? filtro.value
                : '';


        var filtrados =
            candidatos.filter(
                function (candidato) {

                    var texto = [
                        candidato.nombre,
                        candidato.email,
                        candidato.telefono
                    ]
                        .join(' ')
                        .toLowerCase();


                    var coincideBusqueda =
                        !query ||
                        texto.includes(
                            query
                        );


                    var coincideEstado =
                        !estado ||
                        candidato.estado ===
                            estado;


                    return (
                        coincideBusqueda &&
                        coincideEstado
                    );
                }
            );


        var contador =
            document.getElementById(
                'contadorCandidatos'
            );


        if (contador) {

            contador.textContent =
                filtrados.length +
                ' candidatos';
        }


        var requisicionesMap =
            {};


        requisiciones.forEach(
            function (requisicion) {

                requisicionesMap[
                    requisicion.id
                ] =
                    (
                        requisicion.codigo ||
                        '#' +
                        requisicion.id
                    ) +
                    ' - ' +
                    (
                        requisicion.puesto ||
                        ''
                    );
            }
        );


        var body =
            document.getElementById(
                'candidatosBody'
            );


        if (!body) {
            return;
        }


        if (
            filtrados.length === 0
        ) {

            body.innerHTML =
                '<tr>' +
                '<td colspan="6">' +
                'No hay candidatos.' +
                '</td>' +
                '</tr>';

            return;
        }


        body.innerHTML =
            filtrados.map(
                function (candidato) {

                    var fecha = '-';

                    if (
                        candidato.created_at
                    ) {

                        fecha =
                            new Date(
                                candidato.created_at
                            )
                                .toLocaleDateString(
                                    'es-GT'
                                );
                    }


                    return (
                        '<tr>' +

                        '<td>' +
                        '<strong>' +
                        escapar(
                            candidato.nombre
                        ) +
                        '</strong>' +
                        '</td>' +

                        '<td>' +
                        escapar(
                            requisicionesMap[
                                candidato.requisicion_id
                            ] ||
                            'Sin asignar'
                        ) +
                        '</td>' +

                        '<td>' +
                        escapar(
                            candidato.email ||
                            '-'
                        ) +
                        '<br>' +
                        '<small>' +
                        escapar(
                            candidato.telefono ||
                            ''
                        ) +
                        '</small>' +
                        '</td>' +

                        '<td>' +
                        '<span class="badge">' +
                        escapar(
                            candidato.estado ||
                            'Nuevo'
                        ) +
                        '</span>' +
                        '</td>' +

                        '<td>' +
                        escapar(
                            candidato.fuente ||
                            '-'
                        ) +
                        '</td>' +

                        '<td>' +
                        escapar(fecha) +
                        '</td>' +

                        '</tr>'
                    );
                }
            ).join('');
    }


    // ======================================
    // GUARDAR CANDIDATO
    // ======================================

    async function guardar(event) {

        event.preventDefault();


        var boton =
            document.getElementById(
                'guardarCandidato'
            );


        if (boton) {
            boton.disabled = true;
        }


        try {

            // ==================================
            // USUARIO SUPABASE AUTH
            // ==================================

            var usuarioActual =
                typeof getCurrentUser ===
                'function'
                    ? getCurrentUser()
                    : null;


            if (
                !usuarioActual ||
                !usuarioActual.id
            ) {

                throw new Error(
                    'No existe una sesión válida de Supabase Auth.'
                );
            }


            console.log(
                '👤 Candidato creado por:',
                usuarioActual.email,
                '| UUID:',
                usuarioActual.id
            );


            // ==================================
            // PAYLOAD
            // ==================================

            var payload = {

                nombre:
                    document
                        .getElementById(
                            'candNombre'
                        )
                        .value
                        .trim(),

                email:
                    document
                        .getElementById(
                            'candEmail'
                        )
                        .value
                        .trim() ||
                    null,

                telefono:
                    document
                        .getElementById(
                            'candTelefono'
                        )
                        .value
                        .trim() ||
                    null,

                fuente:
                    document
                        .getElementById(
                            'candFuente'
                        )
                        .value
                        .trim() ||
                    null,

                requisicion_id:
                    document
                        .getElementById(
                            'candRequisicion'
                        )
                        .value
                        ? Number(
                            document
                                .getElementById(
                                    'candRequisicion'
                                )
                                .value
                        )
                        : null,

                estado:
                    document
                        .getElementById(
                            'candEstado'
                        )
                        .value,

                pretension_salarial:
                    document
                        .getElementById(
                            'candSalario'
                        )
                        .value
                        ? Number(
                            document
                                .getElementById(
                                    'candSalario'
                                )
                                .value
                        )
                        : null,

                fecha_entrevista:
                    document
                        .getElementById(
                            'candEntrevista'
                        )
                        .value
                        ? new Date(
                            document
                                .getElementById(
                                    'candEntrevista'
                                )
                                .value
                        ).toISOString()
                        : null,

                notas:
                    document
                        .getElementById(
                            'candNotas'
                        )
                        .value
                        .trim() ||
                    null,

                // ==============================
                // FASE 2
                // ==============================

                created_by:
                    usuarioActual.id,

                reclutador_id:
                    usuarioActual.id
            };


            console.log(
                '📦 Payload candidato:',
                payload
            );


            // ==================================
            // INSERT
            // ==================================

            var resultado =
                await insertarEnSupabase(
                    'candidatos',
                    payload
                );


            if (
                !resultado.success
            ) {

                throw new Error(
                    resultado.error ||
                    'No se pudo guardar el candidato'
                );
            }


            console.log(
                '✅ Candidato creado:',
                resultado.data
            );


            // ==================================
            // LIMPIAR
            // ==================================

            var formulario =
                document.getElementById(
                    'formCandidato'
                );


            if (formulario) {
                formulario.reset();
            }


            mostrarModal(false);


            await cargar();


        } catch (error) {

            console.error(
                '❌ Error guardando candidato:',
                error
            );


            alert(
                'No se pudo guardar el candidato:\n\n' +
                error.message
            );


        } finally {

            if (boton) {
                boton.disabled = false;
            }
        }
    }


    // ======================================
    // INICIALIZACIÓN
    // ======================================

    document.addEventListener(
        'DOMContentLoaded',
        function () {

            var usuario =
                getCurrentUser();


            if (!usuario) {

                window.location.href =
                    '/login.html';

                return;
            }


            if (
                !tienePermiso(
                    'ver_candidatos'
                )
            ) {

                window.location.href =
                    '/dashboard.html';

                return;
            }


            console.log(
                '👤 Candidatos:',
                usuario.email,
                '|',
                usuario.role,
                '|',
                usuario.id
            );


            var btnNuevo =
                document.getElementById(
                    'btnNuevoCandidato'
                );


            if (btnNuevo) {

                btnNuevo.onclick =
                    function () {

                        mostrarModal(true);
                    };
            }


            var cerrar =
                document.getElementById(
                    'cerrarModalCandidato'
                );


            if (cerrar) {

                cerrar.onclick =
                    function () {

                        mostrarModal(false);
                    };
            }


            var cancelar =
                document.getElementById(
                    'cancelarCandidato'
                );


            if (cancelar) {

                cancelar.onclick =
                    function () {

                        mostrarModal(false);
                    };
            }


            var formulario =
                document.getElementById(
                    'formCandidato'
                );


            if (formulario) {

                formulario.addEventListener(
                    'submit',
                    guardar
                );
            }


            var buscar =
                document.getElementById(
                    'buscarCandidato'
                );


            if (buscar) {

                buscar.addEventListener(
                    'input',
                    render
                );
            }


            var filtro =
                document.getElementById(
                    'filtroEstado'
                );


            if (filtro) {

                filtro.addEventListener(
                    'change',
                    render
                );
            }


            cargar()
                .catch(
                    function (error) {

                        console.error(
                            '❌ Error cargando candidatos:',
                            error
                        );


                        var body =
                            document.getElementById(
                                'candidatosBody'
                            );


                        if (body) {

                            body.innerHTML =
                                '<tr>' +
                                '<td colspan="6">' +
                                'Error cargando candidatos.' +
                                '</td>' +
                                '</tr>';
                        }
                    }
                );


            // ==================================
            // REALTIME
            // ==================================

            if (
                typeof suscribirseATabla ===
                'function'
            ) {

                suscribirseATabla(
                    'candidatos',
                    function () {

                        console.log(
                            '🔄 Cambio Realtime candidatos'
                        );

                        cargar();
                    }
                );
            }
        }
    );

})();