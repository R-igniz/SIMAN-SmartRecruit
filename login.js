// ============================================================
// SIMAN SMARTRECRUIT
// LOGIN.JS - SUPABASE AUTH
// ============================================================

document.addEventListener(
    'DOMContentLoaded',
    async function () {

        console.log(
            '🔐 Login - Inicializando...'
        );


        // ====================================================
        // ELEMENTOS
        // ====================================================

        var form =
            document.getElementById(
                'loginForm'
            );


        var errorMsg =
            document.getElementById(
                'errorMessage'
            );


        var errorText =
            document.getElementById(
                'errorText'
            );


        if (!form) {

            console.error(
                '❌ No se encontró #loginForm'
            );

            return;
        }


        if (errorMsg) {

            errorMsg.style.display =
                'none';
        }


        // ====================================================
        // VERIFICAR DEPENDENCIAS
        // ====================================================

        if (
            typeof initSupabase !==
            'function'
        ) {

            console.error(
                '❌ initSupabase no está disponible'
            );


            mostrarError(
                'No se pudo inicializar Supabase.'
            );


            return;
        }


        if (
            typeof window.login !==
            'function'
        ) {

            console.error(
                '❌ window.login no está disponible'
            );


            mostrarError(
                'El módulo de autenticación no está cargado.'
            );


            return;
        }


        // ====================================================
        // INICIALIZAR SUPABASE
        // ====================================================

        try {

            await initSupabase();


            console.log(
                '✅ Supabase inicializado para login'
            );


        } catch (error) {

            console.error(
                '❌ Error inicializando Supabase:',
                error
            );


            mostrarError(
                'No fue posible conectar con Supabase.'
            );


            return;
        }


        // ====================================================
        // SI YA EXISTE SESIÓN
        // ====================================================

        try {

            var client =
                await initSupabase();


            var resultadoSesion =
                await client.auth
                    .getSession();


            if (
                resultadoSesion.data &&
                resultadoSesion.data.session
            ) {

                console.log(
                    '🔐 Sesión Supabase encontrada'
                );


                var usuario =
                    await restaurarSesion();


                if (usuario) {

                    console.log(
                        '✅ Usuario ya autenticado:',
                        usuario.email
                    );


                    window.location.href =
                        '/dashboard.html';


                    return;
                }
            }


        } catch (error) {

            console.warn(
                '⚠️ No se pudo restaurar sesión:',
                error
            );
        }


        // ====================================================
        // SUBMIT
        // ====================================================

        form.addEventListener(
            'submit',
            async function (event) {

                event.preventDefault();


                ocultarError();


                var usernameElement =
                    document.getElementById(
                        'username'
                    );


                var passwordElement =
                    document.getElementById(
                        'password'
                    );


                var email =
                    usernameElement
                        ? usernameElement
                            .value
                            .trim()
                            .toLowerCase()
                        : '';


                var password =
                    passwordElement
                        ? passwordElement.value
                        : '';


                // --------------------------------------------
                // VALIDACIÓN
                // --------------------------------------------

                if (!email) {

                    mostrarError(
                        'Ingrese su correo electrónico.'
                    );

                    return;
                }


                if (!password) {

                    mostrarError(
                        'Ingrese su contraseña.'
                    );

                    return;
                }


                // --------------------------------------------
                // BOTÓN
                // --------------------------------------------

                var submitBtn =
                    form.querySelector(
                        'button[type="submit"]'
                    );


                var originalText =
                    submitBtn
                        ? submitBtn.innerHTML
                        : 'Ingresar';


                if (submitBtn) {

                    submitBtn.disabled =
                        true;


                    submitBtn.innerHTML =
                        '<i class="fas fa-spinner fa-spin"></i> Ingresando...';
                }


                try {

                    console.log(
                        '🔐 Intentando login:',
                        email
                    );


                    // IMPORTANTE:
                    // usamos window.login para garantizar
                    // que sea la función global de auth.js.

                    var usuario =
                        await window.login(
                            email,
                            password
                        );


                    console.log(
                        '🔍 Resultado login:',
                        usuario
                    );


                    if (!usuario) {

                        console.warn(
                            '❌ Login fallido'
                        );


                        mostrarError(
                            'Correo o contraseña incorrectos.'
                        );


                        restaurarBoton();


                        return;
                    }


                    console.log(
                        '✅ Login correcto:',
                        usuario.email,
                        '| Rol:',
                        usuario.role
                    );


                    // ----------------------------------------
                    // REDIRECCIÓN
                    // ----------------------------------------

                    window.location.href =
                        '/dashboard.html';


                } catch (error) {

                    console.error(
                        '❌ Error en login:',
                        error
                    );


                    mostrarError(
                        'No fue posible iniciar sesión.'
                    );


                    restaurarBoton();
                }


                function restaurarBoton() {

                    if (!submitBtn) {
                        return;
                    }


                    submitBtn.disabled =
                        false;


                    submitBtn.innerHTML =
                        originalText;
                }
            }
        );


        // ====================================================
        // ERROR
        // ====================================================

        function mostrarError(mensaje) {

            if (errorText) {

                errorText.textContent =
                    '❌ ' + mensaje;
            }


            if (errorMsg) {

                errorMsg.style.display =
                    'block';
            }


            console.warn(
                '🔐',
                mensaje
            );
        }


        function ocultarError() {

            if (errorMsg) {

                errorMsg.style.display =
                    'none';
            }
        }


        console.log(
            '✅ Login - Inicialización completada'
        );
    }
);
