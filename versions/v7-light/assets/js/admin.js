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
    loadProjects(); loadLeads(); loadPages();
  }
  sb.auth.getSession().then(function (r) { gate(r.data && r.data.session); });
  sb.auth.onAuthStateChange(function (ev, session) { if (ev === 'SIGNED_IN' || ev === 'SIGNED_OUT') gate(session); });

  /* ---------- טאבים ---------- */
  function tab(name) {
    ['projects', 'pages', 'leads'].forEach(function (n) {
      $('#tab-' + n).setAttribute('aria-selected', String(n === name));
      show($('#pane-' + n), n === name);
    });
  }
  $('#tab-projects').addEventListener('click', function () { tab('projects'); });
  $('#tab-pages').addEventListener('click', function () { tab('pages'); });
  $('#tab-leads').addEventListener('click', function () { tab('leads'); });

  /* ---------- פרויקטים ---------- */
  function loadProjects() {
    sb.from('projects').select('*').order('position', { ascending: true }).order('created_at', { ascending: true })
      .then(function (r) {
        if (r.error) { flash(els.gmsg, 'טעינת הפרויקטים נכשלה.'); return; }
        flash(els.gmsg, '');
        projects = r.data || []; renderProjects();
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
    flash($('#pform-msg'), ''); renderMk(); show($('#modal'), true); form.title.focus();
  }
  function closeForm() { show($('#modal'), false); editing = null; }
  $('#add').addEventListener('click', function () { openForm(null); });
  $('#pcancel').addEventListener('click', closeForm);
  $('#modal').addEventListener('click', function (e) { if (e.target === $('#modal')) closeForm(); });
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
      closeForm(); loadProjects();
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

  /* ---------- עמודים משפטיים ---------- */
  var LH = window.LegalHTML, pgData = {}, pgSlug = 'privacy', ed = $('#pg-ed');
  try { document.execCommand('defaultParagraphSeparator', false, 'p'); } catch (x) {}
  function gapsIn(html) { return (String(html || "").match(LH.GAP) || []).length; }
  function loadPages() {
    sb.from('pages').select('*').then(function (r) {
      if (r.error) { flash($('#pg-msg'), 'טעינת העמודים נכשלה.'); return; }
      pgData = {}; (r.data || []).forEach(function (p) { pgData[p.slug] = p; });
      var n = 0; Object.keys(pgData).forEach(function (k) { n += gapsIn(pgData[k].content); });
      var b = $('#pages-gaps'); b.hidden = !n; b.textContent = n; b.title = 'מקומות שעוד חסרים ([...])';
      showPage(pgSlug);
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
      return { slug: slug, title: h1 ? h1.textContent : '', lead: lead ? lead.textContent : '', content: html, updated_at: null, fromCode: true };
    }).catch(function () { return { slug: slug, title: '', lead: '', content: '', updated_at: null }; });
  }
  function showPage(slug) {
    pgSlug = slug;
    [].forEach.call($('#pg-pick').children, function (b) { b.setAttribute('aria-pressed', String(b.dataset.slug === slug)); });
    $('#pg-view').setAttribute('href', '/' + slug);
    var p = pgData[slug];
    (p ? Promise.resolve(p) : fromCode(slug)).then(function (p) {
      if (slug !== pgSlug) return;
      $('#pg-title').value = p.title || ''; $('#pg-lead').value = p.lead || '';
      $('#pg-date').value = p.updated_at ? LH.fmtDate(p.updated_at) : 'עוד לא נשמר';
      $('#pg-note').textContent = p.fromCode ? 'העמוד עוד לא במסד: זה התוכן שבקוד האתר. שמירה תעביר אותו למסד.' : '';
      var c = LH.clean(p.content);
      if (c === null) { ed.contentEditable = 'false'; flash($('#pg-msg'), 'ספריית הניקוי (DOMPurify) לא נטענה. רעננו את הדף.'); return; }
      ed.contentEditable = 'true'; ed.innerHTML = c; LH.markGaps(ed); renderGaps(); flash($('#pg-msg'), '');
    });
  }
  /* "מה עוד חסר": כל [...] עם המשפט שסביבו, מודגש בצהוב. לחיצה קופצת אל המקום */
  function renderGaps() {
    var box = $('#pg-gaps'), marks = ed.querySelectorAll('mark'), items = [];
    [].forEach.call(marks, function (m, i) {
      var blk = m.closest('p,li,h2,h3') || m.parentNode, tx = blk.textContent.trim();
      items.push('<li><button type="button" data-gap="' + i + '">' + esc(tx).replace(LH.GAP1, function (m) { return '<mark class="ph">' + m + '</mark>'; }) + '</button></li>');
    });
    box.innerHTML = items.length ? '<b>עוד חסרים ' + items.length + ' פרטים ([...]):</b><ul>' + items.join('') + '</ul>' : '<b class="ok">אין יותר [...] בעמוד הזה.</b>';
  }
  var gapT; function gapsSoon() { clearTimeout(gapT); gapT = setTimeout(function () { var s = window.getSelection(), inEd = s.rangeCount && ed.contains(s.anchorNode); if (!inEd) LH.markGaps(ed); renderGapsLive(); }, 250); }
  function renderGapsLive() {
    var tmp = ed.cloneNode(true); LH.unmark(tmp); LH.markGaps(tmp);
    var box = $('#pg-gaps'), marks = tmp.querySelectorAll('mark'), items = [];
    [].forEach.call(marks, function (m) { var blk = m.closest('p,li,h2,h3') || m.parentNode; items.push('<li><button type="button">' + esc(blk.textContent.trim()).replace(LH.GAP1, function (m) { return '<mark class="ph">' + m + '</mark>'; }) + '</button></li>'); });
    box.innerHTML = items.length ? '<b>עוד חסרים ' + items.length + ' פרטים ([...]):</b><ul>' + items.join('') + '</ul>' : '<b class="ok">אין יותר [...] בעמוד הזה.</b>';
  }
  ed.addEventListener('input', gapsSoon);
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
    gapsSoon();
  });
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
  $('#pg-save').addEventListener('click', function () {
    var m = $('#pg-msg'), btn = this, title = $('#pg-title').value.trim(), html = cleanEditor();
    if (html === null) { flash(m, 'ספריית הניקוי לא נטענה. רעננו את הדף.'); return; }
    if (!title) { flash(m, 'חסרה כותרת לעמוד.'); return; }
    if (!html) { flash(m, 'התוכן ריק. לא נשמר.'); return; }
    btn.disabled = true; flash(m, 'שומר...', true);
    sb.from('pages').upsert({ slug: pgSlug, title: title, lead: $('#pg-lead').value.trim() || null, content: html }).select().then(function (r) {
      btn.disabled = false;
      if (r.error || !r.data || !r.data[0]) { flash(m, 'השמירה נכשלה. בדקו את ההרשאות ונסו שוב.'); return; }
      pgData[pgSlug] = r.data[0];
      $('#pg-date').value = LH.fmtDate(r.data[0].updated_at); $('#pg-note').textContent = '';
      ed.innerHTML = LH.clean(r.data[0].content) || ''; LH.markGaps(ed); renderGaps();
      var n = 0; Object.keys(pgData).forEach(function (k) { n += gapsIn(pgData[k].content); });
      var b = $('#pages-gaps'); b.hidden = !n; b.textContent = n;
      flash(m, 'נשמר. העמוד באתר מתעדכן מיד.', true);
    });
  });

  /* ---------- פניות ---------- */
  var ST = { new: 'חדש', in_progress: 'בטיפול', closed: 'סגור' };
  function loadLeads() {
    sb.from('leads').select('*').order('created_at', { ascending: false }).limit(500).then(function (r) {
      if (r.error) { flash(els.gmsg, 'טעינת הפניות נכשלה.'); return; }
      leads = r.data || []; renderLeads();
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
})();
