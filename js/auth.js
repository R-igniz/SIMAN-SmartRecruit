// ==========================================
// AUTH - AUTENTICACIÓN CON SUPABASE
// ==========================================

var ROLES = {
    ADMINISTRADOR: 'Administrador',
    GERENTE_RH: 'Gerente RH',
    RECLUTADORA: 'Reclutadora',
    EJECUTIVO: 'Ejecutivo'
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
// OBTENER USUARIOS DESDE SUPABASE (PRIORITARIO)
// ==========================================
async function getUsersFromSupabase() {
    try {
        // Esperar a que Supabase esté inicializado
        if (typeof initSupabase === 'function') {
            await initSupabase();
        }
        
        if (typeof obtenerDeSupabase === 'function') {
            var result = await obtenerDeSupabase('usuarios');
            if (result.success && result.data && result.data.length > 0) {
                // Convertir a formato de autenticación
                return result.data.map(function(u) {
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
        return null;
    } catch (error) {
        console.warn('⚠️ Error obteniendo usuarios de Supabase:', error);
        return null;
    }
}

// ==========================================
// OBTENER USUARIOS DESDE LOCALSTORAGE (FALLBACK)
// ==========================================
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

// ==========================================
// OBTENER USUARIOS (PRIMERO SUPABASE, LUEGO LOCAL)
// ==========================================
async function getUsers() {
    // Intentar obtener de Supabase primero
    var supabaseUsers = await getUsersFromSupabase();
    if (supabaseUsers && supabaseUsers.length > 0) {
        console.log('✅ Usuarios cargados desde Supabase:', supabaseUsers.length);
        // Guardar en localStorage para caché local
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
    
    // Fallback a localStorage
    var localUsers = getUsersFromStorage();
    if (localUsers && localUsers.length > 0) {
        console.log('📁 Usuarios cargados desde localStorage:', localUsers.length);
        // Si hay usuarios en local pero no en Supabase, subirlos a Supabase
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
            console.log('✅ Usuarios locales sincronizados con Supabase');
        }
        return localUsers;
    }
    
    // Si no hay usuarios, crear el admin por defecto
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
    
    // Guardar admin en Supabase
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
    
    // Guardar admin en localStorage
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

// ==========================================
// SESSION MANAGEMENT
// ==========================================
async function login(username, password) {
    console.log('🔐 Intentando login con:', username);
    
    try {
        var users = await getUsers();
        console.log('👥 Usuarios disponibles:', users.map(function(u) { return u.username; }));
        
        var user = users.find(function(u) {
            return u.username === username && u.password === password && u.estado !== 'inactivo';
        });
        
        if (user) {
            console.log('✅ Login exitoso para:', user.username);
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
    return data ? JSON.parse(data) : null;
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
    // Forzar recarga de usuarios desde Supabase
    return getUsers();
}

function tieneRol(rol) {
    var user = getCurrentUser();
    if (!user) return false;
    return user.role === rol;
}

function esAdministrador() {
    return tieneRol('Administrador');
}

// ==========================================
// PROTEGER RUTAS
// ==========================================
document.addEventListener('DOMContentLoaded', function() {
    var currentPage = window.location.pathname;
    if (!currentPage.includes('login.html') && currentPage !== '/') {
        var user = requireAuth();
        if (user) {
            var rutasProtegidas = {
                '/configuracion': ['Administrador'],
                '/configuracion.html': ['Administrador'],
                '/usuarios': ['Administrador'],
                '/usuarios.html': ['Administrador']
            };
            var rutaActual = currentPage;
            var rolesPermitidos = rutasProtegidas[rutaActual];
            if (rolesPermitidos && !rolesPermitidos.includes(user.role)) {
                window.location.href = '/dashboard.html';
            }
        }
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
window.tieneRol = tieneRol;
window.esAdministrador = esAdministrador;
window.getUsers = getUsers;