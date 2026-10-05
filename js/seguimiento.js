/* ============================================================
   SIMAN SMARTRECRUIT
   seguimiento.js
   FASE 4 - CANDIDATOS + SUPABASE + REALTIME
   ============================================================ */

"use strict";

console.log("📋 seguimiento.js Fase 4 cargando...");


// ============================================================
// VARIABLES GLOBALES
// ============================================================

let supabaseSeguimiento = null;
let usuarioSeguimiento = null;

let requisicionesSeguimiento = [];
let candidatosSeguimiento = [];

let realtimeSeguimiento = null;
let realtimeCandidatos = null;

let seguimientoInicializado = false;


// ============================================================
// CONFIGURACIÓN
// ============================================================

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


function texto(valor, defecto = "—") {

    if (
        valor === null ||
        valor === undefined ||
        String(valor).trim() === ""
    ) {
        return defecto;
    }

    return String(valor).trim();
}


function escaparHTML(valor) {

    return String(valor ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


function normalizarEstado(estado) {

    const valor = String(estado || "")
        .trim()
        .toLowerCase();

    const estados = Object.keys(PROGRESO_ESTADOS);

    const encontrado = estados.find(
        estadoSistema =>
            estadoSistema.toLowerCase() === valor
    );

    return encontrado || "Nueva";
}


function obtenerProgreso(estado) {

    const estadoNormalizado = normalizarEstado(estado);

    return PROGRESO_ESTADOS[estadoNormalizado] ?? 10;
}


function formatearFecha(fecha) {

    if (!fecha) {
        return "—";
    }

    /*
     * Las fechas de requisición pueden venir como YYYY-MM-DD.
     * Evitamos cambios de día causados por zona horaria.
     */
    if (/^\d{4}-\d{2}-\d{2}$/.test(String(fecha))) {

        const [anio, mes, dia] =
            String(fecha).split("-");

        return `${dia}/${mes}/${anio}`;
    }

    const date = new Date(fecha);

    if (Number.isNaN(date.getTime())) {
        return texto(fecha);
    }

    return new Intl.DateTimeFormat(
        "es-GT",
        {
            day: "2-digit",
            month: "2-digit",
            year: "numeric"
        }
    ).format(date);
}


function obtenerIniciales(nombre) {

    const partes = String(nombre || "")
        .trim()
        .split(/\s+/)
        .filter(Boolean);

    if (!partes.length) {
        return "SR";
    }

    if (partes.length === 1) {
        return partes[0]
            .substring(0, 2)
            .toUpperCase();
    }

    return (
        partes[0][0] +
        partes[1][0]
    ).toUpperCase();
}


function obtenerClasePrioridad(prioridad) {

    const valor = String(prioridad || "")
        .trim()
        .toLowerCase();

    if (valor === "alta") {
        return "prioridad-alta";
    }

    if (valor === "media") {
        return "prioridad-media";
    }

    if (valor === "baja") {
        return "prioridad-baja";
    }

    return "prioridad-normal";
}


function obtenerClaseEstado(estado) {

    const valor = normalizarEstado(estado)
        .toLowerCase()
        .replace(/\s+/g, "-");

    return `estado-${valor}`;
}


// ============================================================
// NOTIFICACIONES
// ============================================================

function mostrarMensaje(mensaje, tipo = "info") {

    console.log(
        `[${String(tipo).toUpperCase()}] ${mensaje}`
    );

    if (
        typeof window.mostrarNotificacion === "function"
    ) {

        window.mostrarNotificacion(
            mensaje,
            tipo
        );

        return;
    }

    if (
        typeof window.showNotification === "function"
    ) {

        window.showNotification(
            mensaje,
            tipo
        );

        return;
    }

    if (tipo === "error") {
        console.error(mensaje);
    }
}


// ============================================================
// OBTENER CLIENTE SUPABASE
// ============================================================

async function obtenerClienteSupabase() {

    /*
     * Compatibilidad con las distintas funciones que ya
     * hemos utilizado en supabase-client.js.
     */

    if (
        typeof window.getSupabase === "function"
    ) {

        const cliente =
            await window.getSupabase();

        if (cliente) {
            return cliente;
        }
    }


    if (
        typeof window.getSupabaseClient === "function"
    ) {

        const cliente =
            await window.getSupabaseClient();

        if (cliente) {
            return cliente;
        }
    }


    if (window.supabaseClient) {
        return window.supabaseClient;
    }


    if (
        window.supabaseDB &&
        typeof window.supabaseDB.from === "function"
    ) {
        return window.supabaseDB;
    }


    throw new Error(
        "No se encontró el cliente Supabase."
    );
}


// ============================================================
// OBTENER USUARIO
// ============================================================

async function cargarUsuarioSeguimiento() {

    /*
     * FASE 4:
     * auth.js es la única fuente de verdad de autenticación.
     * Seguimiento NO vuelve a ejecutar auth.getUser(), evitando
     * una segunda validación que pueda invalidar una sesión ya
     * aceptada por auth.js.
     */

    await esperarAuth();

    const usuarioAuth =
        window.currentUser ||
        window.usuarioActual ||
        window.authUser ||
        null;

    const id =
        usuarioAuth?.id ||
        usuarioAuth?.user_id ||
        usuarioAuth?.uuid ||
        null;

    const email =
        usuarioAuth?.email ||
        "";

    const nombre =
        usuarioAuth?.nombre ||
        usuarioAuth?.name ||
        usuarioAuth?.user_metadata?.nombre ||
        email ||
        "Usuario";

    const rol =
        usuarioAuth?.rol ||
        usuarioAuth?.role_code ||
        usuarioAuth?.role ||
        usuarioAuth?.user_metadata?.role_code ||
        "";

    if (!id) {
        throw new Error(
            "Auth todavía no expuso un usuario válido para Seguimiento."
        );
    }

    usuarioSeguimiento = {
        id,
        email,
        nombre,
        rol,
        activo: usuarioAuth?.activo ?? true
    };

    /*
     * Si auth.js no expone el rol en el objeto global, podemos
     * completar SOLO el perfil desde PostgreSQL. Esto no vuelve
     * a autenticar al usuario ni llama auth.getUser().
     */
    if (!usuarioSeguimiento.rol) {

        const {
            data: perfil,
            error: profileError
        } = await supabaseSeguimiento
            .from("profiles")
            .select("id,email,nombre,role_code,activo")
            .eq("id", usuarioSeguimiento.id)
            .maybeSingle();

        if (profileError) {
            console.warn(
                "⚠️ No se pudo completar profile en Seguimiento:",
                profileError
            );
        } else if (perfil) {
            usuarioSeguimiento = {
                id: perfil.id || usuarioSeguimiento.id,
                email: perfil.email || usuarioSeguimiento.email,
                nombre: perfil.nombre || usuarioSeguimiento.nombre,
                rol: perfil.role_code || usuarioSeguimiento.rol || "usuario",
                activo: perfil.activo ?? usuarioSeguimiento.activo
            };
        }
    }

    console.log(
        "👤 Seguimiento desde auth.js:",
        usuarioSeguimiento.email,
        "|",
        usuarioSeguimiento.rol,
        "|",
        usuarioSeguimiento.id
    );
}


// ============================================================
// VALIDAR PERMISO
// ============================================================

function validarPermisoSeguimiento() {

    if (
        typeof window.tienePermiso !== "function"
    ) {

        /*
         * auth.js también valida la página.
         * Si la función no está expuesta globalmente,
         * dejamos que auth.js realice el control.
         */

        return true;
    }


    const permitido =
        window.tienePermiso(
            "ver_seguimiento"
        );


    if (!permitido) {

        console.warn(
            "⛔ Usuario sin permiso ver_seguimiento"
        );

        window.location.replace(
            "/dashboard.html"
        );

        return false;
    }


    return true;
}


// ============================================================
// SABER SI ES ADMINISTRADOR
// ============================================================

function esAdministrador() {

    const rol = String(
        usuarioSeguimiento?.rol || ""
    )
        .trim()
        .toLowerCase();


    return (
        rol === "administrador" ||
        rol === "admin"
    );
}


// ============================================================
// CARGAR REQUISICIONES
// ============================================================

async function cargarRequisiciones() {

    console.log(
        "🔄 Cargando seguimiento desde Supabase..."
    );


    let consulta =
        supabaseSeguimiento
            .from("requisiciones")
            .select("*")
            .order(
                "created_at",
                {
                    ascending: false
                }
            );


    /*
     * Administrador:
     * puede ver todas.
     *
     * Reclutadora:
     * solo las asignadas a su UUID.
     */

    if (!esAdministrador()) {

        consulta =
            consulta.eq(
                "reclutador_id",
                usuarioSeguimiento.id
            );
    }


    const {
        data,
        error
    } = await consulta;


    if (error) {

        console.error(
            "❌ Error cargando requisiciones:",
            error
        );

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
}


// ============================================================
// CARGAR CANDIDATOS
// ============================================================

async function cargarCandidatos() {

    try {

        const {
            data,
            error
        } = await supabaseSeguimiento
            .from("candidatos")
            .select(
                "id,requisicion_id,nombre,estado,reclutador_id,fecha_entrevista,cv_path,created_at,updated_at"
            );


        if (error) {

            console.warn(
                "⚠️ No se pudieron cargar candidatos:",
                error
            );

            candidatosSeguimiento = [];

            return;
        }


        candidatosSeguimiento =
            Array.isArray(data)
                ? data
                : [];


        console.log(
            "👥 Candidatos para seguimiento:",
            candidatosSeguimiento.length
        );

    } catch (error) {

        console.warn(
            "⚠️ Error cargando candidatos:",
            error
        );

        candidatosSeguimiento = [];
    }
}


// ============================================================
// CANTIDAD DE CANDIDATOS POR REQUISICIÓN
// ============================================================

function contarCandidatos(requisicionId) {

    return candidatosSeguimiento.filter(
        candidato =>
            Number(candidato.requisicion_id) ===
            Number(requisicionId)
    ).length;
}

function obtenerResumenCandidatos(requisicionId) {
    const lista = candidatosSeguimiento.filter(c => Number(c.requisicion_id) === Number(requisicionId));
    const r = { total: lista.length, nuevos: 0, entrevistas: 0, evaluacion: 0, oferta: 0, contratados: 0, conCv: 0 };
    lista.forEach(c => {
        const e = String(c.estado || "").trim().toLowerCase();
        if (c.cv_path) r.conCv++;
        if (e === "nuevo" || e === "preselección" || e === "preseleccion") r.nuevos++;
        else if (e.includes("entrevista")) r.entrevistas++;
        else if (e.includes("evalu")) r.evaluacion++;
        else if (e.includes("oferta")) r.oferta++;
        else if (e.includes("contrat")) r.contratados++;
    });
    return r;
}

function abrirCandidatosRequisicion(id) {
    const requisicionId = Number(id);
    if (!Number.isInteger(requisicionId) || requisicionId <= 0) {
        mostrarMensaje("No se pudo identificar la requisición.", "error");
        return;
    }
    window.location.assign(`/candidatos.html?requisicion_id=${encodeURIComponent(requisicionId)}`);
}
window.abrirCandidatosRequisicion = abrirCandidatosRequisicion;


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

            return ![
                "Contratado",
                "Cerrado"
            ].includes(estado);
        }
    );
}


