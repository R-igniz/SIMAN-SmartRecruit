// ==========================================
// SIMAN SMARTRECRUIT
// NUEVA REQUISICIÓN
// ==========================================

console.log(
    '🚀🚀🚀 nueva-requisicion.js se está ejecutando 🚀🚀🚀'
);

// ==========================================
// VARIABLES GLOBALES
// ==========================================

var currentStep = 1;
var totalSteps = 4;

var datosCargados = false;
var intervaloIntento = null;

var guardandoRequisicion = false;


// ==========================================
// UTILIDADES
// ==========================================

function obtenerElemento(id) {
    return document.getElementById(id);
}


function obtenerValor(id) {

    var elemento = obtenerElemento(id);

    if (!elemento) {
        return '';
    }

    return String(elemento.value || '').trim();
}


// ==========================================
// GENERAR CÓDIGO DE REQUISICIÓN
// ==========================================

function generarCodigoRequisicion() {

    var ahora = new Date();

    var anio =
        String(ahora.getFullYear()).slice(-2);

    var mes =
        String(ahora.getMonth() + 1).padStart(2, '0');

    var dia =
        String(ahora.getDate()).padStart(2, '0');

    var aleatorio =
        Math.floor(1000 + Math.random() * 9000);

    return (
        'R-' +
        anio +
        mes +
        dia +
        '-' +
        aleatorio
    );
}


// ==========================================
// CARGA DE DATOS
// ==========================================

function cargarDatosFormulario() {

    console.log(
        '🔄 cargarDatosFormulario() ejecutado'
    );

    console.log(
        '📊 datosCargados =',
        datosCargados
    );

    if (!datosCargados) {

        console.log(
            '⏳ Esperando datos de configuración...'
        );

        return;
    }

    var data = obtenerDatosConfig();

    console.log(
        '📦 Datos de configuración:',
        data
    );

    if (!data) {

        console.warn(
            '⚠️ Datos no disponibles'
        );

        return;
    }


    // ==========================================
    // COMERCIALES
    // ==========================================

    var comerciales =
        obtenerComerciales();

    console.log(
        '🏢 Comerciales:',
        comerciales
    );

    poblarSelect(
        'centroComercial',
        comerciales,
        'Seleccionar centro...'
    );


    // ==========================================
    // TIENDAS
    // ==========================================

    var tiendas =
        obtenerTiendas();

    console.log(
        '🛒 Tiendas:',
        tiendas
    );

    poblarSelect(
        'tienda',
        tiendas,
        'Seleccionar tienda...',
        true
    );


    // ==========================================
    // DEPARTAMENTOS
    // ==========================================

    var departamentos =
        data.departamentos || [];

    console.log(
        '🏛️ Departamentos:',
        departamentos
    );

    poblarSelect(
        'departamento',
        departamentos,
        'Seleccionar departamento...'
    );


    // ==========================================
    // TIPOS DE CONTRATACIÓN
    // ==========================================

    var tiposContratacion =
        data.tiposContratacion || [];

    console.log(
        '📄 Tipos de contratación:',
        tiposContratacion
    );

    poblarSelect(
        'tipoContratacion',
        tiposContratacion,
        'Seleccionar tipo...'
    );


    // ==========================================
    // PRIORIDADES
    // ==========================================

    var prioridades =
        data.prioridades || [];

    console.log(
        '🚩 Prioridades:',
        prioridades
    );

    poblarSelect(
        'prioridad',
        prioridades,
        'Seleccionar prioridad...'
    );


    // ==========================================
    // MOTIVOS
    // ==========================================

    var motivos =
        data.motivos || [];

    console.log(
        '❓ Motivos:',
        motivos
    );

    poblarSelect(
        'motivo',
        motivos,
        'Seleccionar motivo...'
    );


    // ==========================================
    // RECLUTADORES
    // ==========================================

    var reclutadores =
        obtenerReclutadores();

    console.log(
        '👩‍💼 Reclutadores:',
        reclutadores
    );

    poblarSelect(
        'reclutador',
        reclutadores,
        'Seleccionar reclutador...'
    );


    console.log(
        '✅ Datos cargados correctamente'
    );


    if (intervaloIntento) {

        clearInterval(
            intervaloIntento
        );

        intervaloIntento = null;
    }
}


// ==========================================
// POBLAR SELECT
// ==========================================

