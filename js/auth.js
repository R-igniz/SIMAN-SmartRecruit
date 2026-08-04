// ==========================================
// AUTH - ROLES Y PERMISOS
// ==========================================

var ROLES = {
    ADMINISTRADOR: 'Administrador',
    GERENTE_RH: 'Gerente RH',
    RECLUTADORA: 'Reclutadora',
    EJECUTIVO: 'Ejecutivo'
};

var PERMISOS = {
    'Administrador': [
        'ver_dashboard', 'ver_configuracion', 'ver_usuarios', 'crear_usuario',
        'editar_usuario', 'eliminar_usuario', 'ver_roles', 'crear_rol',
        'editar_rol', 'eliminar_rol', 'ver_reportes', 'ver_dashboard_ejecutivo',
        'ver_notificaciones', 'ver_ia', 'crear_requisicion', 'ver_requisiciones',
        'editar_requisicion', 'eliminar_requisicion', 'ver_reclutadora',
        'administrar_requisicion', 'ver_vacantes', 'ver_seguimiento'
    ],
    'Gerente RH': [
        'ver_dashboard', 'crear_requisicion', 'ver_requisiciones',
        'editar_requisicion', 'ver_reportes', 'ver_notificaciones', 'ver_ia',
        'ver_reclutadora', 'administrar_requisicion', 'ver_vacantes',
        'ver_seguimiento'
    ],
    'Reclutadora': [
        'ver_dashboard', 'ver_requisiciones', 'ver_reclutadora',
        'administrar_requisicion', 'ver_notificaciones', 'ver_ia',
        'ver_vacantes', 'ver_seguimiento'
    ],
    'Ejecutivo': [
        'ver_dashboard', 'ver_dashboard_ejecutivo', 'ver_reportes',
        'ver_requisiciones', 'ver_notificaciones', 'ver_ia',
        'ver_vacantes', 'ver_seguimiento'
    ]
};

var DEFAULT_ADMIN = {
    id: 1,
    nombre: 'Administrador',
    email: 'admin@siman.com',
    password: 'admin123',
    rol: 'Administrador',
    centro: 'Central',
    estado: 'activo'
};

// ==========================================
// OBTENER USUARIOS
// ==========================================
async function getUsersFromSupabase() {
    try {
        if (typeof initSupabase === 'function') {
            await initSupabase();
        }
        if (typeof obtenerDeSupabase === 'function') {
            var result = await obtenerDeSupabase('usuarios');
            if (result.success && result.data && result.data.length > 0) {
                return result.data.map(function(u) {
                    var rol = u.rol || 'Reclutadora';
                    return {
                        username: u.email,
                        password: u.password,
                        name: u.nombre,
                        role: rol,
                        store: u.centro || 'Central',
                        id: u.id,
                        estado: u.estado
                    };
                });
            }
        }
        return null;
    } catch (error) {
        console.warn('⚠️ Error obteniendo usuarios de Supabase:', error);
        return null;
    }
}

function getUsersFromStorage() {
    try {
        var data = localStorage.getItem('siman_config_data');
        if (data) {
            var parsed = JSON.parse(data);
            var usuarios = parsed.usuarios || [];
            if (usuarios.length > 0) {
                return usuarios.map(function(u) {
                    return {
                        username: u.email,
                        password: u.password,
                        name: u.nombre,
                        role: u.rol || 'Reclutadora',
                        store: u.centro || 'Central',
                        id: u.id,
                        estado: u.estado
                    };
                });
            }
        }
    } catch (e) {
        console.error('Error al leer usuarios locales:', e);
    }
    return null;
}

