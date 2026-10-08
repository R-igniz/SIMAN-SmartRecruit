// SIMAN SmartRecruit — Fase 4.4.3 — Roles y permisos
(function () {
    'use strict';
    let db, roles = [], catalogo = [], actual = null, nuevo = false, guardando = false;
    const $ = id => document.getElementById(id);
    const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    async function rpc(nombre, parametros) {
        const {data,error} = await db.rpc(nombre, parametros || {});
        if (error) throw new Error(error.message || 'Error consultando Supabase');
        return data;
    }
    function estado(mensaje, tipo = '') {
        $('estadoRol').textContent = mensaje;
        $('estadoRol').className = tipo;
    }
    function normalizar(s) {
        return String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_|_$/g,'');
    }
    function seleccionados() {
        return [...document.querySelectorAll('#permisosLista input[type="checkbox"]:checked')].map(x => x.value);
    }
    function actualizarContador() { $('permisosSeleccionados').textContent = `${seleccionados().length} seleccionados`; }
    function pintarRoles() {
        $('rolesLista').innerHTML = roles.length ? roles.map(r => `<button type="button" class="role-item ${!nuevo && actual?.codigo === r.codigo ? 'selected' : ''}" data-role="${esc(r.codigo)}"><span><strong>${esc(r.nombre)}</strong><small>${r.activo ? 'Activo' : 'Inactivo'}${r.protegido ? ' · Protegido' : ''}</small></span><i class="fas ${r.protegido ? 'fa-lock' : 'fa-chevron-right'}"></i></button>`).join('') : '<p>No hay roles registrados.</p>';
        document.querySelectorAll('[data-role]').forEach(b => b.addEventListener('click', () => seleccionar(b.dataset.role)));
        $('totalRoles').textContent = roles.length;
        $('rolesActivos').textContent = roles.filter(r => r.activo).length;
        $('totalPermisos').textContent = catalogo.length;
        $('contadorRoles').textContent = `${roles.length} roles`;
    }
    function seleccionar(codigo) {
        nuevo = codigo === null;
        actual = nuevo ? null : (roles.find(r => r.codigo === codigo) || null);
        const protegido = !!actual?.protegido;
        $('rolTitulo').textContent = nuevo ? 'Crear nuevo rol' : (actual?.nombre || 'Selecciona un rol');
        $('rolAyuda').textContent = protegido ? 'Este rol está protegido y no se puede modificar.' : 'Configura la información y los permisos del rol.';
        $('rolProtegido').hidden = !protegido;
        $('rolNombre').value = actual?.nombre || '';
        $('rolDescripcion').value = actual?.descripcion || '';
        $('rolActivo').checked = actual?.activo !== false;
        $('rolNombre').disabled = protegido;
        $('rolDescripcion').disabled = protegido;
        $('rolActivo').disabled = protegido;
        $('guardarRol').disabled = protegido;
        const elegidos = new Set(Array.isArray(actual?.permisos) ? actual.permisos : []);
        const grupos = {};
        catalogo.forEach(p => (grupos[p.modulo || 'General'] ??= []).push(p));
        $('permisosLista').innerHTML = Object.entries(grupos).map(([modulo, items]) => `<section class="permission-group"><h3><i class="fas fa-layer-group"></i> ${esc(modulo)}</h3>${items.map(p => `<label class="check"><input type="checkbox" value="${esc(p.codigo)}" ${elegidos.has(p.codigo) ? 'checked' : ''} ${protegido ? 'disabled' : ''}><span>${esc(p.nombre)}</span></label>`).join('')}</section>`).join('');
        $('permisosLista').querySelectorAll('input').forEach(x => x.addEventListener('change', actualizarContador));
        actualizarContador(); pintarRoles(); estado('');
    }
    async function cargar(seleccion) {
        const [r,p] = await Promise.all([rpc('rbac_listar_roles'),rpc('rbac_catalogo_permisos')]);
        roles = Array.isArray(r) ? r : [];
        catalogo = Array.isArray(p) ? p : [];
        const destino = seleccion || actual?.codigo || roles[0]?.codigo;
        if (destino) seleccionar(destino); else seleccionar(null);
    }
    async function guardar() {
        if (guardando || actual?.protegido) return;
        try {
            guardando = true;
            $('guardarRol').disabled = true;
            estado('Guardando cambios...');
            const nombre = $('rolNombre').value.trim();
            if (!nombre) throw new Error('Escribe un nombre para el rol.');
            const codigo = actual?.codigo || normalizar(nombre);
            if (!codigo) throw new Error('El nombre no genera un código válido.');
            if (nuevo && roles.some(r => r.codigo === codigo)) throw new Error('Ya existe un rol con ese código.');
            await rpc('rbac_guardar_rol', {
                p_codigo: codigo,
                p_nombre: nombre,
                p_descripcion: $('rolDescripcion').value.trim(),
                p_activo: $('rolActivo').checked,
                p_permisos: seleccionados()
            });
            await cargar(codigo);
            estado('Rol guardado correctamente.', 'success');
        } catch (e) {
            console.error('Error guardando rol:',e);
            estado(e.message || 'No se pudo guardar el rol.', 'error');
        } finally {
            guardando = false;
            $('guardarRol').disabled = !!actual?.protegido;
        }
    }
    // Esperar el evento de auth.js, que restaura el perfil y los permisos RBAC.
    // No llamar restaurarSesion() otra vez: auth.js es el responsable de la sesión.
    function esperarAutenticacion() {
        return new Promise((resolve, reject) => {
            let finalizado = false;
            const comenzar = Date.now();
            let temporizador;
            const terminar = (error, usuario) => {
                if (finalizado) return;
                finalizado = true;
                window.removeEventListener('smartrecruit:auth-ready', alAutenticar);
                clearInterval(temporizador);
                if (error) reject(error); else resolve(usuario);
            };
            const verificar = (usuario) => {
                const actual = usuario || window.getCurrentUser?.();
                if (!actual || !Array.isArray(actual.permisos)) return false;
                // La validación de autorización usa la API compartida de auth.js.
                if (!window.tienePermiso?.('gestionar_roles')) {
                    terminar(new Error('Acceso denegado: necesitas el permiso gestionar_roles.'));
                } else {
                    terminar(null, actual);
                }
                return true;
            };
            const alAutenticar = (evento) => verificar(evento.detail?.usuario);
            window.addEventListener('smartrecruit:auth-ready', alAutenticar);
            // También funciona si auth-ready ocurrió antes de registrar el listener.
            if (verificar()) return;
            temporizador = setInterval(() => {
                if (verificar()) return;
                if (Date.now() - comenzar > 12000) {
                    terminar(new Error('No se pudo completar la autenticación. Recarga la página e inicia sesión nuevamente.'));
                }
            }, 150);
        });
    }

    async function iniciar() {
        $('rolesLista').textContent = 'Verificando sesión y permisos...';
        $('guardarRol').disabled = true;
        try {
            await esperarAutenticacion();
            db = await initSupabase();
            $('rolesLista').textContent = 'Cargando roles desde Supabase...';
            await cargar();
            $('nuevoRol').addEventListener('click', () => seleccionar(null));
            $('guardarRol').addEventListener('click', guardar);
            console.info('✅ Roles y permisos: catálogo y roles cargados', roles.length, catalogo.length);
        } catch (e) {
            console.error('Roles y permisos:', e);
            estado(e.message || 'Error cargando roles.', 'error');
            $('rolesLista').textContent = 'No se pudieron cargar los roles.';
            $('guardarRol').disabled = true;
        }
    }
    document.addEventListener('DOMContentLoaded', iniciar);
})();