function poblarSelect(
    id,
    datos,
    textoDefault,
    esTienda
) {

    var select =
        obtenerElemento(id);

    if (!select) {

        console.warn(
            '⚠️ Select no encontrado:',
            id
        );

        return;
    }


    datos = datos || [];


    console.log(
        '🔽 Poblando select',
        id,
        'con',
        datos.length,
        'elementos'
    );


    select.innerHTML =
        '<option value="">' +
        (textoDefault || 'Seleccionar...') +
        '</option>';


    if (datos.length === 0) {

        select.innerHTML =
            '<option value="">No hay opciones disponibles</option>';

        console.warn(
            '⚠️ No hay datos para',
            id
        );

        return;
    }


    datos.forEach(function (item) {

        var estado =
            item.estado !== undefined
                ? item.estado
                : 'activo';


        if (
            String(estado).toLowerCase() !==
            'activo'
        ) {
            return;
        }


        var option =
            document.createElement(
                'option'
            );


        option.value =
            item.nombre || '';


        option.textContent =
            item.nombre || '';


        if (esTienda) {

            option.dataset.comercial =
                item.comercial || '';
        }


        select.appendChild(
            option
        );
    });


    console.log(
        '✅ Select',
        id,
        'poblado con',
        select.options.length - 1,
        'opciones'
    );
}


// ==========================================
// FILTRAR TIENDAS
// ==========================================

function filtrarTiendasPorComercial() {

    var comercialSelect =
        obtenerElemento(
            'centroComercial'
        );


    if (!comercialSelect) {
        return;
    }


    var comercial =
        comercialSelect.value;


    console.log(
        '🔍 Filtrando tiendas por comercial:',
        comercial
    );


    if (!comercial) {

        poblarSelect(
            'tienda',
            obtenerTiendas(),
            'Seleccionar tienda...',
            true
        );

        return;
    }


    var tiendasFiltradas =
        obtenerTiendasPorComercial(
            comercial
        );


    poblarSelect(
        'tienda',
        tiendasFiltradas,
        'Seleccionar tienda...',
        true
    );
}


// ==========================================
// WIZARD
// ==========================================

function showStep(step) {

    document
        .querySelectorAll(
            '.step-content'
        )
        .forEach(function (elemento) {

            elemento.classList.remove(
                'active'
            );
        });


    var contenido =
        obtenerElemento(
            'step' + step
        );


    if (contenido) {

        contenido.classList.add(
            'active'
        );
    }


    document
        .querySelectorAll(
            '.wizard-steps .step'
        )
        .forEach(function (elemento) {

            var numero =
                parseInt(
                    elemento.dataset.step
                );


            elemento.classList.remove(
                'active'
            );

            elemento.classList.remove(
                'completed'
            );


            if (numero < step) {

                elemento.classList.add(
                    'completed'
                );
            }


            if (numero === step) {

                elemento.classList.add(
                    'active'
                );
            }
        });


    if (step === 4) {

        updateSummary();
    }


    currentStep = step;
}


function nextStep(step) {

    showStep(step);
}


function prevStep(step) {

    showStep(step);
}


// ==========================================
// RESUMEN
// ==========================================

function updateSummary() {

    var resumen = {

        resCentro:
            obtenerValor(
                'centroComercial'
            ) || '-',

        resTienda:
            obtenerValor(
                'tienda'
            ) || '-',

        resDepartamento:
            obtenerValor(
                'departamento'
            ) || '-',

        resPuesto:
            obtenerValor(
                'nombrePuesto'
            ) || '-',

        resCantidad:
            obtenerValor(
                'cantidadPlazas'
            ) || '-',

        resPrioridad:
            obtenerValor(
                'prioridad'
            ) || '-',

        resTipo:
            obtenerValor(
                'tipoContratacion'
            ) || '-',

        resReclutador:
            obtenerValor(
                'reclutador'
            ) || '-'
    };


    Object.keys(
        resumen
    ).forEach(function (id) {

        var elemento =
            obtenerElemento(id);

        if (elemento) {

            elemento.textContent =
                resumen[id];
        }
    });
}


// ==========================================
// VALIDAR FORMULARIO
// ==========================================