// ============================================================
// ACTUALIZAR CONTADOR
// ============================================================

function actualizarContador(cantidad) {

    const contador =
        $("contadorProcesos");


    if (!contador) {
        return;
    }


    contador.textContent =
        `${cantidad} ${
            cantidad === 1
                ? "ACTIVO"
                : "ACTIVOS"
        }`;
}


// ============================================================
// RENDER DE SEGUIMIENTO
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


    actualizarContador(
        procesos.length
    );


    if (!procesos.length) {

        container.innerHTML = `

            <div class="empty-state">

                <div class="empty-icon">

                    <i class="fa-solid fa-clipboard-check"></i>

                </div>

                <h3>
                    No hay procesos activos
                </h3>

                <p>
                    Las requisiciones activas aparecerán aquí
                    automáticamente.
                </p>

            </div>

        `;

        return;
    }


    container.innerHTML =
        procesos
            .map(
                requisicion =>
                    crearTarjetaSeguimiento(
                        requisicion
                    )
            )
            .join("");
}


// ============================================================
// CREAR TARJETA
// ============================================================

function crearTarjetaSeguimiento(req) {

    const id =
        Number(req.id);


    const estado =
        normalizarEstado(
            req.estado
        );


    const progreso =
        obtenerProgreso(
            estado
        );


    const candidatos =
        contarCandidatos(
            id
        );

    const resumenCandidatos =
        obtenerResumenCandidatos(
            id
        );


    const codigo =
        escaparHTML(
            texto(
                req.codigo,
                `R-${id}`
            )
        );


    const puesto =
        escaparHTML(
            texto(
                req.puesto,
                "Sin puesto"
            )
        );


    const tienda =
        escaparHTML(
            texto(
                req.tienda ||
                req.centro,
                "Sin ubicación"
            )
        );


    const centro =
        escaparHTML(
            texto(
                req.centro,
                ""
            )
        );


    const reclutador =
        escaparHTML(
            texto(
                req.reclutador,
                "Sin asignar"
            )
        );


    const prioridad =
        escaparHTML(
            texto(
                req.prioridad,
                "Normal"
            )
        );


    const fecha =
        formatearFecha(
            req.fecha ||
            req.created_at
        );


    const clasePrioridad =
        obtenerClasePrioridad(
            req.prioridad
        );


    const claseEstado =
        obtenerClaseEstado(
            estado
        );


    let ubicacion = tienda;


    if (
        centro &&
        centro !== "—" &&
        centro !== tienda
    ) {

        ubicacion =
            `${tienda} · ${centro}`;
    }


    return `

        <article
            class="seguimiento-card ${clasePrioridad}"
            data-requisicion-id="${id}"
        >

            <!-- CABECERA -->

            <div class="seguimiento-card-header">

                <div class="seguimiento-title">

                    <div class="codigo-puesto">

                        <strong>
                            ${codigo}
                        </strong>

                        <span class="separador">
                            -
                        </span>

                        <span>
                            ${puesto}
                        </span>

                    </div>


                    <div class="ubicacion">

                        <i class="fa-solid fa-store"></i>

                        <span>
                            ${ubicacion}
                        </span>

                    </div>

                </div>


                <div class="seguimiento-responsable">

                    <span
                        class="estado-badge ${claseEstado}"
                    >
                        ${escaparHTML(
                            estado.toUpperCase()
                        )}
                    </span>


                    <div class="reclutador">

                        <span class="mini-avatar">

                            ${escaparHTML(
                                obtenerIniciales(
                                    req.reclutador
                                )
                            )}

                        </span>

                        <span>
                            ${reclutador}
                        </span>

                    </div>

                </div>

            </div>


            <!-- PROGRESO -->

            <div class="seguimiento-progress">

                <div class="progress-label">

                    <span>
                        Progreso:
                    </span>

                    <strong>
                        ${progreso}%
                    </strong>

                </div>


                <div class="progress-track">

                    <div
                        class="progress-fill"
                        style="width:${progreso}%"
                    ></div>

                </div>

            </div>


            <!-- PIPELINE DE CANDIDATOS -->
            <div class="candidatos-resumen">
                <div class="candidatos-resumen-header">
                    <span><i class="fa-solid fa-user-group"></i> Pipeline de candidatos</span>
                    <strong>${resumenCandidatos.total}</strong>
                </div>
                <div class="candidatos-resumen-grid">
                    <span><b>${resumenCandidatos.nuevos}</b>Nuevos</span>
                    <span><b>${resumenCandidatos.entrevistas}</b>Entrevistas</span>
                    <span><b>${resumenCandidatos.evaluacion}</b>Evaluación</span>
                    <span><b>${resumenCandidatos.oferta}</b>Oferta</span>
                    <span><b>${resumenCandidatos.contratados}</b>Contratados</span>
                    <span><b>${resumenCandidatos.conCv}</b>Con CV</span>
                </div>
            </div>

            <!-- PIE -->

            <div class="seguimiento-card-footer">

                <div class="seguimiento-tags">


                    <span
                        class="estado-pill ${claseEstado}"
                    >

                        <i class="fa-regular fa-circle"></i>

                        ${escaparHTML(
                            estado.toUpperCase()
                        )}

                    </span>


                    <span>

                        <i class="fa-regular fa-calendar"></i>

                        ${escaparHTML(fecha)}

                    </span>


                    <span>

                        <i class="fa-solid fa-flag"></i>

                        ${prioridad}

                    </span>


                    <span>

                        <i class="fa-solid fa-users"></i>

                        ${candidatos}
                        ${
                            candidatos === 1
                                ? "candidato"
                                : "candidatos"
                        }

                    </span>

                </div>


                <!--
                    IMPORTANTE:
                    Este botón abre el HTML.
                    NUNCA abre administrar-requisicion.js.
                -->

                <div class="seguimiento-actions">
                    <button type="button" class="btn-candidatos" data-id="${id}">
                        <i class="fa-solid fa-users"></i>
                        Candidatos
                    </button>
                    <button type="button" class="btn-gestionar" data-id="${id}">
                        <i class="fa-solid fa-arrow-right"></i>
                        Gestionar
                    </button>
                </div>

            </div>

        </article>

    `;
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

        mostrarMensaje(
            "No se pudo identificar la requisición.",
            "error"
        );

        return;
    }


    /*
     * AQUÍ ESTÁ LA CORRECCIÓN PRINCIPAL.
     *
     * Abrimos:
     *
     * administrar-requisicion.html?id=2
     *
     * NO:
     *
     * js/administrar-requisicion.js
     */

    const destino =
        `/administrar-requisicion.html?id=${encodeURIComponent(
            requisicionId
        )}`;


    console.log(
        "🔗 Navegando a:",
        destino
    );


    window.location.assign(
        destino
    );
}


