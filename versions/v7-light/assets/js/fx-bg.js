/* Sara Ankava — v4: רקע דיגיטלי עדין לאורך כל האתר.
   אבק ליים שמרחף לאט, ומדי פעם "מטאור" דק עם זנב זוהר. שכבה אחת קבועה, במצב screen, בלי לחיצות.
   עם prefers-reduced-motion לא מוצג כלום. */
(() => {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const cv = document.createElement('canvas'); cv.className = 'fxbg'; cv.setAttribute('aria-hidden', 'true');
  document.body.prepend(cv);
  const ctx = cv.getContext('2d'), root = document.documentElement;
  let W = 0, H = 0, dpr = 1, dust = [], meteors = [], next = 0, raf = 0;
  const size = () => {
    dpr = Math.min(devicePixelRatio || 1, 2); W = innerWidth; H = innerHeight;
    cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const n = Math.round(W * H / 26000);
    dust = Array.from({ length: n }, () => ({ x: Math.random() * W, y: Math.random() * H, s: Math.random() < .2 ? 2 : 1, v: .06 + Math.random() * .18, a: .08 + Math.random() * .22, p: Math.random() * 6.28 }));
  };
  size(); addEventListener('resize', size);
  const meteor = () => {
    const fromTop = Math.random() < .6;
    meteors.push({ x: fromTop ? W * (.35 + Math.random() * .7) : W + 20, y: fromTop ? -20 : H * Math.random() * .5, vx: -(2.2 + Math.random() * 2.6), vy: 1.6 + Math.random() * 1.6, life: 0, len: 90 + Math.random() * 120 });
  };
  const frame = t => {
    raf = requestAnimationFrame(frame);
    if (document.hidden || root.classList.contains('paused')) return;
    ctx.clearRect(0, 0, W, H);
    for (const d of dust) {
      d.y -= d.v; d.x += Math.sin(t / 2400 + d.p) * .12;
      if (d.y < -4) { d.y = H + 4; d.x = Math.random() * W; }
      ctx.fillStyle = `rgba(198,255,52,${d.a * (.6 + .4 * Math.sin(t / 900 + d.p))})`;
      ctx.fillRect(d.x, d.y, d.s, d.s);
    }
    if (t > next) { meteor(); next = t + 2600 + Math.random() * 4200; }
    meteors = meteors.filter(m => m.life < 1.4 && m.y < H + 200);
    for (const m of meteors) {
      m.x += m.vx; m.y += m.vy; m.life += .008;
      const k = Math.hypot(m.vx, m.vy), tx = m.x - m.vx / k * m.len, ty = m.y - m.vy / k * m.len;
      const g = ctx.createLinearGradient(m.x, m.y, tx, ty);
      const a = Math.min(1, m.life * 5) * Math.max(0, 1 - m.life / 1.4) * .55;
      g.addColorStop(0, `rgba(230,255,170,${a})`); g.addColorStop(1, 'rgba(198,255,52,0)');
      ctx.strokeStyle = g; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(m.x, m.y); ctx.lineTo(tx, ty); ctx.stroke();
      ctx.fillStyle = `rgba(240,255,200,${a})`; ctx.fillRect(m.x - 1, m.y - 1, 2, 2);
    }
  };
  raf = requestAnimationFrame(frame);
})();
