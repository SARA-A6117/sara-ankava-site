(function () {
  'use strict';
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ---- מדבקות: טבעת טקסט (הטקסט הפוך כדי שייקרא נכון לאורך המסלול) + כוכב ---- */
  var n = 0;
  function rev(s) { return Array.from(s).reverse().join(''); }
  $$('.stk').forEach(function (el) {
    var id = 'stkp' + (++n), unit = el.getAttribute('data-ring') || '';
    el.innerHTML = '<i class="stk__c" data-gn="btn"></i>' +
      '<svg class="stk__ring" viewBox="0 0 200 200" aria-hidden="true"><defs><path id="' + id + '" d="M100 100m-71 0a71 71 0 1 1 142 0a71 71 0 1 1-142 0"/></defs><text><textPath href="#' + id + '"></textPath></text></svg>' +
      '<svg class="stk__star" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 1.5l2.5 7.2 7.5 .3-6 4.6 2.2 7.3L12 16.7 5.8 20.9 8 13.6 2 9l7.5-.3z" fill="#0c0e0d"/></svg>';
    var tp = el.querySelector('textPath'), txt = el.querySelector('text');
    function fit() {
      var circ = 446, r, len;
      txt.style.fontSize = '14px';
      for (r = 1; r <= 10; r++) {
        tp.textContent = rev(new Array(r + 1).join(unit));
        len = txt.getComputedTextLength();
        if (len >= circ * 0.84) break;
      }
      if (len > 0) txt.style.fontSize = (14 * (circ - 4) / len).toFixed(2) + 'px';
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
          if (c.hasAttribute('data-gn') || c.classList.contains('gr')) { c.style.display = c.style.display || 'inline-block'; c.style.setProperty('--i', i++); /* יחידה אחת: הגרדיאנט נשאר על האלמנט */ c.classList.add('wdu'); c.setAttribute('data-wbu', ''); }
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
  })();
