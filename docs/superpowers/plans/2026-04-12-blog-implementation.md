# Windows XP 复古博客实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**目标:** 构建一个带 3D 开场动画的 Windows XP Luna 主题复古博客

**架构:** Hugo 静态站点生成 + 纯前端 3D 动画和桌面交互系统。Hugo 负责内容组织和 Markdown 渲染(构建时)，前端负责桌面 UI 和交互。

**技术栈:** Hugo, Three.js, Vanilla JS/CSS, marked.js, highlight.js, GitHub Actions

---

## 文件结构

```
/
├── .github/workflows/deploy.yml
├── config.toml
├── content/
│   ├── posts/hello-world/index.md
│   └── about/index.md
├── layouts/
│   ├── index.html              # 3D 动画首页
│   ├── desktop.html            # 桌面页面
│   └── _default/
│       └── single.html         # 文章页面模板
├── static/
│   ├── css/
│   │   └── xp.css              # XP Luna 主题样式
│   ├── js/
│   │   ├── main.js             # 入口
│   │   ├── desktop.js          # 桌面系统
│   │   ├── window-manager.js   # 窗口管理
│   │   ├── file-browser.js     # 文件浏览器
│   │   └── markdown-renderer.js
│   └── fonts/                  # 字体文件
└── themes/hugo-xp/             # Hugo 主题
```

---

## 任务 1: Hugo 项目初始化

**Files:**
- Create: `config.toml`
- Create: `themes/hugo-xp/layouts/_default/single.html`
- Create: `themes/hugo-xp/layouts/index.html`
- Create: `content/posts/hello-world/index.md`
- Create: `content/about/index.md`

- [ ] **Step 1: 创建 Hugo 配置文件**

```toml
baseURL = 'https://example.com/'
languageCode = 'zh-cn'
title = 'PC Station Blog'
theme = 'hugo-xp'
publishDir = 'public'

[markup]
  [markup.highlight]
    codeFences = true
```

- [ ] **Step 2: 创建 Hugo 主题布局**

```html
<!-- themes/hugo-xp/layouts/_default/single.html -->
{{ define "main" }}
<article class="markdown-body">
{{ .Content }}
</article>
{{ end }}
```

- [ ] **Step 3: 创建示例文章**

```markdown
---
title: "Hello World"
date: 2024-01-01
category: "技术"
---
# 你好世界

这是一篇示例文章。
```

- [ ] **Step 4: 创建关于页面**

```markdown
---
title: "关于我"
---
# 关于我

欢迎来到我的博客。
```

- [ ] **Step 5: 提交**

```bash
git add -A && git commit -m "feat: Hugo project scaffolding"
```

---

## 任务 2: 3D 开场动画

**Files:**
- Create: `static/css/intro.css`
- Create: `static/js/intro.js`
- Create: `layouts/index.html`

- [ ] **Step 1: 创建 3D 场景 HTML**

```html
<!-- layouts/index.html -->
<!DOCTYPE html>
<html>
<head>
  <title>PC Station</title>
  <link rel="stylesheet" href="/css/intro.css">
</head>
<body>
  <canvas id="scene"></canvas>
  <script type="importmap">
  {
    "imports": {
      "three": "https://unpkg.com/three@0.160.0/build/three.module.js",
      "three/addons/": "https://unpkg.com/three@0.160.0/examples/jsm/"
    }
  }
  </script>
  <script type="module" src="/js/intro.js"></script>
</body>
</html>
```

- [ ] **Step 2: 创建 Three.js 场景**

