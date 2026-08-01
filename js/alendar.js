// ==========================================
// GOOGLE CALENDAR API
// ==========================================
// Configuración - REEMPLAZAR CON TUS DATOS
var CALENDAR_CONFIG = {
  apiKey: 'TU_GOOGLE_API_KEY',
  clientId: 'TU_GOOGLE_CLIENT_ID',
  scope: 'https://www.googleapis.com/auth/calendar'
};

function initGoogleCalendar() {
  return new Promise(function(resolve) {
    var script = document.createElement('script');
    script.src = 'https://apis.google.com/js/api.js';
    script.onload = function() {
      gapi.load('client', function() {
        gapi.client.init({
          apiKey: CALENDAR_CONFIG.apiKey,
          discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest'],
          clientId: CALENDAR_CONFIG.clientId,
          scope: CALENDAR_CONFIG.scope
        }).then(function() {
          console.log('✅ Google Calendar inicializado');
          resolve(true);
        }).catch(function(error) {
          console.error('Error inicializando Calendar:', error);
          resolve(false);
        });
      });
    };
    document.head.appendChild(script);
  });
}

// ==========================================
// CREAR EVENTO EN CALENDAR
// ==========================================
function crearEventoCalendar(datos) {
  return new Promise(function(resolve) {
    initGoogleCalendar().then(function(success) {
      if (!success) {
        resolve({ success: false, error: 'No se pudo inicializar Calendar' });
        return;
      }
      
      var event = {
        'summary': datos.titulo || 'Entrevista SIMAN',
        'location': datos.ubicacion || 'Oficina SIMAN',
        'description': datos.descripcion || 'Entrevista de trabajo',
        'start': {
          'dateTime': datos.fechaHora,
          'timeZone': 'America/El_Salvador'
        },
        'end': {
          'dateTime': datos.fechaHoraFin || new Date(new Date(datos.fechaHora).getTime() + 60*60*1000).toISOString(),
          'timeZone': 'America/El_Salvador'
        },
        'attendees': (datos.asistentes || []).map(function(email) {
          return { 'email': email };
        }),
        'reminders': {
          'useDefault': false,
          'overrides': [
            { 'method': 'email', 'minutes': 24 * 60 },
            { 'method': 'popup', 'minutes': 30 }
          ]
        }
      };
      
      gapi.client.calendar.events.insert({
        'calendarId': 'primary',
        'resource': event,
        'sendUpdates': 'all'
      }).then(function(response) {
        console.log('✅ Evento creado:', response);
        resolve({ success: true, data: response.result });
      }).catch(function(error) {
        console.error('❌ Error creando evento:', error);
        resolve({ success: false, error: error });
      });
    });
  });
}

// ==========================================
// OBTENER EVENTOS DEL CALENDAR
// ==========================================
function obtenerEventosCalendar(fechaInicio, fechaFin) {
  return new Promise(function(resolve) {
    initGoogleCalendar().then(function(success) {
      if (!success) {
        resolve({ success: false, error: 'No se pudo inicializar Calendar' });
        return;
      }
      
      var start = fechaInicio || new Date().toISOString();
      var end = fechaFin || new Date(new Date().getTime() + 30*24*60*60*1000).toISOString();
      
      gapi.client.calendar.events.list({
        'calendarId': 'primary',
        'timeMin': start,
        'timeMax': end,
        'showDeleted': false,
        'singleEvents': true,
        'orderBy': 'startTime'
      }).then(function(response) {
        var events = response.result.items || [];
        resolve({ success: true, data: events });
      }).catch(function(error) {
        console.error('❌ Error obteniendo eventos:', error);
        resolve({ success: false, error: error });
      });
    });
  });
}

// ==========================================
// CREAR EVENTO DE ENTREVISTA
// ==========================================
function crearEventoEntrevista(candidato, puesto, fecha, hora, reclutadora) {
  var fechaHora = fecha + 'T' + hora + ':00';
  var fechaHoraFin = fecha + 'T' + (parseInt(hora.split(':')[0]) + 1) + ':00';
  
  return crearEventoCalendar({
    titulo: 'Entrevista: ' + candidato.nombre + ' - ' + puesto,
    ubicacion: 'Oficina SIMAN - Sala de Reuniones',
    descripcion: 'Entrevista para el puesto de ' + puesto + '\n' +
      'Candidato: ' + candidato.nombre + '\n' +
      'Email: ' + candidato.email + '\n' +
      'Reclutadora: ' + reclutadora,
    fechaHora: fechaHora,
    fechaHoraFin: fechaHoraFin,
    asistentes: [candidato.email, reclutadora.email]
  });
}