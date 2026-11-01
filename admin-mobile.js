// =========================================
// LÓGICA RESPONSIVE MÓVIL - ADMIN
// =========================================

// 1. Función para abrir/cerrar el menú hamburguesa
function toggleMenu() {
  const sidebar = document.getElementById('sidebar');
  if (sidebar) {
    sidebar.classList.toggle('open');
  }
}

// 2. Cerrar el menú automáticamente al girar la pantalla (pasar a horizontal)
window.addEventListener('resize', function() {
  if (window.innerWidth > 850) {
    const sidebar = document.getElementById('sidebar');
    if (sidebar) {
      sidebar.classList.remove('open');
    }
  }
});
