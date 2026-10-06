// ============================================================
// SIMAN SMARTRECRUIT
// CONFIGURACION.JS - FASE 3
// SUPABASE = FUENTE ÚNICA DE CONFIGURACIÓN
// ============================================================

console.log('⚙️ Configuración Supabase Fase 3 cargando...');


// ============================================================
// ESTADO
// ============================================================

var datosConfiguracion = {

    comerciales: [],
    tiendas: [],
    departamentos: [],
    tiposContratacion: [],
    prioridades: [],
    motivos: [],
    reclutadores: []
};


var datosCargados = false;
var cargandoConfiguracion = false;
var promesaConfiguracion = null;


// ============================================================
// UTILIDADES
// ============================================================

function ordenarPorNombre(array) {

    return (array || [])
        .slice()
        .sort(function (a, b) {

            return String(a.nombre || '')
                .localeCompare(
                    String(b.nombre || ''),
                    'es',
                    {
                        sensitivity: 'base'
                    }
                );
        });
}


function solamenteActivos(array) {

    return (array || [])
        .filter(function (item) {

            return item.activo !== false;
        });
}


// ============================================================
// CARGAR CENTROS COMERCIALES
// ============================================================

async function cargarCentrosComerciales() {

    var client =
        await initSupabase();


    var resultado =
        await client
            .from('centros_comerciales')
            .select('*')
            .eq('activo', true)
            .order('nombre');


    if (resultado.error) {

        throw resultado.error;
    }


    return resultado.data || [];
}


// ============================================================
// CARGAR TIENDAS
// ============================================================

async function cargarTiendas() {

    var client =
        await initSupabase();


    var resultado =
        await client
            .from('tiendas')
            .select(`
                id,
                nombre,
                centro_comercial_id,
                activo,
                centros_comerciales (
                    id,
                    nombre
                )
            `)
            .eq('activo', true)
            .order('nombre');


    if (resultado.error) {

        throw resultado.error;
    }


    return (resultado.data || [])
        .map(function (tienda) {

            return {

                id:
                    tienda.id,

                nombre:
                    tienda.nombre,

                activo:
                    tienda.activo,

                centro_comercial_id:
                    tienda.centro_comercial_id,

                comercial:
                    tienda.centros_comerciales
                        ? tienda.centros_comerciales.nombre
                        : null,

                centro:
                    tienda.centros_comerciales
                        ? tienda.centros_comerciales.nombre
                        : null
            };
        });
}


// ============================================================
// CARGAR DEPARTAMENTOS
// ============================================================

async function cargarDepartamentos() {

    var client =
        await initSupabase();


    var resultado =
        await client
            .from('departamentos')
            .select('*')
            .eq('activo', true)
            .order('nombre');


    if (resultado.error) {

        throw resultado.error;
    }


    return resultado.data || [];
}


// ============================================================
// TIPOS DE CONTRATACIÓN
// ============================================================

async function cargarTiposContratacion() {

    var client =
        await initSupabase();


    var resultado =
        await client
            .from('tipos_contratacion')
            .select('*')
            .eq('activo', true)
            .order('nombre');


    if (resultado.error) {

        throw resultado.error;
    }


    return resultado.data || [];
}


// ============================================================
// PRIORIDADES
// ============================================================

async function cargarPrioridades() {

    var client =
        await initSupabase();


    var resultado =
        await client
            .from('prioridades')
            .select('*')
            .eq('activo', true)
            .order('nombre');


    if (resultado.error) {

        throw resultado.error;
    }


    return resultado.data || [];
}


// ============================================================
// MOTIVOS
// ============================================================

async function cargarMotivos() {

    var client =
        await initSupabase();


    var resultado =
        await client
            .from('motivos_requisicion')
            .select('*')
            .eq('activo', true)
            .order('nombre');


    if (resultado.error) {

        throw resultado.error;
    }


    return resultado.data || [];
}


// ============================================================
// RECLUTADORES
// ============================================================

