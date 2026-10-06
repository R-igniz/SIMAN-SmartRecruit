// ==========================================
// IA PREDICTIVA
// ==========================================
function obtenerDatosHistoricos() {
  var requisiciones = JSON.parse(localStorage.getItem('requisiciones') || '[]');
  var historicos = [];
  
  requisiciones.forEach(function(r) {
    if (r.fechaCreacion && r.fechaCierre) {
      var creacion = new Date(r.fechaCreacion);
      var cierre = new Date(r.fechaCierre);
      var dias = (cierre - creacion) / (1000 * 60 * 60 * 24);
      if (dias > 0) {
        historicos.push({
          puesto: r.puesto,
          centro: r.centroComercial,
          prioridad: r.prioridad,
          dias: Math.round(dias),
          estado: r.estado
        });
      }
    }
  });
  
  return historicos;
}

// ==========================================
// PREDECIR TIEMPO DE CONTRATACIÓN
// ==========================================
function predecirTiempoContratacion(requisicion) {
  var historicos = obtenerDatosHistoricos();
  
  if (historicos.length === 0) {
    // Si no hay datos históricos, usar valores por defecto
    var prioridades = { 'Alta': 7, 'Media': 14, 'Baja': 21 };
    return prioridades[requisicion.prioridad] || 14;
  }
  
  // Filtrar por centro y prioridad similares
  var similares = historicos.filter(function(h) {
    return h.centro === requisicion.centroComercial && 
           h.prioridad === requisicion.prioridad;
  });
  
  if (similares.length === 0) {
    // Si no hay similares, usar promedio general
    var total = historicos.reduce(function(sum, h) { return sum + h.dias; }, 0);
    return Math.round(total / historicos.length);
  }
  
  var total = similares.reduce(function(sum, h) { return sum + h.dias; }, 0);
  return Math.round(total / similares.length);
}

// ==========================================
// DETECTAR CUELLOS DE BOTELLA
// ==========================================
function detectarCuellosBotella() {
  var requisiciones = JSON.parse(localStorage.getItem('requisiciones') || '[]');
  var cuellos = [];
  
  requisiciones.forEach(function(r) {
    var tiempo = predecirTiempoContratacion(r);
    var estado = r.estado || 'Nueva';
    
    // Verificar si lleva demasiado tiempo en un estado
    if (r.fechaCreacion) {
      var creacion = new Date(r.fechaCreacion);
      var hoy = new Date();
      var dias = (hoy - creacion) / (1000 * 60 * 60 * 24);
      
      if (dias > tiempo * 1.5) {
        cuellos.push({
          id: r.id,
          puesto: r.puesto,
          estado: estado,
          dias: Math.round(dias),
          tiempoEstimado: tiempo,
          recomendacion: 'Revisar proceso de ' + estado
        });
      }
    }
  });
  
  return cuellos;
}

// ==========================================
// RECOMENDAR PRIORIDADES
// ==========================================
function recomendarPrioridades() {
  var requisiciones = JSON.parse(localStorage.getItem('requisiciones') || '[]');
  var recomendaciones = [];
  
  requisiciones.forEach(function(r) {
    var tiempo = predecirTiempoContratacion(r);
    var creacion = new Date(r.fechaCreacion || Date.now());
    var hoy = new Date();
    var dias = (hoy - creacion) / (1000 * 60 * 60 * 24);
    var porcentaje = (dias / tiempo) * 100;
    
    if (porcentaje > 80) {
      recomendaciones.push({
        id: r.id,
        puesto: r.puesto,
        prioridadActual: r.prioridad || 'Media',
        prioridadRecomendada: porcentaje > 120 ? 'Alta' : 'Media-Alta',
        urgencia: porcentaje > 120 ? 'Crítica' : 'Alta',
        mensaje: 'Esta requisición lleva ' + Math.round(dias) + ' días. ' +
                 'El tiempo estimado es de ' + tiempo + ' días.'
      });
    }
  });
  
  return recomendaciones;
}

// ==========================================
// CALCULAR MÉTRICAS DE RECLUTAMIENTO
// ==========================================
function calcularMetricas() {
  var requisiciones = JSON.parse(localStorage.getItem('requisiciones') || '[]');
  var metricas = {
    total: requisiciones.length,
    abiertas: 0,
    cerradas: 0,
    tiempoPromedio: 0,
    tasaExito: 0,
    porEstado: {}
  };
  
  var tiempos = [];
  
  requisiciones.forEach(function(r) {
    var estado = r.estado || 'Nueva';
    metricas.porEstado[estado] = (metricas.porEstado[estado] || 0) + 1;
    
    if (estado === 'Cerrado' || estado === 'Contratado') {
      metricas.cerradas++;
      if (r.fechaCreacion && r.fechaCierre) {
        var creacion = new Date(r.fechaCreacion);
        var cierre = new Date(r.fechaCierre);
        var dias = (cierre - creacion) / (1000 * 60 * 60 * 24);
        if (dias > 0) tiempos.push(dias);
      }
    } else {
      metricas.abiertas++;
    }
  });
  
  if (tiempos.length > 0) {
    metricas.tiempoPromedio = Math.round(tiempos.reduce(function(a, b) { return a + b; }, 0) / tiempos.length);
  }
  
  if (metricas.total > 0) {
    metricas.tasaExito = Math.round((metricas.cerradas / metricas.total) * 100);
  }
  
  return metricas;
}