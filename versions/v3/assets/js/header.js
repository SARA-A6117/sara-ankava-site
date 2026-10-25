/* v3: אינדיקטור הרקע בקפסולת ההדר, לפי המקטע הנוכחי */
(() => {
  const nav = document.querySelector('.nav'), ind = document.querySelector('.capsule__ind'); if (!nav || !ind) return;
  const links = [...nav.querySelectorAll('a[data-sec]')];
  const map = { why: 'process', fit: 'process', process: 'process', projects: 'projects', about: 'about', contact: 'contact' };
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
