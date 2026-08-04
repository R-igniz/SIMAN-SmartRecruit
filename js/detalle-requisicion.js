// ==========================================
// DETALLE REQUISICIÓN - VISUALIZACIÓN
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
    renderizarDetalle();
}

function renderizarDetalle() {
    var r = requisicionData;
    document.getElementById('detId').textContent = r.id;
    document.getElementById('detPuesto').textContent = r.puesto || '-';
    document.getElementById('detCentro').textContent = r.centro || '-';
    document.getElementById('detTienda').textContent = r.tienda || '-';
    document.getElementById('detDepartamento').textContent = r.departamento || '-';
    document.getElementById('detGerente').textContent = r.gerente || '-';
    document.getElementById('detFecha').textContent = r.fecha || '-';
    document.getElementById('detTipoContratacion').textContent = r.tipoContratacion || '-';
    document.getElementById('detCantidad').textContent = r.cantidad || '1';
    document.getElementById('detPrioridad').textContent = r.prioridad || 'Media';
    document.getElementById('detMotivo').textContent = r.motivo || '-';
    document.getElementById('detReclutador').textContent = r.reclutador || 'No asignado';
    document.getElementById('detEstado').textContent = r.estado || 'Nueva';
    document.getElementById('detFechaCreacion').textContent = r.fechaCreacion ? new Date(r.fechaCreacion).toLocaleString() : '-';
}

document.addEventListener('DOMContentLoaded', function() {
    var user = getCurrentUser();
    if (!user) {
        window.location.href = '/login.html';
        return;
    }
    // ✅ VERIFICACIÓN CORRECTA: ver_requisiciones es suficiente para ver detalle
    if (!tienePermiso('ver_requisiciones')) {
        console.warn('⛔ Acceso denegado: sin permiso ver_requisiciones');
        window.location.href = '/dashboard.html';
        return;
    }
    cargarRequisicion();
});

window.cargarRequisicion = cargarRequisicion;