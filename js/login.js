document.addEventListener('DOMContentLoaded', function() {
  if (typeof isAuthenticated === 'function' && isAuthenticated()) {
    window.location.href = '/dashboard';
    return;
  }
  
  var form = document.getElementById('loginForm');
  var errorMsg = document.getElementById('errorMessage');
  var errorText = document.getElementById('errorText');
  
  form.addEventListener('submit', function(e) {
    e.preventDefault();
    errorMsg.style.display = 'none';
    
    var username = document.getElementById('username').value.trim();
    var password = document.getElementById('password').value.trim();
    
    if (!username || !password) {
      errorText.textContent = 'Por favor ingrese usuario y contraseña';
      errorMsg.style.display = 'block';
      return;
    }
    
    var user = login(username, password);
    
    if (user) {
      window.location.href = '/dashboard';
    } else {
      errorText.textContent = 'Usuario o contraseña incorrectos. Verifique sus credenciales.';
      errorMsg.style.display = 'block';
    }
  });
  
  // Enter key support
  document.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      form.dispatchEvent(new Event('submit'));
    }
  });
});