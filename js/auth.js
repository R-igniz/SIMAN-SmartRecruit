// ============================================================
// SIMAN SMARTRECRUIT
// AUTH.JS - SUPABASE AUTH
// FASE 2
// ============================================================

console.log('🚀 Cargando Auth Supabase Fase 2...');


// ============================================================
// ROLES
// ============================================================

var ROLES = {
    ADMINISTRADOR: 'Administrador',
    GERENTE_RH: 'Gerente RH',
    RECLUTADORA: 'Reclutadora',
    EJECUTIVO: 'Ejecutivo'
};


// ============================================================
// PERMISOS
// ============================================================

var PERMISOS = {

    'Administrador': [
        'ver_dashboard',

        'crear_requisicion',
        'ver_requisiciones',
        'editar_requisicion',
        'eliminar_requisicion',
        'administrar_requisicion',

        'ver_reclutadora',

        'ver_vacantes',

        'ver_candidatos',
        'crear_candidato',
        'editar_candidato',
        'eliminar_candidato',

        'ver_seguimiento',

        'ver_reportes',

        'ver_dashboard_ejecutivo',

        'ver_usuarios',
        'crear_usuario',
        'editar_usuario',
        'eliminar_usuario',

        'ver_configuracion',

        'ver_notificaciones',

        'ver_ia',

        'ver_perfil'
    ],


    'Gerente RH': [
        'ver_dashboard',

        'crear_requisicion',
        'ver_requisiciones',
        'editar_requisicion',
        'administrar_requisicion',

        'ver_reclutadora',

        'ver_vacantes',

        'ver_candidatos',
        'crear_candidato',
        'editar_candidato',

        'ver_seguimiento',

        'ver_reportes',

        'ver_dashboard_ejecutivo',

        'ver_notificaciones',

        'ver_ia',

        'ver_perfil'
    ],


    'Reclutadora': [
        'ver_dashboard',

        'crear_requisicion',
        'ver_requisiciones',
        'editar_requisicion',
        'administrar_requisicion',

        'ver_reclutadora',

        'ver_vacantes',

        'ver_candidatos',
        'crear_candidato',
        'editar_candidato',

        'ver_seguimiento',

        'ver_notificaciones',

        'ver_ia',

        'ver_perfil'
    ],


    'Ejecutivo': [
        'ver_dashboard',

        'ver_requisiciones',

        'ver_vacantes',

        'ver_candidatos',

        'ver_seguimiento',

        'ver_reportes',

        'ver_dashboard_ejecutivo',

        'ver_notificaciones',

        'ver_ia',

        'ver_perfil'
    ]
};


// ============================================================
// CONVERTIR ROLE_CODE DE SUPABASE
// ============================================================

function roleCodeToRole(roleCode) {

    var roles = {
        admin: 'Administrador',
        administrador: 'Administrador',

        gerente_rh: 'Gerente RH',
        gerente: 'Gerente RH',

        reclutadora: 'Reclutadora',

        ejecutivo: 'Ejecutivo'
    };


    if (!roleCode) {
        return null;
    }


    var codigo =
        String(roleCode)
            .trim()
            .toLowerCase();


    return roles[codigo] || null;
}


// ============================================================
// OBTENER PERFIL DESDE SUPABASE
// ============================================================

async function obtenerPerfilSupabase(authUser) {

    if (!authUser || !authUser.id) {

        console.warn(
            '⚠️ obtenerPerfilSupabase sin usuario'
        );

        return null;
    }


    try {

        var client =
            await initSupabase();


        var resultado =
            await client
                .from('profiles')
                .select(
                    'id,email,nombre,role_code,activo'
                )
                .eq(
                    'id',
                    authUser.id
                )
                .single();


        if (resultado.error) {

            console.error(
                '❌ Error obteniendo profile:',
                resultado.error
            );

            return null;
        }


        var profile =
            resultado.data;


        if (!profile) {

            console.error(
                '❌ Profile no encontrado'
            );

            return null;
        }


        if (profile.activo === false) {

            console.warn(
                '⛔ Usuario desactivado:',
                profile.email
            );

            return null;
        }


        var role =
            roleCodeToRole(
                profile.role_code
            );


        if (!role) {

            console.error(
                '❌ role_code desconocido:',
                profile.role_code
            );

            return null;
        }


        // ------------------------------------
        // OBJETO COMPATIBLE CON SISTEMA VIEJO
        // ------------------------------------

        var usuario = {

            id:
                profile.id,

            auth_id:
                authUser.id,

            username:
                profile.email,

            email:
                profile.email,

            name:
                profile.nombre,

            nombre:
                profile.nombre,

            role:
                role,

            role_code:
                profile.role_code,

            activo:
                profile.activo,

            estado:
                profile.activo
                    ? 'activo'
                    : 'inactivo',

            store:
                'Central'
        };


        return usuario;


    } catch (error) {

        console.error(
            '❌ Error obteniendo perfil:',
            error
        );

        return null;
    }
}


