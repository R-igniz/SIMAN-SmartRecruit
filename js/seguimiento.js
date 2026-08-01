document.addEventListener('DOMContentLoaded', function() {
  var user = getCurrentUser();
  if (!user) return;
  
  console.log('Seguimiento cargado correctamente');
});