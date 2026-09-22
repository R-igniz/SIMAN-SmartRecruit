// ============================================================
// GESTIONAR REQUISICIÓN
// ============================================================

function gestionarRequisicion(id) {

    console.log("➡️ Solicitud para gestionar requisición:", id);

    const requisicionId = Number(id);

    if (
        !Number.isInteger(requisicionId) ||
        requisicionId <= 0
    ) {

        console.error(
            "❌ ID de requisición inválido:",
            id
        );

        return;
    }

    const url =
        `/administrar-requisicion.html?id=${encodeURIComponent(requisicionId)}`;

    console.log("🔗 Abriendo:", url);

    window.location.href = url;
}


// Disponible para botones generados dinámicamente
window.gestionarRequisicion = gestionarRequisicion;
