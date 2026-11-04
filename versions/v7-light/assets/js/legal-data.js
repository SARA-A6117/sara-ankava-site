/* עמודים משפטיים מהמסד (טבלת pages). התוכן עובר ניקוי DOMPurify לפני הצגה. אם המסד ריק, נכשל או שאין DOMPurify, נשאר התוכן שבקוד ה-HTML.
   הקובץ משמש גם את /admin (window.LegalHTML) לניקוי, הדגשת [...] ובניית הסעיפים. */
(function () {
  'use strict';
  var TAGS = ['h2', 'h3', 'p', 'ul', 'ol', 'li', 'a', 'strong', 'em', 'br'];
  var hooked = false;
  /* כל סוגריים מרובעים קצרים הם פרט חסר: [...] או [שם], [טלפון], [מייל] */
  var GAP = /\[[^\]\[\n]{1,20}\]/g, GAP1 = /\[[^\]\[\n]{1,20}\]/;

  function clean(html) {
    if (!window.DOMPurify) return null;
    if (!hooked) {
      hooked = true;
      DOMPurify.addHook('afterSanitizeAttributes', function (n) {
        if (n.tagName === 'A') {
          var h = n.getAttribute('href') || '';
          if (/^https?:/i.test(h)) { n.setAttribute('target', '_blank'); n.setAttribute('rel', 'noopener noreferrer'); } else { n.removeAttribute('target'); n.removeAttribute('rel'); }
        }
      });
    }
    return DOMPurify.sanitize(String(html || ''), { ALLOWED_TAGS: TAGS, ALLOWED_ATTR: ['href', 'target', 'rel'], ALLOWED_URI_REGEXP: /^(?:https?:|mailto:|tel:|\/|#)/i });
  }

  /* כל [...] שנשאר בטקסט נעטף ב-mark.ph (צהוב). מחזיר כמה נמצאו */
  function markGaps(root) {
    var n = 0, w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT), list = [], t;
    while ((t = w.nextNode())) if (GAP1.test(t.nodeValue)) list.push(t);
    list.forEach(function (tn) {
      var txt = tn.nodeValue, f = document.createDocumentFragment(), last = 0, m1;
      GAP.lastIndex = 0;
      while ((m1 = GAP.exec(txt))) {
        if (m1.index > last) f.appendChild(document.createTextNode(txt.slice(last, m1.index)));
        var m = document.createElement('mark'); m.className = 'ph'; m.textContent = m1[0]; f.appendChild(m); n++;
        last = m1.index + m1[0].length;
      }
      if (last < txt.length) f.appendChild(document.createTextNode(txt.slice(last)));
      tn.parentNode.replaceChild(f, tn);
    });
    return n;
  }
  function unmark(root) { [].forEach.call(root.querySelectorAll('mark'), function (m) { m.replaceWith(document.createTextNode(m.textContent)); }); }

  /* סעיפים לפי כותרות h2, בדיוק במבנה שהעיצוב מכיר: section.lg-sec + עוגן + תוכן עניינים */
  function sections(html) {
    var box = document.createElement('div'); box.innerHTML = html;
    var out = [], cur = null;
    [].forEach.call(box.childNodes, function (n) {
      if (n.nodeType === 1 && n.tagName === 'H2') { cur = { h: n.textContent.trim(), nodes: [] }; out.push(cur); }
      else { if (!cur) { cur = { h: '', nodes: [] }; out.push(cur); } cur.nodes.push(n); }
    });
    return out;
  }
  function build(html) {
    var secs = sections(html), toc = document.createElement('ol'), frag = document.createDocumentFragment();
    secs.forEach(function (s, i) {
      var id = 's-' + (i + 1), sec = document.createElement('section');
      sec.className = 'lg-sec';
      if (s.h) {
        sec.setAttribute('aria-labelledby', id + '-h');
        var h = document.createElement('h2'); h.id = id + '-h';
        var a = document.createElement('span'); a.id = id; a.className = 'lg-anchor';
        h.appendChild(a); h.appendChild(document.createTextNode(s.h)); sec.appendChild(h);
        var li = document.createElement('li'), l = document.createElement('a'); l.href = '#' + id; l.textContent = s.h; li.appendChild(l); toc.appendChild(li);
      }
      s.nodes.forEach(function (n) { sec.appendChild(n); });
      markGaps(sec);
      frag.appendChild(sec);
    });
    return { frag: frag, toc: toc };
  }
  function fmtDate(d) { try { return new Date(d).toLocaleDateString('he-IL', { day: 'numeric', month: 'long', year: 'numeric' }); } catch (e) { return ''; } }

  window.LegalHTML = { GAP: GAP, GAP1: GAP1, clean: clean, markGaps: markGaps, unmark: unmark, fmtDate: fmtDate, ready: function () { return !!window.DOMPurify; } };

  /* ---- עמוד ציבורי ---- */
  var body = document.querySelector('.lg-body');
  if (!body) return;
  var C = window.SB_CONFIG || {};
  var slug = (location.pathname.replace(/\/+$/, '').split('/').pop() || '').replace(/\.html$/, '');
  if (!/^(privacy|terms|accessibility)$/.test(slug) || !C.url || !C.anonKey) return;

  function run() {
    if (!window.DOMPurify) return;
    fetch(C.url.replace(/\/$/, '') + '/rest/v1/pages?select=title,lead,content,updated_at&slug=eq.' + slug, { headers: { apikey: C.anonKey, Authorization: 'Bearer ' + C.anonKey } })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (rows) {
        var p = rows && rows[0];
        if (!p || !String(p.content || '').trim()) return;
        var html = clean(p.content);
        if (!html || !html.trim()) return;
        var b = build(html);
        [].forEach.call(body.querySelectorAll('.lg-sec'), function (s) { s.remove(); });
        var more = body.querySelector('.lg-more');
        body.insertBefore(b.frag, more || null);
        var ol = document.querySelector('.lg-toc ol'); if (ol) ol.replaceWith(b.toc);
        var h1 = document.querySelector('.lg-h'); if (h1 && p.title) h1.textContent = p.title;
        var lead = document.querySelector('.lg-lead'); if (lead && p.lead) lead.textContent = p.lead;
        var meta = document.querySelector('.lg-meta'); if (meta && p.updated_at) meta.textContent = 'עודכן לאחרונה: ' + fmtDate(p.updated_at);
      })
      .catch(function () {});
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run); else run();
})();
