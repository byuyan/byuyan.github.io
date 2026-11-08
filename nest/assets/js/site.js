/* ===== 郑宇彬的小窝 · NEST ===== */
(() => {
  'use strict';

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  /* ---------- 壁纸 ---------- */
  const WALLS = [
    { src: 'assets/img/wall-1.jpg', name: '蓝莓微距 · 夜', desc: '水珠 / 暗青蓝 / 侧逆光' },
  ];

  /* ---------- 偏好 ---------- */
  const KEY = 'nest.prefs.v1';
  const DEFAULTS = { wall: 0, hour24: true, sec: true, glass: 58, auto: false };
  let prefs = { ...DEFAULTS };
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) prefs = { ...DEFAULTS, ...JSON.parse(raw) };
  } catch (e) {}
  const savePrefs = () => {
    try { localStorage.setItem(KEY, JSON.stringify(prefs)); } catch (e) {}
  };

  /* ---------- 壁纸切换 ---------- */
  const wallEls = $$('.wall');
  let wallSlot = 0;
  let currentWall = -1;

  function paintWall(instant) {
    const idx = Math.min(prefs.wall, WALLS.length - 1);
    if (idx === currentWall && !instant) return;
    currentWall = idx;
    const next = wallEls[wallSlot];
    const prev = wallEls[(wallSlot + 1) % 2];
    next.style.backgroundImage = `url("${WALLS[idx].src}")`;
    if (instant) {
      wallEls.forEach((el) => el.classList.remove('on'));
      next.classList.add('on');
    } else {
      next.classList.add('on');
      prev.classList.remove('on');
    }
    wallSlot = (wallSlot + 1) % 2;
    $$('.wcard').forEach((c) => c.classList.toggle('on', +c.dataset.i === idx));
    $$('#setWalls img').forEach((c) => c.classList.toggle('on', +c.dataset.i === idx));
  }

  /* ---------- 机械滚轮时钟 ---------- */
  const clockEl = $('#clock');
  const digits = [];
  const seps = [];

  /* 每一位是一根 30 格的数字轮（0-9 重复三圈），只往前滚，滚完挑一帧偷偷归位 */
  function makeDigit() {
    const d = document.createElement('div');
    d.className = 'digit';
    const reel = document.createElement('div');
    reel.className = 'digit__reel';
    for (let c = 0; c < 3; c++) {
      for (let n = 0; n < 10; n++) {
        const i = document.createElement('i');
        i.textContent = n;
        reel.appendChild(i);
      }
    }
    const glass = document.createElement('div');
    glass.className = 'digit__glass';
    d.appendChild(reel);
    d.appendChild(glass);
    d._reel = reel;
    d._idx = 10;
    d._val = 0;
    d._cur = -10 * 108;
    return d;
  }

  function unitH() {
    const v = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--dh'));
    return v > 10 ? v : 108;
  }

  function setY(d, y) {
    d._cur = y;
    d._reel.style.transform = 'translate3d(0,' + y.toFixed(2) + 'px,0)';
  }

  /* 先顺着方向冲过一点点，再用更短的一段弹回来 —— 就是机械表的过冲回弹
     两段都用 transition，环境不支持动画时最后那次赋值就是正确落点，不会错位 */
  function rollTo(d, idx, instant) {
    const dh = unitH();
    const to = -idx * dh;
    clearTimeout(d._t);
    if (instant) {
      d._reel.style.transition = 'none';
      setY(d, to);
      void d._reel.offsetWidth;
      d._reel.style.transition = '';
      return;
    }
    const from = d._cur;
    const dir = to < from ? -1 : 1;
    const over = to + dir * dh * 0.065;
    d._reel.style.transition = 'transform 400ms cubic-bezier(.22,.72,.3,1)';
    requestAnimationFrame(function () { setY(d, over); });
    d._t = setTimeout(function () {
      d._reel.style.transition = 'transform 150ms cubic-bezier(.34,.06,.3,1)';
      setY(d, to);
      d._t = setTimeout(function () {
        d._reel.style.transition = '';
        if (d._idx >= 20) {          // 滚到第三圈就悄悄退回第二圈，画面上完全相同
          d._idx -= 10;
          const y = -d._idx * dh;
          d._reel.style.transition = 'none';
          setY(d, y);
          void d._reel.offsetWidth;
          d._reel.style.transition = '';
        }
      }, 170);
    }, 400);
  }

  function buildClock() {
    clockEl.innerHTML = '';
    for (let u = 0; u < 3; u++) {
      const unit = document.createElement('div');
      unit.className = 'clock__unit';
      unit.dataset.unit = u;
      for (let k = 0; k < 2; k++) {
        const d = makeDigit();
        unit.appendChild(d);
        digits.push(d);
      }
      clockEl.appendChild(unit);
      if (u < 2) {
        const sep = document.createElement('div');
        sep.className = 'clock__sep';
        sep.innerHTML = '<i></i><i></i>';
        clockEl.appendChild(sep);
        seps.push(sep);
      }
    }
  }

  function setDigit(d, v, first) {
    const target = +v;
    if (first) {
      d._val = target;
      d._idx = 10 + target;
      rollTo(d, d._idx, true);
      return;
    }
    if (target === d._val) return;
    const step = (target - d._val + 10) % 10; // 一秒钟最多滚一格
    d._val = target;
    d._idx += step;
    rollTo(d, d._idx, false);
  }

  const pad = (n) => String(n).padStart(2, '0');
  let firstTick = true;

  function tick() {
    const now = new Date();
    let h = now.getHours();
    if (!prefs.hour24) h = h % 12 || 12;
    const vals = (pad(h) + pad(now.getMinutes()) + pad(now.getSeconds())).split('');
    vals.forEach((v, i) => setDigit(digits[i], v, firstTick));
    firstTick = false;
  }

  /* ---------- 问候 / 日期 ---------- */
  const WEEK = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
  function paintDate() {
    const now = new Date();
    $('#today').textContent =
      `${now.getFullYear()} 年 ${now.getMonth() + 1} 月 ${now.getDate()} 日 ${WEEK[now.getDay()]}`;
    const h = now.getHours();
    let hi = '夜里好，小窝还亮着灯';
    if (h >= 5 && h < 11) hi = '早上好，今天也慢慢来';
    else if (h >= 11 && h < 14) hi = '中午好，记得先吃饭';
    else if (h >= 14 && h < 18) hi = '下午好，喝点水吧';
    else if (h >= 18 && h < 23) hi = '晚上好，我在小窝里';
    $('#hello').textContent = hi;
  }

  /* ---------- 播放器（浏览器实时合成，不加载任何音频文件） ---------- */
  const TRACKS = [
    { name: '蓝莓之夜', artist: 'NEST · 环境音 / 实时合成', kind: 'pad' },
    { name: '雾中清晨', artist: 'NEST · 环境音 / 实时合成', kind: 'air' },
  ];
  let track = 0;
  let playing = false;
  let muted = false;
  let elapsed = 0;
  const LOOP = 240;
  let ctx = null;
  let nodes = null;
  let timer = null;

  const waveEl = $('#wave');
  const barCount = 22;
  for (let i = 0; i < barCount; i++) {
    const b = document.createElement('span');
    b.style.height = '12%';
    waveEl.appendChild(b);
  }
  const bars = $$('#wave span');
  let barPhase = 0;

  function animateBars() {
    if (!playing) return;
    barPhase += 0.09;
    bars.forEach((b, i) => {
      const v = 18 + Math.abs(Math.sin(barPhase + i * 0.42)) * 62 + Math.random() * 12;
      b.style.height = Math.min(96, v) + '%';
    });
    requestAnimationFrame(animateBars);
  }

  function makeNoise(seconds = 3) {
    const buf = ctx.createBuffer(1, ctx.sampleRate * seconds, ctx.sampleRate);
    const data = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < data.length; i++) {
      const white = Math.random() * 2 - 1;
      last = (last + 0.02 * white) / 1.02;
      data[i] = last * 3.2;
    }
    return buf;
  }

  function buildNodes(kind) {
    const out = ctx.createGain();
    out.gain.value = 0;
    out.connect(ctx.destination);

    if (kind === 'air') {
      const src = ctx.createBufferSource();
      src.buffer = makeNoise(4);
      src.loop = true;
      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.value = 1150;
      bp.Q.value = 0.55;
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 2400;
      const g = ctx.createGain();
      g.gain.value = 0.42;
      src.connect(bp).connect(lp).connect(g).connect(out);
      src.start();

      const pad = ctx.createOscillator();
      pad.type = 'sine';
      pad.frequency.value = 196;
      const pg = ctx.createGain();
      pg.gain.value = 0.03;
      pad.connect(pg).connect(out);
      pad.start();
      return { out, stops: [src, pad] };
    }

    const stops = [];
    [104, 156, 232].forEach((f, i) => {
      const o = ctx.createOscillator();
      o.type = 'sine';
      o.frequency.value = f;
      const g = ctx.createGain();
      g.gain.value = [0.10, 0.045, 0.02][i];
      const lfo = ctx.createOscillator();
      lfo.frequency.value = 0.06 + i * 0.03;
      const lg = ctx.createGain();
      lg.gain.value = 0.02;
      lfo.connect(lg).connect(g.gain);
      o.connect(g).connect(out);
      o.start();
      lfo.start();
      stops.push(o, lfo);
    });

    const noise = ctx.createBufferSource();
    noise.buffer = makeNoise(4);
    noise.loop = true;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 620;
    const ng = ctx.createGain();
    ng.gain.value = 0.10;
    noise.connect(lp).connect(ng).connect(out);
    noise.start();
    stops.push(noise);

    return { out, stops };
  }

  function startAudio() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      ctx = new AC();
    }
    if (ctx.state === 'suspended') ctx.resume();
    nodes = buildNodes(TRACKS[track].kind);
    if (muted) nodes.out.gain.value = 0;
    else nodes.out.gain.linearRampToValueAtTime(0.55, ctx.currentTime + 1.2);
  }

  function stopAudio() {
    if (!nodes) return;
    const n = nodes;
    nodes = null;
    try {
      n.out.gain.cancelScheduledValues(ctx.currentTime);
      n.out.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.5);
    } catch (e) {}
    setTimeout(() => {
      n.stops.forEach((s) => { try { s.stop(); } catch (e) {} });
      try { n.out.disconnect(); } catch (e) {}
    }, 600);
  }

  function paintPlayer() {
    $('#trkTitle').textContent = TRACKS[track].name;
    $('#trkArtist').textContent = TRACKS[track].artist;
    document.querySelector('.i-play').style.display = playing ? 'none' : 'block';
    document.querySelector('.i-pause').style.display = playing ? 'block' : 'none';
    $('#btnPlay').setAttribute('aria-label', playing ? '暂停' : '播放');
    $('#time').textContent = '0' + Math.floor(elapsed / 60) + ':' + pad(elapsed % 60);
    $('#progress').style.width = (elapsed / LOOP) * 100 + '%';
    $$('#playlist .trk').forEach((el, i) => el.classList.toggle('on', i === track));
  }

  function buildPlaylist() {
    const list = $('#playlist');
    list.innerHTML = '';
    TRACKS.forEach((t, i) => {
      const el = document.createElement('div');
      el.className = 'trk';
      el.innerHTML =
        `<span class="trk__i">${pad(i + 1)}</span>` +
        `<span class="trk__n">${t.name}</span>` +
        `<span class="trk__e">实时合成</span>`;
      el.addEventListener('click', () => selectTrack(i, true));
      list.appendChild(el);
    });
  }

  function selectTrack(i, play) {
    const wasPlaying = playing;
    track = (i + TRACKS.length) % TRACKS.length;
    elapsed = 0;
    if (playing) {
      stopAudio();
      startAudio();
      playing = true;
    } else if (play) {
      togglePlay(true);
    }
    paintPlayer();
    if (wasPlaying) requestAnimationFrame(animateBars);
  }

  function togglePlay(force) {
    const next = typeof force === 'boolean' ? force : !playing;
    if (next === playing) return;
    playing = next;
    if (playing) {
      startAudio();
      requestAnimationFrame(animateBars);
      clearInterval(timer);
      timer = setInterval(() => {
        elapsed = (elapsed + 1) % LOOP;
        paintPlayer();
      }, 1000);
    } else {
      stopAudio();
      clearInterval(timer);
      bars.forEach((b) => (b.style.height = '12%'));
    }
    paintPlayer();
  }

  $('#btnPlay').addEventListener('click', () => togglePlay());
  $('#btnPrev').addEventListener('click', () => selectTrack(track - 1, playing));
  $('#btnNext').addEventListener('click', () => selectTrack(track + 1, playing));
  $('#btnMute').addEventListener('click', () => {
    muted = !muted;
    if (nodes) {
      nodes.out.gain.cancelScheduledValues(ctx.currentTime);
      nodes.out.gain.linearRampToValueAtTime(muted ? 0 : 0.55, ctx.currentTime + 0.3);
    }
    $('#btnMute').style.opacity = muted ? '.45' : '1';
  });

  /* ---------- 信箱（GitHub Issues 当数据库） ---------- */
  const REPO = 'byuyan/nest';
  const API = `https://api.github.com/repos/${REPO}/issues?state=all&per_page=30`;
  const NEW_ISSUE = `https://github.com/${REPO}/issues/new`;

  function timeAgo(iso) {
    const t = new Date(iso).getTime();
    const d = Math.floor((Date.now() - t) / 1000);
    if (d < 60) return '刚刚';
    if (d < 3600) return Math.floor(d / 60) + ' 分钟前';
    if (d < 86400) return Math.floor(d / 3600) + ' 小时前';
    if (d < 86400 * 30) return Math.floor(d / 86400) + ' 天前';
    const dt = new Date(iso);
    return `${dt.getFullYear()}.${pad(dt.getMonth() + 1)}.${pad(dt.getDate())}`;
  }

  function renderGuest(items) {
    const list = $('#guestList');
    if (!items.length) {
      list.innerHTML = '<div class="guest__empty">信箱还是空的 —— 第一条留言留给你。</div>';
      return;
    }
    list.innerHTML = '';
    items.forEach((it) => {
      const el = document.createElement('div');
      el.className = 'noteb';
      const body = (it.body || '').trim() || it.title;
      el.innerHTML =
        '<div class="noteb__head">' +
        `<span class="noteb__ava">${(it.user.login || 'G')[0].toUpperCase()}</span>` +
        `<span class="noteb__name">${escapeHtml(it.title || it.user.login)}</span>` +
        `<span class="noteb__time">${timeAgo(it.created_at)}</span>` +
        '</div>' +
        `<p class="noteb__body">${escapeHtml(body).slice(0, 1200)}</p>` +
        '<p class="noteb__foot">来自 GitHub · ' + escapeHtml(it.user.login) + '</p>';
      list.appendChild(el);
    });
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  async function loadGuest() {
    const list = $('#guestList');
    try {
      const res = await fetch(API, { headers: { Accept: 'application/vnd.github+json' } });
      if (!res.ok) throw new Error(res.status);
      const items = (await res.json()).filter((i) => !i.pull_request);
      renderGuest(items);
      $('#statNotes').textContent = items.length;
      $('#guestMeta').textContent = `共 ${items.length} 条留言 · 存在 GitHub Issues 里`;
    } catch (e) {
      list.innerHTML = '<div class="guest__empty">暂时读不到留言（可能被 GitHub 限流），过一会儿刷新试试。</div>';
      $('#statNotes').textContent = '—';
      $('#guestMeta').textContent = '读取失败 · 稍后再试';
    }
  }

  function openWrite(text) {
    const body = (text || '').trim();
    const url = NEW_ISSUE + '?title=' + encodeURIComponent(body ? body.slice(0, 40) : '给小窝留句话') +
      (body ? '&body=' + encodeURIComponent(body + '\n\n— 来自小窝') : '');
    window.open(url, '_blank', 'noopener');
  }

  /* 留言直邮：FormSubmit 表单端点，寄到 byuyan@qq.com */
  const MAIL_URL = 'https://formsubmit.co/ajax/byuyan@qq.com';
  function mailStamp() {
    const d = new Date();
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }
  async function sendMail(payload) {
    const res = await fetch(MAIL_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(Object.assign({ _subject: '小窝留言 · ' + mailStamp(), _template: 'table' }, payload)),
    });
    if (!res.ok) throw new Error('http ' + res.status);
    const data = await res.json().catch(() => ({}));
    if (String(data.success) !== 'true') throw new Error(data.message || 'failed');
    return true;
  }
  function mailFallback(text) {
    window.location.href = 'mailto:byuyan@qq.com?subject=' +
      encodeURIComponent('小窝留言 · ' + mailStamp()) +
      '&body=' + encodeURIComponent(text + '\n\n— 来自小窝');
  }

  const quickForm = $('#quickForm');
  const quickInput = $('#quickInput');
  if (quickForm) {
    quickForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const v = quickInput.value.trim();
      if (!v) { quickInput.focus(); return; }
      const btn = quickForm.querySelector('button');
      const label = btn.textContent;
      btn.disabled = true;
      btn.textContent = '…';
      try {
        await sendMail({ name: '小窝访客', email: '', message: v });
        quickInput.value = '';
        quickInput.placeholder = '寄出去了，谢谢你';
        btn.textContent = '已寄出';
        setTimeout(() => { btn.textContent = label; quickInput.placeholder = '留句话给我，会直接寄到我的邮箱'; }, 3400);
      } catch (err) {
        btn.textContent = label;
        mailFallback(v);
      } finally {
        btn.disabled = false;
      }
    });
  }

  const mailForm = $('#mailForm');
  if (mailForm) {
    const nameEl = $('#mailName');
    const mailEl = $('#mailEmail');
    const msgEl = $('#mailMsg');
    const stateEl = $('#mailState');
    mailForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const msg = msgEl.value.trim();
      if (!msg) { msgEl.focus(); return; }
      const btn = mailForm.querySelector('button[type="submit"]');
      btn.disabled = true;
      stateEl.dataset.state = 'sending';
      stateEl.textContent = '正在寄出…';
      try {
        await sendMail({ name: nameEl.value.trim() || '小窝访客', email: mailEl.value.trim(), message: msg });
        msgEl.value = '';
        stateEl.dataset.state = 'ok';
        stateEl.textContent = '已经寄到我的邮箱了，thanks。';
      } catch (err) {
        stateEl.dataset.state = 'err';
        stateEl.innerHTML = '没寄出去，<a href="mailto:byuyan@qq.com?subject=' +
          encodeURIComponent('小窝留言 · ' + mailStamp()) + '&body=' + encodeURIComponent(msg) +
          '">点这里直接用邮箱发我</a>。';
      } finally {
        btn.disabled = false;
      }
    });
  }

  /* ---------- 最近的脚印（真实提交） ---------- */
  async function loadCommits() {
    const el = $('#commits');
    try {
      const res = await fetch('https://api.github.com/repos/byuyan/byuyan.github.io/commits?per_page=3', {
        headers: { Accept: 'application/vnd.github+json' },
      });
      if (!res.ok) throw new Error(res.status);
      const items = await res.json();
      el.innerHTML = '';
      items.forEach((c) => {
        const li = document.createElement('li');
        li.className = 'commit__item';
        li.innerHTML =
          `<p class="commit__msg">${escapeHtml(c.commit.message.split('\n')[0])}</p>` +
          `<p class="commit__time">${timeAgo(c.commit.author.date)}</p>`;
        el.appendChild(li);
      });
    } catch (e) {
      el.innerHTML = '<li class="commit__empty">GitHub 暂时没回应，晚点再看。</li>';
    }
  }

  /* ---------- 设置 ---------- */
  const drawer = $('#drawer');
  const openDrawer = (open) => {
    drawer.classList.toggle('open', open);
    drawer.setAttribute('aria-hidden', String(!open));
  };
  $('#btnSettings').addEventListener('click', () => openDrawer(true));
  $$('[data-close]').forEach((el) => el.addEventListener('click', () => openDrawer(false)));

  function buildSettings() {

    $('#set24').checked = prefs.hour24;
    $('#setSec').checked = prefs.sec;
    $('#setGlass').value = prefs.glass;
    $('#setAuto').checked = prefs.auto;
    document.documentElement.style.setProperty('--glass', prefs.glass / 100);

    $('#set24').addEventListener('change', (e) => {
      prefs.hour24 = e.target.checked;
      savePrefs();
      firstTick = true;
      tick();
    });
    $('#setSec').addEventListener('change', (e) => {
      prefs.sec = e.target.checked;
      savePrefs();
      applySec();
    });
    $('#setGlass').addEventListener('input', (e) => {
      prefs.glass = +e.target.value;
      document.documentElement.style.setProperty('--glass', prefs.glass / 100);
      savePrefs();
    });
    $('#setAuto').addEventListener('change', (e) => {
      prefs.auto = e.target.checked;
      savePrefs();
      if (prefs.auto) togglePlay(true);
    });
    $('#btnReset').addEventListener('click', () => {
      prefs = { ...DEFAULTS };
      savePrefs();
      document.documentElement.style.setProperty('--glass', prefs.glass / 100);
      $('#set24').checked = true;
      $('#setSec').checked = true;
      $('#setGlass').value = prefs.glass;
      $('#setAuto').checked = false;
      firstTick = true;
      tick();
      applySec();
      paintWall(false);
    });
  }

  function applySec() {
    digits.forEach((d, i) => {
      d.parentElement.style.display = prefs.sec || i < 4 ? '' : 'none';
    });
    seps.forEach((s, i) => (s.style.display = prefs.sec || i < 1 ? '' : 'none'));
  }

  /* ---------- AI 小助手 ---------- */
  const AI = [
    {
      k: ['你是谁', '哪位', '主人', '屋主', '站长', '谁做的', '宇彬', '郑宇彬'],
      a: '屋主叫郑宇彬，武汉理工大学数字经济 2503 班、2025 级，现在大二。这间屋子是他自己一行行写出来的，不是模板。',
    },
    {
      k: ['哪个学校', '学校', '什么专业', '专业', '大几', '几年级', '年级', '武汉理工', '数字经济'],
      a: '武汉理工大学，数字经济专业，2503 班（2025 级），现读大二。',
    },
    {
      k: ['gpa', '绩点', '成绩', '学分', '排名'],
      a: 'GPA 3.408（5 分制），班级 24 人里必修绩点排第二，已修 53 / 175 学分。这些数字在「介绍」页里都写着。',
    },
    {
      k: ['家乡', '哪里人', '老家', '生日', '多大', '年龄', '出生'],
      a: '2006 年 4 月 14 日生，安徽黄山歙县人，现在住在武汉。',
    },
    {
      k: ['联系方式', '联系', '邮箱', '邮件', 'qq', '微信', '加你', '找你', '合作'],
      a: '邮箱 byuyan@qq.com，发什么都行。微信看名片上那颗「加我微信」，点开扫码就加上了。',
    },
    {
      k: ['github', '源码', '代码', '开源', '仓库', 'byuyan'],
      a: 'GitHub 是 @byuyan，这站点的源码就在 byuyan.github.io 仓库的 nest/ 目录里，想看哪行都能翻。',
    },
    {
      k: ['上传', '空位', '占位', '加作品', '放作品', 'slot', '怎么传'],
      a: '打开 assets/data/works.json，挑一个 slot-01…07，把 placeholder 那行删掉，填上 title / category / year / cover / summary / desc / role / deliverables / tags，封面图丢进 assets/img/，主页和作品页就会自己变成真卡片。',
    },
    {
      k: ['作品集', '作品', '项目', '案子'],
      a: '作品页现在是 7 个空位，等着往里放东西。想知道怎么放，问一句「作品怎么上传」。',
    },
    {
      k: ['文章', '博客', '笔记', 'post'],
      a: '目前有 3 篇文章。主页只露最新的三篇，posts.html 是全部，点进去是 post.html?p=slug 的正文，正文是本地 markdown 现渲染的。想加新的：正文写成 posts/xxx.md，再在 assets/data/posts.json 里加一条。',
    },
    {
      k: ['怎么搭', '用的什么', '技术', '框架', '实现', '原理', '网站', '做站'],
      a: '没用任何框架，HTML/CSS/JS 全是手写的：时钟是一位一位往下滚的机械数字轮，唱片机里的声音是浏览器实时合成的（所以没有一个音频文件），留言直接存在 GitHub Issues 里。',
    },
    {
      k: ['时钟', '时间', '几点', '滚轮', '钟'],
      a: '那是一根一根的竖排数字轮，0 到 9 排了三圈。哪一位变了就单独往下滚一格，停的时候会冲过一点再弹回来，像老式里程表。',
    },
    {
      k: ['灯光', '开灯', '关灯', '那盏灯', '开关', '灯'],
      a: '首屏右上角那盏灯。拨一下开关，滑块会自己吸到那一头、轻轻回弹；灯亮了，指示灯亮起来，灯泡从灰慢慢变暖，整间屋子也跟着亮一层。关掉就回到夜里。',
    },
    {
      k: ['壁纸', '背景图', '背景', '蓝莓'],
      a: '壁纸固定用这张蓝莓微距——暗调、低饱和、右边留了放字的地方，不做切换了。',
    },
    {
      k: ['音乐', '唱片', '歌', '声音', '播放', 'bgm'],
      a: '左下角那台唱片机里是两条实时合成的环境音：一条夜里的低频垫音，一条清晨的雾气声。想在浏览器里听，点一下播放就行，没有音频文件也就没有版权问题。',
    },
    {
      k: ['信箱', '留言', '写信', '评论'],
      a: '点顶部「信箱」能看到所有人写的话，不用登录。写留言会跳到 GitHub 新建 issue 的页面，登录一次 GitHub 就能发。',
    },
    {
      k: ['脚印', '提交', 'commit', '更新记录', '最近更新'],
      a: '右下角「最近的脚印」拉的是这个仓库的真实提交记录，不是假数据——我改了什么、什么时候改的，那儿都留着。',
    },
    {
      k: ['设置', '抽屉', '24小时', '显示秒', '毛玻璃', '静音'],
      a: '顶部右上角那个小滑块图标是设置：24 小时制、显不显示秒、毛玻璃浓度、进页面要不要出声，都在里面。',
    },
    {
      k: ['介绍页', '自我介绍', 'me.html', 'about-site', '关于我'],
      a: '导航第四项「介绍」是一整页另做的米白纸张风格页面，原样嵌进来的。左下角有枚「回小窝」，点它会用半秒多平滑滚回你离开的位置，不会重新放一遍开场的球。',
    },
    {
      k: ['改文字', '改文案', '修改介绍', 'content.js', '介绍怎么写'],
      a: '介绍页的字都在 about-site/assets/js/content.js 里，一个字段一个字段写着，改完刷新就是新的。主页那边的字在 index.html。',
    },
    {
      k: ['回小窝', '返回主页', '回到主页', '返回'],
      a: '在介绍页左下角点「回小窝」，会缓缓滚回你当初离开主页时停的地方，大概 0.6 秒，不是一下子瞬移回去。',
    },
    {
      k: ['手机', '移动端', '窄屏', '小屏', '平板'],
      a: '窄屏也调过：名片、时钟、灯光模块会依次往下排，灯光卡变成居中整宽的一条，不会挤在一起。',
    },
    {
      k: ['开场', '那颗球', '加载', '进入', 'webgpu'],
      a: '一进来那颗液态玻璃球是 WebGPU 在显卡上实时算的，点一下就进屋。老机器或者不支持 WebGPU 的浏览器会自动换成一张静态玻璃球，不会白屏。',
    },
    {
      k: ['你是ai', '你是机器人', '你是真人', '你是程序', '大模型', '你会什么', '你是不是'],
      a: '我不是大模型，是一套写死的规则问答——认得这间屋子的关键词，然后挑一段提前写好的话回你。所以我不会瞎编，但也确实不聪明。想问什么，换个说法再问一次试试。',
    },
    {
      k: ['你好', 'hello', 'hi', '在吗', '嗨'],
      a: '在的。这间屋子的事我大概都知道：主人、作品、文章、时钟、灯，随便挑一个问。',
    },
    {
      k: ['谢谢', '感谢', 'thanks'],
      a: '不客气。要是想留句话，信箱一直开着。',
    },
    {
      k: ['关于这间', '这间屋子', '关于页', '关于区'],
      a: '「关于」区写的是这间屋子怎么来的、用什么做的，还有一句签名：在数据与叙事之间，搭一间有温度的小窝。',
    },
    {
      k: ['配色', '颜色', '设计', '风格', '审美'],
      a: '整体是暗调：蓝莓微距压暗做底，字是冷白，只有开灯和唱片机那几处给一点暖色。不花哨，但不至于闷。',
    },
    {
      k: ['多久', '建站', '做了多久', '什么时候做'],
      a: '具体日子我记不清了，但每一次改动的时间都在「最近的脚印」里，从第一版到现在都能翻出来。',
    },
  ];

  const chatEl = $('#aiChat');
  const panel = $('#aiPanel');

  function pushMsg(text, mine) {
    const el = document.createElement('div');
    el.className = 'msg ' + (mine ? 'msg--me' : 'msg--ai');
    el.textContent = text;
    chatEl.appendChild(el);
    chatEl.scrollTop = chatEl.scrollHeight;
  }

  function norm(s) {
    return s.replace(/[\s，。、？！,.?!：:；;'"“”‘’（）()《》<>~—…·]/g, '').toLowerCase();
  }

  function answer(text) {
    const q = norm(text);
    if (!q) return '你想问什么？直接打字就行。';
    let best = null;
    let bestScore = 0;
    AI.forEach((item) => {
      let s = 0;
      item.k.forEach((k) => {
        const kk = norm(k);
        if (kk && q.includes(kk)) s = Math.max(s, kk.length);
      });
      if (s > bestScore) {
        bestScore = s;
        best = item;
      }
    });
    if (best) return best.a;
    return '这个我答不上来——我只认得这间屋子的词。试试问：主人是谁 / 学校专业 / 作品怎么上传 / 时钟怎么做的 / 灯怎么开 / 留言在哪看。或者去「信箱」留一句话，他会认真看。';
  }

  function buildQuick() {
    const quick = $('#aiQuick');
    ['你是谁', '怎么联系你', '作品怎么上传', '时钟怎么做的', '灯怎么开', '留言在哪看'].forEach((q) => {
      const b = document.createElement('button');
      b.textContent = q;
      b.addEventListener('click', () => {
        pushMsg(q, true);
        setTimeout(() => pushMsg(answer(q), false), 260);
      });
      quick.appendChild(b);
    });
  }

  $('#aiFab').addEventListener('click', () => {
    const open = panel.classList.toggle('open');
    panel.setAttribute('aria-hidden', String(!open));
    if (open && !chatEl.childElementCount) {
      pushMsg('嗨，这里是小窝。想问这间屋子的什么？', false);
    }
  });
  $('#aiForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const v = $('#aiInput').value.trim();
    if (!v) return;
    $('#aiInput').value = '';
    pushMsg(v, true);
    setTimeout(() => pushMsg(answer(v), false), 300);
  });

  /* ---------- 滚动高亮 ---------- */
  const navItems = $$('.nav__item');
  const sections = ['home', 'mail', 'about'].map((id) => $('#' + id));
  const onScroll = () => {
    const y = window.scrollY + window.innerHeight * 0.35;
    let active = 'home';
    sections.forEach((s) => {
      if (s && s.offsetTop <= y) active = s.id;
    });
    navItems.forEach((n) => n.classList.toggle('on', n.getAttribute('href') === '#' + active));
  };
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---------- 键盘 ---------- */
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      openDrawer(false);
      panel.classList.remove('open');
      panel.setAttribute('aria-hidden', 'true');
    }
  });

  /* ---------- 漂浮光尘：每颗走各自方向 ---------- */
  function buildMotes() {
    const box = document.getElementById('motes');
    if (!box) return;
    const paths = ['moteUpRight', 'moteUpLeft', 'moteLateral', 'moteSway'];
    const N = 20;
    const rows = [];
    for (let i = 0; i < N; i++) {
      const path = paths[i % paths.length];
      const size = 2 + Math.random() * 5;
      const dur = 26 + Math.random() * 36;
      const delay = -Math.random() * dur;
      const left = Math.random() * 100;
      const top = 4 + Math.random() * 88;
      const blur = Math.random() > 0.65 ? '0.7px' : '0px';
      rows.push(
        `<span class="mote" style="left:${left.toFixed(2)}%;top:${top.toFixed(2)}%;` +
          `width:${size.toFixed(1)}px;height:${size.toFixed(1)}px;` +
          `animation-name:${path};animation-duration:${dur.toFixed(1)}s;` +
          `animation-delay:${delay.toFixed(1)}s;filter:blur(${blur})"></span>`
      );
    }
    // 几颗虚化的大光斑，拉开景深
    for (let i = 0; i < 5; i++) {
      const path = i % 2 ? 'moteSway' : 'moteLateral';
      const size = 10 + Math.random() * 9;
      const dur = 44 + Math.random() * 40;
      const delay = -Math.random() * dur;
      const left = Math.random() * 100;
      const top = 10 + Math.random() * 80;
      rows.push(
        `<span class="mote mote--bokeh" style="left:${left.toFixed(2)}%;top:${top.toFixed(2)}%;` +
          `width:${size.toFixed(1)}px;height:${size.toFixed(1)}px;` +
          `animation-name:${path};animation-duration:${dur.toFixed(1)}s;` +
          `animation-delay:${delay.toFixed(1)}s;filter:blur(2.4px)"></span>`
      );
    }
    box.innerHTML = rows.join('');
  }

  /* ---------- 启动 ---------- */
  buildClock();
  buildMotes();
  buildPlaylist();
  buildSettings();
  buildQuick();
  applySec();
  paintWall(true);
  paintDate();
  tick();
  paintPlayer();
  setInterval(() => {
    tick();
    paintDate();
  }, 1000);
  loadGuest();
  loadCommits();

  // 页面可见时暂停计时器，回来继续
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && playing) togglePlay(false);
  });

  // ?scroll=mail 之类的直链，方便截图与分享锚点
  const jump = new URLSearchParams(location.search).get('scroll');
  if (jump) {
    const target = document.getElementById(jump);
    if (target) {
      document.documentElement.style.scrollBehavior = 'auto';
      window.scrollTo(0, target.offsetTop);
      setTimeout(() => (document.documentElement.style.scrollBehavior = ''), 300);
    }
  }
})();


