// SIMAN SmartRecruit - Usuarios Fase 4 / Supabase profiles
console.log('👥 usuarios.js Fase 4 cargando...');

var usuariosCache = [];
var supabaseUsuarios = null;
var canalUsuarios = null;

var ROLES_USUARIOS = {
  admin: 'Administrador', administrador: 'Administrador',
  gerente_rh: 'Gerente RH', gerente: 'Gerente RH',
  reclutadora: 'Reclutadora', ejecutivo: 'Ejecutivo'
};

function escaparHTML(v) {
  return String(v ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
}
function nombreRol(code) {
  var k = String(code || '').trim().toLowerCase();
  return ROLES_USUARIOS[k] || code || 'Sin rol';
}
async function obtenerClienteUsuarios() {
  if (typeof window.initSupabase === 'function') return await window.initSupabase();
  if (typeof window.getSupabaseClient === 'function') return await window.getSupabaseClient();
  if (window.supabaseClient) return window.supabaseClient;
  if (window.supabaseDB && typeof window.supabaseDB.from === 'function') return window.supabaseDB;
  throw new Error('No se encontró el cliente Supabase.');
}
function claseRol(code) {
  var k = String(code || '').toLowerCase();
  if (k === 'admin' || k === 'administrador') return 'badge-red';
  if (k === 'gerente_rh' || k === 'gerente') return 'badge-blue';
  if (k === 'reclutadora') return 'badge-yellow';
  if (k === 'ejecutivo') return 'badge-green';
  return 'badge-gray';
}
async function cargarUsuarios() {
  var tbody = document.getElementById('usuariosBody');
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="5" class="empty-state"><i class="fas fa-spinner fa-spin"></i> Cargando usuarios...</td></tr>';
  try {
    if (!supabaseUsuarios) supabaseUsuarios = await obtenerClienteUsuarios();
    var resultado = await supabaseUsuarios.from('profiles')
      .select('id,email,nombre,role_code,activo').order('nombre', {ascending:true});
    if (resultado.error) throw resultado.error;
    usuariosCache = resultado.data || [];
    renderizarUsuarios();
    console.log('✅ Usuarios cargados desde profiles:', usuariosCache.length);
  } catch (error) {
    console.error('❌ Error cargando usuarios:', error);
    tbody.innerHTML = '<tr><td colspan="5" class="empty-state error-state"><i class="fas fa-triangle-exclamation"></i> Error al cargar usuarios</td></tr>';
  }
}
function renderizarUsuarios() {
  var tbody = document.getElementById('usuariosBody');
  if (!tbody) return;
  if (!usuariosCache.length) {
    tbody.innerHTML = '<tr><td colspan="5" class="empty-state"><i class="fas fa-inbox"></i> No hay usuarios registrados</td></tr>';
    return;
  }
  tbody.innerHTML = usuariosCache.map(function(u) {
    var activo = u.activo !== false;
    return '<tr>' +
      '<td class="uuid-cell" title="'+escaparHTML(u.id)+'">'+escaparHTML(String(u.id).slice(0,8))+'…</td>' +
      '<td><strong>'+escaparHTML(u.nombre || 'Sin nombre')+'</strong></td>' +
      '<td>'+escaparHTML(u.email || '—')+'</td>' +
      '<td><span class="badge '+claseRol(u.role_code)+'">'+escaparHTML(nombreRol(u.role_code))+'</span></td>' +
      '<td><span class="badge '+(activo?'badge-green':'badge-red')+'">'+(activo?'Activo':'Inactivo')+'</span></td>' +
      '</tr>';
  }).join('');
}
function iniciarRealtimeUsuarios() {
  if (!supabaseUsuarios || !supabaseUsuarios.channel || canalUsuarios) return;
  canalUsuarios = supabaseUsuarios.channel('usuarios-profiles-fase4')
    .on('postgres_changes', {event:'*', schema:'public', table:'profiles'}, function(payload) {
      console.log('📡 Cambio Realtime profiles:', payload.eventType);
      cargarUsuarios();
    })
    .subscribe(function(status) {
      if (status === 'SUBSCRIBED') console.log('📡 Realtime Usuarios activo');
    });
}
document.addEventListener('DOMContentLoaded', async function() {
  try {
    if (typeof window.tienePermiso === 'function' && !window.tienePermiso('ver_usuarios')) return;
    supabaseUsuarios = await obtenerClienteUsuarios();
    await cargarUsuarios();
    iniciarRealtimeUsuarios();
    console.log('✅ Usuarios Fase 4 inicializado');
  } catch (error) {
    console.error('❌ No se pudo inicializar Usuarios Fase 4:', error);
  }
});
window.cargarUsuarios = cargarUsuarios;
