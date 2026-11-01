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

  })();