window.gestionarRequisicion =
    gestionarRequisicion;


// ============================================================
// EVENT DELEGATION
// ============================================================

function configurarEventosSeguimiento() {

    const container =
        $("seguimientoContainer");


    if (!container) {

        console.error(
            "❌ No existe seguimientoContainer"
        );

        return;
    }


    /*
     * Usamos delegación de eventos porque las tarjetas
     * se regeneran cada vez que llega un cambio Realtime.
     */

    container.addEventListener(
        "click",
        event => {

            const botonCandidatos = event.target.closest(".btn-candidatos");

            if (botonCandidatos) {
                event.preventDefault();
                event.stopPropagation();
                abrirCandidatosRequisicion(botonCandidatos.dataset.id);
                return;
            }

            const boton = event.target.closest(".btn-gestionar");

            if (!boton) {
                return;
            }

            event.preventDefault();
            event.stopPropagation();

            gestionarRequisicion(boton.dataset.id);
        }
    );


    console.log(
        "🖱️ Eventos de Seguimiento configurados"
    );
}


// ============================================================
// RECARGAR DATOS
// ============================================================

let temporizadorRecarga = null;


function programarRecarga() {

    clearTimeout(
        temporizadorRecarga
    );


    temporizadorRecarga =
        setTimeout(
            async () => {

                try {

                    await Promise.all([
                        cargarRequisiciones(),
                        cargarCandidatos()
                    ]);


                    renderSeguimiento();

                } catch (error) {

                    console.error(
                        "❌ Error actualizando seguimiento:",
                        error
                    );
                }

            },
            250
        );
}


