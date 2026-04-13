// static/js/desktop.js

// 每个窗口类型的计数器，用于生成唯一 ID
const windowCounters = { about: 0, posts: 0, category: 0 };

function openFolder(type) {
  const routes = {
    about: { title: 'About Me', path: '/about/' },
    posts: { title: 'Posts', path: '/posts/' },
    category: { title: 'Category', path: '/category/' }
  };

  const config = routes[type];
  if (!config) return;

  // 生成唯一窗口 ID，允许同一类型多个窗口
  windowCounters[type]++;
  const windowId = `${type}-${windowCounters[type]}`;

  // 创建窗口
  windowManager.createWindow(windowId, config.title, '<div class="loading">加载中...</div>');

  // 导航到初始路径并更新历史
  const fb = windowManager.fileBrowsers.get(windowId);
  if (fb) {
    const winData = windowManager.windows.get(windowId);
    if (winData) {
      winData.history = [config.path];
      winData.historyIndex = 0;
      windowManager.updateNavButtons(windowId);
    }
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
