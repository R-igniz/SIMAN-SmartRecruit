document.addEventListener('DOMContentLoaded', function() {
  var user = getCurrentUser();
  if (!user) return;
  
  console.log('Vacantes cargadas correctamente');
});