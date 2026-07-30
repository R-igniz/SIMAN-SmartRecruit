let currentStep = 1;
const totalSteps = 4;

document.addEventListener('DOMContentLoaded', function() {
  const user = getCurrentUser();
  if (!user) return;
  
  showStep(1);
});

function showStep(step) {
  document.querySelectorAll('.step-content').forEach(el => {
    el.classList.remove('active');
  });
  
  document.getElementById(`step${step}`).classList.add('active');
  
  document.querySelectorAll('.wizard-steps .step').forEach(el => {
    const num = parseInt(el.dataset.step);
    el.classList.remove('active');
    if (num < step) el.classList.add('completed');
    if (num === step) el.classList.add('active');
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

function updateSummary() {
  document.getElementById('resCentro').textContent = document.getElementById('centroComercial').value || 'No especificado';
  document.getElementById('resPuesto').textContent = document.getElementById('nombrePuesto').value || 'No especificado';
  document.getElementById('resCantidad').textContent = document.getElementById('cantidadPlazas').value || '0';
  
  const prioridadMap = {
    'alta': 'Alta',
    'media': 'Media',
    'baja': 'Baja'
  };
  const prioridad = document.getElementById('prioridad').value;
  document.getElementById('resPrioridad').textContent = prioridadMap[prioridad] || 'Media';
  
  document.getElementById('resTipo').textContent = document.getElementById('tipoContratacion').value || 'No especificado';
}

function saveDraft() {
  alert('Borrador guardado correctamente');
}

function submitRequisicion() {
  const nombrePuesto = document.getElementById('nombrePuesto').value.trim();
  if (!nombrePuesto) {
    alert('Por favor complete el nombre del puesto');
    showStep(2);
    return;
  }
  
  const modal = document.getElementById('successModal');
  modal.classList.add('show');
  
  const reclutadoras = ['María Gómez', 'Ana López', 'Carlos Rodríguez'];
  const asignada = reclutadoras[Math.floor(Math.random() * reclutadoras.length)];
  
  setTimeout(() => {
    document.getElementById('modalMessage').textContent = `Asignada automáticamente a: ${asignada}`;
  }, 1500);
}

function closeModal() {
  document.getElementById('successModal').classList.remove('show');
  navigateTo('/dashboard');
}

document.getElementById('successModal').addEventListener('click', function(e) {
  if (e.target === this) {
    closeModal();
  }
});