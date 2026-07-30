document.addEventListener('DOMContentLoaded', function() {
  const user = getCurrentUser();
  if (!user) return;
  
  console.log('Panel de reclutadora cargado para:', user.name);
});