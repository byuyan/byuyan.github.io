/* ============================================================
   PROJECT DETAIL — 独立作品页
   内容来自 PortfolioStore（默认 content.js + 后台存进 localStorage 的改动），
   所以后台改完刷新详情页就是新的，不需要构建。
   排版复用 .project-modal__*，只是容器从弹层换成一张纸。
   ============================================================ */

(function () {
  "use strict";

  var store = window.PortfolioStore;
  var data = store ? store.load() : window.PORTFOLIO_DEFAULT || {};
  var projects = data.projects || [];
  var ordered = [];
  var profile = data.profile || {};

  var body = document.getElementById("project-body");
  var indexEl = document.getElementById("project-index");
  var pagerEl = document.getElementById("project-pager");
  var relatedEl = document.getElementById("project-related");
  var relatedGrid = document.getElementById("project-related-grid");

  function $(selector, scope) {
    return (scope || document).querySelector(selector);
  }

  function escapeHTML(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (character) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[character];
    });
  }

  function safeColor(value, fallback) {
    return /^#[0-9a-f]{3,8}$/i.test(String(value || "")) ? value : fallback;
  }

  function safeUrl(value) {
    var url = String(value || "").trim();
    if (!url) return "";
    if (/^(https?:\/\/|mailto:|data:image\/(?:png|jpe?g|webp|gif|svg\+xml);|\/|\.\/|assets\/)/i.test(url)) return url;
    return "";
  }

  function paragraphs(text) {
    return String(text || "")
      .split(/\n{2,}/)
      .map(function (block) {
        return "<p>" + escapeHTML(block).replace(/\n/g, "<br />") + "</p>";
      })
      .join("");
  }

  /* 列表页默认按「精选优先 → 年份倒序」排。
     详情页必须用同一套顺序编号，否则列表写 01、详情写 NO.02，对不上。 */
  function archiveOrder(list) {
    return list.slice().sort(function (a, b) {
      return (
        Number(!!b.featured) - Number(!!a.featured) ||
        String(b.year).localeCompare(String(a.year))
      );
    });
  }

  function rebuildOrder() {
    ordered = archiveOrder(projects);
  }

  /* ---------- 页面上的通用文案 ---------- */
  function paintProfile() {
    Array.prototype.forEach.call(document.querySelectorAll("[data-profile-name]"), function (node) {
      if (profile.name) node.textContent = profile.name;
    });
    Array.prototype.forEach.call(document.querySelectorAll("[data-profile-name-en]"), function (node) {
      if (profile.nameEn) node.textContent = String(profile.nameEn).toUpperCase();
    });
    Array.prototype.forEach.call(document.querySelectorAll("[data-profile-location]"), function (node) {
      if (profile.location) node.textContent = profile.location;
    });
    Array.prototype.forEach.call(document.querySelectorAll("[data-footer-note]"), function (node) {
      if (data.settings && data.settings.footerNote) node.textContent = data.settings.footerNote;
    });
    Array.prototype.forEach.call(document.querySelectorAll("[data-year]"), function (node) {
      node.textContent = new Date().getFullYear();
    });
  }

  /* ---------- 分享用的 meta ---------- */
  function setMeta(selector, value) {
    var node = document.querySelector(selector);
    if (node) node.setAttribute("content", value);
  }

  function paintMeta(project) {
    var name = profile.name || "个人主页";
    var title = project.title + " · " + (project.en || name);
    document.title = title;

    setMeta('meta[name="description"]', project.summary || "");
    setMeta('meta[property="og:title"]', title);
    setMeta('meta[property="og:description"]', project.summary || "");
    setMeta('meta[name="twitter:title"]', title);
    setMeta('meta[name="twitter:description"]', project.summary || "");

    var cover = safeUrl(project.cover);
    if (cover) {
      var absolute;
      try {
        absolute = new URL(cover, window.location.href).href;
      } catch (error) {
        absolute = cover;
      }
      setMeta('meta[property="og:image"]', absolute);
    }
  }

  /* ---------- 主体 ---------- */
  /* ---------- 案例五段 ----------
     一段散文读起来舒服，但招聘方看的是「你解决了什么问题、怎么解决、结果如何」。
     所以详情页把这五块拆开排版，内容全部来自后台可改的字段。
     outcome 单独做成大字：整页只要记住一句话，就记这句。 */
  var CASE_SECTIONS = [
    { key: "problem", cn: "问题", en: "PROBLEM", hint: "当时想回答什么" },
    { key: "approach", cn: "做法", en: "APPROACH", hint: "具体怎么做的" },
    { key: "outcome", cn: "结果", en: "OUTCOME", hint: "发生了什么变化", lead: true },
    { key: "cut", cn: "没有做的", en: "WHAT I CUT", hint: "主动放弃的部分", muted: true },
    { key: "learned", cn: "学到", en: "WHAT I LEARNED", hint: "下次会不一样的地方" }
  ];

  function renderCases(project) {
    var blocks = CASE_SECTIONS.map(function (section) {
      var text = String(project[section.key] || "").trim();
      if (!text) return "";
      return (
        '<section class="case-block' +
        (section.lead ? " case-block--lead" : "") +
        (section.muted ? " case-block--muted" : "") +
        '">' +
        '<header class="case-block__head">' +
        '<h2 class="case-block__title">' + escapeHTML(section.cn) + "</h2>" +
        '<span class="case-block__en">' + escapeHTML(section.en) + "</span>" +
        "</header>" +
        '<div class="case-block__body">' + paragraphs(text) + "</div>" +
        "</section>"
      );
    }).join("");

    if (!blocks) return "";

    return (
      '<div class="case-list">' +
      '<div class="case-list__head"><span>CASE NOTES</span><em>这件成果是怎么做出来的</em></div>' +
      blocks +
      "</div>"
    );
  }

  /* 截图证据。没有截图就不渲染空框——宁可少一块，也不摆一个「待补图」。 */
  function renderShots(project) {
    var shots = (project.shots || []).map(safeUrl).filter(Boolean);
    if (!shots.length) return "";
    return (
      '<div class="case-shots">' +
      shots
        .map(function (src, i) {
          return (
            '<figure class="case-shot">' +
            '<img src="' + escapeHTML(src) + '" alt="' + escapeHTML(project.title + " 界面截图 " + (i + 1)) + '" loading="lazy" />' +
            "</figure>"
          );
        })
        .join("") +
      "</div>"
    );
  }

  function renderProject(project, index) {
    var accent = safeColor(project.accent, "#a8b8a0");
    var cover = safeUrl(project.cover);
    var link = safeUrl(project.link);

    var tags = (project.tags || [])
      .map(function (tag) {
        return "<span>" + escapeHTML(tag) + "</span>";
      })
      .join("");

    var deliverables = (project.deliverables || [])
      .map(function (item) {
        return "<li>" + escapeHTML(item) + "</li>";
      })
      .join("");

    body.innerHTML =
      '<article class="project-sheet">' +
      '<div class="project-modal__grid" style="--project-accent:' + accent + '">' +
      '<div class="project-modal__visual">' +
      (cover
        ? '<div class="project-modal__visual-bg"></div><img src="' + escapeHTML(cover) + '" alt="' + escapeHTML(project.title + " 项目封面") + '" />'
        : '<div class="project-modal__fallback"><span>' + escapeHTML(project.en) + "</span></div>") +
      '<span class="project-modal__visual-index">' + escapeHTML(project.category) + "</span>" +
      "</div>" +
      '<div class="project-modal__content">' +
      '<div class="modal__eyebrow"><span>' + escapeHTML(project.category) + "</span><span>" + escapeHTML(project.year) + "</span></div>" +
      '<h1 class="project-modal__title">' + escapeHTML(project.title) + "</h1>" +
      '<p class="project-modal__en">' + escapeHTML(project.en) + "</p>" +
      '<p class="project-modal__summary">' + escapeHTML(project.summary) + "</p>" +
      '<div class="project-modal__meta">' +
      "<div><span>角色</span><strong>" + escapeHTML(project.role) + "</strong></div>" +
      "<div><span>成果</span><strong>" + escapeHTML(project.highlight) + "</strong></div>" +
      (deliverables ? "<div><span>交付物</span><ul>" + deliverables + "</ul></div>" : "") +
      "</div>" +
      '<div class="project-modal__story">' + paragraphs(project.description) + "</div>" +
      '<div class="project-modal__taglist">' + tags + "</div>" +
      (link
        ? '<a class="btn btn--primary project-modal__link" href="' + escapeHTML(link) + '" target="_blank" rel="noopener noreferrer">访问项目 <span>↗</span></a>'
        : "") +
      "</div>" +
      "</div>" +
      renderCases(project) +
      renderShots(project) +
      "</article>";

    /* 封面背景层：原弹层里由 JS 注入，这里同样补上，
       否则只剩一层平涂的 accent 色，少了那点晕开的深度 */
    var coverBg = $(".project-modal__visual-bg", body);
    if (coverBg && cover) {
      coverBg.style.backgroundImage = 'url("' + cover.replace(/"/g, "%22") + '")';
    }

    /* 封面加载失败就把图摘掉，留底色，不留破图标 */
    var image = $(".project-modal__visual img", body);
    if (image) {
      image.addEventListener("error", function () {
        image.remove();
        var visual = $(".project-modal__visual", body);
        if (visual) {
          var fallback = document.createElement("div");
          fallback.className = "project-modal__fallback";
          fallback.innerHTML = "<span>" + escapeHTML(project.en) + "</span>";
          visual.insertBefore(fallback, visual.firstChild);
        }
      });
    }

    indexEl.textContent =
      "NO. " + String(index + 1).padStart(2, "0") + " / " + String(ordered.length).padStart(2, "0");
  }

  /* ---------- 上一件 / 下一件 ---------- */
  function renderPager(index) {
    if (ordered.length < 2) {
      pagerEl.hidden = true;
      return;
    }
    var prev = ordered[(index - 1 + ordered.length) % ordered.length];
    var next = ordered[(index + 1) % ordered.length];

    pagerEl.innerHTML =
      '<a class="project-pager-link" href="project.html?p=' + encodeURIComponent(prev.id) + '">' +
      "<span>← 上一件</span><strong>" + escapeHTML(prev.title) + "</strong></a>" +
      '<a class="project-pager-link project-pager-link--next" href="project.html?p=' + encodeURIComponent(next.id) + '">' +
      "<span>下一件 →</span><strong>" + escapeHTML(next.title) + "</strong></a>";
    pagerEl.hidden = false;
  }

  /* ---------- 底部相关作品 ----------
     翻页只给「上一件/下一件」，是线性顺序；这里给「同类优先」，
     读完一件想继续看的人，多半想看的是同一类里还有什么。 */
  function renderRelated(current) {
    if (!relatedEl || !relatedGrid) return;
    var others = ordered.filter(function (item) {
      return item.id !== current.id;
    });
    if (!others.length) {
      relatedEl.hidden = true;
      return;
    }

    var sameKind = others.filter(function (item) {
      return item.category && item.category === current.category;
    });
    var picked = sameKind.slice(0, 2);
    others.forEach(function (item) {
      if (picked.length < 2 && picked.indexOf(item) === -1) picked.push(item);
    });

    relatedGrid.innerHTML = picked
      .map(function (project) {
        var accent = safeColor(project.accent, "#a8b8a0");
        var cover = safeUrl(project.cover);
        return (
          '<a class="related-card" href="project.html?p=' + encodeURIComponent(project.id) + '" style="--project-accent:' + accent + '">' +
          '<span class="related-card__cover">' +
          (cover ? '<img src="' + escapeHTML(cover) + '" alt="" loading="lazy" />' : "") +
          "</span>" +
          '<span class="related-card__body">' +
          '<span class="related-card__meta">' + escapeHTML(project.category) + " · " + escapeHTML(project.year) + "</span>" +
          '<strong class="related-card__title">' + escapeHTML(project.title) + "</strong>" +
          '<span class="related-card__summary">' + escapeHTML(project.summary) + "</span>" +
          "</span>" +
          "</a>"
        );
      })
      .join("");

    relatedEl.hidden = false;
  }

  /* ---------- 找不到这一件 ---------- */
  function renderMissing(requested) {
    document.title = "找不到这件成果 · " + (profile.name || "个人主页");
    indexEl.textContent = "";
    pagerEl.hidden = true;
    if (relatedEl) relatedEl.hidden = true;
    body.innerHTML =
      '<div class="project-page__missing">' +
      "<h1>这里没有这件成果。</h1>" +
      "<p>" +
      (requested
        ? "你要找的 <code>" + escapeHTML(requested) + "</code> 不存在，可能已经改名或者被删掉了。"
        : "这个地址没有带成果编号。") +
      "<br />回成果列表挑一件看看？" +
      "</p>" +
      '<a class="btn btn--primary" href="index.html#projects">回到作品列表 <span>↗</span></a>' +
      "</div>";
  }

  /* 导航在首屏是透明的，滚过内容后会压在正文上。
     首页由 site.js 负责加这个类，详情页没有 site.js，得自己来。 */
  function setupNav() {
    var nav = document.querySelector(".nav");
    if (!nav) return;
    var syncNav = function () {
      nav.classList.toggle("is-scrolled", window.scrollY > 32);
    };
    window.addEventListener("scroll", syncNav, { passive: true });
    syncNav();
  }

  /* ---------- 启动 ---------- */
  function boot() {
    paintProfile();
    rebuildOrder();
    setupNav();

    var params = new URLSearchParams(window.location.search);
    var wanted = (params.get("p") || params.get("id") || "").trim();

    var index = -1;
    for (var i = 0; i < ordered.length; i++) {
      if (ordered[i].id === wanted) {
        index = i;
        break;
      }
    }

    if (index === -1) {
      renderMissing(wanted);
      return;
    }

    var project = ordered[index];
    renderProject(project, index);
    renderPager(index);
    renderRelated(project);
    paintMeta(project);

    /* 后台改了内容，另一个标签页里会广播过来；这边跟着刷新 */
    if (store && typeof store.subscribe === "function") {
      store.subscribe(function (next) {
        data = next || data;
        projects = data.projects || projects;
        profile = data.profile || profile;
        rebuildOrder();
        for (var k = 0; k < ordered.length; k++) {
          if (ordered[k].id === wanted) {
            renderProject(ordered[k], k);
            renderPager(k);
            renderRelated(ordered[k]);
            paintMeta(ordered[k]);
            return;
          }
        }
        renderMissing(wanted);
      });
    }

    /* ← → 翻页，输入框里不抢键 */
    document.addEventListener("keydown", function (event) {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      var tag = (event.target && event.target.tagName) || "";
      if (/^(INPUT|TEXTAREA|SELECT)$/.test(tag)) return;
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
      if (ordered.length < 2) return;
      var step = event.key === "ArrowRight" ? 1 : -1;
      var target = ordered[(index + step + ordered.length) % ordered.length];
      if (target) window.location.href = "project.html?p=" + encodeURIComponent(target.id);
    });
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
