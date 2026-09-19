document.addEventListener('DOMContentLoaded', async function() {
    console.log('🔐 Login - Inicializando...');
    
    if (typeof isAuthenticated === 'function' && isAuthenticated()) {
        console.log('✅ Usuario ya autenticado, redirigiendo...');
        window.location.href = '/dashboard.html';
        return;
    }
    
    if (typeof initSupabase === 'function') {
        try {
            await initSupabase();
            console.log('✅ Supabase inicializado para login');
            if (typeof getUsers === 'function') {
                await getUsers();
                console.log('✅ Usuarios cargados para login');
            }
        } catch (error) {
            console.warn('⚠️ Supabase no disponible, usando modo local');
        }
    }
    
    var form = document.getElementById('loginForm');
    var errorMsg = document.getElementById('errorMessage');
    var errorText = document.getElementById('errorText');

    if (errorMsg) errorMsg.style.display = 'none';

    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        if (errorMsg) errorMsg.style.display = 'none';

        var username = document.getElementById('username').value.trim();
        var password = document.getElementById('password').value.trim();

        if (!username || !password) {
            if (errorText) errorText.textContent = '⚠️ Por favor ingrese usuario y contraseña';
            if (errorMsg) errorMsg.style.display = 'block';
            return;
        }

        var submitBtn = form.querySelector('button[type="submit"]');
        var originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verificando...';
        submitBtn.disabled = true;

        try {
            var user = await login(username, password);
            console.log('🔍 Resultado login:', user);
            
            if (user) {
                console.log('✅ Login exitoso! Redirigiendo...');
                if (errorMsg) errorMsg.style.display = 'none';
                window.location.href = '/dashboard.html';
            } else {
                console.log('❌ Login fallido');
                if (errorText) errorText.textContent = '❌ Usuario o contraseña incorrectos. Verifique sus credenciales.';
                if (errorMsg) errorMsg.style.display = 'block';
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }
        } catch (error) {
            console.error('❌ Error en login:', error);
            if (errorText) errorText.textContent = '❌ Error al conectar con el servidor. Intente nuevamente.';
            if (errorMsg) errorMsg.style.display = 'block';
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    });

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