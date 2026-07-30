document.addEventListener('DOMContentLoaded', function() {
  // Si ya está autenticado, redirigir al dashboard
  if (isAuthenticated()) {
    window.location.href = '/dashboard';
    return;
  }

  const form = document.getElementById('loginForm');
  
  form.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();
    
    if (!username || !password) {
      alert('Por favor ingrese usuario y contraseña');
      return;
    }
    
    const user = login(username, password);
    
    if (user) {
      window.location.href = '/dashboard';
    } else {
      alert('Usuario o contraseña incorrectos. Por favor verifique sus credenciales.');
    }
  });

  // Enter key support
  document.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      form.dispatchEvent(new Event('submit'));
    }
  });
});