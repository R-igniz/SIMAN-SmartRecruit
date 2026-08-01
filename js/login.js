document.addEventListener('DOMContentLoaded', function() {
  if (typeof isAuthenticated === 'function' && isAuthenticated()) {
    window.location.href = '/dashboard.html';
    return;
  }

  var form = document.getElementById('loginForm');
  var errorMsg = document.getElementById('errorMessage');
  var errorText = document.getElementById('errorText');

  if (errorMsg) errorMsg.style.display = 'none';

  form.addEventListener('submit', function(e) {
    e.preventDefault();
    if (errorMsg) errorMsg.style.display = 'none';

    var username = document.getElementById('username').value.trim();
    var password = document.getElementById('password').value.trim();

    if (!username || !password) {
      if (errorText) errorText.textContent = 'Por favor ingrese usuario y contraseña';
      if (errorMsg) errorMsg.style.display = 'block';
      return;
    }

    var user = login(username, password);

    if (user) {
      window.location.href = '/dashboard.html';
    } else {
      if (errorText) errorText.textContent = 'Usuario o contraseña incorrectos. Verifique sus credenciales.';
      if (errorMsg) errorMsg.style.display = 'block';
    }
  });
});