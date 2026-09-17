// ==========================================
// SIMAN SMARTRECRUIT
// LOGIN
// ==========================================

document.addEventListener('DOMContentLoaded', async function () {

    console.log('🔐 Login - Inicializando...');

    // ==========================================
    // 1. OBTENER ELEMENTOS DEL LOGIN
    // ==========================================

    var form = document.getElementById('loginForm');
    var usernameInput = document.getElementById('username');
    var passwordInput = document.getElementById('password');

    // En tu HTML original se utilizan estos IDs
    var errorMsg = document.getElementById('errorMessage');
    var errorText = document.getElementById('errorText');

    // ==========================================
    // 2. VALIDAR ELEMENTOS
    // ==========================================

    if (!form) {
        console.error('❌ No se encontró el formulario #loginForm');
        return;
    }

    if (!usernameInput) {
        console.error('❌ No se encontró el campo #username');
        return;
    }

    if (!passwordInput) {
        console.error('❌ No se encontró el campo #password');
        return;
    }

    // Ocultar mensaje de error inicialmente
    if (errorMsg) {
        errorMsg.style.display = 'none';
    }

    if (errorText) {
        errorText.textContent = '';
    }

    // ==========================================
    // 3. COMPROBAR SESIÓN EXISTENTE
    // ==========================================

    try {

        if (
            typeof isAuthenticated === 'function' &&
            isAuthenticated()
        ) {

            console.log(
                '✅ Usuario ya autenticado, redirigiendo...'
            );

            window.location.href = '/dashboard.html';
            return;
        }

    } catch (error) {

        console.warn(
            '⚠️ No se pudo comprobar la sesión:',
            error
        );
    }

    // ==========================================
    // 4. INICIALIZAR SUPABASE
    // ==========================================

    if (typeof initSupabase === 'function') {

        try {

            console.log('🔄 Inicializando Supabase...');

            await initSupabase();

            console.log(
                '✅ Supabase inicializado para login'
            );

            // ==========================================
            // CARGAR USUARIOS
            // ==========================================

            if (typeof getUsers === 'function') {

                try {

                    var usuarios = await getUsers();

                    console.log(
                        '✅ Usuarios cargados para login:',
                        usuarios ? usuarios.length : 0
                    );

                } catch (errorUsuarios) {

                    console.warn(
                        '⚠️ No se pudieron cargar usuarios desde Supabase:',
                        errorUsuarios
                    );
                }
            }

        } catch (errorSupabase) {

            console.warn(
                '⚠️ Supabase no disponible. Se intentará utilizar el modo local.',
                errorSupabase
            );
        }

    } else {

        console.warn(
            '⚠️ initSupabase() no está disponible'
        );
    }

    // ==========================================
    // 5. FUNCIÓN MOSTRAR ERROR
    // ==========================================

    function mostrarError(mensaje) {

        console.warn('🔴 Login:', mensaje);

        if (errorText) {
            errorText.textContent = mensaje;
        }

        if (errorMsg) {
            errorMsg.style.display = 'block';
        }

        // Si el HTML no tiene contenedor de errores
        if (!errorMsg && !errorText) {
            alert(mensaje);
        }
    }

    // ==========================================
    // 6. FUNCIÓN OCULTAR ERROR
    // ==========================================

    function ocultarError() {

        if (errorMsg) {
            errorMsg.style.display = 'none';
        }

        if (errorText) {
            errorText.textContent = '';
        }
    }

    // ==========================================
    // 7. PROCESAR LOGIN
    // ==========================================

    async function procesarLogin() {

        ocultarError();

        // ==========================================
        // OBTENER CREDENCIALES
        // ==========================================

        var username = usernameInput.value.trim();
        var password = passwordInput.value.trim();

        // ==========================================
        // VALIDAR CAMPOS
        // ==========================================

        if (!username || !password) {

            mostrarError(
                '⚠️ Por favor ingrese usuario y contraseña.'
            );

            return;
        }

        console.log(
            '🔄 Intentando iniciar sesión con:',
            username
        );

        // ==========================================
        // BOTÓN LOGIN
        // ==========================================

        var submitBtn =
            form.querySelector(
                'button[type="submit"]'
            );

        var originalText = '';

        if (submitBtn) {

            originalText =
                submitBtn.innerHTML;

            submitBtn.innerHTML =
                '<i class="fas fa-spinner fa-spin"></i> Verificando...';

            submitBtn.disabled = true;
        }

        try {

            // ==========================================
            // VALIDAR auth.js
            // ==========================================

            if (typeof login !== 'function') {

                console.error(
                    '❌ La función login() no está disponible.'
                );

                mostrarError(
                    '❌ Error interno de autenticación.'
                );

                restaurarBoton(
                    submitBtn,
                    originalText
                );

                return;
            }

            // ==========================================
            // EJECUTAR LOGIN
            // ==========================================

            var user =
                await login(
                    username,
                    password
                );

            console.log(
                '🔍 Resultado login:',
                user
            );

            // ==========================================
            // LOGIN CORRECTO
            // ==========================================

            if (user) {

                console.log(
                    '✅ Login exitoso'
                );

                console.log(
                    '👤 Usuario:',
                    user.username || user.email || username
                );

                console.log(
                    '🔐 Rol:',
                    user.role || 'Sin rol'
                );

                ocultarError();

                // ==========================================
                // VERIFICAR SESIÓN
                // ==========================================

                if (
                    typeof getCurrentUser ===
                    'function'
                ) {

                    var currentUser =
                        getCurrentUser();

                    console.log(
                        '💾 Sesión creada:',
                        currentUser
                    );
                }

                // ==========================================
                // REDIRECCIONAR
                // ==========================================

                console.log(
                    '➡️ Redirigiendo al dashboard...'
                );

                window.location.href =
                    '/dashboard.html';

                return;
            }

            // ==========================================
            // LOGIN INCORRECTO
            // ==========================================

            console.warn(
                '❌ Login fallido'
            );

            mostrarError(
                '❌ Usuario o contraseña incorrectos. Verifique sus credenciales.'
            );

            restaurarBoton(
                submitBtn,
                originalText
            );

        } catch (error) {

            // ==========================================
            // ERROR LOGIN
            // ==========================================

            console.error(
                '❌ Error durante el login:',
                error
            );

            mostrarError(
                '❌ Error al iniciar sesión. Revise la conexión e intente nuevamente.'
            );

            restaurarBoton(
                submitBtn,
                originalText
            );
        }
    }

    // ==========================================
    // 8. RESTAURAR BOTÓN
    // ==========================================

    function restaurarBoton(
        boton,
        textoOriginal
    ) {

        if (!boton) {
            return;
        }

        boton.innerHTML =
            textoOriginal ||
            '<i class="fas fa-sign-in-alt"></i> Iniciar sesión';

        boton.disabled = false;
    }

    // ==========================================
    // 9. EVENTO SUBMIT
    // ==========================================

    form.addEventListener(
        'submit',
        async function (e) {

            e.preventDefault();

            await procesarLogin();
        }
    );

    // ==========================================
    // 10. LIMPIAR ERROR AL ESCRIBIR
    // ==========================================

    usernameInput.addEventListener(
        'input',
        function () {

            ocultarError();
        }
    );

    passwordInput.addEventListener(
        'input',
        function () {

            ocultarError();
        }
    );

    // ==========================================
    // 11. FINALIZAR
    // ==========================================

    console.log(
        '✅ Login - Inicialización completada'
    );

});