async function cargarReclutadores() {

    var client = await initSupabase();

    // Fase 4.3: no dependemos de SELECT directo sobre profiles.
    // Gerente RH/Reclutadora pueden tener RLS que solo permite leer
    // su propio perfil, lo que producía "Reclutadores: 0".
    // La RPC devuelve únicamente campos públicos necesarios.
    var resultado = await client.rpc('get_reclutadores');

    if (resultado.error) {
        console.error('❌ No se pudieron cargar reclutadores mediante RPC:', resultado.error);
        throw resultado.error;
    }

    return (resultado.data || []).map(function (profile) {
        return {
            id: profile.id,
            uuid: profile.id,
            nombre: profile.nombre,
            name: profile.nombre,
            email: profile.email,
            role_code: profile.role_code,
            activo: true
        };
    });
}


function obtenerPrioridades() {

    return solamenteActivos(
        datosConfiguracion.prioridades
    );
}


function obtenerMotivos() {

    return solamenteActivos(
        datosConfiguracion.motivos
    );
}


function obtenerReclutadores() {

    return solamenteActivos(
        datosConfiguracion.reclutadores
    );
}


// ============================================================
// TIENDAS POR CENTRO COMERCIAL
// ============================================================

function obtenerTiendasPorComercial(
    comercial
) {

    if (!comercial) {

        return obtenerTiendas();
    }


    var nombreComercial = null;
    var idComercial = null;


    if (
        typeof comercial ===
        'object'
    ) {

        nombreComercial =
            comercial.nombre ||
            comercial.comercial ||
            comercial.centro ||
            null;


        idComercial =
            comercial.id ||
            comercial.centro_comercial_id ||
            null;

    } else {

        nombreComercial =
            String(comercial);
    }


    return obtenerTiendas()
        .filter(function (tienda) {

            if (
                idComercial &&
                String(
                    tienda.centro_comercial_id
                ) ===
                String(
                    idComercial
                )
            ) {

                return true;
            }


            return (
                String(
                    tienda.comercial ||
                    tienda.centro ||
                    ''
                )
                    .trim()
                    .toLowerCase()
                ===
                String(
                    nombreComercial ||
                    ''
                )
                    .trim()
                    .toLowerCase()
            );
        });
}


// ============================================================
// REFRESCAR CONFIGURACIÓN
// ============================================================

async function refrescarConfiguracion() {

    return await cargarConfiguracionSupabase(
        true
    );
}


// ============================================================
// REALTIME
// ============================================================

var realtimeConfiguracionIniciado =
    false;


async function iniciarRealtimeConfiguracion() {

    if (
        realtimeConfiguracionIniciado
    ) {

        return;
    }


    if (
        typeof suscribirseATabla !==
        'function'
    ) {

        console.warn(
            '⚠️ Realtime no disponible'
        );

        return;
    }


    realtimeConfiguracionIniciado =
        true;


    var tablas = [

        'centros_comerciales',

        'tiendas',

        'departamentos',

        'tipos_contratacion',

        'prioridades',

        'motivos_requisicion',

        'profiles'
    ];


    for (
        var i = 0;
        i < tablas.length;
        i++
    ) {

        await suscribirseATabla(
            tablas[i],
            function () {

                console.log(
                    '🔄 Cambio detectado en configuración'
                );


                refrescarConfiguracion()
                    .catch(
                        function (error) {

                            console.error(
                                '❌ Error refrescando configuración:',
                                error
                            );
                        }
                    );
            }
        );
    }


    console.log(
        '📡 Realtime de configuración activo'
    );
}


// ============================================================
// CRUD GENÉRICO PARA CONFIGURACIÓN
// ============================================================

async function crearCatalogo(
    tabla,
    datos
) {

    var resultado =
        await insertarEnSupabase(
            tabla,
            datos
        );


    if (
        resultado.success
    ) {

        await refrescarConfiguracion();
    }


    return resultado;
}


async function actualizarCatalogo(
    tabla,
    id,
    datos
) {

    var resultado =
        await actualizarEnSupabase(
            tabla,
            id,
            datos
        );


    if (
        resultado.success
    ) {

        await refrescarConfiguracion();
    }


    return resultado;
}


