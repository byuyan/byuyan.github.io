/* ============================================================
   PortfolioStore — one content store shared by the public site
   and /admin/. Defaults live in content.js; edits live in
   localStorage so the static site stays live without a build.
   ============================================================ */

(function () {
  "use strict";

  var KEY = "lzy.portfolio.v1";
  var CHANNEL = "lzy.portfolio";

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function isPlainObject(value) {
    return !!value && typeof value === "object" && !Array.isArray(value);
  }

  // Saved content is merged over defaults so new fields keep working
  // after the code is updated. Arrays are replaced wholesale.
  function merge(base, saved) {
    if (Array.isArray(base)) return Array.isArray(saved) ? saved : clone(base);
    if (isPlainObject(base)) {
      var out = {};
      Object.keys(base).forEach(function (key) {
        out[key] = merge(base[key], saved && saved[key]);
      });
      if (isPlainObject(saved)) {
        Object.keys(saved).forEach(function (key) {
          if (!(key in out)) out[key] = saved[key];
        });
      }
      return out;
    }
    return saved === undefined ? base : saved;
  }

  function defaults() {
    return clone(window.PORTFOLIO_DEFAULT || {});
  }

  function load() {
    var base = defaults();
    try {
      var raw = window.localStorage.getItem(KEY);
      if (!raw) return base;
      var saved = JSON.parse(raw);
      if (!isPlainObject(saved)) return base;
      return merge(base, saved);
    } catch (error) {
      console.warn("[PortfolioStore] Could not read local content:", error);
      return base;
    }
  }

  function save(data) {
    try {
      window.localStorage.setItem(KEY, JSON.stringify(data));
      notify(data);
      return true;
    } catch (error) {
      console.warn("[PortfolioStore] Could not save content:", error);
      throw error;
    }
  }

  function reset() {
    window.localStorage.removeItem(KEY);
    var data = defaults();
    notify(data);
    return data;
  }

  function hasLocalCopy() {
    try {
      return !!window.localStorage.getItem(KEY);
    } catch (error) {
      return false;
    }
  }

  var listeners = [];
  var channel = null;
  try {
    if (typeof BroadcastChannel !== "undefined") channel = new BroadcastChannel(CHANNEL);
  } catch (error) {
    channel = null;
  }

  function emit(data, source) {
    listeners.slice().forEach(function (callback) {
      try {
        callback(data, source);
      } catch (error) {
        console.warn("[PortfolioStore] listener failed:", error);
      }
    });
  }

  function notify(data) {
    emit(data, "local");
    if (channel) {
      try {
        channel.postMessage({ type: "change", data: data });
      } catch (error) {
        /* ignore serialization issues */
      }
    }
  }

  function subscribe(callback) {
    listeners.push(callback);
    return function unsubscribe() {
      var index = listeners.indexOf(callback);
      if (index > -1) listeners.splice(index, 1);
    };
  }

  if (channel) {
    channel.addEventListener("message", function (event) {
      if (event.data && event.data.type === "change") emit(event.data.data, "broadcast");
    });
  }

  window.addEventListener("storage", function (event) {
    if (event.key === KEY) emit(load(), "storage");
  });

  // Files opened directly from disk get a filesystem origin; keep a
  // memory fallback so the site still renders if localStorage throws.
  var memoryFallback = null;
  if (!hasLocalCopy() && !canUseStorage()) {
    memoryFallback = defaults();
  }

  function canUseStorage() {
    try {
      var probe = "__lzy_probe__";
      window.localStorage.setItem(probe, "1");
      window.localStorage.removeItem(probe);
      return true;
    } catch (error) {
      return false;
    }
  }

  // Re-load through the fallback when storage is unavailable.
  var originalLoad = load;
  load = function () {
    if (memoryFallback) return clone(memoryFallback);
    return originalLoad();
  };

  var originalSave = save;
  save = function (data) {
    if (memoryFallback) {
      memoryFallback = clone(data);
      emit(memoryFallback, "memory");
      return true;
    }
    return originalSave(data);
  };

  window.PortfolioStore = {
    KEY: KEY,
    load: load,
    save: save,
    reset: reset,
    subscribe: subscribe,
    defaults: defaults,
    hasLocalCopy: hasLocalCopy,
    clone: clone
  };
})();
