// ============================================================
// SIMAN SmartRecruit - Requisiciones Fase 4 PRD
// Fuente de verdad: Supabase
// ============================================================
(function () {
    'use strict';

    console.log('📋 requisiciones.js Fase 4 cargando...');

    var supabaseReq = null;
    var usuarioActual = null;
    var requisicionesActuales = [];
    var canalRealtime = null;
    var timerRealtime = null;

    function $(id) { return document.getElementById(id); }

    function normalizar(v) {
        return String(v || '').normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();
    }

    function escaparHTML(v) {
        return String(v ?? '')
            .replaceAll('&','&amp;').replaceAll('<','&lt;')
            .replaceAll('>','&gt;').replaceAll('"','&quot;')
            .replaceAll("'",'&#039;');
    }

    function formatearFecha(v) {
        if (!v) return '—';
        var s=String(v);
        if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
            var p=s.split('-'); return p[2]+'/'+p[1]+'/'+p[0];
        }
        var d=new Date(v);
        return Number.isNaN(d.getTime()) ? s :
            d.toLocaleDateString('es-GT',{day:'2-digit',month:'2-digit',year:'numeric'});
    }

    function claseEstado(e) {
        e=normalizar(e);
        if (e.includes('contrat') || e.includes('cerr') || e.includes('complet')) return 'badge-green';
        if (e.includes('entrevista') || e.includes('evaluacion') || e.includes('oferta')) return 'badge-purple';
        if (e.includes('revis') || e.includes('proceso') || e.includes('recibiendo')) return 'badge-yellow';
        if (e.includes('public') || e.includes('nueva')) return 'badge-blue';
        return 'badge-gray';
    }

    function esAdmin() {
        var r=normalizar(usuarioActual && (usuarioActual.role_code || usuarioActual.role || usuarioActual.rol));
        return r==='admin' || r==='administrador';
    }

    async function obtenerCliente() {
        if (typeof window.initSupabase === 'function') await window.initSupabase();
        if (window.supabaseClient && typeof window.supabaseClient.from==='function') return window.supabaseClient;
        if (window.supabaseDB && typeof window.supabaseDB.from==='function') return window.supabaseDB;
        if (typeof window.getSupabaseClient==='function') {
            var c=await Promise.resolve(window.getSupabaseClient());
            if (c && typeof c.from==='function') return c;
        }
        if (typeof window.getSupabase==='function') {
            var c2=await Promise.resolve(window.getSupabase());
            if (c2 && typeof c2.from==='function') return c2;
        }
        throw new Error('No fue posible obtener el cliente Supabase.');
    }

    async function validarAcceso() {
        if (typeof window.requireAuth==='function') {
            usuarioActual=await window.requireAuth();
        }
        if (!usuarioActual && typeof window.getCurrentUser==='function') {
            usuarioActual=await Promise.resolve(window.getCurrentUser());
        }
        if (!usuarioActual) {
            window.location.replace('/login.html'); return false;
        }
        if (typeof window.tienePermiso==='function') {
            var ok=await Promise.resolve(window.tienePermiso('ver_requisiciones'));
            if (!ok) {
                window.location.replace('/dashboard.html'); return false;
            }
        }
        return true;
    }

    function renderError(msg) {
        var tbody=$('requisicionesBody');
        if (tbody) tbody.innerHTML=
            '<tr><td colspan="8" class="empty-state">'+
            '<i class="fas fa-triangle-exclamation"></i>'+
            '<strong>No fue posible cargar las requisiciones</strong>'+
            '<span>'+escaparHTML(msg)+'</span></td></tr>';
    }

    async function cargarRequisiciones() {
        if (!supabaseReq) return;
        var btn=$('btnSincronizar');
        if (btn) btn.disabled=true;

        try {
            console.log('🔄 Cargando requisiciones desde Supabase...');

            var q=supabaseReq.from('requisiciones').select('*')
                .order('created_at',{ascending:false});

            if (!esAdmin()) {
                var uid=usuarioActual.id || usuarioActual.user_id || usuarioActual.uuid;
                if (uid) q=q.eq('reclutador_id',uid);
            }

            var result=await q;
            if (result.error) throw result.error;

            requisicionesActuales=Array.isArray(result.data) ? result.data : [];
            renderizarTabla(requisicionesActuales);

            console.log('✅ Requisiciones cargadas:',requisicionesActuales.length);
        } catch (error) {
            console.error('❌ Error cargando requisiciones:',error);
            renderError(error.message || 'Error consultando Supabase');
        } finally {
            if (btn) btn.disabled=false;
        }
    }

    function renderizarTabla(lista) {
        var tbody=$('requisicionesBody');
        if (!tbody) return;

        if (!lista || !lista.length) {
            tbody.innerHTML='<tr><td colspan="8" class="empty-state">'+
                '<i class="fas fa-inbox"></i><strong>No hay requisiciones registradas</strong></td></tr>';
            return;
        }

        tbody.innerHTML=lista.map(function(r){
            var codigo=r.codigo || ('REQ-'+r.id);
            return '<tr>'+
                '<td><strong>'+escaparHTML(codigo)+'</strong></td>'+
                '<td>'+escaparHTML(r.puesto || '—')+'</td>'+
                '<td>'+escaparHTML(r.centro || '—')+'</td>'+
                '<td>'+escaparHTML(r.tienda || '—')+'</td>'+
                '<td><span class="badge '+claseEstado(r.estado)+'">'+escaparHTML(r.estado || 'Nueva')+'</span></td>'+
                '<td>'+escaparHTML(r.reclutador || 'No asignado')+'</td>'+
                '<td>'+escaparHTML(formatearFecha(r.fecha || r.created_at))+'</td>'+
                '<td style="text-align:center;"><div class="req-actions">'+
                    '<button class="btn-icon btn-ver" data-id="'+Number(r.id)+'" title="Ver detalle"><i class="fas fa-eye"></i></button>'+
                    '<button class="btn-icon btn-gestionar" data-id="'+Number(r.id)+'" title="Administrar"><i class="fas fa-edit"></i></button>'+
                '</div></td></tr>';
        }).join('');
    }

    function navegar(ruta) {
        if (typeof window.navigateTo==='function') window.navigateTo(ruta);
        else window.location.href=ruta;
    }

    function configurarEventos() {
        $('btnSincronizar')?.addEventListener('click',sincronizarRequisiciones);
        $('btnNuevaRequisicion')?.addEventListener('click',function(){
            navegar('/nueva-requisicion.html');
        });

        $('requisicionesBody')?.addEventListener('click',function(e){
            var ver=e.target.closest('.btn-ver');
            var gestionar=e.target.closest('.btn-gestionar');
            if (ver) {
                navegar('/administrar-requisicion.html?id='+Number(ver.dataset.id));
            } else if (gestionar) {
                navegar('/administrar-requisicion.html?id='+Number(gestionar.dataset.id));
            }
        });
    }

    async function sincronizarRequisiciones() {
        await cargarRequisiciones();
    }

    function programarRecarga() {
        clearTimeout(timerRealtime);
        timerRealtime=setTimeout(cargarRequisiciones,250);
    }

    async function iniciarRealtime() {
        if (!supabaseReq || typeof supabaseReq.channel!=='function') return;

        canalRealtime=supabaseReq
            .channel('requisiciones-listado-'+Date.now())
            .on('postgres_changes',{
                event:'*',schema:'public',table:'requisiciones'
            },function(payload){
                console.log('📡 Cambio requisiciones:',payload.eventType);
                programarRecarga();
            })
            .subscribe(function(status){
                if (status==='SUBSCRIBED') console.log('📡 Realtime Requisiciones activo');
            });
    }

    async function iniciar() {
        try {
            console.log('🚀 Inicializando Requisiciones Fase 4');
            if (!(await validarAcceso())) return;

            supabaseReq=await obtenerCliente();
            configurarEventos();
            await cargarRequisiciones();
            await iniciarRealtime();

            console.log('✅ Requisiciones Fase 4 inicializado');
        } catch (error) {
            console.error('❌ Error inicializando Requisiciones:',error);
            renderError(error.message || 'Error de inicialización');
        }
    }

    window.cargarRequisiciones=cargarRequisiciones;
    window.sincronizarRequisiciones=sincronizarRequisiciones;

    document.addEventListener('DOMContentLoaded',iniciar);

    window.addEventListener('beforeunload',function(){
        if (canalRealtime && supabaseReq) {
            try { supabaseReq.removeChannel(canalRealtime); } catch (_) {}
        }
    });

    console.log('✅ requisiciones.js Fase 4 cargado');
})();