// ============================================================
// REALTIME REQUISICIONES
// ============================================================

function iniciarRealtimeRequisiciones() {

    if (!supabaseSeguimiento) {
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
                "⚠️ Error eliminando canal anterior:",
                error
            );
        }
    }


    realtimeSeguimiento =
        supabaseSeguimiento
            .channel(
                `seguimiento-requisiciones-${Date.now()}`
            )
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "requisiciones"
                },
                payload => {

                    console.log(
                        "📡 Cambio requisición:",
                        payload.eventType,
                        payload.new || payload.old
                    );


                    programarRecarga();
                }
            )
            .subscribe(
                status => {

                    if (
                        status === "SUBSCRIBED"
                    ) {

                        console.log(
                            "📡 Realtime Seguimiento activo"
                        );
                    }
                }
            );
}


// ============================================================
// REALTIME CANDIDATOS
// ============================================================

function iniciarRealtimeCandidatos() {

    if (!supabaseSeguimiento) {
        return;
    }


    if (realtimeCandidatos) {

        try {

            supabaseSeguimiento
                .removeChannel(
                    realtimeCandidatos
                );

        } catch (error) {

            console.warn(
                "⚠️ Error eliminando realtime candidatos:",
                error
            );
        }
    }


    realtimeCandidatos =
        supabaseSeguimiento
            .channel(
                `seguimiento-candidatos-${Date.now()}`
            )
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "candidatos"
                },
                payload => {

                    console.log(
                        "👥 Cambio candidato:",
                        payload.eventType
                    );


                    programarRecarga();
                }
            )
            .subscribe(
                status => {

                    if (
                        status === "SUBSCRIBED"
                    ) {

                        console.log(
                            "📡 Realtime candidatos activo"
                        );
                    }
                }
            );
}


