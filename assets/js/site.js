/* ============================================================
   SITE BEHAVIOUR
   Renders content from PortfolioStore, drives the scroll story,
   modals, navigation, cursor and small delightful details.
   ============================================================ */

(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var data = window.PortfolioStore.load();

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
    $$(".mobile-menu__foot [data-profile-email]").forEach(function (node) {
      node.textContent = profile.email || "";
    });

    var adminLink = $("[data-admin-link]");
    if (adminLink) adminLink.hidden = !(data.settings && data.settings.showAdminLink);

    var portrait = $(".about__portrait img");
    if (portrait) {
      var avatar = safeUrl(profile.avatar) || "assets/img/portrait.png";
      portrait.hidden = false;
      if (portrait.getAttribute("src") !== avatar) portrait.src = avatar;
    }

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

  function renderProjects() {
    var host = $("[data-projects]");
    if (!host) return;
    var projects = data.projects || [];
    setText("[data-projects-count]", projects.length);

    host.innerHTML = projects
      .map(function (project, index) {
        var tags = (project.tags || [])
          .slice(0, 4)
          .map(function (tag) {
            return "<span>" + escapeHTML(tag) + "</span>";
          })
          .join("");
        return (
          '<button class="project-card" type="button" data-project="' + escapeHTML(project.id) + '" data-cursor="VIEW" data-reveal style="--reveal-delay:' + (index % 2) * 90 + 'ms">' +
          projectCover(project, index) +
          '<div class="project-card__body">' +
          '<div class="project-card__meta"><span>0' + (index + 1) + "</span><span>" + escapeHTML(project.en) + "</span><span>" + escapeHTML(project.year) + "</span></div>" +
          '<h3 class="project-card__title">' + escapeHTML(project.title) + "</h3>" +
          '<p class="project-card__summary">' + escapeHTML(project.summary) + "</p>" +
          '<div class="project-card__tags">' + tags + "</div>" +
          "</div>" +
          "</button>"
        );
      })
      .join("");

    $$(".project-card__img", host).forEach(function (image) {
      image.addEventListener("error", function () {
        image.remove();
      });
    });
  }

  function renderNotes() {
    var host = $("[data-notes]");
    if (!host) return;
    host.innerHTML = (data.notes || [])
      .map(function (note, index) {
        return (
          '<button class="note-row" type="button" data-note="' + escapeHTML(note.id) + '" data-cursor="READ" data-reveal style="--reveal-delay:' + index * 60 + 'ms">' +
          '<span class="note-row__index">0' + (index + 1) + "</span>" +
          '<span class="note-row__date">' + formatDate(note.date) + "</span>" +
          '<span class="note-row__main">' +
          '<span class="note-row__tag">' + escapeHTML(note.tag) + "</span>" +
          '<span class="note-row__title">' + escapeHTML(note.title) + "</span>" +
          '<span class="note-row__excerpt">' + escapeHTML(note.excerpt) + "</span>" +
          "</span>" +
          '<span class="note-row__meta"><em>' + escapeHTML(note.readTime) + "</em><i>↗</i></span>" +
          "</button>"
        );
      })
      .join("");
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
    renderTimeline();
    renderSkills();
    renderProjects();
    renderNotes();
    renderSocials();
    renderMarquee();
    renderFooter();
    initReveals();
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

  var projectModal = $("#project-modal");
  var noteModal = $("#note-modal");
  var projectBody = $("#project-modal-body");
  var noteBody = $("#note-modal-body");
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

  function openProject(project) {
    if (!projectModal || !projectBody) return;
    var accent = safeColor(project.accent, "#a8b8a0");
    var cover = safeUrl(project.cover);
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
    var link = safeUrl(project.link);

    projectBody.innerHTML =
      '<div class="project-modal__grid" style="--project-accent:' + accent + '">' +
      '<div class="project-modal__visual">' +
      (cover
        ? '<div class="project-modal__visual-bg" data-cover-bg></div><img src="' + escapeHTML(cover) + '" alt="' + escapeHTML(project.title + " 项目封面") + '" />'
        : '<div class="project-modal__fallback"><span>' + escapeHTML(project.en) + "</span></div>") +
      '<span class="project-modal__visual-index">' + escapeHTML(project.category) + "</span>" +
      "</div>" +
      '<div class="project-modal__content">' +
      '<div class="modal__eyebrow"><span>' + escapeHTML(project.category) + "</span><span>" + escapeHTML(project.year) + "</span></div>" +
      '<h2 class="project-modal__title" id="project-modal-title">' + escapeHTML(project.title) + "</h2>" +
      '<p class="project-modal__en">' + escapeHTML(project.en) + "</p>" +
      '<p class="project-modal__summary">' + escapeHTML(project.summary) + "</p>" +
      '<div class="project-modal__meta">' +
      "<div><span>角色</span><strong>" + escapeHTML(project.role) + "</strong></div>" +
      "<div><span>成果</span><strong>" + escapeHTML(project.highlight) + "</strong></div>" +
      (deliverables ? "<div><span>交付物</span><ul>" + deliverables + "</ul></div>" : "") +
      "</div>" +
      '<div class="project-modal__story">' + paragraphs(project.description) + "</div>" +
      '<div class="project-modal__taglist">' + tags + "</div>" +
      (link ? '<a class="btn btn--primary project-modal__link" href="' + escapeHTML(link) + '" target="_blank" rel="noopener noreferrer">访问项目 <span>↗</span></a>' : "") +
      "</div>" +
      "</div>";

    openModal(projectModal);
    var coverBg = $("[data-cover-bg]", projectBody);
    if (coverBg && cover) {
      coverBg.style.backgroundImage = 'url("' + cover.replace(/"/g, "%22") + '")';
    }
    var image = $(".project-modal__visual img", projectBody);
    if (image) {
      image.addEventListener("error", function () {
        image.remove();
      });
    }
  }

  function openNote(note) {
    if (!noteModal || !noteBody) return;
    noteBody.innerHTML =
      '<article class="note-reader">' +
      '<div class="note-reader__head"><span class="tag">' + escapeHTML(note.tag) + "</span><span>" + formatDate(note.date) + "</span><span>" + escapeHTML(note.readTime) + " 阅读</span></div>" +
      '<h2 class="note-reader__title" id="note-modal-title">' + escapeHTML(note.title) + "</h2>" +
      '<p class="note-reader__excerpt">' + escapeHTML(note.excerpt) + "</p>" +
      '<div class="note-reader__content">' + paragraphs(note.content) + "</div>" +
      '<div class="note-reader__foot"><span>写于 ' + formatDate(note.date) + "</span><span>— 郑宇彬</span></div>" +
      "</article>";
    openModal(noteModal);
  }

  document.addEventListener("click", function (event) {
    var projectTrigger = event.target.closest("[data-project]");
    if (projectTrigger) {
      var project = (data.projects || []).filter(function (item) {
        return item.id === projectTrigger.dataset.project;
      })[0];
      if (project) openProject(project);
    }

    var noteTrigger = event.target.closest("[data-note]");
    if (noteTrigger) {
      var note = (data.notes || []).filter(function (item) {
        return item.id === noteTrigger.dataset.note;
      })[0];
      if (note) openNote(note);
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
    copyText(trigger.dataset.copy)
      .then(function () {
        showToast("邮箱已复制 — " + trigger.dataset.copy);
        var label = $(".contact__copy-label", trigger);
        if (label) {
          var original = label.textContent;
          label.textContent = "已复制";
          window.setTimeout(function () {
            label.textContent = original;
          }, 2200);
        }
      })
      .catch(function () {
        showToast("复制失败，请手动选择邮箱地址");
      });
  });

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
  /*  Boot                                                       */
  /* ---------------------------------------------------------- */

  renderAll();
  updateStory();
  updateActiveNav();
  updateWorldVisibility();

  if (window.ClayCharacter) {
    window.addEventListener("load", function () {
      window.ClayCharacter.resize();
    });
  }
})();
