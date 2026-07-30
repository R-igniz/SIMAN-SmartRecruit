document.addEventListener('DOMContentLoaded', function() {
  const user = getCurrentUser();
  if (!user) return;
  
  console.log('Detalle de requisición cargado');
  
  // Agregar evento para comentarios
  const commentInput = document.querySelector('.comment-input input');
  const commentBtn = document.querySelector('.comment-input .btn');
  
  function addComment() {
    const text = commentInput.value.trim();
    if (!text) return;
    
    const commentsContainer = document.querySelector('.comments');
    const newComment = document.createElement('div');
    newComment.className = 'comment';
    const initial = user.name.charAt(0).toUpperCase();
    newComment.innerHTML = `
      <div class="comment-avatar">${initial}</div>
      <div class="comment-content">
        <div class="comment-header">
          <span class="comment-author">${user.name}</span>
          <span class="comment-date">Ahora</span>
        </div>
        <p>${text}</p>
      </div>
    `;
    
    // Insertar antes del input
    const commentInputContainer = document.querySelector('.comment-input');
    commentsContainer.insertBefore(newComment, commentInputContainer);
    commentInput.value = '';
  }
  
  if (commentBtn) {
    commentBtn.addEventListener('click', addComment);
  }
  
  if (commentInput) {
    commentInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        addComment();
      }
    });
  }
});