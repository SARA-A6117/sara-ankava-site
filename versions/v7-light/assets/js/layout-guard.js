/* בודק פריסה לפני פרסום עיצוב (העורך העיצבי).
   טוען את העמוד באייפריים נסתר בכל רוחב (1440, 1024, 390), מודד אזורים שאסור שיזוזו, מזריק את ה-CSS המוצע, ומודד שוב.
   חוסם אם: אזור נעול לגמרי (הירו, פרויקטים, ניווט) זז או השתנה בגודל מעל 2 פיקסלים, או נוצרה גלישה אופקית חדשה.
   המדידה לפי offset (לא מושפעת מאנימציות transform) ובלי גלילה, כך שהיא יציבה.
   שימוש: LayoutGuard.check({ url:'/', nodes:[...tree nodes of the page], css:'...', widths:[1440,1024,390] }) -> Promise */
(function (root) {
  'use strict';
  var STRICT = { hero: 1, projects: 1, nav: 1 };   /* סיבות נעילה שבהן שום דבר לא אמור לזוז */
  var TOL = 2;

  function docOffset(el) {
    var x = 0, y = 0, e = el;
    while (e) { x += e.offsetLeft || 0; y += e.offsetTop || 0; e = e.offsetParent; }
    return { x: x, y: y, w: el.offsetWidth, h: el.offsetHeight, shown: !!(el.offsetParent || el.offsetWidth || el.offsetHeight || el.getClientRects().length) };
  }
  function measure(doc, ids) {
    var out = {};
    ids.forEach(function (id) { var el = doc.querySelector('[data-el="' + id + '"]'); if (el) out[id] = docOffset(el); });
    var iw = doc.defaultView.innerWidth, spill = {};
    [].forEach.call(doc.querySelectorAll("[data-el]"), function (el) { var r = el.getBoundingClientRect(); if (r.width && (r.right > iw + 2 || r.left < -2)) spill[el.getAttribute("data-el")] = 1; });
    return { rects: out, scrollW: doc.documentElement.scrollWidth, innerW: iw, spill: spill };
  }
  function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

  /* מחכה שהעמוד יהיה יציב: טעינה, גופנים, ותוכן שנבנה מהמסד (פרויקטים) */
  function settle(frame) {
    return new Promise(function (resolve) {
      var done = false, finish = function () { if (!done) { done = true; resolve(); } };
      frame.addEventListener('load', function () {
        var d = frame.contentDocument, fonts = d.fonts && d.fonts.ready ? d.fonts.ready : Promise.resolve();
        fonts.then(function () { return wait(1800); }).then(finish, finish);
      });
      setTimeout(finish, 12000);
    });
  }

  function checkWidth(opts, width) {
    var frame = document.createElement('iframe');
    frame.setAttribute('aria-hidden', 'true'); frame.tabIndex = -1;
    frame.style.cssText = 'position:fixed;left:-99999px;top:0;border:0;visibility:hidden;width:' + width + 'px;height:900px';
    frame.src = opts.url;
    document.body.appendChild(frame);
    return settle(frame).then(function () {
      var d = frame.contentDocument;
      /* בסיס: בלי שום שינוי עיצוב (גם בלי המפורסם) */
      [].forEach.call(d.querySelectorAll('link[href*="overrides.css"]'), function (l) { l.disabled = true; });
      var ids = (opts.nodes || []).filter(function (n) { return n.locked && STRICT[n.locked]; }).map(function (n) { return n.id; });
      /* גם אזורי העל (header/section) נמדדים: גובה האזור הנעול לא יכול להשתנות */
      var base = measure(d, ids);
      var st = d.createElement('style'); st.id = 'cp-guard-css'; st.textContent = opts.css || ''; d.head.appendChild(st);
      return wait(500).then(function () {
        var cand = measure(d, ids), res = { width: width, violations: [], overflow: null, checked: Object.keys(base.rects).length };
        Object.keys(base.rects).forEach(function (id) {
          var a = base.rects[id], b = cand.rects[id];
          if (!b) { res.violations.push({ id: id, why: 'האלמנט נעלם', width: width }); return; }
          if (a.shown !== b.shown) { res.violations.push({ id: id, why: a.shown ? 'האלמנט הוסתר' : 'האלמנט הופיע', width: width }); return; }
          var dx = b.x - a.x, dy = b.y - a.y, dw = b.w - a.w, dh = b.h - a.h;
          if (Math.abs(dx) > TOL || Math.abs(dy) > TOL || Math.abs(dw) > TOL || Math.abs(dh) > TOL) res.violations.push({ id: id, why: 'זז או שינה גודל', dx: dx, dy: dy, dw: dw, dh: dh, width: width });
        });
        if (cand.scrollW > Math.max(base.scrollW, cand.innerW) + TOL) res.overflow = { base: base.scrollW, now: cand.scrollW, viewport: cand.innerW };
        var spilled = Object.keys(cand.spill).filter(function (k) { return !base.spill[k]; });
        if (spilled.length && !res.overflow) res.overflow = { spilled: spilled.slice(0, 5), viewport: cand.innerW };
        frame.remove();
        return res;
      });
    }).catch(function (e) { frame.remove(); return { width: width, violations: [], overflow: null, error: String(e && e.message || e) }; });
  }

  /* רץ ברצף (לא במקביל) כדי שהמדידות לא יפריעו זו לזו */
  function check(opts) {
    var widths = opts.widths || [1440, 1024, 390], results = [];
    return widths.reduce(function (p, w) { return p.then(function () { return checkWidth(opts, w).then(function (r) { results.push(r); }); }); }, Promise.resolve()).then(function () {
      var violations = [], overflow = [], errors = [];
      results.forEach(function (r) { r.violations.forEach(function (v) { violations.push(v); }); if (r.overflow) overflow.push(Object.assign({ width: r.width }, r.overflow)); if (r.error) errors.push(r.error); });
      return { ok: !violations.length && !overflow.length && !errors.length, violations: violations, overflow: overflow, errors: errors, results: results };
    });
  }

  root.LayoutGuard = { check: check, TOL: TOL };
})(typeof window !== 'undefined' ? window : this);
