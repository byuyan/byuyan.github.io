/* ===== 小窝 · 子页面（文章 / 作品） =====
   只做三件事：铺壁纸、把数据画成卡片、把 markdown 变成正文。
   主页那套（时钟、播放器、信箱、设置）不在这里，避免互相拖累。 */
(() => {
  'use strict';

  const $ = (s, r = document) => r.querySelector(s);
  const KEY = 'nest.prefs.v1';
  const WALLS = [
    'assets/img/wall-1.jpg',
    'assets/img/wall-2.jpg',
    'assets/img/wall-3.jpg',
  ];

  const esc = (s) => String(s === undefined || s === null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

  const showDate = (iso) => {
    const d = new Date(iso + 'T00:00:00');
    if (Number.isNaN(d.getTime())) return iso;
    return d.getFullYear() + ' 年 ' + (d.getMonth() + 1) + ' 月 ' + d.getDate() + ' 日';
  };

  /* ---------- 壁纸：跟主页共用一份偏好 ---------- */
  (function wallpaper() {
    const walls = Array.from(document.querySelectorAll('.wall'));
    if (!walls.length) return;
    let idx = 0;
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const prefs = JSON.parse(raw);
        if (typeof prefs.wall === 'number') idx = prefs.wall;
      }
    } catch (e) {}
    idx = Math.min(Math.max(0, idx), WALLS.length - 1);
    walls.forEach((el) => {
      el.classList.remove('on');
      el.style.backgroundImage = '';
    });
    walls[0].style.backgroundImage = 'url("' + WALLS[idx] + '")';
    walls[0].classList.add('on');
  })();

  /* ---------- 取数据 ---------- */
  const getJSON = (url) => fetch(url, { cache: 'no-store' }).then((r) => {
    if (!r.ok) throw new Error('HTTP ' + r.status + ' · ' + url);
    return r.json();
  });

  const failNote = (el, err) => {
    el.innerHTML = '<div class="subnote">内容没读出来：' + esc(err.message) +
      '<br>如果你是在本地直接双击打开 HTML 文件，浏览器会拦住 fetch。' +
      '换成本地预览服务（http.server）或线上地址就好了。</div>';
  };

  /* ---------- 文章列表 ---------- */
  const postList = $('#postList');
  if (postList) {
    getJSON('assets/data/posts.json')
      .then((posts) => {
        if (!posts.length) {
          postList.innerHTML = '<div class="subnote">还没有写下来的东西。</div>';
          return;
        }
        posts.sort((a, b) => (b.date > a.date ? 1 : -1));
        postList.innerHTML = posts.map((p) => {
          const href = 'post.html?p=' + encodeURIComponent(p.slug);
          return '<li class="plist__item">' +
            '<a class="plist__link" href="' + href + '">' +
              '<span class="plist__date">' + esc(p.date) + '</span>' +
              '<div class="plist__body">' +
                '<h3>' + esc(p.title) + '</h3>' +
                '<p>' + esc(p.summary) + '</p>' +
                '<div class="plist__meta">' +
                  '<span>' + esc(p.tag) + '</span>' +
                  '<span class="dot"></span>' +
                  '<span>' + esc(p.minutes) + ' 分钟</span>' +
                '</div>' +
              '</div>' +
            '</a>' +
          '</li>';
        }).join('');
      })
      .catch((err) => failNote(postList, err));
  }

  /* ---------- 单篇 ---------- */
  const articleEl = $('#article');
  if (articleEl) {
    const slug = new URLSearchParams(location.search).get('p') || '';
    getJSON('assets/data/posts.json')
      .then((posts) => {
        posts.sort((a, b) => (b.date > a.date ? 1 : -1));
        const i = posts.findIndex((p) => p.slug === slug);
        if (i < 0) {
          articleEl.innerHTML = '<div class="subnote">没找到这篇文章，可能链接写错了，' +
            '或者它已经被删掉。<a href="posts.html">回到文章列表</a></div>';
          document.title = '没找到 · 郑宇彬的小窝';
          return;
        }
        const p = posts[i];
        const newer = i > 0 ? posts[i - 1] : null;          // 更新的一篇
        const older = i < posts.length - 1 ? posts[i + 1] : null;

        document.title = p.title + ' · 郑宇彬的小窝';

        articleEl.innerHTML =
          '<header class="article__head">' +
            '<div class="article__meta">' +
              '<span>' + esc(p.tag) + '</span><span class="dot"></span>' +
              '<span>' + esc(showDate(p.date)) + '</span><span class="dot"></span>' +
              '<span>' + esc(p.minutes) + ' 分钟读完</span>' +
            '</div>' +
            '<h1 class="article__title">' + esc(p.title) + '</h1>' +
          '</header>' +
          '<div class="article__body" id="articleBody"><div class="subnote">正在读取正文…</div></div>' +
          '<nav class="pager">' +
            (newer
              ? '<a class="pager__link" href="post.html?p=' + encodeURIComponent(newer.slug) + '">' +
                  '<span>更新的一篇</span><b>' + esc(newer.title) + '</b></a>'
              : '<a class="pager__link pager__link--empty"><span>更新的一篇</span><b>已经是最新了</b></a>') +
            (older
              ? '<a class="pager__link" href="post.html?p=' + encodeURIComponent(older.slug) + '">' +
                  '<span>更早的一篇</span><b>' + esc(older.title) + '</b></a>'
              : '<a class="pager__link pager__link--empty"><span>更早的一篇</span><b>是最早的一篇</b></a>') +
          '</nav>';

        const body = $('#articleBody');
        return fetch(p.file, { cache: 'no-store' })
          .then((r) => {
            if (!r.ok) throw new Error('HTTP ' + r.status + ' · ' + p.file);
            return r.text();
          })
          .then((text) => {
            if (!window.NEST_MD) throw new Error('没载入 md.js');
            body.innerHTML = window.NEST_MD.render(text);
          })
          .catch((err) => failNote(body, err));
      })
      .catch((err) => failNote(articleEl, err));
  }

  /* ---------- 作品 ---------- */
  const workGrid = $('#workGrid');
  if (workGrid) {
    getJSON('assets/data/works.json')
      .then((works) => {
        const countEl = $('#workCount');
        if (countEl) countEl.textContent = String(works.length).padStart(2, '0');
        const filledEl = $('#workFilled');
        if (filledEl) {
          filledEl.textContent = String(works.filter((w) => !w.placeholder).length);
        }
        workGrid.innerHTML = works.map((w, i) => {
          if (w.placeholder) {
            const no = String(w.slot || i + 1).padStart(2, '0');
            return '<article class="work work--empty" data-i="' + i + '">' +
              '<div class="work__slotcover"><span>' + no + '</span></div>' +
              '<div class="work__body">' +
                '<div class="work__caption">空位 ' + no + '<small>待补</small></div>' +
                '<p class="work__summary">这里还空着，之后会放进一个还没写完的作品。' +
                '补的办法：封面图丢进 <code>assets/img</code>，再在 <code>assets/data/works.json</code> ' +
                '里把这一条的 <code>placeholder</code> 去掉，填上标题、摘要和细节。</p>' +
              '</div>' +
            '</article>';
          }
          return '<article class="work" data-i="' + i + '">' +
            '<button class="work__top" type="button" aria-expanded="false">' +
              '<img class="work__cover" src="' + esc(w.cover) + '" alt="' + esc(w.title) + ' 的封面" loading="lazy">' +
              '<div class="work__body">' +
                '<div class="work__caption">' + esc(w.title) +
                  '<small>' + esc(w.category) + ' · ' + esc(w.year) + '</small>' +
                '</div>' +
                '<p class="work__summary">' + esc(w.summary) + '</p>' +
                '<div class="work__foot">' +
                  '<span class="work__hi">' + esc(w.highlight) + '</span>' +
                  '<span class="work__more"><span>展开细节</span>' +
                    '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.2"><path d="M5 9l7 7 7-7"/></svg>' +
                  '</span>' +
                '</div>' +
              '</div>' +
            '</button>' +
            '<div class="work__detail">' +
              '<p>' + esc(w.desc) + '</p>' +
              '<dl class="work__rows">' +
                '<dt>我做的</dt><dd>' + esc(w.role) + '</dd>' +
                '<dt>交付物</dt><dd>' + esc(w.deliverables.join(' · ')) + '</dd>' +
              '</dl>' +
              '<div class="work__tags">' +
                w.tags.map((t) => '<span>' + esc(t) + '</span>').join('') +
              '</div>' +
              (w.href
                ? '<a class="work__link" href="' + esc(w.href) + '" target="_blank" rel="noopener">看完整故事 ↗</a>'
                : '') +
            '</div>' +
          '</article>';
        }).join('');

        workGrid.addEventListener('click', (ev) => {
          const btn = ev.target.closest('.work__top');
          if (!btn) return;
          const card = btn.closest('.work');
          const open = card.classList.toggle('is-open');
          btn.setAttribute('aria-expanded', open ? 'true' : 'false');
        });
      })
      .catch((err) => failNote(workGrid, err));
  }
})();
