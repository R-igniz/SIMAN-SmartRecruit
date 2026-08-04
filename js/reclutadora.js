// ==========================================
// RECLUTADORA - PANEL DE RECLUTADORA
// ==========================================

var requisicionesFiltradas = [];

function cargarRequisicionesReclutadora() {
    var container = document.getElementById('requisicionesContainer');
    if (!container) return;

    var user = getCurrentUser();
    if (!user) {
        window.location.href = '/login.html';
        return;
    }

    // ✅ VERIFICACIÓN CORRECTA: permisos para RECLUTADORA
    if (!tienePermiso('ver_reclutadora')) {
        console.warn('⛔ Acceso denegado: sin permiso ver_reclutadora');
        alert('⚠️ No tienes permisos para acceder al Panel de Reclutadora.');
        window.location.href = '/dashboard.html';
        return;
    }

    var requisiciones = JSON.parse(localStorage.getItem('requisiciones_data') || '[]');
    var data = obtenerDatosConfig();
    var reclutadores = data.usuarios ? data.usuarios.filter(function(u) { return u.rol === 'Reclutadora'; }) : [];

    var asignadas = requisiciones;
    if (user.role === 'Reclutadora') {
        asignadas = requisiciones.filter(function(r) {
            return r.reclutador === user.name;
        });
    }

    requisicionesFiltradas = asignadas;
    aplicarFiltros();
    cargarFiltros();
}

function cargarFiltros() {
    var data = obtenerDatosConfig();
    var comerciales = data.comerciales || [];

    var selectCentro = document.getElementById('filtroCentro');
    if (selectCentro) {
        selectCentro.innerHTML = '<option value="">Todos</option>';
        comerciales.forEach(function(c) {
            if (c.estado === 'activo') {
                var opt = document.createElement('option');
                opt.value = c.nombre;
                opt.textContent = c.nombre;
                selectCentro.appendChild(opt);
            }
        });
    }
}

function aplicarFiltros() {
    var container = document.getElementById('requisicionesContainer');
    if (!container) return;

    var centro = document.getElementById('filtroCentro').value;
    var estado = document.getElementById('filtroEstado').value;
    var prioridad = document.getElementById('filtroPrioridad').value;

    var filtradas = requisicionesFiltradas.filter(function(r) {
        var matchCentro = !centro || r.centro === centro;
        var matchEstado = !estado || r.estado === estado;
        var matchPrioridad = !prioridad || r.prioridad === prioridad;
        return matchCentro && matchEstado && matchPrioridad;
    });

    container.innerHTML = '';

    if (filtradas.length === 0) {
        container.innerHTML = '<div class="empty-state"><i class="fas fa-inbox"></i>No hay requisiciones que coincidan con los filtros</div>';
        return;
    }

    var prioridadBadge = {
        'Alta': 'badge-red',
        'Media': 'badge-yellow',
        'Baja': 'badge-blue'
    };

    var estadoMap = {
        'Nueva': 'badge-blue',
        'Revisando': 'badge-yellow',
        'Publicada': 'badge-blue',
        'En Proceso': 'badge-yellow',
        'Entrevistas': 'badge-green',
        'Urgente': 'badge-red',
        'Cerrado': 'badge-gray'
    };

    filtradas.forEach(function(r) {
        var card = document.createElement('div');
        card.className = 'requisicion-card';

        var fecha = r.fecha ? new Date(r.fecha).toLocaleDateString('es-ES') : 'Sin fecha';
        var tiempoAbierto = 'N/A';
        if (r.fechaCreacion) {
            var creado = new Date(r.fechaCreacion);
            var hoy = new Date();
            var diff = Math.floor((hoy - creado) / (1000 * 60 * 60 * 24));
            tiempoAbierto = diff + 'd';
        }

        var reclutadorNombre = r.reclutador || 'No asignado';

        card.innerHTML = `
            <div class="card-header-custom">
                <div>
                    <div class="card-title">${r.puesto || 'Sin título'}</div>
                    <div class="card-subtitle">
                        <i class="fas fa-store"></i> ${r.centro || '-'}
                        ${r.tienda ? '· ' + r.tienda : ''}
                    </div>
                </div>
                <div style="text-align:right; white-space:nowrap;">
                    <span class="badge ${prioridadBadge[r.prioridad] || 'badge-gray'}">${r.prioridad || 'Media'}</span>
                    <div style="margin-top:4px;">
                        <span class="badge ${estadoMap[r.estado] || 'badge-gray'}">${r.estado || 'Nueva'}</span>
                    </div>
                </div>
            </div>
            <div class="card-meta">
                <span><i class="far fa-calendar-alt"></i> ${fecha}</span>
                <span><i class="far fa-clock"></i> ${tiempoAbierto} abierta</span>
                <span><i class="fas fa-hashtag"></i> ${r.id}</span>
                <span><i class="fas fa-user-tie"></i> ${reclutadorNombre}</span>
            </div>
            <div class="card-actions">
                <button class="btn btn-primary" onclick="navigateTo('/administrar-requisicion.html?id=${r.id}')">
                    <i class="fas fa-tasks"></i> Administrar
                </button>
                <button class="btn btn-outline" onclick="navigateTo('/detalle-requisicion.html?id=${r.id}')">
                    <i class="fas fa-eye"></i> Ver Detalle
                </button>
            </div>
        `;
        container.appendChild(card);
    });

    var totalBadge = document.getElementById('totalRequisiciones');
    if (totalBadge) {
        totalBadge.textContent = filtradas.length + ' requisiciones';
    }
}

function limpiarFiltros() {
    document.getElementById('filtroCentro').value = '';
    document.getElementById('filtroEstado').value = '';
    document.getElementById('filtroPrioridad').value = '';
    aplicarFiltros();
}

function sincronizarReclutadora() {
    if (typeof obtenerDeSupabase === 'function') {
        obtenerDeSupabase('requisiciones').then(function(result) {
            if (result.success && result.data) {
                localStorage.setItem('requisiciones_data', JSON.stringify(result.data));
                cargarRequisicionesReclutadora();
            }
        });
    }
}

window.addEventListener('storage', function(e) {
    if (e.key === 'requisiciones_data' || e.key === 'siman_config_data') {
        cargarRequisicionesReclutadora();
    }
});

document.addEventListener('DOMContentLoaded', function() {
    var user = getCurrentUser();
    if (!user) {
        window.location.href = '/login.html';
        return;
    }

    // ✅ VERIFICACIÓN CORRECTA: ver_reclutadora
    if (!tienePermiso('ver_reclutadora')) {
        console.warn('⛔ Acceso denegado: sin permiso ver_reclutadora');
        alert('⚠️ No tienes permisos para acceder al Panel de Reclutadora.');
        window.location.href = '/dashboard.html';
        return;
    }

    cargarRequisicionesReclutadora();

    if (typeof initSupabase === 'function') {
        initSupabase().then(function() {
            sincronizarReclutadora();
        });
    }
});

window.cargarRequisicionesReclutadora = cargarRequisicionesReclutadora;
window.aplicarFiltros = aplicarFiltros;
window.limpiarFiltros = limpiarFiltros;
window.sincronizarReclutadora = sincronizarReclutadora;