```javascript
// static/js/intro.js
import * as THREE from 'three';

export function initIntroScene(canvas, onComplete) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  
  // 蒸汽波背景渐变 (通过 CSS 而非 Three.js)
  scene.background = new THREE.Color(0x0a0a1a);
  
  // 创建复古 LCD 显示器
  const monitor = createMonitor();
  scene.add(monitor);
  
  // 相机动画
  const startPos = new THREE.Vector3(-8, 0, 5);
  const endPos = new THREE.Vector3(0, 0, 3);
  
  camera.position.copy(startPos);
  
  // GSAP-like 动画 (使用原生实现)
  animateCamera(camera, startPos, endPos, 2500, () => {
    // 淡出并跳转
    document.body.style.transition = 'opacity 0.5s';
    document.body.style.opacity = '0';
    setTimeout(() => window.location.href = '/desktop/', 500);
  });
  
  function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
  }
  animate();
}

function createMonitor() {
  const group = new THREE.Group();
  
  // 显示器外壳
  const shellGeom = new THREE.BoxGeometry(4, 3, 0.5);
  const shellMat = new THREE.MeshPhongMaterial({ color: 0xcccccc });
  const shell = new THREE.Mesh(shellGeom, shellMat);
  group.add(shell);
  
  // 屏幕
  const screenGeom = new THREE.PlaneGeometry(3.5, 2.5);
  const screenMat = new THREE.MeshPhongMaterial({ color: 0x000000 });
  const screen = new THREE.Mesh(screenGeom, screenMat);
  screen.position.z = 0.26;
  group.add(screen);
  
  return group;
}
```

- [ ] **Step 3: 创建淡入淡出样式**

```css
/* static/css/intro.css */
body {
  margin: 0;
  overflow: hidden;
  background: linear-gradient(135deg, #1a0a2e 0%, #0f0f23 100%);
}

canvas {
  display: block;
}
```

- [ ] **Step 4: 提交**

```bash
git add -A && git commit -m "feat: 3D intro animation with Three.js"
```

---

## 任务 3: Windows XP Luna 主题 CSS

**Files:**
- Create: `static/css/xp.css`

- [ ] **Step 1: 创建 XP Luna 主题样式**