// ============================================================
// INICIAR REALTIME
// ============================================================

function iniciarRealtimeSeguimiento() {

    iniciarRealtimeRequisiciones();

    iniciarRealtimeCandidatos();
}


// ============================================================
// LIMPIAR REALTIME
// ============================================================

function limpiarRealtimeSeguimiento() {

    if (!supabaseSeguimiento) {
        return;
    }


    if (realtimeSeguimiento) {

        try {

            supabaseSeguimiento
                .removeChannel(
                    realtimeSeguimiento
                );

        } catch (error) {

            console.warn(error);
        }

        realtimeSeguimiento = null;
    }


    if (realtimeCandidatos) {

        try {

            supabaseSeguimiento
                .removeChannel(
                    realtimeCandidatos
                );

        } catch (error) {

            console.warn(error);
        }

        realtimeCandidatos = null;
    }
}


// ============================================================
// ESTADO DE ERROR
// ============================================================

function renderError(error) {

    const container =
        $("seguimientoContainer");


    if (!container) {
        return;
    }


    container.innerHTML = `

        <div class="empty-state error-state">

            <div class="empty-icon">

                <i class="fa-solid fa-triangle-exclamation"></i>

            </div>

            <h3>
                No se pudo cargar el seguimiento
            </h3>

            <p>
                ${escaparHTML(
                    error?.message ||
                    "Ocurrió un error inesperado."
                )}
            </p>

            <button
                type="button"
                class="btn-gestionar"
                id="btnReintentarSeguimiento"
            >

                <i class="fa-solid fa-rotate-right"></i>

                Reintentar

            </button>

        </div>

    `;


    $("btnReintentarSeguimiento")
        ?.addEventListener(
            "click",
            async () => {

                try {

                    await cargarDatosSeguimiento();

                } catch (errorRecarga) {

                    renderError(
                        errorRecarga
                    );
                }
            }
        );
}


