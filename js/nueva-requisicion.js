// ==========================================
// NUEVA REQUISICIÓN - WIZARD Y FILTROS
// ==========================================

var currentStep = 1;
var totalSteps = 4;

// ==========================================
// CARGA DE DATOS DESDE CONFIGURACIÓN
// ==========================================
function cargarDatosFormulario() {
    var data = obtenerDatosConfig();
    
    // Cargar centros comerciales
    var comerciales = obtenerComerciales();
    poblarSelect('centroComercial', comerciales, 'Seleccionar centro...');
    
    // Cargar tiendas (inicialmente vacías, se llenan al seleccionar centro)
    var tiendas = obtenerTiendas();
    poblarSelect('tienda', tiendas, 'Seleccionar tienda...', true);
    
    // Cargar departamentos
    var departamentos = data.departamentos || [];
    poblarSelect('departamento', departamentos, 'Seleccionar departamento...');
    
    // Cargar tipos de contratación
    var tiposContratacion = data.tiposContratacion || [];
    poblarSelect('tipoContratacion', tiposContratacion, 'Seleccionar tipo...');
    
    // Cargar prioridades
    var prioridades = data.prioridades || [];
    poblarSelect('prioridad', prioridades, 'Seleccionar prioridad...');
    
    // Cargar motivos
    var motivos = data.motivos || [];
    poblarSelect('motivo', motivos, 'Seleccionar motivo...');
    
    // Cargar reclutadores
    var reclutadores = obtenerReclutadores();
    poblarSelect('reclutador', reclutadores, 'Seleccionar reclutador...');
}

function poblarSelect(id, datos, textoDefault, esTienda) {
    var select = document.getElementById(id);
    if (!select) return;
    
    select.innerHTML = '<option value="">' + (textoDefault || 'Seleccionar...') + '</option>';
    if (!datos || datos.length === 0) {
        select.innerHTML = '<option value="">No hay opciones disponibles</option>';
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
}

// ==========================================
// FILTRO DINÁMICO: CENTRO COMERCIAL → TIENDAS
// ==========================================
function filtrarTiendasPorComercial() {
    var comercialSelect = document.getElementById('centroComercial');
    var tiendaSelect = document.getElementById('tienda');
    var comercial = comercialSelect.value;
    
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
    document.querySelectorAll('.step-content').forEach(function(el) {
        el.classList.remove('active');
    });
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
// ACCIONES
// ==========================================
function saveDraft() {
    alert('📝 Borrador guardado correctamente');
}

function submitRequisicion() {
    var nombrePuesto = document.getElementById('nombrePuesto').value.trim();
    if (!nombrePuesto) {
        alert('⚠️ Por favor complete el nombre del puesto');
        showStep(2);
        return;
    }
    
    var centro = document.getElementById('centroComercial').value;
    if (!centro) {
        alert('⚠️ Por favor seleccione un centro comercial');
        showStep(1);
        return;
    }
    
    // Crear objeto requisicion
    var requisicion = {
        id: 'R-' + Date.now(),
        puesto: nombrePuesto,
        centro: centro,
        tienda: document.getElementById('tienda').value,
        departamento: document.getElementById('departamento').value,
        gerente: document.getElementById('gerente').value,
        fecha: document.getElementById('fecha').value,
        tipoContratacion: document.getElementById('tipoContratacion').value,
        cantidad: document.getElementById('cantidadPlazas').value,
        prioridad: document.getElementById('prioridad').value,
        motivo: document.getElementById('motivo').value,
        reclutador: document.getElementById('reclutador').value,
        estado: 'Nueva',
        fechaCreacion: new Date().toISOString()
    };
    
    // Guardar en localStorage
    var requisiciones = JSON.parse(localStorage.getItem('requisiciones_data') || '[]');
    requisiciones.unshift(requisicion);
    localStorage.setItem('requisiciones_data', JSON.stringify(requisiciones));
    
    // Guardar en Supabase
    if (typeof guardarEnSupabase === 'function') {
        guardarEnSupabase('requisiciones', requisicion);
    }
    
    // Mostrar modal de éxito
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
// INICIALIZAR
// ==========================================
document.addEventListener('DOMContentLoaded', function() {
    var user = getCurrentUser();
    if (!user) {
        window.location.href = '/login.html';
        return;
    }

    // ✅ VERIFICACIÓN CORRECTA: usa tienePermiso
    if (!tienePermiso('crear_requisicion')) {
        console.warn('⛔ Acceso denegado: sin permiso crear_requisicion');
        alert('⚠️ No tienes permisos para crear requisiciones.');
        window.location.href = '/dashboard.html';
        return;
    }
    
    var modal = document.getElementById('successModal');
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === this) closeModal();
        });
    }
    
    // Cargar datos del formulario
    cargarDatosFormulario();
    
    // Evento para filtrar tiendas al cambiar centro comercial
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
    
    showStep(1);
});

// ==========================================
// SINCRONIZAR CON SUPABASE
// ==========================================
window.addEventListener('storage', function(e) {
    if (e.key === 'siman_config_data') {
        cargarDatosFormulario();
    }
});

// ==========================================
// EXPONER FUNCIONES GLOBALMENTE
// ==========================================
window.cargarDatosFormulario = cargarDatosFormulario;
window.filtrarTiendasPorComercial = filtrarTiendasPorComercial;
window.nextStep = nextStep;
window.prevStep = prevStep;
window.submitRequisicion = submitRequisicion;
window.saveDraft = saveDraft;
window.closeModal = closeModal;