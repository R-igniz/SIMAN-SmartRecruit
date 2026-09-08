// ==========================================
// NUEVA REQUISICIÓN - WIZARD Y FILTROS
// ==========================================
console.log('🚀🚀🚀 nueva-requisicion.js se está ejecutando 🚀🚀🚀');

var currentStep = 1;
var totalSteps = 4;
var datosCargados = false;
var intervaloIntento = null;

// ==========================================
// CARGA DE DATOS
// ==========================================
function cargarDatosFormulario() {
    console.log('🔄 cargarDatosFormulario() ejecutado');
    console.log('📊 datosCargados =', datosCargados);
    
    if (!datosCargados) {
        console.log('⏳ Esperando datos de configuración...');
        return;
    }
    
    var data = obtenerDatosConfig();
    console.log('📦 Datos de configuración:', data);
    if (!data) {
        console.warn('⚠️ Datos no disponibles');
        return;
    }

    // Comerciales
    var comerciales = obtenerComerciales();
    console.log('🏢 Comerciales:', comerciales);
    poblarSelect('centroComercial', comerciales, 'Seleccionar centro...');

    // Tiendas
    var tiendas = obtenerTiendas();
    console.log('🛒 Tiendas:', tiendas);
    poblarSelect('tienda', tiendas, 'Seleccionar tienda...', true);

    // Departamentos
    var departamentos = data.departamentos || [];
    console.log('🏛️ Departamentos:', departamentos);
    poblarSelect('departamento', departamentos, 'Seleccionar departamento...');

    // Tipos de contratación
    var tiposContratacion = data.tiposContratacion || [];
    console.log('📄 Tipos de contratación:', tiposContratacion);
    poblarSelect('tipoContratacion', tiposContratacion, 'Seleccionar tipo...');

    // Prioridades
    var prioridades = data.prioridades || [];
    console.log('🚩 Prioridades:', prioridades);
    poblarSelect('prioridad', prioridades, 'Seleccionar prioridad...');

    // Motivos
    var motivos = data.motivos || [];
    console.log('❓ Motivos:', motivos);
    poblarSelect('motivo', motivos, 'Seleccionar motivo...');

    // Reclutadores
    var reclutadores = obtenerReclutadores();
    console.log('👩‍💼 Reclutadores:', reclutadores);
    poblarSelect('reclutador', reclutadores, 'Seleccionar reclutador...');
    
    console.log('✅ Datos cargados correctamente');
    if (intervaloIntento) {
        clearInterval(intervaloIntento);
        intervaloIntento = null;
    }
}

function poblarSelect(id, datos, textoDefault, esTienda) {
    var select = document.getElementById(id);
    if (!select) {
        console.warn('⚠️ Select no encontrado:', id);
        return;
    }
    console.log('🔽 Poblando select', id, 'con', datos.length, 'elementos');
    select.innerHTML = '<option value="">' + (textoDefault || 'Seleccionar...') + '</option>';
    if (!datos || datos.length === 0) {
        select.innerHTML = '<option value="">No hay opciones disponibles</option>';
        console.warn('⚠️ No hay datos para', id);
        return;
    }
    datos.forEach(function(item) {
        var estado = item.estado !== undefined ? item.estado : 'activo';
        if (estado === 'activo') {
            var option = document.createElement('option');
            if (esTienda) {
                option.value = item.nombre;
                option.textContent = item.nombre;
                option.dataset.comercial = item.comercial || '';
            } else {
                option.value = item.nombre;
                option.textContent = item.nombre;
            }
            select.appendChild(option);
        }
    });
    console.log('✅ Select', id, 'poblado con', select.options.length - 1, 'opciones');
}

// ==========================================
// FILTRO DINÁMICO
// ==========================================
function filtrarTiendasPorComercial() {
    var comercialSelect = document.getElementById('centroComercial');
    var tiendaSelect = document.getElementById('tienda');
    var comercial = comercialSelect.value;
    console.log('🔍 Filtrando tiendas por comercial:', comercial);

    if (!comercial) {
        var tiendas = obtenerTiendas();
        poblarSelect('tienda', tiendas, 'Seleccionar tienda...', true);
        return;
    }
    var tiendasFiltradas = obtenerTiendasPorComercial(comercial);
    poblarSelect('tienda', tiendasFiltradas, 'Seleccionar tienda...', true);
}

