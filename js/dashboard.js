document.addEventListener('DOMContentLoaded', async function() {
    var user = getCurrentUser();
    if (!user) return;
    console.log('📊 Dashboard real para:', user.name);

    function setText(id, value) { var el=document.getElementById(id); if(el) el.textContent=value; }
    function estadoCerrado(e) { e=String(e||'').toLowerCase(); return ['cerrada','cerrado','contratado','contratada','finalizada','finalizado'].indexOf(e)>=0; }
    function estadoPendiente(e) { e=String(e||'').toLowerCase(); return ['nueva','revisando','pendiente','solicitada'].indexOf(e)>=0; }
    function badge(estado) {
        var e=String(estado||'Sin estado'); var l=e.toLowerCase(); var c='badge-blue';
        if (estadoCerrado(l)) c='badge-green'; else if(l.indexOf('urgent')>=0||l.indexOf('venc')>=0) c='badge-red'; else if(l.indexOf('revis')>=0||l.indexOf('pend')>=0) c='badge-yellow';
        return '<span class="badge '+c+'">'+e+'</span>';
    }
    function escapeHtml(v){ return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c];}); }

    async function cargarDashboard() {
        try {
            var result=await obtenerDeSupabase('requisiciones', null, {campo:'created_at', ascendente:false});
            if(!result.success) throw new Error(result.error);
            var reqs=result.data||[];
            localStorage.setItem('requisiciones_data', JSON.stringify(reqs)); // cache, no fuente principal
            var abiertas=reqs.filter(function(r){return !estadoCerrado(r.estado);});
            var cerradas=reqs.filter(function(r){return estadoCerrado(r.estado);});
            var ahora=new Date();
            var contrataciones=reqs.filter(function(r){
                if(String(r.estado||'').toLowerCase().indexOf('contrat')<0) return false;
                var f=new Date(r.fecha_cierre||r.updated_at||r.created_at||r.fecha);
                return !isNaN(f)&&f.getMonth()===ahora.getMonth()&&f.getFullYear()===ahora.getFullYear();
            });
            var pendientes=reqs.filter(function(r){return estadoPendiente(r.estado);});
            var alertas=abiertas.filter(function(r){return String(r.prioridad||'').toLowerCase().indexOf('urgent')>=0;});
            var dias=cerradas.map(function(r){ var a=new Date(r.created_at||r.fecha), b=new Date(r.fecha_cierre||r.updated_at); return (!isNaN(a)&&!isNaN(b))?Math.max(0,Math.round((b-a)/86400000)):null; }).filter(function(x){return x!==null;});
            var promedio=dias.length?Math.round(dias.reduce(function(a,b){return a+b;},0)/dias.length):0;
            setText('kpiAbiertas',abiertas.length); setText('kpiCerradas',cerradas.length); setText('kpiContrataciones',contrataciones.length); setText('kpiTiempo',promedio+'d'); setText('kpiPendientes',pendientes.length); setText('kpiAlertas',alertas.length);
            setText('trendAbiertas','Total activo'); setText('trendCerradas','Total histórico'); setText('trendContrataciones','Mes actual'); setText('trendTiempo',dias.length?'Cobertura promedio':'Sin cierres medibles'); setText('trendPendientes',alertas.length+' urgentes'); setText('trendAlertas','Prioridad urgente');

            var porCentro={}; abiertas.forEach(function(r){var c=r.centro||'Sin centro'; porCentro[c]=(porCentro[c]||0)+1;});
            var pares=Object.keys(porCentro).map(function(k){return [k,porCentro[k]];}).sort(function(a,b){return b[1]-a[1];}).slice(0,7);
            var max=Math.max.apply(null,pares.map(function(x){return x[1];}).concat([1]));
            var chart=document.getElementById('chartComerciales'), labels=document.getElementById('chartLabels');
            if(chart) chart.innerHTML=pares.length?pares.map(function(x){return '<div class="bar" title="'+escapeHtml(x[0])+': '+x[1]+'" style="height:'+Math.max(12,Math.round(x[1]/max*90))+'px;"></div>';}).join(''):'<span>Sin vacantes abiertas</span>';
            if(labels) labels.innerHTML=pares.map(function(x){return '<span>'+escapeHtml(x[0])+'</span>';}).join('');

            var ult=document.getElementById('ultimasRequisiciones');
            if(ult) ult.innerHTML=reqs.slice(0,5).map(function(r){return '<div class="item"><span><strong>#'+escapeHtml(r.codigo||r.id)+'</strong> · '+escapeHtml(r.puesto)+' · '+escapeHtml(r.centro||'Sin centro')+'</span>'+badge(r.estado)+'</div>';}).join('')||'<div class="item"><span>No hay requisiciones.</span></div>';
            var act=document.getElementById('actividadReciente');
            if(act) act.innerHTML=reqs.slice(0,4).map(function(r){return '<div class="item"><span><i class="fas fa-file-alt"></i> '+escapeHtml(r.codigo||r.id)+' · '+escapeHtml(r.puesto)+'</span>'+badge(r.estado)+'</div>';}).join('')||'<div class="item"><span>Sin actividad.</span></div>';
            console.log('✅ Dashboard actualizado con',reqs.length,'requisiciones reales');
        } catch(error) { console.error('❌ Error cargando dashboard:',error); }
    }

    await cargarDashboard();
    if(typeof suscribirseATabla==='function') suscribirseATabla('requisiciones', function(){ cargarDashboard(); });
});
