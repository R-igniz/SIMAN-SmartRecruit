// ==========================================
// GRÁFICAS CON CHART.JS
// ==========================================
function cargarChartJS() {
  if (window.Chart) return Promise.resolve();
  
  return new Promise(function(resolve) {
    var script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js';
    script.onload = function() {
      console.log('✅ Chart.js cargado');
      resolve();
    };
    document.head.appendChild(script);
  });
}

// ==========================================
// CREAR GRÁFICA DE BARRAS
// ==========================================
function crearGraficaBarras(id, labels, data, titulo, colores) {
  return new Promise(function(resolve) {
    cargarChartJS().then(function() {
      var ctx = document.getElementById(id);
      if (!ctx) {
        console.error('Elemento ' + id + ' no encontrado');
        resolve(null);
        return;
      }
      
      var defaultColors = ['#0056A6', '#1a6bb8', '#3b7fc9', '#0a4a8a', '#5a9ad5', '#7ab0e0'];
      var coloresUsar = colores || defaultColors;
      
      var chart = new Chart(ctx.getContext('2d'), {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [{
            label: titulo || 'Datos',
            data: data,
            backgroundColor: coloresUsar.slice(0, data.length),
            borderRadius: 8,
            borderSkipped: false
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              grid: {
                color: 'rgba(0,0,0,0.05)'
              }
            },
            x: {
              grid: {
                display: false
              }
            }
          }
        }
      });
      
      resolve(chart);
    });
  });
}

// ==========================================
// CREAR GRÁFICA DE LÍNEAS
// ==========================================
function crearGraficaLineas(id, labels, data, titulo, color) {
  return new Promise(function(resolve) {
    cargarChartJS().then(function() {
      var ctx = document.getElementById(id);
      if (!ctx) {
        console.error('Elemento ' + id + ' no encontrado');
        resolve(null);
        return;
      }
      
      var chart = new Chart(ctx.getContext('2d'), {
        type: 'line',
        data: {
          labels: labels,
          datasets: [{
            label: titulo || 'Tendencia',
            data: data,
            borderColor: color || '#0056A6',
            backgroundColor: (color || '#0056A6') + '20',
            fill: true,
            tension: 0.4,
            pointRadius: 4,
            pointBackgroundColor: color || '#0056A6'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: true,
              position: 'top'
            }
          },
          scales: {
            y: {
              beginAtZero: true
            }
          }
        }
      });
      
      resolve(chart);
    });
  });
}

// ==========================================
// CREAR GRÁFICA DE DONA
// ==========================================
function crearGraficaDona(id, labels, data, colores) {
  return new Promise(function(resolve) {
    cargarChartJS().then(function() {
      var ctx = document.getElementById(id);
      if (!ctx) {
        console.error('Elemento ' + id + ' no encontrado');
        resolve(null);
        return;
      }
      
      var defaultColors = ['#0056A6', '#2b8c4a', '#d4a017', '#b33c3c', '#5a9ad5'];
      
      var chart = new Chart(ctx.getContext('2d'), {
        type: 'doughnut',
        data: {
          labels: labels,
          datasets: [{
            data: data,
            backgroundColor: colores || defaultColors,
            borderWidth: 2,
            borderColor: '#ffffff'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                padding: 16,
                usePointStyle: true
              }
            }
          },
          cutout: '65%'
        }
      });
      
      resolve(chart);
    });
  });
}

// ==========================================
// CARGAR GRÁFICAS DEL DASHBOARD EJECUTIVO
// ==========================================
async function cargarDashboardGraficas() {
  // Datos de ejemplo - en producción vendrían de la API
  var centros = ['Gran Vía', 'Multiplaza', 'Galerías', 'Metrocentro'];
  var vacantes = [12, 8, 6, 4];
  
  await crearGraficaBarras('graficaVacantes', centros, vacantes, 'Vacantes por Comercial');
  
  var meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul'];
  var contrataciones = [5, 7, 3, 9, 12, 8, 18];
  await crearGraficaLineas('graficaContrataciones', meses, contrataciones, 'Contrataciones Mensuales');
  
  var estados = ['Nueva', 'En Proceso', 'Entrevistas', 'Cerrado'];
  var cantidades = [8, 15, 7, 12];
  await crearGraficaDona('graficaEstados', estados, cantidades);
}

// ==========================================
// ACTUALIZAR GRÁFICAS CON NUEVOS DATOS
// ==========================================
function actualizarGrafica(chart, nuevosDatos) {
  if (!chart) return;
  chart.data.datasets[0].data = nuevosDatos;
  chart.update();
}