```css
/* Windows XP Luna Theme Styles */

:root {
  --xp-blue-start: #0054E3;
  --xp-blue-end: #0054E3;
  --xp-gray-light: #DFE9F5;
  --xp-gray: #F4F4F4;
  --xp-border: #0A3FAB;
  --xp-title-text: #FFFFFF;
  --xp-window-bg: #ECE9D8;
}

* {
  box-sizing: border-box;
  font-family: Tahoma, Verdana, sans-serif;
  font-size: 11px;
}

body {
  margin: 0;
  padding: 0;
  overflow: hidden;
  user-select: none;
}

/* Window */
.window {
  position: absolute;
  background: var(--xp-window-bg);
  border: 2px solid;
  border-color: #ffffff #0a3fab #0a3fab #ffffff;
  box-shadow: 1px 1px 0 #0a3fab;
  min-width: 200px;
  min-height: 100px;
}

.window-titlebar {
  background: linear-gradient(90deg, var(--xp-blue-start), var(--xp-blue-end));
  color: var(--xp-title-text);
  padding: 3px 4px;
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: default;
}

.window-titlebar .title {
  flex: 1;
  font-weight: bold;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.window-controls {
  display: flex;
  gap: 2px;
}

.window-control {
  width: 16px;
  height: 14px;
  background: var(--xp-gray-light);
  border: 1px solid;
  border-color: #ffffff #808080 #808080 #ffffff;
  font-size: 9px;
  line-height: 12px;
  text-align: center;
  cursor: pointer;
}

.window-toolbar {
  background: var(--xp-gray);
  border-bottom: 1px solid #808080;
  padding: 2px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.toolbar-btn {
  width: 22px;
  height: 22px;
  background: var(--xp-gray-light);
  border: 1px solid transparent;
  cursor: pointer;
}

.toolbar-btn:hover {
  border-color: #ffffff #808080 #808080 #ffffff;
}

.toolbar-btn:active {
  border-color: #808080 #ffffff #ffffff #808080;
}

.address-bar {
  flex: 1;
  height: 20px;
  border: 1px solid;
  border-color: #808080 #ffffff #ffffff #808080;
  padding: 0 4px;
  font-size: 11px;
}

.window-content {
  overflow: auto;
  height: calc(100% - 60px);
}

/* Desktop Icons */
.desktop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 28px;
  background: #008080;
  padding: 10px;
}

.desktop-icon {
  width: 64px;
  text-align: center;
  cursor: pointer;
  padding: 4px;
}

.desktop-icon:hover {
  background: rgba(0, 0, 128, 0.3);
}

.desktop-icon .icon {
  font-size: 32px;
}

.desktop-icon .label {
  color: white;
  text-shadow: 1px 1px 1px black;
  font-size: 11px;
  word-wrap: break-word;
}

/* Taskbar */
.taskbar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 28px;
  background: var(--xp-gray-light);
  border-top: 2px solid #ffffff;
  display: flex;
  align-items: center;
}

.start-button {
  height: 24px;
  padding: 0 6px;
  background: var(--xp-gray-light);
  border: 1px solid;
  border-color: #ffffff #808080 #808080 #ffffff;
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  font-weight: bold;
}

.start-button:active {
  border-color: #808080 #ffffff #ffffff #808080;
}

.taskbar-windows {
  flex: 1;
  display: flex;
  gap: 2px;
  margin-left: 4px;
}

.taskbar-window-btn {
  height: 22px;
  min-width: 120px;
  max-width: 160px;
  background: var(--xp-gray-light);
  border: 1px solid transparent;
  cursor: pointer;
  padding: 0 4px;
  text-align: left;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.taskbar-window-btn.active {
  border-color: #ffffff #808080 #808080 #ffffff;
  background: var(--xp-window-bg);
}

.system-tray {
  height: 24px;
  padding: 0 8px;
  border: 1px solid;
  border-color: #808080 #ffffff #ffffff #808080;
  display: flex;
  align-items: center;
  gap: 8px;
}

/* File Browser */
.file-list {
  padding: 4px;
}

.file-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 2px 4px;
  cursor: pointer;
}

.file-item:hover {
  background: rgba(0, 0, 128, 0.2);
}

.file-item.selected {
  background: rgba(0, 0, 128, 0.4);
  color: white;
}

.file-item .icon {
  font-size: 16px;
}

.file-item .info {
  flex: 1;
}

.file-item .name {
  font-size: 11px;
}

.file-item .date {
  font-size: 10px;
  color: #666;
}

/* Markdown Content */
.markdown-body {
  padding: 20px;
  font-size: 14px;
  line-height: 1.6;
}

.markdown-body h1 { font-size: 24px; border-bottom: 1px solid #ccc; padding-bottom: 8px; }
.markdown-body h2 { font-size: 20px; border-bottom: 1px solid #eee; padding-bottom: 6px; }
.markdown-body h3 { font-size: 16px; }
.markdown-body code { background: #f4f4f4; padding: 2px 4px; }
.markdown-body pre { background: #f4f4f4; padding: 12px; overflow-x: auto; }
.markdown-body pre code { background: none; padding: 0; }
.markdown-body blockquote { border-left: 3px solid #ccc; margin: 0; padding-left: 12px; color: #666; }
```

- [ ] **Step 2: 提交**

```bash
git add -A && git commit -m "feat: Windows XP Luna theme CSS"
```

---

## 任务 4: 桌面系统

**Files:**
- Create: `layouts/desktop.html`
- Modify: `static/css/xp.css` (追加桌面背景)
- Create: `static/js/desktop.js`
- Create: `static/js/window-manager.js`

- [ ] **Step 1: 创建桌面 HTML**

