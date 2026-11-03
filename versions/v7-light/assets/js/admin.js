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
    sb.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: location.origin + location.pathname, queryParams: { prompt: 'select_account' } } })
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
    loadProjects(); loadLeads();
  }
  sb.auth.getSession().then(function (r) { gate(r.data && r.data.session); });
  sb.auth.onAuthStateChange(function (ev, session) { if (ev === 'SIGNED_IN' || ev === 'SIGNED_OUT') gate(session); });

  /* ---------- טאבים ---------- */
  function tab(name) {
    ['projects', 'leads'].forEach(function (n) {
      $('#tab-' + n).setAttribute('aria-selected', String(n === name));
      show($('#pane-' + n), n === name);
    });
  }
  $('#tab-projects').addEventListener('click', function () { tab('projects'); });
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
      var img = p.desktop_image_url ? '<img class="cp-thumb" src="' + esc(p.desktop_image_url) + '" alt="" loading="lazy">' : '<span class="cp-thumb">' + (p.mockup_key ? 'מובנה' : '') + '</span>';
      var hi = hid.indexOf(p.id), over = hi >= MAX_HOME;
      return '<li class="cp-row' + (over ? ' cp-over' : '') + (p.published ? '' : ' cp-draft') + '" data-id="' + p.id + '" data-i="' + i + '">' +
        '<span class="cp-handle" aria-label="גרירה לשינוי סדר" role="img">⠿</span>' + img +
        '<div class="cp-info"><b>' + esc(p.title) +
        (p.is_placeholder ? '<span class="cp-tag cp-tag--ph">מקום שמור</span>' : '') +
        (p.is_concept ? '<span class="cp-tag">קונספט</span>' : '') +
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
  function setPrev(kind, url) { var el = $('#prev-' + kind); el.style.backgroundImage = url ? 'url("' + url.replace(/"/g, '%22') + '")' : ''; el.textContent = url ? '' : 'אין תמונה'; }
  function imgUrl(kind) { return pending[kind] ? pending[kind].preview : (editing && !removed[kind] ? editing[kind + '_image_url'] : null); }
  var removed = { desktop: false, mobile: false };
  /* תצוגה מקדימה חיה: כרטיס פרויקט כפי שיופיע (טקסט, תמונות, כפתור) */
  function renderPreview() {
    var isPh = !!(editing && editing.is_placeholder), d = imgUrl('desktop'), m = imgUrl('mobile');
    var title = form.title.value.trim() || 'שם הפרויקט', desc = form.description.value.trim(), link = form.link.value.trim();
    var tags = (form.type.value || '').split('·').map(function (t) { return t.trim(); }).filter(Boolean);
    if (form.is_concept.checked && !tags.some(function (t) { return t.toUpperCase() === 'CONCEPT'; })) tags.unshift('CONCEPT');
    var shot = d ? '<div class="cp-pv__win"><i></i><img src="' + esc(d) + '" alt=""></div>' : (editing && editing.mockup_key ? '<div class="cp-pv__win cp-pv__win--note">מוקאפ מובנה (נשאר כמו שהוא)</div>' : '<div class="cp-pv__win cp-pv__win--note">עוד לא הועלתה תמונה</div>');
    var phone = m ? '<div class="cp-pv__phone"><img src="' + esc(m) + '" alt=""></div>' : '';
    $('#pprev').innerHTML = '<div class="cp-pv"><div class="cp-pv__tx"><h3>' + esc(title) + '</h3>' + (desc ? '<p>' + esc(desc) + '</p>' : '') +
      (tags.length && !isPh ? '<ul>' + tags.map(function (t) { return '<li' + (t.toUpperCase() === 'CONCEPT' ? ' class="y"' : '') + '>' + esc(t) + '</li>'; }).join('') + '</ul>' : '') +
      (isPh ? '<span class="cp-pv__btn">בואו נדבר</span>' : (link ? '<span class="cp-pv__btn">לפרויקט המלא</span>' : '')) + '</div><div class="cp-pv__mk">' + shot + phone + '</div></div>' +
      '<p class="cp-hint">' + (form.published.checked ? (form.show_on_home.checked ? 'יופיע בדף הבית (אם נכנס בארבעת הראשונים) ובעמוד הפרויקטים.' : 'יופיע בעמוד הפרויקטים בלבד.') : 'טיוטה: לא יופיע באתר.') + '</p>';
  }
  function openForm(p) {
    editing = p || null; pending = { desktop: null, mobile: null }; removed = { desktop: false, mobile: false };
    var isPh = !!(p && p.is_placeholder);
    $('#pform-title').textContent = p ? 'עריכת פרויקט' : 'פרויקט חדש';
    form.title.value = p ? p.title : ''; form.type.value = p ? (p.type || '') : '';
    form.description.value = p ? (p.description || '') : ''; form.link.value = p ? (p.link || '') : '';
    form.is_concept.checked = !!(p && p.is_concept); form.published.checked = !!(p && p.published); form.show_on_home.checked = !!(p && p.show_on_home);
    ['type-field', 'concept-field', 'imgs-field'].forEach(function (id) { show($('#' + id), !isPh); });
    $('#link-label').textContent = isPh ? 'לאן הכפתור מוביל' : 'קישור (לא חובה)';
    $('#file-desktop').value = ''; $('#file-mobile').value = '';
    setPrev('desktop', p && p.desktop_image_url); setPrev('mobile', p && p.mobile_image_url);
    flash($('#pform-msg'), ''); renderPreview(); show($('#modal'), true); form.title.focus();
  }
  function closeForm() { show($('#modal'), false); editing = null; }
  $('#add').addEventListener('click', function () { openForm(null); });
  $('#pcancel').addEventListener('click', closeForm);
  $('#modal').addEventListener('click', function (e) { if (e.target === $('#modal')) closeForm(); });
  form.addEventListener('input', renderPreview);
  form.addEventListener('change', renderPreview);
  ['desktop', 'mobile'].forEach(function (k) {
    $('#file-' + k).addEventListener('change', function (e) {
      var f = e.target.files[0]; var m = $('#pform-msg');
      if (!f) { pending[k] = null; setPrev(k, editing && editing[k + '_image_url']); renderPreview(); return; }
      if (!/^image\/(jpeg|png|webp|gif)$/.test(f.type)) { flash(m, 'רק תמונות JPG, PNG, WebP או GIF.'); e.target.value = ''; return; }
      if (f.size > 20 * 1024 * 1024) { flash(m, 'התמונה גדולה מ-20MB.'); e.target.value = ''; return; }
      flash(m, ''); var u = URL.createObjectURL(f); pending[k] = { file: f, preview: u }; setPrev(k, u); renderPreview();
    });
  });
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
  function upload(item, kind) {
    return toWebp(item.file, MAXW[kind]).then(function (blob) {
      var ext = blob.type === 'image/webp' ? 'webp' : 'png';
      var path = (crypto.randomUUID ? crypto.randomUUID() : Date.now() + '-' + Math.random().toString(16).slice(2)) + '.' + ext;
      return sb.storage.from(BUCKET).upload(path, blob, { contentType: blob.type, cacheControl: '31536000', upsert: false }).then(function (r) {
        if (r.error) throw r.error;
        return sb.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
      });
    });
  }
  function storagePath(u) { var i = u ? u.indexOf('/' + BUCKET + '/') : -1; return i < 0 ? null : decodeURIComponent(u.slice(i + BUCKET.length + 2).split('?')[0]); }
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var m = $('#pform-msg'), btn = $('#psave');
    var title = form.title.value.trim();
    if (!title) { flash(m, 'חסר שם לפרויקט.'); form.title.focus(); return; }
    var link = form.link.value.trim();
    if (link && !/^(https?:\/\/|\/|#)/i.test(link)) { flash(m, 'הקישור חייב להתחיל ב-https:// (או / או # לקישור פנימי).'); form.link.focus(); return; }
    var isPh = !!(editing && editing.is_placeholder);
    btn.disabled = true; flash(m, 'מעלה ושומר...', true);
    var row = { title: title, description: form.description.value.trim() || null, link: link || null, published: form.published.checked, show_on_home: form.show_on_home.checked };
    if (!isPh) { row.type = form.type.value.trim() || null; row.is_concept = form.is_concept.checked; }
    var old = editing ? [editing.desktop_image_url, editing.mobile_image_url] : [];
    Promise.all([pending.desktop ? upload(pending.desktop, 'desktop') : null, pending.mobile ? upload(pending.mobile, 'mobile') : null]).then(function (urls) {
      if (urls[0]) row.desktop_image_url = urls[0];
      if (urls[1]) row.mobile_image_url = urls[1];
      if (editing) return sb.from('projects').update(row).eq('id', editing.id);
      row.position = projects.length;
      return sb.from('projects').insert(row);
    }).then(function (r) {
      if (r.error) throw r.error;
      /* תמונה שהוחלפה נמחקת מהאחסון, כדי שלא יצטברו קבצים יתומים */
      var gone = [pending.desktop ? old[0] : null, pending.mobile ? old[1] : null].map(storagePath).filter(Boolean);
      if (gone.length) sb.storage.from(BUCKET).remove(gone);
      closeForm(); loadProjects();
    }).catch(function () { flash(m, 'השמירה נכשלה. בדקו את ההרשאות והתמונות ונסו שוב.'); })
      .then(function () { btn.disabled = false; });
  });

  /* ---------- מחיקה ---------- */
  var toDelete = null;
  function askDelete(p) { toDelete = p; $('#confirm-p').textContent = '"' + p.title + '" יימחק לצמיתות.'; show($('#confirm'), true); $('#confirm-no').focus(); }
  $('#confirm-no').addEventListener('click', function () { toDelete = null; show($('#confirm'), false); });
  $('#confirm-yes').addEventListener('click', function () {
    var p = toDelete; if (!p) return; show($('#confirm'), false); toDelete = null;
    sb.from('projects').delete().eq('id', p.id).then(function (r) {
      if (r.error) { flash(els.gmsg, 'המחיקה נכשלה.'); return; }
      var files = [p.desktop_image_url, p.mobile_image_url].map(storagePath).filter(Boolean);
      if (files.length) sb.storage.from(BUCKET).remove(files);
      loadProjects();
    });
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { show($('#confirm'), false); if (!$('#modal').hidden) closeForm(); } });

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
        '<a class="cp-wa" href="' + esc(waUrl(l.phone)) + '" target="_blank" rel="noopener">ווטסאפ</a></div>' +
        '<textarea class="cp-note" data-note rows="1" maxlength="2000" placeholder="הערה" aria-label="הערה לליד">' + esc(l.note || '') + '</textarea></li>';
    }).join('');
  }
  $('#lead-filter').addEventListener('change', renderLeads);
  $('#lead-search').addEventListener('input', renderLeads);
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