// ============================================================
// LOGIN
// ============================================================

async function login(email, password) {

    console.log(
        '🔐 Iniciando sesión mediante Supabase Auth:',
        email
    );


    try {

        if (!email || !password) {

            console.warn(
                '⚠️ Correo o contraseña vacíos'
            );

            return null;
        }


        var client =
            await initSupabase();


        var resultado =
            await client.auth
                .signInWithPassword({

                    email:
                        String(email)
                            .trim()
                            .toLowerCase(),

                    password:
                        password
                });


        if (resultado.error) {

            console.error(
                '❌ Supabase Auth:',
                resultado.error.message
            );

            return null;
        }


        if (
            !resultado.data ||
            !resultado.data.user
        ) {

            console.error(
                '❌ Supabase no devolvió usuario'
            );

            return null;
        }


        var usuario =
            await obtenerPerfilSupabase(
                resultado.data.user
            );


        if (!usuario) {

            console.error(
                '❌ No existe profile válido'
            );


            await client.auth.signOut();


            sessionStorage.removeItem(
                'currentUser'
            );


            return null;
        }


        // ------------------------------------
        // CACHE PARA COMPATIBILIDAD FRONTEND
        // ------------------------------------

        sessionStorage.setItem(
            'currentUser',
            JSON.stringify(usuario)
        );


        console.log(
            '✅ Login Supabase:',
            usuario.email,
            '| Rol:',
            usuario.role,
            '| UUID:',
            usuario.id
        );


        return usuario;


    } catch (error) {

        console.error(
            '❌ Error durante login:',
            error
        );

        return null;
    }
}


// ============================================================
// RESTAURAR SESIÓN
// ============================================================

async function restaurarSesion() {

    try {

        var client =
            await initSupabase();


        var resultado =
            await client.auth
                .getSession();


        if (resultado.error) {

            console.error(
                '❌ Error obteniendo sesión:',
                resultado.error
            );

            sessionStorage.removeItem(
                'currentUser'
            );

            return null;
        }


        if (
            !resultado.data ||
            !resultado.data.session ||
            !resultado.data.session.user
        ) {

            sessionStorage.removeItem(
                'currentUser'
            );

            return null;
        }


        var authUser =
            resultado.data.session.user;


        var usuario =
            await obtenerPerfilSupabase(
                authUser
            );


        if (!usuario) {

            console.warn(
                '⚠️ Sesión sin perfil válido'
            );


            await client.auth.signOut();


            sessionStorage.removeItem(
                'currentUser'
            );


            return null;
        }


        sessionStorage.setItem(
            'currentUser',
            JSON.stringify(usuario)
        );


        return usuario;


    } catch (error) {

        console.error(
            '❌ Error restaurando sesión:',
            error
        );


        sessionStorage.removeItem(
            'currentUser'
        );


        return null;
    }
}


// ============================================================
// USUARIO ACTUAL
// ============================================================

function getCurrentUser() {

    try {

        var datos =
            sessionStorage.getItem(
                'currentUser'
            );


        if (!datos) {
            return null;
        }


        return JSON.parse(datos);


    } catch (error) {

        console.error(
            '❌ Error leyendo currentUser:',
            error
        );


        sessionStorage.removeItem(
            'currentUser'
        );


        return null;
    }
}