```html
<!-- layouts/desktop.html -->
<!DOCTYPE html>
<html>
<head>
  <title>PC Station</title>
  <link rel="stylesheet" href="/css/xp.css">
</head>
<body>
  <div class="desktop" id="desktop">
    <div class="desktop-icon" data-folder="about" ondblclick="openFolder('about')">
      <div class="icon">📁</div>
      <div class="label">About Me</div>
    </div>
    <div class="desktop-icon" data-folder="posts" ondblclick="openFolder('posts')">
      <div class="icon">📁</div>
      <div class="label">Posts</div>
    </div>
    <div class="desktop-icon" data-folder="category" ondblclick="openFolder('category')">
      <div class="icon">📁</div>
      <div class="label">Category</div>
    </div>
  </div>

  <div class="taskbar">
    <button class="start-button" onclick="showStartMenu()">开始</button>
    <div class="taskbar-windows" id="taskbar-windows"></div>
    <div class="system-tray">
      <span id="clock"></span>
    </div>
  </div>

  <script src="/js/window-manager.js"></script>
  <script src="/js/desktop.js"></script>
</body>
</html>
```

- [ ] **Step 2: 创建窗口管理器**

```javascript
// static/js/window-manager.js

class WindowManager {
  constructor() {
    this.windows = new Map();
    this.zIndex = 100;
    this.history = [];
    this.historyIndex = -1;
  }

  createWindow(id, title, content, width = 600, height = 400) {
    const win = document.createElement('div');
    win.className = 'window';
    win.id = `window-${id}`;
    win.style.width = `${width}px`;
    win.style.height = `${height}px`;
    win.style.left = `${100 + this.windows.size * 30}px`;
    win.style.top = `${80 + this.windows.size * 30}px`;
    win.style.zIndex = ++this.zIndex;

    win.innerHTML = `
      <div class="window-titlebar" onmousedown="windowManager.bringToFront('${id}')">
        <span class="title">${title}</span>
        <div class="window-controls">
          <button class="window-control close" onclick="windowManager.closeWindow('${id}')">✕</button>
        </div>
      </div>
      <div class="window-toolbar">
        <button class="toolbar-btn back" onclick="windowManager.goBack()" title="返回">←</button>
        <button class="toolbar-btn forward" onclick="windowManager.goForward()" title="前进">→</button>
        <input type="text" class="address-bar" value="/" id="address-${id}">
        <button class="toolbar-btn" onclick="windowManager.navigate('${id}')">转到</button>
      </div>
      <div class="window-content" id="content-${id}">
        ${content}
      </div>
    `;

    document.body.appendChild(win);
    this.windows.set(id, { element: win, history: ['/'], historyIndex: 0 });
    this.updateTaskbar();
    this.makeDraggable(win);
    return win;
  }

  closeWindow(id) {
    const win = this.windows.get(id);
    if (win) {
      win.element.remove();
      this.windows.delete(id);
      this.updateTaskbar();
    }
  }

  bringToFront(id) {
    const win = this.windows.get(id);
    if (win) {
      win.element.style.zIndex = ++this.zIndex;
    }
  }

  makeDraggable(win) {
    const titlebar = win.querySelector('.window-titlebar');
    let isDragging = false;
    let offsetX, offsetY;

    titlebar.addEventListener('mousedown', (e) => {
      if (e.target.classList.contains('window-control')) return;
      isDragging = true;
      offsetX = e.clientX - win.offsetLeft;
      offsetY = e.clientY - win.offsetTop;
    });

    document.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      win.style.left = `${e.clientX - offsetX}px`;
      win.style.top = `${e.clientY - offsetY}px`;
    });

    document.addEventListener('mouseup', () => {
      isDragging = false;
    });
  }

  navigate(id) {
    const addressBar = document.getElementById(`address-${id}`);
    const content = document.getElementById(`content-${id}`);
    const path = addressBar.value;
    // 实现导航逻辑
    console.log('Navigate to:', path);
  }

  updateTaskbar() {
    const taskbar = document.getElementById('taskbar-windows');
    taskbar.innerHTML = '';
    this.windows.forEach((win, id) => {
      const btn = document.createElement('button');
      btn.className = 'taskbar-window-btn active';
      btn.textContent = win.element.querySelector('.title').textContent;
      btn.onclick = () => this.bringToFront(id);
      taskbar.appendChild(btn);
    });
  }

  goBack() {
    if (this.historyIndex > 0) {
      this.historyIndex--;
      // 更新内容
    }
  }

  goForward() {
    if (this.historyIndex < this.history.length - 1) {
      this.historyIndex++;
      // 更新内容
    }
  }
}

const windowManager = new WindowManager();
```

