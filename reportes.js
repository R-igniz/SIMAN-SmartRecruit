// ============================================================
// SIMAN SMARTRECRUIT - REPORTES FASE 4
// Supabase + Auth + Realtime + filtros + exportación
// ============================================================
console.log("📊 reportes.js Fase 4 cargando...");

let supabaseReportes = null;
let usuarioReportes = null;
let requisicionesReportes = [];
let candidatosReportes = [];
let requisicionesFiltradas = [];
let realtimeRequisicionesReportes = null;
let realtimeCandidatosReportes = null;
let paginaReportes = 1;
const FILAS_POR_PAGINA = 10;
let reportesInicializado = false;

const $ = id => document.getElementById(id);
const normalizar = v => String(v ?? "").trim();
const clave = v => normalizar(v).toLowerCase();

function escaparHTML(valor) {
  return String(valor ?? "").replace(/[&<>"']/g, c => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[c]));
}

function fechaISO(valor) {
  if (!valor) return "";
  return String(valor).slice(0, 10);
}

function fechaVisual(valor) {
  if (!valor) return "—";
  const iso = fechaISO(valor);
  const p = iso.split("-");
  return p.length === 3 ? `${p[2]}/${p[1]}/${p[0]}` : escaparHTML(valor);
}

function estadoActivo(estado) {
  const e = clave(estado);
  return e !== "cerrado" && e !== "contratado";
}

function mostrarMensaje(mensaje, tipo="info") {
  console.log(`[${tipo.toUpperCase()}] ${mensaje}`);
  if (typeof window.mostrarNotificacion === "function") {
    window.mostrarNotificacion(mensaje, tipo);
  } else if (typeof window.showNotification === "function") {
    window.showNotification(mensaje, tipo);
  }
}

async function obtenerClienteSupabase() {
  if (typeof window.getSupabase === "function") {
    const c = await window.getSupabase();
    if (c) return c;
  }
  if (typeof window.getSupabaseClient === "function") {
    const c = await window.getSupabaseClient();
    if (c) return c;
  }
  if (window.supabaseClient) return window.supabaseClient;
  if (window.supabaseDB && typeof window.supabaseDB.from === "function") return window.supabaseDB;
  throw new Error("No se encontró el cliente Supabase.");
}

async function esperarAuth() {
  for (let i=0; i<50; i++) {
    if (typeof window.getCurrentUser === "function") {
      const u = window.getCurrentUser();
      if (u?.id) return u;
    }
    await new Promise(r => setTimeout(r, 100));
  }
  throw new Error("No se pudo obtener currentUser desde auth.js.");
}

function validarPermiso() {
  if (typeof window.tienePermiso !== "function") return true;
  if (window.tienePermiso("ver_reportes")) return true;
  window.location.replace("/dashboard.html");
  return false;
}

function esAdminOGerente() {
  const r = clave(usuarioReportes?.role || usuarioReportes?.rol);
  return r === "administrador" || r === "admin" || r === "gerente rh" || r === "gerente_rh";
}

async function cargarDatos() {
  console.log("🔄 Cargando Reportes desde Supabase...");

  let qReq = supabaseReportes
    .from("requisiciones")
    .select("*")
    .order("created_at", {ascending:false});

  // Reclutadora: solo sus procesos. Admin/Gerente: todos.
  if (!esAdminOGerente() && usuarioReportes?.id) {
    qReq = qReq.eq("reclutador_id", usuarioReportes.id);
  }

  let qCan = supabaseReportes
    .from("candidatos")
    .select("id,requisicion_id,estado,reclutador_id,fecha_entrevista,cv_path,created_at,updated_at");

  if (!esAdminOGerente() && usuarioReportes?.id) {
    qCan = qCan.eq("reclutador_id", usuarioReportes.id);
  }

  const [reqRes, canRes] = await Promise.all([qReq, qCan]);
  if (reqRes.error) throw reqRes.error;
  if (canRes.error) throw canRes.error;

  requisicionesReportes = reqRes.data || [];
  candidatosReportes = canRes.data || [];

  console.log("✅ Requisiciones para reportes:", requisicionesReportes.length);
  console.log("👥 Candidatos para reportes:", candidatosReportes.length);

  poblarFiltros();
  aplicarFiltros(false);
}

function valoresUnicos(campo) {
  return [...new Set(requisicionesReportes.map(r => normalizar(r[campo])).filter(Boolean))]
    .sort((a,b) => a.localeCompare(b, "es"));
}

function poblarSelect(id, valores, textoTodos) {
  const s = $(id);
  if (!s) return;
  const actual = s.value;
  s.innerHTML = `<option value="">${escaparHTML(textoTodos)}</option>` +
    valores.map(v => `<option value="${escaparHTML(v)}">${escaparHTML(v)}</option>`).join("");
  if ([...s.options].some(o => o.value === actual)) s.value = actual;
}

function poblarFiltros() {
  poblarSelect("filtroCentro", valoresUnicos("centro"), "Todos");
  poblarSelect("filtroTienda", valoresUnicos("tienda"), "Todas");
  poblarSelect("filtroDepartamento", valoresUnicos("departamento"), "Todos");
  poblarSelect("filtroEstado", valoresUnicos("estado"), "Todos");

  const reclutadoras = [...new Set(requisicionesReportes
    .map(r => normalizar(r.reclutador))
    .filter(Boolean))]
    .sort((a,b)=>a.localeCompare(b,"es"));
  poblarSelect("filtroReclutadora", reclutadoras, "Todas");
}

function aplicarFiltros(resetPagina=true) {
  const centro = clave($("filtroCentro")?.value);
  const tienda = clave($("filtroTienda")?.value);
  const departamento = clave($("filtroDepartamento")?.value);
  const estado = clave($("filtroEstado")?.value);
  const reclutadora = clave($("filtroReclutadora")?.value);
  const desde = $("filtroFechaDesde")?.value || "";
  const hasta = $("filtroFechaHasta")?.value || "";

  requisicionesFiltradas = requisicionesReportes.filter(r => {
    const fecha = fechaISO(r.fecha || r.created_at);
    return (!centro || clave(r.centro) === centro) &&
      (!tienda || clave(r.tienda) === tienda) &&
      (!departamento || clave(r.departamento) === departamento) &&
      (!estado || clave(r.estado) === estado) &&
      (!reclutadora || clave(r.reclutador) === reclutadora) &&
      (!desde || fecha >= desde) &&
      (!hasta || fecha <= hasta);
  });

  if (resetPagina) paginaReportes = 1;
  renderTodo();
}

function candidatosDeRequisicion(id) {
  return candidatosReportes.filter(c => String(c.requisicion_id) === String(id));
}

function renderKPIs() {
  const cont = $("reportesContainer");
  if (!cont) return;

  const ids = new Set(requisicionesFiltradas.map(r => String(r.id)));
  const candidatos = candidatosReportes.filter(c => ids.has(String(c.requisicion_id)));
  const contratados = candidatos.filter(c => clave(c.estado) === "contratado").length;
  const entrevistas = candidatos.filter(c => {
    const e = clave(c.estado);
    return e.includes("entrevista") || !!c.fecha_entrevista;
  }).length;
  const activas = requisicionesFiltradas.filter(r => estadoActivo(r.estado)).length;
  const cerradas = requisicionesFiltradas.filter(r => clave(r.estado) === "cerrado").length;

  const kpis = [
    ["fa-clipboard-list","Requisiciones",requisicionesFiltradas.length],
    ["fa-spinner","Procesos activos",activas],
    ["fa-circle-check","Cerradas",cerradas],
    ["fa-users","Candidatos",candidatos.length],
    ["fa-user-check","Contratados",contratados],
    ["fa-calendar-check","Entrevistas",entrevistas]
  ];

  cont.innerHTML = kpis.map(([icon,label,value]) => `
    <article class="kpi-card">
      <div class="kpi-icon"><i class="fas ${icon}"></i></div>
      <div><span>${label}</span><strong>${value}</strong></div>
    </article>`).join("");
}

function claseEstado(estado) {
  const e = clave(estado).replace(/\s+/g,"-");
  return `status-badge estado-${e || "sin-estado"}`;
}

function renderTabla() {
  const body = $("reportesTableBody");
  if (!body) return;

  const total = requisicionesFiltradas.length;
  const paginas = Math.max(1, Math.ceil(total / FILAS_POR_PAGINA));
  if (paginaReportes > paginas) paginaReportes = paginas;
  const inicio = (paginaReportes-1)*FILAS_POR_PAGINA;
  const filas = requisicionesFiltradas.slice(inicio, inicio+FILAS_POR_PAGINA);

  if (!filas.length) {
    body.innerHTML = `<tr><td colspan="10" class="table-message">No hay requisiciones que coincidan con los filtros.</td></tr>`;
  } else {
    body.innerHTML = filas.map(r => `
      <tr>
        <td><strong>${escaparHTML(r.codigo || `#${r.id}`)}</strong></td>
        <td>${escaparHTML(r.centro || "—")}</td>
        <td>${escaparHTML(r.tienda || "—")}</td>
        <td>${escaparHTML(r.puesto || "—")}</td>
        <td>${escaparHTML(r.departamento || "—")}</td>
        <td><span class="${claseEstado(r.estado)}">${escaparHTML(r.estado || "Sin estado")}</span></td>
        <td>${escaparHTML(r.reclutador || "Sin asignar")}</td>
        <td><span class="candidate-count">${candidatosDeRequisicion(r.id).length}</span></td>
        <td>${fechaVisual(r.fecha || r.created_at)}</td>
        <td>
          <button type="button" class="view-btn" data-id="${escaparHTML(r.id)}" title="Administrar requisición">
            <i class="fas fa-eye"></i>
          </button>
        </td>
      </tr>`).join("");
  }

  $("resumenResultados").textContent = `${total} requisición${total===1?"":"es"} en el reporte actual`;
  $("paginacionTexto").textContent = total ? `Mostrando ${inicio+1}-${Math.min(inicio+FILAS_POR_PAGINA,total)} de ${total}` : "0 resultados";
  $("paginaActual").textContent = `Página ${paginaReportes} de ${paginas}`;
  $("btnAnterior").disabled = paginaReportes <= 1;
  $("btnSiguiente").disabled = paginaReportes >= paginas;
}

function renderTodo() {
  renderKPIs();
  renderTabla();
}

function limpiarFiltros() {
  ["filtroCentro","filtroTienda","filtroDepartamento","filtroEstado","filtroReclutadora","filtroFechaDesde","filtroFechaHasta"]
    .forEach(id => { if ($(id)) $(id).value = ""; });
  aplicarFiltros();
}

function csvSeguro(v) {
  const s = String(v ?? "").replace(/"/g,'""');
  return `"${s}"`;
}

function exportarExcel() {
  // CSV UTF-8 compatible con Excel, sin librerías externas.
  const encabezado = ["Código","Centro","Tienda","Puesto","Departamento","Estado","Reclutadora","Candidatos","Fecha"];
  const lineas = [encabezado.map(csvSeguro).join(",")];

  requisicionesFiltradas.forEach(r => lineas.push([
    r.codigo || r.id, r.centro, r.tienda, r.puesto, r.departamento,
    r.estado, r.reclutador, candidatosDeRequisicion(r.id).length,
    fechaVisual(r.fecha || r.created_at)
  ].map(csvSeguro).join(",")));

  descargarBlob(
    new Blob(["\ufeff"+lineas.join("\r\n")], {type:"text/csv;charset=utf-8;"}),
    `SIMAN-Reporte-${fechaISO(new Date().toISOString())}.csv`
  );
  mostrarMensaje("Reporte compatible con Excel generado.", "success");
}

function exportarPDF() {
  // Exportación PDF mediante impresión nativa: el usuario puede elegir "Guardar como PDF".
  document.body.classList.add("print-report");
  window.print();
  setTimeout(() => document.body.classList.remove("print-report"), 300);
}

function descargarBlob(blob, nombre) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = nombre;
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
}

function configurarEventos() {
  $("btnAplicarFiltros")?.addEventListener("click", () => aplicarFiltros());
  $("btnLimpiarFiltros")?.addEventListener("click", limpiarFiltros);
  $("btnExportarExcel")?.addEventListener("click", exportarExcel);
  $("btnExportarPDF")?.addEventListener("click", exportarPDF);

  $("btnAnterior")?.addEventListener("click", () => {
    if (paginaReportes > 1) { paginaReportes--; renderTabla(); }
  });
  $("btnSiguiente")?.addEventListener("click", () => {
    const p = Math.max(1, Math.ceil(requisicionesFiltradas.length/FILAS_POR_PAGINA));
    if (paginaReportes < p) { paginaReportes++; renderTabla(); }
  });

  $("reportesTableBody")?.addEventListener("click", e => {
    const b = e.target.closest(".view-btn");
    if (b?.dataset.id) window.location.href = `/administrar-requisicion.html?id=${encodeURIComponent(b.dataset.id)}`;
  });
}

function limpiarRealtime() {
  if (!supabaseReportes) return;
  if (realtimeRequisicionesReportes) supabaseReportes.removeChannel(realtimeRequisicionesReportes);
  if (realtimeCandidatosReportes) supabaseReportes.removeChannel(realtimeCandidatosReportes);
  realtimeRequisicionesReportes = null;
  realtimeCandidatosReportes = null;
}

function iniciarRealtime() {
  limpiarRealtime();

  realtimeRequisicionesReportes = supabaseReportes
    .channel("reportes-requisiciones-fase4")
    .on("postgres_changes",{event:"*",schema:"public",table:"requisiciones"}, async () => {
      console.log("📡 Cambio Realtime en requisiciones");
      await cargarDatos();
    })
    .subscribe(status => {
      if (status === "SUBSCRIBED") console.log("📡 Reportes Realtime requisiciones activo");
    });

  realtimeCandidatosReportes = supabaseReportes
    .channel("reportes-candidatos-fase4")
    .on("postgres_changes",{event:"*",schema:"public",table:"candidatos"}, async () => {
      console.log("📡 Cambio Realtime en candidatos");
      await cargarDatos();
    })
    .subscribe(status => {
      if (status === "SUBSCRIBED") console.log("📡 Reportes Realtime candidatos activo");
    });
}

async function iniciarReportes() {
  if (reportesInicializado) return;
  reportesInicializado = true;

  try {
    console.log("🚀 Inicializando Reportes Fase 4");
    supabaseReportes = await obtenerClienteSupabase();
    usuarioReportes = await esperarAuth();

    console.log("👤 Reportes desde auth.js:", usuarioReportes.email, "|", usuarioReportes.role, "|", usuarioReportes.id);

    if (!validarPermiso()) return;

    configurarEventos();
    await cargarDatos();
    iniciarRealtime();

    console.log("✅ Reportes Fase 4 inicializado");
  } catch (error) {
    reportesInicializado = false;
    console.error("❌ Error inicializando Reportes:", error);
    const body = $("reportesTableBody");
    if (body) body.innerHTML = `<tr><td colspan="10" class="table-message error">No se pudieron cargar los reportes: ${escaparHTML(error?.message || error)}</td></tr>`;
    mostrarMensaje("No se pudo cargar el módulo de reportes.", "error");
  }
}

document.addEventListener("DOMContentLoaded", iniciarReportes);
window.addEventListener("beforeunload", limpiarRealtime);
window.cargarReportes = cargarDatos;

console.log("✅ reportes.js Fase 4 cargado");
