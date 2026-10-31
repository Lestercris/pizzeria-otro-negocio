function toggleMenu() {
  document.getElementById('sidebar').classList.toggle('open');
}
window.addEventListener('resize', function() {
  if (window.innerWidth > 850) {
    document.getElementById('sidebar').classList.remove('open');
  }
});
