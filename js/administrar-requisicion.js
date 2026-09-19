// ==========================================
// ADMINISTRAR REQUISICIÓN - TIMELINE Y ESTADOS
// ==========================================
var requisicionId = null;
var requisicionData = null;

function getParametroUrl(param) {
    var urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}

function cargarRequisicion() {
    requisicionId = getParametroUrl('id');
    if (!requisicionId) {
        alert('⚠️ No se especificó ninguna requisición.');
        window.location.href = '/requisiciones.html';
        return;
    }
    var requisiciones = JSON.parse(localStorage.getItem('requisiciones_data') || '[]');
    requisicionData = requisiciones.find(function(r) { return r.id === requisicionId; });
    if (!requisicionData) {
        alert('⚠️ Requisición no encontrada.');
        window.location.href = '/requisiciones.html';
        return;
    }
    renderizarDatos();
    renderizarTimeline();
}

function renderizarDatos() {
    var r = requisicionData;
    document.getElementById('reqId').textContent = r.id;
    document.getElementById('reqPuesto').textContent = r.puesto || '-';
    document.getElementById('reqCentro').textContent = r.centro || '-';
    document.getElementById('reqTienda').textContent = r.tienda || '-';
    document.getElementById('reqDepartamento').textContent = r.departamento || '-';
    document.getElementById('reqGerente').textContent = r.gerente || '-';
    document.getElementById('reqFecha').textContent = r.fecha || '-';
    document.getElementById('reqTipoContratacion').textContent = r.tipoContratacion || '-';
    document.getElementById('reqCantidad').textContent = r.cantidad || '1';
    document.getElementById('reqPrioridad').textContent = r.prioridad || 'Media';
    document.getElementById('reqMotivo').textContent = r.motivo || '-';
    document.getElementById('reqReclutador').textContent = r.reclutador || 'No asignado';
    document.getElementById('reqEstado').textContent = r.estado || 'Nueva';
}

function renderizarTimeline() {
    var estados = ['Nueva', 'Revisando', 'Publicada', 'Recibiendo CV', 'Entrevistas', 'Evaluaciones', 'Oferta', 'Contratado', 'Cerrado'];
    var estadoActual = requisicionData.estado || 'Nueva';
    var container = document.getElementById('timelineContainer');
    container.innerHTML = '';
    estados.forEach(function(estado) {
        var div = document.createElement('div');
        div.className = 'timeline-item';
        var isComplete = estados.indexOf(estado) <= estados.indexOf(estadoActual);
        var isActive = estado === estadoActual;
        if (isComplete) div.classList.add('completed');
        if (isActive) div.classList.add('active');
        div.innerHTML = `
            <div class="timeline-dot"></div>
            <div class="timeline-content">
                <div class="timeline-title">${estado}</div>
                <div class="timeline-date">${isComplete ? 'Completado' : isActive ? 'En proceso' : 'Pendiente'}</div>
            </div>
        `;
        container.appendChild(div);
    });
}

function avanzarEstado() {
    var estados = ['Nueva', 'Revisando', 'Publicada', 'Recibiendo CV', 'Entrevistas', 'Evaluaciones', 'Oferta', 'Contratado', 'Cerrado'];
    var indiceActual = estados.indexOf(requisicionData.estado);
    if (indiceActual >= estados.length - 1) {
        alert('⚠️ La requisición ya está en el estado final.');
        return;
    }
    var nuevoEstado = estados[indiceActual + 1];
    if (confirm('¿Avanzar al estado "' + nuevoEstado + '"?')) {
        requisicionData.estado = nuevoEstado;
        actualizarRequisicion();
    }
}

function actualizarRequisicion() {
    var requisiciones = JSON.parse(localStorage.getItem('requisiciones_data') || '[]');
    var index = requisiciones.findIndex(function(r) { return r.id === requisicionId; });
    if (index !== -1) {
        requisiciones[index] = requisicionData;
        localStorage.setItem('requisiciones_data', JSON.stringify(requisiciones));
        if (typeof guardarEnSupabase === 'function') {
            guardarEnSupabase('requisiciones', requisicionData);
        }
        renderizarDatos();
        renderizarTimeline();
        if (typeof agregarNotificacion === 'function') {
            agregarNotificacion('success', 'Estado actualizado a: ' + requisicionData.estado, '/administrar-requisicion.html?id=' + requisicionId);
        }
    }
}

function agregarComentario() {
    var input = document.getElementById('comentarioInput');
    var texto = input.value.trim();
    if (!texto) { alert('⚠️ Escribe un comentario.'); return; }
    var container = document.getElementById('comentariosContainer');
    var div = document.createElement('div');
    div.className = 'comentario';
    var user = getCurrentUser();
    div.innerHTML = `
        <div class="comentario-header">
            <strong>${user ? user.name : 'Usuario'}</strong>
            <span class="comentario-fecha">${new Date().toLocaleString()}</span>
        </div>
        <div class="comentario-texto">${texto}</div>
    `;
    container.appendChild(div);
    input.value = '';
}

document.addEventListener('DOMContentLoaded', function() {
    var user = getCurrentUser();
    if (!user) {
        window.location.href = '/login.html';
        return;
    }
    // ✅ VERIFICACIÓN CORRECTA
    if (!tienePermiso('administrar_requisicion')) {
        console.warn('⛔ Acceso denegado: sin permiso administrar_requisicion');
        window.location.href = '/dashboard.html';
        return;
    }
    cargarRequisicion();
});

window.avanzarEstado = avanzarEstado;
window.agregarComentario = agregarComentario;