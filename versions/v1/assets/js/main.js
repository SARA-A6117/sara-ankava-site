/* Sara Ankava — סקריפט משותף לכל העמודים */

// מספר הוואטסאפ: מחליפים כאן פעם אחת, וכל הקישורים באתר מתעדכנים
const WA_NUMBER = '972500000000';
const WA_TEXT = 'היי שרי, הגעתי מהאתר ואשמח לדבר על העסק שלי.';

(() => {
  const root = document.documentElement;
  root.classList.add('js');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover:hover) and (pointer:fine)').matches;

  /* ---- וואטסאפ ---- */
  const waUrl = text => `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(text)}`;
  document.querySelectorAll('[data-wa]').forEach(a => {
    a.href = waUrl(a.dataset.wa || WA_TEXT);
    a.target = '_blank'; a.rel = 'noopener';
  });

  /* ---- Header ---- */
  const hdr = document.querySelector('.hdr');
  const onScroll = () => hdr && hdr.classList.toggle('is-scrolled', scrollY > 24);
  addEventListener('scroll', onScroll, { passive: true }); onScroll();
  const menuBtn = document.querySelector('.menu-btn');
  const setMenu = open => {
    hdr.classList.toggle('is-open', open);
    menuBtn.setAttribute('aria-expanded', open);
    menuBtn.setAttribute('aria-label', open ? 'סגירת התפריט' : 'פתיחת התפריט');
    document.body.style.overflow = open ? 'hidden' : '';
  };
  if (menuBtn) {
    menuBtn.addEventListener('click', () => setMenu(!hdr.classList.contains('is-open')));
    hdr.querySelectorAll('.nav a').forEach(a => a.addEventListener('click', () => setMenu(false)));
    addEventListener('keydown', e => { if (e.key === 'Escape' && hdr.classList.contains('is-open')) { setMenu(false); menuBtn.focus(); } });
  }

  /* ---- חשיפה עמידה: בדיקת מיקום + מעברי ביטחון (לא IntersectionObserver) ---- */
  const items = [...document.querySelectorAll('[data-split],.rv')], pending = new Set(items);
  const show = t => { t.classList.add('in'); if (t.hasAttribute('data-split')) t.classList.add('split-in'); t.classList.remove('pre'); pending.delete(t); };
  const check = () => { const lim = innerHeight * .92; pending.forEach(t => { if (t.getBoundingClientRect().top < lim) show(t); }); };
  items.forEach(e => { if (e.classList.contains('rv') && e.getBoundingClientRect().top > innerHeight * .92) e.classList.add('pre'); });
  if (reduce) pending.forEach(show);
  else {
    addEventListener('scroll', check, { passive: true }); addEventListener('resize', check); addEventListener('load', check);
    requestAnimationFrame(check);
    let n = 0; const iv = setInterval(() => { check(); if (++n > 14 || !pending.size) clearInterval(iv); }, 350);
  }

  /* ---- טופס יצירת קשר → אישור → וואטסאפ ---- */
  document.querySelectorAll('[data-contact]').forEach(box => {
    const form = box.querySelector('form');
    const fields = { name: form.elements.name, phone: form.elements.phone, about: form.elements.about };
    const valid = {
      name: v => v.trim().length >= 2,
      phone: v => /^0\d{1,2}-?\d{3}-?\d{4}$|^\+?972-?\d{1,2}-?\d{3}-?\d{4}$/.test(v.replace(/\s/g, ''))
    };
    const mark = (k) => { const ok = valid[k](fields[k].value); fields[k].closest('.field').classList.toggle('invalid', !ok); fields[k].setAttribute('aria-invalid', !ok); return ok; };
    ['name', 'phone'].forEach(k => fields[k].addEventListener('blur', () => fields[k].value && mark(k)));
    form.addEventListener('submit', e => {
      e.preventDefault();
      const okName = mark('name'), okPhone = mark('phone');
      if (!okName) return fields.name.focus();
      if (!okPhone) return fields.phone.focus();
      const msg = `היי שרי, אני ${fields.name.value.trim()}.\nטלפון: ${fields.phone.value.trim()}` +
        (fields.about.value.trim() ? `\nעל העסק: ${fields.about.value.trim()}` : '') + '\n(נשלח מהאתר)';
      const send = box.querySelector('[data-send]');
      send.href = waUrl(msg); send.target = '_blank'; send.rel = 'noopener';
      box.querySelector('[data-who]').textContent = fields.name.value.trim().split(' ')[0];
      box.classList.add('is-done');
      box.querySelector('.done').focus();
    });
    box.querySelector('[data-edit]')?.addEventListener('click', () => { box.classList.remove('is-done'); fields.name.focus(); });
  });

  /* ---- סמן: הנקודה המרובעת מהלוגו ---- */
  if (fine && !reduce) {
    const c = document.createElement('div'); c.className = 'cursor'; c.setAttribute('aria-hidden', 'true'); document.body.append(c);
    let x = -50, y = -50, tx = -50, ty = -50;
    addEventListener('pointermove', e => { tx = e.clientX; ty = e.clientY; c.classList.add('is-on'); }, { passive: true });
    document.addEventListener('pointerleave', () => c.classList.remove('is-on'));
    document.addEventListener('pointerover', e => {
      c.classList.toggle('is-link', !!e.target.closest('a,button,input,textarea,label'));
      document.body.classList.toggle('on-light-cursor', !!e.target.closest('.on-light,.contact__form'));
    });
    const loop = () => { x += (tx - x) * .22; y += (ty - y) * .22; c.style.transform = `translate(${x}px,${y}px)`; requestAnimationFrame(loop); };
    loop();
  }

  /* ---- שנה בפוטר ---- */
  document.querySelectorAll('[data-year]').forEach(e => e.textContent = new Date().getFullYear());

  /* ---- תנועה (GSAP + Lenis), רק אם נטענו ואין העדפה לתנועה מופחתת ---- */
  if (reduce || !window.gsap) return;
  gsap.registerPlugin(ScrollTrigger);
  if (window.Lenis) {
    const lenis = new Lenis({ lerp: .1 });
    window.__lenis = lenis;
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(t => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    document.querySelectorAll('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
      const id = a.getAttribute('href'); if (id.length < 2) return;
      const t = document.querySelector(id); if (!t) return;
      e.preventDefault(); lenis.scrollTo(t, { offset: -76 }); history.replaceState(null, '', id);
    }));
  }

  // hero: הד ה-a נע עם העכבר (שכבות בעומק שונה)
  const art = document.querySelector('.hero__art');
  if (art && fine) {
    const layers = [...art.querySelectorAll('[data-depth]')];
    addEventListener('pointermove', e => {
      const nx = e.clientX / innerWidth - .5, ny = e.clientY / innerHeight - .5;
      layers.forEach(l => gsap.to(l, { x: nx * l.dataset.depth, y: ny * l.dataset.depth, duration: 1.2, ease: 'power3.out' }));
    }, { passive: true });
  }
  if (art) gsap.to(art, { yPercent: 14, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });

  // תהליך: הנקודה נוסעת על הקו בין שלושת השלבים
  const track = document.querySelector('.track');
  if (track) {
    gsap.fromTo(track, { '--p': '0%', '--r': '0deg' }, { '--p': '100%', '--r': '360deg', ease: 'none',
      scrollTrigger: { trigger: '.steps', start: 'top 85%', end: 'bottom 55%', scrub: .6 } });
  }

  // מוקאפים: נכנסים בפרספקטיבה ומתיישרים בגלילה
  gsap.utils.toArray('.proj .mock__win').forEach(w => {
    gsap.fromTo(w, { rotateX: 16, y: 40 }, { rotateX: 0, y: 0, ease: 'none',
      scrollTrigger: { trigger: w, start: 'top 95%', end: 'top 45%', scrub: true } });
  });
  gsap.utils.toArray('.proj .mock__phone').forEach(p => {
    gsap.fromTo(p, { yPercent: 18 }, { yPercent: -6, ease: 'none', scrollTrigger: { trigger: p, start: 'top bottom', end: 'bottom top', scrub: true } });
  });
  // מספרי רפאים זזים לאט יותר
  gsap.utils.toArray('.proj__ghost').forEach(g => {
    gsap.fromTo(g, { yPercent: 30 }, { yPercent: -30, ease: 'none', scrollTrigger: { trigger: g.closest('.proj'), start: 'top bottom', end: 'bottom top', scrub: true } });
  });

  // אודות: הד ה-a מסתובב קלות סביב התמונה
  const echo = document.querySelector('.about__echo');
  if (echo) gsap.fromTo(echo, { rotate: -10, y: 60 }, { rotate: 6, y: -30, ease: 'none',
    scrollTrigger: { trigger: '.about', start: 'top bottom', end: 'bottom top', scrub: true } });

  // פוטר: ה-a הגדול עולה מהתחתית
  const mark = document.querySelector('.ftr__mark');
  if (mark) gsap.fromTo(mark, { yPercent: 30 }, { yPercent: 0, ease: 'none',
    scrollTrigger: { trigger: '.ftr', start: 'top bottom', end: 'bottom bottom', scrub: true } });
})();
