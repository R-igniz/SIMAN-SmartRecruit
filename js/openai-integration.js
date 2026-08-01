// ==========================================
// OPENAI INTEGRATION
// ==========================================
// Configuración - REEMPLAZAR CON TU API KEY
var OPENAI_API_KEY = 'TU_OPENAI_API_KEY';

function initOpenAI() {
  console.log('✅ OpenAI listo para usar');
}

// ==========================================
// CONSULTAR A GPT
// ==========================================
async function consultarGPT(prompt, contexto) {
  try {
    var response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + OPENAI_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: contexto || 'Eres un asistente de reclutamiento para SIMAN SmartRecruit. Ayudas con gestión de personal, requisiciones y procesos de contratación.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 500
      })
    });
    
    if (!response.ok) {
      throw new Error('Error en la API: ' + response.status);
    }
    
    var data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('❌ Error consultando OpenAI:', error);
    return 'Lo siento, hubo un error al procesar tu consulta.';
  }
}

// ==========================================
// FUNCIONES DE IA PARA SMART RECRUIT
// ==========================================
function obtenerContextoReclutamiento() {
  var data = localStorage.getItem('siman_config_data');
  var requisiciones = JSON.parse(localStorage.getItem('requisiciones') || '[]');
  var contexto = '';
  
  if (data) {
    var config = JSON.parse(data);
    contexto += 'Usuarios: ' + (config.usuarios || []).length + '\n';
    contexto += 'Roles: ' + (config.roles || []).map(function(r) { return r.nombre; }).join(', ') + '\n';
    contexto += 'Cartas Oferta: ' + (config.cartasOferta || []).length + '\n';
  }
  
  contexto += 'Requisiciones activas: ' + requisiciones.length + '\n';
  if (requisiciones.length > 0) {
    contexto += 'Últimas requisiciones: ' + requisiciones.slice(0, 3).map(function(r) {
      return r.puesto + ' (' + r.estado + ')';
    }).join(', ');
  }
  
  return contexto;
}

// ==========================================
// PREGUNTAS PREDEFINIDAS PARA IA
// ==========================================
function preguntarIA(pregunta) {
  var contexto = 'Eres un asistente de reclutamiento para SIMAN SmartRecruit. ' +
    'Datos actuales del sistema:\n' + obtenerContextoReclutamiento() + '\n\n' +
    'Responde de manera clara, concisa y profesional.';
  
  return consultarGPT(pregunta, contexto);
}

// ==========================================
// GENERAR RESUMEN DE REQUISICIÓN CON IA
// ==========================================
function generarResumenIA(requisicion) {
  var prompt = 'Genera un resumen ejecutivo para esta requisición:\n' +
    'Puesto: ' + requisicion.puesto + '\n' +
    'Centro: ' + requisicion.centroComercial + '\n' +
    'Estado: ' + requisicion.estado + '\n' +
    'Prioridad: ' + requisicion.prioridad + '\n' +
    'Fecha: ' + requisicion.fecha + '\n' +
    'Cantidad: ' + requisicion.cantidad + '\n\n' +
    'Incluye recomendaciones para agilizar el proceso.';
  
  return consultarGPT(prompt, 'Eres un consultor de RRHH experto en reclutamiento.');
}