document.addEventListener("DOMContentLoaded", async function () {
    const $ = (id) => document.getElementById(id);

    try {
        const client = window.initSupabase
            ? await window.initSupabase()
            : await window.getSupabaseClient();

        const { data: { user }, error } = await client.auth.getUser();

        if (error || !user) {
            window.location.replace("/login.html");
            return;
        }

        const { data: profile, error: profileError } = await client
            .from("profiles")
            .select("requiere_cambio_password")
            .eq("id", user.id)
            .single();

        if (profileError) throw profileError;

        if (!profile?.requiere_cambio_password) {
            window.location.replace("/dashboard.html");
            return;
        }

        $("formCambio").addEventListener("submit", async function (event) {
            event.preventDefault();

            const nueva = $("nuevaPassword").value;
            const confirmar = $("confirmarPassword").value;
            const mensaje = $("mensaje");
            const submit = event.currentTarget.querySelector('button[type="submit"]');

            mensaje.textContent = "";

            if (nueva.length < 8) {
                mensaje.textContent = "La contraseña debe tener al menos 8 caracteres.";
                return;
            }

            if (nueva !== confirmar) {
                mensaje.textContent = "Las contraseñas no coinciden.";
                return;
            }

            if (submit) submit.disabled = true;

            try {
                const { error: passwordError } = await client.auth.updateUser({
                    password: nueva
                });

                if (passwordError) throw passwordError;

                /*
                 * FASE 4.1.3:
                 * El navegador YA NO hace UPDATE directo a profiles.
                 * La Edge Function valida la sesión y solo limpia
                 * requiere_cambio_password del usuario autenticado.
                 */
                const { data: result, error: functionError } =
                    await client.functions.invoke("admin-users", {
                        body: { action: "complete_password_change" }
                    });

                if (functionError) throw functionError;

                if (!result?.ok) {
                    throw new Error(
                        result?.error ||
                        "No se pudo finalizar el cambio obligatorio."
                    );
                }

                sessionStorage.removeItem("currentUser");
                sessionStorage.removeItem("siman_current_user");

                window.location.replace("/dashboard.html");

            } catch (changeError) {
                console.error("❌ Error cambio obligatorio:", changeError);
                mensaje.textContent =
                    "No se pudo finalizar el cambio de contraseña. " +
                    (changeError?.message || "Intenta nuevamente.");
                if (submit) submit.disabled = false;
            }
        });

    } catch (e) {
        console.error("❌ Error validando cambio obligatorio:", e);
        if ($("mensaje")) {
            $("mensaje").textContent =
                "No se pudo validar el cambio obligatorio.";
        }
    }
});