// ============================================================
// OBTENER SESIÓN REAL
// ============================================================

async function getAuthSession() {

    try {

        var client =
            await initSupabase();


        var resultado =
            await client.auth
                .getSession();


        if (resultado.error) {

            console.error(
                '❌ Error getAuthSession:',
                resultado.error
            );

            return null;
        }


        return (
            resultado.data &&
            resultado.data.session
        )
            ? resultado.data.session
            : null;


    } catch (error) {

        console.error(
            '❌ Error getAuthSession:',
            error
        );

        return null;
    }
}


// ============================================================
// IS AUTHENTICATED
// ============================================================

function isAuthenticated() {

    return (
        getCurrentUser() !== null
    );
}


// ============================================================
// REQUIRE AUTH
// ============================================================

async function requireAuth() {

    var usuario =
        await restaurarSesion();


    if (!usuario) {

        console.warn(
            '🔒 Usuario no autenticado'
        );


        window.location.href =
            '/login.html';


        return null;
    }


    return usuario;
}


// ============================================================
// LOGOUT
// ============================================================

async function logout() {

    console.log(
        '🚪 Cerrando sesión...'
    );


    try {

        var client =
            await initSupabase();


        await client.auth.signOut();


    } catch (error) {

        console.error(
            '⚠️ Error cerrando sesión:',
            error
        );


    } finally {

        sessionStorage.removeItem(
            'currentUser'
        );


        window.location.href =
            '/login.html';
    }
}


// ============================================================
// PERMISOS
// ============================================================

function tienePermiso(permiso) {

    var usuario =
        getCurrentUser();


    if (!usuario) {

        console.warn(
            '⚠️ No hay usuario autenticado'
        );

        return false;
    }


    if (!permiso) {

        return true;
    }


    var permisosRol =
        PERMISOS[usuario.role] ||
        [];


    var permitido =
        permisosRol.indexOf(
            permiso
        ) !== -1;


    console.log(
        '🔍 Permiso:',
        permiso,
        '| Rol:',
        usuario.role,
        '=>',
        permitido
    );


    return permitido;
}


// ============================================================
// ROLES
// ============================================================

function tieneRol(rol) {

    var usuario =
        getCurrentUser();


    return !!(
        usuario &&
        usuario.role === rol
    );
}


function esAdministrador() {

    return tieneRol(
        'Administrador'
    );
}


// ============================================================
// PROTEGER RUTA MANUAL
// ============================================================

function protegerRuta(
    permiso,
    redirectUrl
) {

    var usuario =
        getCurrentUser();


    if (!usuario) {

        window.location.href =
            '/login.html';

        return false;
    }


    if (
        permiso &&
        !tienePermiso(permiso)
    ) {

        console.warn(
            '⛔ Acceso denegado:',
            permiso
        );


        window.location.href =
            redirectUrl ||
            '/dashboard.html';


        return false;
    }


    return true;
}


// ============================================================
// MAPA DE PÁGINAS
// ============================================================

var permisosPorPagina = {

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

    '/perfil.html':
        'ver_perfil'
};


// ============================================================
// NORMALIZAR RUTA
// ============================================================

function normalizarRuta(pathname) {

    var ruta =
        pathname || '/';


    ruta =
        ruta
            .split('?')[0]
            .split('#')[0]
            .toLowerCase();


    if (
        ruta.length > 1 &&
        ruta.endsWith('/')
    ) {

        ruta =
            ruta.slice(
                0,
                -1
            );
    }


    return ruta;
}


// ============================================================
// INICIALIZAR AUTH DE PÁGINA
// ============================================================