function validarRequisicion() {

    var centro =
        obtenerValor(
            'centroComercial'
        );

    var tienda =
        obtenerValor(
            'tienda'
        );

    var departamento =
        obtenerValor(
            'departamento'
        );

    var puesto =
        obtenerValor(
            'nombrePuesto'
        );

    var tipo =
        obtenerValor(
            'tipoContratacion'
        );

    var prioridad =
        obtenerValor(
            'prioridad'
        );

    var reclutador =
        obtenerValor(
            'reclutador'
        );


    if (!centro) {

        alert(
            '⚠️ Seleccione un centro comercial.'
        );

        showStep(1);

        return false;
    }


    if (!tienda) {

        alert(
            '⚠️ Seleccione una tienda.'
        );

        showStep(1);

        return false;
    }


    if (!departamento) {

        alert(
            '⚠️ Seleccione un departamento.'
        );

        showStep(1);

        return false;
    }


    if (!puesto) {

        alert(
            '⚠️ Complete el nombre del puesto.'
        );

        showStep(2);

        return false;
    }


    if (!tipo) {

        alert(
            '⚠️ Seleccione el tipo de contratación.'
        );

        showStep(2);

        return false;
    }


    if (!prioridad) {

        alert(
            '⚠️ Seleccione la prioridad.'
        );

        showStep(3);

        return false;
    }


    if (!reclutador) {

        alert(
            '⚠️ Seleccione un reclutador.'
        );

        showStep(3);

        return false;
    }


    return true;
}


// ==========================================
// CAMBIAR ESTADO DEL BOTÓN
// ==========================================

function cambiarEstadoBotonGuardar(
    guardando
) {

    var botones =
        document.querySelectorAll(
            'button[onclick="submitRequisicion()"]'
        );


    botones.forEach(
        function (boton) {

            boton.disabled =
                guardando;


            if (guardando) {

                boton.dataset.textoOriginal =
                    boton.innerHTML;


                boton.innerHTML =
                    '<i class="fas fa-spinner fa-spin"></i> Guardando...';

            } else {

                boton.innerHTML =
                    boton.dataset.textoOriginal ||
                    'Crear requisición';
            }
        }
    );
}


// ==========================================
// GUARDAR BORRADOR
// ==========================================

function saveDraft() {

    alert(
        '📝 La función de borradores se habilitará posteriormente.'
    );
}


// ==========================================
// CREAR REQUISICIÓN
// ==========================================

