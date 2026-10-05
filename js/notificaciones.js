// ============================================================
// SIMAN SMARTRECRUIT - CENTRO DE NOTIFICACIONES FASE 4
// Supabase + Auth + RLS + Realtime
// ============================================================
console.log("🔔 notificaciones.js Fase 4 cargando...");

let dbNotificaciones = null;
let usuarioNotificaciones = null;
let listaNotificaciones = [];
let filtroNotificaciones = "todas";
let canalNotificaciones = null;
let moduloNotificacionesInicializado = false;

const N = id => document.getElementById(id);
const esc = value => window.SmartRecruitNotifications?.escapeHTML(value) ??
  String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));

async function obtenerCliente() {
  if (typeof window.getSupabase === "function") {
    const c = await window.getSupabase(); if (c) return c;
  }
  if (typeof window.getSupabaseClient === "function") {
    const c = await window.getSupabaseClient(); if (c) return c;
  }
  if (window.supabaseClient) return window.supabaseClient;
  if (window.supabaseDB?.from) return window.supabaseDB;
  throw new Error("No se encontró el cliente Supabase.");
}

async function esperarUsuario() {
  for (let i=0; i<50; i++) {
    if (typeof window.getCurrentUser === "function") {
      const u = window.getCurrentUser();
      if (u?.id) return u;
    }
    await new Promise(r => setTimeout(r,100));
  }
  throw new Error("No se pudo obtener el usuario autenticado desde auth.js.");
}

function validarPermiso() {
  if (typeof window.tienePermiso !== "function") return true;
  if (window.tienePermiso("ver_notificaciones")) return true;
  window.location.replace("/dashboard.html");
  return false;
}

function fechaRelativa(fecha) {
  if (!fecha) return "";
  const d = new Date(fecha), ahora = new Date();
  const segundos = Math.max(0, Math.floor((ahora-d)/1000));
  if (segundos < 60) return "Ahora";
  const min = Math.floor(segundos/60);
  if (min < 60) return `Hace ${min} min`;
  const horas = Math.floor(min/60);
  if (horas < 24) return `Hace ${horas} h`;
  const dias = Math.floor(horas/24);
  if (dias < 7) return `Hace ${dias} día${dias===1?"":"s"}`;
  return d.toLocaleDateString("es-GT",{day:"2-digit",month:"short",year:"numeric"});
}

function aparienciaTipo(tipo) {
  const t = String(tipo || "").toLowerCase();
  if (t.includes("entrevista")) return ["fa-calendar-check","type-interview"];
  if (t.includes("candidato")) return ["fa-user-plus","type-candidate"];
  if (t.includes("contrat")) return ["fa-user-check","type-success"];
  if (t.includes("oferta")) return ["fa-file-signature","type-offer"];
  if (t.includes("venc") || t.includes("alert")) return ["fa-triangle-exclamation","type-danger"];
  if (t.includes("requis")) return ["fa-clipboard-list","type-requisition"];
  return ["fa-bell","type-default"];
}

async function cargarNotificaciones() {
  const cont = N("notificacionesContainer");
  if (cont) cont.innerHTML = `<div class="empty-state"><i class="fas fa-spinner fa-spin"></i><span>Cargando...</span></div>`;

  const {data,error} = await dbNotificaciones
    .from("notificaciones")
    .select("id,usuario_id,tipo,titulo,mensaje,leida,requisicion_id,candidato_id,url,created_at")
    .eq("usuario_id",usuarioNotificaciones.id)
    .order("created_at",{ascending:false})
    .limit(100);

  if (error) throw error;
  listaNotificaciones = data || [];
  console.log("✅ Notificaciones cargadas:", listaNotificaciones.length);
  renderNotificaciones();
}

function renderNotificaciones() {
  const cont=N("notificacionesContainer");
  if (!cont) return;

  const noLeidas=listaNotificaciones.filter(x=>!x.leida).length;
  const badge=N("badgeNoLeidas");
  if (badge) badge.textContent=`${noLeidas} no leída${noLeidas===1?"":"s"}`;

  const visibles=filtroNotificaciones==="no-leidas"
    ? listaNotificaciones.filter(x=>!x.leida)
    : listaNotificaciones;

  if (!visibles.length) {
    cont.innerHTML=`<div class="empty-state"><i class="fas fa-inbox"></i><span>${filtroNotificaciones==="no-leidas"?"No tienes notificaciones pendientes.":"No tienes notificaciones."}</span></div>`;
    return;
  }

  cont.innerHTML=visibles.map(n=>{
    const [icon,clase]=aparienciaTipo(n.tipo);
    const url=n.url || (n.requisicion_id ? `/administrar-requisicion.html?id=${encodeURIComponent(n.requisicion_id)}` : "");
    return `<article class="notification-item ${n.leida?"":"unread"}" data-id="${esc(n.id)}">
      <div class="notification-icon ${clase}"><i class="fas ${icon}"></i></div>
      <div class="notification-content">
        <div class="notification-header">
          <div>
            <h3 class="notification-title">${esc(n.titulo || "Notificación")}</h3>
            <span class="notification-date">${esc(fechaRelativa(n.created_at))}</span>
          </div>
          ${!n.leida?'<span class="new-dot" title="Nueva"></span>':""}
        </div>
        <p>${esc(n.mensaje || "")}</p>
        <div class="notification-actions">
          ${!n.leida?`<button class="action-btn mark-read" data-id="${esc(n.id)}"><i class="fas fa-check"></i> Marcar leída</button>`:""}
          ${url?`<button class="action-btn open-notification" data-id="${esc(n.id)}" data-url="${esc(url)}"><i class="fas fa-arrow-up-right-from-square"></i> Ver detalle</button>`:""}
        </div>
      </div>
    </article>`;
  }).join("");
}

