// ==========================================
// MODO OSCURO
// ==========================================
function toggleDarkMode() {
  var enabled = document.getElementById('darkModeToggle')?.checked || false;
  document.body.classList.toggle('dark-mode', enabled);
  localStorage.setItem('darkMode', enabled ? 'true' : 'false');
}

function initDarkMode() {
  var darkMode = localStorage.getItem('darkMode') === 'true';
  if (darkMode) {
    document.body.classList.add('dark-mode');
    var toggle = document.getElementById('darkModeToggle');
    if (toggle) toggle.checked = true;
  }
}

// ==========================================
// CSS para modo oscuro (añadir a global.css)
// ==========================================
var darkModeCSS = `
body.dark-mode {
  background-color: #0f172a;
  color: #e2e8f0;
}
body.dark-mode .sidebar {
  background: #1e293b;
  border-color: #334155;
}
body.dark-mode .sidebar .logo-text {
  color: #60a5fa;
}
body.dark-mode .sidebar .logo-sub {
  color: #94a3b8;
}
body.dark-mode .nav-item {
  color: #94a3b8;
}
body.dark-mode .nav-item:hover {
  background: #334155;
}
body.dark-mode .nav-item.active {
  background: #1e3a5f;
  color: #60a5fa;
}
body.dark-mode .card {
  background: #1e293b;
  border-color: #334155;
}
body.dark-mode .card-header {
  color: #e2e8f0;
}
body.dark-mode .kpi-card {
  background: #1e293b;
  border-color: #334155;
}
body.dark-mode .kpi-card .value {
  color: #e2e8f0;
}
body.dark-mode .search-box {
  background: #1e293b;
  border-color: #334155;
}
body.dark-mode .search-box input {
  color: #e2e8f0;
}
body.dark-mode .search-box input::placeholder {
  color: #64748b;
}
body.dark-mode .topbar .greeting h2 {
  color: #e2e8f0;
}
body.dark-mode .topbar .greeting p {
  color: #94a3b8;
}
body.dark-mode .icon-btn {
  background: #1e293b;
  border-color: #334155;
  color: #94a3b8;
}
body.dark-mode .avatar {
  background: #1e3a5f;
}
body.dark-mode .form-group input,
body.dark-mode .form-group select,
body.dark-mode .form-group textarea {
  background: #0f172a;
  border-color: #334155;
  color: #e2e8f0;
}
body.dark-mode .form-group label {
  color: #94a3b8;
}
body.dark-mode .badge-gray {
  background: #334155;
  color: #94a3b8;
}
body.dark-mode .modern-table thead {
  background: #0f172a;
}
body.dark-mode .modern-table th {
  color: #94a3b8;
  border-color: #334155;
}
body.dark-mode .modern-table td {
  border-color: #334155;
}
body.dark-mode .modern-table tbody tr:hover {
  background: #0f172a;
}
body.dark-mode .config-item {
  background: #1e293b;
  border-color: #334155;
}
body.dark-mode .config-item span {
  color: #e2e8f0;
}
body.dark-mode .modal-box {
  background: #1e293b;
}
body.dark-mode .modal-header {
  border-color: #334155;
}
body.dark-mode .modal-header h3 {
  color: #e2e8f0;
}
body.dark-mode .modal-body .form-group label {
  color: #94a3b8;
}
body.dark-mode .search-results-dropdown {
  background: #1e293b;
  border-color: #334155;
}
body.dark-mode .search-result-item {
  border-color: #334155;
}
body.dark-mode .search-result-item:hover {
  background: #0f172a;
}
body.dark-mode .search-result-title {
  color: #e2e8f0;
}
body.dark-mode .search-result-desc {
  color: #94a3b8;
}
body.dark-mode .summary-card {
  background: #0f172a;
}
body.dark-mode .summary-item {
  border-color: #334155;
}
body.dark-mode .summary-label {
  color: #94a3b8;
}
body.dark-mode .summary-value {
  color: #e2e8f0;
}
body.dark-mode .file-upload .file-label {
  background: #0f172a;
  border-color: #334155;
  color: #94a3b8;
}
body.dark-mode .chart-placeholder {
  background: #0f172a;
}
body.dark-mode .chart-labels {
  color: #94a3b8;
}
body.dark-mode .mini-list .item {
  border-color: #334155;
}
body.dark-mode .calendar-mini .day {
  color: #94a3b8;
}
body.dark-mode .calendar-mini .day.active {
  background: #1e3a5f;
  color: #60a5fa;
}
`;

// Aplicar CSS al cargar
var styleEl = document.createElement('style');
styleEl.textContent = darkModeCSS;
document.head.appendChild(styleEl);

// Inicializar
document.addEventListener('DOMContentLoaded', function() {
  initDarkMode();
});