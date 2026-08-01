// ==========================================
// EMAIL INTEGRATION (EmailJS)
// ==========================================
// Configuración - REEMPLAZAR CON TUS DATOS
var EMAIL_CONFIG = {
  userID: 'TU_USER_ID',
  serviceID: 'TU_SERVICE_ID',
  templateID: 'TU_TEMPLATE_ID'
};

function initEmailJS() {
  if (window.emailjs) return;
  
  var script = document.createElement('script');
  script.src = 'https://cdn.jsdelivr.net/npm/@emailjs/browser@3/dist/email.min.js';
  script.onload = function() {
    emailjs.init(EMAIL_CONFIG.userID);
    console.log('✅ EmailJS inicializado');
  };
  document.head.appendChild(script);
}

// ==========================================
// ENVIAR CORREO
// ==========================================
function enviarCorreo(destinatario, asunto, mensaje, datosAdicionales) {
  if (!window.emailjs) {
    initEmailJS();
    setTimeout(function() {
      enviarCorreo(destinatario, asunto, mensaje, datosAdicionales);
    }, 1000);
    return;
  }
  
  var templateParams = {
    to_email: destinatario,
    subject: asunto,
    message: mensaje,
    from_name: 'SIMAN SmartRecruit',
    reply_to: 'noreply@siman.com'
  };
  
  // Agregar datos adicionales
  if (datosAdicionales) {
    Object.keys(datosAdicionales).forEach(function(key) {
      templateParams[key] = datosAdicionales[key];
    });
  }
  
  emailjs.send(EMAIL_CONFIG.serviceID, EMAIL_CONFIG.templateID, templateParams)
    .then(function(response) {
      console.log('✅ Correo enviado:', response);
      // Agregar notificación
      if (window.agregarNotificacion) {
        agregarNotificacion('success', 'Correo enviado a ' + destinatario, '/notificaciones');
      }
    })
    .catch(function(error) {
      console.error('❌ Error enviando correo:', error);
    });
}

// ==========================================
// PLANTILLAS DE CORREO
// ==========================================
function enviarBienvenida(usuario) {
  var mensaje = 'Bienvenido al sistema SIMAN SmartRecruit\n\n' +
    'Hola ' + usuario.nombre + ',\n\n' +
    'Tu cuenta ha sido creada exitosamente.\n' +
    'Usuario: ' + usuario.email + '\n' +
    'Rol: ' + usuario.rol + '\n\n' +
    'Saludos,\n' +
    'Equipo SIMAN';
  
  enviarCorreo(usuario.email, 'Bienvenido a SIMAN SmartRecruit', mensaje);
}

function enviarNotificacionRequisicion(requisicion, reclutadora) {
  var mensaje = 'Nueva requisición asignada\n\n' +
    'Se te ha asignado una nueva requisición:\n' +
    'ID: ' + requisicion.id + '\n' +
    'Puesto: ' + requisicion.puesto + '\n' +
    'Centro: ' + requisicion.centroComercial + '\n' +
    'Prioridad: ' + requisicion.prioridad + '\n\n' +
    'Por favor revisa el sistema para más detalles.';
  
  enviarCorreo(reclutadora.email, 'Nueva requisición asignada', mensaje);
}