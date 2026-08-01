document.addEventListener('DOMContentLoaded', function() {
    var user = getCurrentUser();
    if (!user) return;

    console.log('Dashboard cargado para:', user.name);

    setTimeout(function() {
        var values = document.querySelectorAll('.kpi-card .value');
        values.forEach(function(el) {
            var original = el.textContent;
            el.textContent = '...';
            setTimeout(function() {
                el.textContent = original;
            }, 300);
        });
    }, 500);
});