// ==========================================
// WIZARD NAVEGACIÓN
// ==========================================
function showStep(step) {
    document.querySelectorAll('.step-content').forEach(function(el) { el.classList.remove('active'); });
    var el = document.getElementById('step' + step);
    if (el) el.classList.add('active');
    document.querySelectorAll('.wizard-steps .step').forEach(function(el) {
        var num = parseInt(el.dataset.step);
        el.classList.remove('active');
        if (num < step) el.classList.add('completed');
        if (num === step) el.classList.add('active');
    });
    if (step === 4) updateSummary();
    currentStep = step;
}
function nextStep(step) { showStep(step); }
function prevStep(step) { showStep(step); }

// ==========================================
// RESUMEN
// ==========================================
function updateSummary() {
    var centro = document.getElementById('centroComercial').value || '-';
    var tienda = document.getElementById('tienda').value || '-';
    var departamento = document.getElementById('departamento').value || '-';
    var puesto = document.getElementById('nombrePuesto').value || '-';
    var cantidad = document.getElementById('cantidadPlazas').value || '-';
    var prioridad = document.getElementById('prioridad').value || '-';
    var tipo = document.getElementById('tipoContratacion').value || '-';
    var reclutador = document.getElementById('reclutador').value || '-';
    document.getElementById('resCentro').textContent = centro;
    document.getElementById('resTienda').textContent = tienda;
    document.getElementById('resDepartamento').textContent = departamento;
    document.getElementById('resPuesto').textContent = puesto;
    document.getElementById('resCantidad').textContent = cantidad;
    document.getElementById('resPrioridad').textContent = prioridad;
    document.getElementById('resTipo').textContent = tipo;
    document.getElementById('resReclutador').textContent = reclutador;
}

// ==========================================
// GUARDAR
// ==========================================
function saveDraft() { alert('📝 Borrador guardado correctamente'); }

function submitRequisicion() {
    console.log('🚀 Enviando requisición...');
    var nombrePuesto = document.getElementById('nombrePuesto').value.trim();
    if (!nombrePuesto) { alert('⚠️ Complete el nombre del puesto'); showStep(2); return; }
    var centro = document.getElementById('centroComercial').value;
    if (!centro) { alert('⚠️ Seleccione un centro comercial'); showStep(1); return; }

    var requisicion = {
        id: 'R-' + Date.now(),
        puesto: nombrePuesto,
        centro: centro,
        tienda: document.getElementById('tienda').value,
        departamento: document.getElementById('departamento').value,
        gerente: document.getElementById('gerente').value,
        fecha: document.getElementById('fecha').value,
        tipoContratacion: document.getElementById('tipoContratacion').value,
        cantidad: parseInt(document.getElementById('cantidadPlazas').value) || 1,
        prioridad: document.getElementById('prioridad').value,
        motivo: document.getElementById('motivo').value,
        reclutador: document.getElementById('reclutador').value,
        estado: 'Nueva',
        fechaCreacion: new Date().toISOString()
    };
    console.log('📝 Requisición a guardar:', requisicion);

    var requisiciones = JSON.parse(localStorage.getItem('requisiciones_data') || '[]');
    requisiciones.unshift(requisicion);
    localStorage.setItem('requisiciones_data', JSON.stringify(requisiciones));
    console.log('💾 Guardado en localStorage');

    if (typeof guardarEnSupabase === 'function') {
        console.log('☁️ Guardando en Supabase...');
        guardarEnSupabase('requisiciones', requisicion)
            .then(function(result) {
                if (result.success) {
                    console.log('✅ Requisición guardada en Supabase');
                    if (typeof agregarNotificacion === 'function') {
                        agregarNotificacion('success', '✅ Requisición guardada en la nube', '#');
                    }
                } else {
                    console.error('❌ Error en Supabase:', result.error);
                    if (typeof agregarNotificacion === 'function') {
                        agregarNotificacion('danger', '❌ Error: ' + result.error, '#');
                    }
                }
            })
            .catch(function(error) {
                console.error('❌ Error:', error);
                if (typeof agregarNotificacion === 'function') {
                    agregarNotificacion('danger', '❌ Error: ' + error.message, '#');
                }
            });
    } else {
        console.warn('⚠️ guardarEnSupabase no definida');
        if (typeof agregarNotificacion === 'function') {
            agregarNotificacion('warning', '⚠️ No se pudo conectar con la nube', '#');
        }
    }

    var modal = document.getElementById('successModal');
    modal.classList.add('show');
    var reclutadorNombre = document.getElementById('reclutador').value || 'No asignado';
    setTimeout(function() {
        document.getElementById('modalMessage').textContent = '✅ Asignada a: ' + reclutadorNombre;
    }, 1500);
}