async function marcarLeida(id) {
  const {error}=await dbNotificaciones.from("notificaciones")
    .update({leida:true}).eq("id",id).eq("usuario_id",usuarioNotificaciones.id);
  if (error) throw error;
  const n=listaNotificaciones.find(x=>String(x.id)===String(id));
  if(n)n.leida=true;
  renderNotificaciones();
}

async function marcarTodas() {
  const pendientes=listaNotificaciones.filter(x=>!x.leida);
  if(!pendientes.length)return;
  const {error}=await dbNotificaciones.from("notificaciones")
    .update({leida:true})
    .eq("usuario_id",usuarioNotificaciones.id)
    .eq("leida",false);
  if(error)throw error;
  listaNotificaciones.forEach(x=>x.leida=true);
  renderNotificaciones();
}

function configurarEventos() {
  document.querySelectorAll(".filter-btn").forEach(b=>b.addEventListener("click",()=>{
    document.querySelectorAll(".filter-btn").forEach(x=>x.classList.remove("active"));
    b.classList.add("active"); filtroNotificaciones=b.dataset.filter; renderNotificaciones();
  }));

  N("btnActualizar")?.addEventListener("click",()=>cargarNotificaciones().catch(manejarError));
  N("btnMarcarTodas")?.addEventListener("click",()=>marcarTodas().catch(manejarError));

  N("notificacionesContainer")?.addEventListener("click",async e=>{
    const leer=e.target.closest(".mark-read");
    if(leer){try{await marcarLeida(leer.dataset.id)}catch(err){manejarError(err)};return}
    const abrir=e.target.closest(".open-notification");
    if(abrir){
      try{await marcarLeida(abrir.dataset.id)}catch(_){}
      window.location.href=abrir.dataset.url;
    }
  });
}

function iniciarRealtime() {
  if(canalNotificaciones) dbNotificaciones.removeChannel(canalNotificaciones);
  canalNotificaciones=dbNotificaciones.channel(`notificaciones-${usuarioNotificaciones.id}`)
    .on("postgres_changes",{
      event:"*",schema:"public",table:"notificaciones",
      filter:`usuario_id=eq.${usuarioNotificaciones.id}`
    },async payload=>{
      console.log("📡 Cambio Realtime notificaciones:",payload.eventType);
      await cargarNotificaciones();
    }).subscribe(status=>{
      if(status==="SUBSCRIBED")console.log("📡 Realtime Notificaciones activo");
    });
}

function manejarError(error) {
  console.error("❌ Notificaciones:",error);
  const msg=String(error?.message||error);
  if(msg.includes("Could not find the table") || msg.includes("relation") || msg.includes("notificaciones")) {
    const cont=N("notificacionesContainer");
    if(cont)cont.innerHTML=`<div class="empty-state error"><i class="fas fa-database"></i><span>No se pudo consultar la tabla de notificaciones. Ejecuta primero el SQL incluido en el paquete.</span></div>`;
  }
}

async function iniciarModulo() {
  if(moduloNotificacionesInicializado)return;
  moduloNotificacionesInicializado=true;
  try{
    dbNotificaciones=await obtenerCliente();
    usuarioNotificaciones=await esperarUsuario();
    console.log("👤 Notificaciones desde auth.js:",usuarioNotificaciones.email,"|",usuarioNotificaciones.role,"|",usuarioNotificaciones.id);
    if(!validarPermiso())return;
    configurarEventos();
    await cargarNotificaciones();
    iniciarRealtime();
    console.log("✅ Centro de Notificaciones Fase 4 inicializado");
  }catch(e){moduloNotificacionesInicializado=false;manejarError(e)}
}

document.addEventListener("DOMContentLoaded",iniciarModulo);
window.addEventListener("beforeunload",()=>{if(dbNotificaciones&&canalNotificaciones)dbNotificaciones.removeChannel(canalNotificaciones)});
window.cargarNotificaciones=cargarNotificaciones;
console.log("✅ notificaciones.js Fase 4 cargado");