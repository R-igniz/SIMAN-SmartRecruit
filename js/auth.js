// ==========================================
// SMARTRECRUIT - AUTH SUPABASE
// FASE 2
// ==========================================

var ROLES = {
    ADMINISTRADOR: 'Administrador',
    GERENTE_RH: 'Gerente RH',
    RECLUTADORA: 'Reclutadora',
    EJECUTIVO: 'Ejecutivo'
};

var PERMISOS = {
    'Administrador': [
        'ver_dashboard',
        'ver_configuracion',
        'ver_usuarios',
        'crear_usuario',
        'editar_usuario',
        'eliminar_usuario',
        'ver_roles',
        'crear_rol',
        'editar_rol',
        'eliminar_rol',
        'ver_reportes',
        'ver_dashboard_ejecutivo',
        'ver_notificaciones',
        'ver_ia',
        'crear_requisicion',
        'ver_requisiciones',
        'editar_requisicion',
        'eliminar_requisicion',
        'ver_reclutadora',
        'administrar_requisicion',
        'ver_vacantes',
        'ver_candidatos',
        'ver_seguimiento'
    ],

    'Gerente RH': [
        'ver_dashboard',
        'crear_requisicion',
        'ver_requisiciones',
        'editar_requisicion',
        'ver_reportes',
        'ver_notificaciones',
        'ver_ia',
        'ver_reclutadora',
        'administrar_requisicion',
        'ver_vacantes',
        'ver_candidatos',
        'ver_seguimiento'
    ],

    'Reclutadora': [
        'ver_dashboard',
        'crear_requisicion',
        'ver_requisiciones',
        'ver_reclutadora',
        'administrar_requisicion',
        'ver_notificaciones',
        'ver_ia',
        'ver_vacantes',
        'ver_candidatos',
        'ver_seguimiento'
    ],

    'Ejecutivo': [
        'ver_dashboard',
        'ver_dashboard_ejecutivo',
        'ver_reportes',
        'ver_requisiciones',
        'ver_notificaciones',
        'ver_ia',
        'ver_vacantes',
        'ver_candidatos',
        'ver_seguimiento'
    ]
};


// ==========================================
// CONVERTIR role_code DE SUPABASE
// ==========================================

function roleCodeToRole(roleCode) {

    var mapa = {
        'admin': 'Administrador',
        'gerente_rh': 'Gerente RH',
        'reclutadora': 'Reclutadora',
        'ejecutivo': 'Ejecutivo'
    };

    return mapa[roleCode] || 'Reclutadora';
}


// ==========================================
// OBTENER PERFIL
// ==========================================

async function obtenerPerfilSupabase(user) {

    if (!user) return null;

    var client = await initSupabase();

    var result = await client
        .from('profiles')
        .select('id,email,nombre,role_code,activo')
        .eq('id', user.id)
        .single();

    if (result.error) {

        console.error(
            '❌ Error obteniendo profile:',
            result.error
        );

        return null;
    }

    var profile = result.data;

    if (!profile || profile.activo === false) {

        console.warn('⛔ Usuario inactivo');

        return null;
    }

    return {
        id: profile.id,

        // Compatibilidad con código anterior
        username: profile.email,
        email: profile.email,

        name: profile.nombre,
        nombre: profile.nombre,

        role: roleCodeToRole(profile.role_code),
        role_code: profile.role_code,

        store: 'Central',

        estado: 'activo',

        // Referencia al usuario real de Auth
        auth_id: user.id
    };
}


// ==========================================
// LOGIN SUPABASE AUTH
// ==========================================

async function login(email, password) {

    console.log(
        '🔐 Iniciando sesión mediante Supabase Auth:',
        email
    );

    try {

        var client = await initSupabase();

        var result = await client.auth.signInWithPassword({
            email: email,
            password: password
        });

        if (result.error) {

            console.error(
                '❌ Supabase Auth:',
                result.error.message
            );

            return null;
        }

        if (!result.data || !result.data.user) {

            console.error(
                '❌ Supabase no devolvió usuario'
            );

            return null;
        }

        var profile =
            await obtenerPerfilSupabase(
                result.data.user
            );

        if (!profile) {

            console.error(
                '❌ No existe profile válido'
            );

            await client.auth.signOut();

            return null;
        }

        /*
         * sessionStorage ya NO autentica.
         *
         * Solamente conservamos una copia del profile
         * para mantener compatibilidad con los módulos
         * existentes durante la migración.
         */

        sessionStorage.setItem(
            'currentUser',
            JSON.stringify(profile)
        );

        console.log(
            '✅ Login Supabase:',
            profile.email,
            '| Rol:',
            profile.role
        );

        return profile;

    } catch (error) {

        console.error(
            '❌ Error durante login:',
            error
        );

        return null;
    }
}


// ==========================================
// RESTAURAR SESIÓN SUPABASE
// ==========================================

async function restaurarSesion() {

    try {

        var client = await initSupabase();

        var result =
            await client.auth.getSession();

        if (
            result.error ||
            !result.data ||
            !result.data.session
        ) {

            sessionStorage.removeItem(
                'currentUser'
            );

            return null;
        }

        var authUser =
            result.data.session.user;

        var profile =
            await obtenerPerfilSupabase(
                authUser
            );

        if (!profile) {

            await client.auth.signOut();

            sessionStorage.removeItem(
                'currentUser'
            );

            return null;
        }

        sessionStorage.setItem(
            'currentUser',
            JSON.stringify(profile)
        );

        return profile;

    } catch (error) {

        console.error(
            '❌ Error restaurando sesión:',
            error
        );

        return null;
    }
}


// ==========================================
// USUARIO ACTUAL
// ==========================================

