// ==========================================
// CARGA DE DATOS DESDE CONFIGURACIÓN
// ==========================================
var CONFIG_STORE_KEY = 'siman_config_data';

function obtenerConfiguracion() {
  var data = localStorage.getItem(CONFIG_STORE_KEY);
  if (data) {
    return JSON.parse(data);
  }
  // Datos por defecto si no hay configuración
  return {
    comerciales: [
      { id: 1, nombre: 'Gran Vía', estado: 'activo' },
      { id: 2, nombre: 'Multiplaza', estado: 'activo' },
      { id: 3, nombre: 'Galerías', estado: 'activo' }
    ],
    tiendas: [
      { id: 1, nombre: 'Electrónica', estado: 'activo' },
      { id: 2, nombre: 'Ropa', estado: 'activo' },
      { id: 3, nombre: 'Calzado', estado: 'activo' }
    ],
    departamentos: [
      { id: 1, nombre: 'Financiero', estado: 'activo' },
      { id: 2, nombre: 'Marketing', estado: 'activo' },
      { id: 3, nombre: 'RRHH', estado: 'activo' }
    ],
    tiposContratacion: [
      { id: 1, nombre: 'Directa', estado: 'activo' },
      { id: 2, nombre: 'Temporal', estado: 'activo' },
      { id: 3, nombre: 'Prácticas', estado: 'activo' }
    ],
    prioridades: [
      { id: 1, nombre: 'Alta', estado: 'activo' },
      { id: 2, nombre: 'Media', estado: 'activo' },
      { id: 3, nombre: 'Baja', estado: 'activo' }
    ],
    motivos: [
      { id: 1, nombre: 'Nueva posición', estado: 'activo' },
      { id: 2, nombre: 'Reemplazo', estado: 'activo' },
      { id: 3, nombre: 'Expansión', estado: 'activo' }
    ]
  };
}

function poblarSelect(id, datos, textoDefault) {
  var select = document.getElementById(id);
  if (!select) return;
  select.innerHTML = '<option value="">' + (textoDefault || 'Seleccionar...') + '</option>';
  if (!datos || datos.length === 0) {
    select.innerHTML = '<option value="">No hay opciones disponibles</option>';
    return;
  }
  datos.forEach(function(item) {
    if (item.estado === 'activo') {
      var option = document.createElement('option');
      option.value = item.nombre;
      option.textContent = item.nombre;
      select.appendChild(option);
    }
  });
}

function cargarDatosFormulario() {
  var config = obtenerConfiguracion();
  
  poblarSelect('centroComercial', config.comerciales || []);
  poblarSelect('tienda', config.tiendas || []);
  poblarSelect('departamento', config.departamentos || []);
  poblarSelect('tipoContratacion', config.tiposContratacion || []);
  poblarSelect('prioridad', config.prioridades || []);
  poblarSelect('motivo', config.motivos || []);
}

// ==========================================
// WIZARD NAVEGACIÓN
// ==========================================
var currentStep = 1;
var totalSteps = 4;

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
  var puesto = document.getElementById('nombrePuesto').value || '-';
  var cantidad = document.getElementById('cantidadPlazas').value || '-';
  var prioridad = document.getElementById('prioridad').value || '-';
  var tipo = document.getElementById('tipoContratacion').value || '-';
  
  document.getElementById('resCentro').textContent = centro;
  document.getElementById('resPuesto').textContent = puesto;
  document.getElementById('resCantidad').textContent = cantidad;
  document.getElementById('resPrioridad').textContent = prioridad;
  document.getElementById('resTipo').textContent = tipo;
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
  
  var modal = document.getElementById('successModal');
  modal.classList.add('show');
  
  var reclutadoras = ['María Gómez', 'Ana López', 'Carlos Rodríguez'];
  var asignada = reclutadoras[Math.floor(Math.random() * reclutadoras.length)];
  
  setTimeout(function() {
    document.getElementById('modalMessage').textContent = '✅ Asignada automáticamente a: ' + asignada;
  }, 1500);
}

function closeModal() {
  document.getElementById('successModal').classList.remove('show');
  window.location.href = '/dashboard';
}

// Cerrar modal haciendo clic fuera
document.addEventListener('DOMContentLoaded', function() {
  var modal = document.getElementById('successModal');
  if (modal) {
    modal.addEventListener('click', function(e) {
      if (e.target === this) closeModal();
    });
  }
});

// ==========================================
// INICIALIZAR
// ==========================================
document.addEventListener('DOMContentLoaded', function() {
  var user = JSON.parse(sessionStorage.getItem('currentUser') || '{}');
  if (!user.username) {
    window.location.href = '/login.html';
    return;
  }
  
  // Cargar datos dinámicos en los selects
  cargarDatosFormulario();
  
  // Fecha por defecto
  var fechaInput = document.getElementById('fecha');
  if (fechaInput) {
    var hoy = new Date().toISOString().split('T')[0];
    fechaInput.value = hoy;
  }
  
  showStep(1);
});