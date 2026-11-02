/* Sara Ankava — v4: מחשבון הדליפה, הטיית כרטיס האודות */
(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover:hover) and (pointer:fine)').matches;
  const g = window.gsap;
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
  const pc = $('.pcard');
  if (pc && fine && !reduce) {
    pc.addEventListener('pointermove', e => { const r = pc.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5; pc.classList.add('is-tilting'); pc.style.transform = 'perspective(900px) rotateY(' + (x * -9) + 'deg) rotateX(' + (y * 9) + 'deg)'; });
    pc.addEventListener('pointerleave', () => { pc.classList.remove('is-tilting'); pc.style.transform = ''; });
  }

  /* פרויקטים: טור אחד פתוח בכל רגע. מעבר עכבר או פוקוס פותחים טור */
  const acc = $('[data-acc-wrap]');
  if (acc) {
    const items = $$('[data-acc]', acc);
    const open = it => items.forEach(x => x.classList.toggle('is-open', x === it));
    items.forEach(it => {
      it.addEventListener('pointerenter', () => { if (matchMedia('(min-width: 901px)').matches) open(it); });
      it.addEventListener('focusin', () => open(it));
    });
  }
})();