function getCurrentUser() {

    try {

        var data =
            sessionStorage.getItem(
                'currentUser'
            );

        if (!data) return null;

        return JSON.parse(data);

    } catch (error) {

        console.error(
            '❌ Error leyendo currentUser:',
            error
        );

        return null;
    }
}


// ==========================================
// SESIÓN REAL
// ==========================================

async function getAuthSession() {

    try {

        var client = await initSupabase();

        var result =
            await client.auth.getSession();

        return (
            result.data &&
            result.data.session
        ) || null;

    } catch (error) {

        return null;
    }
}


// ==========================================
// AUTENTICACIÓN
// ==========================================

function isAuthenticated() {

    /*
     * Compatibilidad síncrona para módulos
     * existentes.
     *
     * La seguridad real está en Supabase Auth
     * y posteriormente en RLS.
     */

    return getCurrentUser() !== null;
}


// ==========================================
// LOGOUT
// ==========================================

async function logout() {

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


// ==========================================
// PERMISOS
// ==========================================

function tienePermiso(permiso) {

    var user =
        getCurrentUser();

    if (!user) {

        console.warn(
            '⚠️ No hay usuario autenticado'
        );

        return false;
    }

    var permisos =
        PERMISOS[user.role] || [];

    var permitido =
        permisos.indexOf(permiso) !== -1;

    console.log(
        '🔍 Permiso:',
        permiso,
        '| Rol:',
        user.role,
        '=>',
        permitido
    );

    return permitido;
}


function tieneRol(rol) {

    var user =
        getCurrentUser();

    return (
        user &&
        user.role === rol
    );
}


function esAdministrador() {

    return tieneRol(
        'Administrador'
    );
}


// ==========================================
// PROTEGER RUTA
// ==========================================

function protegerRuta(
    permiso,
    redirectUrl
) {

    var user =
        getCurrentUser();

    if (!user) {

        window.location.href =
            '/login.html';

        return false;
    }

    if (
        permiso &&
        !tienePermiso(permiso)
    ) {

        console.warn(
            '🔒 Acceso denegado:',
            window.location.pathname
        );

        window.location.href =
            redirectUrl ||
            '/dashboard.html';

        return false;
    }

    return true;
}


// ==========================================
// MAPA DE PÁGINAS
// ==========================================

var permisosPorPagina = {

    '/configuracion':
        'ver_configuracion',

    '/configuracion.html':
        'ver_configuracion',

    '/dashboard-ejecutivo':
        'ver_dashboard_ejecutivo',

    '/dashboard-ejecutivo.html':
        'ver_dashboard_ejecutivo',

    '/reportes':
        'ver_reportes',

    '/reportes.html':
        'ver_reportes',

    '/usuarios':
        'ver_usuarios',

    '/usuarios.html':
        'ver_usuarios',

    '/nueva-requisicion':
        'crear_requisicion',

    '/nueva-requisicion.html':
        'crear_requisicion',

    '/reclutadora':
        'ver_reclutadora',

    '/reclutadora.html':
        'ver_reclutadora',

    '/administrar-requisicion':
        'administrar_requisicion',

    '/administrar-requisicion.html':
        'administrar_requisicion',

    '/vacantes':
        'ver_vacantes',

    '/vacantes.html':
        'ver_vacantes',

    '/candidatos':
        'ver_candidatos',

    '/candidatos.html':
        'ver_candidatos',

    '/seguimiento':
        'ver_seguimiento',

    '/seguimiento.html':
        'ver_seguimiento',

    '/requisiciones':
        'ver_requisiciones',

    '/requisiciones.html':
        'ver_requisiciones',

    '/ia':
        'ver_ia',

    '/ia.html':
        'ver_ia',

    '/notificaciones':
        'ver_notificaciones',

    '/notificaciones.html':
        'ver_notificaciones'
};


// ==========================================
// INICIALIZAR AUTENTICACIÓN
// ==========================================

async function inicializarAuth() {

    var pagina =
        window.location.pathname;

    /*
     * login.js administra login.html
     */

    if (
        pagina === '/' ||
        pagina.includes('login.html')
    ) {

        return;
    }

    var user =
        await restaurarSesion();

    if (!user) {

        console.warn(
            '🔒 No existe sesión Supabase'
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

    var permiso =
        permisosPorPagina[pagina];

    if (
        permiso &&
        !tienePermiso(permiso)
    ) {

        console.warn(
            '⛔ Sin permiso:',
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
}


// ==========================================
// CAMBIOS DE SESIÓN
// ==========================================

async function escucharCambiosAuth() {

    try {

        var client =
            await initSupabase();

        client.auth.onAuthStateChange(
            function(event, session) {

                console.log(
                    '🔐 Auth event:',
                    event
                );

                if (
                    event === 'SIGNED_OUT'
                ) {

                    sessionStorage.removeItem(
                        'currentUser'
                    );
                }
            }
        );

    } catch (error) {

        console.warn(
            '⚠️ Listener Auth no disponible'
        );
    }
}


// ==========================================
// COMPATIBILIDAD TEMPORAL
// ==========================================

async function requireAuth() {

    var user =
        await restaurarSesion();

    if (!user) {

        window.location.href =
            '/login.html';

        return null;
    }

    return user;
}


async function refreshAuthUsers() {

    return restaurarSesion();
}


// ==========================================
// EXPORTAR
// ==========================================

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

window.PERMISOS =
    PERMISOS;

window.ROLES =
    ROLES;

window.roleCodeToRole =
    roleCodeToRole;


// ==========================================
// ARRANQUE
// ==========================================

document.addEventListener(
    'DOMContentLoaded',
    function() {

        inicializarAuth();

        escucharCambiosAuth();
    }
);

console.log(
    '✅ Auth Supabase Fase 2 cargado'
);