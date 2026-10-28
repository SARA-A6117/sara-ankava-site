/* Sara Ankava · v6 · קטן ומהיר: חשיפות, הדר, מוקאפים, טופס, וואטסאפ */
(function () {
  var D = document, W = window, R = D.documentElement;
  var WA = '972533175560';
  /* כשיש כתובת לקבלת הטפסים (Formspree / Netlify / מייל), מדביקים אותה כאן. עד אז הפרטים עוברים לוואטסאפ בלחיצה אחת */
  var ENDPOINT = '';
  var reduce = W.matchMedia && W.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, c) { return (c || D).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || D).querySelectorAll(s)); };
  var raf = W.requestAnimationFrame || function (f) { return setTimeout(f, 16); };

  /* וואטסאפ: הודעה מוכנה */
  var waText = encodeURIComponent('היי שרי, ראיתי את האתר ואשמח לשיחה קצרה על העסק שלי.');
  $$('[data-wa]').forEach(function (a) { a.href = 'https://wa.me/' + WA + '?text=' + waText; a.target = '_blank'; a.rel = 'noopener'; });

  /* כניסה */
  function ready() { R.classList.add('ready'); }
  if (D.fonts && D.fonts.ready) { D.fonts.ready.then(function () { setTimeout(ready, 60); }); setTimeout(ready, 1200); } else { ready(); }

  /* הדר + ניווט פעיל + חשיפות + מוקאפים: הכול לפי מיקום, לא IntersectionObserver */
  var hdr = $('.hdr'), links = $$('.nav a[data-sec]'), rv = $$('.rv'), scr = $$('[data-scroll]');
  var secs = links.map(function (a) { return $('#' + a.dataset.sec); });
  var ticking = false;
  function frame() {
    ticking = false;
    var vh = W.innerHeight, y = W.scrollY;
    if (hdr) hdr.classList.toggle('is-scrolled', y > 8);
    rv.forEach(function (el) { if (!el.classList.contains('in') && el.getBoundingClientRect().top < vh * .94) el.classList.add('in'); });
    if (links.length) {
      var cur = -1;
      secs.forEach(function (s, i) { if (s && s.getBoundingClientRect().top < vh * .4) cur = i; });
      links.forEach(function (a, i) { if (i === cur) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current'); });
    }
    if (!reduce) scr.forEach(function (img) {
      var box = img.parentElement, r = box.getBoundingClientRect();
      if (r.bottom < -80 || r.top > vh + 80) return;
      var span = img.offsetHeight - box.offsetHeight; if (span <= 0) return;
      var p = Math.min(1, Math.max(0, (vh - r.top) / (vh + r.height)));
      var k = parseFloat(img.dataset.scroll) || 1;
      img.style.transform = 'translate3d(0,' + (-Math.min(span, span * p * k)).toFixed(1) + 'px,0)';
    });
  }
  function req() { frame(); }
  W.addEventListener('scroll', req, { passive: true }); W.addEventListener('resize', req); W.addEventListener('load', req);
  frame(); setTimeout(frame, 400); setTimeout(function () { rv.forEach(function (el) { if (el.getBoundingClientRect().top < W.innerHeight * 1.2) el.classList.add('in'); }); }, 2500);

  /* הירו: הטיה עדינה לפי עכבר (רק דסקטופ) */
  var hv = $('.hv'), tilt = $('.hv__tilt');
  if (hv && tilt && !reduce && W.matchMedia('(hover:hover) and (min-width:1001px)').matches) {
    hv.addEventListener('pointermove', function (e) {
      var r = hv.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
      tilt.style.transform = 'rotateY(' + (x * -9).toFixed(2) + 'deg) rotateX(' + (y * 7).toFixed(2) + 'deg)';
    });
    hv.addEventListener('pointerleave', function () { tilt.style.transform = ''; });
  }

  /* תמונה של שרי: אם הקובץ קיים מחליפים את מקום השמירה */
  var ph = $('[data-photo]');
  if (ph) { var im = new Image(); im.onload = function () { im.alt = 'שרה אנקוה'; im.width = im.naturalWidth; im.height = im.naturalHeight; ph.querySelectorAll('svg,small').forEach(function (n) { n.remove(); }); ph.appendChild(im); }; im.src = 'assets/img/sara.jpg'; }

  /* טופס */
  var form = $('#lead');
  if (form) {
    var f = { name: $('#f-name'), phone: $('#f-phone'), msg: $('#f-msg') };
    function bad(k, m) { var box = f[k].closest('.f'); box.toggleAttribute('data-bad', !!m); $('#e-' + k).textContent = m || ''; f[k].setAttribute('aria-invalid', m ? 'true' : 'false'); return !!m; }
    ['name', 'phone'].forEach(function (k) { f[k].addEventListener('input', function () { if (f[k].closest('.f').hasAttribute('data-bad')) bad(k, ''); }); });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var first = null, digits = f.phone.value.replace(/\D/g, '');
      if (bad('name', f.name.value.trim().length < 2 ? 'איך לקרוא לכם?' : '')) first = first || f.name;
      if (bad('phone', digits.length < 9 || digits.length > 12 ? 'נראה שחסרה ספרה. נסו למשל 050-123-4567.' : '')) first = first || f.phone;
      if (first) { first.focus(); return; }
      var name = f.name.value.trim().split(/\s+/)[0];
      $('#sent-name').textContent = name;
      var t = 'היי שרי, אני ' + f.name.value.trim() + '. הטלפון שלי ' + f.phone.value.trim() + '.' + (f.msg.value.trim() ? ' על העסק: ' + f.msg.value.trim() : '');
      var a = $('#sent-wa'); a.href = 'https://wa.me/' + WA + '?text=' + encodeURIComponent(t); a.target = '_blank'; a.rel = 'noopener';
      var box = $('#lead-box') || form;
      var done = function (ok) { box.classList.add(ok ? 'is-sent is-sent--ok' : 'is-sent'); $('#sent-h').focus(); };
      if (ENDPOINT) { fetch(ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify({ name: f.name.value.trim(), phone: f.phone.value.trim(), message: f.msg.value.trim() }) }).then(function (r) { done(r.ok); }, function () { done(false); }); } else done(false);
    });
  }
})();
