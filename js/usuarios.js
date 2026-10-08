console.log("👥 Usuarios Fase 4.2 - RBAC reforzado");
let sb=null, cache=[], channel=null, catalogoRoles=[], rolesCargados=false;
const roles={admin:"Administrador",administrador:"Administrador",gerente_rh:"Gerente RH",gerente:"Gerente RH",reclutadora:"Reclutadora",ejecutivo:"Ejecutivo"};
const $=id=>document.getElementById(id);
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
async function client(){if(sb)return sb;if(window.initSupabase)sb=await window.initSupabase();else if(window.getSupabaseClient)sb=await window.getSupabaseClient();else sb=window.supabaseClient||window.supabaseDB;if(!sb)throw Error("Cliente Supabase no disponible");return sb}
async function cargarRoles(){
 const c=await client();
 const {data,error}=await c.rpc("rbac_listar_roles");
 if(error) throw Error("No se pudo consultar el catálogo RBAC: " + error.message);
 if(!Array.isArray(data)) throw Error("El catálogo RBAC devolvió una respuesta inesperada.");
 catalogoRoles=data.filter(r=>r && r.codigo && r.activo!==false);
 rolesCargados=true;
 const selector=$("usuarioRol");
 if(selector){
   const anterior=selector.value;
   selector.innerHTML=catalogoRoles.map(r=>`<option value="${esc(r.codigo)}">${esc(r.nombre)}</option>`).join("");
   if(catalogoRoles.some(r=>r.codigo===anterior))selector.value=anterior;
   selector.disabled=!catalogoRoles.length;
 }
 console.log("✅ Roles activos disponibles para usuarios:",catalogoRoles.length);
}
function nombreRol(codigo){return catalogoRoles.find(r=>r.codigo===codigo)?.nombre || roles[codigo] || codigo || "Sin rol";}
function validarRol(codigo){
 if(!rolesCargados)throw Error("Todavía no se ha cargado el catálogo de roles.");
 if(!catalogoRoles.some(r=>r.codigo===codigo))throw Error("Selecciona un rol activo válido.");
}
function can(p){return typeof window.tienePermiso==="function"&&window.tienePermiso(p)===true}
function deny(p){console.warn("⛔ Usuarios: acción bloqueada",p);alert("No tienes permiso para realizar esta acción.");return false}
async function load(){if(!can("ver_usuarios"))return deny("ver_usuarios");const c=await client();const {data,error}=await c.from("profiles").select("id,email,nombre,role_code,activo,requiere_cambio_password").order("nombre");if(error)throw error;cache=data||[];render();console.log("✅ Usuarios cargados:",cache.length)}
function render(){let b=$("usuariosBody");if(!b)return;if(!cache.length){b.innerHTML='<tr><td colspan="6" class="empty-state">No hay usuarios registrados</td></tr>';return}b.innerHTML=cache.map(u=>`<tr><td><strong>${esc(u.nombre||"Sin nombre")}</strong></td><td>${esc(u.email||"")}</td><td><span class="pill">${esc(nombreRol(u.role_code))}</span></td><td><span class="pill ${u.activo!==false?"ok":"off"}">${u.activo!==false?"Activo":"Inactivo"}</span></td><td>${u.requiere_cambio_password?'<span class="pill warn">Pendiente</span>':'No'}</td><td class="acts">${can("editar_usuario")?`<button type="button" onclick="editUser('${u.id}')" title="Editar">✏️</button><button type="button" onclick="resetPass('${u.id}')" title="Asignar contraseña temporal">🔑</button>`:""}</td></tr>`).join("")}
function open(id){$(id)?.classList.add("show")}function closeAll(){document.querySelectorAll(".modal-u").forEach(x=>x.classList.remove("show"))}
window.editUser=id=>{if(!can("editar_usuario"))return deny("editar_usuario");let u=cache.find(x=>x.id===id);if(!u)return;$("modalTitulo").textContent="Editar usuario";$("usuarioId").value=u.id;$("usuarioNombre").value=u.nombre||"";$("usuarioEmail").value=u.email||"";$("usuarioEmail").readOnly=true;const selector=$("usuarioRol");
if(!catalogoRoles.some(r=>r.codigo===u.role_code)){
 const opt=document.createElement("option");opt.value=u.role_code||"";opt.textContent=nombreRol(u.role_code)+" (inactivo o no disponible)";opt.disabled=true;selector.appendChild(opt);
}
selector.value=u.role_code||"";$("usuarioActivo").value=String(u.activo!==false);$("wrapTemp").style.display="none";$("wrapActivo").style.display="block";open("modalUsuario")};
window.resetPass=id=>{if(!can("editar_usuario"))return deny("editar_usuario");let u=cache.find(x=>x.id===id);$("passwordUserId").value=id;$("passwordUsuario").textContent=u?`${u.nombre} · ${u.email}`:"";$("passwordTemporal").value="";open("modalPassword")};
async function invoke(body){const c=await client();const {data,error}=await c.functions.invoke("admin-users",{body});if(error)throw error;if(!data?.ok)throw Error(data?.error||"Operación no completada");return data}
$("btnNuevo")?.addEventListener("click",()=>{if(!can("crear_usuario"))return deny("crear_usuario");$("formUsuario").reset();$("usuarioId").value="";if(!catalogoRoles.length){alert("No hay roles activos disponibles.");return;}$("modalTitulo").textContent="Nuevo usuario";$("usuarioEmail").readOnly=false;$("wrapTemp").style.display="block";$("wrapActivo").style.display="none";open("modalUsuario")});
$("formUsuario")?.addEventListener("submit",async e=>{e.preventDefault();try{let id=$("usuarioId").value;validarRol($("usuarioRol").value);if(id){if(!can("editar_usuario"))return deny("editar_usuario");await invoke({action:"update",user_id:id,nombre:$("usuarioNombre").value.trim(),role_code:$("usuarioRol").value,activo:$("usuarioActivo").value==="true"})}else{if(!can("crear_usuario"))return deny("crear_usuario");let pw=$("usuarioPassword").value;if(pw.length<8)throw Error("La contraseña temporal debe tener al menos 8 caracteres");await invoke({action:"create",nombre:$("usuarioNombre").value.trim(),email:$("usuarioEmail").value.trim(),role_code:$("usuarioRol").value,password:pw})}closeAll();await load();alert("✅ Usuario guardado")}catch(err){console.error(err);alert("❌ "+err.message)}});
$("formPassword")?.addEventListener("submit",async e=>{e.preventDefault();if(!can("editar_usuario"))return deny("editar_usuario");try{let pw=$("passwordTemporal").value;if(pw.length<8)throw Error("Mínimo 8 caracteres");await invoke({action:"reset_password",user_id:$("passwordUserId").value,password:pw});closeAll();await load();alert("✅ Contraseña temporal asignada")}catch(err){console.error(err);alert("❌ "+err.message)}});
document.querySelectorAll("[data-close]").forEach(x=>x.addEventListener("click",closeAll));
let usuariosInicializados=false;
async function iniciarUsuarios(){
 if(usuariosInicializados)return;
 const u=window.getCurrentUser?.();
 if(!u||!Array.isArray(u.permisos))return;
 if(!can("ver_usuarios"))return;
 usuariosInicializados=true;
 try{
  await cargarRoles();
  await load();
  const c=await client();
  channel=c.channel("profiles-users-44").on("postgres_changes",{event:"*",schema:"public",table:"profiles"},()=>load().catch(console.error)).subscribe(s=>{if(s==="SUBSCRIBED")console.log("📡 Realtime Usuarios activo")});
  console.log("✅ Usuarios Fase 4.4.4 inicializado");
 }catch(e){usuariosInicializados=false;console.error("❌ Usuarios:",e);const body=$("usuariosBody");if(body)body.innerHTML=`<tr><td colspan="6" class="empty-state">${esc(e.message)}</td></tr>`;}
}
window.addEventListener("smartrecruit:auth-ready",iniciarUsuarios);
document.addEventListener("DOMContentLoaded",()=>{const u=window.getCurrentUser?.();if(u&&Array.isArray(u.permisos))iniciarUsuarios();});