async function eliminarCatalogo(
    tabla,
    id
) {

    /*
     * Para catálogos es mejor desactivar
     * que borrar físicamente.
     */

    return await actualizarCatalogo(
        tabla,
        id,
        {
            activo: false,
            updated_at:
                new Date()
                    .toISOString()
        }
    );
}


// ============================================================
// EXPORTAR GLOBALMENTE
// ============================================================

window.datosConfiguracion =
    datosConfiguracion;


window.obtenerDatosConfig =
    obtenerDatosConfig;


window.obtenerComerciales =
    obtenerComerciales;


window.obtenerTiendas =
    obtenerTiendas;


window.obtenerDepartamentos =
    obtenerDepartamentos;


window.obtenerTiposContratacion =
    obtenerTiposContratacion;


window.obtenerPrioridades =
    obtenerPrioridades;


window.obtenerMotivos =
    obtenerMotivos;


window.obtenerReclutadores =
    obtenerReclutadores;


window.obtenerTiendasPorComercial =
    obtenerTiendasPorComercial;


window.cargarConfiguracionSupabase =
    cargarConfiguracionSupabase;


window.refrescarConfiguracion =
    refrescarConfiguracion;


window.iniciarRealtimeConfiguracion =
    iniciarRealtimeConfiguracion;


window.crearCatalogo =
    crearCatalogo;


window.actualizarCatalogo =
    actualizarCatalogo;


window.eliminarCatalogo =
    eliminarCatalogo;


// ============================================================
// CONFIGURACIÓN FASE 4 - CENTRO DE ADMINISTRACIÓN
// ============================================================

var catalogoActual = 'comerciales';
var itemsGestion = [];
var busquedaGestion = '';
var filtroEstadoGestion = 'todos';

var CATALOGOS_UI = {
    comerciales: { titulo:'Centros comerciales', singular:'Centro comercial', icono:'fa-store', tabla:'centros_comerciales' },
    tiendas: { titulo:'Tiendas', singular:'Tienda', icono:'fa-shop', tabla:'tiendas' },
    departamentos: { titulo:'Departamentos', singular:'Departamento', icono:'fa-building', tabla:'departamentos' },
    tiposContratacion: { titulo:'Tipos de contratación', singular:'Tipo de contratación', icono:'fa-file-signature', tabla:'tipos_contratacion' },
    prioridades: { titulo:'Prioridades', singular:'Prioridad', icono:'fa-flag', tabla:'prioridades' },
    motivos: { titulo:'Motivos de requisición', singular:'Motivo', icono:'fa-clipboard-question', tabla:'motivos_requisicion' }
};

