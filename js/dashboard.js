// ==========================================
// DASHBOARD - DATOS REALES DESDE SUPABASE
// ==========================================
(function () {
    'use strict';

    var dashboardChannel = null;

    function normalizar(valor) {
        return String(valor || '').trim().toLowerCase();
    }

    function escapar(valor) {
        return String(valor == null ? '' : valor)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;')
            .replace(/>/g, '&gt;').replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function esCerrada(r) {
        var e = normalizar(r.estado);
        return e === 'cerrado' || e === 'cerrada';
    }

    function esContratada(r) {
        return normalizar(r.estado) === 'contratado';
    }

    function fechaDe(r) {
        var raw = r.fechaCreacion || r.fecha_creacion || r.created_at || r.fecha || null;
        if (!raw) return null;
        var d = new Date(raw);
        return isNaN(d.getTime()) ? null : d;
    }

    function esDelMesActual(r) {
        var d = fechaDe(r);
        var hoy = new Date();
        return d && d.getFullYear() === hoy.getFullYear() && d.getMonth() === hoy.getMonth();
    }

    function diasEntre(inicio, fin) {
        return Math.max(0, Math.round((fin.getTime() - inicio.getTime()) / 86400000));
    }

    function badgeEstado(estado) {
        var e = normalizar(estado);
        if (e === 'cerrado' || e === 'cerrada' || e === 'contratado') return 'badge-green';
        if (e === 'urgente') return 'badge-red';
        if (e === 'revisando' || e === 'evaluaciones' || e === 'oferta') return 'badge-yellow';
        if (e === 'entrevistas' || e === 'publicada' || e === 'recibiendo cv') return 'badge-blue';
        return 'badge-gray';
    }

    function setText(id, value) {
        var el = document.getElementById(id);
        if (el) el.textContent = value;
    }

    function setTrend(id, html, clase) {
        var el = document.getElementById(id);
        if (!el) return;
        el.className = 'trend ' + (clase || '');
        el.innerHTML = html;
    }

    async function obtenerRequisicionesReales() {
        if (typeof initSupabase !== 'function') throw new Error('initSupabase no está disponible');
        var client = await initSupabase();
        var respuesta = await client.from('requisiciones').select('*');
        if (respuesta.error) throw respuesta.error;
        var datos = respuesta.data || [];
        localStorage.setItem('requisiciones_data', JSON.stringify(datos));
        return datos;
    }

    function calcularMetricas(requisiciones) {
        var abiertas = requisiciones.filter(function (r) { return !esCerrada(r); });
        var cerradas = requisiciones.filter(esCerrada);
        var contratadasMes = requisiciones.filter(function (r) { return esContratada(r) && esDelMesActual(r); });
        var pendientes = requisiciones.filter(function (r) {
            var e = normalizar(r.estado);
            return e === 'nueva' || e === 'revisando';
        });
        var urgentes = abiertas.filter(function (r) { return normalizar(r.prioridad) === 'urgente'; });

        // El modelo actual no guarda fecha de cierre. Como aproximación real basada
        // en los datos disponibles, se muestra la antigüedad promedio de las cerradas.
        var hoy = new Date();
        var tiempos = cerradas.map(function (r) {
            var inicio = fechaDe(r);
            return inicio ? diasEntre(inicio, hoy) : null;
        }).filter(function (v) { return v !== null; });
        var promedio = tiempos.length ? Math.round(tiempos.reduce(function (a, b) { return a + b; }, 0) / tiempos.length) : 0;

        return {
            abiertas: abiertas.length,
            cerradas: cerradas.length,
            contratadasMes: contratadasMes.reduce(function (sum, r) { return sum + (parseInt(r.cantidad, 10) || 1); }, 0),
            promedio: promedio,
            pendientes: pendientes.length,
            urgentes: urgentes.length,
            alertas: urgentes.length
        };
    }

    function renderKPIs(requisiciones) {
        var m = calcularMetricas(requisiciones);
        setText('kpiAbiertas', m.abiertas);
        setText('kpiCerradas', m.cerradas);
        setText('kpiContrataciones', m.contratadasMes);
        setText('kpiTiempo', m.promedio + 'd');
        setText('kpiPendientes', m.pendientes);
        setText('kpiAlertas', m.alertas);

        setTrend('trendAbiertas', '<i class="fas fa-database"></i> ' + m.abiertas + ' activas', 'up');
        setTrend('trendCerradas', '<i class="fas fa-check"></i> ' + m.cerradas + ' cerradas', 'up');
        setTrend('trendContrataciones', '<i class="fas fa-user-check"></i> mes actual', 'up');
        setTrend('trendTiempo', '<i class="fas fa-clock"></i> antigüedad aprox.', '');
        setTrend('trendPendientes', '<i class="fas fa-exclamation-triangle"></i> ' + m.urgentes + ' urgentes', m.urgentes ? 'danger' : '');
        setTrend('trendAlertas', '<i class="fas fa-circle" style="color:var(--danger);font-size:.5rem"></i> ' + m.alertas + ' prioritarias', m.alertas ? 'danger' : '');
    }

    function renderComerciales(requisiciones) {
        var contenedor = document.getElementById('chartComerciales');
        var labels = document.getElementById('chartLabels');
        if (!contenedor || !labels) return;

        var mapa = {};
        requisiciones.filter(function (r) { return !esCerrada(r); }).forEach(function (r) {
            var nombre = r.centro || r.comercial || 'Sin centro';
            mapa[nombre] = (mapa[nombre] || 0) + (parseInt(r.cantidad, 10) || 1);
        });

        var items = Object.keys(mapa).map(function (nombre) { return { nombre: nombre, total: mapa[nombre] }; })
            .sort(function (a, b) { return b.total - a.total; }).slice(0, 8);

        if (!items.length) {
            contenedor.innerHTML = '<div style="width:100%;text-align:center;color:var(--text-muted);padding:45px 10px">Sin vacantes registradas</div>';
            labels.innerHTML = '';
            return;
        }

        var max = Math.max.apply(null, items.map(function (i) { return i.total; })) || 1;
        contenedor.innerHTML = items.map(function (i) {
            var altura = Math.max(18, Math.round((i.total / max) * 90));
            return '<div class="bar" title="' + escapar(i.nombre) + ': ' + i.total + '" style="height:' + altura + 'px"></div>';
        }).join('');
        labels.innerHTML = items.map(function (i) { return '<span title="' + escapar(i.nombre) + '">' + escapar(i.nombre) + '</span>'; }).join('');
    }

    function renderActividad(requisiciones) {
        var contenedor = document.getElementById('actividadReciente');
        if (!contenedor) return;
        var recientes = requisiciones.slice().sort(function (a, b) {
            return (fechaDe(b) || new Date(0)) - (fechaDe(a) || new Date(0));
        }).slice(0, 5);

        if (!recientes.length) {
            contenedor.innerHTML = '<div class="item"><span>No hay actividad registrada.</span></div>';
            return;
        }

        contenedor.innerHTML = recientes.map(function (r) {
            return '<div class="item">' +
                '<span><i class="fas fa-file-alt" style="color:var(--primary)"></i> ' + escapar(r.id || 'Sin ID') + ' · ' + escapar(r.puesto || 'Sin puesto') + '</span>' +
                '<span class="badge ' + badgeEstado(r.estado) + '">' + escapar(r.estado || 'Nueva') + '</span>' +
                '</div>';
        }).join('');
    }

    function renderUltimas(requisiciones) {
        var contenedor = document.getElementById('ultimasRequisiciones');
        if (!contenedor) return;
        var recientes = requisiciones.slice().sort(function (a, b) {
            return (fechaDe(b) || new Date(0)) - (fechaDe(a) || new Date(0));
        }).slice(0, 6);

        if (!recientes.length) {
            contenedor.innerHTML = '<div class="item"><span>No existen requisiciones todavía.</span></div>';
            return;
        }

        contenedor.innerHTML = recientes.map(function (r) {
            return '<div class="item" style="cursor:pointer" onclick="window.location.href=\'/detalle-requisicion.html?id=' + encodeURIComponent(r.id || '') + '\'">' +
                '<span><strong>#' + escapar(r.id || '-') + '</strong> · ' + escapar(r.puesto || '-') + ' · ' + escapar(r.centro || r.comercial || '-') + '</span>' +
                '<span class="badge ' + badgeEstado(r.estado) + '">' + escapar(r.estado || 'Nueva') + '</span>' +
                '</div>';
        }).join('');
    }

    function renderTodo(requisiciones) {
        renderKPIs(requisiciones);
        renderComerciales(requisiciones);
        renderActividad(requisiciones);
        renderUltimas(requisiciones);
        setText('dashboardActualizado', 'Actualizado ' + new Date().toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit' }));
    }

    async function cargarDashboard() {
        try {
            setText('dashboardActualizado', 'Actualizando...');
            var requisiciones = await obtenerRequisicionesReales();
            console.log('📊 Dashboard: ' + requisiciones.length + ' requisiciones cargadas desde Supabase');
            renderTodo(requisiciones);
        } catch (error) {
            console.error('❌ Error cargando dashboard desde Supabase:', error);
            var cache = JSON.parse(localStorage.getItem('requisiciones_data') || '[]');
            renderTodo(cache);
            setText('dashboardActualizado', 'Sin conexión · datos en caché');
        }
    }

    async function activarRealtime() {
        try {
            var client = await initSupabase();
            if (dashboardChannel) await client.removeChannel(dashboardChannel);
            dashboardChannel = client.channel('dashboard-requisiciones-' + Date.now())
                .on('postgres_changes', { event: '*', schema: 'public', table: 'requisiciones' }, function () {
                    console.log('🔄 Cambio en requisiciones detectado. Actualizando dashboard...');
                    cargarDashboard();
                }).subscribe();
        } catch (error) {
            console.warn('⚠️ Realtime no disponible en dashboard:', error);
        }
    }

    document.addEventListener('DOMContentLoaded', function () {
        var user = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
        if (!user) return;
        console.log('Dashboard cargado para:', user.name || user.username);
        cargarDashboard();
        activarRealtime();
    });

    window.addEventListener('beforeunload', async function () {
        try {
            if (dashboardChannel && supabaseClient) await supabaseClient.removeChannel(dashboardChannel);
        } catch (_) {}
    });

    window.cargarDashboard = cargarDashboard;
})();
