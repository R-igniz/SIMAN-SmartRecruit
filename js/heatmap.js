// ==========================================
// MAPA DE CALOR (Heatmap)
// ==========================================
function cargarHeatmap() {
  return new Promise(function(resolve) {
    // Cargar Leaflet
    var leafletCSS = document.createElement('link');
    leafletCSS.rel = 'stylesheet';
    leafletCSS.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(leafletCSS);
    
    var leafletJS = document.createElement('script');
    leafletJS.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    leafletJS.onload = function() {
      // Cargar Heatmap
      var heatmapJS = document.createElement('script');
      heatmapJS.src = 'https://unpkg.com/leaflet-heatmap@0.3.0/leaflet-heatmap.js';
      heatmapJS.onload = function() {
        console.log('✅ Heatmap cargado');
        resolve();
      };
      document.head.appendChild(heatmapJS);
    };
    document.head.appendChild(leafletJS);
  });
}

function initHeatmap(containerId, points) {
  return new Promise(function(resolve) {
    cargarHeatmap().then(function() {
      var container = document.getElementById(containerId);
      if (!container) {
        console.error('Contenedor ' + containerId + ' no encontrado');
        resolve(null);
        return;
      }
      
      // Coordenadas de El Salvador (centro aproximado)
      var map = L.map(containerId).setView([13.6929, -89.2182], 11);
      
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(map);
      
      // Datos de ejemplo si no se proporcionan
      if (!points) {
        points = [
          [13.6929, -89.2182, 0.8], // Gran Vía
          [13.7050, -89.2150, 0.5], // Multiplaza
          [13.6800, -89.2200, 0.3], // Galerías
          [13.6700, -89.2300, 0.7], // Metrocentro
          [13.7200, -89.2000, 0.4]  // La Pradera
        ];
      }
      
      var heat = L.heatLayer(points, {
        radius: 25,
        blur: 15,
        maxZoom: 17,
        gradient: {
          0.2: 'blue',
          0.4: 'cyan',
          0.6: 'lime',
          0.8: 'yellow',
          1.0: 'red'
        }
      });
      
      heat.addTo(map);
      
      setTimeout(function() {
        map.invalidateSize();
      }, 500);
      
      resolve(map);
    });
  });
}

// ==========================================
// GENERAR DATOS DE MAPA DE CALOR DESDE REQUISICIONES
// ==========================================
function generarHeatmapData() {
  var data = localStorage.getItem('siman_config_data');
  var puntos = [];
  
  if (data) {
    var config = JSON.parse(data);
    var centros = config.comerciales || [];
    
    // Mapeo de centros a coordenadas (ejemplo)
    var coordMap = {
      'Gran Vía': [13.6929, -89.2182],
      'Multiplaza': [13.7050, -89.2150],
      'Galerías': [13.6800, -89.2200],
      'Metrocentro': [13.6700, -89.2300],
      'La Pradera': [13.7200, -89.2000],
      'Las Cascadas': [13.7300, -89.1900]
    };
    
    centros.forEach(function(c) {
      var coord = coordMap[c.nombre];
      if (coord) {
        var intensidad = c.estado === 'activo' ? 0.7 : 0.2;
        puntos.push([coord[0], coord[1], intensidad]);
      }
    });
  }
  
  return puntos;
}