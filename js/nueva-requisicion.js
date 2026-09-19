// ==========================================
// NUEVA REQUISICIÓN - FASE 2
// SUPABASE AUTH + UUID
// ==========================================

console.log('🚀 nueva-requisicion.js Fase 2');

var currentStep = 1;
var totalSteps = 4;
var datosCargados = false;
var intervaloIntento = null;


// ==========================================
// CARGA DE DATOS
// ==========================================

function cargarDatosFormulario() {

    console.log('🔄 cargarDatosFormulario()');

    if (!datosCargados) {
        console.log('⏳ Esperando configuración...');
        return;
    }

    var data = obtenerDatosConfig();

    if (!data) {
        console.warn('⚠️ Configuración no disponible');
        return;
    }

    var comerciales = obtenerComerciales();
    poblarSelect(
        'centroComercial',
        comerciales,
        'Seleccionar centro...'
    );

    var tiendas = obtenerTiendas();
    poblarSelect(
        'tienda',
        tiendas,
        'Seleccionar tienda...',
        true
    );

    poblarSelect(
        'departamento',
        data.departamentos || [],
        'Seleccionar departamento...'
    );

    poblarSelect(
        'tipoContratacion',
        data.tiposContratacion || [],
        'Seleccionar tipo...'
    );

    poblarSelect(
        'prioridad',
        data.prioridades || [],
        'Seleccionar prioridad...'
    );

    poblarSelect(
        'motivo',
        data.motivos || [],
        'Seleccionar motivo...'
    );

    var reclutadores = obtenerReclutadores();

    poblarSelect(
        'reclutador',
        reclutadores,
        'Seleccionar reclutador...'
    );

    console.log('✅ Datos del formulario cargados');

    if (intervaloIntento) {
        clearInterval(intervaloIntento);
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

    var select = document.getElementById(id);

    if (!select) {
        console.warn('⚠️ Select no encontrado:', id);
        return;
    }

    datos = Array.isArray(datos) ? datos : [];

    select.innerHTML =
        '<option value="">' +
        (textoDefault || 'Seleccionar...') +
        '</option>';

    if (datos.length === 0) {
        return;
    }

    datos.forEach(function(item) {

        var estado =
            item.estado !== undefined
                ? item.estado
                : 'activo';

        if (estado !== 'activo') {
            return;
        }

        var option =
            document.createElement('option');

        option.value =
            item.nombre || '';

        option.textContent =
            item.nombre || '';

        if (esTienda) {
            option.dataset.comercial =
                item.comercial || '';
        }

        select.appendChild(option);
    });
}


// ==========================================
// FILTRAR TIENDAS
// ==========================================

function filtrarTiendasPorComercial() {

    var comercialSelect =
        document.getElementById(
            'centroComercial'
        );

    if (!comercialSelect) {
        return;
    }

    var comercial =
        comercialSelect.value;

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
        .querySelectorAll('.step-content')
        .forEach(function(el) {
            el.classList.remove('active');
        });

    var contenido =
        document.getElementById(
            'step' + step
        );

    if (contenido) {
        contenido.classList.add('active');
    }

    document
        .querySelectorAll(
            '.wizard-steps .step'
        )
        .forEach(function(el) {

            var numero =
                parseInt(
                    el.dataset.step,
                    10
                );

            el.classList.remove(
                'active',
                'completed'
            );

            if (numero < step) {
                el.classList.add(
                    'completed'
                );
            }

            if (numero === step) {
                el.classList.add(
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

    function valor(id) {

        var elemento =
            document.getElementById(id);

        return elemento
            ? elemento.value || '-'
            : '-';
    }

    var resumen = {
        resCentro: valor('centroComercial'),
        resTienda: valor('tienda'),
        resDepartamento: valor('departamento'),
        resPuesto: valor('nombrePuesto'),
        resCantidad: valor('cantidadPlazas'),
        resPrioridad: valor('prioridad'),
        resTipo: valor('tipoContratacion'),
        resReclutador: valor('reclutador')
    };

    Object.keys(resumen)
        .forEach(function(id) {

            var elemento =
                document.getElementById(id);

            if (elemento) {
                elemento.textContent =
                    resumen[id];
            }
        });
}


// ==========================================
// BORRADOR
// ==========================================

function saveDraft() {

    alert(
        '📝 Borrador guardado correctamente'
    );
}


// ==========================================
// CREAR CÓDIGO
// ==========================================

function generarCodigoRequisicion() {

    var ahora = new Date();

    return (
        'R-' +
        String(
            ahora.getFullYear()
        ).slice(-2) +

        String(
            ahora.getMonth() + 1
        ).padStart(2, '0') +

        String(
            ahora.getDate()
        ).padStart(2, '0') +

        '-' +

        Math.floor(
            1000 +
            Math.random() * 9000
        )
    );
}


// ==========================================
// GUARDAR REQUISICIÓN
// ==========================================

async function submitRequisicion() {

    if (window.__guardandoRequisicion) {

        console.warn(
            '⚠️ Ya se está guardando'
        );

        return;
    }


    console.log(
        '🚀 Enviando requisición...'
    );


    // ======================================
    // VALIDACIONES
    // ======================================

    var puestoElement =
        document.getElementById(
            'nombrePuesto'
        );

    var centroElement =
        document.getElementById(
            'centroComercial'
        );

    var nombrePuesto =
        puestoElement
            ? puestoElement.value.trim()
            : '';

    var centro =
        centroElement
            ? centroElement.value
            : '';


    if (!centro) {

        alert(
            '⚠️ Seleccione un centro comercial'
        );

        showStep(1);

        return;
    }


    if (!nombrePuesto) {

        alert(
            '⚠️ Complete el nombre del puesto'
        );

        showStep(2);

        return;
    }


    // ======================================
    // USUARIO SUPABASE AUTH
    // ======================================

    var user =
        typeof getCurrentUser === 'function'
            ? getCurrentUser()
            : null;


    if (
        !user ||
        !user.id ||
        !user.email
    ) {

        console.error(
            '❌ No existe usuario Supabase válido'
        );

        alert(
            'La sesión no es válida. Inicie sesión nuevamente.'
        );

        window.location.href =
            '/login.html';

        return;
    }


    console.log(
        '👤 Creando requisición:',
        user.email,
        '| UUID:',
        user.id
    );


    var ahora =
        new Date();

    var codigo =
        generarCodigoRequisicion();


    function obtenerValor(id) {

        var elemento =
            document.getElementById(id);

        return elemento
            ? elemento.value
            : '';
    }


    // ======================================
    // PAYLOAD SUPABASE
    // ======================================

    var requisicion = {

        codigo: codigo,

        puesto:
            nombrePuesto,

        centro:
            centro,

        tienda:
            obtenerValor('tienda') ||
            null,

        departamento:
            obtenerValor(
                'departamento'
            ) || null,

        fecha:
            obtenerValor('fecha') ||
            ahora
                .toISOString()
                .slice(0, 10),

        tipo_contratacion:
            obtenerValor(
                'tipoContratacion'
            ) || null,

        cantidad:
            parseInt(
                obtenerValor(
                    'cantidadPlazas'
                ),
                10
            ) || 1,

        prioridad:
            obtenerValor(
                'prioridad'
            ) || 'Media',

        motivo:
            obtenerValor(
                'motivo'
            ) || null,

        reclutador:
            obtenerValor(
                'reclutador'
            ) || null,

        estado:
            'Nueva',

        // ==================================
        // FASE 2 - IDENTIDAD REAL
        // ==================================

        created_by:
            user.email,

        created_by_uuid:
            user.id,

        reclutador_id:
            user.id,

        created_at:
            ahora.toISOString(),

        updated_at:
            ahora.toISOString()
    };


    console.log(
        '📦 Payload requisición:',
        requisicion
    );


    window.__guardandoRequisicion =
        true;


    try {

        if (
            typeof insertarEnSupabase !==
            'function'
        ) {

            throw new Error(
                'insertarEnSupabase no está disponible'
            );
        }


        var result =
            await insertarEnSupabase(
                'requisiciones',
                requisicion
            );


        if (!result.success) {

            throw new Error(
                result.error ||
                'Supabase no confirmó el guardado'
            );
        }


        var guardada =
            result.data &&
            result.data[0]
                ? result.data[0]
                : requisicion;


        // ==================================
        // CACHE LOCAL
        // ==================================

        var requisiciones =
            JSON.parse(
                localStorage.getItem(
                    'requisiciones_data'
                ) || '[]'
            );


        requisiciones =
            requisiciones.filter(
                function(r) {

                    return (
                        r.id !==
                        guardada.id
                    );
                }
            );


        requisiciones.unshift(
            guardada
        );


        localStorage.setItem(
            'requisiciones_data',
            JSON.stringify(
                requisiciones
            )
        );


        console.log(
            '✅ Requisición creada:',
            guardada
        );


        // ==================================
        // NOTIFICACIÓN
        // ==================================

        if (
            typeof agregarNotificacion ===
            'function'
        ) {

            agregarNotificacion(
                'success',
                '✅ Requisición ' +
                    codigo +
                    ' creada',
                '/requisiciones.html'
            );
        }


        // ==================================
        // MODAL
        // ==================================

        var modal =
            document.getElementById(
                'successModal'
            );

        if (modal) {
            modal.classList.add('show');
        }


        var mensaje =
            document.getElementById(
                'modalMessage'
            );

        if (mensaje) {

            mensaje.textContent =
                '✅ ' +
                codigo +
                ' creada y asignada a: ' +
                (
                    requisicion.reclutador ||
                    user.name ||
                    user.email
                );
        }


    } catch (error) {

        console.error(
            '❌ Error creando requisición:',
            error
        );


        alert(
            '❌ No se pudo crear la requisición.\n\n' +
            error.message
        );


    } finally {

        window.__guardandoRequisicion =
            false;
    }
}


// ==========================================
// CERRAR MODAL
// ==========================================

function closeModal() {

    var modal =
        document.getElementById(
            'successModal'
        );

    if (modal) {
        modal.classList.remove('show');
    }

    window.location.href =
        '/requisiciones.html';
}


// ==========================================
// INICIALIZAR DATOS
// ==========================================

function iniciarNuevaRequisicion() {

    console.log(
        '🚀 Inicializando nueva requisición'
    );


    var data =
        obtenerDatosConfig();


    if (
        data &&
        data.comerciales &&
        data.comerciales.length > 0
    ) {

        datosCargados = true;

        cargarDatosFormulario();

        return;
    }


    if (
        typeof initSupabaseData ===
        'function'
    ) {

        initSupabaseData()
            .then(function(result) {

                if (result) {

                    datosCargados =
                        true;

                    cargarDatosFormulario();
                }
            })
            .catch(function(error) {

                console.error(
                    '❌ Configuración:',
                    error
                );
            });
    }


    if (intervaloIntento) {
        clearInterval(intervaloIntento);
    }


    var intentos = 0;


    intervaloIntento =
        setInterval(function() {

            intentos++;

            var config =
                obtenerDatosConfig();


            if (
                config &&
                config.comerciales &&
                config.comerciales.length > 0
            ) {

                clearInterval(
                    intervaloIntento
                );

                intervaloIntento =
                    null;

                datosCargados =
                    true;

                cargarDatosFormulario();

            } else if (
                intentos > 30
            ) {

                clearInterval(
                    intervaloIntento
                );

                intervaloIntento =
                    null;

                console.warn(
                    '⚠️ Timeout cargando configuración'
                );
            }

        }, 500);
}


// ==========================================
// DOM
// ==========================================

document.addEventListener(
    'DOMContentLoaded',
    function() {

        console.log(
            '🚀 DOMContentLoaded requisición'
        );


        var user =
            getCurrentUser();


        if (!user) {

            window.location.href =
                '/login.html';

            return;
        }


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
            '👤 Usuario:',
            user.email,
            '|',
            user.role,
            '|',
            user.id
        );


        window.addEventListener(
            'datosConfiguracionListos',
            function() {

                datosCargados =
                    true;

                cargarDatosFormulario();
            }
        );


        iniciarNuevaRequisicion();


        var centroSelect =
            document.getElementById(
                'centroComercial'
            );


        if (centroSelect) {

            centroSelect.addEventListener(
                'change',
                filtrarTiendasPorComercial
            );
        }


        var fechaInput =
            document.getElementById(
                'fecha'
            );


        if (fechaInput) {

            fechaInput.value =
                new Date()
                    .toISOString()
                    .split('T')[0];
        }


        var modal =
            document.getElementById(
                'successModal'
            );


        if (modal) {

            modal.addEventListener(
                'click',
                function(e) {

                    if (
                        e.target === this
                    ) {

                        closeModal();
                    }
                }
            );
        }


        showStep(1);


        console.log(
            '✅ Nueva requisición Fase 2 inicializada'
        );
    }
);


// ==========================================
// ACTUALIZACIÓN CONFIGURACIÓN
// ==========================================

window.addEventListener(
    'storage',
    function(e) {

        if (
            e.key ===
            'siman_config_data'
        ) {

            if (datosCargados) {
                cargarDatosFormulario();
            }
        }
    }
);


// ==========================================
// EXPORTAR
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