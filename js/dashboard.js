document.addEventListener('DOMContentLoaded', function() {
  const user = getCurrentUser();
  if (!user) return;
  
  console.log('Dashboard cargado para:', user.name);
  
  // Simular carga de datos con animación
  setTimeout(() => {
    const values = document.querySelectorAll('.kpi-card .value');
    values.forEach(el => {
      const original = el.textContent;
      el.textContent = '...';
      setTimeout(() => {
        el.textContent = original;
      }, 300);
    });
  }, 500);
});