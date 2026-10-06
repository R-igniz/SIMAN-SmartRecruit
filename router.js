function navigateTo(path) {
    if (!path.startsWith('/')) path = '/' + path;
    window.location.href = path;
}

document.addEventListener('DOMContentLoaded', function() {
    var currentPage = window.location.pathname.split('/').pop() || 'dashboard.html';
    document.querySelectorAll('.nav-item').forEach(function(item) {
        var href = item.getAttribute('href');
        if (href && href.includes(currentPage)) {
            item.classList.add('active');
        }
    });
});

window.navigateTo = navigateTo;