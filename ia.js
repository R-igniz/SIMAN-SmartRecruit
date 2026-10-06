// ==========================================
// SMART AI - ASISTENTE INTELIGENTE
// ==========================================

function cargarIA() {
    var container = document.getElementById('iaContainer');
    if (!container) return;
    
    container.innerHTML = `
        <div class="ai-chat-container">
            <div class="chat-messages" id="chatMessages">
                <div class="message ai">
                    <div class="message-avatar"><i class="fas fa-robot"></i></div>
                    <div class="message-content">
                        <p>Hola, soy SmartRecruit AI. ¿Cómo puedo ayudarte hoy?</p>
                        <p class="message-time">Ahora</p>
                    </div>
                </div>
            </div>
            <div class="quick-questions">
                <button class="btn btn-outline" onclick="askQuestion('¿Cuántas vacantes abiertas existen?')">Vacantes abiertas</button>
                <button class="btn btn-outline" onclick="askQuestion('¿Qué reclutadora tiene mayor carga?')">Mayor carga</button>
                <button class="btn btn-outline" onclick="askQuestion('Genera un reporte mensual')">Reporte mensual</button>
            </div>
            <div class="chat-input">
                <input type="text" id="chatInput" placeholder="Escribe tu pregunta..." onkeypress="if(event.key==='Enter') sendMessage()" />
                <button class="btn btn-primary" onclick="sendMessage()"><i class="fas fa-paper-plane"></i></button>
            </div>
        </div>
    `;
}

function sendMessage() {
    var input = document.getElementById('chatInput');
    var question = input.value.trim();
    if (!question) return;
    
    var messages = document.getElementById('chatMessages');
    var userMsg = document.createElement('div');
    userMsg.className = 'message user';
    userMsg.innerHTML = `
        <div class="message-avatar"><i class="fas fa-user"></i></div>
        <div class="message-content">
            <p>${question}</p>
            <p class="message-time">Ahora</p>
        </div>
    `;
    messages.appendChild(userMsg);
    input.value = '';
    
    setTimeout(function() {
        var response = "Estoy analizando tu consulta... (respuesta simulada)";
        var aiMsg = document.createElement('div');
        aiMsg.className = 'message ai';
        aiMsg.innerHTML = `
            <div class="message-avatar"><i class="fas fa-robot"></i></div>
            <div class="message-content">
                <p>${response}</p>
                <p class="message-time">Ahora</p>
            </div>
        `;
        messages.appendChild(aiMsg);
        messages.scrollTop = messages.scrollHeight;
    }, 800);
}

function askQuestion(question) {
    document.getElementById('chatInput').value = question;
    sendMessage();
}

// ==========================================
// INICIALIZAR
// ==========================================
document.addEventListener('DOMContentLoaded', function() {
    var user = getCurrentUser();
    if (!user) {
        window.location.href = '/login.html';
        return;
    }
    // ✅ CORRECCIÓN: usar tienePermiso
    if (!tienePermiso('ver_ia')) {
        alert('⚠️ Acceso denegado. No tienes permisos para acceder a SmartRecruit AI.');
        window.location.href = '/dashboard.html';
        return;
    }
    
    cargarIA();
});

window.cargarIA = cargarIA;
window.sendMessage = sendMessage;
window.askQuestion = askQuestion;