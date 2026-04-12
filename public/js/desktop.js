// static/js/desktop.js

function openFolder(type) {
  const routes = {
    about: { title: 'About Me', path: '/about/' },
    posts: { title: 'Posts', path: '/posts/' },
    category: { title: 'Category', path: '/category/' }
  };

  const config = routes[type];
  if (!config) return;

  // 检查窗口是否已存在
  if (windowManager.windows.has(type)) {
    windowManager.bringToFront(type);
    return;
  }

  // 创建窗口
  windowManager.createWindow(type, config.title, '<div class="loading">加载中...</div>');

  // 导航到初始路径
  const fb = windowManager.fileBrowsers.get(type);
  if (fb) {
    fb.navigate(config.path);
  }
}

function updateClock() {
  const now = new Date();
  const time = now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  const clockEl = document.getElementById('clock');
  if (clockEl) {
    clockEl.textContent = time;
  }
}

function showStartMenu() {
  alert('开始菜单 - 敬请期待');
}

// 初始化时钟
setInterval(updateClock, 1000);
updateClock();

// 图标选中效果 (单击选中)
document.querySelectorAll('.desktop-icon').forEach(icon => {
  icon.addEventListener('click', function(e) {
    document.querySelectorAll('.desktop-icon').forEach(i => i.classList.remove('selected'));
    this.classList.add('selected');
    e.stopPropagation();
  });
});

// 点击桌面空白处取消选中
document.querySelector('.desktop').addEventListener('click', function(e) {
  if (e.target === this) {
    document.querySelectorAll('.desktop-icon').forEach(i => i.classList.remove('selected'));
  }
});

// 双击图标打开文件夹
document.querySelectorAll('.desktop-icon').forEach(icon => {
  icon.addEventListener('dblclick', function() {
    const folder = this.dataset.folder;
    if (folder) {
      openFolder(folder);
    }
  });
});
