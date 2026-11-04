/* פרויקטים מהמסד: דף הבית (2 עד 4 עמודות) ועמוד /projects. אם המסד ריק או לא זמין, נשאר התוכן שבקוד ה-HTML.
   קריאה ציבורית בלבד (anon key), ורק פרויקטים מפורסמים (RLS). */
(function () {
  'use strict';
  var C = window.SB_CONFIG || {};
  var MAX_HOME = 4;
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var pad = function (n) { return (n < 10 ? '0' : '') + n; };
  var isExt = function (u) { return /^https?:\/\//i.test(u || ''); };
  function host(u) { try { return new URL(u, location.href).hostname.replace(/^www\./, ''); } catch (e) { return ''; } }

  function load(query) {
    if (!C.url || !C.anonKey) return Promise.resolve(null);
    return fetch(C.url.replace(/\/$/, '') + '/rest/v1/projects?select=*&published=eq.true&order=position.asc' + (query || ''), { headers: { apikey: C.anonKey, Authorization: 'Bearer ' + C.anonKey } })
      .then(function (r) { return r.ok ? r.json() : null; })
      .catch(function () { return null; });
  }

  /* מוקאפ: מובנה (gan), או תמונות שהועלו (דסקטופ ומובייל) בתוך אותה מסגרת כמו היום */
  function mockup(p, ganHtml) {
    if (p.mockup_key === 'gan' && ganHtml) return ganHtml;
    if (!p.desktop_image_url) return '';
    var h = p.link && isExt(p.link) ? host(p.link) : '';
    return '<div class="mk mk--tef" aria-hidden="true"><div class="mk__win"><div class="mk__bar"><b></b><b></b><b></b><span lang="en" dir="ltr">' + esc(h) + '</span></div>' +
      '<div class="mk__page mk__page--shot"><img class="mk__shot" src="' + esc(p.desktop_image_url) + '" alt="" width="800" height="500" loading="lazy"></div></div>' +
      (p.mobile_image_url ? '<div class="mk__phone"><div class="mk__scr mk__scr--shot"><img class="mk__shot" src="' + esc(p.mobile_image_url) + '" alt="" width="390" height="760" loading="lazy"></div></div>' : '') + '</div>';
  }

  function btn(p, forList) {
    if (p.is_placeholder) return forList ? '' : '<a class="btn cta-blink" href="#contact" data-gn="btn"><span class="btn__t">בואו נדבר</span></a>';
    var l = p.link || '';
    if (!l || !/^(https?:\/\/|\/|#)/i.test(l)) return '';
    if (forList && (l === '/projects' || l === 'projects.html' || l === '/projects.html')) return '';
    var ext = isExt(l);
    return '<a class="btn" data-gn="btn" href="' + esc(l) + '"' + (ext ? ' target="_blank" rel="noopener"' : '') + '><span class="btn__t">לפרויקט המלא</span></a>';
  }

  /* דף הבית */
  function bindHome(root) {
    var it = [].slice.call(root.querySelectorAll('.pj3__c'));
    function open(x) { it.forEach(function (y) { y.classList.toggle('is-open', y === x); }); }
    it.forEach(function (x) {
      x.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse' && matchMedia('(min-width:901px)').matches) open(x); });
      x.addEventListener('focusin', function () { open(x); });
      x.addEventListener('click', function () { open(x); });
    });
  }
  function renderHome(root, rows, ganHtml) {
    rows = rows.slice(0, MAX_HOME);
    root.setAttribute('data-count', String(rows.length));
    root.innerHTML = rows.map(function (p, i) {
      var n = pad(i + 1), t = esc(p.title);
      return '<article class="pj3__c' + (i === 0 ? ' is-open' : '') + '" tabindex="0">' +
        '<div class="pj3__rail" aria-hidden="true"><span class="pj3__rn">' + n + '</span><span class="pj3__rv">' + t + '</span></div>' +
        '<div class="pj3__in"><div class="pj3__tx"><span class="pj3__n">' + n + '</span><h3 class="pj3__t">' + t + '</h3>' +
        (p.description ? '<p class="pj3__d">' + esc(p.description) + '</p>' : '') + btn(p, false) + '</div>' +
        '<div class="pj3__mk">' + mockup(p, ganHtml) + '</div></div></article>';
    }).join('');
    bindHome(root);
  }

  /* עמוד הפרויקטים */
  function renderList(list, rows, ganHtml) {
    list.innerHTML = rows.map(function (p, i) {
      var tags = String(p.type || '').split('·').map(function (s) { return s.trim(); }).filter(Boolean);
      if (p.is_concept && !tags.some(function (t) { return t.toUpperCase() === 'CONCEPT'; })) tags.unshift('CONCEPT');
      var tagHtml = tags.length ? '<ul class="pp-tags" role="list" lang="en" dir="ltr">' + tags.map(function (t) { return '<li' + (t.toUpperCase() === 'CONCEPT' ? ' class="is-yellow"' : '') + '>' + esc(t) + '</li>'; }).join('') + '</ul>' : '';
      return '<article class="pp-row" id="p-' + esc(String(p.id).slice(0, 8)) + '"><div class="pj3__tx"><span class="pj3__n">' + pad(i + 1) + '</span><h2 class="pj3__t">' + esc(p.title) + '</h2>' +
        (p.description ? '<p class="pj3__d">' + esc(p.description) + '</p>' : '') + tagHtml + btn(p, true) + '</div><div class="pj3__mk">' + mockup(p, ganHtml) + '</div></article>';
    }).join('');
  }

  function init() {
    var home = document.querySelector('[data-pj3]'), list = document.querySelector('.pp-list');
    var gan = document.querySelector('.mk--gan');
    var ganHtml = gan ? gan.outerHTML : '';
    if (home) bindHome(home);   /* גם כשהתוכן נשאר מהקוד */
    if (!home && !list) return;
    load(home ? '&show_on_home=eq.true' : '&is_placeholder=eq.false').then(function (rows) {
      if (!rows || !rows.length) return;
      if (home) renderHome(home, rows, ganHtml); else renderList(list, rows, ganHtml);
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