function escapeConfig(v){
    return String(v == null ? '' : v).replace(/[&<>'"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c];});
}

function toastConfig(mensaje,tipo){
    var box=document.getElementById('configToast'); if(!box)return;
    box.textContent=mensaje; box.className='config-toast show '+(tipo||'success');
    clearTimeout(window.__configToast); window.__configToast=setTimeout(function(){box.classList.remove('show');},3000);
}

async function cargarItemsGestion(tipo){
    var cfg=CATALOGOS_UI[tipo]; if(!cfg)return [];
    var db=await initSupabase();
    var select='*';
    if(tipo==='tiendas') select='*, centros_comerciales(id,nombre)';
    var r=await db.from(cfg.tabla).select(select).order('nombre');
    if(r.error) throw r.error;
    return r.data||[];
}

function actualizarResumen(){
    var mapas={comerciales:datosConfiguracion.comerciales,tiendas:datosConfiguracion.tiendas,departamentos:datosConfiguracion.departamentos,tiposContratacion:datosConfiguracion.tiposContratacion,prioridades:datosConfiguracion.prioridades,motivos:datosConfiguracion.motivos};
    Object.keys(mapas).forEach(function(k){var e=document.querySelector('[data-count="'+k+'"]');if(e)e.textContent=(mapas[k]||[]).length;});
}

async function abrirGestion(tipo){
    if(!CATALOGOS_UI[tipo])return;

    var titulo=document.getElementById('gestionTituloTexto');
    var subtitulo=document.getElementById('gestionSubtitulo');
    var btnNuevo=document.getElementById('btnNuevoTexto');
    var panel=document.getElementById('gestionPanel');
    var body=document.getElementById('gestionBody');

    // configuracion.js también es utilizado como servicio por otros módulos.
    // Si no estamos en la UI de Configuración, no intentamos manipular su DOM.
    if(!titulo||!subtitulo||!btnNuevo||!panel||!body){
        console.debug('ℹ️ UI de gestión no disponible en esta página; abrirGestion omitido.');
        return;
    }

    catalogoActual=tipo;
    document.querySelectorAll('.config-card').forEach(function(x){x.classList.toggle('active',x.dataset.catalogo===tipo);});
    var cfg=CATALOGOS_UI[tipo];
    titulo.textContent=cfg.titulo;
    subtitulo.textContent='Administra los registros disponibles en SmartRecruit.';
    btnNuevo.textContent='Nuevo '+cfg.singular.toLowerCase();
    panel.style.display='block';
    body.innerHTML='<tr><td colspan="4" class="loading-cell"><i class="fas fa-spinner fa-spin"></i> Cargando...</td></tr>';
    try { itemsGestion=await cargarItemsGestion(tipo); renderGestion(); }
    catch(e){console.error('❌ Error cargando catálogo:',e);toastConfig('No se pudo cargar el catálogo','error');}
}

function renderGestion(){
    var cfg=CATALOGOS_UI[catalogoActual];
    var q=busquedaGestion.trim().toLowerCase();
    var data=itemsGestion.filter(function(x){
        var okQ=!q||String(x.nombre||'').toLowerCase().includes(q);
        var activo=x.activo!==false;
        var okE=filtroEstadoGestion==='todos'||(filtroEstadoGestion==='activo'&&activo)||(filtroEstadoGestion==='inactivo'&&!activo);
        return okQ&&okE;
    });
    document.getElementById('gestionThead').innerHTML='<tr><th>Nombre</th>'+(catalogoActual==='tiendas'?'<th>Centro comercial</th>':'')+'<th>Estado</th><th class="actions-col">Acciones</th></tr>';
    var body=document.getElementById('gestionBody');
    if(!data.length){body.innerHTML='<tr><td colspan="4"><div class="empty-state"><i class="fas fa-folder-open"></i><strong>Sin resultados</strong><span>No hay registros que coincidan con los filtros.</span></div></td></tr>';return;}
    body.innerHTML=data.map(function(x){
        var activo=x.activo!==false;
        var centro=x.centros_comerciales?x.centros_comerciales.nombre:'—';
        return '<tr><td><div class="record-name">'+escapeConfig(x.nombre)+'</div></td>'+(catalogoActual==='tiendas'?'<td>'+escapeConfig(centro)+'</td>':'')+'<td><span class="status-pill '+(activo?'active':'inactive')+'"><i></i>'+(activo?'Activo':'Inactivo')+'</span></td><td class="table-actions"><button class="icon-btn" title="Editar" onclick="editarItemConfig(\''+String(x.id)+'\')"><i class="fas fa-pen"></i></button><button class="icon-btn '+(activo?'danger':'success')+'" title="'+(activo?'Desactivar':'Activar')+'" onclick="cambiarEstadoConfig(\''+String(x.id)+'\','+(!activo)+')"><i class="fas '+(activo?'fa-ban':'fa-check')+'"></i></button></td></tr>';
    }).join('');
}

function abrirModalAgregar(){
    var cfg=CATALOGOS_UI[catalogoActual];
    document.getElementById('formGestion').reset(); document.getElementById('gestionId').value=''; document.getElementById('gestionTipo').value=catalogoActual;
    document.getElementById('modalGestionTituloTexto').textContent='Nuevo '+cfg.singular.toLowerCase();
    prepararCamposModal(null); document.getElementById('modalGestion').classList.add('show');
}

function editarItemConfig(id){
    var item=itemsGestion.find(function(x){return String(x.id)===String(id)}); if(!item)return;
    document.getElementById('gestionId').value=item.id;document.getElementById('gestionTipo').value=catalogoActual;document.getElementById('gestionNombre').value=item.nombre||'';document.getElementById('gestionEstado').value=item.activo===false?'inactivo':'activo';
    document.getElementById('modalGestionTituloTexto').textContent='Editar '+CATALOGOS_UI[catalogoActual].singular.toLowerCase();
    prepararCamposModal(item);document.getElementById('modalGestion').classList.add('show');
}

function prepararCamposModal(item){
    var wrap=document.getElementById('campoComercial'); wrap.style.display=catalogoActual==='tiendas'?'block':'none';
    if(catalogoActual==='tiendas'){
        var s=document.getElementById('tiendaComercial');
        s.innerHTML='<option value="">Seleccionar centro...</option>'+datosConfiguracion.comerciales.map(function(c){return '<option value="'+escapeConfig(c.id)+'">'+escapeConfig(c.nombre)+'</option>'}).join('');
        s.value=item&&item.centro_comercial_id?item.centro_comercial_id:'';
    }
}

async function guardarItem(event){
    event.preventDefault(); var cfg=CATALOGOS_UI[catalogoActual]; var id=document.getElementById('gestionId').value;
    var nombre=document.getElementById('gestionNombre').value.trim(); if(!nombre)return;
    var datos={nombre:nombre,activo:document.getElementById('gestionEstado').value==='activo'};
    if(catalogoActual==='tiendas'){var cc=document.getElementById('tiendaComercial').value;if(!cc){toastConfig('Selecciona un centro comercial','error');return;}datos.centro_comercial_id=cc;}
    var btn=document.getElementById('btnGuardarConfig');btn.disabled=true;
    try{
        var db=await initSupabase(); var r=id?await db.from(cfg.tabla).update(datos).eq('id',id).select():await db.from(cfg.tabla).insert(datos).select();
        if(r.error)throw r.error;
        cerrarModal('modalGestion');await refrescarConfiguracion();actualizarResumen();await abrirGestion(catalogoActual);toastConfig(id?'Registro actualizado':'Registro creado');
    }catch(e){console.error('❌ Error guardando:',e);toastConfig(e.message||'No se pudo guardar','error');}finally{btn.disabled=false;}
}

async function cambiarEstadoConfig(id,nuevo){
    try{var db=await initSupabase();var r=await db.from(CATALOGOS_UI[catalogoActual].tabla).update({activo:nuevo}).eq('id',id);if(r.error)throw r.error;await refrescarConfiguracion();actualizarResumen();await abrirGestion(catalogoActual);toastConfig(nuevo?'Registro activado':'Registro desactivado');}
    catch(e){console.error(e);toastConfig('No se pudo cambiar el estado','error');}
}

function cerrarModal(id){var e=document.getElementById(id);if(e)e.classList.remove('show');}
function filtrarGestion(){busquedaGestion=document.getElementById('buscarConfig').value;filtroEstadoGestion=document.getElementById('filtroEstadoConfig').value;renderGestion();}
async function refrescarCentroConfiguracion(){var b=document.getElementById('btnRefrescarConfig');b.classList.add('loading');try{await refrescarConfiguracion();actualizarResumen();await abrirGestion(catalogoActual);toastConfig('Configuración actualizada');}finally{b.classList.remove('loading');}}

window.abrirGestion=abrirGestion;window.abrirModalAgregar=abrirModalAgregar;window.editarItemConfig=editarItemConfig;window.cambiarEstadoConfig=cambiarEstadoConfig;window.guardarItem=guardarItem;window.cerrarModal=cerrarModal;window.filtrarGestion=filtrarGestion;window.refrescarCentroConfiguracion=refrescarCentroConfiguracion;

// ============================================================
// FASE 4.1 - USUARIOS, ROLES Y PERMISOS
// ============================================================
var rolConfigActual = 'Administrador';

async function cargarResumenAcceso(){
    var total=document.getElementById('totalUsuariosConfig');
    try{
        var db=await initSupabase();
        var r=await db.from('profiles').select('id,activo,role_code');
        if(r.error)throw r.error;
        if(total)total.textContent=(r.data||[]).length;
        console.log('👥 Usuarios para Configuración:',(r.data||[]).length);
    }catch(e){
        console.warn('⚠️ No se pudo obtener resumen de usuarios:',e);
        if(total)total.textContent='—';
    }
}

function abrirUsuariosConfig(){
    if(typeof tienePermiso==='function'&&!tienePermiso('ver_usuarios')){
        toastConfig('No tienes permiso para administrar usuarios','error');
        return;
    }
    window.location.href='/usuarios.html';
}

function etiquetaPermiso(p){
    return String(p||'').replace(/_/g,' ').replace(/\b\w/g,function(c){return c.toUpperCase();});
}

function mostrarRolesPermisos(){
    var panel=document.getElementById('rolesPermisosPanel');
    if(!panel)return;
    panel.hidden=false;
    var roles=(typeof PERMISOS==='object'&&PERMISOS)?Object.keys(PERMISOS):[];
    var tabs=document.getElementById('roleTabsConfig');
    if(!roles.length){
        tabs.innerHTML='';
        document.getElementById('permisosRolConfig').innerHTML='<div class="empty-state"><strong>Permisos no disponibles</strong><span>auth.js no expuso la matriz de permisos.</span></div>';
        return;
    }
    if(roles.indexOf(rolConfigActual)===-1)rolConfigActual=roles[0];
    tabs.innerHTML=roles.map(function(rol){return '<button type="button" class="role-tab '+(rol===rolConfigActual?'active':'')+'" onclick="seleccionarRolConfig(\''+escapeConfig(rol)+'\')">'+escapeConfig(rol)+'</button>';}).join('');
    renderPermisosRolConfig();
    panel.scrollIntoView({behavior:'smooth',block:'nearest'});
}

function seleccionarRolConfig(rol){rolConfigActual=rol;mostrarRolesPermisos();}
function renderPermisosRolConfig(){
    var box=document.getElementById('permisosRolConfig');if(!box)return;
    var lista=(typeof PERMISOS==='object'&&PERMISOS&&PERMISOS[rolConfigActual])||[];
    box.innerHTML=lista.length?lista.map(function(p){return '<div class="permission-chip"><i class="fas fa-circle-check"></i><span>'+escapeConfig(etiquetaPermiso(p))+'</span></div>';}).join(''):'<div class="empty-state"><strong>Sin permisos configurados</strong></div>';
}
function cerrarRolesPermisos(){var p=document.getElementById('rolesPermisosPanel');if(p)p.hidden=true;}

window.abrirUsuariosConfig=abrirUsuariosConfig;
window.mostrarRolesPermisos=mostrarRolesPermisos;
window.seleccionarRolConfig=seleccionarRolConfig;
window.cerrarRolesPermisos=cerrarRolesPermisos;

// ============================================================
// INICIALIZACIÓN FASE 4
// ============================================================
document.addEventListener('DOMContentLoaded',async function(){
    var pagina=String(window.location.pathname||'').split('?')[0].split('#')[0].toLowerCase();

    // Este archivo expone funciones de configuración usadas por otros módulos,
    // pero el Centro de Configuración solo debe inicializarse en su propia página.
    if(pagina!=='/configuracion.html'&&pagina!=='/configuracion'){
        console.debug('ℹ️ configuracion.js en modo servicio; UI Fase 4.1.1 no inicializada en:',pagina);
        return;
    }

    try{
        var usuario=typeof getCurrentUser==='function'?getCurrentUser():null;
        if(!usuario&&typeof requireAuth==='function') usuario=await requireAuth();
        if(!usuario)return;
        if(typeof tienePermiso==='function'&&!tienePermiso('ver_configuracion'))return;
        await cargarConfiguracionSupabase();
        await iniciarRealtimeConfiguracion();
        actualizarResumen();
        await cargarResumenAcceso();
        await abrirGestion('comerciales');
        console.log('✅ Centro de Configuración Fase 4.1.1 inicializado');
    }catch(error){console.error('❌ No se pudo inicializar Configuración Fase 4.1.1:',error);toastConfig('No se pudo cargar Configuración','error');}
});

console.log('✅ configuracion.js Fase 4.1.1 cargado');
