// ==========================================
// PERFIL DE USUARIO
// ==========================================
document.addEventListener('DOMContentLoaded', function() {
  var user = getCurrentUser();
  if (!user) {
    window.location.href = '/login.html';
    return;
  }
  
  // Actualizar datos del perfil
  var avatar = document.querySelector('.profile-avatar-large');
  if (avatar) avatar.textContent = user.name.charAt(0).toUpperCase();
  
  var nameEl = document.getElementById('profileName');
  if (nameEl) nameEl.textContent = user.name;
  
  var roleEl = document.getElementById('profileRole');
  if (roleEl) roleEl.textContent = user.role;
  
  var storeEl = document.getElementById('profileStore');
  if (storeEl) storeEl.textContent = user.store;
  
  var emailEl = document.getElementById('profileEmail');
  if (emailEl) emailEl.textContent = user.username;
  
  var roleDetailEl = document.getElementById('profileRoleDetail');
  if (roleDetailEl) roleDetailEl.textContent = user.role;
  
  var storeDetailEl = document.getElementById('profileStoreDetail');
  if (storeDetailEl) storeDetailEl.textContent = user.store;
  
  // Mostrar permisos del usuario
  var permisosEl = document.getElementById('profilePermisos');
  if (permisosEl) {
    var permisos = PERMISOS[user.role] || [];
    if (permisos.length > 0) {
      var badges = permisos.slice(0, 5).map(function(p) {
        return '<span class="badge badge-blue">' + p.replace('_', ' ') + '</span>';
      }).join(' ');
      if (permisos.length > 5) {
        badges += ' <span class="badge badge-gray">+' + (permisos.length - 5) + ' más</span>';
      }
      permisosEl.innerHTML = badges;
    } else {
      permisosEl.innerHTML = '<span class="badge badge-gray">Sin permisos especiales</span>';
    }
  }
  
  // Cargar preferencias guardadas
  // Modo oscuro - sincronizar con darkmode.js
  var darkModeToggle = document.getElementById('darkModeToggle');
  if (darkModeToggle) {
    var darkMode = localStorage.getItem('darkMode') === 'true';
    darkModeToggle.checked = darkMode;
  }
  
  // Sidebar collapsed
  var sidebarCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
  var sidebarTogglePreference = document.getElementById('sidebarTogglePreference');
  if (sidebarTogglePreference) {
    sidebarTogglePreference.checked = sidebarCollapsed;
  }
  
  // Idioma
  var languageSelect = document.getElementById('languageSelect');
  if (languageSelect) {
    var lang = localStorage.getItem('language') || 'es';
    languageSelect.value = lang;
  }
});

// ==========================================
// GUARDAR PREFERENCIAS
// ==========================================
function guardarPreferencia(key, value) {
  localStorage.setItem(key, value);
}

// ==========================================
// TOGGLE SIDEBAR (desde perfil)
// ==========================================
function toggleSidebarPreference() {
  var collapsed = document.getElementById('sidebarTogglePreference')?.checked || false;
  localStorage.setItem('sidebarCollapsed', collapsed ? 'true' : 'false');
  // Recargar para aplicar el cambio
  location.reload();
}

// ==========================================
// CAMBIAR IDIOMA
// ==========================================
function changeLanguage() {
  var select = document.getElementById('languageSelect');
  if (!select) return;
  var lang = select.value;
  localStorage.setItem('language', lang);
  alert('Idioma cambiado a: ' + (lang === 'es' ? 'Español' : 'English') + 
        '\n\n(La funcionalidad de traducción se implementaría con un sistema de i18n)');
}

// ==========================================
// CAMBIAR CONTRASEÑA
// ==========================================
function cambiarContrasena() {
  var current = prompt('Ingrese su contraseña actual:');
  if (!current) return;
  
  var newPass = prompt('Ingrese su nueva contraseña (mínimo 6 caracteres):');
  if (!newPass || newPass.length < 6) {
    alert('La contraseña debe tener al menos 6 caracteres.');
    return;
  }
  
  var confirmPass = prompt('Confirme su nueva contraseña:');
  if (newPass !== confirmPass) {
    alert('Las contraseñas no coinciden.');
    return;
  }
  
  var data = localStorage.getItem('siman_config_data');
  if (data) {
    var config = JSON.parse(data);
    var user = getCurrentUser();
    if (user) {
      var usuario = config.usuarios.find(function(u) {
        return u.email === user.username;
      });
      if (usuario) {
        if (usuario.password !== current) {
          alert('Contraseña actual incorrecta.');
          return;
        }
        usuario.password = newPass;
        localStorage.setItem('siman_config_data', JSON.stringify(config));
        alert('✅ Contraseña actualizada correctamente.');
      }
    }
  }
}

// ==========================================
// EXPORTAR PERFIL (información)
// ==========================================
function exportarPerfil() {
  var user = getCurrentUser();
  if (!user) return;
  
  var data = {
    usuario: user,
    fecha: new Date().toISOString(),
    permisos: PERMISOS[user.role] || []
  };
  
  var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url;
  a.download = 'perfil_' + user.username + '_' + new Date().toISOString().split('T')[0] + '.json';
  a.click();
  URL.revokeObjectURL(url);
}