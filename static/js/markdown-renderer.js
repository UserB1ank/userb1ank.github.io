// static/js/markdown-renderer.js

// 提取渲染后 HTML 中的标题生成目录
// 锚点 ID 直接取自正文标题元素，保证与 Hugo 渲染结果一致
window.extractToc = function(content) {
  const headings = [];
  const doc = new DOMParser().parseFromString(content, 'text/html');

  doc.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach((el, index) => {
    headings.push({
      level: parseInt(el.tagName[1], 10),
      text: el.textContent.trim(),
      id: el.id,
      line: index
    });
  });

  return headings;
}

// 渲染目录
window.renderToc = function(headings, windowId) {
  if (!headings || headings.length === 0) {
    return '';
  }

  let html = '';
  html += `<div class="article-toc" id="article-toc-${windowId}">`;
  html += `<div class="article-toc-header" onclick="window.toggleToc('${windowId}')" style="cursor:pointer;">`;
  html += `<span class="article-toc-title">目录</span>`;
  html += `<button class="article-toc-toggle" onclick="event.stopPropagation(); window.toggleToc('${windowId}')" title="隐藏目录">`;
  html += `<svg viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6"/></svg>`;
  html += `</button>`;
  html += `</div>`;
  html += `<div class="article-toc-content" id="toc-content-${windowId}">`;
  html += `<ul class="toc-list">`;

  headings.forEach((heading, i) => {
    const nextHeading = headings[i + 1];
    const nextLevel = nextHeading ? nextHeading.level : heading.level;

    html += `<li class="toc-item toc-level-${heading.level}">`;
    html += `<a href="#${heading.id}" class="toc-link" data-id="${heading.id}" onclick="window.scrollToHeading('${heading.id}'); return false;">${heading.text}</a>`;

    if (nextLevel > heading.level) {
      html += `<ul class="toc-list">`;
    } else if (nextLevel < heading.level) {
      const diff = heading.level - nextLevel;
      for (let d = 0; d < diff; d++) {
        html += `</ul></li>`;
      }
    } else {
      html += `</li>`;
    }
  });

  html += '</ul></div></div>';
  return html;
}

window.toggleToc = function(windowId) {
  const toc = document.getElementById(`article-toc-${windowId}`);
  const tocContent = document.getElementById(`toc-content-${windowId}`);
  const wrapper = document.getElementById(`article-with-toc-${windowId}`);
  if (toc && tocContent) {
    tocContent.classList.toggle('collapsed');
    toc.classList.toggle('collapsed');
    const isCollapsed = tocContent.classList.contains('collapsed');
    if (wrapper) {
      wrapper.classList.toggle('toc-collapsed', isCollapsed);
    }
    const btn = toc.querySelector('.article-toc-toggle');
    if (btn) {
      btn.title = isCollapsed ? '显示目录' : '隐藏目录';
    }
  }
}

window.scrollToHeading = function(headingId) {
  const element = document.getElementById(headingId);
  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

window.showBackToTop = function(windowId, show) {
  let btn = document.getElementById(`back-to-top-${windowId}`);
  if (!btn && show) {
    btn = document.createElement('button');
    btn.id = `back-to-top-${windowId}`;
    btn.className = 'back-to-top';
    btn.innerHTML = `<svg viewBox="0 0 24 24"><path d="M18 15l-6-6-6 6"/></svg>`;
    btn.onclick = () => {
      const content = document.querySelector(`#content-${windowId} .article-content`);
      if (content) {
        content.scrollTo({ top: 0, behavior: 'smooth' });
      }
    };
    document.body.appendChild(btn);
  }
  if (btn) {
    btn.classList.toggle('visible', show);
  }
}

// 简单的 Markdown 渲染器 (不使用外部库)
// 挂载到全局
window.renderMarkdown = async function(content) {
  let html = content;

  // 转义 HTML
  html = html.replace(/&/g, '&amp;')
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;');

  // 代码块 (必须在行内代码之前处理)
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (match, lang, code) => {
    return `<pre><code class="language-${lang}">${code.trim()}</code></pre>`;
  });

  // 行内代码
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

  // 标题 (带锚点ID)
  const headingTags = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'];
  headingTags.forEach((tag, i) => {
    const level = i + 1;
    html = html.replace(new RegExp(`^#{${level}}\\s+(.+)$`, 'gm'), (match, text) => {
      const id = text.toLowerCase().replace(/[^\u4e00-\u9fa5a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      return `<${tag} id="${id}">${text}</${tag}>`;
    });
  });

  // 粗体和斜体
  html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
  html = html.replace(/___(.+?)___/g, '<strong><em>$1</em></strong>');
  html = html.replace(/__(.+?)__/g, '<strong>$1</strong>');
  html = html.replace(/_(.+?)_/g, '<em>$1</em>');

  // 删除线
  html = html.replace(/~~(.+?)~~/g, '<del>$1</del>');

  // 引用
  html = html.replace(/^&gt;\s+(.+)$/gm, '<blockquote>$1</blockquote>');
  // 合并连续的引用
  html = html.replace(/<\/blockquote>\n<blockquote>/g, '\n');

  // 无序列表
  html = html.replace(/^[\*\-]\s+(.+)$/gm, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>)\n(?=<li>)/g, '$1');
  html = html.replace(/(<li>[\s\S]*?<\/li>)(?![\s\S]*?(<li>|<\/ul>))/, '<ul>$1</ul>');

  // 有序列表
  html = html.replace(/^\d+\.\s+(.+)$/gm, '<li>$1</li>');

  // 图片
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1">');

  // 链接
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

  // 水平线
  html = html.replace(/^---$/gm, '<hr>');
  html = html.replace(/^\*\*\*$/gm, '<hr>');

  // 段落 (双换行分隔)
  html = html.split(/\n\n+/).map(block => {
    // 跳过已处理的块级元素
    if (block.match(/^<(h[1-6]|ul|ol|li|pre|blockquote|hr|img)/)) {
      return block;
    }
    return `<p>${block.replace(/\n/g, '<br>')}</p>`;
  }).join('\n');

  return html;
}

window.renderFileList = function(files) {
  if (!files || files.length === 0) {
    return '<p style="padding: 20px; color: #666;">暂无内容</p>';
  }

  return files.map(file => `
    <div class="file-item" data-path="${file.path}">
      <span class="icon">📄</span>
      <div class="info">
        <div class="name">${escapeHtml(file.title)}</div>
        <div class="date">${file.date || ''}</div>
      </div>
    </div>
  `).join('');
}

window.renderCategoryList = function(categories) {
  if (!categories || categories.length === 0) {
    return '<p style="padding: 20px; color: #666;">暂无分类</p>';
  }

  return categories.map(cat => `
    <div class="category-item" data-category="${escapeHtml(cat.name)}">
      <span class="icon">📁</span>
      <span class="name">${escapeHtml(cat.name)}</span>
      <span class="count">${cat.count} 篇文章</span>
    </div>
  `).join('');
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