// ============================================================
// CARGAR TODOS LOS DATOS
// ============================================================

async function cargarDatosSeguimiento() {

    await Promise.all([
        cargarRequisiciones(),
        cargarCandidatos()
    ]);


    renderSeguimiento();
}


// ============================================================
// ESPERAR AUTENTICACIÓN
// ============================================================

async function esperarAuth() {

    /*
     * Esperamos a que auth.js exponga el usuario autenticado.
     * No llamamos auth.getUser() desde este módulo.
     */

    for (let intento = 0; intento < 50; intento++) {

        const usuario =
            window.currentUser ||
            window.usuarioActual ||
            window.authUser ||
            null;

        const id =
            usuario?.id ||
            usuario?.user_id ||
            usuario?.uuid ||
            null;

        if (id) {
            return usuario;
        }

        await new Promise(
            resolve => setTimeout(resolve, 100)
        );
    }

    throw new Error(
        "No se pudo obtener el usuario autenticado desde auth.js."
    );
}


// ============================================================
// INICIALIZACIÓN
// ============================================================

async function iniciarSeguimiento() {

    if (seguimientoInicializado) {

        console.log(
            "ℹ️ Seguimiento ya estaba inicializado"
        );

        return;
    }


    seguimientoInicializado = true;


    console.log(
        "🚀 Inicializando Seguimiento Fase 4"
    );


    try {

        // ---------------------------------------------
        // SUPABASE
        // ---------------------------------------------

        supabaseSeguimiento =
            await obtenerClienteSupabase();


        console.log(
            "✅ Supabase disponible en Seguimiento"
        );


        // ---------------------------------------------
        // AUTH + USUARIO (FUENTE ÚNICA: auth.js)
        // ---------------------------------------------

        await esperarAuth();
        await cargarUsuarioSeguimiento();


        if (!validarPermisoSeguimiento()) {
            return;
        }


        // ---------------------------------------------
        // EVENTOS
        // ---------------------------------------------

        configurarEventosSeguimiento();


        // ---------------------------------------------
        // DATOS
        // ---------------------------------------------

        await cargarDatosSeguimiento();


        // ---------------------------------------------
        // REALTIME
        // ---------------------------------------------

        iniciarRealtimeSeguimiento();


        console.log(
            "✅ Seguimiento Fase 4 inicializado sin autenticación duplicada"
        );

    } catch (error) {

        seguimientoInicializado = false;


        console.error(
            "❌ Error inicializando Seguimiento:",
            error
        );


        renderError(error);


        mostrarMensaje(
            "No se pudo cargar el módulo de seguimiento.",
            "error"
        );
    }
}


// ============================================================
// DOM CONTENT LOADED
// ============================================================

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        console.log(
            "📋 DOMContentLoaded Seguimiento Fase 4"
        );


        try {

            await iniciarSeguimiento();

        } catch (error) {

            console.error(
                "❌ Error DOMContentLoaded Seguimiento:",
                error
            );
        }
    }
);


// ============================================================
// LIMPIEZA AL SALIR
// ============================================================

window.addEventListener(
    "beforeunload",
    () => {

        limpiarRealtimeSeguimiento();
    }
);


// ============================================================
// FUNCIONES PÚBLICAS
// ============================================================

window.recargarSeguimiento =
    async function () {

        try {

            await cargarDatosSeguimiento();

        } catch (error) {

            console.error(
                "❌ Error recargando Seguimiento:",
                error
            );
        }
    };


window.gestionarRequisicion =
    gestionarRequisicion;


console.log(
    "✅ seguimiento.js Fase 4 cargado"
);
