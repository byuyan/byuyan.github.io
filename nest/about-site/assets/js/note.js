/* ============================================================
   NOTE DETAIL — 笔记独立页
   内容来自 PortfolioStore（默认 content.js + 后台存进 localStorage 的改动），
   所以后台改完刷新这个页面就是新的。
   排版复用首页 .note-reader__*，容器换成一张纸，观感和弹层时期一致。
   ============================================================ */

(function () {
  "use strict";

  var store = window.PortfolioStore;
  var data = store ? store.load() : window.PORTFOLIO_DEFAULT || {};
  var notes = data.notes || [];
  var ordered = [];
  var profile = data.profile || {};

  var body = document.getElementById("note-body");
  var indexEl = document.getElementById("note-index");
  var pagerEl = document.getElementById("note-pager");
  var relatedEl = document.getElementById("note-related");
  var relatedList = document.getElementById("note-related-list");
  var progressBar = document.getElementById("read-progress-bar");

  function $(selector, scope) {
    return (scope || document).querySelector(selector);
  }

  function escapeHTML(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (character) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[character];
    });
  }

  function paragraphs(text) {
    return String(text || "")
      .split(/\n{2,}/)
      .map(function (block) {
        return "<p>" + escapeHTML(block).replace(/\n/g, "<br />") + "</p>";
      })
      .join("");
  }

  function formatDate(value) {
    var raw = String(value || "");
    var match = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) return raw;
    return match[1] + "." + match[2] + "." + match[3];
  }

  /* 跟列表页默认排序一致：日期倒序（最新在前） */
  function archiveOrder(list) {
    return list.slice().sort(function (a, b) {
      return String(b.date).localeCompare(String(a.date));
    });
  }

  function rebuildOrder() {
    ordered = archiveOrder(notes);
  }

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

  function setMeta(selector, value) {
    var node = document.querySelector(selector);
    if (node) node.setAttribute("content", value);
  }

  function paintMeta(note) {
    var name = profile.name || "个人主页";
    var title = note.title + " · " + name;
    document.title = title;

    var summary = note.excerpt || "";
    setMeta('meta[name="description"]', summary);
    setMeta('meta[property="og:title"]', title);
    setMeta('meta[property="og:description"]', summary);
    setMeta('meta[name="twitter:title"]', title);
    setMeta('meta[name="twitter:description"]', summary);
  }

  /* ---------- 正文 ---------- */
  function renderNote(note, index) {
    body.innerHTML =
      '<article class="note-sheet">' +
      '<div class="note-reader">' +
      '<div class="note-reader__head">' +
      '<span class="tag">' + escapeHTML(note.tag) + "</span>" +
      "<span>" + escapeHTML(formatDate(note.date)) + "</span>" +
      "<span>" + escapeHTML(note.readTime) + " 阅读</span>" +
      "</div>" +
      '<h1 class="note-reader__title">' + escapeHTML(note.title) + "</h1>" +
      (note.excerpt ? '<p class="note-reader__excerpt">' + escapeHTML(note.excerpt) + "</p>" : "") +
      '<div class="note-reader__content">' + paragraphs(note.content) + "</div>" +
      '<div class="note-reader__foot">' +
      "<span>写于 " + escapeHTML(formatDate(note.date)) + "</span>" +
      "<span>— " + escapeHTML(profile.name || "") + "</span>" +
      "</div>" +
      "</div>" +
      "</article>";

    indexEl.textContent =
      "NOTE " + String(index + 1).padStart(2, "0") + " / " + String(ordered.length).padStart(2, "0");
  }

  /* ---------- 上一篇 / 下一篇 ----------
     笔记不循环：最新的那篇没有「更新一篇」，最旧的没有「更早一篇」。
     翻到第一篇还能绕回最后一篇的话，标签就名不副实了。 */
  function renderPager(index) {
    if (!pagerEl) return;
    var older = ordered[index + 1] || null;
    var newer = ordered[index - 1] || null;

    if (!older && !newer) {
      pagerEl.hidden = true;
      return;
    }

    pagerEl.innerHTML =
      (older
        ? '<a class="project-pager-link" href="note.html?n=' + encodeURIComponent(older.id) + '">' +
          "<span>← 更早一篇</span><strong>" + escapeHTML(older.title) + "</strong></a>"
        : "") +
      (newer
        ? '<a class="project-pager-link project-pager-link--next" href="note.html?n=' + encodeURIComponent(newer.id) + '">' +
          "<span>更新一篇 →</span><strong>" + escapeHTML(newer.title) + "</strong></a>"
        : "");

    pagerEl.classList.toggle("project-page__pager--single", !older || !newer);
    pagerEl.hidden = false;
  }

  /* ---------- 再读两篇 ---------- */
  function renderRelated(current) {
    if (!relatedEl || !relatedList) return;
    var others = ordered.filter(function (note) {
      return note.id !== current.id;
    });
    if (!others.length) {
      relatedEl.hidden = true;
      return;
    }

    var sameTag = others.filter(function (note) {
      return note.tag && note.tag === current.tag;
    });
    var picked = sameTag.slice(0, 2);
    others.forEach(function (note) {
      if (picked.length < 2 && picked.indexOf(note) === -1) picked.push(note);
    });

    relatedList.innerHTML = picked
      .map(function (note) {
        return (
          '<a class="note-more__card" href="note.html?n=' + encodeURIComponent(note.id) + '">' +
          '<span class="note-more__meta"><em>' + escapeHTML(note.tag) + "</em><span>" + escapeHTML(formatDate(note.date)) + "</span><span>" + escapeHTML(note.readTime) + "</span></span>" +
          '<strong class="note-more__title">' + escapeHTML(note.title) + "</strong>" +
          '<span class="note-more__excerpt">' + escapeHTML(note.excerpt) + "</span>" +
          "</a>"
        );
      })
      .join("");

    relatedEl.hidden = false;
  }

  function renderMissing(requested) {
    document.title = "找不到这篇随笔 · " + (profile.name || "个人主页");
    indexEl.textContent = "";
    if (pagerEl) pagerEl.hidden = true;
    if (relatedEl) relatedEl.hidden = true;
    body.innerHTML =
      '<div class="note-page__missing">' +
      "<h1>这里没有这篇随笔。</h1>" +
      "<p>" +
      (requested
        ? "你要找的 <code>" + escapeHTML(requested) + "</code> 不存在，可能已经改名或者被删掉了。"
        : "这个地址没有带随笔编号。") +
      "<br />回随笔列表挑一篇看看？" +
      "</p>" +
      '<a class="btn btn--primary" href="index.html#notes">回到随笔列表 <span>↗</span></a>' +
      "</div>";
  }

  /* ---------- 阅读进度 ---------- */
  function bindProgress() {
    if (!progressBar) return;
    var update = function () {
      var scrollable = document.documentElement.scrollHeight - window.innerHeight;
      var ratio = scrollable > 0 ? window.scrollY / scrollable : 0;
      progressBar.style.width = Math.min(100, Math.max(0, ratio * 100)) + "%";
    };
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    update();
  }

  /* ---------- 导航滚动状态 ---------- */
  function setupNav() {
    var nav = document.querySelector(".nav");
    if (!nav) return;
    var syncNav = function () {
      nav.classList.toggle("is-scrolled", window.scrollY > 32);
    };
    window.addEventListener("scroll", syncNav, { passive: true });
    syncNav();
  }

  function boot() {
    paintProfile();
    rebuildOrder();
    setupNav();
    bindProgress();

    var params = new URLSearchParams(window.location.search);
    var wanted = (params.get("n") || params.get("id") || "").trim();

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

    var note = ordered[index];
    renderNote(note, index);
    renderPager(index);
    renderRelated(note);
    paintMeta(note);

    if (store && typeof store.subscribe === "function") {
      store.subscribe(function (next) {
        data = next || data;
        notes = data.notes || notes;
        profile = data.profile || profile;
        rebuildOrder();
        for (var k = 0; k < ordered.length; k++) {
          if (ordered[k].id === wanted) {
            renderNote(ordered[k], k);
            renderPager(k);
            renderRelated(ordered[k]);
            paintMeta(ordered[k]);
            return;
          }
        }
        renderMissing(wanted);
      });
    }

    document.addEventListener("keydown", function (event) {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      var tag = (event.target && event.target.tagName) || "";
      if (/^(INPUT|TEXTAREA|SELECT)$/.test(tag)) return;
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
      if (ordered.length < 2) return;
      var target = event.key === "ArrowRight" ? ordered[index - 1] : ordered[index + 1];
      if (target) window.location.href = "note.html?n=" + encodeURIComponent(target.id);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
