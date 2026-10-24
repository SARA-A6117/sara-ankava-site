/* Sara Ankava — שכבת שדרוג: מחשבון דליפה, כרטיסים אינטראקטיביים, מעבר עמודים (נטען אחרי main.js) */
(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover:hover) and (pointer:fine)').matches;
  const g = window.gsap;

  /* ---- הדר: גלגול אותיות בקישורי הקפסולה + סטטוס חי ---- */
  $$('.capsule a').forEach(a => {
    if ($('.roll', a)) return;
    const t = a.textContent.trim(), r = document.createElement('span'), x = document.createElement('span'), y = document.createElement('span');
    r.className = 'roll'; x.textContent = t; y.textContent = t; y.setAttribute('aria-hidden', 'true'); r.append(x, y); a.textContent = ''; a.append(r);
  });
  const live = $('.capsule__live');
  if (live) {
    const tickLive = () => {
      const p = Object.fromEntries(new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Jerusalem', weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(new Date()).map(x => [x.type, x.value]));
      const t = (+p.hour % 24) + (+p.minute) / 60, open = p.weekday !== 'Fri' && p.weekday !== 'Sat' && t >= 9 && t < 18;
      live.classList.toggle('is-open', open); $('[data-live]', live).textContent = open ? 'זמינה עכשיו' : 'חוזרת תוך 24 שעות';
    };
    tickLive(); setInterval(tickLive, 30000);
  }

  /* ---- זרקור שעוקב אחרי העכבר ---- */
  const hosts = $$('.scard, .case, .why .panel, .fit__card, .pcard, .leak__viz');
  hosts.forEach(h => { h.classList.add('spot-host'); const s = document.createElement('i'); s.className = 'spot'; s.setAttribute('aria-hidden', 'true'); h.append(s); });
  if (fine && !reduce) {
    addEventListener('pointermove', e => {
      const h = e.target.closest && e.target.closest('.spot-host'); if (!h) return;
      const r = h.getBoundingClientRect(); h.style.setProperty('--mx', (e.clientX - r.left) + 'px'); h.style.setProperty('--my', (e.clientY - r.top) + 'px');
    }, { passive: true });

    /* פינג של ריבוע בכל לחיצה */
    addEventListener('pointerdown', e => {
      const p = document.createElement('i'); p.className = 'ping'; p.style.left = e.clientX + 'px'; p.style.top = e.clientY + 'px';
      document.body.append(p); setTimeout(() => p.remove(), 850);
    }, { passive: true });

    /* כרטיס תיק העבודות: הטיה תלת-ממדית */
    const pc = $('.pcard');
    if (pc) {
      pc.addEventListener('pointermove', e => {
        const r = pc.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
        pc.classList.add('is-tilting'); pc.style.transform = `perspective(900px) rotateY(${x * -9}deg) rotateX(${y * 9}deg)`;
      });
      pc.addEventListener('pointerleave', () => { pc.classList.remove('is-tilting'); pc.style.transform = ''; });
    }
  }

  /* ---- מחשבון הדליפה ---- */
  const lk = $('#leak');
  if (lk) {
    const field = $('[data-field]', lk), cta = $('[data-leak-cta]', lk);
    const inp = Object.fromEntries($$('input[data-k]', lk).map(i => [i.dataset.k, i]));
    const out = Object.fromEntries($$('output[data-o]', lk).map(o => [o.dataset.o, o]));
    const nowEl = $('[data-r="now"]', lk), gainEl = $('[data-r="gain"]', lk);
    const TOTAL = 1000, GAIN = 5;
    let seed = 7; const rnd = () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
    const order = Array.from({ length: TOTAL }, (_, i) => i); for (let i = TOTAL - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; }
    const rank = new Array(TOTAL); order.forEach((cell, r) => { rank[cell] = r; });
    const cells = Array.from({ length: TOTAL }, () => { const i = document.createElement('i'); field.append(i); return i; });
    const nf = n => Math.round(n).toLocaleString('he-IL');
    const state = { n: 0, gn: 0, now: 0, gain: 0 };
    let shown = false;

    const paint = () => cells.forEach((c, i) => { const r = rank[i], on = r < Math.round(state.n), up = !on && r < Math.round(state.n) + Math.round(state.gn); c.classList.toggle('on', on); c.classList.toggle('up', up); });
    const read = () => ({ v: +inp.v.value, c: +inp.c.value, a: +inp.a.value });
    const update = () => {
      const { v, c, a } = read();
      out.v.textContent = nf(v); out.c.textContent = c.toFixed(1) + '%'; out.a.textContent = '₪' + nf(a);
      Object.values(inp).forEach(i => i.style.setProperty('--p', ((i.value - i.min) / (i.max - i.min) * 100) + '%'));
      const now = v * c / 100 * a, gain = v * 0.005 * a, n = c * 10;
      cta.href = `https://wa.me/${WA_NUMBER}?text=` + encodeURIComponent(`היי שרי, ניסיתי את המחשבון באתר: ${nf(v)} מבקרים בחודש, ${c.toFixed(1)}% הפיכה ללקוחות, הזמנה ממוצעת ₪${nf(a)}. אשמח לבדוק איתך את המספרים האמיתיים.`);
      cta.target = '_blank'; cta.rel = 'noopener';
      if (!shown) return;
      if (g && !reduce) g.to(state, { n, gn: GAIN, now, gain, duration: .55, ease: 'power3.out', overwrite: true, onUpdate: render });
      else { Object.assign(state, { n, gn: GAIN, now, gain }); render(); }
    };
    const render = () => { nowEl.textContent = '₪' + nf(state.now); gainEl.textContent = '+₪' + nf(state.gain); paint(); };
    Object.values(inp).forEach(i => i.addEventListener('input', update));
    update();
    /* כניסה: הריבועים נדלקים אחד אחרי השני כשמגיעים לאזור */
    const reveal = () => { if (shown) return; shown = true; update(); };
    if (g && window.ScrollTrigger) ScrollTrigger.create({ trigger: field, start: 'top 85%', once: true, onEnter: reveal });
    else { const io = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) { reveal(); io.disconnect(); } }); io.observe(field); }
    setTimeout(reveal, 6000);
  }

  /* ---- חלון הפרויקט נפתח בגלילה ---- */
  if (g && window.ScrollTrigger && !reduce) {
    $$('.case__media').forEach(m => g.fromTo(m, { clipPath: 'inset(7% 7% 7% 7% round 26px)' }, { clipPath: 'inset(0% 0% 0% 0% round 0px)', ease: 'none', scrollTrigger: { trigger: m, start: 'top 95%', end: 'top 50%', scrub: true } }));
  }

  /* ---- מעבר בין עמודים: מסך עם ריבוע הלוגו ---- */
  if (!reduce) {
    const pt = document.createElement('div'); pt.className = 'pt'; pt.setAttribute('aria-hidden', 'true'); pt.innerHTML = '<i></i>'; document.body.append(pt);
    let arrived = false; try { arrived = sessionStorage.getItem('sa-pt') === '1'; sessionStorage.removeItem('sa-pt'); } catch (e) {}
    if (arrived) { pt.classList.add('is-cover'); requestAnimationFrame(() => requestAnimationFrame(() => { pt.classList.remove('is-cover'); pt.classList.add('is-out'); setTimeout(() => pt.classList.remove('is-out'), 800); })); }
    addEventListener('pageshow', e => { if (e.persisted) pt.className = 'pt'; });
    document.addEventListener('click', e => {
      const a = e.target.closest && e.target.closest('a[href]');
      if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button || a.target === '_blank' || a.hasAttribute('download')) return;
      const u = new URL(a.href, location.href);
      if (u.origin !== location.origin || !/\.html$|\/$/.test(u.pathname) || (u.pathname === location.pathname && u.hash)) return;
      e.preventDefault(); try { sessionStorage.setItem('sa-pt', '1'); } catch (x) {}
      pt.classList.add('is-in'); setTimeout(() => { location.href = a.href; }, 560);
    });
  }
})();

