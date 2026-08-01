// ==========================================
// ROLES Y PERMISOS
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

function getDefaultConfigData() {
    return {
        usuarios: [DEFAULT_ADMIN],
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
}

// ==========================================
// OBTENER USUARIOS DESDE STORAGE
// ==========================================
function getUsersFromStorage() {
    try {
        var data = localStorage.getItem('siman_config_data');
        
        if (!data) {
            var initialData = getDefaultConfigData();
            localStorage.setItem('siman_config_data', JSON.stringify(initialData));
            return [{ username: 'admin@siman.com', password: 'admin123', name: 'Administrador', role: 'Administrador', store: 'Central' }];
        }
        
        var parsed = JSON.parse(data);
        var usuarios = parsed.usuarios || [];
        
        if (usuarios.length === 0) {
            usuarios = [DEFAULT_ADMIN];
            parsed.usuarios = usuarios;
            localStorage.setItem('siman_config_data', JSON.stringify(parsed));
        }
        
        return usuarios.map(function(u) {
            return {
                username: u.email,
                password: u.password,
                name: u.nombre,
                role: u.rol || 'Reclutadora',
                store: u.centro || 'Central'
            };
        });
    } catch (error) {
        console.error('Error al obtener usuarios:', error);
        var initialData = getDefaultConfigData();
        localStorage.setItem('siman_config_data', JSON.stringify(initialData));
        return [{ username: 'admin@siman.com', password: 'admin123', name: 'Administrador', role: 'Administrador', store: 'Central' }];
    }
}

// ==========================================
// SESSION MANAGEMENT
// ==========================================
function login(username, password) {
    var users = getUsersFromStorage();
    var user = users.find(function(u) {
        return u.username === username && u.password === password;
    });
    if (user) {
        sessionStorage.setItem('currentUser', JSON.stringify(user));
        sessionStorage.setItem('isAuthenticated', 'true');
        return user;
    }
    return null;
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
    return getUsersFromStorage();
}

document.addEventListener('DOMContentLoaded', function() {
    var currentPage = window.location.pathname;
    if (!currentPage.includes('login.html') && currentPage !== '/') {
        requireAuth();
    }
});