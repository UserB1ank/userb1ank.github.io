// static/js/markdown-renderer.js

// 简单的 Markdown 渲染器 (不使用外部库)
export async function renderMarkdown(content) {
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

  // 标题
  html = html.replace(/^######\s+(.+)$/gm, '<h6>$1</h6>');
  html = html.replace(/^#####\s+(.+)$/gm, '<h5>$1</h5>');
  html = html.replace(/^####\s+(.+)$/gm, '<h4>$1</h4>');
  html = html.replace(/^###\s+(.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^##\s+(.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^#\s+(.+)$/gm, '<h1>$1</h1>');

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

export function renderFileList(files) {
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

export function renderCategoryList(categories) {
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
