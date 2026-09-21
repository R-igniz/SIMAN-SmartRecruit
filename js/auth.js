async function inicializarAuth() {

    var pagina = window.location.pathname;

    console.log(
        '🔐 Inicializando Auth para:',
        pagina
    );

    // Login no necesita protección
    if (
        pagina === '/' ||
        pagina === '/login.html' ||
        pagina.endsWith('/login.html')
    ) {
        return;
    }

    try {

        // =====================================
        // 1. RESTAURAR SESIÓN REAL DE SUPABASE
        // =====================================

        var user = await restaurarSesion();

        if (!user) {

            console.warn(
                '🔒 No existe sesión válida de Supabase'
            );

            window.location.href =
                '/login.html';

            return;
        }

        console.log(
            '👤 Usuario:',
            user.email,
            '| Rol:',
            user.role,
            '| UUID:',
            user.id
        );


        // =====================================
        // 2. NORMALIZAR RUTA
        // =====================================

        var ruta =
            pagina
                .toLowerCase()
                .replace(/\/+$/, '');

        if (!ruta) {
            ruta = '/dashboard.html';
        }


        // =====================================
        // 3. MAPA COMPLETO
        // =====================================

        var mapaPermisos = {

            '/dashboard.html':
                'ver_dashboard',

            '/nueva-requisicion.html':
                'crear_requisicion',

            '/requisiciones.html':
                'ver_requisiciones',

            '/detalle-requisicion.html':
                'ver_requisiciones',

            '/administrar-requisicion.html':
                'administrar_requisicion',

            '/reclutadora.html':
                'ver_reclutadora',

            '/vacantes.html':
                'ver_vacantes',

            '/candidatos.html':
                'ver_candidatos',

            '/seguimiento.html':
                'ver_seguimiento',

            '/reportes.html':
                'ver_reportes',

            '/dashboard-ejecutivo.html':
                'ver_dashboard_ejecutivo',

            '/usuarios.html':
                'ver_usuarios',

            '/configuracion.html':
                'ver_configuracion',

            '/notificaciones.html':
                'ver_notificaciones',

            '/ia.html':
                'ver_ia',

            // Perfil requiere únicamente sesión válida
            '/perfil.html':
                null
        };


        // =====================================
        // 4. OBTENER PERMISO
        // =====================================

        var permiso =
            Object.prototype.hasOwnProperty.call(
                mapaPermisos,
                ruta
            )
                ? mapaPermisos[ruta]
                : undefined;


        console.log(
            '📄 Ruta:',
            ruta,
            '| Permiso requerido:',
            permiso
        );


        // =====================================
        // 5. PÁGINA SIN MAPEAR
        // =====================================

        if (permiso === undefined) {

            console.warn(
                '⚠️ Página no registrada en mapa:',
                ruta
            );

            /*
             * IMPORTANTE:
             * No redirigimos automáticamente.
             * Así una página nueva no queda inutilizable
             * solamente por faltar en el mapa.
             */

            return;
        }


        // =====================================
        // 6. PERFIL / PÁGINAS SOLO AUTENTICADAS
        // =====================================

        if (permiso === null) {

            console.log(
                '✅ Página disponible para usuario autenticado:',
                ruta
            );

            return;
        }


        // =====================================
        // 7. VALIDAR PERMISO
        // =====================================

        if (!tienePermiso(permiso)) {

            console.warn(
                '⛔ Acceso denegado:',
                ruta,
                '| Permiso:',
                permiso,
                '| Rol:',
                user.role
            );

            window.location.href =
                '/dashboard.html';

            return;
        }


        console.log(
            '✅ Acceso permitido:',
            ruta
        );


    } catch (error) {

        console.error(
            '❌ Error inicializando Auth:',
            error
        );

        /*
         * No mandamos al dashboard ante cualquier
         * excepción porque ocultaría el error real.
         */

        window.location.href =
            '/login.html';
    }
}
