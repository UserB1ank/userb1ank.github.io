// static/js/desktop-3d.js
// Desktop interactions for the 3D CSS2DRenderer environment

// Wait for DOM and scripts to be ready
document.addEventListener('DOMContentLoaded', () => {
  initDesktop3D();
});

function initDesktop3D() {
  // Clock update
  function updateClock() {
    const now = new Date();
    const time = now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    const clockEl = document.getElementById('clock');
    if (clockEl) {
      clockEl.textContent = time;
    }
  }
  setInterval(updateClock, 1000);
  updateClock();

  // Icon selection (single click)
  document.querySelectorAll('.desktop-icon').forEach(icon => {
    icon.addEventListener('click', function(e) {
      document.querySelectorAll('.desktop-icon').forEach(i => i.classList.remove('selected'));
      this.classList.add('selected');
      e.stopPropagation();
    });
  });

  // Click on desktop to deselect
  const desktop = document.getElementById('desktop');
  if (desktop) {
    desktop.addEventListener('click', function(e) {
      if (e.target === this) {
        document.querySelectorAll('.desktop-icon').forEach(i => i.classList.remove('selected'));
      }
    });
  }

  // Start menu (placeholder)
  window.showStartMenu = function() {
    // Could implement a start menu here
    console.log('Start menu clicked');
  };

  // Make windows draggable within the CSS2D container
  // The window-manager.js already handles this, but we need to ensure
  // the windows are positioned correctly in the 3D space
  setupWindowDragging();
}

function setupWindowDragging() {
  // Override window creation to add 3D-specific styling
  const originalCreateWindow = windowManager.createWindow.bind(windowManager);

  windowManager.createWindow = function(id, title, content, width = 700, height = 500) {
    const win = originalCreateWindow(id, title, content, width, height);
    if (win) {
      // Ensure window is properly styled for 3D environment
      win.style.pointerEvents = 'auto';
    }
    return win;
  };
}