async function submitRequisicion() {

    console.log(
        '🚀 Enviando requisición...'
    );


    // Evitar doble envío
    if (guardandoRequisicion) {

        console.warn(
            '⚠️ Ya existe una requisición en proceso de guardado.'
        );

        return;
    }


    // ==========================================
    // VALIDACIÓN
    // ==========================================

    if (!validarRequisicion()) {

        return;
    }


    var usuario =
        typeof getCurrentUser ===
        'function'
            ? getCurrentUser()
            : null;


    if (!usuario) {

        alert(
            '❌ La sesión ha expirado. Inicie sesión nuevamente.'
        );

        window.location.href =
            '/login.html';

        return;
    }


    // ==========================================
    // GENERAR CÓDIGO
    // ==========================================

    var codigo =
        generarCodigoRequisicion();


    // ==========================================
    // OBJETO PARA SUPABASE
    //
    // IMPORTANTE:
    // Los nombres corresponden a las columnas
    // reales de public.requisiciones.
    // ==========================================

    var requisicionSupabase = {

        codigo:
            codigo,

        puesto:
            obtenerValor(
                'nombrePuesto'
            ),

        centro:
            obtenerValor(
                'centroComercial'
            ),

        tienda:
            obtenerValor(
                'tienda'
            ),

        departamento:
            obtenerValor(
                'departamento'
            ),

        tipo_contratacion:
            obtenerValor(
                'tipoContratacion'
            ),

        motivo:
            obtenerValor(
                'motivo'
            ),

        reclutador:
            obtenerValor(
                'reclutador'
            ),

        prioridad:
            obtenerValor(
                'prioridad'
            ) || 'Media',

        estado:
            'Nueva',

        fecha:
            obtenerValor(
                'fecha'
            ) ||
            new Date()
                .toISOString()
                .split('T')[0],

        cantidad:
            parseInt(
                obtenerValor(
                    'cantidadPlazas'
                ),
                10
            ) || 1,

        created_by:
            usuario.username ||
            usuario.email ||
            usuario.name ||
            'Sistema',

        created_at:
            new Date()
                .toISOString(),

        updated_at:
            new Date()
                .toISOString()
    };


    console.log(
        '📝 Datos para Supabase:',
        requisicionSupabase
    );


    // ==========================================
    // NO ENVIAMOS "id"
    // ==========================================
    //
    // Supabase debe generar el BIGINT.
    //
    // El código visible de negocio es:
    //
    // R-260917-1234
    //
    // y se guarda en "codigo".
    // ==========================================


    if (
        typeof guardarEnSupabase !==
        'function'
    ) {

        console.error(
            '❌ guardarEnSupabase() no está disponible.'
        );

        alert(
            '❌ No fue posible conectar con Supabase.'
        );

        return;
    }


    guardandoRequisicion =
        true;


    cambiarEstadoBotonGuardar(
        true
    );


    try {

        console.log(
            '☁️ Guardando requisición en Supabase...'
        );


        var resultado =
            await guardarEnSupabase(
                'requisiciones',
                requisicionSupabase
            );


        // ==========================================
        // VALIDAR RESPUESTA
        // ==========================================

        if (
            !resultado ||
            resultado.success !== true
        ) {

            throw new Error(
                resultado &&
                resultado.error
                    ? resultado.error
                    : 'Supabase no confirmó el guardado.'
            );
        }


        console.log(
            '✅ Requisición guardada correctamente en Supabase'
        );


        // ==========================================
        // CACHÉ LOCAL
        // ==========================================
        //
        // localStorage YA NO es la fuente principal.
        // Solo guardamos una copia después de que
        // Supabase confirmó el INSERT/UPSERT.
        // ==========================================

        var requisicionLocal =
            Object.assign(
                {},
                requisicionSupabase,
                {
                    // Compatibilidad con módulos
                    // antiguos del frontend
                    tipoContratacion:
                        requisicionSupabase
                            .tipo_contratacion,

                    fechaCreacion:
                        requisicionSupabase
                            .created_at
                }
            );


        var requisiciones =
            JSON.parse(
                localStorage.getItem(
                    'requisiciones_data'
                ) || '[]'
            );


        requisiciones.unshift(
            requisicionLocal
        );


        localStorage.setItem(
            'requisiciones_data',
            JSON.stringify(
                requisiciones
            )
        );


        console.log(
            '💾 Caché local actualizada'
        );


        // ==========================================
        // NOTIFICACIÓN
        // ==========================================

        if (
            typeof agregarNotificacion ===
            'function'
        ) {

            agregarNotificacion(
                'success',
                '✅ Requisición ' +
                    codigo +
                    ' creada correctamente',
                '/requisiciones.html'
            );
        }


        // ==========================================
        // MODAL DE ÉXITO
        // ==========================================

        var modal =
            obtenerElemento(
                'successModal'
            );


        var modalMessage =
            obtenerElemento(
                'modalMessage'
            );


        if (modalMessage) {

            modalMessage.textContent =
                '✅ ' +
                codigo +
                ' creada correctamente. Asignada a: ' +
                (
                    requisicionSupabase.reclutador ||
                    'No asignado'
                );
        }


        if (modal) {

            modal.classList.add(
                'show'
            );

        } else {

            alert(
                '✅ Requisición ' +
                codigo +
                ' creada correctamente.'
            );

            window.location.href =
                '/requisiciones.html';
        }


    } catch (error) {

        // ==========================================
        // ERROR
        // ==========================================

        console.error(
            '❌ Error creando requisición:',
            error
        );


        if (
            typeof agregarNotificacion ===
            'function'
        ) {

            agregarNotificacion(
                'danger',
                '❌ No se pudo crear la requisición: ' +
                    error.message,
                '#'
            );
        }


        alert(
            '❌ No se pudo crear la requisición.\n\n' +
            error.message
        );


    } finally {

        guardandoRequisicion =
            false;


        cambiarEstadoBotonGuardar(
            false
        );
    }
}


// ==========================================
// CERRAR MODAL
// ==========================================

function closeModal() {

    var modal =
        obtenerElemento(
            'successModal'
        );


    if (modal) {

        modal.classList.remove(
            'show'
        );
    }


    window.location.href =
        '/requisiciones.html';
}


// ==========================================
// INICIALIZACIÓN
// ==========================================

