/* מערכת ניהול. בצד הלקוח רק ה-anon key (ציבורי מטבעו). ההרשאה נאכפת ב-RLS במסד הנתונים. */
(function () {
  'use strict';
  var ALLOWED = 'ankavagrafi@gmail.com';
  var BUCKET = 'project-images';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var CFG = window.SB_CONFIG || {};
  var els = { login: $('#login'), app: $('#app'), user: $('#user'), mail: $('#user-mail'), loginMsg: $('#login-msg'), gmsg: $('#global-msg') };
  var sb, projects = [], leads = [], editing = null, pending = { desktop: null, mobile: null };

  function show(el, on) { el.hidden = !on; }
  function flash(el, text, ok) { el.textContent = text || ''; el.classList.toggle('ok', !!ok); }

  if (!CFG.url || !CFG.anonKey || !window.supabase) {
    show(els.login, true);
    flash(els.loginMsg, 'המערכת עדיין לא חוברה למסד הנתונים (חסרה הגדרת Supabase).');
    $('#google').disabled = true;
    return;
  }
  sb = window.supabase.createClient(CFG.url, CFG.anonKey, { auth: { persistSession: true, detectSessionInUrl: true, flowType: 'pkce' } });

  /* ---------- התחברות ---------- */
  $('#google').addEventListener('click', function () {
    flash(els.loginMsg, '');
    sb.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin + '/admin', queryParams: { prompt: 'select_account' } } })
      .then(function (r) { if (r.error) flash(els.loginMsg, 'ההתחברות נכשלה. נסו שוב.'); });
  });
  $('#logout').addEventListener('click', function () { sb.auth.signOut(); });

  function gate(session) {
    if (!session) { show(els.app, false); show(els.user, false); show(els.login, true); return; }
    var email = ((session.user && session.user.email) || '').toLowerCase();
    if (email !== ALLOWED) {
      show(els.app, false); show(els.user, false); show(els.login, true);
      flash(els.loginMsg, 'אין הרשאה');
      sb.auth.signOut();
      return;
    }
    flash(els.loginMsg, '');
    els.mail.textContent = email;
    show(els.login, false); show(els.user, true); show(els.app, true);
    loadProjects(); loadLeads(); loadPages(); loadTexts();
    tab(new URLSearchParams(location.search).get('view') || 'overview', false);
  }
  sb.auth.getSession().then(function (r) { gate(r.data && r.data.session); });
  sb.auth.onAuthStateChange(function (ev, session) { if (ev === 'SIGNED_IN' || ev === 'SIGNED_OUT') gate(session); });

  /* ---------- ניווט: סיידבר, ?view= ב-URL, אזהרה לפני יציאה עם שינויים ---------- */
  var VIEWS = { overview: 'סקירה', leads: 'פניות', projects: 'פרויקטים', pages: 'עמודים משפטיים', texts: 'טקסטי האתר' };
  var dirtyPages = false, dirtyTexts = false, formDirty = false, curView = 'overview';
  function tab(name, push) {
    if (!VIEWS[name]) name = 'overview';
    if (name !== curView && curView === 'pages' && dirtyPages && !window.confirm('יש שינויים בעמוד המשפטי שעדיין לא נשמרו כטיוטה. לעבור בלי לשמור?')) return;
    if (name !== curView && curView === 'texts' && dirtyTexts) { saveTextDrafts(); }
    curView = name;
    if (name === 'texts' && !$('#tx-frame').getAttribute('src')) setFramePage('index');
    Object.keys(VIEWS).forEach(function (n) {
      $('#tab-' + n).setAttribute('aria-selected', String(n === name));
      show($('#pane-' + n), n === name);
    });
    $('#view-title').textContent = VIEWS[name];
    document.title = VIEWS[name] + ' — ניהול — Sara Ankava';
    if (push) { try { history.pushState({ v: name }, '', '?view=' + name); } catch (x) {} }
    if (name === 'overview') renderOverview();
  }
  Object.keys(VIEWS).forEach(function (n) { $('#tab-' + n).addEventListener('click', function () { tab(n, true); }); });
  window.addEventListener('popstate', function () { tab(new URLSearchParams(location.search).get('view') || 'overview', false); });
  window.addEventListener('beforeunload', function (e) { if (dirtyPages || formDirty || dirtyTexts) { e.preventDefault(); e.returnValue = ''; } });
  $('#side-tg').addEventListener('click', function () {
    var c = $('#shell').classList.toggle('is-collapsed');
    this.setAttribute('aria-expanded', String(!c));
    try { localStorage.setItem('cp-side', c ? '1' : '0'); } catch (x) {}
  });
  try { if (localStorage.getItem('cp-side') === '1') { $('#shell').classList.add('is-collapsed'); $('#side-tg').setAttribute('aria-expanded', 'false'); } } catch (x) {}

  /* סקירה: מה דורש תשומת לב */
  function renderOverview() {
    var nNew = leads.filter(function (l) { return l.status === 'new'; }).length;
    var onHome = projects.filter(function (p) { return p.published && p.show_on_home; }).length;
    var drafts = Object.keys(pgData || {}).filter(function (k) { return pgData[k].draft; }).length;
    var tdr = typeof txCount === 'function' ? txCount() : 0, tb = $('#texts-draft'); tb.hidden = !tdr; tb.textContent = tdr;
    var gaps = 0; Object.keys(pgData || {}).forEach(function (k) { gaps += (String(pgData[k].content || '').match(LH.GAP) || []).length; });
    var cards = [
      { v: 'leads', n: nNew, t: 'פניות חדשות', s: leads.length + ' פניות בסך הכול' },
      { v: 'projects', n: Math.min(onHome, 4) + '/4', t: 'פרויקטים בדף הבית', s: onHome > 4 ? 'מסומנים ' + onHome + ', יוצגו 4 הראשונים' : projects.length + ' פרויקטים בסך הכול' },
      { v: 'pages', n: drafts, t: 'טיוטות שלא פורסמו', s: 'בעמודים המשפטיים' },
      { v: 'texts', n: tdr, t: 'טקסטים בטיוטה', s: 'בטקסטי האתר, ממתינים לפרסום' },
      { v: 'pages', n: gaps, t: 'פרטים חסרים ([...])', s: 'בעמודים המשפטיים, מודגשים בצהוב' }
    ];
    $('#ov-cards').innerHTML = cards.map(function (c) {
      return '<button type="button" class="cp-card' + (c.n && c.n !== '0/4' ? ' is-attn' : '') + '" data-go="' + c.v + '"><b class="cp-card__n">' + esc(c.n) + '</b><span class="cp-card__t">' + esc(c.t) + '</span><small>' + esc(c.s) + '</small></button>';
    }).join('');
  }
  $('#ov-cards').addEventListener('click', function (e) { var b = e.target.closest('[data-go]'); if (b) tab(b.dataset.go, true); });

  /* ---------- פרויקטים ---------- */
  function loadProjects() {
    sb.from('projects').select('*').order('position', { ascending: true }).order('created_at', { ascending: true })
      .then(function (r) {
        if (r.error) { flash(els.gmsg, 'טעינת הפרויקטים נכשלה.'); return; }
        flash(els.gmsg, '');
        projects = r.data || []; renderProjects(); renderOverview();
      });
  }
  var MAX_HOME = 4;
  function homeIds() {
    return projects.filter(function (p) { return p.published && p.show_on_home; }).map(function (p) { return p.id; });
  }
  function renderProjects() {
    var ul = $('#projects'), hid = homeIds(), warn = $('#home-warn'), cnt = $('#home-count');
    cnt.textContent = 'בדף הבית: ' + Math.min(hid.length, MAX_HOME) + ' מתוך ' + MAX_HOME;
    warn.hidden = hid.length <= MAX_HOME;
    warn.textContent = hid.length > MAX_HOME ? 'סומנו ' + hid.length + ' פרויקטים להצגה בדף הבית, אבל יש מקום ל-' + MAX_HOME + '. באתר יוצגו ' + MAX_HOME + ' הראשונים לפי הסדר. כדי לשנות, בטלו את "בדף הבית" באחד מהם או שנו את הסדר.' : '';
    if (!projects.length) { ul.innerHTML = '<li class="cp-empty">עוד אין פרויקטים. לחצו על "הוספת פרויקט".</li>'; return; }
    ul.innerHTML = projects.map(function (p, i) {
      var m0 = (p.mockups && p.mockups[0]) || {}, thumb = m0.desktop && m0.desktop.type === 'image' ? m0.desktop.url : p.desktop_image_url;
      var nm = (p.mockups || []).length, vid = (p.mockups || []).some(function (x) { return (x.desktop && x.desktop.type === 'video') || (x.mobile && x.mobile.type === 'video'); });
      var img = thumb ? '<img class="cp-thumb" src="' + esc(thumb) + '" alt="" loading="lazy">' : '<span class="cp-thumb">' + (vid ? 'סרטון' : (p.mockup_key ? 'מובנה' : '')) + '</span>';
      var hi = hid.indexOf(p.id), over = hi >= MAX_HOME;
      return '<li class="cp-row' + (over ? ' cp-over' : '') + (p.published ? '' : ' cp-draft') + '" data-id="' + p.id + '" data-i="' + i + '">' +
        '<span class="cp-handle" aria-label="גרירה לשינוי סדר" role="img">⠿</span>' + img +
        '<div class="cp-info"><b>' + esc(p.title) +
        (p.is_placeholder ? '<span class="cp-tag cp-tag--ph">מקום שמור</span>' : '') +
        (p.is_concept ? '<span class="cp-tag">קונספט</span>' : '') +
        (nm > 1 ? '<span class="cp-tag">2 מוקאפים</span>' : '') +
        (over ? '<span class="cp-tag cp-tag--warn">לא יוצג, מעל ' + MAX_HOME + '</span>' : '') + '</b>' +
        '<small>' + esc(p.is_placeholder ? 'כרטיס "הפרויקט הבא שלכם"' : (p.type || '')) + '</small></div>' +
        '<div class="cp-ctl">' +
        '<button type="button" class="cp-sm" data-act="up" aria-label="הזזה למעלה"' + (i === 0 ? ' disabled' : '') + '>↑</button>' +
        '<button type="button" class="cp-sm" data-act="down" aria-label="הזזה למטה"' + (i === projects.length - 1 ? ' disabled' : '') + '>↓</button>' +
        '<label class="cp-sw"><input type="checkbox" data-act="pub"' + (p.published ? ' checked' : '') + '><i></i>' + (p.published ? 'מפורסם' : 'טיוטה') + '</label>' +
        '<label class="cp-sw"><input type="checkbox" data-act="home"' + (p.show_on_home ? ' checked' : '') + '><i></i>בדף הבית</label>' +
        '<button type="button" class="cp-sm" data-act="edit">עריכה</button>' +
        '<button type="button" class="cp-sm" data-act="del">מחיקה</button>' +
        '</div></li>';
    }).join('');
  }
  function byId(id) { return projects.filter(function (p) { return p.id === id; })[0]; }
  function savePositions() {
    return Promise.all(projects.map(function (p, i) {
      if (p.position === i) return null;
      p.position = i;
      return sb.from('projects').update({ position: i }).eq('id', p.id);
    })).then(function (rs) {
      var bad = rs.filter(function (r) { return r && r.error; });
      flash(els.gmsg, bad.length ? 'שמירת הסדר נכשלה.' : '', false);
      if (bad.length) loadProjects();
    });
  }
  function move(from, to) {
    if (to < 0 || to >= projects.length || from === to) return;
    var it = projects.splice(from, 1)[0]; projects.splice(to, 0, it);
    renderProjects(); savePositions();
  }
  $('#projects').addEventListener('click', function (e) {
    var b = e.target.closest('button[data-act]'); if (!b) return;
    var row = b.closest('.cp-row'), i = +row.dataset.i, p = byId(row.dataset.id), act = b.dataset.act;
    if (act === 'up') move(i, i - 1);
    else if (act === 'down') move(i, i + 1);
    else if (act === 'edit') openForm(p);
    else if (act === 'del') askDelete(p);
  });
  $('#projects').addEventListener('change', function (e) {
    var b = e.target.closest('input[data-act]'); if (!b) return;
    var p = byId(b.closest('.cp-row').dataset.id), val = b.checked, field = b.dataset.act === 'home' ? 'show_on_home' : 'published', patch = {};
    patch[field] = val;
    sb.from('projects').update(patch).eq('id', p.id).then(function (r) {
      if (r.error) { flash(els.gmsg, 'העדכון נכשל.'); b.checked = !val; return; }
      p[field] = val; flash(els.gmsg, ''); renderProjects();
    });
  });
  /* גרירה: SortableJS (עכבר ומגע). נשמר מיד בסיום הגרירה */
  if (window.Sortable) {
    Sortable.create($('#projects'), {
      handle: '.cp-handle', draggable: '.cp-row', animation: 160, ghostClass: 'is-ghost', chosenClass: 'is-drag',
      delay: 120, delayOnTouchOnly: true, touchStartThreshold: 6,
      onEnd: function () {
        var ids = [].map.call($('#projects').querySelectorAll('.cp-row'), function (r) { return r.dataset.id; });
        var next = ids.map(byId).filter(Boolean);
        if (next.length !== projects.length) { renderProjects(); return; }
        projects = next; renderProjects(); savePositions();
      }
    });
  }

  /* ---------- טופס פרויקט ---------- */
  var form = $('#pform');
  var MAXW = { desktop: 1600, mobile: 900 };
  var VIDEO_MAX = 25 * 1024 * 1024;
  var KINDS = ['desktop', 'mobile'], KIND_HE = { desktop: 'דסקטופ', mobile: 'מובייל' };
  /* מוקאפים בטופס: עד שניים. כל מוקאפ = { desktop: slot, mobile: slot }, slot = { type: 'image'|'video', url, file, preview } */
  var mk = [];
  function slotFromJson(s) { return s && s.url ? { type: s.type === 'video' ? 'video' : 'image', url: s.url, file: null, preview: null } : null; }
  function mkFromProject(p) {
    var sets = [];
    if (p && Array.isArray(p.mockups) && p.mockups.length) {
      p.mockups.slice(0, 2).forEach(function (s) { sets.push({ desktop: slotFromJson(s.desktop), mobile: slotFromJson(s.mobile) }); });
    } else if (p && (p.desktop_image_url || p.mobile_image_url)) {
      sets.push({ desktop: slotFromJson(p.desktop_image_url && { type: 'image', url: p.desktop_image_url }), mobile: slotFromJson(p.mobile_image_url && { type: 'image', url: p.mobile_image_url }) });
    }
    if (!sets.length) sets.push({ desktop: null, mobile: null });
    return sets;
  }
  function slotUrl(s) { return s ? (s.preview || s.url) : null; }
  function mediaHtml(s, cls) {
    var u = slotUrl(s); if (!u) return '';
    return s.type === 'video' ? '<video class="' + cls + '" src="' + esc(u) + '" muted loop autoplay playsinline></video>' : '<img class="' + cls + '" src="' + esc(u) + '" alt="">';
  }
  function renderMk() {
    var box = $('#mk-sets');
    box.innerHTML = mk.map(function (set, i) {
      var cards = KINDS.map(function (k) {
        var s = set[k], t = s ? s.type : 'image';
        return '<div class="cp-slot" data-set="' + i + '" data-kind="' + k + '"><div class="cp-slot__h"><b>' + KIND_HE[k] + '</b>' +
          '<span class="cp-seg cp-seg--sm" role="group" aria-label="סוג מדיה ל' + KIND_HE[k] + '"><button type="button" data-mk="type" data-type="image" aria-pressed="' + (t === 'image') + '">תמונה</button><button type="button" data-mk="type" data-type="video" aria-pressed="' + (t === 'video') + '">סרטון גלילה</button></span></div>' +
          '<div class="cp-slot__prev">' + (s ? mediaHtml(s, '') : '<span>אין קובץ</span>') + '</div>' +
          '<input type="file" data-mk="file" accept="' + (t === 'video' ? 'video/mp4,video/webm' : 'image/*') + '" aria-label="קובץ ' + KIND_HE[k] + ' למוקאפ ' + (i + 1) + '">' +
          (s ? '<button type="button" class="cp-sm" data-mk="clear">הסרה</button>' : '') + '</div>';
      }).join('');
      return '<fieldset class="cp-mkset"><legend>מוקאפ ' + (i + 1) + '</legend><div class="cp-mkgrid">' + cards + '</div>' +
        (i === 1 ? '<button type="button" class="cp-sm" data-mk="remove-set">הסרת מוקאפ 2</button>' : '') + '</fieldset>';
    }).join('') + (mk.length < 2 ? '<button type="button" class="cp-btn" data-mk="add-set">הוספת מוקאפ שני</button>' : '');
    show($('#interval-field'), mk.length > 1);
    renderPreview();
  }
  function slotOf(el) { var c = el.closest('.cp-slot'); return c ? { i: +c.dataset.set, k: c.dataset.kind } : null; }
  $('#mk-sets').addEventListener('click', function (e) {
    var b = e.target.closest('[data-mk]'); if (!b || b.tagName === 'INPUT') return;
    var act = b.dataset.mk, sl = slotOf(b);
    if (act === 'add-set') { mk.push({ desktop: null, mobile: null }); }
    else if (act === 'remove-set') { mk.splice(1, 1); }
    else if (act === 'clear' && sl) { mk[sl.i][sl.k] = null; }
    else if (act === 'type' && sl) {
      var cur = mk[sl.i][sl.k], t = b.dataset.type;
      if (!cur || cur.type !== t) mk[sl.i][sl.k] = { type: t, url: null, file: null, preview: null };
      if (!mk[sl.i][sl.k].url && !mk[sl.i][sl.k].file) { /* סוג נבחר ועוד אין קובץ */ }
    }
    renderMk();
  });
  $('#mk-sets').addEventListener('change', function (e) {
    var inp = e.target.closest('input[data-mk="file"]'); if (!inp) return;
    var sl = slotOf(inp), f = inp.files[0], m = $('#pform-msg'), cur = mk[sl.i][sl.k], t = cur ? cur.type : 'image';
    if (!f) return;
    if (t === 'video') {
      if (!/^video\/(mp4|webm)$/.test(f.type)) { flash(m, 'סרטון חייב להיות mp4 או webm.'); inp.value = ''; return; }
      if (f.size > VIDEO_MAX) { flash(m, 'הסרטון גדול מ-25MB. אפשר לכווץ אותו (למשל HandBrake) ולהעלות שוב.'); inp.value = ''; return; }
    } else {
      if (!/^image\/(jpeg|png|webp|gif)$/.test(f.type)) { flash(m, 'רק תמונות JPG, PNG, WebP או GIF.'); inp.value = ''; return; }
      if (f.size > 20 * 1024 * 1024) { flash(m, 'התמונה גדולה מ-20MB.'); inp.value = ''; return; }
    }
    flash(m, '');
    mk[sl.i][sl.k] = { type: t, url: cur ? cur.url : null, file: f, preview: URL.createObjectURL(f) };
    renderMk();
  });
  /* תצוגה מקדימה חיה: הכרטיס כפי שיופיע, ולכל מוקאפ חלון דסקטופ וטלפון */
  function renderPreview() {
    var isPh = !!(editing && editing.is_placeholder);
    var title = form.title.value.trim() || 'שם הפרויקט', desc = form.description.value.trim(), link = form.link.value.trim();
    var tags = (form.type.value || '').split('·').map(function (t) { return t.trim(); }).filter(Boolean);
    if (form.is_concept.checked && !tags.some(function (t) { return t.toUpperCase() === 'CONCEPT'; })) tags.unshift('CONCEPT');
    var frames = mk.map(function (set, i) {
      var d = set.desktop ? mediaHtml(set.desktop, '') : '', m = set.mobile ? '<div class="cp-pv__phone">' + mediaHtml(set.mobile, '') + '</div>' : '';
      if (!d && !m) return i === 0 ? '<div class="cp-pv__win cp-pv__win--note">' + (editing && editing.mockup_key ? 'מוקאפ מובנה (נשאר כמו שהוא)' : 'עוד לא הועלה מוקאפ') + '</div>' : '';
      return '<div class="cp-pv__fr"><small>מוקאפ ' + (i + 1) + '</small><div class="cp-pv__mk"><div class="cp-pv__win">' + d + '</div>' + m + '</div></div>';
    }).join('');
    $('#pprev').innerHTML = '<div class="cp-pv"><div class="cp-pv__tx"><h3>' + esc(title) + '</h3>' + (desc ? '<p>' + esc(desc) + '</p>' : '') +
      (tags.length && !isPh ? '<ul>' + tags.map(function (t) { return '<li' + (t.toUpperCase() === 'CONCEPT' ? ' class="y"' : '') + '>' + esc(t) + '</li>'; }).join('') + '</ul>' : '') +
      (isPh ? '<span class="cp-pv__btn">בואו נדבר</span>' : (link ? '<span class="cp-pv__btn">לפרויקט המלא</span>' : '')) + '</div><div class="cp-pv__frs">' + frames + '</div></div>' +
      '<p class="cp-hint">' + (mk.filter(function (s) { return s.desktop || s.mobile; }).length > 1 ? 'שני המוקאפים יתחלפו באתר כל ' + (+$('#mk-interval').value || 5) + ' שניות. ' : '') +
      (form.published.checked ? (form.show_on_home.checked ? 'יופיע בדף הבית (אם נכנס בארבעת הראשונים) ובעמוד הפרויקטים.' : 'יופיע בעמוד הפרויקטים בלבד.') : 'טיוטה: לא יופיע באתר.') + '</p>';
  }
  function openForm(p) {
    editing = p || null;
    var isPh = !!(p && p.is_placeholder);
    mk = mkFromProject(p);
    $('#pform-title').textContent = p ? 'עריכת פרויקט' : 'פרויקט חדש';
    form.title.value = p ? p.title : ''; form.type.value = p ? (p.type || '') : '';
    form.description.value = p ? (p.description || '') : ''; form.link.value = p ? (p.link || '') : '';
    form.is_concept.checked = !!(p && p.is_concept); form.published.checked = !!(p && p.published); form.show_on_home.checked = !!(p && p.show_on_home);
    $('#mk-interval').value = p && p.mockup_interval ? p.mockup_interval : 5;
    ['type-field', 'concept-field', 'imgs-field'].forEach(function (id) { show($('#' + id), !isPh); });
    $('#link-label').textContent = isPh ? 'לאן הכפתור מוביל' : 'קישור (לא חובה)';
    $('#mk-builtin').hidden = !(p && p.mockup_key && !(p.mockups && p.mockups.length));
    flash($('#pform-msg'), ''); renderMk(); formDirty = false; show($('#modal'), true); form.title.focus();
  }
  function closeForm(force) {
    if (force !== true && formDirty && !window.confirm('יש שינויים שלא נשמרו. לסגור בלי לשמור?')) return;
    formDirty = false; show($('#modal'), false); editing = null;
  }
  $('#add').addEventListener('click', function () { openForm(null); });
  $('#pcancel').addEventListener('click', function () { closeForm(); });
  $('#modal').addEventListener('click', function (e) { if (e.target === $('#modal')) closeForm(); });
  $('#pform').addEventListener('input', function () { formDirty = true; });
  form.addEventListener('input', renderPreview);
  form.addEventListener('change', renderPreview);
  /* הקטנה אוטומטית והמרה ל-WebP בדפדפן לפני ההעלאה (חוסך משקל ואחסון) */
  function toWebp(file, maxW) {
    return new Promise(function (res, rej) {
      var url = URL.createObjectURL(file), img = new Image();
      img.onload = function () {
        var k = Math.min(1, maxW / img.naturalWidth), c = document.createElement('canvas');
        c.width = Math.max(1, Math.round(img.naturalWidth * k)); c.height = Math.max(1, Math.round(img.naturalHeight * k));
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url);
        c.toBlob(function (b) { b ? res(b) : rej(new Error('convert')); }, 'image/webp', 0.82);
      };
      img.onerror = function () { URL.revokeObjectURL(url); rej(new Error('decode')); };
      img.src = url;
    });
  }
  function uuid() { return crypto.randomUUID ? crypto.randomUUID() : Date.now() + '-' + Math.random().toString(16).slice(2); }
  function putFile(path, blob, type) {
    return sb.storage.from(BUCKET).upload(path, blob, { contentType: type, cacheControl: '31536000', upsert: false }).then(function (r) {
      if (r.error) throw r.error;
      return sb.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
    });
  }
  function upload(slot, kind) {
    if (slot.type === 'video') return putFile(uuid() + (slot.file.type === 'video/webm' ? '.webm' : '.mp4'), slot.file, slot.file.type);
    return toWebp(slot.file, MAXW[kind]).then(function (blob) {
      return putFile(uuid() + (blob.type === 'image/webp' ? '.webp' : '.png'), blob, blob.type);
    });
  }
  function storagePath(u) { var i = u ? u.indexOf('/' + BUCKET + '/') : -1; return i < 0 ? null : decodeURIComponent(u.slice(i + BUCKET.length + 2).split('?')[0]); }
  function projectUrls(p) {
    var out = [p.desktop_image_url, p.mobile_image_url];
    (p.mockups || []).forEach(function (s) { out.push(s.desktop && s.desktop.url, s.mobile && s.mobile.url); });
    return out.filter(Boolean);
  }
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var m = $('#pform-msg'), btn = $('#psave');
    var title = form.title.value.trim();
    if (!title) { flash(m, 'חסר שם לפרויקט.'); form.title.focus(); return; }
    var link = form.link.value.trim();
    if (link && !/^(https?:\/\/|\/|#)/i.test(link)) { flash(m, 'הקישור חייב להתחיל ב-https:// (או / או # לקישור פנימי).'); form.link.focus(); return; }
    var interval = Math.min(60, Math.max(2, parseInt($('#mk-interval').value, 10) || 5));
    var isPh = !!(editing && editing.is_placeholder);
    btn.disabled = true; flash(m, 'מעלה ושומר...', true);
    var row = { title: title, description: form.description.value.trim() || null, link: link || null, published: form.published.checked, show_on_home: form.show_on_home.checked };
    if (!isPh) { row.type = form.type.value.trim() || null; row.is_concept = form.is_concept.checked; row.mockup_interval = interval; }
    var jobs = [];
    mk.forEach(function (set) { KINDS.forEach(function (k) { var s = set[k]; if (s && s.file) jobs.push(upload(s, k).then(function (u) { s.url = u; })); }); });
    Promise.all(isPh ? [] : jobs).then(function () {
      if (!isPh) {
        var sets = mk.map(function (set) {
          var o = {};
          KINDS.forEach(function (k) { if (set[k] && set[k].url) o[k] = { type: set[k].type, url: set[k].url }; });
          return o;
        }).filter(function (o) { return o.desktop || o.mobile; });
        row.mockups = sets;
        /* עמודות התמונה הישנות נשארות מסונכרנות (תמונה ראשונה בלבד) כגיבוי וכתמונה ממוזערת */
        var first = sets[0] || {};
        row.desktop_image_url = first.desktop && first.desktop.type === 'image' ? first.desktop.url : null;
        row.mobile_image_url = first.mobile && first.mobile.type === 'image' ? first.mobile.url : null;
      }
      if (editing) return sb.from('projects').update(row).eq('id', editing.id);
      row.position = projects.length;
      return sb.from('projects').insert(row);
    }).then(function (r) {
      if (r.error) throw r.error;
      /* קבצים שהוסרו או הוחלפו נמחקים מהאחסון, כדי שלא יצטברו קבצים יתומים */
      if (editing && !isPh) {
        var keep = {}; (row.mockups || []).forEach(function (s) { KINDS.forEach(function (k) { if (s[k]) keep[s[k].url] = 1; }); });
        var gone = projectUrls(editing).filter(function (u) { return !keep[u]; }).map(storagePath).filter(Boolean);
        if (gone.length) sb.storage.from(BUCKET).remove(gone);
      }
      closeForm(true); loadProjects();
    }).catch(function () { flash(m, 'השמירה נכשלה. בדקו את ההרשאות והקבצים ונסו שוב.'); })
      .then(function () { btn.disabled = false; });
  });

  /* ---------- מחיקה ---------- */
  var toDelete = null;
  function askDelete(p) { toDelete = p; $('#confirm-t').textContent = 'למחוק את הפרויקט?'; $('#confirm-p').textContent = '"' + p.title + '" יימחק לצמיתות.'; show($('#confirm'), true); $('#confirm-no').focus(); }
  function askDeleteLead(l) { toDelete = { lead: true, id: l.id }; $('#confirm-t').textContent = 'למחוק את הפנייה?'; $('#confirm-p').textContent = 'הפנייה של "' + l.name + '" תימחק לצמיתות ולא ניתן לשחזר אותה.'; show($('#confirm'), true); $('#confirm-no').focus(); }
  $('#confirm-no').addEventListener('click', function () { toDelete = null; show($('#confirm'), false); });
  $('#confirm-yes').addEventListener('click', function () {
    var p = toDelete; if (!p) return; show($('#confirm'), false); toDelete = null;
    if (p.lead) {
      sb.from('leads').delete().eq('id', p.id).then(function (r) {
        if (r.error) { flash(els.gmsg, 'מחיקת הפנייה נכשלה.'); return; }
        flash(els.gmsg, ''); loadLeads();
      });
      return;
    }
    sb.from('projects').delete().eq('id', p.id).then(function (r) {
      if (r.error) { flash(els.gmsg, 'המחיקה נכשלה.'); return; }
      var files = projectUrls(p).map(storagePath).filter(Boolean);
      if (files.length) sb.storage.from(BUCKET).remove(files);
      loadProjects();
    });
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { show($('#confirm'), false); if (!$('#modal').hidden) closeForm(); } });

  /* ---------- עמודים משפטיים: טיוטה, פרסום, היסטוריה (20 גרסאות) ---------- */
  var LH = window.LegalHTML, pgData = {}, pgSlug = 'privacy', ed = $('#pg-ed'), draftT = null;
  try { document.execCommand('defaultParagraphSeparator', false, 'p'); } catch (x) {}
  function gapsIn(html) { return (String(html || '').match(LH.GAP) || []).length; }
  function setBadge() {
    var n = 0; Object.keys(pgData).forEach(function (k) { n += gapsIn(pgData[k].content); });
    var b = $('#pages-gaps'); b.hidden = !n; b.textContent = n; b.title = 'מקומות שעוד חסרים ([...])';
  }
  function loadPages() {
    sb.from('pages').select('*').then(function (r) {
      if (r.error) { flash($('#pg-msg'), 'טעינת העמודים נכשלה.'); return; }
      pgData = {}; (r.data || []).forEach(function (p) { pgData[p.slug] = p; });
      setBadge(); showPage(pgSlug); renderOverview();
    });
  }
  /* גיבוי: אם אין שורה במסד, נשלף התוכן מהעמוד שבקוד כנקודת התחלה (נשמר למסד רק בשמירה) */
  function fromCode(slug) {
    return fetch('/' + slug).then(function (r) { return r.ok ? r.text() : ''; }).then(function (t) {
      var d = new DOMParser().parseFromString(t, 'text/html'), h1 = d.querySelector('.lg-h'), lead = d.querySelector('.lg-lead'), html = '';
      [].forEach.call(d.querySelectorAll('.lg-sec'), function (s) {
        if (s.querySelector('#s-updated')) return;
        var h = s.querySelector('h2'), title = h ? h.textContent : '';
        if (h) h.remove();
        s.querySelectorAll('mark').forEach(function (m) { m.replaceWith(d.createTextNode(m.textContent)); });
        html += (title ? '<h2>' + title.replace(/</g, '&lt;') + '</h2>' : '') + s.innerHTML;
      });
      return { slug: slug, title: h1 ? h1.textContent : '', lead: lead ? lead.textContent : '', content: html, updated_at: null, revision: 0, fromCode: true };
    }).catch(function () { return { slug: slug, title: '', lead: '', content: '', updated_at: null, revision: 0, fromCode: true }; });
  }
  function working(p) { return p.draft && typeof p.draft === 'object' ? { title: p.draft.title || '', lead: p.draft.lead || '', content: p.draft.content || '' } : { title: p.title || '', lead: p.lead || '', content: p.content || '' }; }
  function setStatus(p) {
    var st = $('#pg-status');
    st.textContent = p.fromCode ? 'עוד לא במסד' : (p.draft ? 'טיוטה שלא פורסמה' : 'מפורסם');
    st.classList.toggle('is-draft', !!p.draft || !!p.fromCode);
  }
  function showPage(slug) {
    if (slug !== pgSlug && dirtyPages && !window.confirm('יש שינויים שעדיין לא נשמרו כטיוטה. לעבור בלי לשמור?')) return;
    clearTimeout(draftT); dirtyPages = false; pgSlug = slug;
    [].forEach.call($('#pg-pick').children, function (b) { b.setAttribute('aria-pressed', String(b.dataset.slug === slug)); });
    $('#pg-view').setAttribute('href', '/' + slug);
    show($('#pg-hist'), false); $('#pg-hist-btn').setAttribute('aria-expanded', 'false'); $('#pg-saved').textContent = '';
    var p = pgData[slug];
    (p ? Promise.resolve(p) : fromCode(slug)).then(function (p) {
      if (slug !== pgSlug) return;
      var w = working(p);
      $('#pg-title').value = w.title; $('#pg-lead').value = w.lead;
      $('#pg-note').textContent = p.fromCode ? 'העמוד עוד לא במסד: זה התוכן שבקוד האתר. שמירה תעביר אותו למסד.' : (p.updated_at ? 'פורסם לאחרונה: ' + LH.fmtDate(p.updated_at) : '');
      setStatus(p);
      var c = LH.clean(w.content);
      if (c === null) { ed.contentEditable = 'false'; flash($('#pg-msg'), 'ספריית הניקוי (DOMPurify) לא נטענה. רעננו את הדף.'); return; }
      ed.contentEditable = 'true'; ed.innerHTML = c; LH.markGaps(ed); renderGaps(); flash($('#pg-msg'), '');
    });
  }
  /* "מה עוד חסר": כל [...] עם המשפט שסביבו, מודגש בצהוב */
  function gapsHtml(root) {
    var marks = root.querySelectorAll('mark'), items = [];
    [].forEach.call(marks, function (m, i) {
      var blk = m.closest('p,li,h2,h3') || m.parentNode;
      items.push('<li><button type="button" data-gap="' + i + '">' + esc(blk.textContent.trim()).replace(LH.GAP1, function (x) { return '<mark class="ph">' + x + '</mark>'; }) + '</button></li>');
    });
    return items.length ? '<b>עוד חסרים ' + items.length + ' פרטים ([...]):</b><ul>' + items.join('') + '</ul>' : '<b class="ok">אין יותר [...] בעמוד הזה.</b>';
  }
  function renderGaps() { $('#pg-gaps').innerHTML = gapsHtml(ed); }
  function renderGapsLive() { var tmp = ed.cloneNode(true); LH.unmark(tmp); LH.markGaps(tmp); $('#pg-gaps').innerHTML = gapsHtml(tmp); }
  function cleanEditor() {
    var tmp = ed.cloneNode(true); LH.unmark(tmp);
    [].forEach.call(tmp.querySelectorAll('div'), function (d) { var p = document.createElement('p'); p.innerHTML = d.innerHTML; d.replaceWith(p); });
    [].forEach.call(tmp.querySelectorAll('b'), function (b) { var s = document.createElement('strong'); s.innerHTML = b.innerHTML; b.replaceWith(s); });
    [].forEach.call(tmp.querySelectorAll('i'), function (b) { var s = document.createElement('em'); s.innerHTML = b.innerHTML; b.replaceWith(s); });
    var html = LH.clean(tmp.innerHTML);
    if (html === null) return null;
    var out = document.createElement('div'); out.innerHTML = html;
    [].forEach.call(out.querySelectorAll('p,li,h2,h3'), function (n) { if (!n.textContent.trim() && !n.querySelector('br')) n.remove(); });
    return out.innerHTML.trim();
  }
  function snapshot() { return { title: $('#pg-title').value.trim(), lead: $('#pg-lead').value.trim(), content: cleanEditor() }; }
  /* שמירת טיוטה אוטומטית (השהיה קצרה אחרי הקלדה). לא משנה את האתר הציבורי */
  function markDirty() {
    dirtyPages = true; $('#pg-saved').textContent = 'יש שינויים שלא נשמרו...';
    clearTimeout(draftT); draftT = setTimeout(saveDraft, 2000);
  }
  function saveDraft() {
    clearTimeout(draftT);
    var s = snapshot(), m = $('#pg-msg'), p = pgData[pgSlug];
    if (s.content === null) { flash(m, 'ספריית הניקוי לא נטענה. רעננו את הדף.'); return Promise.resolve(); }
    if (!s.title) { $('#pg-saved').textContent = 'חסרה כותרת: הטיוטה לא נשמרה.'; return Promise.resolve(); }
    var q = p && !p.fromCode
      ? sb.from('pages').update({ draft: s }).eq('slug', pgSlug).eq('revision', p.revision || 0).select()
      : sb.from('pages').upsert({ slug: pgSlug, title: s.title, lead: s.lead || null, content: s.content || ' ', draft: s, revision: 0 }).select();
    return q.then(function (r) {
      if (r.error || !r.data || !r.data[0]) { flash(m, 'שמירת הטיוטה נכשלה. אם העמוד נערך בחלון אחר, רעננו את הדף.'); return; }
      flash(m, ''); pgData[pgSlug] = r.data[0]; dirtyPages = false; setStatus(r.data[0]);
      $('#pg-saved').textContent = '✓ הטיוטה נשמרה'; renderOverview();
    });
  }
  ed.addEventListener('input', function () { markDirty(); gapsSoon(); });
  $('#pg-title').addEventListener('input', markDirty);
  $('#pg-lead').addEventListener('input', markDirty);
  $('#pg-draftbtn').addEventListener('click', function () { saveDraft(); });
  var gapT; function gapsSoon() { clearTimeout(gapT); gapT = setTimeout(function () { var s = window.getSelection(), inEd = s.rangeCount && ed.contains(s.anchorNode); if (!inEd) LH.markGaps(ed); renderGapsLive(); }, 250); }
  ed.addEventListener('blur', function () { LH.unmark(ed); LH.markGaps(ed); renderGaps(); });
  ed.addEventListener('paste', function (e) { e.preventDefault(); var t = (e.clipboardData || window.clipboardData).getData('text/plain'); document.execCommand('insertText', false, t); });
  $('#pg-gaps').addEventListener('click', function (e) {
    var b = e.target.closest('[data-gap]'); if (!b) return;
    var m = ed.querySelectorAll('mark')[+b.dataset.gap]; if (m) { m.scrollIntoView({ block: 'center' }); }
  });
  $('#pg-pick').addEventListener('click', function (e) { var b = e.target.closest('[data-slug]'); if (b) showPage(b.dataset.slug); });
  $('#pane-pages .cp-tb').addEventListener('mousedown', function (e) { if (e.target.closest('button')) e.preventDefault(); });
  $('#pane-pages .cp-tb').addEventListener('click', function (e) {
    var b = e.target.closest('[data-cmd]'); if (!b || ed.contentEditable !== 'true') return;
    ed.focus(); var c = b.dataset.cmd;
    if (c === 'h2' || c === 'h3' || c === 'p') document.execCommand('formatBlock', false, c);
    else if (c === 'ul') document.execCommand('insertUnorderedList');
    else if (c === 'ol') document.execCommand('insertOrderedList');
    else if (c === 'link') {
      var u = window.prompt('כתובת הקישור (https://..., mailto:..., tel:... או /עמוד)', 'https://'); if (!u) return;
      if (!/^(https?:\/\/|mailto:|tel:|\/|#)/i.test(u.trim())) { flash($('#pg-msg'), 'הקישור חייב להתחיל ב-https:// , mailto: , tel: או /'); return; }
      document.execCommand('createLink', false, u.trim());
    } else document.execCommand(c);
    markDirty(); gapsSoon();
  });
  /* פרסום: מעלה את הטיוטה לאתר, מנקה את הטיוטה, ושומר גרסה בהיסטוריה */
  $('#pg-save').addEventListener('click', function () {
    var m = $('#pg-msg'), btn = this, s = snapshot(), p = pgData[pgSlug];
    if (s.content === null) { flash(m, 'ספריית הניקוי לא נטענה. רעננו את הדף.'); return; }
    if (!s.title) { flash(m, 'חסרה כותרת לעמוד.'); return; }
    if (!s.content) { flash(m, 'התוכן ריק. לא פורסם.'); return; }
    clearTimeout(draftT); btn.disabled = true; flash(m, 'מפרסם...', true);
    var rev = p && !p.fromCode ? (p.revision || 0) : 0;
    var q = p && !p.fromCode
      ? sb.from('pages').update({ title: s.title, lead: s.lead || null, content: s.content, draft: null, revision: rev + 1 }).eq('slug', pgSlug).eq('revision', rev).select()
      : sb.from('pages').upsert({ slug: pgSlug, title: s.title, lead: s.lead || null, content: s.content, draft: null, revision: 1 }).select();
    q.then(function (r) {
      btn.disabled = false;
      if (r.error || !r.data || !r.data[0]) { flash(m, 'הפרסום נכשל. אם העמוד נערך בחלון אחר, רעננו את הדף.'); return; }
      pgData[pgSlug] = r.data[0]; dirtyPages = false; setStatus(r.data[0]); setBadge(); renderOverview();
      $('#pg-note').textContent = 'פורסם לאחרונה: ' + LH.fmtDate(r.data[0].updated_at); $('#pg-saved').textContent = '';
      ed.innerHTML = LH.clean(r.data[0].content) || ''; LH.markGaps(ed); renderGaps();
      sb.from('revisions').insert({ entity: 'page', ref: pgSlug, data: { title: s.title, lead: s.lead || '', content: s.content } }).then(function () { if (!$('#pg-hist').hidden) loadHistory(); });
      flash(m, 'פורסם. העמוד באתר מתעדכן מיד.', true);
    });
  });
  /* היסטוריה: 20 הגרסאות האחרונות שפורסמו. שחזור טוען לטיוטה ולא מפרסם */
  function loadHistory() {
    sb.from('revisions').select('*').eq('entity', 'page').eq('ref', pgSlug).order('created_at', { ascending: false }).limit(20).then(function (r) {
      var box = $('#pg-hist');
      if (r.error) { box.innerHTML = '<p class="cp-msg">טעינת ההיסטוריה נכשלה.</p>'; return; }
      var rows = r.data || [];
      box.innerHTML = rows.length ? '<b>גרסאות שפורסמו (עד 20)</b><ul>' + rows.map(function (v, i) {
        return '<li><span>' + esc(new Date(v.created_at).toLocaleString('he-IL', { dateStyle: 'short', timeStyle: 'short' })) + '</span><span>' + esc((v.data && v.data.title) || '') + '</span><button type="button" class="cp-sm" data-restore="' + i + '">שחזור לטיוטה</button></li>';
      }).join('') + '</ul>' : '<p class="cp-hint">עוד אין גרסאות שמורות. כל פרסום נשמר כאן.</p>';
      box._rows = rows;
    });
  }
  $('#pg-hist-btn').addEventListener('click', function () {
    var open = $('#pg-hist').hidden; show($('#pg-hist'), open); this.setAttribute('aria-expanded', String(open));
    if (open) loadHistory();
  });
  $('#pg-hist').addEventListener('click', function (e) {
    var b = e.target.closest('[data-restore]'); if (!b) return;
    var v = $('#pg-hist')._rows[+b.dataset.restore]; if (!v || !v.data) return;
    if (!window.confirm('לטעון את הגרסה הזו לעורך כטיוטה? האתר לא ישתנה עד שתפרסמי.')) return;
    $('#pg-title').value = v.data.title || ''; $('#pg-lead').value = v.data.lead || '';
    ed.innerHTML = LH.clean(v.data.content) || ''; LH.markGaps(ed); renderGaps(); markDirty();
    flash($('#pg-msg'), 'הגרסה נטענה כטיוטה. לחצי "פרסום" כדי להעלות אותה לאתר.', true);
  });

  /* ---------- טקסטי האתר: רשימה לפי אזור, טיוטה אוטומטית, תצוגה מקדימה חיה ופרסום ---------- */
  var txSlots = [], txRows = {}, txVals = {}, txDirty = {}, txT = null, txPage = 'index';
  var TX_PAGE_PATH = { index: '/', projects: '/projects', privacy: '/privacy', terms: '/terms', accessibility: '/accessibility' };
  var TX_PAGE_NAME = { index: 'דף הבית', projects: 'פרויקטים', privacy: 'פרטיות', terms: 'תנאי שימוש', accessibility: 'נגישות' };
  function txDefault(s) { return s.text; }
  function txCurrent(s) { var r = txRows[s.key]; return txVals[s.key] != null ? txVals[s.key] : (r && r.draft != null ? r.draft : (r && r.value != null ? r.value : s.text)); }
  function txPublished(s) { var r = txRows[s.key]; return r && r.value != null ? r.value : s.text; }
  function txIsDraft(s) { var r = txRows[s.key]; return (txVals[s.key] != null && txVals[s.key] !== txPublished(s)) || (r && r.draft != null && r.draft !== txPublished(s) && txVals[s.key] == null); }
  function loadTexts() {
    Promise.all([
      fetch('/assets/slots.json', { cache: 'no-store' }).then(function (r) { return r.ok ? r.json() : { slots: [] }; }).catch(function () { return { slots: [] }; }),
      sb.from('site_texts').select('*')
    ]).then(function (res) {
      txSlots = (res[0].slots || []);
      txRows = {}; ((res[1] && res[1].data) || []).forEach(function (r) { txRows[r.key] = r; });
      if (res[1] && res[1].error) { flash($('#tx-status'), 'טעינת הטקסטים נכשלה.'); }
      renderTexts(); renderOverview();
    });
  }
  function txCount() { return txSlots.filter(txIsDraft).length; }
  function renderTexts() {
    var q = ($('#tx-search').value || '').trim().toLowerCase(), groups = {}, order = [];
    txSlots.forEach(function (s) { if (!groups[s.group]) { groups[s.group] = []; order.push(s.group); } groups[s.group].push(s); });
    $('#tx-groups').innerHTML = order.map(function (g, gi) {
      var items = groups[g].filter(function (s) { return !q || (s.key + ' ' + s.text + ' ' + txCurrent(s) + ' ' + g).toLowerCase().indexOf(q) > -1; });
      if (!items.length) return '';
      var nd = items.filter(txIsDraft).length;
      return '<details class="cp-grp"' + (q || gi === 0 ? ' open' : '') + '><summary><b>' + esc(g) + '</b><small>' + items.length + ' טקסטים</small>' + (nd ? '<span class="cp-badge is-draft">' + nd + ' בטיוטה</span>' : '') + '</summary><div class="cp-grp__body">' +
        items.map(function (s) {
          var v = txCurrent(s), long = s.kind === 'longtext', label = s.label || (s.pages.length > 1 ? 'מופיע ב-' + s.pages.length + ' עמודים' : TX_PAGE_NAME[s.pages[0]] || ''),
            ctl = long ? '<textarea data-tx="' + esc(s.key) + '" rows="3" maxlength="600">' + esc(v) + '</textarea>' : '<input data-tx="' + esc(s.key) + '" value="' + esc(v) + '" maxlength="300">';
          return '<div class="cp-tf' + (txIsDraft(s) ? ' is-draft' : '') + '"><label>' + '<span class="cp-tf__l">' + esc(label) + '</span>' + ctl + '</label>' + (v !== txDefault(s) ? '<button type="button" class="cp-sm" data-tx-reset="' + esc(s.key) + '">החזרה לברירת מחדל</button>' : '') + '</div>';
        }).join('') + '</div></details>';
    }).join('') || '<p class="cp-empty">לא נמצאו טקסטים.</p>';
    var n = txCount(); $('#tx-count').textContent = n ? n + ' טקסטים בטיוטה' : 'אין שינויים שממתינים לפרסום';
    $('#tx-publish').disabled = !n;
  }
  function frameDoc() { try { return $('#tx-frame').contentDocument; } catch (x) { return null; } }
  function injectOne(key, val) {
    var d = frameDoc(); if (!d) return;
    [].forEach.call(d.querySelectorAll('[data-slot="' + key + '"]'), function (el) { el.textContent = val; });
  }
  function injectAll() { txSlots.forEach(function (s) { if (txIsDraft(s)) injectOne(s.key, txCurrent(s)); }); }
  function setFramePage(p) {
    txPage = p; [].forEach.call($('#tx-pagepick').children, function (b) { b.setAttribute('aria-pressed', String(b.dataset.page === p)); });
    $('#tx-frame').src = TX_PAGE_PATH[p];
  }
  $('#tx-frame').addEventListener('load', injectAll);
  $('#tx-pagepick').addEventListener('click', function (e) { var b = e.target.closest('[data-page]'); if (b) setFramePage(b.dataset.page); });
  $('#tx-search').addEventListener('input', renderTexts);
  $('#tx-groups').addEventListener('input', function (e) {
    var el = e.target.closest('[data-tx]'); if (!el) return;
    txVals[el.dataset.tx] = el.value; txDirty[el.dataset.tx] = true; dirtyTexts = true;
    injectOne(el.dataset.tx, el.value); $('#tx-status').textContent = 'יש שינויים שלא נשמרו...';
    clearTimeout(txT); txT = setTimeout(saveTextDrafts, 1500);
  });
  $('#tx-groups').addEventListener('focusin', function (e) {
    var el = e.target.closest('[data-tx]'); if (!el) return;
    var s = txSlots.filter(function (x) { return x.key === el.dataset.tx; })[0]; if (!s) return;
    if (s.pages.indexOf(txPage) < 0) setFramePage(s.pages[0]);
    var d = frameDoc(), t = d && d.querySelector('[data-slot="' + s.key + '"]');
    if (d) [].forEach.call(d.querySelectorAll('[data-cp-hl]'), function (n) { n.style.outline = ''; n.removeAttribute('data-cp-hl'); });
    if (t) { t.setAttribute('data-cp-hl', '1'); t.style.outline = '3px solid #1B33C9'; t.style.outlineOffset = '4px'; t.scrollIntoView({ block: 'center', behavior: 'smooth' }); }
  });
  $('#tx-groups').addEventListener('click', function (e) {
    var b = e.target.closest('[data-tx-reset]'); if (!b) return;
    var s = txSlots.filter(function (x) { return x.key === b.dataset.txReset; })[0]; if (!s) return;
    txVals[s.key] = txDefault(s); txDirty[s.key] = true; dirtyTexts = true; injectOne(s.key, txDefault(s)); renderTexts();
    clearTimeout(txT); txT = setTimeout(saveTextDrafts, 800);
  });
  /* שמירת טיוטה: draft בשורת הטקסט. הטקסט המפורסם (value) לא משתנה עד פרסום */
  function saveTextDrafts() {
    clearTimeout(txT);
    var keys = Object.keys(txDirty); if (!keys.length) return Promise.resolve();
    var rows = keys.map(function (k) { var s = txSlots.filter(function (x) { return x.key === k; })[0]; return { key: k, kind: s && s.kind === 'longtext' ? 'longtext' : 'text', draft: txVals[k] }; });
    return sb.from('site_texts').upsert(rows).select().then(function (r) {
      if (r.error) { flash($('#tx-status'), 'שמירת הטיוטה נכשלה. בדקו את ההרשאות ונסו שוב.'); return; }
      (r.data || []).forEach(function (row) { txRows[row.key] = row; delete txVals[row.key]; delete txDirty[row.key]; });
      dirtyTexts = false; $('#tx-status').textContent = '✓ הטיוטה נשמרה'; renderTexts(); renderOverview();
    });
  }
  /* פרסום: מעלה את כל הטיוטות, שומר גרסה, ומפעיל בנייה מחדש של האתר */
  $('#tx-publish').addEventListener('click', function () {
    var btn = this, st = $('#tx-status'); btn.disabled = true; flash(st, 'מפרסם...', true);
    saveTextDrafts().then(function () {
      var jobs = txSlots.filter(function (s) { var r = txRows[s.key]; return r && r.draft != null; });
      if (!jobs.length) { flash(st, 'אין מה לפרסם.'); return; }
      return Promise.all(jobs.map(function (s) {
        var r = txRows[s.key], v = r.draft, val = v === txDefault(s) ? null : v;
        return sb.from('site_texts').update({ value: val, draft: null, revision: (r.revision || 0) + 1 }).eq('key', s.key).select().then(function (u) {
          if (u.error || !u.data || !u.data[0]) throw new Error('save');
          txRows[s.key] = u.data[0];
          return sb.from('revisions').insert({ entity: 'text', ref: s.key, data: { value: v } });
        });
      })).then(function () {
        renderTexts(); renderOverview();
        return sb.auth.getSession();
      }).then(function (ss) {
        var tok = ss && ss.data && ss.data.session && ss.data.session.access_token;
        return fetch('/api/publish', { method: 'POST', headers: { Authorization: 'Bearer ' + (tok || '') } }).then(function (r) { return r.status; }, function () { return 0; });
      }).then(function (code) {
        if (code === 200) flash(st, 'פורסם. האתר יתעדכן בעוד כדקה, אחרי שהבנייה מסתיימת.', true);
        else if (code === 429) flash(st, 'הטקסטים נשמרו. בנייה כבר התחילה לפני רגע, האתר יתעדכן בקרוב.', true);
        else if (code === 503) flash(st, 'הטקסטים נשמרו, אבל חיבור הפרסום לאתר עוד לא הוגדר (משתני סביבה ב-Vercel). עד אז האתר לא יתעדכן.');
        else flash(st, 'הטקסטים נשמרו, אבל הפעלת הבנייה נכשלה (קוד ' + code + ').');
      });
    }).catch(function () { flash(st, 'הפרסום נכשל. נסו שוב.'); }).then(function () { btn.disabled = !txCount(); });
  });

  /* ---------- פניות ---------- */
  var ST = { new: 'חדש', in_progress: 'בטיפול', closed: 'סגור' };
  function loadLeads() {
    sb.from('leads').select('*').order('created_at', { ascending: false }).limit(500).then(function (r) {
      if (r.error) { flash(els.gmsg, 'טעינת הפניות נכשלה.'); return; }
      leads = r.data || []; renderLeads(); renderOverview();
    });
  }
  function fmt(d) { try { return new Date(d).toLocaleString('he-IL', { dateStyle: 'short', timeStyle: 'short' }); } catch (x) { return d; } }
  function waUrl(phone) {
    var d = String(phone || '').replace(/\D/g, '');
    if (d.indexOf('00') === 0) d = d.slice(2);
    else if (d.charAt(0) === '0') d = '972' + d.slice(1);
    return 'https://wa.me/' + d;
  }
  function renderLeads() {
    var f = $('#lead-filter').value, q = ($('#lead-search').value || '').trim().toLowerCase(), ul = $('#leads');
    var nNew = leads.filter(function (l) { return l.status === 'new'; }).length, badge = $('#leads-new');
    badge.hidden = !nNew; badge.textContent = nNew;
    var list = leads.filter(function (l) {
      if (f && l.status !== f) return false;
      if (!q) return true;
      var qd = q.replace(/\D/g, ''), pd = String(l.phone || '').replace(/\D/g, '');
      if (qd.length >= 3 && (pd.indexOf(qd) > -1 || (qd.charAt(0) === '0' && pd.indexOf(qd.slice(1)) > -1))) return true;
      return [l.name, l.phone, l.email, l.business, l.message, l.note].join(' ').toLowerCase().indexOf(q) > -1;
    });
    if (!list.length) { ul.innerHTML = '<li class="cp-empty">אין פניות להצגה.</li>'; return; }
    ul.innerHTML = list.map(function (l) {
      var ph = String(l.phone || '').replace(/[^\d+]/g, '');
      return '<li class="cp-lead cp-st-' + esc(l.status) + '" data-id="' + l.id + '"><div><b>' + esc(l.name) + (l.status === 'new' ? '<span class="cp-lead__new">חדש</span>' : '') + '</b><div class="cp-meta">' +
        (l.business ? '<span>' + esc(l.business) + '</span>' : '') +
        '<a href="tel:' + esc(ph) + '" dir="ltr">' + esc(l.phone) + '</a>' +
        (l.email ? '<a href="mailto:' + esc(l.email) + '" dir="ltr">' + esc(l.email) + '</a>' : '') +
        '<span>' + esc(fmt(l.created_at)) + '</span></div>' +
        (l.message ? '<p class="cp-lead__msg">' + esc(l.message) + '</p>' : '') + '</div>' +
        '<div class="cp-lead__side"><label class="cp-field cp-field--inline">סטטוס<select data-lead>' + Object.keys(ST).map(function (k) { return '<option value="' + k + '"' + (k === l.status ? ' selected' : '') + '>' + ST[k] + '</option>'; }).join('') + '</select></label>' +
        '<a class="cp-wa" href="' + esc(waUrl(l.phone)) + '" target="_blank" rel="noopener">ווטסאפ</a><button type="button" class="cp-sm" data-lead-del>מחיקה</button></div>' +
        '<textarea class="cp-note" data-note rows="1" maxlength="2000" placeholder="הערה" aria-label="הערה לליד">' + esc(l.note || '') + '</textarea></li>';
    }).join('');
  }
  $('#lead-filter').addEventListener('change', renderLeads);
  $('#lead-search').addEventListener('input', renderLeads);
  $('#leads').addEventListener('click', function (e) {
    var b = e.target.closest('[data-lead-del]'); if (!b) return;
    var id = b.closest('.cp-lead').dataset.id, l = leads.filter(function (x) { return x.id === id; })[0];
    if (l) askDeleteLead(l);
  });
  $('#leads').addEventListener('change', function (e) {
    var s = e.target.closest('[data-lead]');
    if (s) {
      var li = s.closest('.cp-lead'), id = li.dataset.id, val = s.value;
      sb.from('leads').update({ status: val }).eq('id', id).then(function (r) {
        if (r.error) { flash(els.gmsg, 'עדכון הסטטוס נכשל.'); loadLeads(); return; }
        leads.forEach(function (l) { if (l.id === id) l.status = val; }); flash(els.gmsg, ''); renderLeads();
      });
      return;
    }
    var n = e.target.closest('[data-note]');
    if (n) {
      var id2 = n.closest('.cp-lead').dataset.id, txt = n.value.trim() || null;
      sb.from('leads').update({ note: txt }).eq('id', id2).then(function (r) {
        if (r.error) { flash(els.gmsg, 'שמירת ההערה נכשלה.'); return; }
        leads.forEach(function (l) { if (l.id === id2) l.note = txt; }); flash(els.gmsg, '');
      });
    }
  });

  /* ---------- ייצוא פניות ל-CSV (מוגן מהזרקת נוסחאות, עם BOM כדי שאקסל יציג עברית) ---------- */
  function csvCell(v) {
    var s = String(v == null ? '' : v).replace(/\r?\n/g, ' ');
    if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
    return '"' + s.replace(/"/g, '""') + '"';
  }
  $('#lead-csv').addEventListener('click', function () {
    var ST2 = { new: 'חדש', in_progress: 'בטיפול', closed: 'סגור' };
    var rows = [['תאריך', 'שם', 'עסק', 'טלפון', 'מייל', 'הודעה', 'סטטוס', 'הערה']].concat(leads.map(function (l) {
      return [fmt(l.created_at), l.name, l.business, l.phone, l.email, l.message, ST2[l.status] || l.status, l.note];
    }));
    var blob = new Blob(['﻿' + rows.map(function (r) { return r.map(csvCell).join(','); }).join('\r\n')], { type: 'text/csv;charset=utf-8' });
    var a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = 'leads-' + new Date().toISOString().slice(0, 10) + '.csv';
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
  });
})();