async function getUsers() {
    console.log('🔍 Obteniendo usuarios...');
    var supabaseUsers = await getUsersFromSupabase();
    if (supabaseUsers && supabaseUsers.length > 0) {
        console.log('✅ Usuarios cargados desde Supabase:', supabaseUsers.map(function(u) { return u.username + ' (' + u.role + ')'; }));
        try {
            var data = JSON.parse(localStorage.getItem('siman_config_data') || '{}');
            data.usuarios = supabaseUsers.map(function(u) {
                return {
                    id: u.id,
                    nombre: u.name,
                    email: u.username,
                    password: u.password,
                    rol: u.role,
                    centro: u.store,
                    estado: u.estado || 'activo'
                };
            });
            localStorage.setItem('siman_config_data', JSON.stringify(data));
        } catch (e) {}
        return supabaseUsers;
    }
    
    var localUsers = getUsersFromStorage();
    if (localUsers && localUsers.length > 0) {
        console.log('📁 Usuarios cargados desde localStorage:', localUsers.map(function(u) { return u.username + ' (' + u.role + ')'; }));
        if (typeof guardarEnSupabase === 'function') {
            localUsers.forEach(function(u) {
                guardarEnSupabase('usuarios', {
                    id: u.id,
                    nombre: u.name,
                    email: u.username,
                    password: u.password,
                    rol: u.role,
                    centro: u.store,
                    estado: 'activo'
                });
            });
        }
        return localUsers;
    }
    
    console.log('👑 Creando usuario administrador por defecto');
    var adminUser = {
        username: 'admin@siman.com',
        password: 'admin123',
        name: 'Administrador',
        role: 'Administrador',
        store: 'Central',
        id: 1,
        estado: 'activo'
    };
    
    if (typeof guardarEnSupabase === 'function') {
        guardarEnSupabase('usuarios', {
            id: 1,
            nombre: 'Administrador',
            email: 'admin@siman.com',
            password: 'admin123',
            rol: 'Administrador',
            centro: 'Central',
            estado: 'activo'
        });
    }
    
    try {
        var data = {
            usuarios: [{
                id: 1,
                nombre: 'Administrador',
                email: 'admin@siman.com',
                password: 'admin123',
                rol: 'Administrador',
                centro: 'Central',
                estado: 'activo'
            }],
            roles: [
                { id: 1, nombre: 'Administrador', estado: 'activo' },
                { id: 2, nombre: 'Gerente RH', estado: 'activo' },
                { id: 3, nombre: 'Reclutadora', estado: 'activo' },
                { id: 4, nombre: 'Ejecutivo', estado: 'activo' }
            ],
            comerciales: [],
            tiendas: [],
            departamentos: [],
            estados: [],
            prioridades: [],
            motivos: [],
            tiposContratacion: [],
            asignaciones: [],
            correos: [],
            plantillas: [],
            cartasOferta: []
        };
        localStorage.setItem('siman_config_data', JSON.stringify(data));
    } catch (e) {}
    
    return [adminUser];
}

async function login(username, password) {
    console.log('🔐 Intentando login con:', username);
    try {
        var users = await getUsers();
        console.log('👥 Usuarios disponibles:', users.map(function(u) { return u.username + ' (' + u.role + ')'; }));
        
        var user = users.find(function(u) {
            return u.username === username && u.password === password && u.estado !== 'inactivo';
        });
        
        if (user) {
            console.log('✅ Login exitoso para:', user.username, 'Rol:', user.role);
            sessionStorage.setItem('currentUser', JSON.stringify(user));
            sessionStorage.setItem('isAuthenticated', 'true');
            return user;
        }
        console.log('❌ Login fallido para:', username);
        return null;
    } catch (error) {
        console.error('❌ Error en login:', error);
        return null;
    }
}

function logout() {
    sessionStorage.removeItem('currentUser');
    sessionStorage.removeItem('isAuthenticated');
    window.location.href = '/login.html';
}

function getCurrentUser() {
    var data = sessionStorage.getItem('currentUser');
    if (!data) return null;
    var user = JSON.parse(data);
    console.log('👤 Usuario actual:', user.username, 'Rol:', user.role);
    return user;
}

function isAuthenticated() {
    return sessionStorage.getItem('isAuthenticated') === 'true' && getCurrentUser() !== null;
}

function requireAuth() {
    if (!isAuthenticated()) {
        window.location.href = '/login.html';
        return null;
    }
    return getCurrentUser();
}

function refreshAuthUsers() {
    return getUsers();
}

// ==========================================
// VERIFICAR PERMISOS Y ROLES
// ==========================================
function tienePermiso(permiso) {
    var user = getCurrentUser();
    if (!user) {
        console.warn('⚠️ No hay usuario autenticado para verificar permiso:', permiso);
        return false;
    }
    var permisos = PERMISOS[user.role] || [];
    var tiene = permisos.indexOf(permiso) !== -1;
    console.log('🔍 Verificando permiso:', permiso, 'para rol:', user.role, '=>', tiene);
    return tiene;
}

function tieneRol(rol) {
    var user = getCurrentUser();
    if (!user) return false;
    return user.role === rol;
}

