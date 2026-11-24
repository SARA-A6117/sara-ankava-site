/* העורך העיצובי (טאב "עיצוב" בניהול). עובד רק בתוך הרשימה הלבנה: צבעי המותג, מדרגות גודל, משקל, ריווח והסתרה לפי מכשיר.
   אין כאן שדה חופשי: הערכים נבחרים מכפתורים בלבד, ו-DesignCore (אותו קוד שבונה את האתר) מנקה אותם שוב לפני שמירה ותצוגה.
   טיוטה נשמרת אוטומטית במסד (עמודת draft פרטית). פרסום: בדיקת פריסה, שמירת גרסה, והפעלת בנייה. */
(function (root) {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var C = null;   /* DesignCore */
  var PAGES = { index: ['דף הבית', '/'], projects: ['פרויקטים', '/projects'], privacy: ['פרטיות', '/privacy'], terms: ['תנאי שימוש', '/terms'], accessibility: ['נגישות', '/accessibility'] };
  var DEV = { base: ['מחשב', 1440], tablet: ['טאבלט', 1000], mobile: ['נייד', 390] };
  var COLOR_HE = { cream: 'קרם', sand: 'חול', charcoal: 'פחם', cobalt: 'קובלט', 'cobalt-bright': 'קובלט בהיר', yellow: 'צהוב', cyan: 'תכלת', white: 'לבן' };
  var SIZE_HE = { 'fs-5': 'זעיר', 'fs-4': 'גוף', 'fs-3': 'תת-כותרת', 'fs-2': 'כותרת', 'fs-1': 'כותרת גדולה', 'fs-mega': 'ענק' };
  var SPACE_HE = { none: 'בלי', inner: 'קטן', group: 'בינוני', section: 'גדול', outer: 'שוליים' };
  var LOCK_HE = { hero: 'ההירו נעול: המיקום והגרדיאנט לא נערכים.', projects: 'אזור הפרויקטים נעול: הפריסה והמוקאפים לא נערכים.', nav: 'התפריט נעול.', form: 'הטופס נעול: הוא מחובר לשליחת פניות.', gradient: 'מילים בגרדיאנט נעולות: הגרדיאנט חי וצבע ישבור אותו.', js: 'אלמנט שהקוד מפעיל (אנימציה או כפתור פעיל): נעול.', image: 'תמונות נעולות.', button: 'כפתורי הבועה נעולים: הם חלק משפת העיצוב.', decor: 'קישוט: נעול.', sticker: 'המדבקה נעולה.', outline: 'מילת קו (טקסט שקוף עם מתאר): צבע ימלא אותה, לכן נעולה.', legal: 'מבנה העמודים המשפטיים נעול (הטקסט נערך בטאב העמודים).' };
  var KIND_HE = { heading: 'כותרת', text: 'טקסט', link: 'קישור', section: 'אזור', list: 'רשימה', container: 'מכל', image: 'תמונה', button: 'כפתור', form: 'טופס' };

  var sb, ctx, tree = null, nodes = {}, byPage = {}, rows = {}, cur = {}, undo = [], redo = [], sel = null, page = 'index', dev = 'base', before = false;
  var loaded = false, publishing = false, saveT = null, saving = false, hasMounted = false, buildPending = false, scale = 1, stageObs = null;

  function snap() { return JSON.stringify(cur); }
  function pushUndo() { undo.push(snap()); if (undo.length > 60) undo.shift(); redo = []; }
  function same(a, b) { return JSON.stringify(a || {}) === JSON.stringify(b || {}); }
  function norm(el) { var n = nodes[el]; return n ? C.normalize(cur[el] || {}, n.allow, n).props : {}; }
  function pending() { return Object.keys(Object.assign({}, rows, cur)).filter(function (el) { var r = rows[el]; return !same(norm(el), r ? r.props : {}); }); }
  /* מה צריך להישמר כטיוטה: גם אלמנטים שחזרו למצב המפורסם (draft מתנקה), לא רק אלמנטים ששונו */
  function toSave() {
    return Object.keys(Object.assign({}, rows, cur)).filter(function (el) {
      var r = rows[el], target = same(norm(el), r ? r.props : {}) ? null : norm(el), curDraft = r && r.draft != null ? r.draft : null;
      if (!r && !target) return false;
      return JSON.stringify(target) !== JSON.stringify(curDraft);
    });
  }
  function draftOf(el) { var r = rows[el]; return same(norm(el), r ? r.props : {}) ? null : norm(el); }
  function msg(t, ok) { var e = $('#dz-status'); e.textContent = t || ''; e.classList.toggle('ok', !!ok); }

  /* ---------- טעינה ---------- */
  function load() {
    return Promise.all([
      fetch('/assets/tree.json', { cache: 'no-store' }).then(function (r) { return r.json(); }),
      sb.from('design_overrides').select('*')
    ]).then(function (res) {
      tree = res[0]; nodes = {}; byPage = {};
      Object.keys(tree.pages).forEach(function (p) { byPage[p] = {}; tree.pages[p].forEach(function (n) { nodes[n.id] = n; byPage[p][n.id] = n; }); });
      if (res[1] && res[1].error) throw new Error('db');
      rows = {}; cur = {};
      ((res[1] && res[1].data) || []).forEach(function (r) { rows[r.el] = r; var v = r.draft != null ? r.draft : r.props; if (v && Object.keys(v).length && nodes[r.el]) cur[r.el] = v; });
      loaded = true; $('#dz-block').hidden = true; render();
    }).catch(function () { loaded = false; $('#dz-block').innerHTML = '<b>טעינת העיצוב נכשלה, ולכן העריכה נעולה כדי לא לדרוס טיוטות קיימות.</b> <button type="button" class="cp-sm" id="dz-retry">נסו שוב</button>'; $('#dz-block').hidden = false; counts(); });
  }

  function render() { renderTree(); renderPanel(); counts(); applyLive(); }

  /* ---------- שמירת טיוטה ---------- */
  function scheduleSave() { clearTimeout(saveT); msg('יש שינויים שלא נשמרו...'); saveT = setTimeout(saveDraft, 1500); }
  function saveDraft() {
    clearTimeout(saveT);
    if (!loaded) return Promise.resolve();
    if (saving) { saveT = setTimeout(saveDraft, 600); return Promise.resolve(); }
    var els = toSave();
    if (!els.length) { msg('✓ הטיוטה נשמרה', true); counts(); return Promise.resolve(); }
    saving = true;
    var up = els.map(function (el) { return { el: el, draft: draftOf(el) }; });
    return sb.from('design_overrides').upsert(up).select().then(function (r) {
      saving = false;
      if (r.error) { msg('שמירת הטיוטה נכשלה. בדקו את ההרשאות ונסו שוב.'); return; }
      (r.data || []).forEach(function (row) { rows[row.el] = row; });
      var more = toSave().length > 0;
      msg(more ? 'יש שינויים שלא נשמרו...' : '✓ הטיוטה נשמרה', !more); if (more) saveT = setTimeout(saveDraft, 600);
      counts();
    });
  }
  function counts() {
    var n = pending().length; $('#dz-count').textContent = n ? n + ' אלמנטים בטיוטה' : 'אין שינויים שממתינים לפרסום';
    $('#dz-publish').disabled = publishing || !loaded || (!n && !buildPending); $('#dz-publish').textContent = !n && buildPending ? 'הפעלת בנייה שוב' : 'פרסום השינויים';
    var b = $('#design-draft'); if (b) { b.hidden = !n; b.textContent = n; }
    $('#dz-undo').disabled = publishing || !undo.length; $('#dz-redo').disabled = publishing || !redo.length;
  }

  /* ---------- תצוגה מקדימה ---------- */
  function fdoc() { try { return $('#dz-frame').contentDocument; } catch (x) { return null; } }
  function applyLive() {
    var d = fdoc(); if (!d || !d.head) return;
    [].forEach.call(d.querySelectorAll('link[href*="overrides.css"]'), function (l) { l.disabled = !before ? true : false; });
    var st = d.getElementById('cp-dz-live'); if (!st) { st = d.createElement('style'); st.id = 'cp-dz-live'; d.head.appendChild(st); }
    var all = new Map(); Object.keys(nodes).forEach(function (k) { all.set(k, nodes[k]); });
    var map = {}; Object.keys(cur).forEach(function (k) { if (nodes[k]) map[k] = cur[k]; });
    st.textContent = before ? '' : C.generate(map, all).css;
    var ui = d.getElementById('cp-dz-ui'); if (!ui) { ui = d.createElement('style'); ui.id = 'cp-dz-ui'; ui.textContent = '[data-cp-sel]{outline:3px solid #1B33C9!important;outline-offset:3px}[data-el]:hover{outline:1px dashed rgba(27,51,201,.7);outline-offset:2px;cursor:pointer}'; d.head.appendChild(ui); }
    mark();
  }
  function mark() {
    var d = fdoc(); if (!d) return;
    [].forEach.call(d.querySelectorAll('[data-cp-sel]'), function (n) { n.removeAttribute('data-cp-sel'); });
    if (sel) { var t = d.querySelector('[data-el="' + sel + '"]'); if (t) t.setAttribute('data-cp-sel', '1'); }
  }
  function fit() {
    var st = $('#dz-stage'), fr = $('#dz-frame'); if (!st) return;
    var w = DEV[dev][1], sw = st.clientWidth || w; scale = Math.min(1, sw / w);
    var h = Math.max(420, Math.round(($('#dz-wrap').clientHeight || 600) / scale));
    fr.style.width = w + 'px'; fr.style.height = h + 'px'; fr.style.transform = 'scale(' + scale + ')';
    $('#dz-wrap').style.width = Math.round(w * scale) + 'px';
  }
  function setPage(p) {
    page = p; [].forEach.call($('#dz-pagepick').children, function (b) { b.setAttribute('aria-pressed', String(b.dataset.page === p)); });
    $('#dz-frame').src = PAGES[p][1]; renderTree();
  }
  function onFrameLoad() {
    var d = fdoc(); if (!d) return;
    d.addEventListener('click', function (e) {
      var t = e.target.closest ? e.target.closest('[data-el]') : null;
      while (t && !nodes[t.getAttribute('data-el')]) t = t.parentElement && t.parentElement.closest('[data-el]');
      e.preventDefault(); e.stopPropagation();
      if (t) select(t.getAttribute('data-el'), true);
    }, true);
    applyLive();
  }

  /* ---------- בחירה ---------- */
  function select(el, fromFrame) {
    sel = el; renderPanel(); markTree(); mark();
    if (!fromFrame) { var d = fdoc(), t = d && d.querySelector('[data-el="' + el + '"]'); if (t) t.scrollIntoView({ block: 'center', behavior: 'smooth' }); }
  }
  function depth(n, map) { var k = 0, p = n; while (p && p.parent && map[p.parent] && k < 30) { p = map[p.parent]; k++; } return k; }
  function renderTree() {
    var q = ($('#dz-search').value || '').trim().toLowerCase(), list = tree ? (tree.pages[page] || []) : [], map = byPage[page] || {}, groups = {}, order = [];
    list.forEach(function (n) { if (!groups[n.scope]) { groups[n.scope] = []; order.push(n.scope); } groups[n.scope].push(n); });
    var firstEd = -1; order.forEach(function (g, gi) { if (firstEd < 0 && groups[g].some(function (n) { return !n.locked && n.allow.length; })) firstEd = gi; });
    $('#dz-tree').innerHTML = order.map(function (g, gi) {
      var items = groups[g].filter(function (n) { return !q || (n.label + ' ' + n.id + ' ' + g).toLowerCase().indexOf(q) > -1; });
      if (!items.length) return '';
      var open = items.filter(function (n) { return !n.locked && n.allow.length; }).length, nd = items.filter(function (n) { return cur[n.id] && Object.keys(norm(n.id)).length; }).length;
      return '<details class="cp-grp"' + (q || gi === firstEd ? ' open' : '') + '><summary><b>' + esc(g || 'כללי') + '</b><small>' + open + ' ניתנים לעריכה</small>' + (nd ? '<span class="cp-badge is-draft">' + nd + ' שונו</span>' : '') + '</summary><div class="cp-grp__body dz-rows">' +
        items.map(function (n) {
          var editable = !n.locked && n.allow.length, changed = cur[n.id] && Object.keys(norm(n.id)).length;
          return '<button type="button" class="dz-row' + (editable ? '' : ' is-locked') + (n.id === sel ? ' is-sel' : '') + '" data-el="' + esc(n.id) + '" style="--d:' + Math.min(depth(n, map), 6) + '"><span class="dz-row__k">' + esc(KIND_HE[n.kind] || n.kind) + '</span><span class="dz-row__l">' + esc(n.label) + '</span>' + (n.locked ? '<span class="dz-lock" title="נעול" aria-label="נעול">🔒</span>' : '') + (changed ? '<i class="dz-dot" aria-label="שונה"></i>' : '') + '</button>';
        }).join('') + '</div></details>';
    }).join('') || '<p class="cp-empty">לא נמצאו אלמנטים.</p>';
  }
  function markTree() { [].forEach.call(document.querySelectorAll('#dz-tree .dz-row'), function (b) { var on = b.dataset.el === sel; b.classList.toggle('is-sel', on); if (on) { var dt = b.closest('details'); if (dt) dt.open = true; b.scrollIntoView({ block: 'nearest' }); } }); }

  /* ---------- פאנל תכונות ---------- */
  function seg(attr, items, active) {
    return '<div class="dz-seg">' + items.map(function (it) { return '<button type="button" ' + attr + '="' + esc(it[0]) + '" aria-pressed="' + (String(active) === String(it[0])) + '">' + esc(it[1]) + '</button>'; }).join('') + '</div>';
  }
  function renderPanel() {
    var box = $('#dz-panel'); if (!sel || !nodes[sel]) { box.innerHTML = '<p class="cp-hint">בחרו אלמנט ברשימה או לחצו עליו בתצוגה.</p>'; return; }
    var n = nodes[sel], p = norm(sel), o = p[dev] || {}, allow = n.allow || [];
    var h = '<h3 class="dz-h">' + esc(n.label) + ' <small>' + esc(KIND_HE[n.kind] || n.kind) + ' · ' + esc(n.scope || '') + '</small></h3>';
    if (n.locked || !allow.length) {
      box.innerHTML = h + '<p class="cp-warn">' + esc(n.locked ? (LOCK_HE[n.locked] || 'האלמנט נעול.') : 'באלמנט הזה אין תכונות שמותר לשנות.') + '</p>'; return;
    }
    h += '<div class="dz-dev" role="group" aria-label="מכשיר">' + seg('data-dev', Object.keys(DEV).map(function (k) { return [k, DEV[k][0]]; }), dev) + '</div><p class="cp-hint">טאבלט יורש ממחשב, ונייד יורש מטאבלט, אלא אם הוגדר לו ערך משלו.</p>' + inheritedNote(p, dev);
    if (allow.indexOf('color') > -1) h += '<div class="dz-f"><span>צבע</span><div class="dz-sw">' + Object.keys(C.COLORS).map(function (k) { var ok = C.colorOk(k, n); return '<button type="button" data-set="color" data-v="' + k + '" class="dz-c' + (o.color === k ? ' is-on' : '') + (ok ? '' : ' is-off') + '" style="--c:' + C.COLORS[k] + '" title="' + COLOR_HE[k] + (ok ? '' : ' (ניגודיות נמוכה מול הרקע, לא זמין)') + '" aria-label="' + COLOR_HE[k] + (ok ? '' : ', לא זמין: ניגודיות נמוכה') + '"' + (ok ? '' : ' disabled') + ' aria-pressed="' + (o.color === k) + '"></button>'; }).join('') + '<button type="button" class="cp-sm" data-set="color" data-v="">ברירת מחדל</button></div></div>';
    if (allow.indexOf('size') > -1) h += '<div class="dz-f"><span>גודל</span>' + seg('data-set-size', [['', 'ברירת מחדל']].concat(Object.keys(C.SIZES).filter(function (k) { return C.sizeOk(k, n); }).map(function (k) { return [k, SIZE_HE[k] || k]; })), o.size || '') + '</div>';
    if (allow.indexOf('weight') > -1) h += '<div class="dz-f"><span>משקל</span>' + seg('data-set-weight', [['', 'ברירת מחדל']].concat(C.WEIGHTS.filter(function (w) { return C.weightOk(w, n); }).map(function (w) { return [w, w]; })), o.weight || '') + '</div>';
    if (allow.indexOf('space') > -1) {
      var sp = [['', 'ברירת מחדל']].concat(Object.keys(C.SPACES).map(function (k) { return [k, SPACE_HE[k]]; }));
      h += '<div class="dz-f"><span>רווח מעל</span>' + seg('data-set-mt', sp, o.mt || '') + '</div><div class="dz-f"><span>רווח מתחת</span>' + seg('data-set-mb', sp, o.mb || '') + '</div>';
    }
    if (allow.indexOf('hide') > -1) h += '<div class="dz-f"><span>הסתרה</span><div class="dz-seg">' + ['desktop', 'tablet', 'mobile'].map(function (k) { var on = p.hide && p.hide[k]; return '<button type="button" data-hide="' + k + '" aria-pressed="' + !!on + '">' + (on ? 'מוסתר ב' : 'להסתיר ב') + { desktop: 'מחשב', tablet: 'טאבלט', mobile: 'נייד' }[k] + '</button>'; }).join('') + '</div></div>';
    h += '<div class="cp-actions"><button type="button" class="cp-btn cp-btn--ghost" id="dz-reset-el">איפוס האלמנט</button></div>';
    box.innerHTML = h;
  }
  function inheritedNote(p, d) {
    if (d === 'base') return '';
    var from = d === 'tablet' ? [p.base || {}] : [p.base || {}, p.tablet || {}], eff = {}, own = p[d] || {}, parts = [];
    from.forEach(function (o) { Object.keys(o).forEach(function (k) { eff[k] = o[k]; }); });
    var HE = { color: 'צבע', size: 'גודל', weight: 'משקל', mt: 'רווח מעל', mb: 'רווח מתחת' };
    Object.keys(eff).forEach(function (k) { if (own[k] == null) parts.push(HE[k] + ': ' + (k === 'color' ? COLOR_HE[eff[k]] : k === 'size' ? SIZE_HE[eff[k]] : (k === 'mt' || k === 'mb') ? SPACE_HE[eff[k]] : eff[k])); });
    return parts.length ? '<p class="cp-hint">יורש כרגע: ' + esc(parts.join(' · ')) + '</p>' : '';
  }
  function setProp(key, val) {
    if (!loaded || publishing || !sel || !nodes[sel] || nodes[sel].locked) return;
    if (key === 'hide' && nodes[sel].kind === 'section' && !((cur[sel] || {}).hide || {})[val] && !window.confirm('להסתיר את כל האזור הזה ב' + { desktop: 'מחשב', tablet: 'טאבלט', mobile: 'נייד' }[val] + '? תוכן מוסתר לא נראה למבקרים, וגוגל נותן לו פחות משקל (בנייד הוא כמעט לא נסרק). אפשר לבטל אחר כך.')) return;
    pushUndo();
    var p = JSON.parse(JSON.stringify(cur[sel] || {}));
    if (key === 'hide') { p.hide = p.hide || {}; if (p.hide[val]) delete p.hide[val]; else p.hide[val] = true; if (!Object.keys(p.hide).length) delete p.hide; }
    else { p[dev] = p[dev] || {}; if (val === '' || val == null) delete p[dev][key]; else p[dev][key] = key === 'weight' ? Number(val) : val; if (!Object.keys(p[dev]).length) delete p[dev]; }
    if (Object.keys(p).length) cur[sel] = p; else delete cur[sel];
    changed();
  }
  function changed() { applyLive(); renderPanel(); renderTree(); counts(); scheduleSave(); }

  /* ---------- בדיקת פריסה ופרסום ---------- */
  function guardPages(els) {
    var pgs = Object.keys(tree.pages).filter(function (p) { return els.some(function (e) { return byPage[p][e]; }); });
    var map = {}; Object.keys(cur).forEach(function (k) { if (nodes[k]) map[k] = cur[k]; });
    var all = new Map(); Object.keys(nodes).forEach(function (k) { all.set(k, nodes[k]); });
    var gen = C.generate(map, all), out = { ok: true, problems: [], gen: gen };
    var i = 0;
    return pgs.reduce(function (pr, p) {
      return pr.then(function () {
        i++; msg('בודק פריסה: ' + PAGES[p][0] + ' (' + i + '/' + pgs.length + ')...', true);
        return root.LayoutGuard.check({ url: PAGES[p][1], nodes: tree.pages[p], css: gen.css }).then(function (r) {
          if (!r.ok) { out.ok = false; r.violations.slice(0, 4).forEach(function (v) { var n = nodes[v.id]; out.problems.push(PAGES[p][0] + ': "' + (n ? n.label : v.id) + '" ' + v.why + ' (רוחב ' + v.width + ')'); }); r.overflow.slice(0, 2).forEach(function (o) { out.problems.push(PAGES[p][0] + ': גלישה הצידה ברוחב ' + o.width); }); r.errors.forEach(function (x) { out.problems.push(PAGES[p][0] + ': ' + x); }); }
        });
      });
    }, Promise.resolve()).then(function () { return out; });
  }
  function build() {
    return sb.auth.getSession().then(function (ss) {
      var tok = ss && ss.data && ss.data.session && ss.data.session.access_token;
      return fetch('/api/publish', { method: 'POST', headers: { Authorization: 'Bearer ' + (tok || '') } }).then(function (r) { return r.status; }, function () { return 0; });
    }).then(function (code) {
      if (code === 200 || code === 429) buildPending = false;
      if (code === 200) msg('פורסם. האתר יתעדכן בעוד כדקה, אחרי שהבנייה מסתיימת.', true);
      else if (code === 429) msg('השינויים נשמרו. בנייה כבר התחילה לפני רגע, האתר יתעדכן בקרוב.', true);
      else if (code === 503) msg('השינויים נשמרו, אבל חיבור הפרסום לאתר עוד לא הוגדר (משתני סביבה ב-Vercel). עד אז האתר לא יתעדכן.');
      else msg('השינויים נשמרו, אבל הפעלת הבנייה נכשלה (קוד ' + code + '). אפשר ללחוץ "הפעלת בנייה שוב".');
      counts();
    });
  }
  function publish() {
    if (publishing || !loaded) return;
    publishing = true; $('#dz-panel').inert = true; counts();
    var btn = $('#dz-publish'); btn.disabled = true;
    if (!pending().length && buildPending) { build().then(function () { publishing = false; $('#dz-panel').inert = false; counts(); }); return; }
    saveDraft().then(function () {
      var els = pending(); if (!els.length) { msg('אין מה לפרסם.'); return; }
      return guardPages(els).then(function (g) {
        var bad = g.gen.errors.filter(function (e) { return els.indexOf(e.el) > -1; });
        if (!g.ok || bad.length) {
          var lines = g.problems.concat(bad.map(function (e) { return (nodes[e.el] ? nodes[e.el].label : e.el) + ': ' + e.msg; }));
          $('#dz-block').innerHTML = '<b>הפרסום נעצר: השינוי היה פוגע בפריסה.</b><ul>' + lines.slice(0, 8).map(function (l) { return '<li>' + esc(l) + '</li>'; }).join('') + '</ul><p>הטיוטה נשמרה, והאתר לא השתנה. אפשר לתקן, לבטל (↶) או לאפס את האלמנט.</p>'; $('#dz-block').hidden = false; msg('');
          return;
        }
        $('#dz-block').hidden = true; msg('מפרסם...', true);
        var snapshot = {}; Object.keys(cur).forEach(function (k) { if (nodes[k]) { var n = norm(k); if (Object.keys(n).length) snapshot[k] = n; } });
        return Promise.all(els.map(function (el) {
          var props = norm(el), r = rows[el] || {};
          return sb.from('design_overrides').upsert({ el: el, props: props, draft: null, revision: (r.revision || 0) + 1 }).select().then(function (u) { if (u.error || !u.data || !u.data[0]) throw new Error('save'); rows[el] = u.data[0]; });
        })).then(function () { return sb.from('revisions').insert({ entity: 'design', ref: 'all', data: { map: snapshot } }); })
          .then(function () { buildPending = true; counts(); return build(); });
      });
    }).catch(function () { msg('הפרסום נכשל. נסו שוב.'); }).then(function () { publishing = false; $('#dz-panel').inert = false; counts(); });
  }

  /* ---------- היסטוריה ---------- */
  function showHist() {
    var box = $('#dz-hist'); box.hidden = !box.hidden; $('#dz-hist-btn').setAttribute('aria-expanded', String(!box.hidden)); if (box.hidden) return;
    box.innerHTML = '<p class="cp-hint">טוען...</p>';
    sb.from('revisions').select('id,created_at,data').eq('entity', 'design').eq('ref', 'all').order('created_at', { ascending: false }).limit(20).then(function (r) {
      var l = (r.data || []); if (!l.length) { box.innerHTML = '<p class="cp-hint">עוד אין גרסאות מפורסמות.</p>'; return; }
      box.innerHTML = l.map(function (v, i) { var n = Object.keys((v.data && v.data.map) || {}).length; return '<div class="cp-hist__row"><span>' + esc(new Date(v.created_at).toLocaleString('he-IL', { dateStyle: 'short', timeStyle: 'short' })) + ' · ' + n + ' אלמנטים' + (i === 0 ? ' (האחרונה)' : '') + '</span><button type="button" class="cp-sm" data-restore="' + v.id + '">שחזור כטיוטה</button></div>'; }).join('');
      box._v = l;
    });
  }

  /* ---------- בנייה והאזנות ---------- */
  function mount(opts) {
    if (hasMounted) return; hasMounted = true; sb = opts.sb; C = root.DesignCore;
    if (!C || !root.LayoutGuard) { msg('חסרים קבצי העורך. רעננו את הדף.'); return; }
    var pane = $('#pane-design');
    $('#dz-pagepick').innerHTML = Object.keys(PAGES).map(function (k) { return '<button type="button" data-page="' + k + '" aria-pressed="' + (k === page) + '">' + esc(PAGES[k][0]) + '</button>'; }).join('');
    $('#dz-devpick').innerHTML = Object.keys(DEV).map(function (k) { return '<button type="button" data-dev="' + k + '" aria-pressed="' + (k === dev) + '">' + DEV[k][0] + '</button>'; }).join('');
    $('#dz-pagepick').addEventListener('click', function (e) { var b = e.target.closest('[data-page]'); if (b) { sel = null; renderPanel(); setPage(b.dataset.page); } });
    $('#dz-devpick').addEventListener('click', function (e) { var b = e.target.closest('[data-dev]'); if (b) setDev(b.dataset.dev); });
    $('#dz-search').addEventListener('input', renderTree);
    $('#dz-tree').addEventListener('click', function (e) { var b = e.target.closest('.dz-row'); if (b) select(b.dataset.el, false); });
    $('#dz-frame').addEventListener('load', onFrameLoad);
    $('#dz-block').addEventListener('click', function (e) { if (e.target.id === 'dz-retry') { msg('טוען...', true); load(); } });
    $('#dz-panel').addEventListener('click', function (e) {
      var t = e.target.closest('button'); if (!t) return;
      var sig = [].map.call(t.attributes, function (a) { return [a.name, a.value]; }).filter(function (a) { return /^data-/.test(a[0]); });
      setTimeout(function () { var cand = [].filter.call(document.querySelectorAll('#dz-panel button'), function (b) { return sig.length && sig.every(function (a) { return b.getAttribute(a[0]) === a[1]; }); })[0]; if (cand && !document.activeElement.closest('#dz-panel')) cand.focus(); }, 0);
      if (t.dataset.dev) { setDev(t.dataset.dev); return; }
      if (t.dataset.set === 'color') { setProp('color', t.dataset.v); return; }
      if (t.hasAttribute('data-hide')) { setProp('hide', t.dataset.hide); return; }
      var map = { 'data-set-size': 'size', 'data-set-weight': 'weight', 'data-set-mt': 'mt', 'data-set-mb': 'mb' };
      for (var a in map) if (t.hasAttribute(a)) { setProp(map[a], t.getAttribute(a)); return; }
      if (t.id === 'dz-reset-el' && sel) { pushUndo(); delete cur[sel]; changed(); }
    });
    $('#dz-undo').addEventListener('click', function () { if (loaded && !publishing && undo.length) { redo.push(snap()); cur = JSON.parse(undo.pop()); changed(); } });
    $('#dz-redo').addEventListener('click', function () { if (loaded && !publishing && redo.length) { undo.push(snap()); cur = JSON.parse(redo.pop()); changed(); } });
    $('#dz-ba').addEventListener('click', function () { before = !before; this.setAttribute('aria-pressed', String(before)); this.textContent = before ? 'מציג: לפני (השינויים כבויים)' : 'לפני / אחרי'; applyLive(); });
    $('#dz-reset-page').addEventListener('click', function () {
      var n = Object.keys(byPage[page] || {}).filter(function (k) { return cur[k]; }).length;
      if (!loaded || publishing || !n || !window.confirm('לאפס את כל שינויי העיצוב בעמוד "' + PAGES[page][0] + '" (' + n + ' אלמנטים)? אפשר לבטל בחץ.')) return;
      pushUndo(); Object.keys(byPage[page]).forEach(function (k) { delete cur[k]; }); changed();
    });
    $('#dz-publish').addEventListener('click', publish);
    $('#dz-hist-btn').addEventListener('click', showHist);
    $('#dz-hist').addEventListener('click', function (e) {
      var b = e.target.closest('[data-restore]'); if (!b) return;
      var v = ($('#dz-hist')._v || []).filter(function (x) { return String(x.id) === b.dataset.restore; })[0]; if (!v) return;
      pushUndo(); var m = (v.data && v.data.map) || {}, next = {}; Object.keys(m).forEach(function (k) { if (nodes[k]) next[k] = m[k]; }); cur = next; changed(); msg('הגרסה נטענה כטיוטה. לחצו "פרסום" כדי להעלות אותה.', true);
    });
    document.addEventListener('keydown', function (e) {
      if (pane.hidden || !(e.ctrlKey || e.metaKey) || /INPUT|TEXTAREA|SELECT/.test((document.activeElement || {}).tagName || '')) return;
      if (e.key === 'z') { e.preventDefault(); (e.shiftKey ? $('#dz-redo') : $('#dz-undo')).click(); } else if (e.key === 'y') { e.preventDefault(); $('#dz-redo').click(); }
    });
    root.addEventListener('resize', fit);
    if (root.ResizeObserver) { stageObs = new ResizeObserver(fit); stageObs.observe($('#dz-stage')); }
    renderPanel(); setPage('index'); load();
  }
  function setDev(d) {
    dev = d; [].forEach.call($('#dz-devpick').children, function (b) { b.setAttribute('aria-pressed', String(b.dataset.dev === d)); });
    fit(); renderPanel(); setTimeout(applyLive, 150);
  }

  root.DesignEditor = {
    mount: mount, fit: fit, reload: load,
    isDirty: function () { return hasMounted && loaded && toSave().length > 0; },
    flush: function () { return hasMounted ? saveDraft() : Promise.resolve(); },
    count: function () { return hasMounted ? pending().length : 0; }
  };
})(window);