/* ---------- 开场液态球 → 点一下进小窝 ---------- */
(function () {
  const intro = document.getElementById('intro');
  const tap = document.getElementById('introTap');
  if (!intro) return;

  const params = new URLSearchParams(location.search);
  const skip = params.get('enter') === '1' || params.get('wx') === '1' || (location.hash && location.hash !== '#home');
  let entered = false;

  function enter(instant) {
    if (entered) return;
    entered = true;
    if (instant) {
      intro.remove();
      return;
    }
    intro.classList.add('is-out');
    window.setTimeout(function () {
      if (intro.parentNode) intro.parentNode.removeChild(intro);
    }, 950);
  }

  if (skip) { enter(true); return; }

  if (tap) tap.addEventListener('click', function () { enter(false); });
  document.addEventListener('keydown', function (e) {
    if (!entered && (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape')) enter(false);
  });
})();

/* ---------- 加我微信卡片 ---------- */
(function () {
  const card = document.getElementById('wxcard');
  const btnOpen = document.getElementById('btnWx');
  if (!card) return;

  let lastFocus = null;

  function openCard() {
    lastFocus = document.activeElement;
    card.classList.add('open');
    card.setAttribute('aria-hidden', 'false');
    const x = card.querySelector('.wxcard__x');
    if (x) x.focus({ preventScroll: true });
  }

  function closeCard() {
    card.classList.remove('open');
    card.setAttribute('aria-hidden', 'true');
    if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
  }

  if (btnOpen) btnOpen.addEventListener('click', openCard);

  card.addEventListener('click', function (e) {
    if (e.target.closest('[data-wxclose]')) closeCard();
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && card.classList.contains('open')) closeCard();
  });

  // ?wx=1 直开微信卡片（截图/分享用）
  if (new URLSearchParams(location.search).get('wx') === '1') {
    setTimeout(openCard, 400);
  }
  // 二维码图还没上传时，别显示碎图
  const qr = document.getElementById('wxQr');
  const box = document.getElementById('wxQrBox');
  if (qr) {
    const markMissing = function () {
      if (!box) return;
      qr.remove();
      box.classList.add('is-missing');
      box.textContent = '二维码待补';
    };
    qr.addEventListener('error', markMissing);
    if (qr.complete && qr.naturalWidth === 0) setTimeout(markMissing, 0);
  }
})();

/* ===== 文章 / 作品：主页预览 + 统计数字 ===== */
(() => {
  'use strict';

  const $ = (s, r = document) => r.querySelector(s);
  const esc = (v) => String(v === undefined || v === null ? '' : v)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
  const setText = (id, v) => {
    const el = document.getElementById(id);
    if (el) el.textContent = String(v);
  };
  const getJSON = (url) => fetch(url, { cache: 'no-store' }).then((r) => {
    if (!r.ok) throw new Error('HTTP ' + r.status);
    return r.json();
  });
  const note = (el, text) => {
    if (el) el.innerHTML = '<div class="subnote">' + esc(text) + '</div>';
  };

  const postsBox = $('#homePosts');
  const worksBox = $('#homeWorks');

  if (postsBox) {
    getJSON('assets/data/posts.json').then((posts) => {
      setText('statPosts', posts.length);
      posts.sort((a, b) => (b.date > a.date ? 1 : -1));
      const list = posts.slice(0, 3);
      postsBox.innerHTML = list.map((p) => (
        '<li class="plist__item">' +
          '<a class="plist__link" href="post.html?p=' + encodeURIComponent(p.slug) + '">' +
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
        '</li>'
      )).join('');
    }).catch(() => note(postsBox, '文章没读出来，去文章页看看。'));
  }

  if (worksBox) {
    getJSON('assets/data/works.json').then((works) => {
      const filled = works.filter((w) => !w.placeholder);
      setText('statWorks', filled.length);
      if (!filled.length) {
        worksBox.innerHTML =
          '<div class="work work--empty work--say">' +
            '<div class="work__body">' +
              '<div class="work__caption">七个位置，先空着<small>一个一个填</small></div>' +
              '<p class="work__summary">作品正在整理。做好一个，就把封面和故事放进作品页的那一格。</p>' +
              '<div class="work__foot"><a class="work__link" href="works.html">去作品页看这七格 ↗</a></div>' +
            '</div>' +
          '</div>';
        return;
      }
      worksBox.innerHTML = filled.slice(0, 4).map((w) => (
        '<a class="work" href="works.html">' +
          '<img class="work__cover" src="' + esc(w.cover) + '" alt="' + esc(w.title) + '" loading="lazy">' +
          '<div class="work__body">' +
            '<div class="work__caption">' + esc(w.title) +
              '<small>' + esc(w.category) + ' · ' + esc(w.year) + '</small>' +
            '</div>' +
            '<p class="work__summary">' + esc(w.summary) + '</p>' +
          '</div>' +
        '</a>'
      )).join('');
    }).catch(() => note(worksBox, '作品没读出来，去作品页看看。'));
  }
})();

/* ---------- 从介绍页回来：回到离开前的位置 ---------- */
(function () {
  var KEY = 'nest.return.y.v1';
  // 去介绍页之前，先把当前位置记下来
  document.addEventListener('click', function (e) {
    var a = e.target && e.target.closest ? e.target.closest('a[href^="me.html"]') : null;
    if (!a) return;
    try { sessionStorage.setItem(KEY, String(Math.round(window.scrollY || 0))); } catch (err) {}
  }, true);

  var params = new URLSearchParams(location.search);
  if (params.get('enter') !== '1') return;

  var y = 0;
  try { y = parseInt(sessionStorage.getItem(KEY) || '0', 10) || 0; } catch (err) {}
  if (y <= 0) return;

  var done = false;
  function restore() {
    if (done) return;
    done = true;
    var root = document.documentElement;
    root.style.scrollBehavior = 'auto';
    var from = window.scrollY || 0;
    var dist = y - from;
    if (Math.abs(dist) < 24) { window.scrollTo(0, y); root.style.scrollBehavior = ''; return; }
    var dur = Math.min(1150, Math.max(560, Math.abs(dist) * 0.36));
    var t0 = Date.now();
    function ease(p) { return p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2; }
    var iv = setInterval(function () {
      var p = Math.min(1, (Date.now() - t0) / dur);
      window.scrollTo(0, Math.round(from + dist * ease(p)));
      if (p >= 1) {
        clearInterval(iv);
        window.scrollTo(0, y);
        root.style.scrollBehavior = '';
      }
    }, 16);
    setTimeout(function () {               // 兜底：定时器被掐掉也要落到原位
      clearInterval(iv);
      if (Math.abs(window.scrollY - y) > 1) window.scrollTo(0, y);
      root.style.scrollBehavior = '';
    }, dur + 200);
  }
  requestAnimationFrame(restore);
  window.addEventListener('load', restore);
})();


/* ---------- 灯光开关：拨一下，整间屋子亮一层 ---------- */
(function () {
  var lamp = document.getElementById('lamp');
  if (!lamp) return;

  var sw = document.getElementById('lampSw');
  var knob = lamp.querySelector('.lamp__knob');
  var stateEl = document.getElementById('lampState');
  var hintEl = lamp.querySelector('.lamp__hint');
  var KEY = 'nest.lamp.v1';
  var TRAVEL = 26;                  // 滑块行程（px），和 CSS 里的 26px 对齐
  var on = false;

  try { on = localStorage.getItem(KEY) === '1'; } catch (e) {}

  function paint() {
    lamp.dataset.on = on ? '1' : '0';
    if (sw) sw.setAttribute('aria-checked', on ? 'true' : 'false');
    document.body.classList.toggle('lamp-on', on);
    if (stateEl) stateEl.textContent = on ? '灯亮着' : '灯关着';
    if (hintEl) hintEl.textContent = on ? '拨一下 · 关灯' : '拨一下 · 开灯';
  }

  function setOn(v, save) {
    on = !!v;
    paint();
    if (save) { try { localStorage.setItem(KEY, on ? '1' : '0'); } catch (e) {} }
  }

  paint();

  if (sw && knob) {
    var dragging = false;
    var startX = 0;
    var base = 0;
    var moved = 0;

    sw.addEventListener('pointerdown', function (e) {
      dragging = true;
      moved = 0;
      startX = e.clientX;
      base = on ? TRAVEL : 0;
      knob.style.transition = 'none';                 // 拖动时别跟手打架
      knob.style.transform = 'translate3d(' + base + 'px,0,0)';
      try { sw.setPointerCapture(e.pointerId); } catch (err) {}
      e.preventDefault();
    });

    sw.addEventListener('pointermove', function (e) {
      if (!dragging) return;
      var dx = e.clientX - startX;
      moved = Math.max(moved, Math.abs(dx));
      var k = base + dx;
      // 拖过头一点会有橡皮筋的阻力，像真的被卡住
      if (k < 0) k = k * 0.32;
      else if (k > TRAVEL) k = TRAVEL + (k - TRAVEL) * 0.32;
      knob.style.transform = 'translate3d(' + k.toFixed(2) + 'px,0,0)';
    });

    function release(e) {
      if (!dragging) return;
      dragging = false;
      var m = /translate3d\(([-\d.]+)px/.exec(knob.style.transform);
      var k = m ? parseFloat(m[1]) : base;
      var next;
      if (moved < 4) next = !on;          // 只是轻点一下也当拨
      else next = k > TRAVEL / 2;         // 过了一半就吸附到那一头
      knob.style.transform = '';          // 交回 CSS：带回弹的吸附
      knob.style.transition = '';
      setOn(next, true);
      if (e && e.pointerId !== undefined) {
        try { sw.releasePointerCapture(e.pointerId); } catch (err) {}
      }
    }

    sw.addEventListener('pointerup', release);
    sw.addEventListener('pointercancel', release);
    sw.addEventListener('lostpointercapture', function () { if (dragging) release(null); });
    sw.addEventListener('click', function (e) { e.preventDefault(); });   // 交给 pointer 处理，免双击

    sw.addEventListener('keydown', function (e) {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        setOn(!on, true);
      }
    });
  }

  // ?lamp=1 / ?lamp=0 可以先定住状态，方便截图
  var q = new URLSearchParams(location.search).get('lamp');
  if (q === '1') setOn(true, false);
  if (q === '0') setOn(false, false);
})();
