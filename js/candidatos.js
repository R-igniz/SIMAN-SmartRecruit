// ==========================================
// CANDIDATOS - SMARTRECRUIT FASE 4 PRD
// CRUD + SUPABASE AUTH + REALTIME + REQUISICION URL
// ==========================================
(function () {
    'use strict';

    var candidatos = [];
    var requisiciones = [];
    var guardandoCandidato = false;
    var requisicionUrlId = null;
    var candidatoEditandoId = null;
    var modoFormulario = 'nuevo'; // nuevo | editar | ver

    function escapar(valor) {
        return String(valor == null ? '' : valor).replace(/[&<>"']/g, function (c) {
            return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];
        });
    }

    function el(id) { return document.getElementById(id); }

    function obtenerRequisicionDesdeUrl() {
        var params = new URLSearchParams(window.location.search);
        var valor = params.get('requisicion_id');
        var id = Number(valor);
        return Number.isInteger(id) && id > 0 ? id : null;
    }

    function mostrarModal(mostrar) {
        var modal = el('modalCandidato');
        if (modal) modal.hidden = !mostrar;
    }

    function limpiarBloqueoRequisicion() {
        var select = el('candRequisicion');
        if (!select) return;
        select.disabled = false;
        delete select.dataset.requisicionBloqueada;
    }

    function seleccionarRequisicionUrl() {
        if (!requisicionUrlId) return;
        var select = el('candRequisicion');
        if (!select) return;
        var existe = Array.from(select.options).some(function (o) {
            return Number(o.value) === requisicionUrlId;
        });
        if (!existe) {
            console.warn('⚠️ La requisición indicada en la URL no está disponible:', requisicionUrlId);
            return;
        }
        select.value = String(requisicionUrlId);
        select.disabled = true;
        select.dataset.requisicionBloqueada = String(requisicionUrlId);
        console.log('🔒 Requisición fijada desde URL:', requisicionUrlId);
    }

    function poblarRequisiciones() {
        var select = el('candRequisicion');
        if (!select) return;
        var valorActual = select.value;
        select.innerHTML = '<option value="">Sin asignar</option>';
        requisiciones.forEach(function (r) {
            var option = document.createElement('option');
            option.value = r.id;
            option.textContent = (r.codigo || ('#' + r.id)) + ' - ' + (r.puesto || '');
            select.appendChild(option);
        });
        if (valorActual && Array.from(select.options).some(function(o){ return o.value === valorActual; })) {
            select.value = valorActual;
        }
    }

    async function cargar() {
        console.log('🔄 Cargando candidatos...');
        var client = await initSupabase();
        var resultados = await Promise.all([
            client.from('candidatos').select('*').order('created_at', {ascending:false}),
            client.from('requisiciones').select('id,codigo,puesto').order('created_at', {ascending:false})
        ]);
        if (resultados[0].error) throw resultados[0].error;
        if (resultados[1].error) console.warn('⚠️ Error cargando requisiciones:', resultados[1].error);
        candidatos = resultados[0].data || [];
        requisiciones = resultados[1].data || [];
        poblarRequisiciones();
        if (modoFormulario === 'nuevo') seleccionarRequisicionUrl();
        render();
        console.log('✅ Candidatos cargados:', candidatos.length);
    }

    function requisicionesMap() {
        var map = {};
        requisiciones.forEach(function (r) {
            map[r.id] = (r.codigo || ('#' + r.id)) + ' - ' + (r.puesto || '');
        });
        return map;
    }

    function render() {
        var query = el('buscarCandidato') ? el('buscarCandidato').value.toLowerCase().trim() : '';
        var estado = el('filtroEstado') ? el('filtroEstado').value : '';
        var filtrados = candidatos.filter(function (c) {
            var texto = [c.nombre,c.email,c.telefono,c.fuente].join(' ').toLowerCase();
            return (!query || texto.includes(query)) && (!estado || c.estado === estado);
        });
        if (el('contadorCandidatos')) el('contadorCandidatos').textContent = filtrados.length + ' candidatos';
        var body = el('candidatosBody');
        if (!body) return;
        if (!filtrados.length) {
            body.innerHTML = '<tr><td colspan="7" class="candidatos-loading">No hay candidatos.</td></tr>';
            return;
        }
        var rmap = requisicionesMap();
        body.innerHTML = filtrados.map(function (c) {
            var fecha = c.created_at ? new Date(c.created_at).toLocaleDateString('es-GT') : '-';
            return '<tr>' +
                '<td><strong>'+escapar(c.nombre)+'</strong></td>'+
                '<td>'+escapar(rmap[c.requisicion_id] || 'Sin asignar')+'</td>'+
                '<td>'+escapar(c.email || '-')+'<br><small>'+escapar(c.telefono || '')+'</small></td>'+
                '<td><span class="badge">'+escapar(c.estado || 'Nuevo')+'</span></td>'+
                '<td>'+escapar(c.fuente || '-')+'</td>'+
                '<td>'+escapar(fecha)+'</td>'+
                '<td><div class="candidato-actions">'+
                    '<button type="button" class="candidato-action btn-ver-candidato" data-id="'+Number(c.id)+'" title="Ver detalle" aria-label="Ver detalle"><i class="fas fa-eye"></i></button>'+
                    '<button type="button" class="candidato-action btn-editar-candidato" data-id="'+Number(c.id)+'" title="Editar candidato" aria-label="Editar candidato"><i class="fas fa-pen"></i></button>'+
                '</div></td></tr>';
        }).join('');
    }

    function fechaParaInput(valor) {
        if (!valor) return '';
        var d = new Date(valor);
        if (Number.isNaN(d.getTime())) return '';
        var local = new Date(d.getTime() - d.getTimezoneOffset()*60000);
        return local.toISOString().slice(0,16);
    }

    function setCamposDeshabilitados(deshabilitar) {
        ['candNombre','candEmail','candTelefono','candFuente','candRequisicion','candEstado','candSalario','candEntrevista','candNotas'].forEach(function(id){
            if (el(id)) el(id).disabled = deshabilitar;
        });
    }

    function prepararNuevo() {
        modoFormulario = 'nuevo';
        candidatoEditandoId = null;
        var form = el('formCandidato');
        if (form) form.reset();
        setCamposDeshabilitados(false);
        if (el('tituloModalCandidato')) el('tituloModalCandidato').textContent = 'Nuevo candidato';
        if (el('subtituloModalCandidato')) el('subtituloModalCandidato').textContent = 'Registra un nuevo candidato en SmartRecruit.';
        if (el('guardarCandidato')) el('guardarCandidato').hidden = false;
        if (el('textoGuardarCandidato')) el('textoGuardarCandidato').textContent = 'Guardar candidato';
        if (requisicionUrlId) seleccionarRequisicionUrl(); else limpiarBloqueoRequisicion();
        mostrarModal(true);
    }

    function abrirCandidato(id, modo) {
        var c = candidatos.find(function(x){ return Number(x.id) === Number(id); });
        if (!c) return alert('No se encontró el candidato seleccionado.');
        modoFormulario = modo;
        candidatoEditandoId = Number(c.id);
        limpiarBloqueoRequisicion();
        el('candNombre').value = c.nombre || '';
        el('candEmail').value = c.email || '';
        el('candTelefono').value = c.telefono || '';
        el('candFuente').value = c.fuente || '';
        el('candRequisicion').value = c.requisicion_id == null ? '' : String(c.requisicion_id);
        el('candEstado').value = c.estado || 'Nuevo';
        el('candSalario').value = c.pretension_salarial == null ? '' : c.pretension_salarial;
        el('candEntrevista').value = fechaParaInput(c.fecha_entrevista);
        el('candNotas').value = c.notas || '';
        var ver = modo === 'ver';
        setCamposDeshabilitados(ver);
        if (el('tituloModalCandidato')) el('tituloModalCandidato').textContent = ver ? 'Detalle del candidato' : 'Editar candidato';
        if (el('subtituloModalCandidato')) el('subtituloModalCandidato').textContent = ver ? 'Consulta la información registrada del candidato.' : 'Actualiza la información y etapa del candidato.';
        if (el('guardarCandidato')) el('guardarCandidato').hidden = ver;
        if (el('textoGuardarCandidato')) el('textoGuardarCandidato').textContent = 'Guardar cambios';
        mostrarModal(true);
    }

    function construirPayload() {
        var nombre = el('candNombre').value.trim();
        if (!nombre) throw new Error('El nombre del candidato es obligatorio.');
        var selectReq = el('candRequisicion');
        var reqId = modoFormulario === 'nuevo' && requisicionUrlId ? requisicionUrlId : (selectReq.value ? Number(selectReq.value) : null);
        return {
            nombre: nombre,
            email: el('candEmail').value.trim() || null,
            telefono: el('candTelefono').value.trim() || null,
            fuente: el('candFuente').value.trim() || null,
            requisicion_id: reqId,
            estado: el('candEstado').value,
            pretension_salarial: el('candSalario').value ? Number(el('candSalario').value) : null,
            fecha_entrevista: el('candEntrevista').value ? new Date(el('candEntrevista').value).toISOString() : null,
            notas: el('candNotas').value.trim() || null
        };
    }

    async function guardar(event) {
        event.preventDefault();
        if (modoFormulario === 'ver' || guardandoCandidato) return;
        guardandoCandidato = true;
        var boton = el('guardarCandidato');
        if (boton) { boton.disabled = true; boton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...'; }
        try {
            var usuario = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
            if (!usuario || !usuario.id) throw new Error('No existe una sesión válida de Supabase Auth.');
            var payload = construirPayload();
            var client = await initSupabase();
            if (modoFormulario === 'editar' && candidatoEditandoId) {
                payload.updated_at = new Date().toISOString();
                console.log('📦 Actualizando candidato:', candidatoEditandoId, payload);
                var actualizado = await client.from('candidatos').update(payload).eq('id', candidatoEditandoId).select('*').single();
                if (actualizado.error) throw actualizado.error;
                console.log('✅ Candidato actualizado:', actualizado.data);
            } else {
                payload.created_by = usuario.id;
                payload.reclutador_id = usuario.id;
                console.log('👤 Candidato creado por:', usuario.email, '| UUID:', usuario.id);
                console.log('📦 Payload candidato:', payload);
                var creado = await client.from('candidatos').insert(payload).select('*');
                if (creado.error) throw creado.error;
                console.log('✅ Candidato creado:', creado.data);
            }
            mostrarModal(false);
            if (requisicionUrlId && modoFormulario === 'nuevo') {
                requisicionUrlId = null;
                window.history.replaceState({}, document.title, window.location.pathname);
            }
            modoFormulario = 'nuevo';
            candidatoEditandoId = null;
            await cargar();
        } catch (error) {
            console.error('❌ Error guardando candidato:', error);
            alert('No se pudo guardar el candidato:\n\n' + (error.message || error));
        } finally {
            guardandoCandidato = false;
            if (boton) {
                boton.disabled = false;
                boton.innerHTML = '<i class="fas fa-save"></i> <span id="textoGuardarCandidato">'+(modoFormulario === 'editar' ? 'Guardar cambios' : 'Guardar candidato')+'</span>';
            }
        }
    }

    document.addEventListener('DOMContentLoaded', function () {
        var usuario = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
        if (!usuario) { window.location.href = '/login.html'; return; }
        if (typeof tienePermiso === 'function' && !tienePermiso('ver_candidatos')) { window.location.href='/dashboard.html'; return; }
        console.log('👤 Candidatos:', usuario.email, '|', usuario.role, '|', usuario.id);

        requisicionUrlId = obtenerRequisicionDesdeUrl();
        if (el('btnNuevoCandidato')) el('btnNuevoCandidato').onclick = prepararNuevo;
        if (el('cerrarModalCandidato')) el('cerrarModalCandidato').onclick = function(){ mostrarModal(false); };
        if (el('cancelarCandidato')) el('cancelarCandidato').onclick = function(){ mostrarModal(false); };
        if (el('formCandidato')) el('formCandidato').addEventListener('submit', guardar);
        if (el('buscarCandidato')) el('buscarCandidato').addEventListener('input', render);
        if (el('filtroEstado')) el('filtroEstado').addEventListener('change', render);
        if (el('candidatosBody')) el('candidatosBody').addEventListener('click', function(event){
            var ver = event.target.closest('.btn-ver-candidato');
            var editar = event.target.closest('.btn-editar-candidato');
            if (ver) abrirCandidato(ver.dataset.id, 'ver');
            if (editar) abrirCandidato(editar.dataset.id, 'editar');
        });

        cargar().then(function(){ if (requisicionUrlId) prepararNuevo(); }).catch(function(error){
            console.error('❌ Error cargando candidatos:', error);
            if (el('candidatosBody')) el('candidatosBody').innerHTML='<tr><td colspan="7">Error cargando candidatos.</td></tr>';
        });

        if (typeof suscribirseATabla === 'function') {
            suscribirseATabla('candidatos', function(){ console.log('🔄 Cambio Realtime candidatos'); cargar(); });
        }
    });
})();
