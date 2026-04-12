// static/js/window-manager.js

class WindowManager {
  constructor() {
    this.windows = new Map();
    this.zIndex = 100;
    this.fileBrowsers = new Map();
  }

  createWindow(id, title, content, width = 700, height = 500) {
    // 如果窗口已存在，聚焦并返回
    if (this.windows.has(id)) {
      this.bringToFront(id);
      return this.windows.get(id).element;
    }

    const win = document.createElement('div');
    win.className = 'window';
    win.id = `window-${id}`;
    win.style.width = `${width}px`;
    win.style.height = `${height}px`;
    win.style.left = `${50 + this.windows.size * 30}px`;
    win.style.top = `${40 + this.windows.size * 30}px`;
    win.style.zIndex = ++this.zIndex;

    win.innerHTML = `
      <div class="window-titlebar" onmousedown="windowManager.bringToFront('${id}')">
        <span class="title">${title}</span>
        <div class="window-controls">
          <button class="window-control close" onclick="windowManager.closeWindow('${id}')" title="关闭">✕</button>
        </div>
      </div>
      <div class="window-toolbar">
        <button class="toolbar-btn back" onclick="windowManager.goBack('${id}')" title="返回" id="back-${id}" disabled>←</button>
        <button class="toolbar-btn forward" onclick="windowManager.goForward('${id}')" title="前进" id="forward-${id}" disabled>→</button>
        <input type="text" class="address-bar" value="/" id="address-${id}">
        <button class="go-btn" onclick="windowManager.navigate('${id}')">转到</button>
      </div>
      <div class="window-content" id="content-${id}">
        ${content}
      </div>
    `;

    document.body.appendChild(win);
    this.windows.set(id, {
      element: win,
      history: ['/'],
      historyIndex: 0
    });

    // 创建对应的 FileBrowser
    const fb = new FileBrowser(id);
    this.fileBrowsers.set(id, fb);

    // 绑定地址栏回车事件
    const addressBar = document.getElementById(`address-${id}`);
    addressBar.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        this.navigate(id);
      }
    });

    this.updateTaskbar();
    this.makeDraggable(win, id);
    return win;
  }

  closeWindow(id) {
    const win = this.windows.get(id);
    if (win) {
      win.element.remove();
      this.windows.delete(id);
      this.fileBrowsers.delete(id);
      this.updateTaskbar();
    }
  }

  bringToFront(id) {
    const win = this.windows.get(id);
    if (win) {
      win.element.style.zIndex = ++this.zIndex;
      this.updateTaskbar();
    }
  }

  makeDraggable(win, id) {
    const titlebar = win.querySelector('.window-titlebar');
    let isDragging = false;
    let offsetX, offsetY;

    titlebar.addEventListener('mousedown', (e) => {
      if (e.target.classList.contains('window-control')) return;
      if (e.target.classList.contains('window-controls')) return;
      isDragging = true;
      offsetX = e.clientX - win.offsetLeft;
      offsetY = e.clientY - win.offsetTop;
      this.bringToFront(id);
    });

    document.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      const newLeft = e.clientX - offsetX;
      const newTop = e.clientY - offsetY;
      // 限制在视口内
      win.style.left = `${Math.max(0, Math.min(newLeft, window.innerWidth - 100))}px`;
      win.style.top = `${Math.max(0, Math.min(newTop, window.innerHeight - 50))}px`;
    });

    document.addEventListener('mouseup', () => {
      isDragging = false;
    });
  }

  async navigate(id) {
    const addressBar = document.getElementById(`address-${id}`);
    const path = addressBar.value;

    const fb = this.fileBrowsers.get(id);
    if (fb) {
      // 更新历史
      const winData = this.windows.get(id);
      if (winData.history[winData.historyIndex] !== path) {
        // 如果当前不是最新的，清除前面的历史
        winData.history = winData.history.slice(0, winData.historyIndex + 1);
        winData.history.push(path);
        winData.historyIndex = winData.history.length - 1;
      }

      await fb.navigate(path);
      this.updateNavButtons(id);
    }
  }

  goBack(id) {
    const winData = this.windows.get(id);
    const fb = this.fileBrowsers.get(id);

    if (winData.historyIndex > 0) {
      winData.historyIndex--;
      const path = winData.history[winData.historyIndex];
      document.getElementById(`address-${id}`).value = path;
      fb.navigate(path);
      this.updateNavButtons(id);
    }
  }

  goForward(id) {
    const winData = this.windows.get(id);
    const fb = this.fileBrowsers.get(id);

    if (winData.historyIndex < winData.history.length - 1) {
      winData.historyIndex++;
      const path = winData.history[winData.historyIndex];
      document.getElementById(`address-${id}`).value = path;
      fb.navigate(path);
      this.updateNavButtons(id);
    }
  }

  updateNavButtons(id) {
    const winData = this.windows.get(id);
    const backBtn = document.getElementById(`back-${id}`);
    const forwardBtn = document.getElementById(`forward-${id}`);

    if (backBtn) {
      backBtn.disabled = winData.historyIndex <= 0;
    }
    if (forwardBtn) {
      forwardBtn.disabled = winData.historyIndex >= winData.history.length - 1;
    }
  }

  updateTaskbar() {
    const taskbar = document.getElementById('taskbar-windows');
    taskbar.innerHTML = '';
    this.windows.forEach((winData, id) => {
      const btn = document.createElement('button');
      btn.className = 'taskbar-window-btn active';
      btn.textContent = winData.element.querySelector('.title').textContent;
      btn.onclick = () => this.bringToFront(id);
      taskbar.appendChild(btn);
    });
  }
}

const windowManager = new WindowManager();
