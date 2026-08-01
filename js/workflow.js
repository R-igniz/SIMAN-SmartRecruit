// ==========================================
// WORKFLOW DE APROBACIONES
// ==========================================
function iniciarWorkflow(requisicionId, datosRequisicion) {
  var workflow = {
    id: 'WF-' + requisicionId,
    requisicionId: requisicionId,
    estado: 'Pendiente de Aprobación',
    pasos: [
      {
        id: 1,
        nombre: 'Aprobación Gerente RH',
        estado: 'Pendiente',
        usuario: null,
        fecha: null,
        comentario: null
      },
      {
        id: 2,
        nombre: 'Aprobación Finanzas',
        estado: 'Pendiente',
        usuario: null,
        fecha: null,
        comentario: null
      },
      {
        id: 3,
        nombre: 'Aprobación Dirección',
        estado: 'Pendiente',
        usuario: null,
        fecha: null,
        comentario: null
      }
    ],
    historial: [
      {
        fecha: new Date().toISOString(),
        accion: 'Workflow iniciado',
        usuario: 'Sistema',
        comentario: 'Requisición #' + requisicionId + ' creada'
      }
    ],
    fechaInicio: new Date().toISOString(),
    fechaFin: null,
    aprobadores: []
  };
  
  // Guardar workflow
  var workflows = JSON.parse(localStorage.getItem('workflows') || '[]');
  workflows.push(workflow);
  localStorage.setItem('workflows', JSON.stringify(workflows));
  
  // Notificar a los aprobadores
  notificarAprobadores(workflow);
  
  return workflow;
}

// ==========================================
// APROBAR PASO
// ==========================================
function aprobarPaso(workflowId, pasoId, usuario, comentario) {
  var workflows = JSON.parse(localStorage.getItem('workflows') || '[]');
  var workflow = workflows.find(function(w) { return w.id === workflowId; });
  
  if (!workflow) {
    console.error('Workflow no encontrado');
    return false;
  }
  
  var paso = workflow.pasos.find(function(p) { return p.id === pasoId; });
  if (!paso) {
    console.error('Paso no encontrado');
    return false;
  }
  
  if (paso.estado !== 'Pendiente') {
    alert('Este paso ya fue aprobado o rechazado');
    return false;
  }
  
  paso.estado = 'Aprobado';
  paso.usuario = usuario;
  paso.fecha = new Date().toISOString();
  paso.comentario = comentario || '';
  
  workflow.historial.push({
    fecha: new Date().toISOString(),
    accion: 'Paso aprobado: ' + paso.nombre,
    usuario: usuario,
    comentario: comentario || ''
  });
  
  // Verificar si todos los pasos están aprobados
  var todosAprobados = workflow.pasos.every(function(p) { return p.estado === 'Aprobado'; });
  if (todosAprobados) {
    workflow.estado = 'Aprobado';
    workflow.fechaFin = new Date().toISOString();
    workflow.historial.push({
      fecha: new Date().toISOString(),
      accion: 'Workflow completado',
      usuario: 'Sistema',
      comentario: 'Todas las aprobaciones fueron completadas'
    });
  }
  
  // Guardar cambios
  var index = workflows.findIndex(function(w) { return w.id === workflowId; });
  workflows[index] = workflow;
  localStorage.setItem('workflows', JSON.stringify(workflows));
  
  return true;
}

// ==========================================
// RECHAZAR PASO
// ==========================================
function rechazarPaso(workflowId, pasoId, usuario, comentario) {
  var workflows = JSON.parse(localStorage.getItem('workflows') || '[]');
  var workflow = workflows.find(function(w) { return w.id === workflowId; });
  
  if (!workflow) {
    console.error('Workflow no encontrado');
    return false;
  }
  
  var paso = workflow.pasos.find(function(p) { return p.id === pasoId; });
  if (!paso) {
    console.error('Paso no encontrado');
    return false;
  }
  
  if (paso.estado !== 'Pendiente') {
    alert('Este paso ya fue aprobado o rechazado');
    return false;
  }
  
  paso.estado = 'Rechazado';
  paso.usuario = usuario;
  paso.fecha = new Date().toISOString();
  paso.comentario = comentario || '';
  
  workflow.estado = 'Rechazado';
  workflow.fechaFin = new Date().toISOString();
  
  workflow.historial.push({
    fecha: new Date().toISOString(),
    accion: 'Paso rechazado: ' + paso.nombre,
    usuario: usuario,
    comentario: comentario || ''
  });
  
  var index = workflows.findIndex(function(w) { return w.id === workflowId; });
  workflows[index] = workflow;
  localStorage.setItem('workflows', JSON.stringify(workflows));
  
  return true;
}

// ==========================================
// OBTENER WORKFLOW
// ==========================================
function obtenerWorkflow(workflowId) {
  var workflows = JSON.parse(localStorage.getItem('workflows') || '[]');
  return workflows.find(function(w) { return w.id === workflowId; });
}

// ==========================================
// NOTIFICAR APROBADORES (simulado)
// ==========================================
function notificarAprobadores(workflow) {
  console.log('📨 Notificando aprobadores para workflow:', workflow.id);
  workflow.pasos.forEach(function(paso) {
    console.log('  - Pendiente: ' + paso.nombre);
  });
  
  // Aquí se integraría con el sistema de correos
  if (window.enviarCorreo) {
    var mensaje = 'Se requiere tu aprobación para la requisición ' + workflow.requisicionId;
    // enviarCorreo('aprobador@siman.com', 'Nueva aprobación requerida', mensaje);
  }
}