// ============================================================
// SIMAN SMARTRECRUIT - NOTIFICATIONS HELPER FASE 4
// Funciones UI compartidas. Persistencia en Supabase.
// ============================================================
(function () {
  function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, c => ({
      "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
    }[c]));
  }

  function notify(message, type="info") {
    if (typeof window.mostrarNotificacion === "function" &&
        window.mostrarNotificacion !== notify) {
      return window.mostrarNotificacion(message, type);
    }
    console.log(`[${String(type).toUpperCase()}] ${message}`);
  }

  window.SmartRecruitNotifications = { escapeHTML, notify };
  console.log("🔔 notifications.js Fase 4 cargado");
})();