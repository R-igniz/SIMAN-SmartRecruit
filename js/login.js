// ==========================================
// LOGIN - VERSIÓN CORREGIDA
// ==========================================

// Esperar a que el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
  console.log('🔐 Login - Inicializando...');
  
  // Verificar si ya está autenticado
  if (typeof isAuthenticated === 'function' && isAuthenticated()) {
    console.log('✅ Usuario ya autenticado, redirigiendo...');
    window.location.href = '/dashboard.html';
    return;
  }
  
  // Verificar que los datos de configuración existan
  try {
    var data = localStorage.getItem('siman_config_data');
    if (!data) {
      console.log('📦 Creando datos iniciales de configuración...');
      var initialData = {
        usuarios: [
          { id: 1, nombre: 'Administrador', email: 'admin@siman.com', password: 'admin123', rol: 'Administrador', centro: 'Central', estado: 'activo' }
        ],
        roles: [
          { id: 1, nombre: 'Administrador', estado: 'activo' },
          { id: 2, nombre: 'Gerente RH', estado: 'activo' },
          { id: 3, nombre: 'Reclutadora', estado: 'activo' },
          { id: 4, nombre: 'Ejecutivo', estado: 'activo' }
        ],
        cartasOferta: [],
        comerciales: [],
        tiendas: [],
        departamentos: [],
        estados: [],
        prioridades: [],
        motivos: [],
        tiposContratacion: [],
        asignaciones: [],
        correos: [],
        plantillas: []
      };
      localStorage.setItem('siman_config_data', JSON.stringify(initialData));
      console.log('✅ Datos iniciales creados');
    }
  } catch(e) {
    console.error('❌ Error al crear datos iniciales:', e);
  }
  
  // Obtener elementos del DOM
  var form = document.getElementById('loginForm');
  var errorMsg = document.getElementById('errorMessage');
  var errorText = document.getElementById('errorText');
  var successMsg = document.getElementById('successMessage');
  var successText = document.getElementById('successText');
  var loginBtn = document.getElementById('loginBtn');
  
  // Ocultar mensajes al inicio
  if (errorMsg) errorMsg.classList.remove('show');
  if (successMsg) successMsg.classList.remove('show');
  
  // Manejar envío del formulario
  form.addEventListener('submit', function(e) {
    e.preventDefault();
    console.log('📤 Intentando login...');
    
    // Ocultar mensajes previos
    if (errorMsg) errorMsg.classList.remove('show');
    if (successMsg) successMsg.classList.remove('show');
    
    var username = document.getElementById('username').value.trim();
    var password = document.getElementById('password').value.trim();
    
    console.log('👤 Usuario:', username);
    console.log('🔑 Contraseña:', password);
    
    if (!username || !password) {
      if (errorText) errorText.textContent = '⚠️ Por favor ingrese usuario y contraseña';
      if (errorMsg) errorMsg.classList.add('show');
      return;
    }
    
    // Deshabilitar botón mientras procesa
    if (loginBtn) {
      loginBtn.disabled = true;
      loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verificando...';
    }
    
    // Intentar login
    var user = login(username, password);
    console.log('🔍 Resultado login:', user);
    
    if (user) {
      console.log('✅ Login exitoso! Redirigiendo...');
      
      // Mostrar mensaje de éxito
      if (successText) successText.textContent = '✅ ¡Login exitoso! Redirigiendo al dashboard...';
      if (successMsg) successMsg.classList.add('show');
      
      // Redirigir después de un pequeño delay
      setTimeout(function() {
        console.log('🚀 Redirigiendo a /dashboard.html');
        window.location.href = '/dashboard.html';
      }, 500);
      
    } else {
      console.log('❌ Login fallido');
      if (errorText) errorText.textContent = '❌ Usuario o contraseña incorrectos. Verifique sus credenciales.';
      if (errorMsg) errorMsg.classList.add('show');
      
      // Rehabilitar botón
      if (loginBtn) {
        loginBtn.disabled = false;
        loginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Iniciar Sesión';
      }
    }
  });
  
  // Soporte para tecla Enter
  document.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      var active = document.activeElement;
      if (active && (active.id === 'username' || active.id === 'password')) {
        form.dispatchEvent(new Event('submit'));
      }
    }
  });
  
  console.log('✅ Login - Inicialización completada');
});