function iniciarNuevaRequisicion() {

    console.log(
        '🚀 iniciarNuevaRequisicion() llamada'
    );


    var data =
        obtenerDatosConfig();


    // ==========================================
    // DATOS YA DISPONIBLES
    // ==========================================

    if (
        data &&
        data.comerciales &&
        data.comerciales.length > 0
    ) {

        console.log(
            '📦 Datos ya disponibles, cargando...'
        );

        datosCargados =
            true;

        cargarDatosFormulario();

        return;
    }


    console.log(
        '⏳ Datos no disponibles, esperando...'
    );


    // ==========================================
    // INTENTAR SUPABASE
    // ==========================================

    if (
        typeof initSupabaseData ===
        'function'
    ) {

        console.log(
            '🔄 Intentando cargar desde Supabase...'
        );


        initSupabaseData()

            .then(function (result) {

                if (result) {

                    console.log(
                        '✅ Datos cargados desde Supabase'
                    );

                    datosCargados =
                        true;

                    cargarDatosFormulario();

                } else {

                    console.warn(
                        '⚠️ No se cargaron datos desde Supabase'
                    );
                }
            })

            .catch(function (error) {

                console.error(
                    '❌ Error cargando desde Supabase:',
                    error
                );
            });
    }


    // ==========================================
    // REINTENTAR
    // ==========================================

    if (intervaloIntento) {

        clearInterval(
            intervaloIntento
        );
    }


    var intentos = 0;


    intervaloIntento =
        setInterval(
            function () {

                intentos++;


                var datos =
                    obtenerDatosConfig();


                if (
                    datos &&
                    datos.comerciales &&
                    datos.comerciales.length > 0
                ) {

                    clearInterval(
                        intervaloIntento
                    );

                    intervaloIntento =
                        null;


                    datosCargados =
                        true;


                    cargarDatosFormulario();


                    console.log(
                        '✅ Datos disponibles después de',
                        intentos,
                        'intentos'
                    );


                } else if (
                    intentos > 30
                ) {

                    clearInterval(
                        intervaloIntento
                    );

                    intervaloIntento =
                        null;


                    console.warn(
                        '⚠️ No se pudieron cargar los datos después de 15 segundos'
                    );


                    alert(
                        '⚠️ No se pudieron cargar los datos de configuración. Recarga la página o intenta más tarde.'
                    );
                }

            },
            500
        );
}


// ==========================================
// DOM CONTENT LOADED
// ==========================================

document.addEventListener(
    'DOMContentLoaded',
    function () {

        console.log(
            '🚀 DOMContentLoaded - nueva-requisicion.js'
        );


        // ==========================================
        // USUARIO
        // ==========================================

        var user =
            getCurrentUser();


        if (!user) {

            window.location.href =
                '/login.html';

            return;
        }


        // ==========================================
        // PERMISO
        // ==========================================

        if (
            !tienePermiso(
                'crear_requisicion'
            )
        ) {

            console.warn(
                '⛔ Acceso denegado'
            );

            window.location.href =
                '/dashboard.html';

            return;
        }


        console.log(
            '👤 Nueva requisición para:',
            user.name ||
            user.username
        );


        // ==========================================
        // EVENTO CONFIGURACIÓN
        // ==========================================

        window.addEventListener(
            'datosConfiguracionListos',
            function () {

                console.log(
                    '📢 Recibido evento datosConfiguracionListos'
                );


                datosCargados =
                    true;


                cargarDatosFormulario();
            }
        );


        // ==========================================
        // INICIAR
        // ==========================================

        iniciarNuevaRequisicion();


        // ==========================================
        // FILTRAR TIENDAS
        // ==========================================

        var centroSelect =
            obtenerElemento(
                'centroComercial'
            );


        if (centroSelect) {

            centroSelect.addEventListener(
                'change',
                filtrarTiendasPorComercial
            );
        }


        // ==========================================
        // FECHA POR DEFECTO
        // ==========================================

        var fechaInput =
            obtenerElemento(
                'fecha'
            );


        if (
            fechaInput &&
            !fechaInput.value
        ) {

            fechaInput.value =
                new Date()
                    .toISOString()
                    .split('T')[0];
        }


        // ==========================================
        // MODAL
        // ==========================================

        var modal =
            obtenerElemento(
                'successModal'
            );


        if (modal) {

            modal.addEventListener(
                'click',
                function (event) {

                    if (
                        event.target ===
                        modal
                    ) {

                        closeModal();
                    }
                }
            );
        }


        // ==========================================
        // PASO INICIAL
        // ==========================================

        showStep(1);


        console.log(
            '✅ Nueva requisición inicializada'
        );
    }
);


// ==========================================
// CAMBIOS ENTRE PESTAÑAS
// ==========================================

window.addEventListener(
    'storage',
    function (event) {

        if (
            event.key ===
            'siman_config_data'
        ) {

            console.log(
                '🔄 Configuración actualizada desde otra pestaña'
            );


            if (datosCargados) {

                cargarDatosFormulario();
            }
        }
    }
);


// ==========================================
// EXPORTAR FUNCIONES
// ==========================================

window.cargarDatosFormulario =
    cargarDatosFormulario;

window.filtrarTiendasPorComercial =
    filtrarTiendasPorComercial;

window.nextStep =
    nextStep;

window.prevStep =
    prevStep;

window.submitRequisicion =
    submitRequisicion;

window.saveDraft =
    saveDraft;

window.closeModal =
    closeModal;