// static/js/window-manager.js

class WindowManager {
  constructor() {
    this.windows = new Map();
    this.zIndex = 100;
    this.fileBrowsers = new Map();
  }

  createWindow(id, title, content, width = 800, height = 600) {
    if (this.windows.has(id)) {
      this.bringToFront(id);
      return this.windows.get(id).element;
    }

    const win = document.createElement('div');
    win.className = 'window';
    win.id = `window-${id}`;
    win.style.width = `${width}px`;
    win.style.height = `${height}px`;
    // Arrange windows from left to right, wrapping to next row every 8 windows
    const baseOffsetX = 80;
    const baseOffsetY = 60;
    const count = this.windows.size;
    const offsetX = (count % 8) * (width / 2);
    const offsetY = Math.floor(count / 8) * 60;
    win.style.left = `${baseOffsetX + offsetX}px`;
    win.style.top = `${baseOffsetY + offsetY}px`;
    win.style.zIndex = ++this.zIndex;

    // 计算同一类型的窗口数量，用于显示编号
    const sameTypeCount = [...this.windows.keys()].filter(k => k.startsWith(id.split('-')[0] + '-')).length + 1;
    const displayTitle = sameTypeCount > 1 ? `${title} (${sameTypeCount})` : title;

    win.innerHTML = `
      <div class="window-titlebar" onmousedown="windowManager.bringToFront('${id}')">
        <span class="title">${displayTitle}</span>
        <div class="window-controls">
          <button class="window-control minimize" onclick="windowManager.minimizeWindow('${id}')" title="最小化">
            <svg viewBox="0 0 10 10"><line x1="0" y1="5" x2="10" y2="5" stroke="currentColor" stroke-width="1"/></svg>
          </button>
          <button class="window-control maximize" onclick="windowManager.toggleMaximize('${id}')" title="最大化">
            <svg viewBox="0 0 10 10"><rect x="1" y="1" width="8" height="8" stroke="currentColor" stroke-width="1" fill="none"/></svg>
          </button>
          <button class="window-control close" onclick="windowManager.closeWindow('${id}')" title="关闭">
            <svg viewBox="0 0 10 10">
              <line x1="1" y1="1" x2="9" y2="9" stroke="currentColor" stroke-width="1"/>
              <line x1="9" y1="1" x2="1" y2="9" stroke="currentColor" stroke-width="1"/>
            </svg>
          </button>
        </div>
      </div>
      <div class="window-toolbar">
        <button class="toolbar-btn back" onclick="windowManager.goBack('${id}')" title="返回" id="back-${id}" disabled>
          <svg viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6" stroke="currentColor" stroke-width="1.5" fill="none"/></svg>
        </button>
        <button class="toolbar-btn forward" onclick="windowManager.goForward('${id}')" title="前进" id="forward-${id}" disabled>
          <svg viewBox="0 0 24 24"><path d="M9 6l6 6-6 6" stroke="currentColor" stroke-width="1.5" fill="none"/></svg>
        </button>
        <input type="text" class="address-bar" value="/" id="address-${id}">
        <button class="go-btn" onclick="windowManager.navigate('${id}')">转到</button>
      </div>
      <div class="window-content" id="content-${id}">
        ${content}
      </div>
      <div class="window-resize-handle resize-n" data-dir="n"></div>
      <div class="window-resize-handle resize-s" data-dir="s"></div>
      <div class="window-resize-handle resize-e" data-dir="e"></div>
      <div class="window-resize-handle resize-w" data-dir="w"></div>
      <div class="window-resize-handle resize-ne" data-dir="ne"></div>
      <div class="window-resize-handle resize-nw" data-dir="nw"></div>
      <div class="window-resize-handle resize-se" data-dir="se"></div>
      <div class="window-resize-handle resize-sw" data-dir="sw"></div>
    `;

    const container = document.getElementById('windows-container') || document.body;
    container.appendChild(win);

    this.windows.set(id, {
      element: win,
      history: ['/'],
      historyIndex: 0,
      minimized: false,
      maximized: false,
      restoreRect: { left: win.style.left, top: win.style.top, width: win.style.width, height: win.style.height }
    });

    const fb = new FileBrowser(id);
    this.fileBrowsers.set(id, fb);

    const addressBar = document.getElementById(`address-${id}`);
    addressBar.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        this.navigate(id);
      }
    });

    this.updateTaskbar();
    this.makeDraggable(win, id);
    this.makeResizable(win, id);
    return win;
  }

  closeWindow(id) {
    const win = this.windows.get(id);
    if (win) {
      win.element.style.transition = 'transform 0.15s ease, opacity 0.15s ease';
      win.element.style.transform = 'scale(0.95)';
      win.element.style.opacity = '0';
      setTimeout(() => {
        win.element.remove();
        this.windows.delete(id);
        this.fileBrowsers.delete(id);
        this.updateTaskbar();
      }, 150);
    }
  }

  minimizeWindow(id) {
    const win = this.windows.get(id);
    if (win) {
      win.minimized = true;
      win.element.style.transition = 'transform 0.2s ease, opacity 0.2s ease';
      win.element.style.transform = 'scale(0.85) translateY(20px)';
      win.element.style.opacity = '0';
      setTimeout(() => {
        win.element.style.display = 'none';
        win.element.style.transform = '';
        win.element.style.opacity = '';
      }, 200);
      this.updateTaskbar();
    }
  }

  restoreWindow(id) {
    const win = this.windows.get(id);
    if (win) {
      win.minimized = false;
      win.element.style.display = 'flex';
      win.element.style.transform = 'scale(1.05)';
      win.element.style.opacity = '0';
      setTimeout(() => {
        win.element.style.transform = '';
        win.element.style.opacity = '';
      }, 10);
      this.bringToFront(id);
      this.updateTaskbar();
    }
  }

  toggleMaximize(id) {
    const win = this.windows.get(id);
    if (!win) return;

    if (win.maximized) {
      // Restore
      win.element.style.transition = 'all 0.2s ease';
      win.element.style.left = win.restoreRect.left;
      win.element.style.top = win.restoreRect.top;
      win.element.style.width = win.restoreRect.width;
      win.element.style.height = win.restoreRect.height;
      win.maximized = false;
      setTimeout(() => {
        win.element.style.transition = '';
      }, 200);
    } else {
      // Save current rect and maximize
      win.restoreRect = {
        left: win.element.style.left,
        top: win.element.style.top,
        width: win.element.style.width,
        height: win.element.style.height
      };
      win.element.style.transition = 'all 0.2s ease';
      win.element.style.left = '0';
      win.element.style.top = '0';
      win.element.style.width = '100%';
      win.element.style.height = 'calc(100% - 48px)';
      win.maximized = true;
      setTimeout(() => {
        win.element.style.transition = '';
      }, 200);
    }
  }

  bringToFront(id) {
    const win = this.windows.get(id);
    if (win) {
      if (win.minimized) {
        this.restoreWindow(id);
      }
      win.element.style.zIndex = ++this.zIndex;
      this.updateTaskbar();
    }
  }

  makeDraggable(win, id) {
    const titlebar = win.querySelector('.window-titlebar');
    let isDragging = false;
    let offsetX, offsetY;

    titlebar.addEventListener('mousedown', (e) => {
      if (e.target.classList.contains('window-control') || e.target.closest('.window-control')) return;

      const winData = this.windows.get(id);
      if (winData && winData.maximized) return;

      isDragging = true;
      offsetX = e.clientX - win.offsetLeft;
      offsetY = e.clientY - win.offsetTop;
      this.bringToFront(id);
      win.style.transition = 'none';
    });

    document.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      const newLeft = e.clientX - offsetX;
      const newTop = e.clientY - offsetY;
      win.style.left = `${Math.max(0, Math.min(newLeft, window.innerWidth - 100))}px`;
      win.style.top = `${Math.max(0, Math.min(newTop, window.innerHeight - 60))}px`;
    });

    document.addEventListener('mouseup', () => {
      if (isDragging) {
        isDragging = false;
        win.style.transition = '';
      }
    });
  }

  makeResizable(win, id) {
    const handles = win.querySelectorAll('.window-resize-handle');
    let isResizing = false;
    let currentHandle = null;
    let startX, startY, startWidth, startHeight, startLeft, startTop;

    handles.forEach(handle => {
      handle.addEventListener('mousedown', (e) => {
        e.stopPropagation();
        const winData = this.windows.get(id);
        if (winData && winData.maximized) return;

        isResizing = true;
        currentHandle = handle.dataset.dir;
        startX = e.clientX;
        startY = e.clientY;
        startWidth = win.offsetWidth;
        startHeight = win.offsetHeight;
        startLeft = win.offsetLeft;
        startTop = win.offsetTop;
        this.bringToFront(id);
        win.style.transition = 'none';
      });
    });

    document.addEventListener('mousemove', (e) => {
      if (!isResizing) return;

      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      const dir = currentHandle;

      let newWidth = startWidth;
      let newHeight = startHeight;
      let newLeft = startLeft;
      let newTop = startTop;

      const minWidth = 400;
      const minHeight = 300;

      if (dir.includes('e')) {
        newWidth = Math.max(minWidth, startWidth + dx);
      }
      if (dir.includes('w')) {
        newWidth = Math.max(minWidth, startWidth - dx);
        newLeft = startLeft + (startWidth - newWidth);
      }
      if (dir.includes('s')) {
        newHeight = Math.max(minHeight, startHeight + dy);
      }
      if (dir.includes('n')) {
        newHeight = Math.max(minHeight, startHeight - dy);
        newTop = startTop + (startHeight - newHeight);
      }

      win.style.width = `${newWidth}px`;
      win.style.height = `${newHeight}px`;
      win.style.left = `${newLeft}px`;
      win.style.top = `${newTop}px`;
    });

    document.addEventListener('mouseup', () => {
      if (isResizing) {
        isResizing = false;
        currentHandle = null;
        win.style.transition = '';
      }
    });
  }

  async navigate(id, path = null) {
    const addressBar = document.getElementById(`address-${id}`);
    const targetPath = path || addressBar.value;

    const fb = this.fileBrowsers.get(id);
    if (fb) {
      const winData = this.windows.get(id);
      if (winData.history[winData.historyIndex] !== targetPath) {
        winData.history = winData.history.slice(0, winData.historyIndex + 1);
        winData.history.push(targetPath);
        winData.historyIndex = winData.history.length - 1;
      }

      await fb.navigate(targetPath);
      if (addressBar) {
        addressBar.value = targetPath;
      }
      this.updateNavButtons(id);
    }
  }

  async goBack(id) {
    const winData = this.windows.get(id);
    const fb = this.fileBrowsers.get(id);

    if (winData.historyIndex > 0) {
      winData.historyIndex--;
      const path = winData.history[winData.historyIndex];
      document.getElementById(`address-${id}`).value = path;
      await fb.navigate(path);
      this.updateNavButtons(id);
    }
  }

  async goForward(id) {
    const winData = this.windows.get(id);
    const fb = this.fileBrowsers.get(id);

    if (winData.historyIndex < winData.history.length - 1) {
      winData.historyIndex++;
      const path = winData.history[winData.historyIndex];
      document.getElementById(`address-${id}`).value = path;
      await fb.navigate(path);
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
    const taskbarWindows = document.getElementById('taskbar-windows');
    if (!taskbarWindows) return;
    taskbarWindows.innerHTML = '';
    this.windows.forEach((winData, id) => {
      const btn = document.createElement('button');
      btn.className = 'taskbar-window-btn' + (winData.minimized ? '' : ' active');
      btn.innerHTML = `<span class="indicator"></span>${winData.element.querySelector('.title').textContent}`;
      btn.onclick = () => {
        if (winData.minimized) {
          this.restoreWindow(id);
        } else {
          this.bringToFront(id);
        }
      };
      taskbarWindows.appendChild(btn);
    });
  }
}

window.windowManager = new WindowManager();