function esAdministrador() {
    return tieneRol('Administrador');
}

function esGerenteRH() {
    return tieneRol('Gerente RH');
}

function esReclutadora() {
    return tieneRol('Reclutadora');
}

function esEjecutivo() {
    return tieneRol('Ejecutivo');
}

// ==========================================
// PROTEGER RUTAS (con alerta solo en Configuración)
// ==========================================
function protegerRuta(permisoRequerido, redirectUrl) {
    var user = getCurrentUser();
    if (!user) {
        window.location.href = '/login.html';
        return false;
    }
    if (permisoRequerido && !tienePermiso(permisoRequerido)) {
        console.warn('🔒 Acceso denegado a', window.location.pathname, 'para rol', user.role);
        // ✅ SOLO MOSTRAR ALERT SI ES CONFIGURACIÓN
        if (window.location.pathname.includes('configuracion')) {
            alert('⚠️ No tienes permisos para acceder a Configuración.');
        }
        window.location.href = redirectUrl || '/dashboard.html';
        return false;
    }
    return true;
}

// ==========================================
// PROTEGER PÁGINAS AL CARGAR (AUTOMÁTICO)
// ==========================================
document.addEventListener('DOMContentLoaded', function() {
    var currentPage = window.location.pathname;
    if (currentPage.includes('login.html') || currentPage === '/') return;
    
    var user = requireAuth();
    if (!user) return;
    
    console.log('🔐 Página:', currentPage, 'Usuario:', user.username, 'Rol:', user.role);
    
    var permisosPorPagina = {
        '/configuracion': 'ver_configuracion',
        '/configuracion.html': 'ver_configuracion',
        '/dashboard-ejecutivo': 'ver_dashboard_ejecutivo',
        '/dashboard-ejecutivo.html': 'ver_dashboard_ejecutivo',
        '/reportes': 'ver_reportes',
        '/reportes.html': 'ver_reportes',
        '/usuarios': 'ver_usuarios',
        '/usuarios.html': 'ver_usuarios',
        '/nueva-requisicion': 'crear_requisicion',
        '/nueva-requisicion.html': 'crear_requisicion',
        '/reclutadora': 'ver_reclutadora',
        '/reclutadora.html': 'ver_reclutadora',
        '/administrar-requisicion': 'administrar_requisicion',
        '/administrar-requisicion.html': 'administrar_requisicion',
        '/vacantes': 'ver_vacantes',
        '/vacantes.html': 'ver_vacantes',
        '/seguimiento': 'ver_seguimiento',
        '/seguimiento.html': 'ver_seguimiento',
        '/requisiciones': 'ver_requisiciones',
        '/requisiciones.html': 'ver_requisiciones',
        '/ia': 'ver_ia',
        '/ia.html': 'ver_ia',
        '/notificaciones': 'ver_notificaciones',
        '/notificaciones.html': 'ver_notificaciones'
    };
    
    var permiso = permisosPorPagina[currentPage];
    if (permiso) {
        if (!tienePermiso(permiso)) {
            console.warn('🔒 Acceso denegado a', currentPage, 'para rol', user.role);
            // ✅ SOLO MOSTRAR ALERT SI ES CONFIGURACIÓN
            if (currentPage.includes('configuracion')) {
                alert('⚠️ No tienes permisos para acceder a Configuración.');
            }
            window.location.href = '/dashboard.html';
        }
    } else {
        // Si la página no está en el mapa, permitir acceso (asumimos que es pública o ya verificada)
        console.log('✅ Página sin restricción de permisos:', currentPage);
    }
});

// ==========================================
// EXPONER FUNCIONES GLOBALMENTE
// ==========================================
window.login = login;
window.logout = logout;
window.getCurrentUser = getCurrentUser;
window.isAuthenticated = isAuthenticated;
window.requireAuth = requireAuth;
window.refreshAuthUsers = refreshAuthUsers;
window.tienePermiso = tienePermiso;
window.tieneRol = tieneRol;
window.esAdministrador = esAdministrador;
window.esGerenteRH = esGerenteRH;
window.esReclutadora = esReclutadora;
window.esEjecutivo = esEjecutivo;
window.protegerRuta = protegerRuta;
window.getUsers = getUsers;
window.PERMISOS = PERMISOS;
window.ROLES = ROLES;

console.log('✅ Auth cargado correctamente');