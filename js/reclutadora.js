// ==========================================
// RECLUTADORA - PANEL DE RECLUTADORA
// ==========================================

var requisicionesFiltradas = [];

function cargarRequisicionesReclutadora() {
    var container = document.getElementById('requisicionesContainer');
    if (!container) return;
    
    var user = getCurrentUser();
    if (!user) return;
    
    var requisiciones = JSON.parse(localStorage.getItem('requisiciones_data') || '[]');
    var data = obtenerDatosConfig();
    var reclutadores = data.usuarios ? data.usuarios.filter(function(u) { return u.rol === 'Reclutadora'; }) : [];
    
    // Si el usuario es reclutadora, mostrar solo sus asignadas
    var asignadas = requisiciones;
    if (user.role === 'Reclutadora') {
        asignadas = requisiciones.filter(function(r) {
            return r.reclutador === user.name;
        });
    }
    
    requisicionesFiltradas = asignadas;
    aplicarFiltros();
    
    // Cargar filtros
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
        card.className = 'card';
        card.style.cssText = 'border-left:4px solid ' + (r.prioridad === 'Alta' ? 'var(--danger)' : r.prioridad === 'Media' ? 'var(--warning)' : 'var(--primary)') + ';';
        
        var fecha = r.fecha ? new Date(r.fecha).toLocaleDateString('es-ES') : 'Sin fecha';
        var tiempoAbierto = 'N/A';
        if (r.fechaCreacion) {
            var creado = new Date(r.fechaCreacion);
            var hoy = new Date();
            var diff = Math.floor((hoy - creado) / (1000 * 60 * 60 * 24));
            tiempoAbierto = diff + 'd';
        }
        
        card.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                <div>
                    <div style="font-weight:600; font-size:16px; color:var(--text-secondary);">${r.puesto || 'Sin título'}</div>
                    <div style="color:var(--text-muted); font-size:13px;">
                        <i class="fas fa-store"></i> ${r.centro || '-'}
                        ${r.tienda ? '· ' + r.tienda : ''}
                    </div>
                </div>
                <div style="text-align:right;">
                    <span class="badge ${prioridadBadge[r.prioridad] || 'badge-gray'}">${r.prioridad || 'Media'}</span>
                    <div style="margin-top:4px;">
                        <span class="badge ${estadoMap[r.estado] || 'badge-gray'}">${r.estado || 'Nueva'}</span>
                    </div>
                </div>
            </div>
            <div style="display:flex; gap:12px; margin-top:8px; font-size:12px; color:var(--text-muted);">
                <span><i class="far fa-calendar-alt"></i> ${fecha}</span>
                <span><i class="far fa-clock"></i> ${tiempoAbierto} abierta</span>
                <span><i class="fas fa-hashtag"></i> ${r.id}</span>
            </div>
            <div style="margin-top:12px; display:flex; gap:8px;">
                <button class="btn btn-primary" style="flex:1; justify-content:center; padding:6px 12px; font-size:12px;" onclick="navigateTo('/administrar-requisicion.html?id=${r.id}')">
                    <i class="fas fa-tasks"></i> Administrar
                </button>
                <button class="btn btn-outline" style="flex:1; justify-content:center; padding:6px 12px; font-size:12px;" onclick="navigateTo('/detalle-requisicion.html?id=${r.id}')">
                    <i class="fas fa-eye"></i> Ver Detalle
                </button>
            </div>
        `;
        container.appendChild(card);
    });
    
    // Actualizar contador
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

// ==========================================
// SINCRONIZAR
// ==========================================
window.addEventListener('storage', function(e) {
    if (e.key === 'requisiciones_data' || e.key === 'siman_config_data') {
        cargarRequisicionesReclutadora();
    }
});

// ==========================================
// INICIALIZAR
// ==========================================
document.addEventListener('DOMContentLoaded', function() {
    var user = getCurrentUser();
    if (!user) {
        window.location.href = '/login.html';
        return;
    }
    
    cargarRequisicionesReclutadora();
    
    if (typeof initSupabase === 'function') {
        initSupabase().then(function() {
            if (typeof sincronizarRequisiciones === 'function') {
                sincronizarRequisiciones();
            }
        });
    }
});

window.cargarRequisicionesReclutadora = cargarRequisicionesReclutadora;
window.aplicarFiltros = aplicarFiltros;
window.limpiarFiltros = limpiarFiltros;