/* ---- הירו: ה-a כבועת דיבור מריבועים. גל דיבור יוצא מהריבוע הלימוני, והעכבר מדליק ריבועים ---- */
(() => {
  const box = document.querySelector('[data-pa]'), sym = document.querySelector('#a path'); if (!box || !sym) return;
  const cv = box.querySelector('canvas'), ctx = cv.getContext('2d');
  const D = sym.getAttribute('d'), root = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const VW = 880, VH = 520, UNIT = 20, OX = 810, OY = 450;
  const VIOLET = [114, 59, 248], LIME = [207, 248, 57];
  let W = 0, H = 0, dpr = 1, S = 1, cells = [], t0 = performance.now(), wave = { x: OX, y: OY, t: -1e9 };
  let mouse = { x: -999, y: -999 }, amt = 0, target = 0, visible = true, raf = 0;

  const build = () => {
    const r = box.getBoundingClientRect(); if (!r.width) return;
    W = Math.round(r.width); H = Math.round(W * VH / VW); dpr = Math.min(devicePixelRatio || 1, 2); S = W / VW;
    cv.width = W * dpr; cv.height = H * dpr; cv.style.height = H + 'px';
    const m = document.createElement('canvas'); m.width = W; m.height = H;
    const mc = m.getContext('2d', { willReadFrequently: true }); mc.scale(S, S); mc.fill(new Path2D(D));
    const px = mc.getImageData(0, 0, W, H).data, cs = UNIT * S; cells = [];
    for (let y = 0; y + cs <= H + 1; y += cs) for (let x = 0; x + cs <= W + 1; x += cs) {
      const cx = Math.min(W - 1, Math.floor(x + cs / 2)), cy = Math.min(H - 1, Math.floor(y + cs / 2));
      if (px[(cy * W + cx) * 4 + 3] > 128) cells.push({ ph: Math.random() * 6.28, x, y, lx: (x + cs / 2) / S, ly: (y + cs / 2) / S, d: Math.hypot((x + cs / 2) / S - OX, (y + cs / 2) / S - OY) });
    }
  };
  const mix = (g, f) => 'rgb(' + VIOLET.map((v, i) => Math.round((v + (LIME[i] - v) * g) * f)).join(',') + ')';

  const draw = now => {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
    const tt = reduce ? 99 : (now - t0) / 1000, cs = UNIT * S, gap = Math.max(1.5, cs * .16), base = cs - gap;
    const introR = Math.min(1, tt / 2.4) * 1250, wr = (now - wave.t) / 1000 * 620, fade = Math.max(0, 1 - wr / 1350);
    amt += (target - amt) * .12;
    for (const c of cells) {
      const lit = Math.max(0, Math.min(1, (introR - c.d) / 90));
      let g = 0;
      if (lit > .01) {
        const wd = Math.hypot(c.lx - wave.x, c.ly - wave.y);
        g = Math.exp(-(((wd - wr) / 95) ** 2)) * fade;
        if (amt > .01) g = Math.max(g, Math.exp(-((Math.hypot(c.lx - mouse.x, c.ly - mouse.y) / 120) ** 2)) * amt);
      }
      const s = base * (.55 + .45 * lit) + g * cs * .3, o = (cs - s) / 2;
      ctx.fillStyle = lit > .01 ? mix(Math.min(1, g * 1.1), .8 + .2 * Math.sin(tt * 1.4 + c.ph)) : 'rgba(245,244,241,.08)';
      ctx.globalAlpha = lit > .01 ? .55 + .45 * lit : 1;
      ctx.fillRect(c.x + o, c.y + o, s, s);
    }
    ctx.globalAlpha = 1;
    /* הריבוע הלימוני של הלוגו: נושם, ומשם יוצא הדיבור */
    const pulse = 1 + .05 * Math.sin(tt * 2.2), ds = 140 * S * pulse, dc = OX * S, dy = OY * S;
    ctx.fillStyle = 'rgb(207,248,57)'; ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(dc - ds / 2, dy - ds / 2, ds, ds, 14 * S) : ctx.rect(dc - ds / 2, dc * 0 + dy - ds / 2, ds, ds);
    ctx.fill();
    if (!reduce && tt > 2.4 && now - wave.t > 5200) wave = { x: OX, y: OY, t: now };
  };
  const loop = now => { raf = 0; if (!visible) return; if (!root.classList.contains('paused')) draw(now); raf = requestAnimationFrame(loop); };
  const kick = () => { if (!raf && visible && !reduce) raf = requestAnimationFrame(loop); };

  build(); draw(performance.now());
  if (reduce) { new ResizeObserver(() => { build(); draw(performance.now()); }).observe(box); return; }
  new ResizeObserver(() => { build(); }).observe(box);
  new IntersectionObserver(es => { visible = es.some(e => e.isIntersecting); if (visible) kick(); }).observe(box);
  const toLogical = e => { const r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left) / S, y: (e.clientY - r.top) / S }; };
  cv.addEventListener('pointermove', e => { mouse = toLogical(e); target = 1; });
  cv.addEventListener('pointerleave', () => { target = 0; });
  if (window.gsap && matchMedia('(hover:hover) and (pointer:fine)').matches) addEventListener('pointermove', e => { const nx = e.clientX / innerWidth - .5, ny = e.clientY / innerHeight - .5; gsap.to(box, { rotateY: nx * 9, rotateX: ny * -7, transformPerspective: 1000, duration: 1, ease: 'power3.out', overwrite: 'auto' }); }, { passive: true });
  cv.addEventListener('pointerdown', e => { const p = toLogical(e); wave = { x: p.x, y: p.y, t: performance.now() }; mouse = p; target = 1; });
  kick();
})();
