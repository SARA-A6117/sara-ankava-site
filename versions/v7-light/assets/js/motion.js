(function () {
  'use strict';
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ---- מדבקות: טבעת טקסט (הטקסט הפוך כדי שייקרא נכון לאורך המסלול) + כוכב ---- */
  var n = 0;
  function rev(s) { return Array.from(s).reverse().join(''); }
  var BUB = 'M102 22C140 22 174 56 174 98C174 138 146 170 104 170C98 170 92 169 87 167C78 166 70 171 60 175C50 179 40 181 34 181C31 181 31 178 33 176C45 164 50 156 49 150C49 147 47 146 45 143C32 128 26 112 26 96C26 54 62 22 102 22Z';
  if ($$('.stk').length) {
    var defs = document.createElement('div');
    defs.setAttribute('aria-hidden', 'true');
    defs.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden';
    defs.innerHTML = '<svg width="0" height="0"><clipPath id="stkclip" clipPathUnits="objectBoundingBox"><path transform="scale(.005)" d="' + BUB + '"/></clipPath></svg>';
    document.body.appendChild(defs);
  }
  $$('.stk').forEach(function (el) {
    var id = 'stkp' + (++n), unit = el.getAttribute('data-ring') || '';
    el.innerHTML = '<i class="stk__c" data-gn="btn"></i>' +
      '<svg class="stk__ring" viewBox="0 0 200 200" aria-hidden="true"><defs><path id="' + id + '" d="' + BUB + '" transform="translate(100 96) scale(1.14) translate(-100 -96)"/></defs><text><textPath href="#' + id + '"></textPath></text></svg>' +
      '<svg class="stk__star" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 0C12.8 7 17 11.2 24 12C17 12.8 12.8 17 12 24C11.2 17 7 12.8 0 12C7 11.2 11.2 7 12 0Z" fill="#FBF8F0"/></svg>';
    var tp = el.querySelector('textPath'), txt = el.querySelector('text'), pth = el.querySelector('defs path');
    function fit() {
      var circ = pth.getTotalLength() * 1.14, r, len, fs = 9;
      txt.style.fontSize = '9px';
      tp.removeAttribute('textLength');
      for (r = 1; r <= 14; r++) {
        tp.textContent = rev(new Array(r + 1).join(unit));
        len = txt.getComputedTextLength();
        fs = len > 0 ? 9 * (circ - 2) / len : 9;
        if (fs <= 17) break;
      }
      txt.style.fontSize = Math.min(fs, 17).toFixed(2) + 'px';
      tp.setAttribute('textLength', (circ - 2).toFixed(1));
      tp.setAttribute('lengthAdjust', 'spacing');
    }
    fit();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);
  });

  /* ---- בניית כותרות מילה אחרי מילה (לא בהירו) ---- */
  var HEADS = '.pj__h,.lp2__h,.pr3__h,.ab__h,.ct__h';
  function build(root) {
    var i = 0;
    (function walk(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (c) {
        if (c.nodeType === 3) {
          var parts = c.textContent.split(/(\s+)/), frag = document.createDocumentFragment();
          parts.forEach(function (p) {
            if (!p) return;
            if (/^\s+$/.test(p)) { frag.appendChild(document.createTextNode(p)); return; }
            var w = document.createElement('wd-w'); w.textContent = p; w.style.setProperty('--i', i++); frag.appendChild(w);
          });
          node.replaceChild(frag, c);
        } else if (c.nodeType === 1 && c.tagName !== 'BR' && c.tagName !== 'SVG') {
          if (c.hasAttribute('data-gn') || c.classList.contains('gr')) { if (getComputedStyle(c).display === 'inline') c.style.display = 'inline-block'; c.style.setProperty('--i', i++); /* יחידה אחת: הגרדיאנט נשאר על האלמנט */ c.classList.add('wdu'); c.setAttribute('data-wbu', ''); }
          else walk(c);
        }
      });
    })(root);
  }
  if (!reduce && 'IntersectionObserver' in window) {
    var heads = $$(HEADS);
    heads.forEach(function (h) { build(h); h.setAttribute('data-wb', ''); });
    document.documentElement.classList.add('wb-on');
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } });
    }, { threshold: 0.35, rootMargin: '0px 0px -8% 0px' });
    heads.forEach(function (h) { io.observe(h); });
    /* גיבוי: אם משהו נתקע, הכול מתגלה */
    setTimeout(function () { heads.forEach(function (h) { var r = h.getBoundingClientRect(); if (r.top < innerHeight && r.bottom > 0) h.classList.add('is-in'); }); }, 4000);
  }

  
  /* ---- שלב 2: סימני "+" בפינות מסגרת האודות, טקסט שמתחדד, כפתורים מגנטיים ---- */
  function plusMarks(hostSel, targetSel) {
    var host = document.querySelector(hostSel), t = document.querySelector(targetSel);
    if (!host || !t) return;
    var els = [0, 1, 2, 3].map(function () { var i = document.createElement('i'); i.className = 'plus'; i.setAttribute('aria-hidden', 'true'); host.appendChild(i); return i; });
    function place() {
      var h = host.getBoundingClientRect(), r = t.getBoundingClientRect();
      var xs = [r.left - h.left, r.right - h.left], ys = [r.top - h.top, r.bottom - h.top];
      els.forEach(function (el, k) { el.style.left = xs[k % 2] + 'px'; el.style.top = ys[k >> 1] + 'px'; });
    }
    place(); addEventListener('resize', place); addEventListener('load', place);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(place);
  }
  plusMarks('.ab', '.ab__frame');

  /* סימני "+" בצמתי הגריד: פינות האזור ושולי העמודות */
  function plusGrid(hostSel, targetSel, childSel) {
    var host = document.querySelector(hostSel), t = document.querySelector(targetSel);
    if (!host || !t) return;
    var marks = [];
    function place() {
      var h = host.getBoundingClientRect(), r = t.getBoundingClientRect(), xs = [r.left, r.right], kids = childSel ? $$(childSel, t) : [];
      kids.forEach(function (k) { var q = k.getBoundingClientRect(); xs.push(q.left, q.right); });
      var seen = {}, pts = [];
      xs.forEach(function (x) { var rx = Math.round(x - h.left); if (rx < 10 || rx > h.width - 10 || seen[rx]) return; seen[rx] = 1; [r.top, r.bottom].forEach(function (y) { pts.push([rx, Math.round(y - h.top)]); }); });
      while (marks.length < pts.length) { var i = document.createElement('i'); i.className = 'plus'; i.setAttribute('aria-hidden', 'true'); host.appendChild(i); marks.push(i); }
      marks.forEach(function (m, k) { if (pts[k]) { m.style.display = ''; m.style.left = pts[k][0] + 'px'; m.style.top = pts[k][1] + 'px'; } else m.style.display = 'none'; });
    }
    place(); addEventListener('resize', place); addEventListener('load', place);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(place);
    t.addEventListener('click', function () { var n = 0, id = setInterval(function () { place(); if (++n > 24) clearInterval(id); }, 50); });
  }


  if (!reduce && 'IntersectionObserver' in window && document.documentElement.animate) {
    var SHARP = $$('.ab__txt p,.pj3__d,.lp2__p,.pr3__p,.ct .madlib');
    SHARP.forEach(function (e) { e.classList.add('sh'); });
    var ioS = new IntersectionObserver(function (es) {
      es.forEach(function (en) {
        if (!en.isIntersecting) return; ioS.unobserve(en.target);
        var el = en.target; el.classList.remove('sh');
        el.animate([{ filter: 'blur(12px)', opacity: .15, transform: 'translateY(14px)' }, { filter: 'blur(0px)', opacity: 1, transform: 'none' }], { duration: 900, easing: 'cubic-bezier(.16,1,.3,1)' });
      });
    }, { threshold: 0.2 });
    SHARP.forEach(function (e, i) { ioS.observe(e); });
    setTimeout(function () { SHARP.forEach(function (e) { e.classList.remove('sh'); }); }, 6000);
  }

  if (!reduce && matchMedia('(hover: hover) and (pointer: fine)').matches) {
    $$('.cta6[data-gn], .btn[data-gn], .or-wa').forEach(function (b) {
      var tx = 0, ty = 0, x = 0, y = 0, raf = 0;
      function step() { x += (tx - x) * .18; y += (ty - y) * .18; b.style.translate = (Math.abs(x) < .05 && Math.abs(y) < .05 && !tx && !ty) ? '' : x.toFixed(2) + 'px ' + y.toFixed(2) + 'px'; raf = (Math.abs(tx - x) > .05 || Math.abs(ty - y) > .05) ? requestAnimationFrame(step) : 0; }
      function kick() { if (!raf) raf = requestAnimationFrame(step); }
      b.addEventListener('pointermove', function (e) { var r = b.getBoundingClientRect(); tx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2) * 7; ty = (e.clientY - (r.top + r.height / 2)) / (r.height / 2) * 4; kick(); });
      b.addEventListener('pointerleave', function () { tx = ty = 0; kick(); });
    });
  }
  
  /* ---- שלב 3: התהליך נבנה בגלילה: מונה התקדמות, סרגל בצד, אובייקטים שנבנים חלק אחרי חלק ---- */
  (function () {
    var s = document.querySelector('[data-pr3]'), st = s && s.querySelector('.pr3__stick');
    if (!s || !st) return;
    var wrap = document.createElement('div');
    wrap.className = 'pr3__rl'; wrap.setAttribute('aria-hidden', 'true');
    wrap.innerHTML = '<i class="pr3__ruler"></i><div class="pr3__pc"><span class="pr3__pl">בנייה</span><b class="pr3__pn">000</b><em>%</em><span class="pr3__bar"><i></i></span></div>';
    st.appendChild(wrap);
    var num = wrap.querySelector('.pr3__pn'), bar = wrap.querySelector('.pr3__bar i'), cols = $$('.pr3__c', s);
    var mob = matchMedia('(max-width:900px)'), busy = 0;
    function p() {
      var r = s.getBoundingClientRect(), v;
      if (mob.matches) v = (innerHeight * .85 - r.top) / (r.height * .85); else v = -r.top / (s.offsetHeight - innerHeight);
      return Math.max(0, Math.min(1, v));
    }
    function upd() {
      busy = 0;
      var v = reduce ? 1 : p(), n = Math.round(v * 100);
      num.textContent = ('00' + n).slice(-3);
      bar.style.transform = 'scaleX(' + v.toFixed(3) + ')';
    }
    function tick() { if (!busy) busy = requestAnimationFrame(upd); }
    addEventListener('scroll', tick, { passive: true }); addEventListener('resize', tick); upd();
  })();
  
  /* ---- כותרות יושבות בדיוק על קו הגריד (קו הבסיס על הקו, לא באמצע השורה) ---- */
  function snapHeads() {
    if (innerWidth < 901) { [".pr3__h"].forEach(function (s) { var e = document.querySelector(s); if (e) e.style.translate = ""; }); return; }
    var P = innerHeight / 8;
    [[".pr3__h", ".pr3__stick"]].forEach(function (pair) {
      var el = document.querySelector(pair[0]), top = document.querySelector(pair[1]);
      if (!el || !top) return;
      el.style.translate = "";
      var spans = el.querySelectorAll(":scope > span"), last = spans.length ? spans[spans.length - 1] : el;
      var pr = document.createElement("i"); pr.style.cssText = "display:inline-block;width:0;height:0"; last.appendChild(pr);
      var b = pr.getBoundingClientRect().bottom; pr.remove();
      var rel = (b - top.getBoundingClientRect().top) / P, line = Math.round(rel), d = (line * P - 3) - (b - top.getBoundingClientRect().top);
      if (Math.abs(d) < P * .6) el.style.translate = "0 " + d.toFixed(1) + "px";
    });
  }
  [".pr3__h"].forEach(function (s) { var e = document.querySelector(s); if (e) e.style.translate = ""; });
  
  /* אודות: הפסקה ממורכזת מול התמונה, לא מול התמונה והכותרת יחד */
  function abCenter() {
    var fr = document.querySelector('.ab__frame'), hd = document.querySelector('.ab__h');
    if (!fr || !hd) return;
    fr.style.setProperty('--abh', innerWidth > 900 ? hd.offsetHeight + 'px' : '0px');
  }
  abCenter(); addEventListener('resize', abCenter); addEventListener('load', abCenter);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(abCenter);
  setTimeout(abCenter, 800);
  
  /* 6. חשיפה עמידה: גם בגלילה מהירה כל מה שנמצא בתצוגה או מעליה מגיע למצב הסופי */
  function settleReveals() {
    var lim = innerHeight * .96;
    if (typeof heads !== 'undefined') heads.forEach(function (h) { if (h.getBoundingClientRect().top < lim) h.classList.add('is-in'); });
    if (typeof SHARP !== 'undefined') SHARP.forEach(function (e) { if (e.classList.contains('sh') && e.getBoundingClientRect().top < lim) e.classList.remove('sh'); });
  }
  var settleT; function settleSoon() { clearTimeout(settleT); settleT = setTimeout(settleReveals, 140); }
  addEventListener('scroll', settleSoon, { passive: true }); addEventListener('resize', settleSoon); addEventListener('load', settleSoon);
  /* רשת ביטחון: בדיקה תקופתית, למקרה שאירוע גלילה לא נורה (קפיצה מהירה, לשונית ברקע) */
  var settleIv = setInterval(function () { settleReveals(); if ((typeof heads === 'undefined' || heads.every(function (h) { return h.classList.contains('is-in'); })) && !document.querySelector('.sh')) clearInterval(settleIv); }, 600);
  })();