async function inicializarAuth() {

    var pagina =
        normalizarRuta(
            window.location.pathname
        );


    console.log(
        '🔐 Inicializando Auth para:',
        pagina
    );


    // --------------------------------------
    // LOGIN
    // --------------------------------------

    if (
        pagina === '/' ||
        pagina === '/login.html'
    ) {

        return;
    }


    try {

        // ----------------------------------
        // RESTAURAR SESIÓN REAL
        // ----------------------------------

        var usuario =
            await restaurarSesion();


        if (!usuario) {

            console.warn(
                '🔒 No existe sesión Supabase'
            );


            window.location.href =
                '/login.html';


            return;
        }


        console.log(
            '👤 Usuario:',
            usuario.email,
            '| Rol:',
            usuario.role,
            '| UUID:',
            usuario.id
        );


        // ----------------------------------
        // OBTENER PERMISO
        // ----------------------------------

        var tieneRuta =
            Object.prototype
                .hasOwnProperty
                .call(
                    permisosPorPagina,
                    pagina
                );


        if (!tieneRuta) {

            console.warn(
                '⚠️ Página no registrada:',
                pagina
            );


            /*
             * No redireccionamos.
             * La página requiere sesión válida,
             * pero no tiene permiso específico.
             */

            console.log(
                '✅ Usuario autenticado. Página permitida.'
            );


            return;
        }


        var permiso =
            permisosPorPagina[
                pagina
            ];


        console.log(
            '📄 Página:',
            pagina,
            '| Permiso requerido:',
            permiso
        );


        // ----------------------------------
        // VALIDAR PERMISO
        // ----------------------------------

        if (
            permiso &&
            !tienePermiso(
                permiso
            )
        ) {

            console.warn(
                '⛔ Acceso denegado:',
                pagina,
                '| Rol:',
                usuario.role,
                '| Permiso:',
                permiso
            );


            window.location.href =
                '/dashboard.html';


            return;
        }


        console.log(
            '✅ Acceso permitido:',
            pagina
        );


    } catch (error) {

        console.error(
            '❌ Error inicializando Auth:',
            error
        );


        window.location.href =
            '/login.html';
    }
}


// ============================================================
// LISTENER DE SUPABASE AUTH
// ============================================================

var authListenerInicializado =
    false;


async function escucharCambiosAuth() {

    if (authListenerInicializado) {

        return;
    }


    authListenerInicializado =
        true;


    try {

        var client =
            await initSupabase();


        client.auth.onAuthStateChange(
            function (
                event,
                session
            ) {

                console.log(
                    '🔐 Auth event:',
                    event
                );


                if (
                    event ===
                    'SIGNED_OUT'
                ) {

                    sessionStorage.removeItem(
                        'currentUser'
                    );

                    return;
                }


                if (
                    event ===
                    'TOKEN_REFRESHED'
                ) {

                    console.log(
                        '🔄 Token Supabase renovado'
                    );
                }


                if (
                    event ===
                    'SIGNED_IN' &&
                    session &&
                    session.user
                ) {

                    console.log(
                        '✅ Sesión Supabase activa:',
                        session.user.email
                    );
                }
            }
        );


    } catch (error) {

        authListenerInicializado =
            false;


        console.error(
            '⚠️ No se pudo iniciar listener Auth:',
            error
        );
    }
}


// ============================================================
// REFRESCAR USUARIO
// ============================================================

async function refreshAuthUsers() {

    return await restaurarSesion();
}


// ============================================================
// EXPONER FUNCIONES GLOBALMENTE
// ============================================================

window.login =
    login;

window.logout =
    logout;

window.getCurrentUser =
    getCurrentUser;

window.getAuthSession =
    getAuthSession;

window.restaurarSesion =
    restaurarSesion;

window.isAuthenticated =
    isAuthenticated;

window.requireAuth =
    requireAuth;

window.refreshAuthUsers =
    refreshAuthUsers;

window.tienePermiso =
    tienePermiso;

window.tieneRol =
    tieneRol;

window.esAdministrador =
    esAdministrador;

window.protegerRuta =
    protegerRuta;

window.roleCodeToRole =
    roleCodeToRole;

window.obtenerPerfilSupabase =
    obtenerPerfilSupabase;

window.inicializarAuth =
    inicializarAuth;

window.PERMISOS =
    PERMISOS;

window.ROLES =
    ROLES;

window.permisosPorPagina =
    permisosPorPagina;


// ============================================================
// ARRANQUE
// ============================================================

document.addEventListener(
    'DOMContentLoaded',
    async function () {

        await escucharCambiosAuth();

        await inicializarAuth();
    }
);


console.log(
    '✅ Auth Supabase Fase 2 cargado'
);
