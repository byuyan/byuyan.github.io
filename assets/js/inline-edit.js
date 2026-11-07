/* 站内就地编辑：只在开启编辑模式时生效
   开启：网址后加 ?edit=1，或按 Ctrl / ⌘ + E；关闭：?edit=0 或工具条上的退出
   改动存在这台电脑的 localStorage，只有本机能看见；可导出 JSON 备份 */
(function () {
  "use strict";

  var STORE = "pf.inline.v1";
  var FLAG = "pf.editmode.v1";
  var SELECTOR = "h1,h2,h3,h4,p,li,dt,dd,time,figcaption,blockquote,strong,em,a,span,button,td,th";
  var HARD_SKIP = "[aria-hidden='true'],.grain,.cursor,.toast,#toast-zone,.loader,.marquee,script,style,svg,noscript";

  var editing = false;
  var active = null;
  var sourceText = "";
  var hovered = null;
  var pencil = null;
  var bar = null;
  var flashTimer = null;

  function readMap() {
    try { return JSON.parse(localStorage.getItem(STORE) || "{}") || {}; } catch (e) { return {}; }
  }
  function writeMap(m) {
    try { localStorage.setItem(STORE, JSON.stringify(m)); } catch (e) {}
  }

  function pathOf(el) {
    var parts = [], node = el, guard = 0;
    while (node && node !== document.body && node.parentElement && guard++ < 40) {
      var i = 0, sib = node;
      while ((sib = sib.previousElementSibling)) i++;
      parts.unshift(node.tagName.toLowerCase() + "." + i);
      node = node.parentElement;
    }
    return parts.join("/");
  }

  function byPath(path) {
    var node = document.body, parts = String(path || "").split("/");
    if (!parts.length || !parts[0]) return null;
    for (var i = 0; i < parts.length; i++) {
      var seg = parts[i].split("."), tag = seg[0], idx = parseInt(seg[1], 10);
      var kid = node && node.children && node.children[idx];
      if (!kid || kid.tagName.toLowerCase() !== tag) return null;
      node = kid;
    }
    return node && node !== document.body ? node : null;
  }

  function applyOverrides() {
    var map = readMap();
    Object.keys(map).forEach(function (key) {
      var rec = map[key], el = byPath(key);
      if (!rec || !el || el.tagName.toLowerCase() !== rec.tag) return;
      if (el.getAttribute("contenteditable") === "true") return;
      if (typeof rec.text === "string") el.textContent = rec.text;
      if (rec.href) el.setAttribute("href", rec.href);
    });
  }

  function isLeafText(el) {
    if (!el || el.nodeType !== 1) return false;
    if (el.children && el.children.length) return false;
    if (el.closest && el.closest(HARD_SKIP)) return false;
    if (el.closest && el.closest("#pf-bar,#pf-pencil")) return false;
    if (el.id && el.id.indexOf("pf") === 0) return false;
    var t = (el.textContent || "").replace(/\s+/g, " ").trim();
    return t.length > 0 && t.length <= 160;
  }

  function ensureUI() {
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "pf-bar";
      bar.setAttribute("aria-label", "站内编辑工具条");
      bar.innerHTML = '<span class="pf-bar__dot"></span>' +
        '<span class="pf-bar__label">编辑模式</span>' +
        '<span class="pf-bar__flash"></span>' +
        '<button type="button" data-pf="export">导出修改</button>' +
        '<button type="button" data-pf="reset">还原全部</button>' +
        '<button type="button" data-pf="exit">退出</button>';
      bar.addEventListener("click", function (e) {
        var btn = e.target.closest("button[data-pf]");
        if (!btn) return;
        var act = btn.getAttribute("data-pf");
        if (act === "export") exportJSON();
        else if (act === "reset") resetAll();
        else if (act === "exit") setMode(false);
      });
      document.body.appendChild(bar);
    }
    if (!pencil) {
      pencil = document.createElement("button");
      pencil.id = "pf-pencil";
      pencil.type = "button";
      pencil.setAttribute("aria-label", "修改这段文字");
      pencil.textContent = "✎";
      pencil.addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();
        startEdit(byPath(pencil.dataset.target));
      });
      document.body.appendChild(pencil);
    }
  }

  function hidePencil() {
    if (pencil) pencil.style.display = "none";
    if (hovered) { hovered.classList.remove("pf-hov"); hovered = null; }
  }

  function showPencil(el) {
    if (!pencil) return;
    if (hovered && hovered !== el) hovered.classList.remove("pf-hov");
    hovered = el;
    el.classList.add("pf-hov");
    var r = el.getBoundingClientRect();
    pencil.dataset.target = pathOf(el);
    pencil.style.display = "grid";
    var top = r.top + window.scrollY - 12;
    var left = r.right + window.scrollX + 4;
    var maxLeft = window.scrollX + document.documentElement.clientWidth - 28;
    pencil.style.top = Math.max(top, window.scrollY + 4) + "px";
    pencil.style.left = Math.min(left, maxLeft) + "px";
  }

  function onMove(e) {
    if (!editing || active) return;
    var t = e.target;
    if (!t || t.nodeType !== 1) return;
    if (t === pencil) return;
    if (t.closest && t.closest("#pf-bar")) { hidePencil(); return; }
    if (isLeafText(t)) showPencil(t); else hidePencil();
  }

  function flash(msg) {
    var slot = bar && bar.querySelector(".pf-bar__flash");
    if (!slot) return;
    slot.textContent = msg;
    slot.classList.add("is-on");
    if (flashTimer) clearTimeout(flashTimer);
    flashTimer = setTimeout(function () {
      slot.classList.remove("is-on");
      slot.textContent = "";
    }, 1800);
  }

  function startEdit(el) {
    if (!el || !editing) return;
    if (active && active !== el) commit(active);
    active = el;
    sourceText = el.textContent;
    el.dataset.pfPath = pathOf(el);
    el.classList.remove("pf-hov");
    el.classList.add("pf-editing");
    el.setAttribute("contenteditable", "true");
    try { el.focus(); } catch (e) {}
    var sel = window.getSelection();
    if (sel) {
      var rng = document.createRange();
      rng.selectNodeContents(el);
      rng.collapse(false);
      sel.removeAllRanges();
      sel.addRange(rng);
    }
  }

  function commit(el) {
    if (!el) return;
    var path = el.dataset.pfPath || pathOf(el);
    var text = (el.textContent || "").replace(/\s+/g, " ").trim();
    el.removeAttribute("contenteditable");
    el.classList.remove("pf-editing");
    if (active === el) active = null;
    if (!text) { el.textContent = sourceText; return; }
    if (text === (sourceText || "").trim()) return;
    var map = readMap();
    var rec = { tag: el.tagName.toLowerCase(), text: text };
    if (rec.tag === "a") {
      var href = el.getAttribute("href") || "";
      if (href.toLowerCase().indexOf("mailto:") === 0) rec.href = "mailto:" + text;
    }
    map[path] = rec;
    writeMap(map);
    el.textContent = text;
    if (rec.href) el.setAttribute("href", rec.href);
    flash("已保存（仅本机可见）");
  }

  function cancelEdit(el) {
    if (!el) return;
    el.textContent = sourceText;
    el.removeAttribute("contenteditable");
    el.classList.remove("pf-editing");
    if (active === el) active = null;
  }

  function exportJSON() {
    var map = readMap();
    var blob = new Blob([JSON.stringify(map, null, 2)], { type: "application/json" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "my-site-edits.json";
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 600);
    flash("已导出 JSON");
  }

  function resetAll() {
    if (!window.confirm("还原后本机所有文字修改会清空，继续？")) return;
    try { localStorage.removeItem(STORE); } catch (e) {}
    location.reload();
  }

  function setMode(on) {
    editing = !!on;
    try { localStorage.setItem(FLAG, editing ? "1" : "0"); } catch (e) {}
    document.documentElement.classList.toggle("pf-editmode", editing);
    if (editing) {
      ensureUI();
      bar.style.display = "flex";
      applyOverrides();
      flash("点文字就能改，悬停会出现 ✎");
    } else {
      if (active) commit(active);
      if (bar) bar.style.display = "none";
      hidePencil();
    }
  }

  document.addEventListener("mousemove", onMove, { passive: true });

  document.addEventListener("click", function (e) {
    if (!editing) return;
    var t = e.target;
    if (!t || t.nodeType !== 1) return;
    if (t.closest && t.closest("#pf-bar,#pf-pencil")) return;
    if (active && active !== t && !active.contains(t)) commit(active);
    if (isLeafText(t)) {
      e.preventDefault();
      e.stopPropagation();
      hidePencil();
      startEdit(t);
    }
  }, true);

  document.addEventListener("keydown", function (e) {
    if ((e.ctrlKey || e.metaKey) && (e.key === "e" || e.key === "E")) {
      var tg = e.target;
      if (tg && (tg.isContentEditable || /input|textarea|select/i.test(tg.tagName))) return;
      e.preventDefault();
      setMode(!editing);
      return;
    }
    if (!active) return;
    if (e.key === "Escape") { e.preventDefault(); cancelEdit(active); }
    else if (e.key === "Enter") { e.preventDefault(); commit(active); }
  });

  function init() {
    var want = null;
    try { want = new URLSearchParams(location.search).get("edit"); } catch (e) {}
    var persisted = false;
    try { persisted = localStorage.getItem(FLAG) === "1"; } catch (e) {}

    applyOverrides();
    window.addEventListener("load", function () {
      applyOverrides();
      setTimeout(applyOverrides, 700);
    });

    if (want === "1") {
      setTimeout(function () { setMode(true); }, 900);
    } else if (want === "0") {
      setMode(false);
    } else if (persisted) {
      setTimeout(function () { setMode(true); }, 900);
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
