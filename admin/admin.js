/* ============================================================
   ZHENG YUBIN — CONTENT STUDIO
   Vanilla JS admin for the static portfolio. Content is read
   from / written to window.PortfolioStore (the same localStorage
   key the public site uses). No frameworks, no network, no build.
   ============================================================ */

(function () {
  "use strict";

  /* ------------------------------------------------------------
     Configuration
     ------------------------------------------------------------ */

  const SECTIONS = [
    { id: "overview", num: "01", label: "概览", en: "OVERVIEW" },
    { id: "projects", num: "02", label: "作品管理", en: "PROJECTS" },
    { id: "notes", num: "03", label: "文章管理", en: "NOTES" },
    { id: "profile", num: "04", label: "个人资料", en: "PROFILE" },
    { id: "skills", num: "05", label: "技能与履历", en: "SKILLS · TIMELINE" },
    { id: "settings", num: "06", label: "网站设置", en: "SETTINGS" }
  ];

  const AUTOSAVE_DELAY = 800;
  const MAX_IMAGE_BYTES = 1.5 * 1024 * 1024;
  const MAX_IMPORT_BYTES = 8 * 1024 * 1024;
  const ACCENT_PRESETS = ["#df6249", "#a8b8a0", "#f0c75e", "#b8cfd3", "#71836a"];

  /* ------------------------------------------------------------
     DOM & state
     ------------------------------------------------------------ */

  const dom = {};

  const state = {
    data: null,
    section: "overview",
    dirty: false,
    saveError: false,
    saveTimer: null,
    lastSavedAt: null,
    loadedLocalCopy: false,
    lastExternalAt: 0,
    draft: null,
    confirm: null,
    pendingImport: null
  };

  /* ============================================================
     Utilities
     ============================================================ */

  const WEEKDAYS = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function escapeAttr(value) {
    return escapeHtml(value);
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function isPlainObject(value) {
    return !!value && typeof value === "object" && !Array.isArray(value);
  }

  function deepMerge(base, extra) {
    if (Array.isArray(base)) {
      return Array.isArray(extra) ? clone(extra) : clone(base);
    }
    if (isPlainObject(base)) {
      const out = {};
      Object.keys(base).forEach(function (key) {
        out[key] = deepMerge(base[key], isPlainObject(extra) ? extra[key] : undefined);
      });
      if (isPlainObject(extra)) {
        Object.keys(extra).forEach(function (key) {
          if (!(key in out)) out[key] = clone(extra[key]);
        });
      }
      return out;
    }
    return extra === undefined ? base : clone(extra);
  }

  function getByPath(root, path) {
    return path.split(".").reduce(function (acc, key) {
      return acc == null ? undefined : acc[key];
    }, root);
  }

  function setByPath(root, path, value) {
    const keys = path.split(".");
    let target = root;
    for (let i = 0; i < keys.length - 1; i += 1) {
      const key = keys[i];
      if (!target[key] || typeof target[key] !== "object") {
        target[key] = /^\d+$/.test(keys[i + 1]) ? [] : {};
      }
      target = target[key];
    }
    target[keys[keys.length - 1]] = value;
  }

  function setBindValue(bind, value) {
    if (bind.startsWith("draft.")) {
      if (!state.draft) return;
      setByPath(state.draft.item, bind.slice(6), value);
      return;
    }
    setByPath(state.data, bind, value);
  }

  function fieldId(bind) {
    return "f-" + bind.replace(/[^a-zA-Z0-9_-]+/g, "-");
  }

  function findBind(bind) {
    return document.querySelector('[data-bind="' + bind + '"]');
  }

  function pad2(value) {
    return String(value).padStart(2, "0");
  }

  function formatCount(value) {
    return pad2(Number(value) || 0);
  }

  function formatDateCN(date) {
    return date.getFullYear() + "." + pad2(date.getMonth() + 1) + "." + pad2(date.getDate());
  }

  function todayISO() {
    const date = new Date();
    return date.getFullYear() + "-" + pad2(date.getMonth() + 1) + "-" + pad2(date.getDate());
  }

  function formatSize(bytes) {
    const value = Number(bytes) || 0;
    if (value >= 1024 * 1024) return (value / 1024 / 1024).toFixed(1) + " MB";
    if (value >= 1024) return Math.round(value / 1024) + " KB";
    return value + " B";
  }

  function dataUrlSize(dataUrl) {
    const parts = String(dataUrl || "").split(",");
    if (parts.length < 2) return 0;
    return Math.floor((parts[1].length * 3) / 4);
  }

  function contentSizeLabel() {
    try {
      const bytes = new Blob([JSON.stringify(state.data)]).size;
      return formatSize(bytes);
    } catch (error) {
      return "—";
    }
  }

  function formatRelativeTime(timestamp) {
    if (!timestamp) return "—";
    const diff = Date.now() - timestamp;
    if (diff < 0) return "刚刚";
    if (diff < 10000) return "刚刚";
    if (diff < 60000) return Math.floor(diff / 1000) + " 秒前";
    if (diff < 3600000) return Math.floor(diff / 60000) + " 分钟前";
    const date = new Date(timestamp);
    const time = pad2(date.getHours()) + ":" + pad2(date.getMinutes());
    const now = new Date();
    if (date.toDateString() === now.toDateString()) return "今天 " + time;
    return date.getMonth() + 1 + " 月 " + date.getDate() + " 日 " + time;
  }

  function safeHex(value, fallback) {
    const text = String(value || "").trim();
    return /^#[0-9a-fA-F]{6}$/.test(text) ? text.toLowerCase() : fallback;
  }

  function inkFor(hex) {
    const safe = safeHex(hex, "#a8b8a0").slice(1);
    const channels = [0, 2, 4].map(function (offset) {
      const value = parseInt(safe.slice(offset, offset + 2), 16) / 255;
      return value <= 0.03928 ? value / 12.92 : Math.pow((value + 0.055) / 1.055, 2.4);
    });
    const luminance = 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
    return luminance > 0.35 ? "#16170f" : "#fbf9f4";
  }

  function uniqueId(prefix) {
    return prefix + "-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 6);
  }

  // Content stores covers relative to the site root ("assets/img/...").
  // The studio lives one level deeper, so resolve for preview only.
  function resolveAssetUrl(value) {
    const source = String(value || "").trim();
    if (!source) return "";
    if (/^(data:|blob:|https?:\/\/|\/\/|\/|#)/i.test(source)) return source;
    if (source.startsWith("../")) return source;
    return "../" + source.replace(/^\.\//, "");
  }

  function countParagraphs(content) {
    const text = String(content || "").trim();
    if (!text) return 0;
    return text.split(/\n\s*\n/).filter(function (part) {
      return part.trim().length > 0;
    }).length;
  }

  function clampLevel(value) {
    const number = Number(value);
    if (!Number.isFinite(number)) return 70;
    return Math.max(0, Math.min(100, Math.round(number)));
  }

  function currentSection() {
    return (
      SECTIONS.find(function (section) {
        return section.id === state.section;
      }) || SECTIONS[0]
    );
  }

  /* ============================================================
     Persistence & save state
     ============================================================ */

  function loadData() {
    state.data = PortfolioStore.load();
    state.loadedLocalCopy = PortfolioStore.hasLocalCopy();
    const meta = state.data && state.data._meta;
    const savedAt = meta && meta.updatedAt ? Date.parse(meta.updatedAt) : NaN;
    state.lastSavedAt = Number.isFinite(savedAt) ? savedAt : null;
    ensureDataShape();
  }

  function ensureDataShape() {
    if (!state.data || typeof state.data !== "object") state.data = PortfolioStore.defaults();
    const data = state.data;
    if (!data.profile) data.profile = {};
    if (!Array.isArray(data.projects)) data.projects = [];
    if (!Array.isArray(data.notes)) data.notes = [];
    if (!Array.isArray(data.skills)) data.skills = [];
    if (!Array.isArray(data.timeline)) data.timeline = [];
    if (!Array.isArray(data.stats)) data.stats = [];
    if (!data.settings) data.settings = {};
  }

  function isQuotaError(error) {
    if (!error) return false;
    return (
      error.name === "QuotaExceededError" ||
      error.name === "NS_ERROR_DOM_QUOTA_REACHED" ||
      error.code === 22 ||
      error.code === 1014
    );
  }

  function saveStateLabel() {
    if (state.saveError) return "保存失败";
    if (state.dirty) return "未保存";
    return "已保存";
  }

  function lastSavedText() {
    if (state.saveError) return "保存失败，待重试";
    if (state.dirty) return "有未保存改动";
    if (state.lastSavedAt) return formatRelativeTime(state.lastSavedAt);
    if (state.loadedLocalCopy) return "本地副本（无时间记录）";
    return "默认内容（尚未修改）";
  }

  function updateSaveUI() {
    if (!dom.saveState || !dom.saveStateText) return;
    dom.saveStateText.textContent = saveStateLabel();
    dom.saveState.classList.toggle("is-dirty", state.dirty && !state.saveError);
    dom.saveState.classList.toggle("is-error", !!state.saveError);
    const section = currentSection();
    document.title =
      (state.dirty && !state.saveError ? "● " : "") +
      section.label +
      " · 内容工作台 · 郑宇彬";
  }

  function updateOverviewStatus() {
    const saveEl = document.getElementById("overview-save-state");
    if (saveEl) {
      saveEl.textContent = saveStateLabel();
      saveEl.classList.toggle("is-accent", state.dirty || state.saveError);
    }
    const lastEl = document.getElementById("overview-last-saved");
    if (lastEl) lastEl.textContent = lastSavedText();
  }

  function updateMetaTexts() {
    const stored = PortfolioStore.hasLocalCopy();
    const size = contentSizeLabel();
    if (dom.storageMeta) {
      dom.storageMeta.textContent = "LOCAL COPY · " + (stored ? "ACTIVE" : "DEFAULT") + " · " + size;
    }
    if (dom.footerStorage) {
      dom.footerStorage.textContent = "LOCAL ONLY · " + (stored ? "SAVED COPY" : "DEFAULTS") + " · " + size;
    }
    updateOverviewStatus();
    const sizeEl = document.getElementById("overview-size");
    if (sizeEl) sizeEl.textContent = "约 " + size;
  }

  function markDirty() {
    state.dirty = true;
    state.saveError = false;
    updateSaveUI();
    updateOverviewStatus();
    scheduleAutosave();
  }

  function scheduleAutosave() {
    if (state.saveTimer) clearTimeout(state.saveTimer);
    state.saveTimer = setTimeout(function () {
      state.saveTimer = null;
      saveNow({ silent: true });
    }, AUTOSAVE_DELAY);
  }

  function saveNow(options) {
    const opts = options || {};
    if (state.saveTimer) {
      clearTimeout(state.saveTimer);
      state.saveTimer = null;
    }
    try {
      state.data._meta = { updatedAt: new Date().toISOString(), studio: "lzy-studio" };
      PortfolioStore.save(state.data);
      state.dirty = false;
      state.saveError = false;
      state.lastSavedAt = Date.now();
      updateSaveUI();
      updateMetaTexts();
      if (opts.toast) toast("已保存到本浏览器", "success");
      return true;
    } catch (error) {
      state.saveError = true;
      updateSaveUI();
      updateMetaTexts();
      const quota = isQuotaError(error);
      toast(
        quota
          ? "保存失败：浏览器本地存储空间不足（约 5MB 上限）。请压缩封面 / 头像图片、改用图片链接，或先导出 JSON 备份。"
          : "保存失败：" + (error && error.message ? error.message : "未知错误") + "。请稍后重试。",
        "error",
        8000
      );
      return false;
    }
  }

  /* ============================================================
     Toasts
     ============================================================ */

  function removeToast(element) {
    if (!element || element.dataset.leaving === "1") return;
    element.dataset.leaving = "1";
    if (element._timer) clearTimeout(element._timer);
    element.classList.add("is-leaving");
    setTimeout(function () {
      element.remove();
    }, 260);
  }

  function toast(message, type, duration) {
    if (!dom.toastZone) return;
    const element = document.createElement("div");
    element.className = "toast toast--" + (type || "success");
    element.setAttribute("role", type === "error" ? "alert" : "status");

    const text = document.createElement("p");
    text.textContent = message;

    const close = document.createElement("button");
    close.type = "button";
    close.className = "toast__close";
    close.setAttribute("aria-label", "关闭提示");
    close.textContent = "×";
    close.addEventListener("click", function () {
      removeToast(element);
    });

    element.appendChild(text);
    element.appendChild(close);
    dom.toastZone.appendChild(element);

    // Keep at most three toasts on screen. Remove overflow immediately
    // (a delayed animation must never leave the loop unable to progress).
    while (dom.toastZone.children.length > 3) {
      const oldest = dom.toastZone.firstElementChild;
      if (!oldest) break;
      if (oldest._timer) clearTimeout(oldest._timer);
      oldest.remove();
    }

    element._timer = setTimeout(function () {
      removeToast(element);
    }, duration || 3600);
  }

  /* ============================================================
     Dialog helpers
     ============================================================ */

  function closeDialog(dialog) {
    if (dialog && dialog.open) dialog.close();
  }

  function closeTopDialog() {
    const dialogs = [dom.projectDialog, dom.noteDialog, dom.confirmDialog, dom.importDialog];
    for (let i = dialogs.length - 1; i >= 0; i -= 1) {
      if (dialogs[i] && dialogs[i].open) {
        dialogs[i].close();
        return;
      }
    }
  }

  function askConfirm(config) {
    state.confirm = config;
    dom.confirmDialog.innerHTML =
      '<header class="modal__head">' +
      '<div class="modal__head-text">' +
      '<p class="modal__eyebrow">' + escapeHtml(config.eyebrow || "CONFIRM") + "</p>" +
      '<h2 class="modal__title" id="confirm-dialog-title">' + escapeHtml(config.title || "确认操作") + "</h2>" +
      "</div>" +
      '<button class="icon-btn modal__close" type="button" data-action="close-dialog" aria-label="关闭">✕</button>' +
      "</header>" +
      '<div class="modal__body">' +
      '<p class="confirm__message">' + (config.message || "") + "</p>" +
      (config.hint ? '<p class="confirm__hint">' + config.hint + "</p>" : "") +
      "</div>" +
      '<footer class="modal__foot modal__foot--end">' +
      '<div class="modal__foot-right">' +
      (config.cancelLabel === null
        ? ""
        : '<button class="btn btn--ghost btn--sm" type="button" data-action="close-dialog">取消</button>') +
      '<button class="btn ' + (config.danger ? "btn--coral" : "") + ' btn--sm" type="button" data-action="confirm-ok">' +
      escapeHtml(config.confirmLabel || "确认") +
      "</button>" +
      "</div>" +
      "</footer>";
    if (dom.confirmDialog.open) dom.confirmDialog.close();
    dom.confirmDialog.showModal();
  }

  function showMessage(title, message) {
    askConfirm({
      eyebrow: "NOTICE",
      title: title,
      message: message,
      confirmLabel: "知道了",
      cancelLabel: null
    });
  }

  /* ============================================================
     Form field helpers
     ============================================================ */

  function field(config) {
    const id = fieldId(config.bind);
    const spanClass = config.span === 3 ? " field--span3" : config.span ? " field--span2" : "";
    const label =
      '<label class="field__label" for="' + id + '">' +
      escapeHtml(config.label) +
      (config.en ? ' <span class="mono">' + escapeHtml(config.en) + "</span>" : "") +
      "</label>";

    let control;
    if (config.type === "textarea") {
      const tall = (config.rows || 4) >= 5 ? " input--tall" : "";
      control =
        '<textarea class="input' + tall + '" id="' + id + '" rows="' + (config.rows || 4) + '"' +
        ' data-bind="' + config.bind + '"' +
        (config.attrs ? " " + config.attrs : "") +
        ' placeholder="' + escapeAttr(config.placeholder || "") + '">' +
        escapeHtml(config.value == null ? "" : config.value) +
        "</textarea>";
    } else {
      control =
        '<input class="input" id="' + id + '" type="' + (config.type || "text") + '"' +
        ' data-bind="' + config.bind + '"' +
        ' value="' + escapeAttr(config.value == null ? "" : config.value) + '"' +
        ' placeholder="' + escapeAttr(config.placeholder || "") + '"' +
        (config.maxlength ? ' maxlength="' + config.maxlength + '"' : "") +
        (config.attrs ? " " + config.attrs : "") +
        ">";
    }

    return (
      '<div class="field' + spanClass + '">' +
      label +
      control +
      (config.hint ? '<p class="field__hint">' + config.hint + "</p>" : "") +
      "</div>"
    );
  }

  function toggleField(config) {
    return (
      '<div class="field field--toggle' + (config.span ? " field--span2" : "") + '">' +
      '<label class="switch">' +
      '<input type="checkbox" data-bind="' + config.bind + '"' + (config.checked ? " checked" : "") + ">" +
      '<span class="switch__track" aria-hidden="true"><span class="switch__dot"></span></span>' +
      '<span class="switch__text">' + escapeHtml(config.text || "") +
      (config.en ? '<span class="mono">' + escapeHtml(config.en) + "</span>" : "") +
      "</span>" +
      "</label>" +
      (config.hint ? '<p class="field__hint">' + config.hint + "</p>" : "") +
      "</div>"
    );
  }

  function colorField(config) {
    const safe = safeHex(config.value, "#df6249");
    const spanClass = config.span === false ? "" : " field--span2";
    const swatches = ACCENT_PRESETS.map(function (color) {
      const active = safe === color;
      return (
        '<button class="swatch' + (active ? " is-active" : "") + '" type="button"' +
        ' style="--swatch:' + color + '"' +
        ' data-action="pick-color" data-bind="' + config.bind + '" data-color="' + color + '"' +
        ' aria-label="使用颜色 ' + color.toUpperCase() + '" title="' + color.toUpperCase() + '"></button>'
      );
    }).join("");

    return (
      '<div class="field' + spanClass + '">' +
      '<span class="field__label">' + escapeHtml(config.label) +
      (config.en ? ' <span class="mono">' + escapeHtml(config.en) + "</span>" : "") +
      "</span>" +
      '<div class="color-field">' +
      '<input class="color-input" type="color" data-bind="' + config.bind + '" value="' + safe + '" aria-label="' + escapeAttr(config.label) + '">' +
      '<span class="color-value" data-color-value>' + safe.toUpperCase() + "</span>" +
      '<div class="swatch-row">' + swatches + "</div>" +
      "</div>" +
      (config.hint ? '<p class="field__hint">' + config.hint + "</p>" : "") +
      "</div>"
    );
  }

  /* ============================================================
     Visual snippets
     ============================================================ */

  function coverMarkup(project, variant) {
    const item = project || {};
    const accent = safeHex(item.accent, "#a8b8a0");
    const ink = safeHex(item.ink, inkFor(accent));
    const title = escapeHtml(item.title || "未命名项目");
    const en = escapeHtml(item.en || "PROJECT");
    const category = escapeHtml(item.category || "项目");
    const year = escapeHtml(item.year || "");
    const cover = typeof item.cover === "string" ? item.cover.trim() : "";
    const imageSource = resolveAssetUrl(cover);
    const img = imageSource
      ? '<img class="cover__img" src="' + escapeAttr(imageSource) + '" alt="' +
        escapeAttr((item.title || "项目") + " 封面") + '" loading="lazy" data-cover-img>'
      : "";
    const style = 'style="--cover-accent:' + accent + ";--cover-ink:" + ink + '"';

    if (variant === "thumb") {
      const initial = escapeHtml((item.title || "项").trim().slice(0, 1) || "项");
      return (
        '<div class="cover cover--thumb" ' + style + ">" +
        '<span class="cover__fallback" aria-hidden="true"><span class="cover__initial">' + initial + "</span></span>" +
        img +
        "</div>"
      );
    }

    if (variant === "modal") {
      return (
        '<div class="cover cover--modal" ' + style + ">" +
        '<span class="cover__fallback" aria-hidden="true">' +
        '<span class="cover__label mono">' + (cover ? "COVER PREVIEW · 16:9" : "TEXT FALLBACK · 未上传图片") + "</span>" +
        '<span class="cover__title">' + title + "</span>" +
        '<span class="cover__en mono">' + en + "</span>" +
        "</span>" +
        img +
        "</div>"
      );
    }

    return (
      '<div class="cover" ' + style + ">" +
      '<span class="cover__fallback" aria-hidden="true">' +
      '<span class="cover__label mono">' + category + (year ? " · " + year : "") + "</span>" +
      '<span class="cover__title">' + title + "</span>" +
      '<span class="cover__en mono">' + en + "</span>" +
      "</span>" +
      img +
      "</div>"
    );
  }

  function avatarMarkup(profile) {
    const item = profile || {};
    const name = item.name || "林";
    const source = typeof item.avatar === "string" ? item.avatar.trim() : "";
    const initial = escapeHtml(String(name).trim().slice(0, 1) || "林");
    const imageSource = resolveAssetUrl(source);
    const img = imageSource
      ? '<img class="avatar__img" src="' + escapeAttr(imageSource) + '" alt="' +
        escapeAttr(name + " 的头像") + '" data-avatar-img>'
      : "";
    return (
      '<div class="avatar">' +
      '<span class="avatar__fallback" aria-hidden="true">' + initial + "</span>" +
      img +
      "</div>"
    );
  }

  function emptyState(title, text, action, actionLabel) {
    return (
      '<div class="empty-state">' +
      '<h3 class="empty-state__title">' + escapeHtml(title) + "</h3>" +
      '<p class="empty-state__text">' + escapeHtml(text) + "</p>" +
      (action
        ? '<button class="btn btn--sm" type="button" data-action="' + action + '">' +
          escapeHtml(actionLabel || "开始") + "</button>"
        : "") +
      "</div>"
    );
  }

  function coverSourceText(cover) {
    const value = String(cover || "");
    if (!value) return "未设置图片 · 网站将使用主题色文字封面";
    if (value.startsWith("data:")) {
      return "本地图片 · 约 " + formatSize(dataUrlSize(value)) + "（保存在浏览器里）";
    }
    return "图片链接 · " + (value.length > 72 ? value.slice(0, 72) + "…" : value);
  }

  function avatarSourceText() {
    const value = String((state.data.profile && state.data.profile.avatar) || "");
    if (!value) return "未设置头像 · 使用姓名首字作为占位";
    if (value.startsWith("data:")) {
      return "本地图片 · 约 " + formatSize(dataUrlSize(value)) + "（保存在浏览器里）";
    }
    return "图片链接 · " + (value.length > 60 ? value.slice(0, 60) + "…" : value);
  }

  function setInlineError(element, message) {
    if (!element) return;
    if (message) {
      element.textContent = message;
      element.hidden = false;
    } else {
      element.textContent = "";
      element.hidden = true;
    }
  }

  function updateColorReadout(bind, color) {
    const input = document.querySelector('input[type="color"][data-bind="' + bind + '"]');
    if (!input) return;
    const wrap = input.closest(".color-field");
    if (!wrap) return;
    const valueEl = wrap.querySelector("[data-color-value]");
    if (valueEl) valueEl.textContent = String(color).toUpperCase();
    const swatches = wrap.querySelectorAll(".swatch");
    Array.prototype.forEach.call(swatches, function (swatch) {
      swatch.classList.toggle("is-active", swatch.dataset.color === color);
    });
  }

  /* ============================================================
     Section rendering
     ============================================================ */

  function renderNav() {
    dom.nav.innerHTML = SECTIONS.map(function (section) {
      return (
        '<a class="nav-link" href="#/' + section.id + '" data-nav="' + section.id + '">' +
        '<span class="nav-link__num mono">' + section.num + "</span>" +
        '<span class="nav-link__body">' +
        '<span class="nav-link__label">' + escapeHtml(section.label) + "</span>" +
        '<span class="nav-link__en mono">' + escapeHtml(section.en) + "</span>" +
        "</span>" +
        '<span class="nav-link__arrow" aria-hidden="true">→</span>' +
        "</a>"
      );
    }).join("");
    updateNavActive();
  }

  function updateNavActive() {
    if (!dom.nav) return;
    Array.prototype.forEach.call(dom.nav.querySelectorAll(".nav-link"), function (link) {
      if (link.dataset.nav === state.section) {
        link.setAttribute("aria-current", "page");
      } else {
        link.removeAttribute("aria-current");
      }
    });
  }

  function renderSection() {
    const section = currentSection();
    if (dom.topbarNum) dom.topbarNum.textContent = section.num;
    if (dom.topbarTitle) dom.topbarTitle.textContent = section.label;
    updateNavActive();

    const renderers = {
      overview: renderOverview,
      projects: renderProjects,
      notes: renderNotes,
      profile: renderProfile,
      skills: renderSkills,
      settings: renderSettings
    };
    const renderer = renderers[state.section] || renderOverview;
    dom.root.innerHTML = renderer();
    updateMetaTexts();
    updateSaveUI();
  }

  function statTile(value, label, en, note) {
    return (
      '<div class="overview-stat" role="listitem">' +
      '<span class="overview-stat__num">' + formatCount(value) + "</span>" +
      '<span class="overview-stat__label">' + escapeHtml(label) +
      '<span class="mono">' + escapeHtml(en) + "</span></span>" +
      '<span class="overview-stat__note">' + escapeHtml(note) + "</span>" +
      "</div>"
    );
  }

  function renderOverview() {
    const data = state.data;
    const projects = data.projects || [];
    const notes = data.notes || [];
    const skills = data.skills || [];
    const timeline = data.timeline || [];
    const featured = projects.filter(function (project) {
      return project.featured;
    }).length;
    const skillItemCount = skills.reduce(function (sum, group) {
      return sum + (Array.isArray(group.items) ? group.items.length : 0);
    }, 0);
    const noteChars = notes.reduce(function (sum, note) {
      return sum + String(note.content || "").length;
    }, 0);

    const recentProjects = projects.slice(0, 3);
    const recentNotes = notes.slice(0, 3);

    const projectRows = recentProjects.map(function (project) {
      return (
        '<li class="recent-item">' +
        '<a class="recent-item__thumb" href="#/projects" tabindex="-1" aria-hidden="true">' +
        coverMarkup(project, "thumb") +
        "</a>" +
        '<div class="recent-item__body">' +
        '<p class="recent-item__meta mono">' + escapeHtml(project.category || "未分类") +
        " · " + escapeHtml(project.year || "—") + (project.featured ? " · FEATURED" : "") + "</p>" +
        '<p class="recent-item__title">' + escapeHtml(project.title || "未命名项目") + "</p>" +
        '<p class="recent-item__sub mono">' + escapeHtml(project.en || "") + "</p>" +
        "</div>" +
        '<div class="recent-item__actions">' +
        '<button class="mini-btn" type="button" data-action="edit-project" data-id="' + escapeAttr(project.id) + '">编辑</button>' +
        "</div>" +
        "</li>"
      );
    }).join("");

    const noteRows = recentNotes.map(function (note) {
      return (
        '<li class="recent-item">' +
        '<div class="recent-item__date">' +
        '<span class="mono">' + escapeHtml(note.date || "—") + "</span>" +
        "</div>" +
        '<div class="recent-item__body">' +
        '<p class="recent-item__meta mono">' + escapeHtml(note.tag || "未分类") +
        " · " + escapeHtml(note.readTime || "—") + "</p>" +
        '<p class="recent-item__title">' + escapeHtml(note.title || "未命名文章") + "</p>" +
        '<p class="recent-item__sub">' + escapeHtml(note.excerpt || "") + "</p>" +
        "</div>" +
        '<div class="recent-item__actions">' +
        '<button class="mini-btn" type="button" data-action="edit-note" data-id="' + escapeAttr(note.id) + '">编辑</button>' +
        "</div>" +
        "</li>"
      );
    }).join("");

    return (
      '<section class="section" aria-labelledby="section-title">' +
      '<header class="section-head">' +
      '<div class="section-head__main">' +
      '<p class="eyebrow">01 / OVERVIEW</p>' +
      '<h2 class="section-title" id="section-title">你好，知远<span class="section-title__mark">。</span></h2>' +
      '<p class="section-lede">这里是你的内容工作台。改动会自动保存在本浏览器，回到网站刷新一下就能看到。左侧是内容板块，下面是你现在的状态。</p>' +
      "</div>" +
      '<div class="section-head__aside">' +
      '<p class="overview-date" id="overview-date">' + formatDateCN(new Date()) + " · " + WEEKDAYS[new Date().getDay()] + "</p>" +
      '<a class="btn btn--ghost btn--sm" href="../index.html" target="_blank" rel="noopener">预览当前网站 ↗</a>' +
      "</div>" +
      "</header>" +
      '<div class="overview-stats" role="list" aria-label="内容数量">' +
      statTile(projects.length, "项目", "PROJECTS", (featured ? featured + " 个首页精选" : "还没有精选项目")) +
      statTile(notes.length, "文章", "NOTES", "约 " + noteChars + " 字") +
      statTile(skills.length, "技能组", "SKILL GROUPS", skillItemCount + " 项技能") +
      statTile(timeline.length, "时间线", "TIMELINE", "条经历记录") +
      "</div>" +
      '<div class="overview-layout">' +
      '<div class="overview-col">' +
      '<section class="panel">' +
      '<header class="panel__head"><div><p class="eyebrow">RECENT PROJECTS</p><h3 class="panel__title">最近的项目</h3></div>' +
      '<a class="link-btn" href="#/projects">全部 ' + projects.length + " 个 →</a></header>" +
      (recentProjects.length
        ? '<ul class="recent-list">' + projectRows + "</ul>"
        : emptyState("还没有作品", "先新建第一个项目，让首页动起来。", "new-project", "新建第一个项目")) +
      '<button class="add-btn add-btn--inline" type="button" data-action="new-project">＋ 新建项目</button>' +
      "</section>" +
      '<section class="panel">' +
      '<header class="panel__head"><div><p class="eyebrow">RECENT NOTES</p><h3 class="panel__title">最近的文章</h3></div>' +
      '<a class="link-btn" href="#/notes">全部 ' + notes.length + " 篇 →</a></header>" +
      (recentNotes.length
        ? '<ul class="recent-list">' + noteRows + "</ul>"
        : emptyState("还没有文章", "写下第一篇学习笔记或成长手记。", "new-note", "写第一篇文章")) +
      '<button class="add-btn add-btn--inline" type="button" data-action="new-note">＋ 写一篇文章</button>' +
      "</section>" +
      "</div>" +
      '<div class="overview-col">' +
      '<section class="panel">' +
      '<header class="panel__head"><div><p class="eyebrow">SHORTCUTS</p><h3 class="panel__title">快捷开始</h3></div></header>' +
      '<div class="quick-list">' +
      '<button class="quick-link" type="button" data-action="new-project">' +
      '<span class="quick-link__left"><span class="quick-link__num mono">01</span>' +
      '<span class="quick-link__body"><span class="quick-link__label">新建项目</span><span class="quick-link__desc">添加一张作品卡片</span></span></span>' +
      '<span class="quick-link__arrow" aria-hidden="true">＋</span></button>' +
      '<button class="quick-link" type="button" data-action="new-note">' +
      '<span class="quick-link__left"><span class="quick-link__num mono">02</span>' +
      '<span class="quick-link__body"><span class="quick-link__label">写一篇文章</span><span class="quick-link__desc">记录最近的思考</span></span></span>' +
      '<span class="quick-link__arrow" aria-hidden="true">＋</span></button>' +
      '<a class="quick-link" href="#/profile">' +
      '<span class="quick-link__left"><span class="quick-link__num mono">03</span>' +
      '<span class="quick-link__body"><span class="quick-link__label">编辑个人资料</span><span class="quick-link__desc">姓名、简介、社交链接</span></span></span>' +
      '<span class="quick-link__arrow" aria-hidden="true">→</span></a>' +
      '<a class="quick-link" href="#/settings">' +
      '<span class="quick-link__left"><span class="quick-link__num mono">04</span>' +
      '<span class="quick-link__body"><span class="quick-link__label">网站设置</span><span class="quick-link__desc">标题、字幕、主题色</span></span></span>' +
      '<span class="quick-link__arrow" aria-hidden="true">→</span></a>' +
      "</div>" +
      "</section>" +
      '<section class="panel">' +
      '<header class="panel__head"><div><p class="eyebrow">DATA</p><h3 class="panel__title">数据与备份</h3></div></header>' +
      '<dl class="status-list">' +
      "<div><dt>保存状态</dt><dd id=\"overview-save-state\">" + saveStateLabel() + "</dd></div>" +
      "<div><dt>上次保存</dt><dd id=\"overview-last-saved\">" + escapeHtml(lastSavedText()) + "</dd></div>" +
      "<div><dt>本地副本</dt><dd>" + (PortfolioStore.hasLocalCopy() ? "已启用" : "默认内容") + "</dd></div>" +
      "<div><dt>内容体积</dt><dd id=\"overview-size\">约 " + contentSizeLabel() + "</dd></div>" +
      "</dl>" +
      '<div class="btn-row">' +
      '<button class="btn btn--ghost btn--sm" type="button" data-action="export-json">导出 JSON</button>' +
      '<button class="btn btn--ghost btn--sm" type="button" data-action="import-json">导入 JSON</button>' +
      '<button class="btn btn--danger btn--sm" type="button" data-action="reset-all">恢复默认</button>' +
      "</div>" +
      '<p class="panel-note">内容存在浏览器 localStorage 里，清除浏览器数据会丢失；建议定期导出备份。</p>' +
      "</section>" +
      '<section class="panel">' +
      '<header class="panel__head"><div><p class="eyebrow">PUBLIC SITE</p><h3 class="panel__title">预览 / Preview</h3></div></header>' +
      '<p class="preview-card__note">保存之后打开网站首页（新标签页）即可看到最新内容。需要同一个浏览器、同一个访问地址，才能读到这份本地副本。</p>' +
      '<a class="btn btn--ghost btn--sm" href="../index.html" target="_blank" rel="noopener">打开网站 ↗</a>' +
      "</section>" +
      "</div>" +
      "</div>" +
      "</section>"
    );
  }

  function renderProjects() {
    const projects = state.data.projects || [];
    const cards = projects.map(function (project, index) {
      const tags = Array.isArray(project.tags) ? project.tags : [];
      return (
        '<article class="project-card">' +
        '<div class="project-card__cover">' +
        coverMarkup(project, "card") +
        (project.featured ? '<span class="project-card__badge mono">★ 精选</span>' : "") +
        "</div>" +
        '<div class="project-card__body">' +
        '<p class="project-card__meta mono">' + formatCount(index + 1) + " / " +
        escapeHtml(project.category || "未分类") + " · " + escapeHtml(project.year || "—") + "</p>" +
        '<h3 class="project-card__title">' + escapeHtml(project.title || "未命名项目") + "</h3>" +
        '<p class="project-card__en mono">' + escapeHtml(project.en || "") + "</p>" +
        '<p class="project-card__summary">' + escapeHtml(project.summary || "还没有简介。") + "</p>" +
        (tags.length
          ? '<ul class="tag-list">' + tags.map(function (tag) {
              return '<li class="tag">' + escapeHtml(tag) + "</li>";
            }).join("") + "</ul>"
          : "") +
        "</div>" +
        '<div class="project-card__foot">' +
        '<div class="reorder">' +
        '<button class="icon-btn" type="button" data-action="move-project" data-direction="-1" data-id="' + escapeAttr(project.id) + '" aria-label="上移「' + escapeAttr(project.title || "未命名项目") + '」"' + (index === 0 ? " disabled" : "") + ">↑</button>" +
        '<button class="icon-btn" type="button" data-action="move-project" data-direction="1" data-id="' + escapeAttr(project.id) + '" aria-label="下移「' + escapeAttr(project.title || "未命名项目") + '」"' + (index === projects.length - 1 ? " disabled" : "") + ">↓</button>" +
        "</div>" +
        '<div class="card-actions">' +
        '<button class="mini-btn" type="button" data-action="edit-project" data-id="' + escapeAttr(project.id) + '">编辑</button>' +
        '<button class="mini-btn mini-btn--danger" type="button" data-action="delete-project" data-id="' + escapeAttr(project.id) + '">删除</button>' +
        "</div>" +
        "</div>" +
        "</article>"
      );
    }).join("");

    return (
      '<section class="section" aria-labelledby="section-title">' +
      '<header class="section-head">' +
      '<div class="section-head__main">' +
      '<p class="eyebrow">02 / PROJECTS</p>' +
      '<h2 class="section-title" id="section-title">作品管理</h2>' +
      '<p class="section-lede">项目卡片的顺序就是首页的展示顺序。编辑完成后自动保存；封面推荐 16:9 图片，留空会使用主题色生成文字封面。</p>' +
      "</div>" +
      '<div class="section-head__actions">' +
      '<span class="count-chip mono">' + projects.length + " PROJECTS</span>" +
      '<button class="btn" type="button" data-action="new-project">＋ 新建项目</button>' +
      "</div>" +
      "</header>" +
      (projects.length
        ? '<div class="project-grid">' + cards + "</div>"
        : emptyState("作品区还是空的", "从一个真实的小项目开始：它解决什么问题，你做了什么，结果如何。", "new-project", "新建第一个项目")) +
      "</section>"
    );
  }

  function renderNotes() {
    const notes = state.data.notes || [];
    const rows = notes.map(function (note, index) {
      return (
        '<li class="note-row">' +
        '<div class="note-row__date">' + escapeHtml(note.date || "未设置日期") + "</div>" +
        '<div class="note-row__body">' +
        '<div class="note-row__top">' +
        '<span class="tag">' + escapeHtml(note.tag || "未分类") + "</span>" +
        '<span class="note-row__read mono">' + escapeHtml(note.readTime || "—") + "</span>" +
        "</div>" +
        '<h3 class="note-row__title">' + escapeHtml(note.title || "未命名文章") + "</h3>" +
        '<p class="note-row__excerpt">' + escapeHtml(note.excerpt || "（还没有摘要）") + "</p>" +
        '<p class="note-row__stats mono">' + countParagraphs(note.content) + " 段 · " + String(note.content || "").length + " 字</p>" +
        "</div>" +
        '<div class="note-row__actions">' +
        '<div class="reorder">' +
        '<button class="icon-btn" type="button" data-action="move-note" data-direction="-1" data-id="' + escapeAttr(note.id) + '" aria-label="上移文章「' + escapeAttr(note.title || "未命名文章") + '」"' + (index === 0 ? " disabled" : "") + ">↑</button>" +
        '<button class="icon-btn" type="button" data-action="move-note" data-direction="1" data-id="' + escapeAttr(note.id) + '" aria-label="下移文章「' + escapeAttr(note.title || "未命名文章") + '」"' + (index === notes.length - 1 ? " disabled" : "") + ">↓</button>" +
        "</div>" +
        '<button class="mini-btn" type="button" data-action="edit-note" data-id="' + escapeAttr(note.id) + '">编辑</button>' +
        '<button class="mini-btn mini-btn--danger" type="button" data-action="delete-note" data-id="' + escapeAttr(note.id) + '">删除</button>' +
        "</div>" +
        "</li>"
      );
    }).join("");

    return (
      '<section class="section" aria-labelledby="section-title">' +
      '<header class="section-head">' +
      '<div class="section-head__main">' +
      '<p class="eyebrow">03 / NOTES</p>' +
      '<h2 class="section-title" id="section-title">文章管理</h2>' +
      '<p class="section-lede">学习笔记、成长手记与建站记录。正文里用空行分隔段落，网站会按段落排版。</p>' +
      "</div>" +
      '<div class="section-head__actions">' +
      '<span class="count-chip mono">' + notes.length + " NOTES</span>" +
      '<button class="btn" type="button" data-action="new-note">＋ 写一篇文章</button>' +
      "</div>" +
      "</header>" +
      (notes.length
        ? '<ul class="note-list">' + rows + "</ul>"
        : emptyState("还没有文章", "第一篇不用长，写清楚一件最近想明白的事就好。", "new-note", "写第一篇文章")) +
      "</section>"
    );
  }

  function renderProfile() {
    const data = state.data;
    const profile = data.profile || {};
    const socials = Array.isArray(profile.socials) ? profile.socials : [];
    const stats = Array.isArray(data.stats) ? data.stats : [];
    const tagline = Array.isArray(profile.tagline) ? profile.tagline : ["", ""];
    const avatarValue = typeof profile.avatar === "string" ? profile.avatar : "";
    const avatarIsData = avatarValue.startsWith("data:");

    const socialRows = socials.map(function (social, index) {
      return (
        '<div class="repeat-row repeat-row--social">' +
        field({ label: "平台", bind: "profile.socials." + index + ".label", value: social.label, placeholder: "GitHub" }) +
        field({ label: "账号", bind: "profile.socials." + index + ".handle", value: social.handle, placeholder: "@zhiyuan-lin" }) +
        field({ label: "链接", bind: "profile.socials." + index + ".url", value: social.url, placeholder: "https://..." }) +
        '<button class="icon-btn icon-btn--danger repeat-row__remove" type="button" data-action="remove-social" data-index="' + index + '" aria-label="删除第 ' + (index + 1) + ' 条社交链接">✕</button>' +
        "</div>"
      );
    }).join("");

    const statRows = stats.map(function (stat, index) {
      return (
        '<div class="repeat-row repeat-row--stat">' +
        field({ label: "数值", bind: "stats." + index + ".value", value: stat.value, placeholder: "03" }) +
        field({ label: "标签", bind: "stats." + index + ".label", value: stat.label, placeholder: "独立项目" }) +
        field({ label: "注释", bind: "stats." + index + ".note", value: stat.note, placeholder: "从问题到上线" }) +
        '<button class="icon-btn icon-btn--danger repeat-row__remove" type="button" data-action="remove-stat" data-index="' + index + '" aria-label="删除第 ' + (index + 1) + ' 个数据项">✕</button>' +
        "</div>"
      );
    }).join("");

    return (
      '<section class="section" aria-labelledby="section-title">' +
      '<header class="section-head">' +
      '<div class="section-head__main">' +
      '<p class="eyebrow">04 / PROFILE</p>' +
      '<h2 class="section-title" id="section-title">个人资料</h2>' +
      '<p class="section-lede">首页标题区、关于区与页脚都会用到这里的信息。改完自动保存，不需要额外操作。</p>' +
      "</div>" +
      '<div class="section-head__actions"><span class="count-chip mono">AUTO-SAVED</span></div>' +
      "</header>" +
      '<div class="profile-layout">' +
      '<div class="profile-col">' +
      '<section class="panel">' +
      '<header class="panel__head"><div><p class="eyebrow">BASIC</p><h3 class="panel__title">基本信息</h3></div></header>' +
      '<div class="form-grid">' +
      field({ label: "姓名", en: "NAME", bind: "profile.name", value: profile.name, placeholder: "郑宇彬", maxlength: 30 }) +
      field({ label: "英文名", en: "NAME EN", bind: "profile.nameEn", value: profile.nameEn, placeholder: "Zheng Yubin", maxlength: 60 }) +
      field({ label: "身份 / 专业", en: "ROLE", bind: "profile.role", value: profile.role, placeholder: "数字经济 · 大二在读", maxlength: 60 }) +
      field({ label: "学校", en: "SCHOOL", bind: "profile.school", value: profile.school, placeholder: "南山大学" }) +
      field({ label: "所在城市", en: "LOCATION", bind: "profile.location", value: profile.location, placeholder: "杭州 / 中国" }) +
      field({ label: "状态徽章", en: "AVAILABILITY", bind: "profile.availability", value: profile.availability, placeholder: "2026 暑期实习开放中" }) +
      field({ label: "当前状态", en: "STATUS", bind: "profile.status", value: profile.status, placeholder: "正在寻找数据分析 / 产品方向的实习", span: true }) +
      field({ label: "联系邮箱", en: "EMAIL", bind: "profile.email", type: "email", value: profile.email, placeholder: "hello@example.com", span: true }) +
      "</div>" +
      "</section>" +
      '<section class="panel">' +
      '<header class="panel__head"><div><p class="eyebrow">HERO COPY</p><h3 class="panel__title">首页文案</h3></div></header>' +
      '<div class="form-grid">' +
      field({ label: "标语第一行", en: "TAGLINE 01", bind: "profile.tagline.0", value: tagline[0] || "", placeholder: "在数据与叙事之间，" }) +
      field({ label: "标语第二行", en: "TAGLINE 02", bind: "profile.tagline.1", value: tagline[1] || "", placeholder: "做一点有温度的建造。" }) +
      field({ label: "自我介绍", en: "INTRO", bind: "profile.intro", type: "textarea", rows: 5, value: profile.intro, span: true, hint: "建议 2–4 句话，讲清楚你是谁、在学什么、关心什么。" }) +
      "</div>" +
      "</section>" +
      '<section class="panel">' +
      '<header class="panel__head"><div><p class="eyebrow">STATS</p><h3 class="panel__title">数据栏</h3>' +
      '<p class="panel__sub">首页标题下方的小数字，例如「03 独立项目」。</p></div></header>' +
      '<div class="repeat-list">' + (statRows || '<p class="field__hint">还没有数据项，添加 3–4 个数字会更有节奏。</p>') + "</div>" +
      '<button class="add-btn" type="button" data-action="add-stat">＋ 添加数据项</button>' +
      "</section>" +
      "</div>" +
      '<div class="profile-col">' +
      '<section class="panel">' +
      '<header class="panel__head"><div><p class="eyebrow">AVATAR</p><h3 class="panel__title">头像</h3></div></header>' +
      '<div class="avatar-editor">' +
      '<div id="avatar-preview">' + avatarMarkup(profile) + "</div>" +
      '<div class="avatar-editor__controls">' +
      '<p class="field__hint">建议 1:1 的正方形图片，不超过 1.5MB。也可以填写图片链接。</p>' +
      '<div class="btn-row">' +
      '<button class="btn btn--ghost btn--sm" type="button" data-action="pick-avatar">上传头像</button>' +
      '<button class="btn btn--ghost btn--sm" type="button" data-action="avatar-clear">清除</button>' +
      "</div>" +
      '<p class="field__hint" id="avatar-status">' + escapeHtml(avatarSourceText()) + "</p>" +
      field({ label: "头像图片链接", en: "AVATAR URL", bind: "profile.avatar", value: avatarIsData ? "" : avatarValue, placeholder: "https://...", hint: "上传本地图片后这里会清空；重新填写链接即可覆盖。" }) +
      '<p class="inline-error" id="avatar-error" role="alert" hidden></p>' +
      "</div>" +
      "</div>" +
      "</section>" +
      '<section class="panel">' +
      '<header class="panel__head"><div><p class="eyebrow">SOCIALS</p><h3 class="panel__title">社交链接</h3></div></header>' +
      '<div class="repeat-list">' + (socialRows || '<p class="field__hint">还没有社交链接。</p>') + "</div>" +
      '<button class="add-btn" type="button" data-action="add-social">＋ 添加社交链接</button>' +
      "</section>" +
      '<section class="panel">' +
      '<header class="panel__head"><div><p class="eyebrow">LOCAL STUDIO</p><h3 class="panel__title">本地工作台</h3></div></header>' +
      '<p class="panel__sub">所有修改都会自动保存在这台电脑的浏览器里（localStorage），不会上传到服务器。换设备时，用「网站设置 → 导出 JSON」，再在新设备导入即可。</p>' +
      "</section>" +
      "</div>" +
      "</div>" +
      "</section>"
    );
  }

  function renderSkills() {
    const skills = state.data.skills || [];
    const timeline = state.data.timeline || [];

    const groups = skills.map(function (group, groupIndex) {
      const items = Array.isArray(group.items) ? group.items : [];
      const itemRows = items.map(function (item, itemIndex) {
        const level = clampLevel(item.level);
        const bindBase = "skills." + groupIndex + ".items." + itemIndex;
        return (
          '<div class="skill-item">' +
          '<input class="input skill-item__name" type="text" data-bind="' + bindBase + '.name" value="' + escapeAttr(item.name || "") + '" placeholder="技能名称" aria-label="技能名称">' +
          '<div class="level-control skill-item__level">' +
          '<input type="range" min="0" max="100" step="1" data-bind="' + bindBase + '.level" data-level value="' + level + '" aria-label="' + escapeAttr((item.name || "技能") + " 熟练度") + '">' +
          '<span class="level-value mono">' + level + "%</span>" +
          "</div>" +
          '<input class="input skill-item__note" type="text" data-bind="' + bindBase + '.note" value="' + escapeAttr(item.note || "") + '" placeholder="备注，例如：Pandas / 爬虫" aria-label="技能备注">' +
          '<button class="icon-btn icon-btn--danger skill-item__remove" type="button" data-action="remove-skill-item" data-group="' + groupIndex + '" data-index="' + itemIndex + '" aria-label="移除技能「' + escapeAttr(item.name || "技能") + '」">✕</button>' +
          "</div>"
        );
      }).join("");

      return (
        '<article class="skill-group">' +
        '<div class="skill-group__head">' +
        '<p class="skill-group__index">GROUP ' + formatCount(groupIndex + 1) + " / " + escapeHtml(group.en || "") + "</p>" +
        '<div class="skill-group__actions">' +
        '<div class="reorder">' +
        '<button class="icon-btn" type="button" data-action="move-skill-group" data-direction="-1" data-index="' + groupIndex + '" aria-label="上移技能组"' + (groupIndex === 0 ? " disabled" : "") + ">↑</button>" +
        '<button class="icon-btn" type="button" data-action="move-skill-group" data-direction="1" data-index="' + groupIndex + '" aria-label="下移技能组"' + (groupIndex === skills.length - 1 ? " disabled" : "") + ">↓</button>" +
        "</div>" +
        '<button class="icon-btn icon-btn--danger" type="button" data-action="remove-skill-group" data-index="' + groupIndex + '" aria-label="删除技能组「' + escapeAttr(group.title || "未命名") + '」">✕</button>' +
        "</div>" +
        "</div>" +
        '<div class="form-grid">' +
        field({ label: "组标题", en: "TITLE", bind: "skills." + groupIndex + ".title", value: group.title, placeholder: "数据" }) +
        field({ label: "英文标签", en: "EN", bind: "skills." + groupIndex + ".en", value: group.en, placeholder: "DATA" }) +
        field({ label: "组描述", en: "DESC", bind: "skills." + groupIndex + ".desc", value: group.desc, type: "textarea", rows: 2, span: true, placeholder: "一句话描述这组能力" }) +
        "</div>" +
        '<div class="skill-items">' +
        '<div class="skill-items__head"><span>技能名称</span><span>熟练度 LEVEL</span><span>备注 NOTE</span><span></span></div>' +
        (itemRows || '<p class="field__hint">这组还没有技能项。</p>') +
        "</div>" +
        '<button class="add-btn" type="button" data-action="add-skill-item" data-group="' + groupIndex + '">＋ 添加技能项</button>' +
        "</article>"
      );
    }).join("");

    const timelineCards = timeline.map(function (entry, index) {
      return (
        '<article class="timeline-card">' +
        '<div class="timeline-card__head">' +
        '<p class="timeline-card__index">ENTRY ' + formatCount(index + 1) + " / " + escapeHtml(entry.year || "") + "</p>" +
        '<div class="timeline-card__actions">' +
        '<div class="reorder">' +
        '<button class="icon-btn" type="button" data-action="move-timeline" data-direction="-1" data-index="' + index + '" aria-label="上移经历"' + (index === 0 ? " disabled" : "") + ">↑</button>" +
        '<button class="icon-btn" type="button" data-action="move-timeline" data-direction="1" data-index="' + index + '" aria-label="下移经历"' + (index === timeline.length - 1 ? " disabled" : "") + ">↓</button>" +
        "</div>" +
        '<button class="icon-btn icon-btn--danger" type="button" data-action="remove-timeline" data-index="' + index + '" aria-label="删除经历「' + escapeAttr(entry.title || "未命名") + '」">✕</button>' +
        "</div>" +
        "</div>" +
        '<div class="form-grid">' +
        field({ label: "年份", en: "YEAR", bind: "timeline." + index + ".year", value: entry.year, placeholder: "2026" }) +
        field({ label: "日期范围", en: "DATE", bind: "timeline." + index + ".date", value: entry.date, placeholder: "2026.03 — NOW" }) +
        field({ label: "标题", en: "TITLE", bind: "timeline." + index + ".title", value: entry.title, placeholder: "独立开发「菜价雷达」" }) +
        field({ label: "标签", en: "TAG", bind: "timeline." + index + ".tag", value: entry.tag, placeholder: "正在进行" }) +
        field({ label: "组织 / 来源", en: "ORG", bind: "timeline." + index + ".org", value: entry.org, placeholder: "个人项目" }) +
        field({ label: "描述", en: "DESC", bind: "timeline." + index + ".desc", value: entry.desc, type: "textarea", rows: 2, span: 3, placeholder: "这件事做了什么、结果如何" }) +
        "</div>" +
        "</article>"
      );
    }).join("");

    return (
      '<section class="section" aria-labelledby="section-title">' +
      '<header class="section-head">' +
      '<div class="section-head__main">' +
      '<p class="eyebrow">05 / SKILLS & TIMELINE</p>' +
      '<h2 class="section-title" id="section-title">技能与履历</h2>' +
      '<p class="section-lede">首页「能力」与「经历」两区的内容。技能熟练度用 0–100 表示；经历按时间倒序排列会比较耐读。</p>' +
      "</div>" +
      '<div class="section-head__actions"><span class="count-chip mono">' + skills.length + " GROUPS · " + timeline.length + " ENTRIES</span></div>" +
      "</header>" +
      '<section class="panel skills-section">' +
      '<header class="panel__head"><div><p class="eyebrow">CORE SKILLS</p><h3 class="panel__title">技能分组</h3></div>' +
      '<button class="btn btn--ghost btn--sm" type="button" data-action="add-skill-group">＋ 添加技能组</button></header>' +
      '<div class="skill-groups">' + (groups || emptyState("还没有技能组", "添加一组技能，例如「数据」「设计」「产品」。", "add-skill-group", "添加技能组")) + "</div>" +
      "</section>" +
      '<section class="panel skills-section">' +
      '<header class="panel__head"><div><p class="eyebrow">TIMELINE</p><h3 class="panel__title">时间线</h3></div>' +
      '<button class="btn btn--ghost btn--sm" type="button" data-action="add-timeline">＋ 添加经历</button></header>' +
      '<div class="timeline-editor">' + (timelineCards || emptyState("还没有经历记录", "从入学、实习、竞赛或项目开始，写一条就好。", "add-timeline", "添加第一条经历")) + "</div>" +
      "</section>" +
      "</section>"
    );
  }

  function renderSettings() {
    const data = state.data;
    const settings = data.settings || {};
    const marquee = Array.isArray(settings.marquee) ? settings.marquee.join("\n") : "";
    const stored = PortfolioStore.hasLocalCopy();

    return (
      '<section class="section" aria-labelledby="section-title">' +
      '<header class="section-head">' +
      '<div class="section-head__main">' +
      '<p class="eyebrow">06 / SETTINGS</p>' +
      '<h2 class="section-title" id="section-title">网站设置</h2>' +
      '<p class="section-lede">站点的标题、描述、滚动字幕与主题色。这里的修改会直接影响首页与 SEO 信息。</p>' +
      "</div>" +
      '<div class="section-head__actions"><span class="count-chip mono">SITE · v' + escapeHtml(String(data.version || 1)) + "</span></div>" +
      "</header>" +
      '<div class="settings-layout">' +
      '<div class="settings-col">' +
      '<section class="panel">' +
      '<header class="panel__head"><div><p class="eyebrow">SITE META</p><h3 class="panel__title">站点基础信息</h3></div></header>' +
      '<div class="form-grid">' +
      field({ label: "网站标题", en: "SITE TITLE", bind: "settings.siteTitle", value: settings.siteTitle, span: true, placeholder: "郑宇彬 · 数字经济与叙事" }) +
      field({ label: "网站描述", en: "SITE DESCRIPTION", bind: "settings.siteDescription", value: settings.siteDescription, type: "textarea", rows: 3, span: true, hint: "会用于搜索引擎摘要与分享卡片，建议 60–120 字。" }) +
      field({ label: "页脚文字", en: "FOOTER NOTE", bind: "settings.footerNote", value: settings.footerNote, span: true, placeholder: "用一点好奇心和很多杯咖啡做成。" }) +
      toggleField({ bind: "settings.showAdminLink", checked: !!settings.showAdminLink, text: "在网站显示「管理内容」入口", en: "SHOW ADMIN LINK", span: true, hint: "关闭后首页的入口隐藏；你仍然可以直接访问 /admin/。" }) +
      "</div>" +
      "</section>" +
      '<section class="panel">' +
      '<header class="panel__head"><div><p class="eyebrow">MARQUEE</p><h3 class="panel__title">滚动字幕</h3></div></header>' +
      '<div class="form-grid">' +
      field({ label: "字幕内容", en: "每行一条", bind: "settings.marquee", value: marquee, type: "textarea", rows: 4, span: true, attrs: 'data-type="lines"', hint: "每行一条，首页会在顶部循环滚动展示。建议 2–4 条，每条不超过 30 个字符。" }) +
      "</div>" +
      "</section>" +
      '<section class="panel">' +
      '<header class="panel__head"><div><p class="eyebrow">DATA</p><h3 class="panel__title">数据备份</h3></div></header>' +
      '<dl class="status-list">' +
      "<div><dt>存储键</dt><dd>" + escapeHtml(PortfolioStore.KEY) + "</dd></div>" +
      "<div><dt>本地副本</dt><dd>" + (stored ? "已启用" : "默认内容") + "</dd></div>" +
      "<div><dt>内容体积</dt><dd>" + contentSizeLabel() + "</dd></div>" +
      "</dl>" +
      '<p class="panel-note">导出的 JSON 包含全部作品、文章、资料与设置，可以保存到电脑，或在新浏览器 / 新设备中导入。</p>' +
      '<div class="btn-row">' +
      '<button class="btn btn--ghost btn--sm" type="button" data-action="export-json">导出 JSON</button>' +
      '<button class="btn btn--ghost btn--sm" type="button" data-action="import-json">导入 JSON</button>' +
      "</div>" +
      "</section>" +
      "</div>" +
      '<div class="settings-col">' +
      '<section class="panel">' +
      '<header class="panel__head"><div><p class="eyebrow">ACCENT</p><h3 class="panel__title">主题强调色</h3></div></header>' +
      '<div class="form-grid">' +
      colorField({ label: "强调色", en: "ACCENT COLOR", bind: "settings.accent", value: settings.accent, hint: "用于网站中的链接、按钮与圆点等强调元素。默认是珊瑚色。" }) +
      "</div>" +
      "</section>" +
      '<section class="panel panel--danger">' +
      '<header class="panel__head"><div><p class="eyebrow">DANGER ZONE</p><h3 class="panel__title danger-title">危险区</h3></div></header>' +
      '<p class="danger-copy">「恢复默认内容」会删除本浏览器里的所有编辑，并把作品、文章、资料与设置重置为网站初始内容。这个操作无法撤销，建议先导出 JSON 备份。</p>' +
      '<button class="btn btn--danger btn--sm" type="button" data-action="reset-all">恢复默认内容</button>' +
      "</section>" +
      "</div>" +
      "</div>" +
      "</section>"
    );
  }

  /* ============================================================
     Project editor
     ============================================================ */

  function blankProject() {
    const year = String(new Date().getFullYear());
    return {
      id: uniqueId("project"),
      title: "",
      en: "",
      category: "",
      year: year,
      featured: false,
      accent: "#a8b8a0",
      ink: "#1b2417",
      cover: "",
      summary: "",
      description: "",
      role: "",
      deliverables: [],
      tags: [],
      link: "",
      highlight: ""
    };
  }

  function projectDialogMarkup() {
    const draft = state.draft;
    const item = draft.item;
    const index = draft.isNew
      ? -1
      : (state.data.projects || []).findIndex(function (project) {
          return project.id === draft.originalId;
        });
    const coverValue = typeof item.cover === "string" ? item.cover : "";
    const coverIsData = coverValue.startsWith("data:");
    const tags = Array.isArray(item.tags) ? item.tags : [];
    const deliverables = Array.isArray(item.deliverables) ? item.deliverables : [];

    return (
      '<header class="modal__head">' +
      '<div class="modal__head-text">' +
      '<p class="modal__eyebrow">' + (draft.isNew ? "NEW PROJECT · 新作品" : "EDIT PROJECT · 第 " + formatCount(index + 1) + " 个") + "</p>" +
      '<h2 class="modal__title" id="project-dialog-title">' + (draft.isNew ? "新建项目" : "编辑项目") + "</h2>" +
      '<p class="modal__sub">保存后会立即写入本浏览器，并同步到网站首页。</p>' +
      "</div>" +
      '<button class="icon-btn modal__close" type="button" data-action="close-dialog" aria-label="关闭编辑窗口">✕</button>' +
      "</header>" +
      '<div class="modal__body">' +
      '<div class="form-grid">' +
      field({ label: "项目标题", en: "TITLE", bind: "draft.title", value: item.title, placeholder: "例如：夜光地图", maxlength: 60 }) +
      field({ label: "英文标题", en: "EN TITLE", bind: "draft.en", value: item.en, placeholder: "Nocturne Map", maxlength: 60 }) +
      field({ label: "分类", en: "CATEGORY", bind: "draft.category", value: item.category, placeholder: "数据可视化" }) +
      field({ label: "年份", en: "YEAR", bind: "draft.year", value: item.year, placeholder: "2026.03" }) +
      field({ label: "一句话简介", en: "SUMMARY", bind: "draft.summary", value: item.summary, type: "textarea", rows: 3, span: true, placeholder: "卡片上显示的一句话，建议 20–60 字" }) +
      field({ label: "详细描述", en: "DESCRIPTION", bind: "draft.description", value: item.description, type: "textarea", rows: 5, span: true, placeholder: "这个项目做了什么、为什么做、结果如何" }) +
      field({ label: "标签", en: "TAGS · 逗号分隔", bind: "draft.tags", value: tags.join("，"), placeholder: "Python，Pandas，ECharts", attrs: 'data-type="csv"' }) +
      field({ label: "项目链接", en: "LINK", bind: "draft.link", value: item.link, placeholder: "https://...（可留空）" }) +
      colorField({ label: "主题色", en: "ACCENT", bind: "draft.accent", value: item.accent, span: false, hint: "用于文字封面与网站上的项目高亮。" }) +
      toggleField({ bind: "draft.featured", checked: !!item.featured, text: "在首页突出显示", en: "FEATURED", hint: "精选项目会排在一起，并显示「精选」标记。" }) +
      '<div class="field field--span2 cover-field">' +
      '<span class="field__label">封面图片 <span class="mono">COVER · 16:9</span></span>' +
      '<div class="cover-field__preview" id="project-cover-preview">' + coverMarkup(item, "modal") + "</div>" +
      '<p class="cover-field__status" id="cover-source">' + escapeHtml(coverSourceText(coverValue)) + "</p>" +
      '<div class="btn-row">' +
      '<button class="btn btn--ghost btn--sm" type="button" data-action="pick-cover">上传封面</button>' +
      '<button class="btn btn--ghost btn--sm" type="button" data-action="cover-clear">清除封面</button>' +
      "</div>" +
      '<p class="field__hint">支持 JPG / PNG / WebP，图片不超过 1.5MB；也可以直接填写图片链接。未设置图片时，网站会用主题色生成文字封面。</p>' +
      '<p class="inline-error" id="cover-error" role="alert" hidden></p>' +
      '<input type="file" class="visually-hidden" id="project-cover-file" accept="image/*" data-file="project-cover" tabindex="-1" aria-hidden="true">' +
      '<div class="cover-field__url">' +
      field({ label: "封面图片链接", en: "COVER URL", bind: "draft.cover", value: coverIsData ? "" : coverValue, placeholder: "https://... 或留空", hint: "上传本地图片后这里会清空；重新填写链接即可覆盖上传的图片。" }) +
      "</div>" +
      "</div>" +
      '<details class="advanced field--span2">' +
      "<summary>更多信息（可选） · ROLE / HIGHLIGHT / DELIVERABLES</summary>" +
      '<div class="advanced__body"><div class="form-grid">' +
      field({ label: "我的角色", en: "ROLE", bind: "draft.role", value: item.role, placeholder: "数据清洗 / 可视化 / 叙事" }) +
      field({ label: "亮点数据", en: "HIGHLIGHT", bind: "draft.highlight", value: item.highlight, placeholder: "3,000+ 访问 · 校媒报道" }) +
      field({ label: "交付物", en: "DELIVERABLES · 逗号分隔", bind: "draft.deliverables", value: deliverables.join("，"), placeholder: "交互地图，数据故事长图，路演", attrs: 'data-type="csv"', span: true }) +
      colorField({ label: "封面深色文字", en: "COVER INK", bind: "draft.ink", value: item.ink, span: false, hint: "文字封面上的文字颜色；留空会自动计算。" }) +
      "</div></div>" +
      "</details>" +
      "</div>" +
      "</div>" +
      '<footer class="modal__foot">' +
      (draft.isNew
        ? "<span></span>"
        : '<button class="mini-btn mini-btn--danger" type="button" data-action="delete-project-draft">删除这个项目</button>') +
      '<div class="modal__foot-right">' +
      '<button class="btn btn--ghost btn--sm" type="button" data-action="close-dialog">取消</button>' +
      '<button class="btn btn--sm" type="button" data-action="save-project">保存项目</button>' +
      "</div>" +
      "</footer>"
    );
  }

  function openProjectDialog(id) {
    let draft;
    if (id) {
      const found = (state.data.projects || []).find(function (project) {
        return project.id === id;
      });
      if (!found) {
        toast("没有找到这个项目", "error");
        return;
      }
      draft = { kind: "project", item: clone(found), originalId: found.id, isNew: false };
    } else {
      draft = { kind: "project", item: blankProject(), originalId: null, isNew: true };
    }
    state.draft = draft;
    dom.projectDialog.innerHTML = projectDialogMarkup();
    if (dom.projectDialog.open) dom.projectDialog.close();
    dom.projectDialog.showModal();
    const firstInput = dom.projectDialog.querySelector('input[data-bind="draft.title"]');
    if (firstInput) firstInput.focus();
  }

  function syncProjectPreview() {
    if (!state.draft || state.draft.kind !== "project") return;
    const item = state.draft.item;
    const host = document.getElementById("project-cover-preview");
    if (host) host.innerHTML = coverMarkup(item, "modal");
    const status = document.getElementById("cover-source");
    if (status) status.textContent = coverSourceText(item.cover);
    const urlInput = document.getElementById("f-draft-cover");
    if (urlInput && document.activeElement !== urlInput) {
      const cover = String(item.cover || "");
      urlInput.value = cover.startsWith("data:") ? "" : cover;
    }
  }

  function saveProjectDraft() {
    const draft = state.draft;
    if (!draft || draft.kind !== "project") return;
    const item = draft.item;
    const title = String(item.title || "").trim();
    if (!title) {
      toast("请先填写项目标题", "error");
      const input = dom.projectDialog.querySelector('input[data-bind="draft.title"]');
      if (input) input.focus();
      return;
    }

    item.title = title;
    item.en = String(item.en || "").trim();
    item.category = String(item.category || "").trim();
    item.year = String(item.year || "").trim();
    item.link = String(item.link || "").trim();
    item.cover = String(item.cover || "").trim();
    item.summary = String(item.summary == null ? "" : item.summary);
    item.description = String(item.description == null ? "" : item.description);
    item.role = String(item.role == null ? "" : item.role);
    item.highlight = String(item.highlight == null ? "" : item.highlight);
    item.accent = safeHex(item.accent, "#df6249");
    item.ink = safeHex(item.ink, inkFor(item.accent));
    item.featured = !!item.featured;
    item.tags = Array.isArray(item.tags)
      ? item.tags.map(function (tag) { return String(tag).trim(); }).filter(Boolean)
      : [];
    item.deliverables = Array.isArray(item.deliverables)
      ? item.deliverables.map(function (entry) { return String(entry).trim(); }).filter(Boolean)
      : [];
    if (!item.id) item.id = uniqueId("project");

    if (draft.isNew) {
      state.data.projects.unshift(item);
    } else {
      const index = state.data.projects.findIndex(function (project) {
        return project.id === draft.originalId;
      });
      if (index >= 0) {
        state.data.projects[index] = item;
      } else {
        state.data.projects.unshift(item);
      }
    }

    state.draft = null;
    closeDialog(dom.projectDialog);
    commitAndRefresh('项目「' + title + '」已保存');
  }

  /* ============================================================
     Note editor
     ============================================================ */

  function blankNote() {
    return {
      id: uniqueId("note"),
      title: "",
      date: todayISO(),
      tag: "",
      readTime: "5 min",
      excerpt: "",
      content: ""
    };
  }

  function noteDialogMarkup() {
    const draft = state.draft;
    const item = draft.item;
    const paragraphCount = countParagraphs(item.content);
    return (
      '<header class="modal__head">' +
      '<div class="modal__head-text">' +
      '<p class="modal__eyebrow">' + (draft.isNew ? "NEW NOTE · 新文章" : "EDIT NOTE · 编辑文章") + "</p>" +
      '<h2 class="modal__title" id="note-dialog-title">' + (draft.isNew ? "写一篇文章" : "编辑文章") + "</h2>" +
      '<p class="modal__sub">正文用空行分段，保存后自动同步到网站的笔记区。</p>' +
      "</div>" +
      '<button class="icon-btn modal__close" type="button" data-action="close-dialog" aria-label="关闭编辑窗口">✕</button>' +
      "</header>" +
      '<div class="modal__body">' +
      '<div class="form-grid form-grid--3">' +
      field({ label: "标题", en: "TITLE", bind: "draft.title", value: item.title, span: true, placeholder: "例如：用 Python 抓了 3000 条夜市数据，我看见了什么", maxlength: 120 }) +
      field({ label: "日期", en: "DATE", bind: "draft.date", value: item.date, type: "date" }) +
      field({ label: "分类标签", en: "TAG", bind: "draft.tag", value: item.tag, placeholder: "数据笔记" }) +
      field({ label: "阅读时长", en: "READ TIME", bind: "draft.readTime", value: item.readTime, placeholder: "8 min" }) +
      field({ label: "摘要", en: "EXCERPT", bind: "draft.excerpt", value: item.excerpt, type: "textarea", rows: 3, span: true, placeholder: "列表页展示的一段话，建议 40–80 字", maxlength: 200 }) +
      field({ label: "正文", en: "CONTENT · 空行分段", bind: "draft.content", value: item.content, type: "textarea", rows: 12, span: true, placeholder: "第一段……\n\n第二段……" }) +
      "</div>" +
      '<p class="note-editor__stats" id="note-editor-stats">' + paragraphCount + " 段 · " + String(item.content || "").length + " 字</p>" +
      "</div>" +
      '<footer class="modal__foot">' +
      (draft.isNew
        ? "<span></span>"
        : '<button class="mini-btn mini-btn--danger" type="button" data-action="delete-note-draft">删除这篇文章</button>') +
      '<div class="modal__foot-right">' +
      '<button class="btn btn--ghost btn--sm" type="button" data-action="close-dialog">取消</button>' +
      '<button class="btn btn--sm" type="button" data-action="save-note">保存文章</button>' +
      "</div>" +
      "</footer>"
    );
  }

  function openNoteDialog(id) {
    let draft;
    if (id) {
      const found = (state.data.notes || []).find(function (note) {
        return note.id === id;
      });
      if (!found) {
        toast("没有找到这篇文章", "error");
        return;
      }
      draft = { kind: "note", item: clone(found), originalId: found.id, isNew: false };
    } else {
      draft = { kind: "note", item: blankNote(), originalId: null, isNew: true };
    }
    state.draft = draft;
    dom.noteDialog.innerHTML = noteDialogMarkup();
    if (dom.noteDialog.open) dom.noteDialog.close();
    dom.noteDialog.showModal();
    const firstInput = dom.noteDialog.querySelector('input[data-bind="draft.title"]');
    if (firstInput) firstInput.focus();
  }

  function saveNoteDraft() {
    const draft = state.draft;
    if (!draft || draft.kind !== "note") return;
    const item = draft.item;
    const title = String(item.title || "").trim();
    if (!title) {
      toast("请先填写文章标题", "error");
      const input = dom.noteDialog.querySelector('input[data-bind="draft.title"]');
      if (input) input.focus();
      return;
    }

    item.title = title;
    item.date = String(item.date || "").trim() || todayISO();
    item.tag = String(item.tag || "").trim();
    item.readTime = String(item.readTime || "").trim();
    item.excerpt = String(item.excerpt == null ? "" : item.excerpt);
    item.content = String(item.content == null ? "" : item.content);
    if (!item.id) item.id = uniqueId("note");

    if (draft.isNew) {
      state.data.notes.unshift(item);
    } else {
      const index = state.data.notes.findIndex(function (note) {
        return note.id === draft.originalId;
      });
      if (index >= 0) {
        state.data.notes[index] = item;
      } else {
        state.data.notes.unshift(item);
      }
    }

    state.draft = null;
    closeDialog(dom.noteDialog);
    commitAndRefresh('文章「' + title + '」已保存');
  }

  /* ============================================================
     Commit / refresh helpers
     ============================================================ */

  function commitAndRefresh(message) {
    markDirty();
    saveNow({});
    renderSection();
    updateMetaTexts();
    if (message) toast(message, "success");
  }

  function refreshSection(focusBindPath) {
    markDirty();
    renderSection();
    if (focusBindPath) {
      const element = findBind(focusBindPath);
      if (element) {
        element.focus();
        if (element.scrollIntoView) element.scrollIntoView({ block: "center", behavior: "smooth" });
      }
    }
  }

  function moveListItem(list, index, direction) {
    const next = index + direction;
    if (next < 0 || next >= list.length) return false;
    const item = list[index];
    list[index] = list[next];
    list[next] = item;
    return true;
  }

  /* ============================================================
     Deletion confirmations
     ============================================================ */

  function confirmDeleteProject(id) {
    const project = (state.data.projects || []).find(function (entry) {
      return entry.id === id;
    });
    if (!project) return;
    askConfirm({
      eyebrow: "DELETE PROJECT",
      title: "删除这个项目？",
      message: "「" + escapeHtml(project.title || "未命名项目") + "」会从作品列表中移除，这个操作无法撤销。",
      confirmLabel: "删除项目",
      danger: true,
      onConfirm: function () {
        state.data.projects = state.data.projects.filter(function (entry) {
          return entry.id !== id;
        });
        markDirty();
        renderSection();
        toast("已删除项目", "success");
      }
    });
  }

  function confirmDeleteNote(id) {
    const note = (state.data.notes || []).find(function (entry) {
      return entry.id === id;
    });
    if (!note) return;
    askConfirm({
      eyebrow: "DELETE NOTE",
      title: "删除这篇文章？",
      message: "「" + escapeHtml(note.title || "未命名文章") + "」会从文章列表中移除，这个操作无法撤销。",
      confirmLabel: "删除文章",
      danger: true,
      onConfirm: function () {
        state.data.notes = state.data.notes.filter(function (entry) {
          return entry.id !== id;
        });
        markDirty();
        renderSection();
        toast("已删除文章", "success");
      }
    });
  }

  function confirmDeleteDraftProject() {
    const draft = state.draft;
    if (!draft || draft.kind !== "project" || draft.isNew) return;
    const id = draft.originalId;
    const project = (state.data.projects || []).find(function (entry) {
      return entry.id === id;
    });
    askConfirm({
      eyebrow: "DELETE PROJECT",
      title: "删除这个项目？",
      message: "「" + escapeHtml((project && project.title) || draft.item.title || "未命名项目") + "」会从作品列表中移除，这个操作无法撤销。",
      confirmLabel: "删除项目",
      danger: true,
      onConfirm: function () {
        state.data.projects = state.data.projects.filter(function (entry) {
          return entry.id !== id;
        });
        state.draft = null;
        closeDialog(dom.projectDialog);
        markDirty();
        renderSection();
        toast("已删除项目", "success");
      }
    });
  }

  function confirmDeleteDraftNote() {
    const draft = state.draft;
    if (!draft || draft.kind !== "note" || draft.isNew) return;
    const id = draft.originalId;
    const note = (state.data.notes || []).find(function (entry) {
      return entry.id === id;
    });
    askConfirm({
      eyebrow: "DELETE NOTE",
      title: "删除这篇文章？",
      message: "「" + escapeHtml((note && note.title) || draft.item.title || "未命名文章") + "」会从文章列表中移除，这个操作无法撤销。",
      confirmLabel: "删除文章",
      danger: true,
      onConfirm: function () {
        state.data.notes = state.data.notes.filter(function (entry) {
          return entry.id !== id;
        });
        state.draft = null;
        closeDialog(dom.noteDialog);
        markDirty();
        renderSection();
        toast("已删除文章", "success");
      }
    });
  }

  /* ============================================================
     Import / export / reset
     ============================================================ */

  function exportJson() {
    let text;
    try {
      text = JSON.stringify(state.data, null, 2);
    } catch (error) {
      toast("导出失败：内容无法序列化", "error");
      return;
    }
    const blob = new Blob([text], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const now = new Date();
    const filename =
      "linzhiyuan-content-" +
      now.getFullYear() +
      pad2(now.getMonth() + 1) +
      pad2(now.getDate()) +
      "-" +
      pad2(now.getHours()) +
      pad2(now.getMinutes()) +
      ".json";
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(function () {
      URL.revokeObjectURL(url);
    }, 2000);
    toast("已导出 JSON 备份", "success");
  }

  function triggerImport() {
    if (!dom.importFile) return;
    dom.importFile.value = "";
    dom.importFile.click();
  }

  function validateImport(raw) {
    if (!isPlainObject(raw)) {
      return { ok: false, message: "JSON 顶层必须是一个对象，例如 { profile, projects, notes, skills, settings }。" };
    }
    const known = ["profile", "stats", "timeline", "skills", "tools", "projects", "notes", "settings"];
    const present = known.filter(function (key) {
      return Object.prototype.hasOwnProperty.call(raw, key);
    });
    if (!present.length) {
      return { ok: false, message: "文件里没有找到 profile / projects / notes / skills / settings 等字段，可能不是这个工作台的备份。" };
    }

    const problems = [];
    if ("profile" in raw && !isPlainObject(raw.profile)) problems.push("profile 必须是对象");
    if ("settings" in raw && !isPlainObject(raw.settings)) problems.push("settings 必须是对象");
    const arrayKeys = ["stats", "timeline", "skills", "projects", "notes", "tools"];
    arrayKeys.forEach(function (key) {
      if (key in raw && !Array.isArray(raw[key])) problems.push(key + " 必须是数组");
    });

    if (Array.isArray(raw.projects)) {
      raw.projects.forEach(function (item, index) {
        if (!isPlainObject(item)) {
          problems.push("projects[" + index + "] 不是对象");
          return;
        }
        if ("title" in item && typeof item.title !== "string") problems.push("projects[" + index + "].title 必须是字符串");
        if ("tags" in item && !Array.isArray(item.tags)) problems.push("projects[" + index + "].tags 必须是数组");
      });
    }
    if (Array.isArray(raw.notes)) {
      raw.notes.forEach(function (item, index) {
        if (!isPlainObject(item)) {
          problems.push("notes[" + index + "] 不是对象");
          return;
        }
        if ("title" in item && typeof item.title !== "string") problems.push("notes[" + index + "].title 必须是字符串");
        if ("content" in item && typeof item.content !== "string") problems.push("notes[" + index + "].content 必须是字符串");
      });
    }
    if (Array.isArray(raw.skills)) {
      raw.skills.forEach(function (item, index) {
        if (!isPlainObject(item)) {
          problems.push("skills[" + index + "] 不是对象");
        } else if ("items" in item && !Array.isArray(item.items)) {
          problems.push("skills[" + index + "].items 必须是数组");
        }
      });
    }
    if (Array.isArray(raw.timeline)) {
      raw.timeline.forEach(function (item, index) {
        if (!isPlainObject(item)) problems.push("timeline[" + index + "] 不是对象");
      });
    }
    if (Array.isArray(raw.tools)) {
      raw.tools.forEach(function (item, index) {
        if (typeof item !== "string") problems.push("tools[" + index + "] 必须是字符串");
      });
    }
    if (isPlainObject(raw.profile)) {
      if ("tagline" in raw.profile && !Array.isArray(raw.profile.tagline)) problems.push("profile.tagline 必须是数组");
      if ("socials" in raw.profile && !Array.isArray(raw.profile.socials)) problems.push("profile.socials 必须是数组");
    }
    if (isPlainObject(raw.settings)) {
      if ("marquee" in raw.settings && !Array.isArray(raw.settings.marquee)) problems.push("settings.marquee 必须是数组");
      if ("showAdminLink" in raw.settings && typeof raw.settings.showAdminLink !== "boolean") {
        problems.push("settings.showAdminLink 必须是布尔值");
      }
    }

    if (problems.length) {
      const shown = problems.slice(0, 6).map(function (problem) {
        return "· " + escapeHtml(problem);
      }).join("<br>");
      const more = problems.length > 6 ? "<br>…另有 " + (problems.length - 6) + " 处问题" : "";
      return { ok: false, message: "文件结构有几处不符合内容格式：<br><br>" + shown + more };
    }

    return {
      ok: true,
      summary: {
        projects: Array.isArray(raw.projects) ? raw.projects.length : null,
        notes: Array.isArray(raw.notes) ? raw.notes.length : null,
        skills: Array.isArray(raw.skills) ? raw.skills.length : null,
        timeline: Array.isArray(raw.timeline) ? raw.timeline.length : null,
        hasProfile: isPlainObject(raw.profile),
        hasSettings: isPlainObject(raw.settings)
      }
    };
  }

  function handleImportFile(file) {
    if (!file) return;
    if (file.size > MAX_IMPORT_BYTES) {
      showMessage("文件太大", "请选择小于 8MB 的 JSON 文件（当前 " + formatSize(file.size) + "）。");
      return;
    }
    const reader = new FileReader();
    reader.onload = function () {
      let raw;
      try {
        raw = JSON.parse(String(reader.result));
      } catch (error) {
        showMessage("无法导入这个文件", "文件不是有效的 JSON，请检查是否选择了正确的备份文件。");
        return;
      }
      const result = validateImport(raw);
      if (!result.ok) {
        showMessage("无法导入这个文件", result.message);
        return;
      }
      state.pendingImport = { data: raw, summary: result.summary, name: file.name };
      openImportDialog();
    };
    reader.onerror = function () {
      showMessage("读取失败", "浏览器无法读取这个文件，请重试。");
    };
    reader.readAsText(file);
  }

  function openImportDialog() {
    const pending = state.pendingImport;
    if (!pending) return;
    const summary = pending.summary;
    const value = function (count) {
      return count === null ? "—" : String(count);
    };
    dom.importDialog.innerHTML =
      '<header class="modal__head">' +
      '<div class="modal__head-text">' +
      '<p class="modal__eyebrow">IMPORT · JSON 备份</p>' +
      '<h2 class="modal__title" id="import-dialog-title">导入内容</h2>' +
      '<p class="modal__sub">已读取「' + escapeHtml(pending.name || "内容备份.json") + "」，选择一种方式。</p>" +
      "</div>" +
      '<button class="icon-btn modal__close" type="button" data-action="close-dialog" aria-label="关闭">✕</button>' +
      "</header>" +
      '<div class="modal__body">' +
      '<dl class="import-summary">' +
      "<div><dt>项目</dt><dd>" + value(summary.projects) + "</dd></div>" +
      "<div><dt>文章</dt><dd>" + value(summary.notes) + "</dd></div>" +
      "<div><dt>技能组</dt><dd>" + value(summary.skills) + "</dd></div>" +
      "<div><dt>时间线</dt><dd>" + value(summary.timeline) + "</dd></div>" +
      "<div><dt>个人资料</dt><dd>" + (summary.hasProfile ? "包含" : "—") + "</dd></div>" +
      "<div><dt>网站设置</dt><dd>" + (summary.hasSettings ? "包含" : "—") + "</dd></div>" +
      "</dl>" +
      '<div class="import-grid">' +
      '<button class="import-option" type="button" data-action="import-merge"><strong>合并导入</strong><span>保留当前内容，用备份覆盖同名字段；数组（作品、文章等）整体替换。</span></button>' +
      '<button class="import-option import-option--danger" type="button" data-action="import-replace"><strong>替换全部</strong><span>先清空当前内容，再完整写入备份文件。适合迁移到新浏览器。</span></button>' +
      "</div>" +
      '<p class="field__hint">导入会立即覆盖并保存，建议先「导出 JSON」备份当前内容。</p>' +
      "</div>" +
      '<footer class="modal__foot modal__foot--end">' +
      '<div class="modal__foot-right"><button class="btn btn--ghost btn--sm" type="button" data-action="close-dialog">取消</button></div>' +
      "</footer>";
    if (dom.importDialog.open) dom.importDialog.close();
    dom.importDialog.showModal();
  }

  function applyImport(mode) {
    const pending = state.pendingImport;
    if (!pending) {
      closeDialog(dom.importDialog);
      return;
    }
    const defaults = PortfolioStore.defaults();
    if (mode === "replace") {
      state.data = deepMerge(defaults, pending.data);
    } else {
      state.data = deepMerge(state.data, pending.data);
    }
    state.pendingImport = null;
    closeDialog(dom.importDialog);
    ensureDataShape();
    state.dirty = true;
    saveNow({});
    renderSection();
    updateMetaTexts();
    toast(mode === "replace" ? "已替换为导入的内容" : "已合并导入的内容", "success");
  }

  function resetAll() {
    askConfirm({
      eyebrow: "DANGER ZONE",
      title: "恢复默认内容？",
      message: "这会删除本浏览器里的所有编辑，并把作品、文章、资料与设置恢复为网站初始的默认内容。这个操作无法撤销。",
      hint: "建议先「导出 JSON」备份当前内容。",
      confirmLabel: "恢复默认",
      danger: true,
      onConfirm: function () {
        if (state.saveTimer) {
          clearTimeout(state.saveTimer);
          state.saveTimer = null;
        }
        state.data = PortfolioStore.reset();
        ensureDataShape();
        state.dirty = false;
        state.saveError = false;
        state.lastSavedAt = null;
        state.loadedLocalCopy = false;
        renderSection();
        updateSaveUI();
        updateMetaTexts();
        toast("已恢复默认内容", "success");
      }
    });
  }

  /* ============================================================
     Images
     ============================================================ */

  function readImageFile(file, onSuccess, onError) {
    if (!file) return;
    if (file.type && file.type.indexOf("image/") !== 0) {
      onError("请选择图片文件（JPG / PNG / WebP）。");
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      onError("图片不能超过 1.5MB（当前 " + formatSize(file.size) + "）。请压缩后重试，或改用图片链接。");
      return;
    }
    const reader = new FileReader();
    reader.onload = function () {
      onSuccess(String(reader.result));
    };
    reader.onerror = function () {
      onError("读取图片失败，请重试。");
    };
    reader.readAsDataURL(file);
  }

  function updateAvatarPreview() {
    const profile = state.data.profile || {};
    const host = document.getElementById("avatar-preview");
    if (host) host.innerHTML = avatarMarkup(profile);
    const status = document.getElementById("avatar-status");
    if (status) status.textContent = avatarSourceText();
    const urlInput = document.getElementById("f-profile-avatar");
    const value = typeof profile.avatar === "string" ? profile.avatar : "";
    if (urlInput && document.activeElement !== urlInput) {
      urlInput.value = value.startsWith("data:") ? "" : value;
    }
  }

  function handleFileInput(input) {
    const file = input.files && input.files[0];
    input.value = "";
    if (!file) return;
    const kind = input.dataset.file;
    if (kind === "project-cover") {
      if (!state.draft || state.draft.kind !== "project") return;
      const errorEl = document.getElementById("cover-error");
      setInlineError(errorEl, "");
      readImageFile(
        file,
        function (dataUrl) {
          state.draft.item.cover = dataUrl;
          const urlInput = document.getElementById("f-draft-cover");
          if (urlInput) urlInput.value = "";
          syncProjectPreview();
          toast("封面已载入，记得点「保存项目」", "info");
        },
        function (message) {
          setInlineError(errorEl, message);
          toast(message, "error", 6000);
        }
      );
      return;
    }
    if (kind === "avatar") {
      const errorEl = document.getElementById("avatar-error");
      setInlineError(errorEl, "");
      readImageFile(
        file,
        function (dataUrl) {
          state.data.profile.avatar = dataUrl;
          markDirty();
          updateAvatarPreview();
          toast("头像已更新", "success");
        },
        function (message) {
          setInlineError(errorEl, message);
          toast(message, "error", 6000);
        }
      );
    }
  }

  /* ============================================================
     Color picking
     ============================================================ */

  function applyColor(bind, color) {
    const safe = safeHex(color, "#df6249");
    setBindValue(bind, safe);
    const input = document.querySelector('input[type="color"][data-bind="' + bind + '"]');
    if (input) input.value = safe;
    updateColorReadout(bind, safe);
    if (bind.startsWith("draft.")) {
      syncProjectPreview();
      return;
    }
    markDirty();
  }

  /* ============================================================
     Structure actions (inline sections)
     ============================================================ */

  function addSocial() {
    if (!Array.isArray(state.data.profile.socials)) state.data.profile.socials = [];
    state.data.profile.socials.push({ label: "", handle: "", url: "" });
    const index = state.data.profile.socials.length - 1;
    refreshSection("profile.socials." + index + ".label");
  }

  function removeSocial(index) {
    if (!Array.isArray(state.data.profile.socials)) return;
    state.data.profile.socials.splice(index, 1);
    refreshSection();
    toast("已移除一条社交链接", "info");
  }

  function addStat() {
    if (!Array.isArray(state.data.stats)) state.data.stats = [];
    state.data.stats.push({ value: "", label: "", note: "" });
    const index = state.data.stats.length - 1;
    refreshSection("stats." + index + ".value");
  }

  function removeStat(index) {
    if (!Array.isArray(state.data.stats)) return;
    state.data.stats.splice(index, 1);
    refreshSection();
    toast("已移除一个数据项", "info");
  }

  function addSkillGroup() {
    if (!Array.isArray(state.data.skills)) state.data.skills = [];
    state.data.skills.push({
      id: uniqueId("group"),
      title: "新技能组",
      en: "NEW",
      desc: "",
      items: [{ name: "新技能", level: 70, note: "" }]
    });
    refreshSection("skills." + (state.data.skills.length - 1) + ".title");
  }

  function removeSkillGroup(index) {
    const group = state.data.skills[index];
    if (!group) return;
    askConfirm({
      eyebrow: "DELETE GROUP",
      title: "删除这组技能？",
      message: "「" + escapeHtml(group.title || "未命名技能组") + "」及其中的技能项都会被移除。",
      confirmLabel: "删除技能组",
      danger: true,
      onConfirm: function () {
        state.data.skills.splice(index, 1);
        markDirty();
        renderSection();
        toast("已删除技能组", "success");
      }
    });
  }

  function moveSkillGroup(index, direction) {
    if (moveListItem(state.data.skills, index, direction)) {
      markDirty();
      renderSection();
    }
  }

  function addSkillItem(groupIndex) {
    const group = state.data.skills[groupIndex];
    if (!group) return;
    if (!Array.isArray(group.items)) group.items = [];
    group.items.push({ name: "新技能", level: 70, note: "" });
    refreshSection("skills." + groupIndex + ".items." + (group.items.length - 1) + ".name");
  }

  function removeSkillItem(groupIndex, itemIndex) {
    const group = state.data.skills[groupIndex];
    if (!group || !Array.isArray(group.items)) return;
    group.items.splice(itemIndex, 1);
    refreshSection();
    toast("已移除技能项", "info");
  }

  function addTimeline() {
    if (!Array.isArray(state.data.timeline)) state.data.timeline = [];
    const year = String(new Date().getFullYear());
    state.data.timeline.push({
      year: year,
      date: year + ".01",
      title: "新的经历",
      org: "",
      desc: "",
      tag: "项目"
    });
    refreshSection("timeline." + (state.data.timeline.length - 1) + ".title");
  }

  function removeTimeline(index) {
    const entry = state.data.timeline[index];
    if (!entry) return;
    askConfirm({
      eyebrow: "DELETE ENTRY",
      title: "删除这条经历？",
      message: "「" + escapeHtml(entry.title || "未命名经历") + "」会从时间线中移除。",
      confirmLabel: "删除经历",
      danger: true,
      onConfirm: function () {
        state.data.timeline.splice(index, 1);
        markDirty();
        renderSection();
        toast("已删除经历", "success");
      }
    });
  }

  function moveTimeline(index, direction) {
    if (moveListItem(state.data.timeline, index, direction)) {
      markDirty();
      renderSection();
    }
  }

  /* ============================================================
     Delegated events
     ============================================================ */

  function readControlValue(control) {
    if (control.matches('input[type="range"][data-level]')) {
      return Number(control.value);
    }
    const type = control.dataset.type;
    if (type === "csv") {
      return String(control.value || "")
        .split(/[,，、]/)
        .map(function (part) { return part.trim(); })
        .filter(Boolean);
    }
    if (type === "lines") {
      return String(control.value || "")
        .split(/\r?\n/)
        .map(function (line) { return line.trim(); })
        .filter(Boolean);
    }
    return control.value;
  }

  function handleInput(event) {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    if (!target.hasAttribute("data-bind")) return;
    if (target.type === "checkbox" || target.type === "file") return;

    if (target.matches('input[type="range"][data-level]')) {
      const control = target.closest(".level-control");
      const output = control ? control.querySelector(".level-value") : null;
      if (output) output.textContent = target.value + "%";
    }

    const bind = target.getAttribute("data-bind");
    const value = readControlValue(target);
    setBindValue(bind, value);

    if (target.type === "color") {
      updateColorReadout(bind, value);
      if (bind.startsWith("draft.")) syncProjectPreview();
    }

    if (bind.startsWith("draft.")) {
      if (bind === "draft.content") {
        const stats = document.getElementById("note-editor-stats");
        if (stats) {
          stats.textContent = countParagraphs(value) + " 段 · " + String(value).length + " 字";
        }
      }
      return;
    }

    markDirty();
  }

  function handleChange(event) {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;

    if (target.matches('input[type="file"]')) {
      if (target.id === "import-file") {
        const file = target.files && target.files[0];
        target.value = "";
        handleImportFile(file);
        return;
      }
      if (target.dataset.file) handleFileInput(target);
      return;
    }

    const bind = target.getAttribute("data-bind");
    if (!bind) return;

    if (target.type === "checkbox") {
      setBindValue(bind, target.checked);
      if (!bind.startsWith("draft.")) markDirty();
      return;
    }

    if (bind === "draft.cover") {
      if (state.draft && state.draft.kind === "project") {
        state.draft.item.cover = String(target.value || "").trim();
        syncProjectPreview();
      }
      return;
    }

    if (bind === "profile.avatar") {
      updateAvatarPreview();
    }
  }

  const actionHandlers = {
    "save-now": function () {
      saveNow({ toast: true });
    },
    "close-dialog": function (button) {
      const dialog = button.closest("dialog");
      closeDialog(dialog);
    },
    "confirm-ok": function () {
      const config = state.confirm;
      closeDialog(dom.confirmDialog);
      if (config && typeof config.onConfirm === "function") config.onConfirm();
    },
    "new-project": function () {
      openProjectDialog(null);
    },
    "edit-project": function (button) {
      openProjectDialog(button.dataset.id);
    },
    "delete-project": function (button) {
      confirmDeleteProject(button.dataset.id);
    },
    "move-project": function (button) {
      const list = state.data.projects || [];
      const index = list.findIndex(function (project) {
        return project.id === button.dataset.id;
      });
      if (index < 0) return;
      if (moveListItem(list, index, Number(button.dataset.direction))) {
        markDirty();
        renderSection();
      }
    },
    "save-project": function () {
      saveProjectDraft();
    },
    "delete-project-draft": function () {
      confirmDeleteDraftProject();
    },
    "pick-cover": function () {
      const input = document.getElementById("project-cover-file");
      if (input) input.click();
    },
    "cover-clear": function () {
      if (!state.draft || state.draft.kind !== "project") return;
      state.draft.item.cover = "";
      const urlInput = document.getElementById("f-draft-cover");
      if (urlInput) urlInput.value = "";
      const errorEl = document.getElementById("cover-error");
      setInlineError(errorEl, "");
      syncProjectPreview();
    },
    "pick-avatar": function () {
      if (dom.avatarFile) dom.avatarFile.click();
    },
    "avatar-clear": function () {
      state.data.profile.avatar = "";
      markDirty();
      updateAvatarPreview();
      setInlineError(document.getElementById("avatar-error"), "");
      toast("头像已清除", "info");
    },
    "add-social": function () {
      addSocial();
    },
    "remove-social": function (button) {
      removeSocial(Number(button.dataset.index));
    },
    "add-stat": function () {
      addStat();
    },
    "remove-stat": function (button) {
      removeStat(Number(button.dataset.index));
    },
    "add-skill-group": function () {
      addSkillGroup();
    },
    "remove-skill-group": function (button) {
      removeSkillGroup(Number(button.dataset.index));
    },
    "move-skill-group": function (button) {
      moveSkillGroup(Number(button.dataset.index), Number(button.dataset.direction));
    },
    "add-skill-item": function (button) {
      addSkillItem(Number(button.dataset.group));
    },
    "remove-skill-item": function (button) {
      removeSkillItem(Number(button.dataset.group), Number(button.dataset.index));
    },
    "add-timeline": function () {
      addTimeline();
    },
    "remove-timeline": function (button) {
      removeTimeline(Number(button.dataset.index));
    },
    "move-timeline": function (button) {
      moveTimeline(Number(button.dataset.index), Number(button.dataset.direction));
    },
    "new-note": function () {
      openNoteDialog(null);
    },
    "edit-note": function (button) {
      openNoteDialog(button.dataset.id);
    },
    "save-note": function () {
      saveNoteDraft();
    },
    "delete-note": function (button) {
      confirmDeleteNote(button.dataset.id);
    },
    "move-note": function (button) {
      const list = state.data.notes || [];
      const index = list.findIndex(function (note) {
        return note.id === button.dataset.id;
      });
      if (index < 0) return;
      if (moveListItem(list, index, Number(button.dataset.direction))) {
        markDirty();
        renderSection();
      }
    },
    "delete-note-draft": function () {
      confirmDeleteDraftNote();
    },
    "pick-color": function (button) {
      applyColor(button.dataset.bind, button.dataset.color);
    },
    "export-json": function () {
      exportJson();
    },
    "import-json": function () {
      triggerImport();
    },
    "import-merge": function () {
      applyImport("merge");
    },
    "import-replace": function () {
      applyImport("replace");
    },
    "reset-all": function () {
      resetAll();
    }
  };

  function handleClick(event) {
    const trigger = event.target.closest("[data-action]");
    if (!trigger || trigger.disabled) return;
    const handler = actionHandlers[trigger.dataset.action];
    if (!handler) return;
    event.preventDefault();
    handler(trigger);
  }

  /* ============================================================
     Dialogs / keyboard / external changes
     ============================================================ */

  function bindDialogLifecycle() {
    dom.projectDialog.addEventListener("close", function () {
      if (state.draft && state.draft.kind === "project") state.draft = null;
    });
    dom.noteDialog.addEventListener("close", function () {
      if (state.draft && state.draft.kind === "note") state.draft = null;
    });
    dom.confirmDialog.addEventListener("close", function () {
      state.confirm = null;
    });
    dom.importDialog.addEventListener("close", function () {
      state.pendingImport = null;
    });
  }

  function handleKeydown(event) {
    if ((event.metaKey || event.ctrlKey) && String(event.key).toLowerCase() === "s") {
      event.preventDefault();
      saveNow({ toast: true });
    }
  }

  function handleBeforeUnload(event) {
    if (state.dirty) {
      event.preventDefault();
      event.returnValue = "";
    }
  }

  function handleExternalChange(data, source) {
    if (source === "local" || source === "memory") return;
    const now = Date.now();
    if (now - state.lastExternalAt < 300) return;
    state.lastExternalAt = now;
    if (state.dirty) {
      toast("另一个标签页更新了内容。当前页面还有未保存改动，刷新后可载入最新版本。", "info", 6000);
      return;
    }
    state.data = data;
    state.loadedLocalCopy = PortfolioStore.hasLocalCopy();
    const meta = state.data && state.data._meta;
    const savedAt = meta && meta.updatedAt ? Date.parse(meta.updatedAt) : NaN;
    state.lastSavedAt = Number.isFinite(savedAt) ? savedAt : null;
    renderSection();
    updateSaveUI();
    updateMetaTexts();
    toast("已载入另一个标签页保存的内容", "info");
  }

  function handleImageError(event) {
    const target = event.target;
    if (!(target instanceof HTMLImageElement)) return;
    if (target.hasAttribute("data-cover-img") || target.hasAttribute("data-avatar-img")) {
      target.remove();
    }
  }

  /* ============================================================
     Routing & init
     ============================================================ */

  function syncRoute() {
    const raw = String(window.location.hash || "").replace(/^#\/?/, "");
    const id = SECTIONS.some(function (section) {
      return section.id === raw;
    })
      ? raw
      : "overview";
    if (window.location.hash !== "#/" + id) {
      history.replaceState(null, "", "#/" + id);
    }
    state.section = id;
    renderSection();
    window.scrollTo({ top: 0, behavior: "auto" });
  }

  function cacheDom() {
    dom.nav = document.getElementById("studio-nav");
    dom.root = document.getElementById("section-root");
    dom.topbarNum = document.getElementById("topbar-num");
    dom.topbarTitle = document.getElementById("topbar-title");
    dom.saveState = document.getElementById("save-state");
    dom.saveStateText = document.getElementById("save-state-text");
    dom.saveBtn = document.getElementById("save-btn");
    dom.storageMeta = document.getElementById("storage-meta");
    dom.footerStorage = document.getElementById("footer-storage");
    dom.projectDialog = document.getElementById("project-dialog");
    dom.noteDialog = document.getElementById("note-dialog");
    dom.confirmDialog = document.getElementById("confirm-dialog");
    dom.importDialog = document.getElementById("import-dialog");
    dom.toastZone = document.getElementById("toast-zone");
    dom.importFile = document.getElementById("import-file");
    dom.avatarFile = document.getElementById("avatar-file");
  }

  function init() {
    cacheDom();
    loadData();
    renderNav();
    syncRoute();
    updateSaveUI();
    updateMetaTexts();
    bindDialogLifecycle();

    document.addEventListener("click", handleClick);
    document.addEventListener("input", handleInput);
    document.addEventListener("change", handleChange);
    document.addEventListener("keydown", handleKeydown);
    document.addEventListener("error", handleImageError, true);
    window.addEventListener("hashchange", syncRoute);
    window.addEventListener("beforeunload", handleBeforeUnload);

    PortfolioStore.subscribe(handleExternalChange);

    setInterval(function () {
      const lastEl = document.getElementById("overview-last-saved");
      if (lastEl) lastEl.textContent = lastSavedText();
    }, 30000);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