- [ ] **Step 3: 创建桌面 JS**

```javascript
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
  const existingWin = windowManager.windows.get(type);
  if (existingWin) {
    windowManager.bringToFront(type);
    return;
  }

  // 获取内容
  fetchContent(config.path).then(content => {
    windowManager.createWindow(type, config.title, content);
  });
}

async function fetchContent(path) {
  // 简单实现，实际应调用 API
  return `<div class="file-list"><p>Loading...</p></div>`;
}

function updateClock() {
  const now = new Date();
  const time = now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  document.getElementById('clock').textContent = time;
}

function showStartMenu() {
  alert('Start Menu - Coming Soon');
}

// 时钟更新
setInterval(updateClock, 1000);
updateClock();

// 图标选中效果
document.querySelectorAll('.desktop-icon').forEach(icon => {
  icon.addEventListener('click', function() {
    document.querySelectorAll('.desktop-icon').forEach(i => i.classList.remove('selected'));
    this.classList.add('selected');
  });
});
```

- [ ] **Step 4: 提交**

```bash
git add -A && git commit -m "feat: Windows XP desktop system"
```

---

## 任务 5: 文件浏览器与 Markdown 渲染

**Files:**
- Create: `static/js/file-browser.js`
- Create: `static/js/markdown-renderer.js`
- Modify: `static/js/desktop.js`

- [ ] **Step 1: 创建 Markdown 渲染器**

```javascript
// static/js/markdown-renderer.js

export async function renderMarkdown(content) {
  // 使用 marked.js 渲染
  const { marked } = await import('https://cdn.jsdelivr.net/npm/marked@9.1.6/lib/marked.esm.js');
  
  marked.setOptions({
    highlight: async (code, lang) => {
      if (lang && hljs.getLanguage(lang)) {
        return hljs.highlight(code, { language: lang }).value;
      }
      return hljs.highlightAuto(code).value;
    },
    breaks: true,
    gfm: true
  });

  return marked.parse(content);
}

export function renderFileList(files) {
  return files.map(file => `
    <div class="file-item" ondblclick="openFile('${file.path}')">
      <span class="icon">📄</span>
      <div class="info">
        <div class="name">${file.title}</div>
        <div class="date">${file.date}</div>
      </div>
    </div>
  `).join('');
}

export function renderCategoryList(categories) {
  return categories.map(cat => `
    <div class="file-item" ondblclick="openCategory('${cat.name}')">
      <span class="icon">📁</span>
      <div class="info">
        <div class="name">${cat.name}</div>
        <div class="date">${cat.count} 篇文章</div>
      </div>
    </div>
  `).join('');
}
```

- [ ] **Step 2: 创建文件浏览器**

```javascript
// static/js/file-browser.js

class FileBrowser {
  constructor(windowId) {
    this.windowId = windowId;
    this.currentPath = '/';
  }

  async navigate(path) {
    this.currentPath = path;
    const addressBar = document.getElementById(`address-${this.windowId}`);
    addressBar.value = path;

    const content = document.getElementById(`content-${this.windowId}`);
    content.innerHTML = '<p>加载中...</p>';

    try {
      let data;
      if (path.startsWith('/posts/')) {
        // 阅读文章
        data = await this.loadPost(path);
        content.innerHTML = `<div class="markdown-body">${data}</div>`;
      } else if (path.startsWith('/category/')) {
        // 分类下的文章列表
        const category = path.replace('/category/', '');
        data = await this.loadCategory(category);
        content.innerHTML = `<div class="file-list">${data}</div>`;
      } else if (path === '/posts/') {
        // 文章列表
        data = await this.loadPostList();
        content.innerHTML = `<div class="file-list">${data}</div>`;
      } else if (path === '/category/') {
        // 分类列表
        data = await this.loadCategoryList();
        content.innerHTML = `<div class="file-list">${data}</div>`;
      } else if (path === '/about/') {
        // 关于页面
        data = await this.loadAbout();
        content.innerHTML = `<div class="markdown-body">${data}</div>`;
      }
    } catch (e) {
      content.innerHTML = `<p>加载失败: ${e.message}</p>`;
    }
  }

  async loadPost(path) {
    const slug = path.replace('/posts/', '');
    const response = await fetch(`/posts/${slug}/index.md`);
    if (!response.ok) throw new Error('文章不存在');
    const content = await response.text();
    return renderMarkdown(content);
  }

  async loadPostList() {
    const response = await fetch('/posts-list.json');
    const posts = await response.json();
    return renderFileList(posts);
  }

  async loadCategoryList() {
    const response = await fetch('/categories.json');
    const categories = await response.json();
    return renderCategoryList(categories);
  }

  async loadCategory(name) {
    const response = await fetch(`/categories/${name}.json`);
    const posts = await response.json();
    return renderFileList(posts);
  }

  async loadAbout() {
    const response = await fetch('/about/index.md');
    const content = await response.text();
    return renderMarkdown(content);
  }
}
```

