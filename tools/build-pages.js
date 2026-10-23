// בונה את העמודים הפנימיים מתוך index.html (header, contact, footer זהים)
const fs = require('fs'), path = require('path');
const site = process.argv[2];
const idx = fs.readFileSync(path.join(site, 'index.html'), 'utf8');
const cut = (a, b) => { const i = idx.indexOf(a), j = idx.indexOf(b, i); if (i < 0 || j < 0) throw new Error('missing ' + a); return idx.slice(i, j); };

const headTpl = idx.slice(0, idx.indexOf('<script type="application/ld+json">'));
const symbols = cut('<!-- הצורה הבסיסית', '<!-- 01 · Header');
const header = cut('<!-- 01 · Header', '<main id="main">');
const contact = cut('<!-- 07 · יצירת קשר -->', '</main>');
const tail = idx.slice(idx.indexOf('<!-- פוטר -->'));

const toHome = s => s.replace(/href="#(about|process|projects)"/g, 'href="index.html#$1"');
const page = ({ file, title, desc, current, body, withContact = true, noindex = false }) => {
  let head = headTpl.replace(/<title>[\s\S]*?<\/title>/, `<title>${title}</title>`)
    .replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${desc}">`)
    .replace(/<meta property="og:[\s\S]*?(?=<link rel="preconnect")/, '');
  if (noindex) head = head.replace('<meta name="theme-color"', '<base href="/">\n<meta name="robots" content="noindex">\n<meta name="theme-color"');
  let hdr = toHome(header).replace(/href="#contact"/g, withContact ? 'href="#contact"' : 'href="index.html#contact"');
  if (current) hdr = hdr.split(`href="index.html#${current}"`).join(`href="projects.html" aria-current="page"`);
  let t = toHome(tail);
  if (!withContact) t = t.replace(/href="#contact"/g, 'href="index.html#contact"');
  const html = head + '</head>\n<body>\n<a class="skip" href="#main">דילוג לתוכן</a>\n\n' + symbols + hdr +
    '<main id="main">\n' + body + '\n' + (withContact ? '  ' + contact : '') + '</main>\n\n' + t;
  fs.writeFileSync(path.join(site, file), html);
  console.log('wrote', file, html.length);
};

/* ---------- מוקאפים ---------- */
const MK = require('./mocks.js');
const aOutline = (cls = '', extra = '') => `<svg class="${cls}" viewBox="0 0 900 520" aria-hidden="true"><use href="#a" width="700" height="520" fill="none" stroke="#723BF8" stroke-width="1.5"/>${extra}</svg>`;
const headArt = `<svg class="page-head__art" viewBox="0 0 1000 760" aria-hidden="true">
  <g transform="translate(450 420) scale(1.4) translate(-450 -420)"><use href="#a" x="100" y="160" width="700" height="520" fill="none" stroke="#CFF839" stroke-opacity=".25" stroke-width="1.4" vector-effect="non-scaling-stroke"/></g>
  <use href="#a" x="100" y="160" width="700" height="520" fill="none" stroke="#CFF839" stroke-width="1.4"/>
  <rect class="bob" x="840" y="540" width="140" height="140" rx="14" fill="#CFF839"/></svg>`;

/* ---------- עמוד פרויקטים ---------- */
page({
  file: 'projects.html',
  title: 'פרויקטים — Sara Ankava',
  desc: 'פרויקטים שהתחילו מאבחון של העסק: קטלוגים דיגיטליים, חנויות ואתרים לעסקים שגדלו מפה לאוזן.',
  current: 'projects',
  body: `
  <section class="page-head wrap" aria-labelledby="page-title">
    <span class="eyebrow rv">פרויקטים</span>
    <h1 class="h1" id="page-title" data-split>
      <span class="line"><span>ככה זה נראה</span></span>
      <span class="line"><span class="hl">כשמתחילים מהנתונים<span class="sq" aria-hidden="true"></span></span></span>
    </h1>
    <p class="lead muted rv">כל פרויקט כאן התחיל מאבחון של העסק, ורק אחר כך הגיע העיצוב.</p>
    ${headArt}
  </section>

  <section class="section on-light wrap rounded-top" style="padding-top:var(--sp-group)" aria-label="כל הפרויקטים">
    <div class="cards">
      <a class="card rv" href="project-tefillin.html" data-cursor="לצפייה">
        <div class="card__media">${MK.tefCombo()}</div>
        <div class="card__meta"><div><span class="label" style="color:var(--violet)">קטלוג דיגיטלי · יודאיקה</span><h2 class="h3">אתר תפילין ומזוזות</h2></div><span class="card__num" dir="ltr">01</span></div>
      </a>
      <div class="card rv d1">
        <div class="card__media">${MK.ganCombo()}</div>
        <div class="card__meta"><div><span class="label" style="color:var(--violet)">חנות · רשת לציוד גנים · בבנייה</span><h2 class="h3">הכל לגן</h2></div><span class="card__num" dir="ltr">02</span></div>
      </div>
      <div class="card card--soon rv">
        ${aOutline()}
        <div><span class="card__num" dir="ltr">03</span><h2 class="h3">פרויקט שלישי</h2><p class="muted" style="margin:6px 0 0">בבנייה. יעלה לכאן כשיהיה מוכן.</p></div>
      </div>
      <a class="card card--soon rv d1" href="#contact">
        ${aOutline('', '<rect x="740" y="380" width="140" height="140" rx="14" fill="#CFF839"/>')}
        <div><h2 class="h3">המקום לפרויקט הבא<span class="sq" aria-hidden="true"></span></h2><p class="muted" style="margin:6px 0 14px">אולי של העסק שלכם?</p><span class="link">ספרו לי על העסק <span aria-hidden="true">←</span></span></div>
      </a>
    </div>
  </section>
`});

/* ---------- עמוד פרויקט: תפילין ומזוזות ---------- */
page({
  file: 'project-tefillin.html',
  title: 'אתר תפילין ומזוזות — פרויקט | Sara Ankava',
  desc: 'קטלוג מוצרים דיגיטלי לעסק משפחתי של תפילין ומזוזות: מה היה לפני, מה ראיתי בנתונים, ומה נבנה.',
  current: 'projects',
  body: `
  <section class="page-head wrap" aria-labelledby="page-title" style="padding-bottom:var(--sp-section)">
    <a class="back rv" href="projects.html"><span aria-hidden="true">→</span> חזרה לכל הפרויקטים</a>
    <div class="grid case-hero" style="margin-top:var(--sp-group)">
      <div class="case-hero__text">
        <span class="label rv" style="color:var(--lime)">קטלוג דיגיטלי · יודאיקה · 2026</span>
        <h1 class="h1" id="page-title" data-split style="font-size:var(--fs-2)">
          <span class="line"><span>אתר תפילין</span></span>
          <span class="line"><span>ומזוזות<span class="sq" aria-hidden="true"></span></span></span>
        </h1>
        <p class="lead muted rv" style="margin:0">קטלוג מוצרים מסודר עם פנייה ישירה בוואטסאפ. הלקוחות רואים, בוחרים ושואלים בהודעה אחת.</p>
        <ul class="facts rv" aria-label="מה כלל הפרויקט"><li>אפיון</li><li>עיצוב</li><li>פיתוח</li><li>תוכנית שיווק</li></ul>
      </div>
      <div class="case-hero__media rv d1">${MK.tefCombo()}</div>
    </div>
  </section>

  <section class="section on-light wrap" aria-labelledby="before-title">
    <div class="grid split">
      <div class="split__label"><span class="eyebrow rv">01 · מה היה לפני</span></div>
      <div class="split__body">
        <h2 class="h2 rv" id="before-title">שם טוב, שעבד בעיקר בטלפון<span class="sq" aria-hidden="true"></span></h2>
        <p class="lead rv" style="margin-top:var(--sp-inner);max-width:46ch">עסק משפחתי שבנה שם לאורך שנים, מפה לאוזן. כמעט כל מכירה התחילה בשיחה: מה יש עכשיו, מה ההבדל בין הסוגים, כמה זה עולה. העסק עבד, אבל כל לקוח חדש היה תלוי בזמן פנוי לענות לו.</p>
      </div>
    </div>
  </section>

  <section class="section wrap" style="background:var(--ink)" aria-labelledby="data-title">
    <div class="section__head">
      <span class="eyebrow rv">02 · מה ראיתי בנתונים</span>
      <h2 class="h2" id="data-title" data-split><span class="line"><span>שלושה דברים</span></span><span class="line"><span>שקבעו את האתר<span class="sq" aria-hidden="true"></span></span></span></h2>
    </div>
    <div class="findings">
      <div class="finding rv"><p>רוב הפניות מגיעות מהנייד, ובדרך כלל בשעות הערב.</p><p class="decision"><b>ההחלטה:</b> האתר נבנה קודם למובייל, עם וואטסאפ שתמיד בהישג יד.</p></div>
      <div class="finding rv d1"><p>אותן שאלות חוזרות כמעט בכל שיחה: כשרות, רמת הכתב, מחיר וזמן אספקה.</p><p class="decision"><b>ההחלטה:</b> כל מוצר עונה על השאלות האלה בעמוד עצמו, לפני שצריך לשאול.</p></div>
      <div class="finding rv d2"><p>לקוחות רוצים לראות את הפריט לפני שהם קונים, לא רק לשמוע עליו.</p><p class="decision"><b>ההחלטה:</b> קטלוג עם צילומים, השוואה בין רמות וסינון לפי סוג ותקציב.</p></div>
    </div>
  </section>

  <section class="section on-light wrap" aria-labelledby="built-title">
    <div class="section__head">
      <span class="eyebrow rv">03 · מה בניתי</span>
      <h2 class="h2" id="built-title" data-split><span class="line"><span>מסך אחרי מסך<span class="sq" aria-hidden="true"></span></span></span></h2>
    </div>
    <div class="screens">
      <div class="screen grid">
        <div class="screen__media rv">${MK.tefHomeOnly()}</div>
        <div class="screen__cap rv d1"><span class="label">מסך 01</span><h3 class="h3">דף הבית</h3><p>מה יש, למי זה מתאים ואיך פונים, כבר במסך הראשון. הוואטסאפ צף בכל גלילה.</p></div>
      </div>
      <div class="screen grid">
        <div class="screen__media rv">${MK.tefPdp()}</div>
        <div class="screen__cap rv d1"><span class="label">מסך 02</span><h3 class="h3">עמוד מוצר</h3><p>רמות כתב להשוואה, תמונות מכמה זוויות, וכפתור ששולח שאלה על הפריט הספציפי.</p></div>
      </div>
      <div class="screen grid">
        <div class="screen__media rv">${MK.tefPhones3()}
        <div class="screen__cap rv d1"><span class="label">מסך 03</span><h3 class="h3">מובייל</h3><p>רוב הלקוחות מגיעים מהטלפון, אז כל מסך תוכנן קודם לאגודל.</p></div>
      </div>
    </div>
  </section>

  <!-- 04 · מה יצא: האזור נכנס רק כשיש מספר אמיתי (כמות + זמן + רלוונטיות), למשל "גידול של X% בפניות תוך חודשיים" -->

  <section class="section wrap" style="padding-bottom:var(--sp-group)" aria-label="ניווט בין פרויקטים">
    <div class="next">
      <a href="projects.html" class="rv"><span class="label">חזרה</span><span class="h3"><span aria-hidden="true">→ </span>לכל הפרויקטים</span></a>
      <div class="rv d1"><span class="label">הפרויקט הבא</span><span class="h3">הכל לגן <span class="small muted" style="font-family:var(--f-body);font-weight:400">· בבנייה</span></span></div>
    </div>
  </section>
`});

/* ---------- משפטי ---------- */
page({
  file: 'legal.html',
  title: 'נגישות ופרטיות — Sara Ankava',
  desc: 'הצהרת הנגישות ומדיניות הפרטיות של האתר.',
  withContact: false,
  body: `
  <section class="page-head wrap" aria-labelledby="page-title">
    <span class="eyebrow rv">מידע</span>
    <h1 class="h1" id="page-title" data-split><span class="line"><span>נגישות ופרטיות<span class="sq" aria-hidden="true"></span></span></span></h1>
    <p class="lead muted rv">בשפה פשוטה, בלי אותיות קטנות.</p>
  </section>
  <section class="section on-light wrap rounded-top" style="padding-top:var(--sp-group)">
    <div class="prose">
      <h2 id="accessibility">הצהרת נגישות</h2>
      <p>האתר נבנה מתוך כוונה שכל אחד ואחת יוכלו להשתמש בו בנוחות, בהתאם לתקן הישראלי 5568 ולהנחיות WCAG ברמה AA.</p>
      <ul>
        <li>ניווט מלא במקלדת, עם סימון ברור של הרכיב שבפוקוס.</li>
        <li>קישור "דילוג לתוכן" בראש כל עמוד.</li>
        <li>ניגודיות צבעים שנבדקה, וטקסט בגודל 16 פיקסלים לפחות.</li>
        <li>כיבוד הגדרת "הפחתת תנועה" של מערכת ההפעלה: האנימציות נעצרות.</li>
        <li>טקסט חלופי לתמונות ותוויות לכל שדה בטופס.</li>
        <li>כפתור "עצירת אנימציות" בתחתית כל עמוד, שעוצר את כל התנועה באתר.</li>
      </ul>
      <p>נתקלתם בבעיה? <a data-wa="היי שרי, נתקלתי בבעיית נגישות באתר:" href="index.html#contact">כתבו לי בוואטסאפ</a> ואטפל בה בהקדם.</p>
      <p><strong>רכזת הנגישות:</strong> שרי אנקווה · טלפון ווואטסאפ: <a href="tel:+972533175560" dir="ltr">053-3175560</a></p>
      <p class="small">עודכן לאחרונה: אוקטובר 2026.</p>

      <h2 id="privacy">מדיניות פרטיות</h2>
      <p>כשאתם ממלאים את הטופס באתר, הפרטים (שם, טלפון ומה שבחרתם לכתוב על העסק) לא נשמרים באתר. לחיצה על "שליחה בוואטסאפ" פותחת הודעה מוכנה, ורק אתם מחליטים אם לשלוח אותה.</p>
      <p>הפרטים שמגיעים אליי ישמשו רק כדי לחזור אליכם בנוגע לפנייה. לא מעבירה אותם לאף אחד, ולא שולחת דיוור בלי הסכמה.</p>
      <p>האתר לא משתמש בעוגיות מעקב או פרסום. הפונטים וספריות התנועה נטענים משרתים חיצוניים (Google Fonts, jsDelivr, unpkg), שעשויים לראות את כתובת ה-IP שלכם כמו בכל טעינת אתר.</p>
      <p>רוצים לדעת איזה מידע יש לי עליכם, או למחוק אותו? <a data-wa="היי שרי, אשמח למחוק את הפרטים שלי." href="index.html#contact">כתבו לי</a>.</p>
    </div>
  </section>
`});

/* ---------- 404 ---------- */
page({
  file: '404.html',
  title: 'העמוד לא נמצא — Sara Ankava',
  desc: 'העמוד שחיפשתם לא נמצא.',
  withContact: false,
  noindex: true,
  body: `
  <section class="page-head wrap" style="min-height:100svh;display:grid;align-content:center" aria-labelledby="page-title">
    <span class="label" style="color:var(--paper-50)" dir="ltr">404</span>
    <h1 class="h1" id="page-title" data-split><span class="line"><span>העמוד הזה</span></span><span class="line"><span class="hl">הלך לאיבוד<span class="sq" aria-hidden="true"></span></span></span></h1>
    <p class="lead muted rv">אבל הדרך חזרה קצרה.</p>
    <div class="ctas rv" style="margin-top:var(--sp-group)"><a class="btn btn--primary" href="index.html">לדף הבית <span class="arr" aria-hidden="true">←</span></a><a class="btn btn--ghost" href="projects.html">לפרויקטים</a></div>
    ${headArt}
  </section>
`});
