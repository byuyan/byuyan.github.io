/* ===== 小窝 · 极简 markdown 渲染 =====
   只覆盖写博客会用到的那点语法：标题、段落、列表、引用、代码块、
   分隔线、粗体、斜体、行内代码、链接、图片。
   先转义再套标签，正文里出现 < 也不会把页面搞坏。 */
(() => {
  'use strict';

  const esc = (s) => s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

  function inline(text) {
    let t = esc(text);
    t = t.replace(/`([^`]+)`/g, '<code>$1</code>');
    t = t.replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, '<img alt="$1" src="$2" loading="lazy">');
    t = t.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener">$1</a>');
    t = t.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    t = t.replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>');
    return t;
  }

  function render(src) {
    const lines = String(src).replace(/\r\n/g, '\n').split('\n');
    const out = [];
    let para = [];
    let list = null;      // 'ul' | 'ol'
    let quote = [];
    let code = null;      // 代码块内容

    const flushPara = () => {
      if (!para.length) return;
      out.push('<p>' + inline(para.join(' ')) + '</p>');
      para = [];
    };
    const flushList = () => {
      if (!list) return;
      out.push('<' + list + '>' + listItems.join('') + '</' + list + '>');
      list = null;
      listItems = [];
    };
    const flushQuote = () => {
      if (!quote.length) return;
      out.push('<blockquote>' + inline(quote.join(' ')) + '</blockquote>');
      quote = [];
    };
    let listItems = [];
    const flushAll = () => { flushPara(); flushList(); flushQuote(); };

    for (const raw of lines) {
      const line = raw.replace(/\s+$/, '');

      if (code !== null) {
        if (/^```/.test(line)) {
          out.push('<pre><code>' + esc(code.join('\n')) + '</code></pre>');
          code = null;
        } else {
          code.push(raw);
        }
        continue;
      }

      if (/^```/.test(line)) { flushAll(); code = []; continue; }
      if (!line.trim()) { flushAll(); continue; }

      const h = line.match(/^(#{1,4})\s+(.*)$/);
      if (h) {
        flushAll();
        const n = h[1].length;
        out.push('<h' + n + '>' + inline(h[2]) + '</h' + n + '>');
        continue;
      }

      if (/^(-{3,}|\*{3,})$/.test(line.trim())) { flushAll(); out.push('<hr>'); continue; }

      const q = line.match(/^>\s?(.*)$/);
      if (q) { flushPara(); flushList(); quote.push(q[1]); continue; }

      const ul = line.match(/^[-*]\s+(.*)$/);
      if (ul) {
        flushPara(); flushQuote();
        if (list !== 'ul') { flushList(); list = 'ul'; }
        listItems.push('<li>' + inline(ul[1]) + '</li>');
        continue;
      }

      const ol = line.match(/^\d+\.\s+(.*)$/);
      if (ol) {
        flushPara(); flushQuote();
        if (list !== 'ol') { flushList(); list = 'ol'; }
        listItems.push('<li>' + inline(ol[1]) + '</li>');
        continue;
      }

      if (list) {
        // 列表项里的续行，接到上一项后面
        listItems[listItems.length - 1] = listItems[listItems.length - 1].replace(/<\/li>$/, ' ' + inline(line) + '</li>');
        continue;
      }

      if (quote.length) { quote.push(line); continue; }

      para.push(line);
    }

    if (code !== null) out.push('<pre><code>' + esc(code.join('\n')) + '</code></pre>');
    flushAll();
    return out.join('\n');
  }

  window.NEST_MD = { render };
})();
