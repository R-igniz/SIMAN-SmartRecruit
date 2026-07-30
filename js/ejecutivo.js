document.addEventListener('DOMContentLoaded', function() {
  const user = getCurrentUser();
  if (!user) return;
  
  console.log('Dashboard ejecutivo cargado');
  
  // Animar barras
  setTimeout(() => {
    document.querySelectorAll('.bar-fill').forEach(el => {
      const width = el.style.width;
      el.style.width = '0%';
      setTimeout(() => {
        el.style.width = width;
      }, 100);
    });
  }, 500);
});