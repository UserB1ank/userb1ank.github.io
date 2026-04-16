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
  const btn = document.querySelector('.start-button');
  if (document.getElementById('start-popup')) {
    document.getElementById('start-popup').remove();
    return;
  }
  const popup = document.createElement('div');
  popup.id = 'start-popup';
  popup.style.cssText = `
    position:fixed; bottom:56px; left:50%; transform:translateX(-50%) scale(0.8);
    background:rgba(20,20,30,0.95); border:1px solid rgba(255,255,255,0.15);
    border-radius:12px; padding:20px 28px; z-index:9999; text-align:center;
    font-family:'Segoe UI',sans-serif; color:#fff; opacity:0;
    transition:transform 0.25s cubic-bezier(0.34,1.56,0.64,1), opacity 0.2s ease;
    box-shadow:0 8px 32px rgba(0,0,0,0.5);
  `;
  popup.innerHTML = `
    <div style="font-size:36px;margin-bottom:8px;animation:spin 2s linear infinite">⚙️</div>
    <div style="font-size:13px;color:#aaa;margin-bottom:4px">施工中...</div>
    <div style="font-size:11px;color:#555">( ´•ω•\` ) 敬请期待</div>
    <style>@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}</style>
  `;
  document.body.appendChild(popup);
  requestAnimationFrame(() => {
    popup.style.opacity = '1';
    popup.style.transform = 'translateX(-50%) scale(1)';
  });
  const close = (e) => { if (!popup.contains(e.target) && e.target !== btn) { popup.remove(); document.removeEventListener('click', close); } };
  setTimeout(() => document.addEventListener('click', close), 100);
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
