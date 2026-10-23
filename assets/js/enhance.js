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