- [ ] **Step 3: 更新窗口管理器支持文件浏览器**

修改 `window-manager.js` 中的 navigate 方法，使用 FileBrowser。

- [ ] **Step 4: 提交**

```bash
git add -A && git commit -m "feat: file browser and markdown rendering"
```

---

## 任务 6: Hugo API 端点与内容接口

**Files:**
- Create: `layouts/_default/single.html`
- Create: `content/posts/hello-world/index.md`
- Create: `content/about/index.md`
- Modify: `config.toml`

- [ ] **Step 1: 创建 JSON 端点布局**

在 Hugo 中创建 JSON 输出用于 API。

- [ ] **Step 2: 创建示例文章**

```markdown
---
title: "Windows XP 复古主题博客"
date: 2024-01-15
category: "技术"
---

# Windows XP 复古主题博客

这是一篇示例文章。

## 代码示例

```javascript
console.log('Hello, World!');
```

## 图片

![示例图片](/images/sample.jpg)
```

- [ ] **Step 3: 提交**

```bash
git add -A && git commit -m "feat: Hugo content and API endpoints"
```

---

## 任务 7: GitHub Actions 部署

**Files:**
- Create: `.github/workflows/deploy.yml`

- [ ] **Step 1: 创建部署工作流**

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        with:
          submodules: recursive
          fetch-depth: 0

      - name: Setup Hugo
        uses: peaceiris/actions-hugo@v3
        with:
          hugo-version: '0.123.0'

      - name: Build
        run: hugo --gc --minify

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: ./public

  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    needs: build
    runs-on: ubuntu-latest
    steps:
      - name: Deploy
        id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] **Step 2: 提交**

```bash
git add -A && git commit -m "ci: add GitHub Actions deployment"
```

---

## 任务 8: 完善与测试

- [ ] **Step 1: 添加更多示例文章**
- [ ] **Step 2: 测试 3D 动画**
- [ ] **Step 3: 测试文件浏览器导航**
- [ ] **Step 4: 测试 Markdown 渲染**
- [ ] **Step 5: 测试 GitHub Actions 部署**
- [ ] **Step 6: 提交**

```bash
git add -A && git commit -m "feat: additional content and polish"
```

---

## 任务清单总结

| 任务 | 描述 |
|------|------|
| 1 | Hugo 项目初始化 |
| 2 | 3D 开场动画 |
| 3 | XP Luna 主题 CSS |
| 4 | 桌面系统 |
| 5 | 文件浏览器与 Markdown 渲染 |
| 6 | Hugo API 端点 |
| 7 | GitHub Actions 部署 |
| 8 | 完善与测试 |

---

## 依赖关系

- 任务 1, 2, 3 可并行开发
- 任务 4 依赖任务 3
- 任务 5 依赖任务 4
- 任务 6 依赖任务 1
- 任务 7 独立
- 任务 8 依赖所有任务
