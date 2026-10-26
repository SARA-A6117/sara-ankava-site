/* v3: אינדיקטור הרקע בקפסולת ההדר, לפי המקטע הנוכחי */
(() => {
  const nav = document.querySelector('.nav'), ind = document.querySelector('.capsule__ind'); if (!nav || !ind) return;
  const links = [...nav.querySelectorAll('a[data-sec]')];
  const map = { why: 'process', leak: 'process', fit: 'process', process: 'process', projects: 'projects', about: 'about', contact: 'contact' };
  const secs = Object.keys(map).map(id => [document.getElementById(id), map[id]]).filter(([e]) => e);
  let cur = null, raf = 0;
  const place = a => {
    if (!a) { ind.style.opacity = 0; return; }
    const n = nav.getBoundingClientRect(), r = a.getBoundingClientRect();
    ind.style.width = r.width + 'px'; ind.style.transform = 'translateX(' + (r.left - n.left - 1) + 'px)'; ind.style.opacity = 1;
  };
  const set = k => { const a = links.find(l => l.dataset.sec === k) || null; links.forEach(l => l.classList.toggle('is-active', l === a)); cur = a; place(a); };
  const pick = () => {
    raf = 0; if (getComputedStyle(ind).display === 'none') return;
    const mid = innerHeight * .4; let k = null;
    for (const [e, key] of secs) { const r = e.getBoundingClientRect(); if (r.top <= mid && r.bottom > mid) { k = key; break; } }
    if (k !== (cur && cur.dataset.sec)) set(k);
  };
  const req = () => { if (!raf) raf = requestAnimationFrame(pick); };
  addEventListener('scroll', req, { passive: true });
  addEventListener('resize', () => { place(cur); req(); });
  document.fonts && document.fonts.ready.then(() => { place(cur); req(); });
  setTimeout(() => { place(cur); req(); }, 1200);
  req();
})();

/* v3: ה-a מדבר. בתוך החור מתחלפות משפטי פה לאוזן, ובסוף ההזמנה לגלול פנימה */
(() => {
  const el = document.querySelector('[data-say]'); if (!el) return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const lines = ['שמעתי עלייך מחברה', 'מי בנתה לך את האתר?', 'תני לי את הטלפון', 'גללו פנימה'];
  let i = 0, timer = null;
  const type = () => {
    const t = lines[i]; el.textContent = ''; el.classList.add('is-typing'); let n = 0;
    const step = () => {
      if (document.hidden) { timer = setTimeout(step, 600); return; }
      el.textContent = t.slice(0, ++n);
      if (n < t.length) timer = setTimeout(step, 55);
      else { el.classList.remove('is-typing'); i = (i + 1) % lines.length; timer = setTimeout(type, i === 0 ? 2800 : 1700); }
    };
    step();
  };
  setTimeout(type, 2600);
})();

/* v3: הצבע של כפתור ההדר נקבע לפי הרקע שמאחוריו (dark / light / lime / violet) */
(() => {
  const hdr = document.querySelector('.hdr'), btn = hdr && hdr.querySelector(':scope > .btn'); if (!btn) return;
  const parse = c => { const m = c.match(/rgba?\(([^)]+)\)/); if (!m) return null; const p = m[1].split(/[ ,\/]+/).filter(Boolean).map(Number); return { r: p[0], g: p[1], b: p[2], a: p[3] === undefined ? 1 : p[3] }; };
  const kind = c => {
    const l = (.2126 * c.r + .7152 * c.g + .0722 * c.b) / 255;
    if (c.r > 170 && c.g > 210 && c.b < 140) return 'lime';
    if (l > .55) return 'light';
    if (c.b > 200 && c.r < 170 && c.g < 120) return 'violet';
    return 'dark';
  };
  let cur = '', raf = 0;
  const sample = () => {
    raf = 0;
    const r = btn.getBoundingClientRect(), x = r.left + r.width / 2, y = Math.min(innerHeight - 2, r.top + r.height / 2);
    let k = 'dark';
    for (const e of document.elementsFromPoint(x, y)) {
      if (hdr.contains(e)) continue;
      if (e.closest('.stage__front')) { k = 'dark'; break; }
      const c = parse(getComputedStyle(e).backgroundColor);
      if (c && c.a > .9) { k = kind(c); break; }
    }
    if (k !== cur) { cur = k; hdr.setAttribute('data-bg', k); }
  };
  const req = () => { if (!raf) raf = requestAnimationFrame(sample); };
  addEventListener('scroll', req, { passive: true }); addEventListener('resize', req);
  setInterval(sample, 350); sample();
})();
