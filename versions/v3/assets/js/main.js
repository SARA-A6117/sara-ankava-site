/* Sara Ankava — סקריפט משותף לכל העמודים (v2) */

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
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];

  /* ---- וואטסאפ ---- */
  const waUrl = text => `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(text)}`;
  $$('[data-wa]').forEach(a => { a.href = waUrl(a.dataset.wa || WA_TEXT); a.target = '_blank'; a.rel = 'noopener'; });

  /* ---- טקסט מתגלגל בכפתורים ובקישורים ---- */
  $$('.btn__t, .nav a:not(.btn), .ftr__col a').forEach(el => {
    const tn = [...el.childNodes].find(n => n.nodeType === 3 && n.textContent.trim());
    if (!tn) return;
    const t = tn.textContent.trim(), r = document.createElement('span'), a = document.createElement('span'), b = document.createElement('span');
    r.className = 'roll'; a.textContent = t; b.textContent = t; b.setAttribute('aria-hidden', 'true');
    r.append(a, b); tn.replaceWith(r, ' ');
  });

  /* ---- מסך פתיחה ---- */
  const intro = $('.intro');
  const endIntro = () => { root.classList.add('intro-done'); if (intro && intro.isConnected) { intro.classList.add('is-out'); setTimeout(() => intro.remove(), 1000); } };
  if (intro) {
    let seen = null; try { seen = sessionStorage.getItem('sa-intro'); } catch (e) {}
    if (reduce || seen) { intro.remove(); root.classList.add('intro-done'); }
    else {
      try { sessionStorage.setItem('sa-intro', '1'); } catch (e) {}
      const c = $('.intro__count', intro), t0 = performance.now();
      const tick = now => { const p = Math.min(1, (now - t0) / 1400); c.textContent = String(Math.round(p * 100)).padStart(2, '0'); p < 1 ? requestAnimationFrame(tick) : setTimeout(endIntro, 150); };
      requestAnimationFrame(tick);
      setTimeout(() => { if (!root.classList.contains('intro-done')) endIntro(); }, 3200);
    }
  } else root.classList.add('intro-done');

  /* ---- Header חכם + פס התקדמות ---- */
  const hdr = $('.hdr'), prog = $('.progress');
  let lastY = scrollY;
  const onScroll = () => {
    const y = scrollY;
    if (hdr) {
      hdr.classList.toggle('is-scrolled', y > 24);
      if (y > lastY + 6 && y > 400) hdr.classList.add('is-hidden');
      else if (y < lastY - 6) hdr.classList.remove('is-hidden');
    }
    if (prog) prog.style.setProperty('--p', Math.min(1, y / Math.max(1, document.documentElement.scrollHeight - innerHeight)));
    lastY = y;
  };
  addEventListener('scroll', onScroll, { passive: true }); onScroll();
  const menuBtn = $('.menu-btn');
  const setMenu = open => {
    hdr.classList.toggle('is-open', open);
    menuBtn.setAttribute('aria-expanded', open);
    menuBtn.setAttribute('aria-label', open ? 'סגירת התפריט' : 'פתיחת התפריט');
    document.body.style.overflow = open ? 'hidden' : '';
    if (open) setTimeout(() => $('.nav a', hdr)?.focus(), 50);
  };
  if (menuBtn) {
    menuBtn.addEventListener('click', () => setMenu(!hdr.classList.contains('is-open')));
    $$('.nav a', hdr).forEach(a => a.addEventListener('click', () => setMenu(false)));
    addEventListener('keydown', e => { if (e.key === 'Escape' && hdr.classList.contains('is-open')) { setMenu(false); menuBtn.focus(); } });
  }

  /* ---- חשיפה עמידה: בדיקת מיקום + מעברי ביטחון ---- */
  const items = $$('[data-split],.rv,.scard'), pending = new Set(items);
  const show = t => { t.classList.add('in'); if (t.hasAttribute('data-split')) t.classList.add('split-in'); t.classList.remove('pre'); pending.delete(t); };
  const check = () => { const lim = innerHeight * .9; pending.forEach(t => { const r = t.getBoundingClientRect(); if (r.top < lim && (r.bottom > 0 || r.height === 0)) show(t); else if (r.bottom <= 0) show(t); }); };
  items.forEach(e => { if (e.classList.contains('rv') && e.getBoundingClientRect().top > innerHeight * .9) e.classList.add('pre'); });
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
        err.textContent = !okN && !okP ? 'חסרים לי השם ומספר הטלפון.' : !okN ? 'רק תגידו לי איך קוראים לכם.' : 'נראה שחסרה ספרה במספר. פורמט: 050-0000000.';
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
      c.classList.toggle('on-light', !!e.target.closest('.on-light,.on-lime,.fit,.process,.projects,.scard--3'));
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

  /* ---- פרויקטים: תצוגה צפה שעוקבת אחרי העכבר ---- */
  const pv = $('.preview');
  if (pv && fine && !reduce) {
    let x = innerWidth / 2, y = innerHeight / 2, tx = x, ty = y;
    $$('[data-preview]').forEach(r => {
      r.addEventListener('pointerenter', () => { $$('.preview__item', pv).forEach(i => i.classList.toggle('on', i.dataset.id === r.dataset.preview)); pv.classList.add('on'); });
      r.addEventListener('pointerleave', () => pv.classList.remove('on'));
    });
    addEventListener('pointermove', e => { tx = e.clientX; ty = e.clientY; }, { passive: true });
    const loop = () => { const nx = x + (tx - x) * .13, vx = nx - x; x = nx; y += (ty - y) * .13; pv.style.transform = `translate(${x}px,${y}px) rotate(${Math.max(-14, Math.min(14, vx * .5))}deg)`; requestAnimationFrame(loop); };
    loop();
  }

  /* ---- עצירת אנימציות לבקשת המשתמש ---- */
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
      e.preventDefault(); lenis.scrollTo(t, { offset: -60, duration: 1.4 }); history.replaceState(null, '', id);
      if (!t.hasAttribute('tabindex')) t.setAttribute('tabindex', '-1'); t.focus({ preventScroll: true });
    }));
  }

  /* ---- Hero: גוללים לתוך החור של ה-a ---- */
  const stage = $('.stage');
  if (stage) {
    const svg = $('.stage__svg');
    let geo;
    const fitStage = () => {
      const W = innerWidth, H = innerHeight, mob = W < 900;
      if (W < 50 || H < 50) return;
      const aw = mob ? W * .62 : Math.min(W * (W < 1200 ? .29 : .33), 620), s = aw / 700;
      const cx = mob ? W * .36 : W * (W < 1200 ? .17 : .2), cy = mob ? 76 + aw * .5 + 10 : H * .6;
      svg.setAttribute('viewBox', `${470 - cx / s} ${500 - cy / s} ${W / s} ${H / s}`);
      svg.setAttribute('preserveAspectRatio', 'none');
      geo = { W, H, s, cx, cy };
      stage.style.setProperty('--hx', (cx - 8 * s) + 'px'); stage.style.setProperty('--hy', (cy + 2 * s) + 'px'); stage.style.setProperty('--hs', s);
    };
    fitStage();
    const kScale = () => {
      if (!geo) return 1;
      const { W, H, s, cx, cy } = geo, hx = cx - 8 * s, hy = cy + 2 * s;
      const dx = Math.max(hx, W - hx) / s, dy = Math.max(hy, H - hy) / s;
      return Math.sqrt((dx / 160) ** 2 + (dy / 86) ** 2) * 1.1;
    };
    ScrollTrigger.addEventListener('refreshInit', fitStage);
    const zoomEl = $('.zoom'), zs = { s: 1 };
    const applyZoom = () => zoomEl.setAttribute('transform', `translate(${462 * (1 - zs.s)} ${502 * (1 - zs.s)}) scale(${zs.s})`);
    const words = splitWords($('.manifesto__title'));
    const tl = gsap.timeline({ scrollTrigger: { trigger: stage, start: 'top top', end: () => '+=' + innerHeight * 1.9, pin: true, scrub: 1, invalidateOnRefresh: true } });
    tl.to('.peek', { autoAlpha: 0, scale: 1.4, duration: .08 }, 0)
      .to('.stage__text, .stage__frame', { autoAlpha: 0, y: -70, duration: .2, ease: 'power1.in' }, 0)
      .to(zs, { s: () => kScale(), duration: .56, ease: 'expo.in', onUpdate: applyZoom }, .04)
      .fromTo('.manifesto', { scale: .8, y: 50 }, { scale: 1, y: 0, duration: .6, ease: 'power2.out' }, .06)
      .set('.stage__front', { autoAlpha: 0 }, .62)
      .to(words, { opacity: 1, stagger: .035, duration: .1, ease: 'none' }, .62)
      .fromTo('.manifesto__sub span', { y: 24, autoAlpha: 0 }, { y: 0, autoAlpha: 1, stagger: .04, duration: .12 }, .82)
      .to({}, { duration: .1 });

    if (fine) {
      const layers = $$('[data-depth]', svg);
      addEventListener('pointermove', e => {
        const nx = e.clientX / innerWidth - .5, ny = e.clientY / innerHeight - .5;
        layers.forEach(l => gsap.to(l, { x: nx * l.dataset.depth * 2, y: ny * l.dataset.depth * 2, duration: 1.2, ease: 'power3.out' }));
      }, { passive: true });
    }
  }

  const mm = gsap.matchMedia();

  /* ---- למה: גלילת אזורים. כל גלילה מכניסה אזור שלם מלמטה ---- */
  const why = $('.why');
  if (why) mm.add('(min-width: 901px)', () => {
    why.classList.add('why--v');
    const track = $('.why__track', why), panels = $$('.panel', track), dots = $$('.why__dots i', why), n = panels.length;
    gsap.set(panels.slice(1), { yPercent: 100 });
    panels[0].classList.add('is-active');
    const tl = gsap.timeline({ scrollTrigger: {
      trigger: why, start: 'top top', end: () => '+=' + innerHeight * (n - 1) * 1.05, pin: true, scrub: .5, invalidateOnRefresh: true,
      snap: { snapTo: 1 / (n - 1), duration: { min: .25, max: .7 }, delay: .04, ease: 'power2.inOut' },
      onUpdate: self => { const i = Math.round(self.progress * (n - 1)); panels.forEach((p, k) => p.classList.toggle('is-active', k === i)); dots.forEach((d, k) => d.classList.toggle('on', k === i)); }
    } });
    panels.slice(1).forEach((p, i) => {
      tl.to(p, { yPercent: 0, ease: 'none', duration: 1 }, i);
      tl.to(panels[i], { scale: .94, opacity: .35, ease: 'none', duration: 1 }, i);
    });
    return () => { why.classList.remove('why--v'); gsap.set(panels, { clearProps: 'all' }); panels.forEach(p => p.classList.remove('is-active')); };
  });

  /* ---- תהליך: הכרטיס הקודם מתכווץ כשהבא עולה עליו ---- */
  mm.add('(min-width: 901px)', () => {
    const cards = $$('.scard');
    cards.forEach((c, i) => {
      if (i === cards.length - 1) return;
      gsap.fromTo(c, { scale: 1, '--dim': 0 }, { scale: .9, '--dim': .45, ease: 'none',
        scrollTrigger: { trigger: cards[i + 1], start: 'top bottom', end: () => 'top ' + (92 + (i + 1) * 22) + 'px', scrub: true } });
    });
  });

  /* ---- אודות: התמונה נפתחת, המילים מתמלאות ---- */
  const photo = $('.photo');
  if (photo) gsap.fromTo(photo, { clipPath: 'inset(18% 22% 18% 22% round 200px)' }, { clipPath: 'inset(0% 0% 0% 0% round 28px)', ease: 'none',
    scrollTrigger: { trigger: '.about', start: 'top 85%', end: 'top 10%', scrub: true } });
  $$('[data-fill]').forEach(el => {
    const ws = splitWords(el);
    gsap.to(ws, { opacity: 1, stagger: .1, ease: 'none', scrollTrigger: { trigger: el, start: 'top 82%', end: 'bottom 45%', scrub: true } });
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

  /* ---- איורים בעמוד פרויקט, מוקאפים ---- */
  $$('.case-hero__media .mock, .screen__media .mock').forEach(m => gsap.fromTo(m, { y: 60, rotate: -1.5 }, { y: -20, rotate: 0, ease: 'none', scrollTrigger: { trigger: m, start: 'top bottom', end: 'bottom top', scrub: true } }));

  document.fonts && document.fonts.ready.then(() => ScrollTrigger.refresh());
})();
