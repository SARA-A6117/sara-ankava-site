/* Sara Ankava — סקריפט משותף לכל העמודים (v3) */

// מספר הוואטסאפ: מחליפים כאן פעם אחת, וכל הקישורים באתר מתעדכנים
const WA_NUMBER = '972533175560';
const WA_TEXT = 'היי שרי, הגעתי מהאתר ואשמח לדבר על העסק שלי.';

(() => {
  const root = document.documentElement;
  root.classList.add('js');
  window.__saReady = true;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover:hover) and (pointer:fine)').matches;
  if (reduce) root.classList.add('reduce');
  // כניסת ההירו: rAF לאנימציה חלקה + טיימר גיבוי, כדי שתוכן לעולם לא יישאר מוסתר (לשונית ברקע וכד')
  requestAnimationFrame(() => requestAnimationFrame(() => root.classList.add('is-ready')));
  setTimeout(() => root.classList.add('is-ready'), 700);
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];

  /* ---- וואטסאפ ---- */
  const waUrl = text => `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(text)}`;
  $$('[data-wa]').forEach(a => { a.href = waUrl(a.dataset.wa || WA_TEXT); a.target = '_blank'; a.rel = 'noopener'; });

  /* ---- טקסט מתגלגל בכפתורים ובקישורי הפוטר ---- */
  $$('.btn, .ftr__col a').forEach(el => {
    const tn = [...el.childNodes].find(n => n.nodeType === 3 && n.textContent.trim());
    if (!tn) return;
    const t = tn.textContent.trim(), r = document.createElement('span'), a = document.createElement('span'), b = document.createElement('span');
    r.className = 'roll'; a.textContent = t; b.textContent = t; b.setAttribute('aria-hidden', 'true');
    r.append(a, b); tn.replaceWith(r, ' ');
  });

  /* ---- Header: מצב גלילה, קפסולה צפה עם אינדיקטור פעיל ופס התקדמות ---- */
  const hdr = $('.hdr'), cap = $('.capsule'), ind = $('.capsule__ind');
  const capLinks = cap ? $$('a', cap) : [];
  // מקטעים שנספרים לכל פריט בקפסולה (למה ובדיקה שייכים ל"איך אני עובדת")
  const track = [['why', 'process'], ['fit', 'process'], ['process', 'process'], ['projects', 'projects'], ['about', 'about'], ['contact', 'contact']]
    .map(([id, k]) => [document.getElementById(id), k]).filter(([e]) => e);
  let activeKey = null, activeLink = null;
  const place = a => {
    if (!ind) return;
    if (!a) { ind.style.opacity = 0; return; }
    ind.style.opacity = 1; ind.style.width = a.offsetWidth + 'px'; ind.style.transform = `translateX(${a.offsetLeft}px)`;
  };
  // עמודים פנימיים: ברירת המחדל של האינדיקטור היא הפריט של העמוד הנוכחי
  const baseLink = cap ? capLinks.find(a => a.getAttribute('aria-current') === 'page') : null;
  const baseKey = baseLink ? baseLink.dataset.sec : null;
  const setActive = key => {
    activeKey = key; activeLink = null;
    capLinks.forEach(a => {
      const on = a.dataset.sec === key;
      a.classList.toggle('is-active', on);
      if (on) { a.setAttribute('aria-current', a === baseLink ? 'page' : 'location'); activeLink = a; }
      else if (a.getAttribute('aria-current') === 'location') a.removeAttribute('aria-current');
    });
    place(activeLink);
  };
  const pick = () => {
    const line = innerHeight * .35; let key = null;
    for (const [el, k] of track) { const r = el.getBoundingClientRect(); if (r.top <= line && r.bottom > line) { key = k; break; } }
    if (key === null && activeKey && track.length && track[0][0].getBoundingClientRect().top <= line) key = activeKey; // בין מקטעים או בפוטר: נשארים
    if (key === null) key = baseKey;
    if (key !== activeKey) setActive(key);
  };
  const staticLink = baseLink;
  pick();
  const onScroll = () => {
    const y = scrollY;
    if (hdr) hdr.classList.toggle('is-scrolled', y > 24);
    if (cap) cap.style.setProperty('--p', Math.min(1, y / Math.max(1, document.documentElement.scrollHeight - innerHeight)).toFixed(4));
    pick();
  };
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', () => { place(activeLink || staticLink); if (innerWidth >= 960 && menu && menu.classList.contains('is-open')) setMenu(false); });
  document.fonts && document.fonts.ready.then(() => place(activeLink || staticLink));

  /* ---- תפריט מסך מלא (מובייל בלבד): פתיחה/סגירה, מלכודת פוקוס, inert לשאר הדף ---- */
  const menu = $('.menu'), menuBtn = $('.menu-btn');
  const setMenu = open => {
    hdr.classList.toggle('is-open', open); menu.classList.toggle('is-open', open);
    menuBtn.setAttribute('aria-expanded', open);
    menuBtn.setAttribute('aria-label', open ? 'סגירת התפריט' : 'פתיחת התפריט');
    document.body.style.overflow = open ? 'hidden' : '';
    $$('main,.ftr,.wa').forEach(e => open ? e.setAttribute('inert', '') : e.removeAttribute('inert'));
    if (window.__lenis) open ? __lenis.stop() : __lenis.start();
    if (open) setTimeout(() => $('.menu__item', menu)?.focus(), 80);
  };
  if (menu && menuBtn) {
    menuBtn.addEventListener('click', () => setMenu(!menu.classList.contains('is-open')));
    $$('a', menu).forEach(a => a.addEventListener('click', () => { if (menu.classList.contains('is-open')) setMenu(false); }));
    addEventListener('keydown', e => {
      if (!menu.classList.contains('is-open')) return;
      if (e.key === 'Escape') { setMenu(false); menuBtn.focus(); }
      if (e.key === 'Tab') {
        const f = [menuBtn, ...$$('a[href]', menu)], i = f.indexOf(document.activeElement);
        if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus(); }
        else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); }
      }
    });
  }

  /* ---- סטטוס חי: שעון ישראל ושעות פעילות (לשנות כאן) ---- */
  const HOURS = { from: 9, to: 18 };   // א׳-ה׳ 9:00-18:00. שישי ושבת סגור
  const tick = () => {
    const p = Object.fromEntries(new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Jerusalem', weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(new Date()).map(x => [x.type, x.value]));
    const h = +p.hour % 24, m = +p.minute, day = p.weekday, t = h + m / 60;
    const open = day !== 'Fri' && day !== 'Sat' && t >= HOURS.from && t < HOURS.to;
    $$('[data-status-wrap]').forEach(w => w.classList.toggle('is-open', open));
    $$('[data-status]').forEach(s => s.textContent = open ? 'זמינה עכשיו לשיחה' : 'מחוץ לשעות הפעילות · חוזרת אליכם תוך 24 שעות');
    $$('[data-clock]').forEach(c => c.textContent = `TLV ${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
  };
  tick(); setInterval(tick, 30000);

  /* ---- חשיפה עמידה: בדיקת מיקום + מעברי ביטחון ---- */
  const items = $$('[data-split],.rv,.scard,[data-fill]'), pending = new Set(items);
  const show = t => { t.classList.add('in'); if (t.hasAttribute('data-split')) t.classList.add('split-in'); t.classList.remove('pre'); pending.delete(t); };
  const check = () => { const lim = innerHeight * .97; pending.forEach(t => { const r = t.getBoundingClientRect(); if (r.top < lim && (r.bottom > 0 || r.height === 0)) show(t); else if (r.bottom <= 0) show(t); }); };
  items.forEach(e => { if (e.classList.contains('rv') && e.getBoundingClientRect().top > innerHeight * .97) e.classList.add('pre'); });
  if (reduce) pending.forEach(show);
  else {
    addEventListener('scroll', check, { passive: true }); addEventListener('resize', check); addEventListener('load', check);
    requestAnimationFrame(check);
    let n = 0; const iv = setInterval(() => { check(); if (++n > 16 || !pending.size) clearInterval(iv); }, 350);
  }

  /* ---- פיצול למילים ---- */
  const splitWords = el => {
    const walk = n => [...n.childNodes].forEach(c => {
      if (c.nodeType === 3 && c.textContent.trim()) {
        const f = document.createDocumentFragment();
        c.textContent.split(/(\s+)/).forEach(w => {
          if (!w) return; if (!w.trim()) return f.append(w);
          const s = document.createElement('span'); s.className = 'w'; s.textContent = w; f.append(s);
        });
        c.replaceWith(f);
      } else if (c.nodeType === 1 && !c.classList.contains('sq') && c.tagName !== 'BR') walk(c);
    });
    walk(el); return $$('.w', el);
  };

  /* ---- בדיקה עצמית ---- */
  const fitItems = $$('.fit__item');
  if (fitItems.length) {
    const n = $('[data-fit-n]'), msg = $('[data-fit-msg]'), bar = $('.fit__bar i');
    const msgs = ['סמנו מה מוכר לכם, ונראה איפה אתם עומדים.', 'יש פה משהו ששווה לבדוק.', 'יש פה משהו ששווה לבדוק.', 'נשמע שהגיע הזמן לשלב הבא.', 'נשמע שהגיע הזמן לשלב הבא.', 'אנחנו צריכים לדבר. ממש.'];
    const update = () => {
      const sel = fitItems.filter(b => b.getAttribute('aria-pressed') === 'true'), k = sel.length;
      n.textContent = k;
      if (!reduce) n.animate([{ transform: 'translateY(70%)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 500, easing: 'cubic-bezier(.22,1,.36,1)' });
      bar.style.setProperty('--w', k / fitItems.length * 100 + '%');
      msg.textContent = msgs[k];
      $$('[name=pains]').forEach(p => p.value = sel.map(b => b.textContent.trim()).join(' · '));
    };
    fitItems.forEach(b => b.addEventListener('click', () => { b.setAttribute('aria-pressed', b.getAttribute('aria-pressed') !== 'true'); update(); }));
  }

  /* ---- טופס במשפט → אישור → וואטסאפ ---- */
  $$('[data-contact]').forEach(box => {
    const form = $('form', box), f = form.elements, err = $('.contact__err', box);
    const valid = {
      name: v => v.trim().length >= 2,
      phone: v => /^(0\d{8,9}|\+?972\d{8,9})$/.test(v.replace(/[\s-]/g, ''))
    };
    const mark = k => { const ok = valid[k](f[k].value); f[k].setAttribute('aria-invalid', !ok); return ok; };
    ['name', 'phone'].forEach(k => f[k].addEventListener('input', () => { if (f[k].getAttribute('aria-invalid') === 'true') mark(k); }));
    form.addEventListener('submit', e => {
      e.preventDefault();
      const okN = mark('name'), okP = mark('phone');
      if (!okN || !okP) {
        err.textContent = !okN && !okP ? 'חסרים לי השם ומספר הטלפון.' : !okN ? 'רק תגידו לי איך קוראים לכם.' : 'המספר לא נראה שלם. כדאי להזין מספר נייד של 10 ספרות.';
        (!okN ? f.name : f.phone).focus(); return;
      }
      err.textContent = '';
      const about = f.about.value.trim(), pains = f.pains ? f.pains.value : '';
      const msg = `היי שרי, אני ${f.name.value.trim()}.` + (about ? `\nיש לי עסק של ${about}.` : '') +
        `\nאפשר לחזור אליי: ${f.phone.value.trim()}` + (pains ? `\nמה שמוכר לי: ${pains}` : '') + '\n(נשלח מהאתר)';
      const send = $('[data-send]', box); send.href = waUrl(msg); send.target = '_blank'; send.rel = 'noopener';
      $('[data-who]', box).textContent = f.name.value.trim().split(' ')[0];
      box.classList.add('is-done'); $('.done', box).focus();
    });
    $('[data-edit]', box)?.addEventListener('click', () => { box.classList.remove('is-done'); f.name.focus(); });
  });

  /* ---- סמן עם תוויות ---- */
  if (fine && !reduce) {
    const c = document.createElement('div'); c.className = 'cursor'; c.setAttribute('aria-hidden', 'true');
    c.innerHTML = '<div class="cursor__dot"><span></span></div>'; document.body.append(c);
    const lbl = $('span', c);
    let x = -100, y = -100, tx = -100, ty = -100;
    addEventListener('pointermove', e => { tx = e.clientX; ty = e.clientY; c.classList.add('is-on'); }, { passive: true });
    document.addEventListener('pointerleave', () => c.classList.remove('is-on'));
    document.addEventListener('pointerover', e => {
      const lab = e.target.closest('[data-cursor]');
      c.classList.toggle('is-label', !!lab); if (lab) lbl.textContent = lab.dataset.cursor;
      c.classList.toggle('is-link', !lab && !!e.target.closest('a,button,input,textarea,label'));
      c.classList.toggle('on-light', !!e.target.closest('.on-light,.on-lime,.scard--3'));
    });
    const loop = () => { x += (tx - x) * .2; y += (ty - y) * .2; c.style.transform = `translate(${x}px,${y}px)`; requestAnimationFrame(loop); };
    loop();
  }

  /* ---- כפתורים מגנטיים ---- */
  if (fine && !reduce) $$('.magnetic').forEach(el => {
    el.style.transition = 'transform .6s cubic-bezier(.22,1,.36,1), color .45s, border-color .45s';
    el.addEventListener('pointermove', e => { const r = el.getBoundingClientRect(); el.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * .22}px,${(e.clientY - r.top - r.height / 2) * .35}px)`; });
    el.addEventListener('pointerleave', () => { el.style.transform = ''; });
  });

  /* ---- כרטיסי פרויקט: הטלפון זז קלות עם העכבר ---- */
  if (fine && !reduce) $$('.case').forEach(card => {
    card.addEventListener('pointermove', e => { const r = card.getBoundingClientRect(); card.style.setProperty('--rx', ((e.clientX - r.left) / r.width - .5) * 2); card.style.setProperty('--ry', ((e.clientY - r.top) / r.height - .5) * 2); });
    card.addEventListener('pointerleave', () => { card.style.setProperty('--rx', 0); card.style.setProperty('--ry', 0); });
  });

  /* ---- עצירת אנימציות לבקשת המשתמש (WCAG 2.2.2) ---- */
  let paused = false; try { paused = localStorage.getItem('sa-paused') === '1'; } catch (e) {}
  const setPaused = p => {
    paused = p; root.classList.toggle('paused', p);
    $$('[data-motion-toggle]').forEach(b => { b.setAttribute('aria-pressed', p); b.textContent = p ? 'הפעלת אנימציות' : 'עצירת אנימציות'; });
    try { localStorage.setItem('sa-paused', p ? '1' : '0'); } catch (e) {}
  };
  setPaused(paused);
  $$('[data-motion-toggle]').forEach(b => b.addEventListener('click', () => setPaused(!paused)));

  $$('[data-year]').forEach(e => e.textContent = new Date().getFullYear());

  /* =========================================================
     ויז'ואל ההירו: משפך נקודות עם "דליפה" שנסגרת
     מבקרים (נקודות) זורמים מלמעלה. במקום אחד בדופן יש פתח שדרכו חלק נושרים,
     והמספר מחושב מהסימולציה עצמה. עכבר על הוויז'ואל או גלילה סוגרים את הדליפה.
     ========================================================= */
  const funnel = $('[data-funnel]');
  if (funnel) {
    const cv = $('canvas', funnel), ctx = cv.getContext('2d'), tag = $('.leakviz__tag', funnel);
    const tagN = $('[data-leak]', funnel), tagT = $('[data-leak-text]', funnel), hint = $('.leakviz__hint', funnel);
    const PAPER = '245,244,241', LIME = '207,248,57', LEAK_P = .38, TL = .56, BASE_GAP = .075;
    let W = 0, H = 0, y0 = 0, y1 = 0, cx = 0, hw0 = 0, hw1 = 6;
    let parts = [], acc = 0, closed = 0, hover = false, forced = false, pLeak = LEAK_P, last = 0, running = false, tagAt = 0;
    const hw = t => hw1 + (hw0 - hw1) * Math.pow(1 - t, 1.6);
    const pos = t => ({ y: y0 + t * (y1 - y0), h: hw(t) });
    const size = () => {
      const r = cv.getBoundingClientRect(); W = r.width; H = r.height;
      const dpr = Math.min(devicePixelRatio || 1, 2);
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      y0 = 14; y1 = H - 6; cx = W * .56; hw0 = W * .34;
    };
    const spawn = () => parts.push({ u0: Math.random() * 1.7 - .85, u: 0, t: 0, v: .16 + Math.random() * .05, leaker: Math.random() < LEAK_P, th: Math.random(), state: 0, decided: false, counted: false, x: 0, y: 0, vx: 0, vy: 0, life: 0, dead: false });
    const record = leak => { pLeak = pLeak * .92 + (leak ? .08 : 0); };
    const step = (dt, auto) => {
      acc += dt; while (acc > .11) { acc -= .11; spawn(); const p = parts[parts.length - 1]; p.u = p.u0; }
      const sc = auto ? 0 : Math.min(1, Math.max(0, scrollY / (innerHeight * .45)));
      const target = auto ? 0 : Math.max((hover || forced) ? 1 : 0, sc);
      closed += (target - closed) * Math.min(1, dt * (target > closed ? 3 : .7));
      for (const p of parts) {
        if (p.state === 0) {
          p.t += p.v * dt;
          const will = p.leaker && p.th > closed;
          p.u += ((will && p.t > .22 ? -.97 : p.u0) - p.u) * Math.min(1, dt * 2.2);
          if (!p.decided && p.t >= TL) {
            p.decided = true;
            if (will) { p.state = 1; const q = pos(p.t); p.x = cx + p.u * q.h; p.y = q.y; p.vx = -(55 + Math.random() * 60); p.vy = 15 + Math.random() * 50; record(true); }
          }
          if (p.state === 0 && !p.counted && p.t > .7) { p.counted = true; record(false); }
          if (p.t >= 1) p.dead = true;
        } else {
          p.life += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 140 * dt; p.vx *= 1 - dt * .4;
          if (p.life > 1.6) p.dead = true;
        }
      }
      parts = parts.filter(p => !p.dead);
    };
    const wall = (side, gap) => {
      const segs = side < 0 ? [[0, TL - gap], [TL + gap, 1]] : [[0, 1]];
      ctx.beginPath();
      for (const [a, b] of segs) { if (b <= a) continue; for (let i = 0; i <= 44; i++) { const t = a + (b - a) * i / 44, q = pos(t), x = cx + side * q.h; i ? ctx.lineTo(x, q.y) : ctx.moveTo(x, q.y); } }
      ctx.stroke();
    };
    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      const gap = BASE_GAP * (1 - closed);
      ctx.lineWidth = 1.2; ctx.strokeStyle = `rgba(${PAPER},.34)`; wall(-1, gap); wall(1, 0);
      const g = pos(TL), gx = cx - g.h;
      if (gap > .006) {
        ctx.fillStyle = `rgb(${LIME})`;
        for (const t of [TL - gap, TL + gap]) { const q = pos(t); ctx.fillRect(cx - q.h - 2.5, q.y - 2.5, 5, 5); }
        ctx.strokeStyle = `rgba(${LIME},.5)`; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(gx - 10, g.y); ctx.lineTo(tag.offsetWidth + 14, g.y); ctx.stroke();
      }
      for (const p of parts) {
        if (p.state === 0) {
          const q = pos(p.t), a = Math.min(1, p.t / .05) * Math.min(1, (1 - p.t) / .06);
          ctx.fillStyle = `rgba(${PAPER},${(.9 * a).toFixed(3)})`; ctx.beginPath(); ctx.arc(cx + p.u * q.h * .9, q.y, 2.1, 0, 6.2832); ctx.fill();
        } else {
          ctx.fillStyle = `rgba(${LIME},${Math.max(0, 1 - p.life / 1.6).toFixed(3)})`; ctx.beginPath(); ctx.arc(p.x, p.y, 2.3, 0, 6.2832); ctx.fill();
        }
      }
      tag.style.top = (g.y - tag.offsetHeight / 2) + 'px';
    };
    const updTag = now => {
      if (now - tagAt < 140) return; tagAt = now;
      const pct = Math.round(pLeak * 100), isClosed = closed > .9 && pct <= 2;
      tagN.textContent = pct < 1 ? '0%' : '−' + pct + '%';
      tagT.textContent = isClosed ? 'הדליפה נסגרה' : 'נושרים כאן';
      tag.classList.toggle('is-closed', isClosed);
    };
    const loop = now => {
      if (!running) return;
      const dt = Math.min(.05, (now - last) / 1000 || 0); last = now;
      if (!paused) step(dt, false);
      draw(); updTag(now); requestAnimationFrame(loop);
    };
    const start = () => { if (running || reduce) return; running = true; last = performance.now(); requestAnimationFrame(loop); };
    size();
    window.__leakviz = { run: (sec, h) => { hover = h; for (let i = 0; i < sec * 20; i++) step(.05, false); draw(); tagAt = -1e9; updTag(performance.now()); tagAt = 0; return { closed: +closed.toFixed(2), pLeak: +pLeak.toFixed(3), tag: tagN.textContent + ' | ' + tagT.textContent }; } };   // וו בדיקה (דטרמיניסטי)
    for (let i = 0; i < 150; i++) step(.05, true);   // חימום: הוויז'ואל מגיע מאוכלס
    draw(); updTag(1e9);
    if (hint) hint.textContent = reduce ? 'המחשה: איפה מבקרים נושרים' : (fine ? 'המחשה · העבירו עכבר כדי לסגור את הדליפה' : 'המחשה · הקישו כדי לסגור את הדליפה');
    addEventListener('resize', () => { size(); draw(); });
    if (!reduce) {
      new IntersectionObserver(es => es.forEach(e => e.isIntersecting ? start() : (running = false))).observe(funnel);
      funnel.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') hover = true; });
      funnel.addEventListener('pointerleave', () => { hover = false; });
      funnel.addEventListener('pointerdown', e => { if (e.pointerType !== 'mouse') forced = !forced; });
    }
  }

  /* =========================================================
     תנועת גלילה (GSAP + Lenis)
     ========================================================= */
  if (reduce || !window.gsap || !window.ScrollTrigger) return;
  gsap.registerPlugin(ScrollTrigger);
  root.classList.add('motion');

  if (window.Lenis) {
    const lenis = new Lenis({ lerp: .1 });
    window.__lenis = lenis;
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(t => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    $$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
      const id = a.getAttribute('href'); if (id.length < 2) return;
      const t = document.querySelector(id); if (!t) return;
      e.preventDefault(); lenis.scrollTo(t, { offset: -40, duration: 1.3 }); history.replaceState(null, '', id);
      if (!t.hasAttribute('tabindex')) t.setAttribute('tabindex', '-1'); t.focus({ preventScroll: true });
    }));
  }

  const mm = gsap.matchMedia();

  /* ---- תהליך: הכרטיס הקודם מתכווץ כשהבא עולה עליו ---- */
  mm.add('(min-width: 901px)', () => {
    const cards = $$('.scard');
    cards.forEach((c, i) => {
      if (i === cards.length - 1) return;
      gsap.fromTo(c, { scale: 1, '--dim': 0 }, { scale: .9, '--dim': .45, ease: 'none',
        scrollTrigger: { trigger: cards[i + 1], start: 'top bottom', end: () => 'top ' + (92 + (i + 1) * 22) + 'px', scrub: true } });
    });
  });

  /* ---- אודות: המילים מתמלאות שורה אחרי שורה ---- */
  $$('[data-fill]').forEach(el => {
    splitWords(el);
    $$('.ln', el).forEach(ln => gsap.to($$('.w', ln), { opacity: 1, duration: .2, stagger: { amount: .6 }, ease: 'none', scrollTrigger: { trigger: ln, start: 'top 92%', end: 'top 64%', scrub: true } }));
  });

  /* ---- מספרים מודגשים: ספירה עולה כשמגיעים אליהם ---- */
  $$('[data-count]').forEach(el => {
    const end = +el.dataset.count, o = { v: 0 };
    ScrollTrigger.create({ trigger: el, start: 'top 92%', once: true, onEnter: () => gsap.to(o, { v: end, duration: 1.4, ease: 'power2.out', onUpdate: () => { el.textContent = Math.round(o.v); } }) });
  });

  /* ---- מרקי "בואו נדבר": מהירות וכיוון לפי הגלילה ---- */
  const mq = $('.bigmq__track');
  if (mq) {
    let x = 0, v = 0, dir = 1;
    ScrollTrigger.create({ trigger: '.bigmq', start: 'top bottom', end: 'bottom top', onUpdate: s => { v = Math.min(14, Math.abs(s.getVelocity()) / 220); dir = s.direction; } });
    gsap.ticker.add(() => {
      const half = mq.scrollWidth / 2; if (!half) return;
      if (paused) return;
      x -= (1.1 + v) * dir; v *= .93;
      if (x <= -half) x += half; if (x > 0) x -= half;
      mq.style.transform = `translate3d(${x}px,0,0)`;
    });
  }

  /* ---- כרטיסי פרויקט: החלון נכנס בפרספקטיבה ומתיישר ---- */
  $$('.case__media .mk__win').forEach(w => gsap.fromTo(w, { y: 40, rotateX: 9, transformPerspective: 1200 }, { y: 0, rotateX: 0, ease: 'none', scrollTrigger: { trigger: w, start: 'top 98%', end: 'top 55%', scrub: true } }));

  /* ---- איורים בעמוד פרויקט, מוקאפים ---- */
  $$('.case-hero__media .mk, .screen__media .mk').forEach(m => gsap.fromTo(m, { y: 60, rotate: -1.5 }, { y: -20, rotate: 0, ease: 'none', scrollTrigger: { trigger: m, start: 'top bottom', end: 'bottom top', scrub: true } }));

  document.fonts && document.fonts.ready.then(() => ScrollTrigger.refresh());
})();
