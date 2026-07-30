document.addEventListener('DOMContentLoaded', function() {
  const user = getCurrentUser();
  if (!user) return;
  
  // Actualizar datos del perfil
  document.getElementById('profileName').textContent = user.name;
  document.getElementById('profileRole').textContent = user.role;
  document.getElementById('profileStore').textContent = user.store;
  document.getElementById('profileEmail').textContent = user.username;
  document.getElementById('profileRoleDetail').textContent = user.role;
  document.getElementById('profileStoreDetail').textContent = user.store;
  
  // Actualizar avatar
  const initial = user.name.charAt(0).toUpperCase();
  document.querySelector('.profile-avatar-large').textContent = initial;
});