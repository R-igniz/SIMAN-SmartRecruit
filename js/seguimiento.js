/* ============================================================
   SIMAN SMARTRECRUIT
   seguimiento.js
   FASE 4 - SUPABASE + REALTIME
============================================================ */

console.log("📋 seguimiento.js Fase 4 cargando...");

// ============================================================
// VARIABLES
// ============================================================

let supabaseSeguimiento = null;
let usuarioSeguimiento = null;
let requisicionesSeguimiento = [];
let realtimeSeguimiento = null;

// ============================================================
// ESTADOS Y PROGRESO
// ============================================================

const ESTADOS_PROCESO = [
    "Nueva",
    "Revisando",
    "Publicada",
    "Recibiendo CV",
    "Entrevistas",
    "Evaluaciones",
    "Oferta",
    "Contratado",
    "Cerrado"
];

const PROGRESO_ESTADOS = {
    "Nueva": 10,
    "Revisando": 20,
    "Publicada": 30,
    "Recibiendo CV": 40,
    "Entrevistas": 55,
    "Evaluaciones": 70,
    "Oferta": 85,
    "Contratado": 100,
    "Cerrado": 100
};

// ============================================================
// HELPERS
// ============================================================

function $(id) {
    return document.getElementById(id);
}

function escaparHTML(valor) {
    return String(valor ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function texto(valor, defecto = "—") {
    if (
        valor === null ||
        valor === undefined ||
        String(valor).trim() === ""
    ) {
        return defecto;
    }

    return String(valor);
}

function normalizarEstado(estado) {
    const valor = String(estado || "")
        .trim()
        .toLowerCase();

    const encontrado = ESTADOS_PROCESO.find(
        item => item.toLowerCase() === valor
    );

    return encontrado || "Nueva";
}

function obtenerProgreso(estado) {
    const estadoNormalizado = normalizarEstado(estado);

    return PROGRESO_ESTADOS[estadoNormalizado] || 10;
}

function formatearFecha(fecha) {
    if (!fecha) {
        return "Sin fecha";
    }

    let date;

    // Evitar problemas de zona horaria con columnas DATE
    if (/^\d{4}-\d{2}-\d{2}$/.test(String(fecha))) {
        const [year, month, day] = String(fecha)
            .split("-")
            .map(Number);

        date = new Date(year, month - 1, day);
    } else {
        date = new Date(fecha);
    }

    if (Number.isNaN(date.getTime())) {
        return "Sin fecha";
    }

    return new Intl.DateTimeFormat("es-GT", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
    }).format(date);
}

function clasePrioridad(prioridad) {
    const valor = String(prioridad || "")
        .trim()
        .toLowerCase();

    if (
        valor === "alta" ||
        valor === "urgente"
    ) {
        return "priority-high";
    }

    if (valor === "media") {
        return "priority-medium";
    }

    return "priority-low";
}

function claseEstado(estado) {
    const valor = normalizarEstado(estado);

    if (
        valor === "Contratado" ||
        valor === "Cerrado"
    ) {
        return "status-success";
    }

    if (
        valor === "Entrevistas" ||
        valor === "Evaluaciones" ||
        valor === "Oferta"
    ) {
        return "status-warning";
    }

    return "status-blue";
}

// ============================================================
// CLIENTE SUPABASE
// ============================================================

async function obtenerClienteSupabaseSeguimiento() {

    if (typeof window.getSupabase === "function") {
        const cliente = await window.getSupabase();

        if (cliente) {
            return cliente;
        }
    }

    if (typeof window.getSupabaseClient === "function") {
        const cliente = await window.getSupabaseClient();

        if (cliente) {
            return cliente;
        }
    }

    if (window.supabaseClient) {
        return window.supabaseClient;
    }

    if (
        window.supabase &&
        typeof window.supabase.from === "function"
    ) {
        return window.supabase;
    }

    throw new Error(
        "No se encontró el cliente Supabase."
    );
}

// ============================================================
// USUARIO ACTUAL
// ============================================================

async function obtenerUsuarioSeguimiento() {

    const {
        data: authData,
        error: authError
    } = await supabaseSeguimiento.auth.getUser();

    if (authError) {
        throw authError;
    }

    if (!authData?.user) {
        throw new Error(
            "No existe una sesión activa."
        );
    }

    const authUser = authData.user;

    let perfil = null;

    const {
        data: profileData,
        error: profileError
    } = await supabaseSeguimiento
        .from("profiles")
        .select("id,email,nombre,role_code,activo")
        .eq("id", authUser.id)
        .maybeSingle();

    if (profileError) {
        console.warn(
            "⚠️ No se pudo cargar el perfil:",
            profileError
        );
    } else {
        perfil = profileData;
    }

    usuarioSeguimiento = {
        id: authUser.id,

        email:
            perfil?.email ||
            authUser.email ||
            "",

        nombre:
            perfil?.nombre ||
            authUser.email ||
            "Usuario",

        role_code:
            perfil?.role_code ||
            "usuario",

        activo:
            perfil?.activo ?? true
    };

    console.log(
        "👤 Seguimiento:",
        usuarioSeguimiento.email,
        "|",
        usuarioSeguimiento.nombre,
        "|",
        usuarioSeguimiento.id
    );
}

// ============================================================
// CONTROL POR ROL
// ============================================================

function esAdministrador() {
    const role = String(
        usuarioSeguimiento?.role_code || ""
    ).toLowerCase();

    return role === "admin" ||
           role === "administrador";
}

function esReclutadora() {
    const role = String(
        usuarioSeguimiento?.role_code || ""
    ).toLowerCase();

    return role === "reclutadora" ||
           role === "reclutador";
}

// ============================================================
// CARGAR REQUISICIONES
// ============================================================

async function cargarSeguimiento() {

    console.log(
        "🔄 Cargando seguimiento desde Supabase..."
    );

    try {

        let consulta = supabaseSeguimiento
            .from("requisiciones")
            .select("*")
            .order("created_at", {
                ascending: false
            });

        /*
         * Administrador:
         * ve todas.
         *
         * Reclutadora:
         * ve las asignadas a su UUID.
         */

        if (
            esReclutadora() &&
            usuarioSeguimiento?.id
        ) {
            consulta = consulta.eq(
                "reclutador_id",
                usuarioSeguimiento.id
            );
        }

        const {
            data,
            error
        } = await consulta;

        if (error) {
            throw error;
        }

        requisicionesSeguimiento =
            Array.isArray(data)
                ? data
                : [];

        console.log(
            "✅ Requisiciones cargadas:",
            requisicionesSeguimiento.length
        );

        renderSeguimiento();

    } catch (error) {

        console.error(
            "❌ Error cargando seguimiento:",
            error
        );

        mostrarErrorSeguimiento(
            error.message ||
            "No fue posible cargar las requisiciones."
        );
    }
}

// ============================================================
// PROCESOS ACTIVOS
// ============================================================

function obtenerProcesosActivos() {

    return requisicionesSeguimiento.filter(
        requisicion => {

            const estado =
                normalizarEstado(
                    requisicion.estado
                );

            return estado !== "Cerrado";
        }
    );
}

// ============================================================
// RENDER PRINCIPAL
// ============================================================

function renderSeguimiento() {

    const container =
        $("seguimientoContainer");

    if (!container) {
        console.error(
            "❌ seguimientoContainer no existe en seguimiento.html"
        );
        return;
    }

    const procesos =
        obtenerProcesosActivos();

    console.log(
        "📊 Procesos activos:",
        procesos.length
    );

    actualizarContadores(procesos);

    if (!procesos.length) {

        container.innerHTML = `
            <div class="seguimiento-empty">

                <div class="seguimiento-empty-icon">
                    <i class="fas fa-clipboard-check"></i>
                </div>

                <h3>No hay procesos activos</h3>

                <p>
                    Actualmente no existen requisiciones
                    pendientes de seguimiento.
                </p>

            </div>
        `;

        return;
    }

    container.innerHTML =
        procesos
            .map(renderTarjetaSeguimiento)
            .join("");
}

// ============================================================
// TARJETA
// ============================================================

function renderTarjetaSeguimiento(req) {

    const estado =
        normalizarEstado(req.estado);

    const progreso =
        obtenerProgreso(estado);

    const prioridad =
        texto(req.prioridad, "Media");

    const responsable =
        texto(
            req.reclutador,
            "Sin asignar"
        );

    const ubicacion =
        texto(
            req.tienda ||
            req.centro,
            "Sin ubicación"
        );

    const centro =
        req.centro &&
        req.tienda &&
        req.centro !== req.tienda
            ? ` · ${escaparHTML(req.centro)}`
            : "";

    return `
        <article
            class="seguimiento-card ${clasePrioridad(prioridad)}"
            data-id="${req.id}"
        >

            <div class="seguimiento-card-header">

                <div class="seguimiento-title">

                    <div class="seguimiento-code-row">

                        <strong class="seguimiento-code">
                            ${escaparHTML(
                                texto(req.codigo, `#${req.id}`)
                            )}
                        </strong>

                        <span class="seguimiento-divider">
                            -
                        </span>

                        <span class="seguimiento-position">
                            ${escaparHTML(
                                texto(req.puesto)
                            )}
                        </span>

                    </div>

                    <div class="seguimiento-location">

                        <i class="fas fa-store"></i>

                        <span>
                            ${escaparHTML(ubicacion)}
                            ${centro}
                        </span>

                    </div>

                </div>


                <div class="seguimiento-owner">

                    <span class="estado-badge ${claseEstado(estado)}">
                        ${escaparHTML(estado.toUpperCase())}
                    </span>

                    <span class="owner-name">
                        <i class="fas fa-user-tie"></i>
                        ${escaparHTML(responsable)}
                    </span>

                </div>

            </div>


            <div class="seguimiento-progress">

                <div class="seguimiento-progress-head">

                    <span>Progreso:</span>

                    <strong>
                        ${progreso}%
                    </strong>

                </div>


                <div class="progress-track">

                    <div
                        class="progress-value"
                        style="width:${progreso}%"
                    ></div>

                </div>

            </div>


            <div class="seguimiento-card-footer">

                <div class="seguimiento-meta">

                    <span class="meta-badge status-blue">

                        <i class="fas fa-spinner"></i>

                        ${escaparHTML(
                            estado.toUpperCase()
                        )}

                    </span>


                    <span>

                        <i class="far fa-calendar-alt"></i>

                        ${escaparHTML(
                            formatearFecha(
                                req.fecha ||
                                req.created_at
                            )
                        )}

                    </span>


                    <span>

                        <i class="fas fa-flag"></i>

                        ${escaparHTML(prioridad)}

                    </span>

                </div>


                <button
                    type="button"
                    class="btn-gestionar"
                    data-requisicion-id="${req.id}"
                    onclick="gestionarRequisicion(${req.id})"
                >
                    <i class="fas fa-arrow-right"></i>
                    Gestionar
                </button>

            </div>

        </article>
    `;
}

// ============================================================
// CONTADORES
// ============================================================

function actualizarContadores(procesos) {

    const total =
        procesos.length;

    const contador =
        $("contadorProcesos");

    if (contador) {

        contador.textContent =
            `${total} ${
                total === 1
                    ? "ACTIVO"
                    : "ACTIVOS"
            }`;
    }

    const titulo =
        $("tituloSeguimiento");

    if (titulo) {

        titulo.innerHTML = `
            <i class="fas fa-list-check"></i>
            Seguimiento de Procesos
        `;
    }
}

// ============================================================
// GESTIONAR REQUISICIÓN
// ============================================================

function gestionarRequisicion(id) {

    console.log(
        "➡️ Gestionar requisición:",
        id
    );

    const requisicionId =
        Number(id);

    if (
        !Number.isInteger(requisicionId) ||
        requisicionId <= 0
    ) {

        console.error(
            "❌ ID de requisición inválido:",
            id
        );

        alert(
            "No se pudo identificar la requisición."
        );

        return;
    }

    const url =
        `/administrar-requisicion.html?id=${encodeURIComponent(
            requisicionId
        )}`;

    console.log(
        "🔗 Abriendo:",
        url
    );

    window.location.href = url;
}

// MUY IMPORTANTE:
// Las tarjetas se crean dinámicamente,
// por eso exponemos la función globalmente.

window.gestionarRequisicion =
    gestionarRequisicion;

// ============================================================
// ERROR
// ============================================================

function mostrarErrorSeguimiento(mensaje) {

    const container =
        $("seguimientoContainer");

    if (!container) {
        return;
    }

    container.innerHTML = `
        <div class="seguimiento-error">

            <i class="fas fa-triangle-exclamation"></i>

            <h3>
                No se pudo cargar Seguimiento
            </h3>

            <p>
                ${escaparHTML(mensaje)}
            </p>

            <button
                type="button"
                class="btn-gestionar"
                onclick="window.location.reload()"
            >
                <i class="fas fa-rotate-right"></i>
                Reintentar
            </button>

        </div>
    `;
}

// ============================================================
// REALTIME
// ============================================================

function iniciarRealtimeSeguimiento() {

    if (
        !supabaseSeguimiento ||
        !usuarioSeguimiento
    ) {
        return;
    }

    if (realtimeSeguimiento) {

        try {

            supabaseSeguimiento
                .removeChannel(
                    realtimeSeguimiento
                );

        } catch (error) {

            console.warn(
                "⚠️ No se pudo cerrar canal anterior:",
                error
            );
        }
    }

    realtimeSeguimiento =
        supabaseSeguimiento
            .channel(
                `seguimiento-${usuarioSeguimiento.id}`
            )

            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "requisiciones"
                },
                async payload => {

                    console.log(
                        "📡 Cambio en requisiciones:",
                        payload.eventType
                    );

                    await cargarSeguimiento();
                }
            )

            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "candidatos"
                },
                async payload => {

                    console.log(
                        "📡 Cambio en candidatos:",
                        payload.eventType
                    );

                    /*
                     * Por ahora recargamos seguimiento.
                     * Más adelante podremos mostrar cantidad
                     * de candidatos por requisición.
                     */

                    await cargarSeguimiento();
                }
            )

            .subscribe(status => {

                console.log(
                    "📡 Realtime Seguimiento:",
                    status
                );
            });
}

// ============================================================
// INICIALIZACIÓN
// ============================================================

async function iniciarSeguimiento() {

    console.log(
        "🚀 Inicializando Seguimiento Fase 4..."
    );

    try {

        // ----------------------------------------------------
        // SUPABASE
        // ----------------------------------------------------

        supabaseSeguimiento =
            await obtenerClienteSupabaseSeguimiento();

        console.log(
            "✅ Supabase disponible en Seguimiento"
        );

        // ----------------------------------------------------
        // SESIÓN
        // ----------------------------------------------------

        const {
            data: sessionData,
            error: sessionError
        } =
            await supabaseSeguimiento
                .auth
                .getSession();

        if (sessionError) {
            throw sessionError;
        }

        if (!sessionData?.session) {

            console.warn(
                "⚠️ No existe sesión activa"
            );

            window.location.href =
                "/index.html";

            return;
        }

        // ----------------------------------------------------
        // PERMISO
        // ----------------------------------------------------

        if (
            typeof window.tienePermiso ===
            "function"
        ) {

            const permitido =
                await window.tienePermiso(
                    "ver_seguimiento"
                );

            if (!permitido) {

                console.warn(
                    "⛔ Sin permiso ver_seguimiento"
                );

                window.location.href =
                    "/dashboard.html";

                return;
            }
        }

        // ----------------------------------------------------
        // USUARIO
        // ----------------------------------------------------

        await obtenerUsuarioSeguimiento();

        // ----------------------------------------------------
        // DATOS
        // ----------------------------------------------------

        await cargarSeguimiento();

        // ----------------------------------------------------
        // REALTIME
        // ----------------------------------------------------

        iniciarRealtimeSeguimiento();

        console.log(
            "✅ Seguimiento Fase 4 inicializado"
        );

    } catch (error) {

        console.error(
            "❌ Error inicializando Seguimiento:",
            error
        );

        mostrarErrorSeguimiento(
            error.message ||
            "Error desconocido."
        );
    }
}

// ============================================================
// LIMPIEZA REALTIME
// ============================================================

window.addEventListener(
    "beforeunload",
    () => {

        if (
            realtimeSeguimiento &&
            supabaseSeguimiento
        ) {

            try {

                supabaseSeguimiento
                    .removeChannel(
                        realtimeSeguimiento
                    );

            } catch (error) {

                console.warn(
                    "⚠️ Error cerrando Realtime:",
                    error
                );
            }
        }
    }
);

// ============================================================
// DOM READY
// ============================================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        setTimeout(
            iniciarSeguimiento,
            250
        );
    }
);

console.log(
    "✅ seguimiento.js Fase 4 cargado"
);
