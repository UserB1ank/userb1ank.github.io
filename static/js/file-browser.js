// static/js/file-browser.js

class FileBrowser {
  constructor(windowId) {
    this.windowId = windowId;
    this.currentPath = '/';
    this.cache = new Map();
  }

  async navigate(path) {
    this.currentPath = path;
    const addressBar = document.getElementById(`address-${this.windowId}`);
    const content = document.getElementById(`content-${this.windowId}`);

    if (addressBar) {
      addressBar.value = path;
    }

    if (content) {
      content.innerHTML = '<div class="loading">加载中...</div>';
    }

    try {
      let data;
      if (path.startsWith('/posts/') && path.endsWith('/')) {
        // 阅读文章
        data = await this.loadPost(path);
        if (content) content.innerHTML = `<div class="markdown-body">${data}</div>`;
      } else if (path.startsWith('/category/') && path.endsWith('/')) {
        // 分类下的文章列表
        const category = decodeURIComponent(path.replace('/category/', '').replace('/', ''));
        data = await this.loadCategory(category);
        if (content) content.innerHTML = `<div class="file-list">${data}</div>`;
        this.bindFileItemEvents();
      } else if (path === '/posts/' || path === '/posts') {
        // 文章列表
        data = await this.loadPostList();
        if (content) content.innerHTML = `<div class="file-list">${data}</div>`;
        this.bindFileItemEvents();
      } else if (path === '/category/' || path === '/category') {
        // 分类列表
        data = await this.loadCategoryList();
        if (content) content.innerHTML = `<div class="file-list">${data}</div>`;
        this.bindCategoryItemEvents();
      } else if (path === '/about/' || path === '/about') {
        // 关于页面
        data = await this.loadAbout();
        if (content) content.innerHTML = `<div class="markdown-body">${data}</div>`;
      } else {
        // 默认：文章列表
        data = await this.loadPostList();
        if (content) content.innerHTML = `<div class="file-list">${data}</div>`;
        this.bindFileItemEvents();
      }
    } catch (e) {
      console.error('Navigation error:', e);
      if (content) {
        content.innerHTML = `<div style="padding: 20px; color: red;">加载失败: ${e.message}</div>`;
      }
    }
  }

  async loadPost(path) {
    const slug = path.replace('/posts/', '').replace(/\/$/, '');
    const cacheKey = `post:${slug}`;

    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      const response = await fetch(`/posts/${slug}/index.json`);
      if (response.ok) {
        const data = await response.json();
        // Hugo 已经把 markdown 渲染成 HTML 了，直接使用
        this.cache.set(cacheKey, data.content || '');
        return data.content || '<p>文章内容为空</p>';
      }
    } catch (e) {
      console.error('Failed to load post:', e);
    }

    // 回退到直接获取 markdown
    try {
      const response = await fetch(`/posts/${slug}/index.md`);
      if (!response.ok) throw new Error('文章不存在');
      const content = await response.text();
      const html = await renderMarkdown(content);
      this.cache.set(cacheKey, html);
      return html;
    } catch (e) {
      throw new Error('文章不存在');
    }
  }

  async loadPostList() {
    const cacheKey = 'posts:list';

    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      // 使用 index.json 作为文章列表
      const response = await fetch('/index.json');
      if (response.ok) {
        const posts = await response.json();
        const html = renderFileList(posts);
        this.cache.set(cacheKey, html);
        return html;
      }
    } catch (e) {
      // 忽略错误
    }

    return '<p style="padding: 20px; color: #666;">无法加载文章列表</p>';
  }

  async loadCategoryList() {
    const cacheKey = 'categories:list';

    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      // 从 index.json 构建分类列表
      const response = await fetch('/index.json');
      if (response.ok) {
        const posts = await response.json();
        const categoryMap = {};
        posts.forEach(post => {
          if (post.category) {
            if (categoryMap[post.category]) {
              categoryMap[post.category]++;
            } else {
              categoryMap[post.category] = 1;
            }
          }
        });
        const categories = Object.entries(categoryMap).map(([name, count]) => ({ name, count }));
        const html = renderCategoryList(categories);
        this.cache.set(cacheKey, html);
        return html;
      }
    } catch (e) {
      // 忽略错误
    }

    return '<p style="padding: 20px; color: #666;">无法加载分类列表</p>';
  }

  async loadCategory(name) {
    const cacheKey = `category:${name}`;

    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      // 从 index.json 过滤该分类下的文章
      const response = await fetch('/index.json');
      if (response.ok) {
        const posts = await response.json();
        const filteredPosts = posts.filter(post => post.category === name);
        const html = renderFileList(filteredPosts);
        this.cache.set(cacheKey, html);
        return html;
      }
    } catch (e) {
      // 忽略错误
    }

    return '<p style="padding: 20px; color: #666;">分类不存在</p>';
  }

  async loadAbout() {
    const cacheKey = 'about';

    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      const response = await fetch('/about/index.json');
      if (response.ok) {
        const data = await response.json();
        // Hugo 已经把 markdown 渲染成 HTML 了，直接使用
        this.cache.set(cacheKey, data.content || '');
        return data.content || '<p>关于页面内容为空</p>';
      }
    } catch (e) {
      console.error('Failed to load about:', e);
    }

    // 回退到 markdown
    try {
      const response = await fetch('/about/index.md');
      if (!response.ok) throw new Error('关于页面不存在');
      const content = await response.text();
      const html = await renderMarkdown(content);
      this.cache.set(cacheKey, html);
      return html;
    } catch (e) {
      return '<p>关于页面不存在</p>';
    }
  }

  bindFileItemEvents() {
    setTimeout(() => {
      const content = document.getElementById(`content-${this.windowId}`);
      if (!content) return;

      content.querySelectorAll('.file-item').forEach(item => {
        item.addEventListener('dblclick', () => {
          const path = item.dataset.path;
          if (path) {
            // 直接使用 FileBrowser 的 navigate，它会正确更新地址栏和历史
            this.navigate(path);
          }
        });

        item.addEventListener('click', () => {
          content.querySelectorAll('.file-item').forEach(i => i.classList.remove('selected'));
          item.classList.add('selected');
        });
      });
    }, 100);
  }

  bindCategoryItemEvents() {
    setTimeout(() => {
      const content = document.getElementById(`content-${this.windowId}`);
      if (!content) return;

      content.querySelectorAll('.category-item').forEach(item => {
        item.addEventListener('dblclick', () => {
          const category = item.dataset.category;
          if (category) {
            const path = `/category/${encodeURIComponent(category)}/`;
            const addressBar = document.getElementById(`address-${this.windowId}`);
            if (addressBar) {
              addressBar.value = path;
            }
            this.navigate(path);
          }
        });

        item.addEventListener('click', () => {
          content.querySelectorAll('.category-item').forEach(i => i.classList.remove('selected'));
          item.classList.add('selected');
        });
      });
    }, 100);
  }
}

// 暴露给全局
window.FileBrowser = FileBrowser;
