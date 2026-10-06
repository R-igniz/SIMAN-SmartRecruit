// ============================================================
// SIMAN SMARTRECRUIT
// NUEVA-REQUISICION.JS - FASE 3
// SUPABASE + RLS + CATÁLOGOS REALES
// ============================================================

console.log('🚀 nueva-requisicion.js Fase 3');

var currentStep = 1;
var totalSteps = 4;

var datosCargados = false;
var guardandoRequisicion = false;


// ============================================================
// UTILIDADES
// ============================================================

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


function obtenerTextoSeleccionado(id) {

    var select = obtenerElemento(id);

    if (!select) {
        return '';
    }

    var option =
        select.options[
            select.selectedIndex
        ];

    return option
        ? String(option.textContent || '').trim()
        : '';
}


function escapeHtml(valor) {

    return String(valor || '')
        .replace(
            /[&<>"']/g,
            function(caracter) {

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


// ============================================================
// POBLAR SELECT
// ============================================================

function poblarSelect(
    id,
    datos,
    textoDefault,
    opciones
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


    datos =
        Array.isArray(datos)
            ? datos
            : [];


    opciones =
        opciones || {};


    select.innerHTML = '';


    var optionDefault =
        document.createElement('option');

    optionDefault.value = '';

    optionDefault.textContent =
        textoDefault ||
        'Seleccionar...';

    select.appendChild(
        optionDefault
    );


    datos.forEach(
        function(item) {

            if (
                item.activo === false
            ) {
                return;
            }


            var option =
                document.createElement(
                    'option'
                );


            /*
             * Para mantener compatibilidad con
             * requisiciones, guardamos el nombre
             * como value en catálogos normales.
             */

            option.value =
                item.nombre ||
                item.name ||
                '';


            option.textContent =
                item.nombre ||
                item.name ||
                item.email ||
                'Sin nombre';


            if (item.id !== undefined) {

                option.dataset.id =
                    String(item.id);
            }


            if (
                item.uuid !== undefined
            ) {

                option.dataset.uuid =
                    String(item.uuid);
            }


            if (
                item.centro_comercial_id !==
                undefined &&
                item.centro_comercial_id !==
                null
            ) {

                option.dataset.centroId =
                    String(
                        item.centro_comercial_id
                    );
            }


            if (item.comercial) {

                option.dataset.comercial =
                    item.comercial;
            }


            if (item.centro) {

                option.dataset.centro =
                    item.centro;
            }


            if (item.email) {

                option.dataset.email =
                    item.email;
            }


            if (item.role_code) {

                option.dataset.role =
                    item.role_code;
            }


            select.appendChild(
                option
            );
        }
    );
}


// ============================================================
// POBLAR RECLUTADORES
// ============================================================

function poblarReclutadores(
    reclutadores
) {

    var select =
        obtenerElemento(
            'reclutador'
        );


    if (!select) {
        return;
    }


    select.innerHTML =
        '<option value="">' +
        'Seleccionar reclutador...' +
        '</option>';


    (reclutadores || [])
        .forEach(
            function(reclutador) {

                if (
                    reclutador.activo ===
                    false
                ) {
                    return;
                }


                var option =
                    document.createElement(
                        'option'
                    );


                /*
                 * El value continúa siendo el
                 * nombre para compatibilidad.
                 *
                 * El UUID real queda guardado
                 * en data-uuid.
                 */

                option.value =
                    reclutador.nombre ||
                    reclutador.name ||
                    reclutador.email ||
                    '';


                option.textContent =
                    reclutador.nombre ||
                    reclutador.name ||
                    reclutador.email ||
                    'Sin nombre';


                option.dataset.uuid =
                    reclutador.uuid ||
                    reclutador.id ||
                    '';


                option.dataset.email =
                    reclutador.email ||
                    '';


                option.dataset.role =
                    reclutador.role_code ||
                    '';


                select.appendChild(
                    option
                );
            }
        );
}


// ============================================================
// CARGAR DATOS DEL FORMULARIO
// ============================================================

function cargarDatosFormulario() {

    console.log(
        '🔄 cargarDatosFormulario() Fase 3'
    );


    var data =
        typeof obtenerDatosConfig ===
        'function'
            ? obtenerDatosConfig()
            : null;


    if (!data) {

        console.warn(
            '⚠️ Configuración no disponible'
        );

        return false;
    }


    var comerciales =
        typeof obtenerComerciales ===
        'function'
            ? obtenerComerciales()
            : [];


    var tiendas =
        typeof obtenerTiendas ===
        'function'
            ? obtenerTiendas()
            : [];


    var departamentos =
        typeof obtenerDepartamentos ===
        'function'
            ? obtenerDepartamentos()
            : [];


    var tipos =
        typeof obtenerTiposContratacion ===
        'function'
            ? obtenerTiposContratacion()
            : [];


    var prioridades =
        typeof obtenerPrioridades ===
        'function'
            ? obtenerPrioridades()
            : [];


    var motivos =
        typeof obtenerMotivos ===
        'function'
            ? obtenerMotivos()
            : [];


    var reclutadores =
        typeof obtenerReclutadores ===
        'function'
            ? obtenerReclutadores()
            : [];


    console.log(
        '🏢 Centros:',
        comerciales.length
    );

    console.log(
        '🛒 Tiendas:',
        tiendas.length
    );

    console.log(
        '🏛️ Departamentos:',
        departamentos.length
    );

    console.log(
        '📄 Tipos:',
        tipos.length
    );

    console.log(
        '🚩 Prioridades:',
        prioridades.length
    );

    console.log(
        '❓ Motivos:',
        motivos.length
    );

    console.log(
        '👩‍💼 Reclutadores:',
        reclutadores.length
    );


    poblarSelect(
        'centroComercial',
        comerciales,
        'Seleccionar centro...'
    );


    /*
     * Inicialmente no mostramos todas las
     * tiendas. Primero se selecciona centro.
     */

    poblarSelect(
        'tienda',
        [],
        'Primero seleccione un centro...'
    );


    poblarSelect(
        'departamento',
        departamentos,
        'Seleccionar departamento...'
    );


    poblarSelect(
        'tipoContratacion',
        tipos,
        'Seleccionar tipo...'
    );


    poblarSelect(
        'prioridad',
        prioridades,
        'Seleccionar prioridad...'
    );


    poblarSelect(
        'motivo',
        motivos,
        'Seleccionar motivo...'
    );


    poblarReclutadores(
        reclutadores
    );


    datosCargados = true;


    console.log(
        '✅ Formulario conectado a catálogos Supabase'
    );


    return true;
}


// ============================================================
// FILTRAR TIENDAS POR CENTRO
// ============================================================

function filtrarTiendasPorComercial() {

    var selectCentro =
        obtenerElemento(
            'centroComercial'
        );


    if (!selectCentro) {
        return;
    }


    var nombreCentro =
        selectCentro.value;


    var optionCentro =
        selectCentro.options[
            selectCentro.selectedIndex
        ];


    var centroId =
        optionCentro &&
        optionCentro.dataset
            ? optionCentro.dataset.id
            : null;


    if (!nombreCentro) {

        poblarSelect(
            'tienda',
            [],
            'Primero seleccione un centro...'
        );

        return;
    }


    var tiendas =
        typeof obtenerTiendas ===
        'function'
            ? obtenerTiendas()
            : [];


    var filtradas =
        tiendas.filter(
            function(tienda) {

                /*
                 * Primero usamos la FK.
                 */

                if (
                    centroId &&
                    tienda.centro_comercial_id !==
                    undefined &&
                    tienda.centro_comercial_id !==
                    null &&
                    String(
                        tienda.centro_comercial_id
                    ) ===
                    String(
                        centroId
                    )
                ) {

                    return true;
                }


                /*
                 * Compatibilidad temporal con
                 * columna comercial anterior.
                 */

                var centroTienda =
                    tienda.comercial ||
                    tienda.centro ||
                    '';


                return (
                    String(centroTienda)
                        .trim()
                        .toLowerCase()
                    ===
                    String(nombreCentro)
                        .trim()
                        .toLowerCase()
                );
            }
        );


    console.log(
        '🔍 Centro:',
        nombreCentro,
        '| ID:',
        centroId,
        '| Tiendas:',
        filtradas.length
    );


    poblarSelect(
        'tienda',
        filtradas,
        filtradas.length
            ? 'Seleccionar tienda...'
            : 'Sin tiendas asociadas'
    );
}


// ============================================================
// WIZARD
// ============================================================

function showStep(step) {

    step =
        parseInt(
            step,
            10
        );


    if (
        isNaN(step) ||
        step < 1
    ) {
        step = 1;
    }


    if (step > totalSteps) {
        step = totalSteps;
    }


    document
        .querySelectorAll(
            '.step-content'
        )
        .forEach(
            function(elemento) {

                elemento.classList
                    .remove('active');
            }
        );


    var contenido =
        obtenerElemento(
            'step' + step
        );


    if (contenido) {

        contenido.classList
            .add('active');
    }


    document
        .querySelectorAll(
            '.wizard-steps .step'
        )
        .forEach(
            function(elemento) {

                var numero =
                    parseInt(
                        elemento.dataset.step,
                        10
                    );


                elemento.classList.remove(
                    'active',
                    'completed'
                );


                if (numero < step) {

                    elemento.classList
                        .add(
                            'completed'
                        );
                }


                if (numero === step) {

                    elemento.classList
                        .add(
                            'active'
                        );
                }
            }
        );


    currentStep =
        step;


    if (step === 4) {

        updateSummary();
    }
}


function nextStep(step) {

    showStep(step);
}


function prevStep(step) {

    showStep(step);
}


// ============================================================
// RESUMEN
// ============================================================

function updateSummary() {

    var resumen = {

        resCentro:
            obtenerTextoSeleccionado(
                'centroComercial'
            ) || '-',

        resTienda:
            obtenerTextoSeleccionado(
                'tienda'
            ) || '-',

        resDepartamento:
            obtenerTextoSeleccionado(
                'departamento'
            ) || '-',

        resPuesto:
            obtenerValor(
                'nombrePuesto'
            ) || '-',

        resCantidad:
            obtenerValor(
                'cantidadPlazas'
            ) || '1',

        resPrioridad:
            obtenerTextoSeleccionado(
                'prioridad'
            ) || '-',

        resTipo:
            obtenerTextoSeleccionado(
                'tipoContratacion'
            ) || '-',

        resReclutador:
            obtenerTextoSeleccionado(
                'reclutador'
            ) || '-'
    };


    Object.keys(resumen)
        .forEach(
            function(id) {

                var elemento =
                    obtenerElemento(id);


                if (elemento) {

                    elemento.textContent =
                        resumen[id];
                }
            }
        );
}


// ============================================================
// VALIDACIÓN
// ============================================================

function validarFormulario() {

    var errores = [];


    if (
        !obtenerValor(
            'centroComercial'
        )
    ) {

        errores.push(
            'Seleccione un centro comercial.'
        );
    }


    if (
        !obtenerValor(
            'tienda'
        )
    ) {

        errores.push(
            'Seleccione una tienda.'
        );
    }


    if (
        !obtenerValor(
            'departamento'
        )
    ) {

        errores.push(
            'Seleccione un departamento.'
        );
    }


    if (
        !obtenerValor(
            'nombrePuesto'
        )
    ) {

        errores.push(
            'Ingrese el nombre del puesto.'
        );
    }


    var cantidad =
        parseInt(
            obtenerValor(
                'cantidadPlazas'
            ),
            10
        );


    if (
        isNaN(cantidad) ||
        cantidad < 1
    ) {

        errores.push(
            'La cantidad de plazas debe ser mayor a 0.'
        );
    }


    if (
        !obtenerValor(
            'tipoContratacion'
        )
    ) {

        errores.push(
            'Seleccione el tipo de contratación.'
        );
    }


    if (
        !obtenerValor(
            'prioridad'
        )
    ) {

        errores.push(
            'Seleccione una prioridad.'
        );
    }


    if (
        !obtenerValor(
            'motivo'
        )
    ) {

        errores.push(
            'Seleccione el motivo de la requisición.'
        );
    }


    return errores;
}


// ============================================================
// GENERAR CÓDIGO
// ============================================================

function generarCodigoRequisicion() {

    var ahora =
        new Date();


    var fecha =
        String(
            ahora.getFullYear()
        ).slice(-2) +

        String(
            ahora.getMonth() + 1
        ).padStart(2, '0') +

        String(
            ahora.getDate()
        ).padStart(2, '0');


    var hora =
        String(
            ahora.getHours()
        ).padStart(2, '0') +

        String(
            ahora.getMinutes()
        ).padStart(2, '0') +

        String(
            ahora.getSeconds()
        ).padStart(2, '0');


    var aleatorio =
        Math.floor(
            10 +
            Math.random() * 90
        );


    return (
        'R-' +
        fecha +
        '-' +
        hora +
        aleatorio
    );
}


// ============================================================
// OBTENER RECLUTADOR SELECCIONADO
// ============================================================

function obtenerReclutadorSeleccionado(
    user
) {

    var select =
        obtenerElemento(
            'reclutador'
        );


    if (!select) {

        return {
            nombre:
                user.nombre ||
                user.name ||
                user.email,

            uuid:
                user.id,

            email:
                user.email
        };
    }


    var option =
        select.options[
            select.selectedIndex
        ];


    /*
     * Si no seleccionaron reclutador,
     * asignamos al creador.
     */

    if (
        !option ||
        !select.value
    ) {

        return {
            nombre:
                user.nombre ||
                user.name ||
                user.email,

            uuid:
                user.id,

            email:
                user.email
        };
    }


    return {

        nombre:
            select.value,

        uuid:
            option.dataset.uuid ||
            user.id,

        email:
            option.dataset.email ||
            ''
    };
}


// ============================================================
// CREAR REQUISICIÓN
// ============================================================

async function submitRequisicion() {

    if (guardandoRequisicion) {

        console.warn(
            '⚠️ La requisición ya se está guardando'
        );

        return;
    }


    console.log(
        '🚀 Creando requisición Fase 3...'
    );


    // ========================================================
    // VALIDAR
    // ========================================================

    var errores =
        validarFormulario();


    if (errores.length) {

        alert(
            '⚠️ Revise la información:\n\n' +
            errores.join('\n')
        );

        return;
    }


    // ========================================================
    // SESIÓN REAL
    // ========================================================

    var user = null;


    if (
        typeof requireAuth ===
        'function'
    ) {

        user =
            await requireAuth();

    } else if (
        typeof getCurrentUser ===
        'function'
    ) {

        user =
            getCurrentUser();
    }


    if (
        !user ||
        !user.id ||
        !user.email
    ) {

        console.error(
            '❌ Sesión Supabase inválida'
        );


        alert(
            'Su sesión no es válida. Inicie sesión nuevamente.'
        );


        window.location.href =
            '/login.html';


        return;
    }


    // ========================================================
    // RECLUTADOR
    // ========================================================

    var reclutador =
        obtenerReclutadorSeleccionado(
            user
        );


    // ========================================================
    // DATOS
    // ========================================================

    var ahora =
        new Date();


    var fecha =
        obtenerValor('fecha') ||
        ahora
            .toISOString()
            .slice(0, 10);


    var cantidad =
        parseInt(
            obtenerValor(
                'cantidadPlazas'
            ),
            10
        );


    var codigo =
        generarCodigoRequisicion();


    var requisicion = {

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
            ) || null,

        departamento:
            obtenerValor(
                'departamento'
            ) || null,

        fecha:
            fecha,

        cantidad:
            cantidad,

        tipo_contratacion:
            obtenerValor(
                'tipoContratacion'
            ) || null,

        prioridad:
            obtenerValor(
                'prioridad'
            ) || null,

        motivo:
            obtenerValor(
                'motivo'
            ) || null,

        reclutador:
            reclutador.nombre,

        estado:
            'Nueva',

        created_by:
            user.email,

        created_by_uuid:
            user.id,

        /*
         * CORRECCIÓN IMPORTANTE:
         *
         * Ahora reclutador_id es realmente
         * el UUID de la reclutadora seleccionada.
         */

        reclutador_id:
            reclutador.uuid,

        created_at:
            ahora.toISOString(),

        updated_at:
            ahora.toISOString()
    };


    console.log(
        '📦 Payload Supabase:',
        requisicion
    );


    console.log(
        '👤 Creador:',
        user.email,
        '|',
        user.id
    );


    console.log(
        '👩‍💼 Reclutador asignado:',
        reclutador.nombre,
        '|',
        reclutador.uuid
    );


    // ========================================================
    // INSERT SUPABASE
    // ========================================================

    guardandoRequisicion =
        true;


    window.__guardandoRequisicion =
        true;


    try {

        if (
            typeof insertarEnSupabase !==
            'function'
        ) {

            throw new Error(
                'insertarEnSupabase no está disponible.'
            );
        }


        var resultado =
            await insertarEnSupabase(
                'requisiciones',
                requisicion
            );


        if (
            !resultado ||
            !resultado.success
        ) {

            throw new Error(
                resultado &&
                resultado.error
                    ? resultado.error
                    : 'Supabase no confirmó la creación.'
            );
        }


        var guardada =
            resultado.data &&
            resultado.data.length
                ? resultado.data[0]
                : requisicion;


        /*
         * IMPORTANTE:
         *
         * NO guardamos requisiciones en
         * localStorage.
         *
         * Supabase es la única fuente.
         */


        console.log(
            '✅ Requisición creada en Supabase:',
            guardada
        );


        // ====================================================
        // NOTIFICACIÓN
        // ====================================================

        if (
            typeof agregarNotificacion ===
            'function'
        ) {

            try {

                agregarNotificacion(
                    'success',

                    'Requisición ' +
                    codigo +
                    ' creada',

                    '/requisiciones.html'
                );

            } catch (errorNotificacion) {

                console.warn(
                    '⚠️ No se pudo generar notificación:',
                    errorNotificacion
                );
            }
        }


        // ====================================================
        // MODAL
        // ====================================================

        var modal =
            obtenerElemento(
                'successModal'
            );


        if (modal) {

            modal.classList.add(
                'show'
            );
        }


        var mensaje =
            obtenerElemento(
                'modalMessage'
            );


        if (mensaje) {

            mensaje.textContent =
                '✅ ' +
                codigo +
                ' creada correctamente y asignada a ' +
                reclutador.nombre +
                '.';
        }


        /*
         * Si el HTML no tiene modal,
         * redireccionamos directamente.
         */

        if (!modal) {

            alert(
                '✅ Requisición ' +
                codigo +
                ' creada correctamente.'
            );


            window.location.href =
                '/requisiciones.html';
        }


    } catch (error) {

        console.error(
            '❌ Error creando requisición:',
            error
        );


        alert(
            '❌ No se pudo crear la requisición.\n\n' +
            (
                error.message ||
                String(error)
            )
        );


    } finally {

        guardandoRequisicion =
            false;


        window.__guardandoRequisicion =
            false;
    }
}


// ============================================================
// BORRADOR
// ============================================================

function saveDraft() {

    /*
     * Fase 3:
     * No guardamos borradores falsos en
     * localStorage.
     *
     * Posteriormente crearemos tabla
     * borradores_requisicion si se requiere.
     */

    alert(
        'ℹ️ La función de borrador será conectada a Supabase en la siguiente etapa.'
    );
}


// ============================================================
// CERRAR MODAL
// ============================================================

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


// ============================================================
// INICIALIZAR
// ============================================================

async function iniciarNuevaRequisicion() {

    console.log(
        '🚀 Inicializando Nueva Requisición Fase 3'
    );


    try {

        /*
         * Configuración Fase 3 tiene su propia
         * promesa de carga.
         */

        if (
            typeof cargarConfiguracionSupabase ===
            'function'
        ) {

            await cargarConfiguracionSupabase();
        }


        cargarDatosFormulario();


        console.log(
            '✅ Nueva Requisición Fase 3 inicializada'
        );


    } catch (error) {

        console.error(
            '❌ Error inicializando Nueva Requisición:',
            error
        );


        alert(
            'No se pudieron cargar los catálogos de configuración.'
        );
    }
}


// ============================================================
// EVENTO CONFIGURACIÓN
// ============================================================

window.addEventListener(
    'datosConfiguracionListos',
    function() {

        console.log(
            '📢 Configuración actualizada'
        );


        cargarDatosFormulario();
    }
);


// ============================================================
// EXPORTAR FUNCIONES PARA HTML
// ============================================================

window.showStep =
    showStep;

window.nextStep =
    nextStep;

window.prevStep =
    prevStep;

window.updateSummary =
    updateSummary;

window.saveDraft =
    saveDraft;

window.submitRequisicion =
    submitRequisicion;

window.closeModal =
    closeModal;

window.filtrarTiendasPorComercial =
    filtrarTiendasPorComercial;


// ============================================================
// DOM READY
// ============================================================

document.addEventListener(
    'DOMContentLoaded',
    async function() {

        console.log(
            '🚀 DOMContentLoaded Nueva Requisición Fase 3'
        );


        // ====================================================
        // PERMISO
        // ====================================================

        var user = null;


        try {

            if (
                typeof requireAuth ===
                'function'
            ) {

                user =
                    await requireAuth();

            } else if (
                typeof getCurrentUser ===
                'function'
            ) {

                user =
                    getCurrentUser();
            }


        } catch (error) {

            console.error(
                '❌ Error verificando sesión:',
                error
            );

            return;
        }


        if (!user) {
            return;
        }


        if (
            typeof tienePermiso ===
                'function' &&
            !tienePermiso(
                'crear_requisicion'
            )
        ) {

            console.warn(
                '⛔ Sin permiso para crear requisiciones'
            );


            window.location.href =
                '/dashboard.html';


            return;
        }


        console.log(
            '👤 Usuario:',
            user.email,
            '|',
            user.role,
            '|',
            user.id
        );


        // ====================================================
        // CENTRO → TIENDAS
        // ====================================================

        var centro =
            obtenerElemento(
                'centroComercial'
            );


        if (centro) {

            centro.addEventListener(
                'change',
                filtrarTiendasPorComercial
            );
        }


        // ====================================================
        // FORM
        // ====================================================

        var formulario =
            obtenerElemento(
                'requisicionForm'
            );


        if (formulario) {

            formulario.addEventListener(
                'submit',
                function(event) {

                    event.preventDefault();

                    submitRequisicion();
                }
            );
        }


        // ====================================================
        // INICIAR
        // ====================================================

        await iniciarNuevaRequisicion();


        showStep(1);
    }
);


console.log(
    '✅ nueva-requisicion.js Fase 3 cargado'
);
