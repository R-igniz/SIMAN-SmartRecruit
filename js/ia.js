document.addEventListener('DOMContentLoaded', function() {
  const user = getCurrentUser();
  if (!user) return;
  
  console.log('SmartRecruit AI cargado');
});

// ===== RESPONSES DE IA =====
const aiResponses = {
  'vacantes abiertas': 'Actualmente hay <strong>24 vacantes abiertas</strong> en el sistema. Distribución: Gran Vía (8), Multiplaza (6), Galerías (4), Metrocentro (3), La Pradera (2), Las Cascadas (1).',
  '30 días': 'Las solicitudes que llevan más de 30 días son: <strong>#R-118</strong> (15d), <strong>#R-125</strong> (6d), <strong>#R-130</strong> (12d). Ninguna supera los 30 días actualmente.',
  'mayor carga': 'La reclutadora con mayor carga es <strong>María Gómez</strong> con 12 requisiciones activas. Le sigue Ana López con 9 requisiciones.',
  'reporte mensual': '📊 <strong>Reporte Julio 2026</strong>:<br>• Contrataciones: 18<br>• Vacantes abiertas: 24<br>• Tiempo promedio: 4.7 días<br>• Tasa de éxito: 82%<br>• Top reclutadora: María Gómez (12)',
  'resume': 'Requisición #R-142:<br>• Puesto: Analista Financiero<br>• Centro: Gran Vía<br>• Estado: Recibiendo CV<br>• Tiempo: 8 días<br>• Candidatos: 12',
  'críticas': 'Vacantes críticas identificadas:<br>• #R-130 - Auxiliar RH (12 días)<br>• #R-145 - Analista Financiero (5 días)',
  'cuello de botella': 'Se ha detectado un cuello de botella en la etapa de <strong>Entrevistas</strong>. El tiempo promedio en esta etapa es de 3.2 días, superior al objetivo de 2 días.',
  'prioridades': 'Recomendación de prioridades:<br>1. #R-130 - Auxiliar RH (Urgente)<br>2. #R-145 - Analista Financiero (Alta)<br>3. #R-142 - Cajero (Media)'
};

function getAIResponse(question) {
  const lower = question.toLowerCase();
  
  for (const [key, response] of Object.entries(aiResponses)) {
    if (lower.includes(key)) {
      return response;
    }
  }
  
  return 'Lo siento, no tengo información específica sobre esa consulta. Puedo ayudarte con: vacantes abiertas, solicitudes +30 días, carga de reclutadoras, reportes mensuales, resúmenes de requisiciones, vacantes críticas, cuellos de botella y prioridades.';
}

function askQuestion(question) {
  document.getElementById('chatInput').value = question;
  sendMessage();
}

function sendMessage() {
  const input = document.getElementById('chatInput');
  const question = input.value.trim();
  
  if (!question) return;
  
  // Agregar mensaje del usuario
  const messagesContainer = document.getElementById('chatMessages');
  const userMsg = document.createElement('div');
  userMsg.className = 'message user';
  userMsg.innerHTML = `
    <div class="message-avatar"><i class="fas fa-user"></i></div>
    <div class="message-content">
      <p>${question}</p>
      <p class="message-time">Ahora</p>
    </div>
  `;
  messagesContainer.appendChild(userMsg);
  
  // Limpiar input
  input.value = '';
  
  // Simular respuesta de IA
  setTimeout(() => {
    const response = getAIResponse(question);
    const aiMsg = document.createElement('div');
    aiMsg.className = 'message ai';
    aiMsg.innerHTML = `
      <div class="message-avatar"><i class="fas fa-robot"></i></div>
      <div class="message-content">
        <p>${response}</p>
        <p class="message-time">Ahora</p>
      </div>
    `;
    messagesContainer.appendChild(aiMsg);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }, 500);
  
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}