function closeModal() {
    document.getElementById('successModal').classList.remove('show');
    window.location.href = '/requisiciones.html';
}

// ==========================================
// INICIALIZACIÓN ROBUSTA
// ==========================================
function iniciarNuevaRequisicion() {
    console.log('🚀 iniciarNuevaRequisicion() llamada');
    
    // Verificar si los datos ya están disponibles
    var data = obtenerDatosConfig();
    if (data && data.comerciales && data.comerciales.length > 0) {
        console.log('📦 Datos ya disponibles, cargando...');
        datosCargados = true;
        cargarDatosFormulario();
        return;
    }
    
    console.log('⏳ Datos no disponibles, esperando...');
    
    // Intentar cargar desde Supabase directamente
    if (typeof initSupabaseData === 'function') {
        console.log('🔄 Intentando cargar desde Supabase...');
        initSupabaseData().then(function(result) {
            if (result) {
                console.log('✅ Datos cargados desde Supabase');
                datosCargados = true;
                cargarDatosFormulario();
            } else {
                console.warn('⚠️ No se cargaron datos desde Supabase');
            }
        }).catch(function(err) {
            console.error('❌ Error cargando desde Supabase:', err);
        });
    }
    
    // Reintentar cada 300ms hasta que los datos estén listos
    if (intervaloIntento) clearInterval(intervaloIntento);
    var intentos = 0;
    intervaloIntento = setInterval(function() {
        intentos++;
        var data = obtenerDatosConfig();
        if (data && data.comerciales && data.comerciales.length > 0) {
            clearInterval(intervaloIntento);
            intervaloIntento = null;
            datosCargados = true;
            cargarDatosFormulario();
            console.log('✅ Datos disponibles después de', intentos, 'intentos');
        } else if (intentos > 30) {
            clearInterval(intervaloIntento);
            intervaloIntento = null;
            console.warn('⚠️ No se pudieron cargar los datos después de 15 segundos');
            alert('⚠️ No se pudieron cargar los datos de configuración. Recarga la página o intenta más tarde.');
        }
    }, 500);
}

// ==========================================
// LISTENERS
// ==========================================
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 DOMContentLoaded - nueva-requisicion.js');
    var user = getCurrentUser();
    if (!user) { window.location.href = '/login.html'; return; }
    if (!tienePermiso('crear_requisicion')) {
        console.warn('⛔ Acceso denegado');
        window.location.href = '/dashboard.html';
        return;
    }

    // Escuchar evento de datos listos (por si configuracion.js lo dispara)
    window.addEventListener('datosConfiguracionListos', function(e) {
        console.log('📢 Recibido evento datosConfiguracionListos');
        datosCargados = true;
        cargarDatosFormulario();
    });

    // Iniciar carga
    iniciarNuevaRequisicion();

    // Evento para filtrar tiendas
    var centroSelect = document.getElementById('centroComercial');
    if (centroSelect) {
        centroSelect.addEventListener('change', filtrarTiendasPorComercial);
    }

    // Fecha por defecto
    var fechaInput = document.getElementById('fecha');
    if (fechaInput) {
        var hoy = new Date().toISOString().split('T')[0];
        fechaInput.value = hoy;
    }

    // Modal
    var modal = document.getElementById('successModal');
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === this) closeModal();
        });
    }

    showStep(1);
    console.log('✅ Nueva requisición inicializada');
});

window.addEventListener('storage', function(e) {
    if (e.key === 'siman_config_data') {
        console.log('🔄 Configuración actualizada desde otra pestaña');
        if (datosCargados) {
            cargarDatosFormulario();
        }
    }
});

window.cargarDatosFormulario = cargarDatosFormulario;
window.filtrarTiendasPorComercial = filtrarTiendasPorComercial;
window.nextStep = nextStep;
window.prevStep = prevStep;
window.submitRequisicion = submitRequisicion;
window.saveDraft = saveDraft;
window.closeModal = closeModal;