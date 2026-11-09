/* ============================================================
   SITE BEHAVIOUR
   Renders content from PortfolioStore, drives the scroll story,
   modals, navigation, cursor and small delightful details.
   ============================================================ */

(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var data = window.PortfolioStore.load();

  var browseState = {
    projects: { q: "", category: "全部", sort: "featured" },
    notes: { q: "", tag: "全部", sort: "newest" }
  };

  var $ = function (selector, scope) {
    return (scope || document).querySelector(selector);
  };
  var $$ = function (selector, scope) {
    return Array.prototype.slice.call((scope || document).querySelectorAll(selector));
  };

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

  function formatDate(value) {
    var date = new Date(value + "T00:00:00");
    if (isNaN(date.getTime())) return escapeHTML(value);
    return date.getFullYear() + "." + String(date.getMonth() + 1).padStart(2, "0") + "." + String(date.getDate()).padStart(2, "0");
  }

  /* ---------------------------------------------------------- */
  /*  Render                                                     */
  /* ---------------------------------------------------------- */

  function setText(selector, value) {
    $$(selector).forEach(function (node) {
      node.textContent = value == null ? "" : value;
    });
  }

  function renderProfile() {
    var profile = data.profile || {};
    setText("[data-profile-name]", profile.name);
    setText("[data-profile-name-en]", (profile.nameEn || "").toUpperCase());
    setText("[data-profile-role]", profile.role);
    setText("[data-profile-role-short]", profile.roleShort);
    setText("[data-profile-school]", profile.school);
    setText("[data-profile-location]", profile.location);
    setText("[data-profile-status]", profile.status);
    setText("[data-profile-availability]", profile.availability);
    setText("[data-profile-email]", profile.email);

    var tagline = profile.tagline || [];
    setText("[data-tagline-1]", tagline[0] || "");
    setText("[data-tagline-2]", tagline[1] || "");

    var intro = profile.intro || "";
    $$("[data-profile-intro]").forEach(function (node) {
      node.textContent = intro;
    });
    var longIntro = $("[data-profile-intro-long]");
    if (longIntro) longIntro.textContent = intro;

    var emailLink = $(".contact__email");
    if (emailLink && profile.email) {
      emailLink.href = "mailto:" + profile.email;
      emailLink.textContent = profile.email;
    }
    var copyButton = $("#copy-email");
    if (copyButton && profile.email) {
      copyButton.dataset.copy = profile.email;
    }
    $$("[data-form-email]").forEach(function (link) {
      if (!profile.email) return;
      link.href = "mailto:" + profile.email;
      link.textContent = profile.email;
    });
    $$(".mobile-menu__foot [data-profile-email]").forEach(function (node) {
      node.textContent = profile.email || "";
    });

    var adminLink = $("[data-admin-link]");
    if (adminLink) adminLink.hidden = !(data.settings && data.settings.showAdminLink);

    var avatar = safeUrl(profile.avatar) || "assets/img/portrait.webp";
    $$("[data-profile-avatar], .about__portrait img").forEach(function (image) {
      image.hidden = false;
      if (image.getAttribute("src") !== avatar) image.src = avatar;
    });

    var favicon = $('link[rel="icon"]');
    if (favicon) favicon.href = "assets/img/favicon.svg";
  }

  function renderStats() {
    var host = $("[data-stats]");
    if (!host) return;
    host.innerHTML = (data.stats || [])
      .map(function (stat) {
        return (
          '<div class="stat">' +
          '<strong class="stat__value">' + escapeHTML(stat.value) + "</strong>" +
          '<span class="stat__label">' + escapeHTML(stat.label) + "</span>" +
          '<small class="stat__note">' + escapeHTML(stat.note) + "</small>" +
          "</div>"
        );
      })
      .join("");
  }

  function renderTimeline() {
    var host = $("[data-timeline]");
    if (!host) return;
    host.innerHTML = (data.timeline || [])
      .map(function (item, index) {
        return (
          '<li class="timeline__item" data-reveal style="--reveal-delay:' + index * 70 + 'ms">' +
          '<div class="timeline__date"><span>' + escapeHTML(item.date) + "</span><em>" + escapeHTML(item.year) + "</em></div>" +
          '<div class="timeline__marker"><i></i></div>' +
          '<div class="timeline__body">' +
          '<div class="timeline__meta"><span class="tag">' + escapeHTML(item.tag) + "</span><span>" + escapeHTML(item.org) + "</span></div>" +
          "<h3>" + escapeHTML(item.title) + "</h3>" +
          "<p>" + escapeHTML(item.desc) + "</p>" +
          "</div>" +
          "</li>"
        );
      })
      .join("");
  }

  /* 「这个站本身」的版本线。没有记录就整块收起来，不留空标题。 */
  function renderSiteLog() {
    var host = $("[data-sitelog]");
    if (!host) return;
    var list = data.siteLog || [];
    if (!list.length) {
      var wrap = host.closest(".sitelog");
      if (wrap) wrap.hidden = true;
      return;
    }
    host.innerHTML = list
      .map(function (entry, index) {
        return (
          '<li class="sitelog__item" data-reveal style="--reveal-delay:' + index * 60 + 'ms">' +
          '<div class="sitelog__side">' +
          '<span class="sitelog__version">' + escapeHTML(entry.version) + "</span>" +
          '<span class="sitelog__date">' + escapeHTML(entry.date) + "</span>" +
          "</div>" +
          '<div class="sitelog__body">' +
          "<h3>" + escapeHTML(entry.title) + "</h3>" +
          "<p>" + escapeHTML(entry.desc) + "</p>" +
          "</div>" +
          "</li>"
        );
      })
      .join("");
  }

  /* 成绩：一条一张卡。value 用大字，是这块唯一的「数字」。 */
  function renderAchievements() {
    var host = $("[data-achievements]");
    if (!host) return;
    var list = data.achievements || [];
    var section = host.closest(".achievements");
    if (!list.length) {
      if (section) section.hidden = true;
      return;
    }
    if (section) section.hidden = false;
    host.innerHTML = list
      .map(function (item, index) {
        return (
          '<article class="achievement" data-reveal style="--reveal-delay:' + index * 70 + 'ms">' +
          '<div class="achievement__top">' +
          '<span class="achievement__tag">' + escapeHTML(item.tag) + "</span>" +
          '<span class="achievement__year">' + escapeHTML(item.year) + "</span>" +
          "</div>" +
          '<strong class="achievement__value">' + escapeHTML(item.value) + "</strong>" +
          '<h3 class="achievement__title">' + escapeHTML(item.title) + "</h3>" +
          '<p class="achievement__note">' + escapeHTML(item.note) + "</p>" +
          "</article>"
        );
      })
      .join("");
  }

  /* 爱好：行式，左边编号，右边标题 + 一段具体的描述。 */
  function renderHobbies() {
    var host = $("[data-hobbies]");
    if (!host) return;
    var list = data.hobbies || [];
    var section = host.closest(".hobbies");
    if (!list.length) {
      if (section) section.hidden = true;
      return;
    }
    if (section) section.hidden = false;
    host.innerHTML = list
      .map(function (item, index) {
        return (
          '<article class="hobby" data-reveal style="--reveal-delay:' + index * 70 + 'ms">' +
          '<span class="hobby__num">' + String(index + 1).padStart(2, "0") + "</span>" +
          '<div class="hobby__body">' +
          '<h3 class="hobby__title">' + escapeHTML(item.title) +
          (item.en ? '<em>' + escapeHTML(item.en) + "</em>" : "") + "</h3>" +
          '<p class="hobby__desc">' + escapeHTML(item.desc) + "</p>" +
          "</div>" +
          "</article>"
        );
      })
      .join("");
  }

  function renderSkills() {
    var host = $("[data-skills]");
    if (!host) return;
    host.innerHTML = (data.skills || [])
      .map(function (group, index) {
        var items = (group.items || [])
          .map(function (item) {
            var level = Math.max(0, Math.min(100, Number(item.level) || 0));
            return (
              '<li class="skill-item">' +
              '<div class="skill-item__top"><span>' + escapeHTML(item.name) + "</span><em>" + level + "</em></div>" +
              '<div class="skill-bar"><i style="--level:' + level + '%"></i></div>' +
              '<small>' + escapeHTML(item.note) + "</small>" +
              "</li>"
            );
          })
          .join("");
        return (
          '<article class="skill-group" data-reveal style="--reveal-delay:' + index * 110 + 'ms">' +
          '<header class="skill-group__head">' +
          '<div class="skill-group__top"><span class="skill-group__num">0' + (index + 1) + "</span><span class=\"skill-group__en\">" + escapeHTML(group.en) + "</span></div>" +
          '<h3 class="skill-group__title">' + escapeHTML(group.title) + "</h3>" +
          '<p class="skill-group__desc">' + escapeHTML(group.desc) + "</p>" +
          "</header>" +
          '<ul class="skill-group__list">' + items + "</ul>" +
          "</article>"
        );
      })
      .join("");

    var toolsHost = $("[data-tools]");
    if (toolsHost) {
      var tools = (data.tools || []).slice();
      var repeated = tools.concat(tools);
      toolsHost.innerHTML = repeated
        .map(function (tool) {
          return "<span>" + escapeHTML(tool) + "</span><i>✦</i>";
        })
        .join("");
    }
  }

  function projectCover(project, index) {
    var accent = safeColor(project.accent, "#a8b8a0");
    var ink = safeColor(project.ink, "#16170f");
    var cover = safeUrl(project.cover);
    var fallback =
      '<div class="project-card__fallback" aria-hidden="true">' +
      '<span class="project-card__fallback-en">' + escapeHTML((project.en || "").split(" ")[0]) + "</span>" +
      '<span class="project-card__fallback-num">0' + (index + 1) + "</span>" +
      "</div>";
    var image = cover
      ? '<img class="project-card__img" src="' + escapeHTML(cover) + '" alt="' + escapeHTML(project.title + " 项目封面") + '" loading="lazy" />'
      : "";
    return (
      '<div class="project-card__cover" style="--project-accent:' + accent + ";--project-ink:" + ink + '">' +
      fallback +
      image +
      '<span class="project-card__badge">' + escapeHTML(project.category) + "</span>" +
      '<span class="project-card__year">' + escapeHTML(project.year) + "</span>" +
      '<span class="project-card__open">查看项目 <i>↗</i></span>' +
      "</div>"
    );
  }

  function uniqueValues(items, key) {
    var seen = {};
    var result = [];
    items.forEach(function (item) {
      var value = item[key];
      if (value && !seen[value]) {
        seen[value] = true;
        result.push(value);
      }
    });
    return result;
  }

  function matchesQuery(values, query) {
    if (!query) return true;
    return values.join(" ").toLowerCase().indexOf(query) !== -1;
  }

  function readBrowseState() {
    try {
      var params = new URLSearchParams(window.location.search);
      if (params.has("pq")) browseState.projects.q = params.get("pq");
      if (params.has("pc")) browseState.projects.category = params.get("pc");
      if (params.has("ps")) browseState.projects.sort = params.get("ps");
      if (params.has("nq")) browseState.notes.q = params.get("nq");
      if (params.has("nt")) browseState.notes.tag = params.get("nt");
      if (params.has("ns")) browseState.notes.sort = params.get("ns");
    } catch (error) {
      /* URLSearchParams is available in all modern browsers */
    }
  }

  function syncBrowseURL() {
    try {
      var params = new URLSearchParams(window.location.search);
      function set(key, value, fallback) {
        if (value && value !== fallback) params.set(key, value);
        else params.delete(key);
      }
      set("pq", browseState.projects.q.trim(), "");
      set("pc", browseState.projects.category, "全部");
      set("ps", browseState.projects.sort, "featured");
      set("nq", browseState.notes.q.trim(), "");
      set("nt", browseState.notes.tag, "全部");
      set("ns", browseState.notes.sort, "newest");
      var query = params.toString();
      var next = window.location.pathname + (query ? "?" + query : "") + window.location.hash;
      if (next !== window.location.pathname + window.location.search + window.location.hash) {
        window.history.replaceState(null, "", next);
      }
    } catch (error) {
      /* ignore */
    }
  }

  function renderProjectChips(projects) {
    var host = $("[data-project-chips]");
    if (!host) return;
    var categories = uniqueValues(projects, "category");
    if (browseState.projects.category !== "全部" && categories.indexOf(browseState.projects.category) === -1) {
      browseState.projects.category = "全部";
    }
    var names = ["全部"].concat(categories);
    var signature = names.join("|");
    if (host.getAttribute("data-signature") !== signature) {
      host.innerHTML = names
        .map(function (name) {
          var count = name === "全部"
            ? projects.length
            : projects.filter(function (project) { return project.category === name; }).length;
          return (
            '<button class="browse__chip" type="button" data-project-category="' + escapeHTML(name) + '" aria-pressed="false">' +
            escapeHTML(name) + " " + count +
            "</button>"
          );
        })
        .join("");
      host.setAttribute("data-signature", signature);
    }
    $$("[data-project-category]", host).forEach(function (chip) {
      var active = chip.getAttribute("data-project-category") === browseState.projects.category;
      chip.classList.toggle("is-active", active);
      chip.setAttribute("aria-pressed", active ? "true" : "false");
    });
  }

  function filteredProjects() {
    var projects = data.projects || [];
    var state = browseState.projects;
    var query = state.q.trim().toLowerCase();
    var list = projects.filter(function (project) {
      if (state.category !== "全部" && project.category !== state.category) return false;
      return matchesQuery(
        [project.title, project.en, project.category, project.summary, project.description, (project.tags || []).join(" ")],
        query
      );
    });
    return list.sort(function (a, b) {
      if (state.sort === "newest") return String(b.year).localeCompare(String(a.year));
      if (state.sort === "title") return String(a.title).localeCompare(String(b.title), "zh-Hans-CN");
      return Number(!!b.featured) - Number(!!a.featured) || String(b.year).localeCompare(String(a.year));
    });
  }

  function renderProjects() {
    var host = $("[data-projects]");
    if (!host) return;
    var projects = data.projects || [];
    var visible = filteredProjects();
    var slots = Math.max(Number(data.projectSlots || 0), visible.length);
    renderProjectChips(projects);
    setText("[data-projects-count]", slots);
    var result = $("[data-project-result]");
    if (result) {
      if (!projects.length) {
        result.textContent = "共 " + String(slots).padStart(2, "0") + " 个位置，已放 0 个";
      } else {
        result.textContent = visible.length === projects.length
          ? projects.length + " 个项目"
          : "显示 " + visible.length + " / " + projects.length + " 个项目";
      }
    }

    host.innerHTML = visible
      .map(function (project, index) {
        var tags = (project.tags || [])
          .slice(0, 4)
          .map(function (tag) {
            return "<span>" + escapeHTML(tag) + "</span>";
          })
          .join("");
        return (
          '<a class="project-card" href="project.html?p=' + encodeURIComponent(project.id) + '" data-cursor="VIEW" data-reveal style="--reveal-delay:' + (index % 2) * 90 + 'ms">' +
          projectCover(project, index) +
          '<div class="project-card__body">' +
          '<div class="project-card__meta"><span>' + String(index + 1).padStart(2, "0") + "</span><span>" + escapeHTML(project.en) + "</span><span>" + escapeHTML(project.year) + "</span></div>" +
          '<h3 class="project-card__title">' + escapeHTML(project.title) + "</h3>" +
          '<p class="project-card__summary">' + escapeHTML(project.summary) + "</p>" +
          (project.highlight
            ? '<p class="project-card__highlight"><span>结果</span>' + escapeHTML(project.highlight) + "</p>"
            : "") +
          '<div class="project-card__tags">' + tags + "</div>" +
          "</div>" +
          "</a>"
        );
      })
      .join("");

    var blanks = slots - visible.length;
    if (blanks > 0) {
      var blanksHTML = "";
      for (var k = 0; k < blanks; k++) {
        var no = visible.length + k + 1;
        blanksHTML +=
          '<div class="project-slot" aria-label="空位，待填">' +
          '<div class="project-slot__no">' + String(no).padStart(2, "0") + " / " + String(slots).padStart(2, "0") + "</div>" +
          '<div class="project-slot__title">空位</div>' +
          '<div class="project-slot__note">做好一个，把封面和故事放进这一格。</div>' +
          "</div>";
      }
      host.innerHTML += blanksHTML;
    }

    var browse = $("[data-project-browse]");
    if (browse) browse.hidden = !projects.length;

    var empty = $("[data-project-empty]");
    if (empty) empty.hidden = visible.length > 0;

    $$(".project-card__img", host).forEach(function (image) {
      image.addEventListener("error", function () {
        image.remove();
      });
    });
    initReveals();
  }

  function renderNoteChips(notes) {
    var host = $("[data-note-chips]");
    if (!host) return;
    var tags = uniqueValues(notes, "tag");
    if (browseState.notes.tag !== "全部" && tags.indexOf(browseState.notes.tag) === -1) {
      browseState.notes.tag = "全部";
    }
    var names = ["全部"].concat(tags);
    var signature = names.join("|");
    if (host.getAttribute("data-signature") !== signature) {
      host.innerHTML = names
        .map(function (name) {
          var count = name === "全部"
            ? notes.length
            : notes.filter(function (note) { return note.tag === name; }).length;
          return (
            '<button class="browse__chip" type="button" data-note-tag="' + escapeHTML(name) + '" aria-pressed="false">' +
            escapeHTML(name) + " " + count +
            "</button>"
          );
        })
        .join("");
      host.setAttribute("data-signature", signature);
    }
    $$("[data-note-tag]", host).forEach(function (chip) {
      var active = chip.getAttribute("data-note-tag") === browseState.notes.tag;
      chip.classList.toggle("is-active", active);
      chip.setAttribute("aria-pressed", active ? "true" : "false");
    });
  }

  function filteredNotes() {
    var notes = data.notes || [];
    var state = browseState.notes;
    var query = state.q.trim().toLowerCase();
    var list = notes.filter(function (note) {
      if (state.tag !== "全部" && note.tag !== state.tag) return false;
      return matchesQuery([note.title, note.tag, note.excerpt, note.content], query);
    });
    return list.sort(function (a, b) {
      return state.sort === "oldest"
        ? String(a.date).localeCompare(String(b.date))
        : String(b.date).localeCompare(String(a.date));
    });
  }

  function renderNotes() {
    var host = $("[data-notes]");
    if (!host) return;
    var notes = data.notes || [];
    var visible = filteredNotes();
    renderNoteChips(notes);
    var result = $("[data-note-result]");
    if (result) {
      result.textContent = visible.length === notes.length
        ? notes.length + " 篇笔记"
        : "显示 " + visible.length + " / " + notes.length + " 篇笔记";
    }

    host.innerHTML = visible
      .map(function (note, index) {
        return (
          '<a class="note-row" href="note.html?n=' + encodeURIComponent(note.id) + '" data-cursor="READ" data-reveal style="--reveal-delay:' + index * 60 + 'ms">' +
          '<span class="note-row__index">' + String(index + 1).padStart(2, "0") + "</span>" +
          '<span class="note-row__date">' + formatDate(note.date) + "</span>" +
          '<span class="note-row__main">' +
          '<span class="note-row__tag">' + escapeHTML(note.tag) + "</span>" +
          '<span class="note-row__title">' + escapeHTML(note.title) + "</span>" +
          '<span class="note-row__excerpt">' + escapeHTML(note.excerpt) + "</span>" +
          "</span>" +
          '<span class="note-row__meta"><em>' + escapeHTML(note.readTime) + "</em><i>↗</i></span>" +
          "</a>"
        );
      })
      .join("");

    var empty = $("[data-note-empty]");
    if (empty) empty.hidden = visible.length > 0;
    initReveals();
  }

  function renderSocials() {
    var host = $("[data-socials]");
    if (!host) return;
    host.innerHTML = (data.profile.socials || [])
      .map(function (social) {
        var url = safeUrl(social.url) || "#";
        return (
          "<li><a href=\"" + escapeHTML(url) + '" target="_blank" rel="noopener noreferrer">' +
          '<span class="social__label">' + escapeHTML(social.label) + "</span>" +
          '<span class="social__handle">' + escapeHTML(social.handle) + "</span>" +
          '<span class="social__arrow">↗</span>' +
          "</a></li>"
        );
      })
      .join("");
  }

  function renderMarquee() {
    var items = (data.settings && data.settings.marquee) || [];
    var host = $("[data-marquee]");
    if (!host || !items.length) return;
    var unit = items
      .map(function (item) {
        return '<span class="marquee__item">' + escapeHTML(item) + "</span><span class=\"marquee__star\">✦</span>";
      })
      .join("");
    host.innerHTML = unit + unit + unit + unit;
  }

  function renderFooter() {
    var settings = data.settings || {};
    setText("[data-footer-note]", settings.footerNote);
    setText("[data-year]", new Date().getFullYear());
    if (settings.siteTitle) document.title = settings.siteTitle;
    var description = $('meta[name="description"]');
    if (description && settings.siteDescription) description.setAttribute("content", settings.siteDescription);
    var ogTitle = $('meta[property="og:title"]');
    if (ogTitle && settings.siteTitle) ogTitle.setAttribute("content", settings.siteTitle);

    var accent = safeColor(settings.accent, "#df6249");
    document.documentElement.style.setProperty("--coral", accent);
    document.documentElement.style.setProperty("--coral-deep", accent);
  }

  function renderAll() {
    renderProfile();
    renderStats();
    renderAchievements();
    renderTimeline();
    renderSiteLog();
    renderSkills();
    renderProjects();
    renderNotes();
    renderHobbies();
    renderSocials();
    renderMarquee();
    renderFooter();
    initReveals();
  }

  /* ---------------------------------------------------------- */
  /*  Browse / filter / search                                   */
  /* ---------------------------------------------------------- */

  function debounce(fn, delay) {
    var timer = 0;
    return function () {
      var args = arguments;
      var context = this;
      window.clearTimeout(timer);
      timer = window.setTimeout(function () {
        fn.apply(context, args);
      }, delay);
    };
  }

  function initBrowse() {
    readBrowseState();

    var projectSearch = $("[data-project-search]");
    var projectChips = $("[data-project-chips]");
    var projectSort = $("[data-project-sort]");
    var noteSearch = $("[data-note-search]");
    var noteChips = $("[data-note-chips]");
    var noteSort = $("[data-note-sort]");

    if (projectSearch) projectSearch.value = browseState.projects.q;
    if (noteSearch) noteSearch.value = browseState.notes.q;
    if (projectSort) projectSort.value = browseState.projects.sort;
    if (noteSort) noteSort.value = browseState.notes.sort;

    function renderProjectsAndURL() {
      renderProjects();
      syncBrowseURL();
    }

    function renderNotesAndURL() {
      renderNotes();
      syncBrowseURL();
    }

    var onProjectSearch = debounce(function () {
      browseState.projects.q = projectSearch.value;
      renderProjectsAndURL();
    }, 120);
    var onNoteSearch = debounce(function () {
      browseState.notes.q = noteSearch.value;
      renderNotesAndURL();
    }, 120);

    if (projectSearch) {
      projectSearch.addEventListener("input", onProjectSearch);
      projectSearch.addEventListener("keydown", function (event) {
        if (event.key === "Escape") {
          projectSearch.value = "";
          browseState.projects.q = "";
          renderProjectsAndURL();
        }
      });
    }
    if (noteSearch) {
      noteSearch.addEventListener("input", onNoteSearch);
      noteSearch.addEventListener("keydown", function (event) {
        if (event.key === "Escape") {
          noteSearch.value = "";
          browseState.notes.q = "";
          renderNotesAndURL();
        }
      });
    }

    if (projectChips) {
      projectChips.addEventListener("click", function (event) {
        var chip = event.target.closest("[data-project-category]");
        if (!chip) return;
        browseState.projects.category = chip.getAttribute("data-project-category");
        renderProjectsAndURL();
      });
    }
    if (noteChips) {
      noteChips.addEventListener("click", function (event) {
        var chip = event.target.closest("[data-note-tag]");
        if (!chip) return;
        browseState.notes.tag = chip.getAttribute("data-note-tag");
        renderNotesAndURL();
      });
    }
    if (projectSort) {
      projectSort.addEventListener("change", function () {
        browseState.projects.sort = projectSort.value;
        renderProjectsAndURL();
      });
    }
    if (noteSort) {
      noteSort.addEventListener("change", function () {
        browseState.notes.sort = noteSort.value;
        renderNotesAndURL();
      });
    }

    var projectReset = $("[data-reset-projects]");
    if (projectReset) {
      projectReset.addEventListener("click", function () {
        browseState.projects = { q: "", category: "全部", sort: "featured" };
        if (projectSearch) projectSearch.value = "";
        if (projectSort) projectSort.value = "featured";
        renderProjectsAndURL();
        if (projectSearch) projectSearch.focus();
      });
    }
    var noteReset = $("[data-reset-notes]");
    if (noteReset) {
      noteReset.addEventListener("click", function () {
        browseState.notes = { q: "", tag: "全部", sort: "newest" };
        if (noteSearch) noteSearch.value = "";
        if (noteSort) noteSort.value = "newest";
        renderNotesAndURL();
        if (noteSearch) noteSearch.focus();
      });
    }

    document.addEventListener("keydown", function (event) {
      if (event.key !== "/" || event.metaKey || event.ctrlKey || event.altKey) return;
      var tag = (event.target.tagName || "").toLowerCase();
      if (tag === "input" || tag === "textarea" || tag === "select" || event.target.isContentEditable) return;
      if (activeModal) return;
      var target = $("[data-project-search]");
      if (!target) return;
      event.preventDefault();
      target.focus();
      target.select();
    });
  }

  /* ---------------------------------------------------------- */
  /*  Reveal on scroll                                           */
  /* ---------------------------------------------------------- */

  var revealObserver = null;
  if ("IntersectionObserver" in window) {
    revealObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            if (entry.target.classList.contains("skill-group")) {
              entry.target.classList.add("is-filled");
            }
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );
  }

  function initReveals() {
    $$(".section-head, .about__aside, .about__content, .contact__title, .contact__grid, .footer, .project-modal__content").forEach(function (node, index) {
      if (node.dataset.revealReady) return;
      node.dataset.revealReady = "1";
      node.setAttribute("data-reveal", "");
      node.style.setProperty("--reveal-delay", (index % 3) * 60 + "ms");
    });

    var nodes = $$("[data-reveal]");
    if (!revealObserver) {
      nodes.forEach(function (node) {
        node.classList.add("is-visible");
        node.classList.add("is-filled");
      });
      return;
    }
    nodes.forEach(function (node) {
      if (!node.classList.contains("is-visible")) revealObserver.observe(node);
    });
  }

  /* ---------------------------------------------------------- */
  /*  Loader / clock / navigation                                */
  /* ---------------------------------------------------------- */

  function dismissLoader() {
    document.body.classList.remove("is-loading");
    var loader = $("#loader");
    if (loader) {
      loader.classList.add("is-done");
      window.setTimeout(function () {
        loader.setAttribute("hidden", "");
      }, 900);
    }
  }

  window.setTimeout(dismissLoader, 1600);
  window.addEventListener("load", function () {
    window.setTimeout(dismissLoader, 420);
  });

  /* ---------------------------------------------------------- */
  /*  Page scroll progress                                       */
  /* ---------------------------------------------------------- */

  var scrollProgressFill = $("#scroll-progress");
  var scrollProgressFrame = 0;
  var toTop = $("#to-top");

  function updateScrollProgress() {
    if (!scrollProgressFill) return;
    var max = document.documentElement.scrollHeight - window.innerHeight;
    var progress = max > 0 ? Math.max(0, Math.min(1, window.scrollY / max)) : 0;
    scrollProgressFill.style.transform = "scaleX(" + progress.toFixed(4) + ")";
    document.documentElement.style.setProperty("--scroll-progress", (progress * 100).toFixed(2));
    if (toTop) toTop.classList.toggle("is-visible", window.scrollY > 700);
  }

  if (toTop) {
    toTop.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
    });
  }

  window.addEventListener("scroll", function () {
    if (scrollProgressFrame) return;
    scrollProgressFrame = window.requestAnimationFrame(function () {
      scrollProgressFrame = 0;
      updateScrollProgress();
    });
  }, { passive: true });
  window.addEventListener("resize", updateScrollProgress);
  updateScrollProgress();

  function updateClock() {
    var now = new Date();
    var formatter;
    try {
      formatter = new Intl.DateTimeFormat("en-GB", {
        timeZone: "Asia/Shanghai",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false
      });
    } catch (error) {
      formatter = null;
    }
    var time = formatter ? formatter.format(now) : String(now.getHours()).padStart(2, "0") + ":" + String(now.getMinutes()).padStart(2, "0");
    var navClock = $("#nav-clock");
    if (navClock) navClock.textContent = "CN · " + time;
    var footerClock = $("#footer-clock");
    if (footerClock) footerClock.textContent = "WUHAN · " + time;
  }
  updateClock();
  window.setInterval(updateClock, 30000);

  var nav = $("#nav");
  var navToggle = $("#nav-toggle");
  var mobileMenu = $("#mobile-menu");
  var lastScroll = window.scrollY;
  var menuOpen = false;

  function setMenu(open) {
    menuOpen = open;
    document.body.classList.toggle("menu-open", open);
    if (navToggle) navToggle.setAttribute("aria-expanded", String(open));
    if (mobileMenu) mobileMenu.setAttribute("aria-hidden", String(!open));
  }

  if (navToggle) {
    navToggle.addEventListener("click", function () {
      setMenu(!menuOpen);
    });
  }
  if (mobileMenu) {
    $$("a", mobileMenu).forEach(function (link) {
      link.addEventListener("click", function () {
        setMenu(false);
      });
    });
  }
  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && menuOpen) setMenu(false);
  });

  function onScroll() {
    var y = window.scrollY;
    if (nav) {
      nav.classList.toggle("is-scrolled", y > 32);
      var goingDown = y > lastScroll;
      if (y > 500 && goingDown && !menuOpen) nav.classList.add("is-hidden");
      else nav.classList.remove("is-hidden");
    }
    lastScroll = y;
    updateStory();
    updateActiveNav();
    updateWorldVisibility();
  }

  var scrollTicking = false;
  window.addEventListener(
    "scroll",
    function () {
      if (scrollTicking) return;
      scrollTicking = true;
      window.requestAnimationFrame(function () {
        onScroll();
        scrollTicking = false;
      });
    },
    { passive: true }
  );

  /* ---------------------------------------------------------- */
  /*  Scroll story                                               */
  /* ---------------------------------------------------------- */

  var story = $("#story");
  var acts = $$(".act");
  var railDots = $$("[data-rail]");
  var storyFill = $("#story-fill");
  var storyPct = $("#story-pct");
  var world = $("#world");
  var about = $("#about");
  var storyState = { p: 0, active: false };
  var currentAct = -1;

  function updateStory() {
    if (!story) return;
    var rect = story.getBoundingClientRect();
    var distance = story.offsetHeight - window.innerHeight;
    var progress = distance > 0 ? Math.max(0, Math.min(1, -rect.top / distance)) : 0;
    var inStory = rect.top < window.innerHeight * 0.55 && rect.bottom > window.innerHeight * 0.35;

    storyState.p = progress;
    storyState.active = inStory;

    if (storyFill) storyFill.style.height = (progress * 100).toFixed(2) + "%";
    if (storyPct) storyPct.textContent = String(Math.round(progress * 100)).padStart(2, "0");

    var actIndex = progress < 0.3 ? 0 : progress < 0.64 ? 1 : 2;
    if (actIndex !== currentAct) {
      currentAct = actIndex;
      acts.forEach(function (act, index) {
        act.classList.toggle("is-active", index === actIndex);
        act.classList.toggle("is-past", index < actIndex);
      });
      railDots.forEach(function (dot, index) {
        dot.classList.toggle("is-active", index === actIndex);
        dot.classList.toggle("is-past", index < actIndex);
      });
    }

    if (window.ClayCharacter) {
      window.ClayCharacter.setStory(progress, inStory);
    }
    if (world) {
      world.classList.toggle("is-story", inStory);
    }

    var storyBg = document.documentElement;
    storyBg.style.setProperty("--story-progress", progress.toFixed(3));
  }

  function updateWorldVisibility() {
    if (!world) return;
    var hidden = false;
    if (about) {
      hidden = about.getBoundingClientRect().top < window.innerHeight * 0.72;
    }
    world.classList.toggle("is-hidden", hidden);
    if (window.ClayCharacter) window.ClayCharacter.setRunning(!hidden);
  }

  /* ---------------------------------------------------------- */
  /*  Active nav link                                            */
  /* ---------------------------------------------------------- */

  var navLinks = $$("[data-nav]");

  function updateActiveNav() {
    if (!navLinks.length) return;
    var sections = navLinks
      .map(function (link) {
        var section = document.getElementById(link.getAttribute("data-nav"));
        return section ? { link: link, top: section.getBoundingClientRect().top } : null;
      })
      .filter(Boolean);
    var current = null;
    sections.forEach(function (item) {
      if (item.top < window.innerHeight * 0.42) current = item.link;
    });
    navLinks.forEach(function (link) {
      link.classList.toggle("is-active", link === current);
    });
  }

  /* ---------------------------------------------------------- */
  /*  Modals                                                     */
  /* ---------------------------------------------------------- */

  var contactModal = $("#contact-modal");
  var contactForm = $("#contact-form");
  var contactFormStatus = $(".contact-form__status");
  var contactFormSuccess = $("[data-form-success]");
  var activeModal = null;
  var lastFocused = null;

  function getFocusable(container) {
    return $$(
      'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])',
      container
    ).filter(function (node) {
      return node.offsetParent !== null;
    });
  }

  function openModal(modal) {
    if (!modal) return;
    lastFocused = document.activeElement;
    activeModal = modal;
    modal.setAttribute("aria-hidden", "false");
    modal.classList.add("is-open");
    document.body.classList.add("modal-open");
    var panel = $(".modal__panel", modal);
    if (panel) {
      panel.setAttribute("tabindex", "-1");
      window.setTimeout(function () {
        panel.focus({ preventScroll: true });
      }, 60);
    }
  }

  function closeModals() {
    if (!activeModal) return;
    var modal = activeModal;
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
    activeModal = null;
    if (lastFocused && typeof lastFocused.focus === "function") {
      lastFocused.focus({ preventScroll: true });
    }
  }

  $$("[data-close-modal]").forEach(function (button) {
    button.addEventListener("click", closeModals);
  });

  document.addEventListener("keydown", function (event) {
    if (!activeModal) return;
    if (event.key === "Escape") {
      closeModals();
      return;
    }
    if (event.key === "Tab") {
      var focusable = getFocusable(activeModal);
      if (!focusable.length) return;
      var first = focusable[0];
      var last = focusable[focusable.length - 1];
      var panel = $(".modal__panel", activeModal);
      if (panel && document.activeElement === panel) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
      } else if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  });

  function openContactModal() {
    if (!contactModal) return;
    if (contactFormSuccess && !contactFormSuccess.hidden) resetContactForm();
    openModal(contactModal);
    window.setTimeout(function () {
      var first = contactForm ? contactForm.querySelector('[name="message"]') : null;
      if (first) first.focus({ preventScroll: true });
    }, 90);
  }

  function clearContactErrors() {
    if (!contactForm) return;
    $$(".field.is-invalid", contactForm).forEach(function (field) {
      field.classList.remove("is-invalid");
    });
    $$("[data-error-for]", contactForm).forEach(function (error) {
      error.textContent = "";
    });
    $$("[data-field]", contactForm).forEach(function (field) {
      field.removeAttribute("aria-invalid");
    });
  }

  function setContactError(name, message) {
    if (!contactForm) return;
    var field = contactForm.querySelector('[data-field="' + name + '"]');
    if (!field) return;
    var wrap = field.closest(".field");
    var error = contactForm.querySelector('[data-error-for="' + name + '"]');
    if (message) {
      if (wrap) wrap.classList.add("is-invalid");
      if (error) error.textContent = message;
      field.setAttribute("aria-invalid", "true");
    } else {
      if (wrap) wrap.classList.remove("is-invalid");
      if (error) error.textContent = "";
      field.removeAttribute("aria-invalid");
    }
  }

  function validateContactForm() {
    clearContactErrors();
    if (!contactForm) return false;
    var message = contactForm.elements.namedItem("message");
    var valid = true;

    if (!message || message.value.trim().length < 8) {
      setContactError("message", "多写一点吧，至少 8 个字，方便我理解你的来意。");
      valid = false;
    }

    if (!valid) {
      var firstInvalid = contactForm.querySelector(".field.is-invalid input, .field.is-invalid textarea");
      if (firstInvalid) firstInvalid.focus();
    }
    return valid;
  }

  function contactPayload() {
    var payload = {};
    if (contactForm) {
      ["message", "bot-field"].forEach(function (key) {
        var field = contactForm.elements.namedItem(key);
        payload[key] = field ? String(field.value || "").trim() : "";
      });
    }
    payload["form-name"] = "contact";
    return payload;
  }

  /* 表单只剩一个输入框，所以邮件草稿也只剩「正文」这一段。
     主题里保留一句来源，方便在邮箱列表里认出来。 */
  function buildContactMailto(payload) {
    var subject = "[作品集来信]";
    var body = [
      payload.message || "",
      "",
      "— 来自个人作品集"
    ].filter(function (line) {
      return line !== "";
    }).join("\n");
    return "mailto:" + contactEmail() + "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
  }

  function showContactSuccess(title, text, mailto) {
    if (contactForm) contactForm.hidden = true;
    if (contactFormSuccess) {
      contactFormSuccess.hidden = false;
      setText("[data-form-success-title]", title);
      setText("[data-form-success-text]", text);
    }
    var mailtoLink = $("[data-form-mailto]");
    if (mailtoLink) {
      if (mailto) {
        mailtoLink.href = mailto;
        mailtoLink.hidden = false;
      } else {
        mailtoLink.hidden = true;
        mailtoLink.removeAttribute("href");
      }
    }
    if (contactFormStatus) {
      contactFormStatus.textContent = "";
      contactFormStatus.classList.remove("is-success");
    }
    window.setTimeout(function () {
      var focusTarget = mailtoLink && !mailtoLink.hidden ? mailtoLink : $("[data-form-again]");
      if (focusTarget) focusTarget.focus({ preventScroll: true });
    }, 80);
  }

  function resetContactForm() {
    if (!contactForm) return;
    contactForm.reset();
    clearContactErrors();
    contactForm.hidden = false;
    if (contactFormSuccess) contactFormSuccess.hidden = true;
    var mailtoLink = $("[data-form-mailto]");
    if (mailtoLink) {
      mailtoLink.hidden = true;
      mailtoLink.removeAttribute("href");
    }
    if (contactFormStatus) {
      contactFormStatus.textContent = "";
      contactFormStatus.classList.remove("is-success");
    }
  }

  function fallbackContactMailto(payload) {
    var mailto = buildContactMailto(payload);
    showContactSuccess(
      "邮件草稿已生成。",
      "点击下面的按钮打开邮件客户端；如果没有反应，可以直接发到 " + contactEmail() + "。",
      mailto
    );
  }

  function submitContactForm(event) {
    event.preventDefault();
    if (!validateContactForm()) return;
    var payload = contactPayload();
    if (payload["bot-field"]) {
      showContactSuccess("已经收到你的消息。", "我会在 24 小时内回复你。");
      return;
    }
    var submit = contactForm ? contactForm.querySelector(".contact-form__submit") : null;
    var isLocal = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(window.location.hostname) || window.location.protocol === "file:";

    if (isLocal) {
      fallbackContactMailto(payload);
      return;
    }

    if (submit) submit.disabled = true;
    if (contactFormStatus) {
      contactFormStatus.textContent = "正在发送…";
      contactFormStatus.classList.remove("is-success");
    }

    fetch("/", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(payload).toString()
    })
      .then(function (response) {
        if (!response.ok) throw new Error("HTTP " + response.status);
        showContactSuccess("已经收到你的消息。", "我会在 24 小时内回复你。");
      })
      .catch(function () {
        fallbackContactMailto(payload);
      })
      .finally(function () {
        if (submit) submit.disabled = false;
      });
  }

  if (contactForm) {
    contactForm.addEventListener("submit", submitContactForm);
    contactForm.addEventListener("input", function (event) {
      if (event.target && event.target.name) setContactError(event.target.name, "");
    });
  }
  var contactAgain = $("[data-form-again]");
  if (contactAgain) {
    contactAgain.addEventListener("click", function () {
      resetContactForm();
      window.setTimeout(function () {
        var first = contactForm ? contactForm.querySelector('[name="name"]') : null;
        if (first) first.focus({ preventScroll: true });
      }, 60);
    });
  }

  document.addEventListener("click", function (event) {
    var contactJump = event.target.closest("[data-jump-contact]");
    if (contactJump) {
      event.preventDefault();
      tapFeedback();
      scrollToContactOrb();
      return;
    }

    var contactOpen = event.target.closest("[data-open-contact]");
    if (contactOpen) {
      event.preventDefault();
      tapFeedback();
      openContactModal();
      return;
    }

    var noteTrigger = event.target.closest("[data-note]");
    if (noteTrigger) {
      /* 兼容后台旧数据 / 旧链接：笔记行现在是 <a>，直接跳独立页；
         这里只兜住仍带 data-note 的元素。 */
      window.location.href = "note.html?n=" + encodeURIComponent(noteTrigger.dataset.note);
    }
  });

  /* ---------------------------------------------------------- */
  /*  Copy email + toast                                         */
  /* ---------------------------------------------------------- */

  var toast = $("#toast");
  var toastTimer = null;

  function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("is-visible");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(function () {
      toast.classList.remove("is-visible");
    }, 2600);
  }

  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text);
    }
    return new Promise(function (resolve, reject) {
      var input = document.createElement("textarea");
      input.value = text;
      input.style.position = "fixed";
      input.style.opacity = "0";
      document.body.appendChild(input);
      input.select();
      try {
        document.execCommand("copy");
        resolve();
      } catch (error) {
        reject(error);
      } finally {
        document.body.removeChild(input);
      }
    });
  }

  document.addEventListener("click", function (event) {
    var trigger = event.target.closest("[data-copy]");
    if (!trigger) return;
    copyContactEmail("button", trigger);
  });

  /* ---------------------------------------------------------- */
  /*  Liquid orb interactions                                    */
  /* ---------------------------------------------------------- */

  var orbTimers = {};
  var orbHintTimer = 0;

  function contactEmail() {
    var node = $("[data-profile-email]");
    var value = node ? node.textContent.trim() : "";
    return value || "byuyan@qq.com";
  }

  function tapFeedback() {
    if (navigator.vibrate) {
      try {
        navigator.vibrate(8);
      } catch (error) {
        /* haptics are optional */
      }
    }
  }

  var orbSuccessTimer = 0;

  function flashOrbSuccess() {
    var stage = $(".contact__orb-stage");
    if (!stage) return;
    window.clearTimeout(orbSuccessTimer);
    stage.classList.add("is-success");
    orbSuccessTimer = window.setTimeout(function () {
      stage.classList.remove("is-success");
    }, 1500);
  }

  function scrollToContactOrb() {
    var section = document.getElementById("contact");
    if (!section) return;
    section.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
    window.setTimeout(function () {
      if (contactOrbStage) contactOrbStage.focus({ preventScroll: true });
    }, reduceMotion ? 60 : 700);
  }

  function setOrbHint(text, duration) {
    var hint = $("[data-orb-hint]");
    if (!hint) return;
    if (!hint.getAttribute("data-orb-hint-original")) {
      hint.setAttribute("data-orb-hint-original", hint.textContent);
    }
    hint.textContent = text;
    window.clearTimeout(orbHintTimer);
    orbHintTimer = window.setTimeout(function () {
      hint.textContent = hint.getAttribute("data-orb-hint-original");
    }, duration || 2600);
  }

  function copyContactEmail(source, trigger) {
    var email = contactEmail();
    tapFeedback();
    copyText(email)
      .then(function () {
        showToast("邮箱已复制 — " + email);
        pulseOrb("contact", 2600);
        flashOrbSuccess();
        setOrbHint("✓ 已复制 · " + email, 2600);
        if (trigger) {
          var label = $(".contact__copy-label", trigger);
          if (label) {
            var original = label.textContent;
            label.textContent = "已复制";
            window.setTimeout(function () {
              label.textContent = original;
            }, 2200);
          }
        }
      })
      .catch(function () {
        pulseOrb("contact", 2000);
        if (source === "orb") {
          showToast("复制失败，正在打开邮件客户端…");
          window.location.href = "mailto:" + email;
        } else {
          showToast("复制失败，请手动选择邮箱地址");
        }
      });
  }

  function paintOrbState(name, state) {
    $$('[data-orb-state="' + name + '"]').forEach(function (node) {
      node.textContent = state === "thinking" ? "THINKING" : "IDLE";
    });
    if (name === "contact") {
      var stage = $(".contact__orb-stage");
      if (stage) {
        stage.setAttribute("data-state", state);
        if (state !== "thinking") stage.classList.remove("is-success");
      }
    }
    if (window.LiquidOrb) {
      window.LiquidOrb.setState(name, state);
    }
  }

  function pulseOrb(name, duration) {
    var ms = duration || 2400;
    paintOrbState(name, "thinking");
    if (window.LiquidOrb) window.LiquidOrb.pulse(name, ms);
    window.clearTimeout(orbTimers[name]);
    orbTimers[name] = window.setTimeout(function () {
      paintOrbState(name, "idle");
    }, ms);
  }

  $$("[data-orb-hover]").forEach(function (surface) {
    var name = surface.getAttribute("data-orb-hover");
    surface.addEventListener("pointerenter", function () {
      paintOrbState(name, "thinking");
    });
    surface.addEventListener("pointerleave", function () {
      paintOrbState(name, "idle");
    });
  });

  var contactOrbStage = $(".contact__orb-stage");
  if (contactOrbStage) {
    contactOrbStage.addEventListener("click", function () {
      copyContactEmail("orb");
    });
    contactOrbStage.addEventListener("focus", function () {
      paintOrbState("contact", "thinking");
    });
    contactOrbStage.addEventListener("blur", function () {
      paintOrbState("contact", "idle");
    });
  }

  /* ---------------------------------------------------------- */
  /*  Portrait fallback                                          */
  /* ---------------------------------------------------------- */

  var portrait = $(".about__portrait img");
  if (portrait) {
    portrait.addEventListener("error", function () {
      portrait.hidden = true;
    });
  }

  /* ---------------------------------------------------------- */
  /*  Custom cursor                                              */
  /* ---------------------------------------------------------- */

  var cursor = $("#cursor");
  var cursorLabel = $(".cursor__label");
  var cursorRing = $(".cursor__ring");
  var canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  if (cursor && canHover && !reduceMotion) {
    document.body.classList.add("has-custom-cursor");
    var mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    var ring = { x: mouse.x, y: mouse.y };
    var cursorVisible = false;

    window.addEventListener("mousemove", function (event) {
      mouse.x = event.clientX;
      mouse.y = event.clientY;
      if (!cursorVisible) {
        cursorVisible = true;
        cursor.classList.add("is-visible");
      }
      var dot = $(".cursor__dot");
      if (dot) dot.style.transform = "translate3d(" + mouse.x + "px," + mouse.y + "px,0)";
    });

    window.addEventListener("mouseleave", function () {
      cursorVisible = false;
      cursor.classList.remove("is-visible");
    });

    (function animateCursor() {
      ring.x += (mouse.x - ring.x) * 0.16;
      ring.y += (mouse.y - ring.y) * 0.16;
      if (cursorRing) cursorRing.style.transform = "translate3d(" + ring.x + "px," + ring.y + "px,0)";
      window.requestAnimationFrame(animateCursor);
    })();

    document.addEventListener("mouseover", function (event) {
      var target = event.target.closest("a, button, [data-cursor], .project-card, .note-row");
      if (!target) {
        cursor.classList.remove("is-active", "is-labelled");
        if (cursorLabel) cursorLabel.textContent = "";
        return;
      }
      cursor.classList.add("is-active");
      var label = target.dataset.cursor || (target.closest(".project-card") ? "VIEW" : target.closest(".note-row") ? "READ" : "");
      if (label) {
        cursor.classList.add("is-labelled");
        if (cursorLabel) cursorLabel.textContent = label;
      } else {
        cursor.classList.remove("is-labelled");
        if (cursorLabel) cursorLabel.textContent = "";
      }
    });
  }

  /* ---------------------------------------------------------- */
  /*  Live updates from the studio                               */
  /* ---------------------------------------------------------- */

  window.PortfolioStore.subscribe(function (next) {
    data = next;
    if (activeModal) closeModals();
    renderAll();
    updateStory();
    window.setTimeout(initReveals, 30);
  });

  /* ---------------------------------------------------------- */
  /*  Embed mode                                                 */
  /*  ?embed=1 显式开启，或被 iframe 嵌入时自动开启。              */
  /*  它会摘掉导航 / 页脚 / 自定义光标这些「站」的外壳，            */
  /*  并把自己的真实高度报给父页面，避免 iframe 里出现双滚动条。    */
  /* ---------------------------------------------------------- */

  var EMBED = (function () {
    if (/[?&]embed=1(&|$)/.test(window.location.search)) return true;
    try {
      return window.parent && window.parent !== window;
    } catch (error) {
      return true;
    }
  })();

  function setupEmbed() {
    if (!EMBED) return;
    var root = document.documentElement;
    root.classList.add("is-embed");

    var reported = 0;
    function postHeight() {
      var height = Math.max(
        document.body.scrollHeight,
        root.scrollHeight,
        Math.ceil(root.getBoundingClientRect().height)
      );
      if (!height || Math.abs(height - reported) < 2) return;
      reported = height;
      try {
        window.parent.postMessage({ type: "portfolio:height", height: height }, "*");
      } catch (error) {
        /* 父页面不可达就算了，不影响自己正常显示 */
      }
    }

    postHeight();
    window.addEventListener("load", postHeight);
    window.addEventListener("resize", postHeight);
    if (window.ResizeObserver) new window.ResizeObserver(postHeight).observe(document.body);
    window.setTimeout(postHeight, 700);
    window.setTimeout(postHeight, 2000);
  }

  /* ---------------------------------------------------------- */
  /*  Boot                                                       */
  /* ---------------------------------------------------------- */

  setupEmbed();
  initBrowse();
  renderAll();
  updateStory();
  updateActiveNav();
  updateWorldVisibility();
  updateScrollProgress();

  if (window.ClayCharacter) {
    window.addEventListener("load", function () {
      window.ClayCharacter.resize();
    });
  }
})();
