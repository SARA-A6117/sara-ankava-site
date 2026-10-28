/* בונה את דפי האתר: node tools/build.js */
const { fs, path, root, ARROW, page } = require('./lib.js');

/* ----- אלמנטים משותפים ----- */
const dash = (variant) => {
  const rows = variant === 'cust'
    ? [['נועה כהן', '12 הזמנות', 'לקוחה קבועה', 'ok'], ['דנה לוי', '3 הזמנות', 'חדשה', 'wait'], ['מיכל אברהם', '7 הזמנות', 'לקוחה קבועה', 'ok'], ['רונית שמש', '1 הזמנה', 'חדשה', 'wait'], ['יעל ברק', '5 הזמנות', 'לקוחה קבועה', 'ok']]
    : [['נועה כהן', 'זר ורדים ופיוני', 'מאושרת', 'ok'], ['דנה לוי', 'מארז מתנה ליולדת', 'בהכנה', ''], ['מיכל אברהם', 'סידור לאירוע', 'ממתינה', 'wait'], ['רונית שמש', 'זר שמשונים', 'מאושרת', 'ok'], ['יעל ברק', 'עציץ ומארז', 'בהכנה', '']];
  const hd = variant === 'cust' ? ['לקוחה', 'הזמנות', 'סטטוס', ''] : ['לקוחה', 'הזמנה', 'סטטוס', 'מסירה'];
  const dates = ['היום 14:00', 'מחר 10:30', 'חמישי', 'היום 17:00', 'מחר 12:00'];
  const kpi = variant === 'cust' ? [['לקוחות', '214'], ['חדשים החודש', '17'], ['חוזרים', '61%']] : [['הזמנות היום', '18'], ['ממתינות לאישור', '4'], ['משלוחים היום', '9']];
  return `<div class="dash" aria-hidden="true">
    <div class="dash__side"><b>סטודיו פרחים</b><span class="${variant === 'cust' ? '' : 'on'}">הזמנות</span><span class="${variant === 'cust' ? 'on' : ''}">לקוחות</span><span>מוצרים</span><span>משלוחים</span><span>דוחות</span></div>
    <div class="dash__main">
      <div class="dash__kpi">${kpi.map(k => `<div><small>${k[0]}</small><strong>${k[1]}</strong></div>`).join('')}</div>
      <div class="dash__tbl">
        <div>${hd.map(h => `<span>${h}</span>`).join('')}</div>
        ${rows.map((r, i) => `<div><b>${r[0]}</b><span>${r[1]}</span><span class="pill ${r[3]}">${r[2]}</span><span>${variant === 'cust' ? '' : dates[i]}</span></div>`).join('')}
      </div>
    </div>
  </div>`;
};
const devTefillin = (phone) => `<div class="dev"><div class="dev__bar"><i></i><i></i><i></i><span>אתר סת"ם</span></div><div class="dev__scr"><img src="assets/img/tefillin-desktop.webp" width="1000" height="4788" alt="דף הבית של אתר תפילין ומזוזות: קטלוג עם פנייה בוואטסאפ" data-scroll="1" decoding="async"></div></div>${phone ? `<div class="phone"><img src="assets/img/tefillin-mobile.webp" width="420" height="9490" alt="האתר בנייד" data-scroll="1" decoding="async"></div>` : ''}`;
const devSystem = (variant) => `<div class="dev"><div class="dev__bar"><i></i><i></i><i></i><span>מרכז הזמנות ולקוחות · דמו</span></div><div class="dev__scr">${dash(variant)}</div></div>`;

/* ----- אייקוני זכוכית (בלי זוהר) ----- */
const glassDefs = `<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false"><defs>
  <linearGradient id="gf" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#F3F3EE" stop-opacity=".30"/><stop offset=".55" stop-color="#F3F3EE" stop-opacity=".07"/><stop offset="1" stop-color="#C6FF34" stop-opacity=".16"/></linearGradient>
  <linearGradient id="gs" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#F3F3EE" stop-opacity=".85"/><stop offset=".5" stop-color="#F3F3EE" stop-opacity=".18"/><stop offset="1" stop-color="#C6FF34" stop-opacity=".55"/></linearGradient>
</defs></svg>`;
const icoLens = `<svg viewBox="0 0 120 120" aria-hidden="true"><circle cx="52" cy="52" r="32" fill="url(#gf)" stroke="url(#gs)" stroke-width="2.4"/><circle cx="52" cy="52" r="23" fill="none" stroke="#F3F3EE" stroke-opacity=".16" stroke-width="1.5"/><rect x="40" y="56" width="7" height="14" rx="2" fill="url(#gf)" stroke="url(#gs)" stroke-width="1.4"/><rect x="52" y="44" width="7" height="26" rx="2" fill="url(#gf)" stroke="url(#gs)" stroke-width="1.4"/><rect x="64" y="50" width="7" height="20" rx="2" fill="url(#gf)" stroke="url(#gs)" stroke-width="1.4"/><rect x="79" y="79" width="12" height="34" rx="6" transform="rotate(-45 85 96)" fill="url(#gf)" stroke="url(#gs)" stroke-width="2"/><path d="M34 36a24 24 0 0 1 14-10" fill="none" stroke="#fff" stroke-opacity=".7" stroke-width="2.4" stroke-linecap="round"/></svg>`;
const icoPlan = `<svg viewBox="0 0 120 120" aria-hidden="true"><rect x="14" y="62" width="70" height="36" rx="10" fill="url(#gf)" stroke="url(#gs)" stroke-width="2"/><rect x="26" y="44" width="70" height="36" rx="10" fill="url(#gf)" stroke="url(#gs)" stroke-width="2"/><rect x="38" y="26" width="70" height="36" rx="10" fill="url(#gf)" stroke="url(#gs)" stroke-width="2"/><path d="M46 36h30M46 46h18" stroke="#F3F3EE" stroke-opacity=".55" stroke-width="3" stroke-linecap="round"/><rect x="88" y="34" width="12" height="12" rx="3" fill="#C6FF34"/></svg>`;
const aPath = 'M260 520A260 260 0 0 1 0 260A350 260 0 0 1 350 0A350 260 0 0 1 700 260L700 490Q700 520 670 520L500 520L500 275.6A160 86 0 1 0 486 299.5L486 520Z';
const icoAsset = `<svg viewBox="0 0 900 520" aria-hidden="true" style="width:132px;height:auto"><path d="${aPath}" fill="url(#gf)" stroke="url(#gs)" stroke-width="12"/><path d="M60 250A300 190 0 0 1 300 60" fill="none" stroke="#fff" stroke-opacity=".6" stroke-width="14" stroke-linecap="round"/><rect x="740" y="380" width="140" height="140" rx="22" fill="url(#gf)" stroke="url(#gs)" stroke-width="12"/></svg>`;

const write = (name, o) => fs.writeFileSync(path.join(root, name), page(o));

/* ================= דף הבית ================= */
const home = `
<section class="hv" aria-labelledby="hero-t">
  <div class="wrap hv__grid">
    <div class="hv__copy">
      <h1 class="t-display hv__title" id="hero-t"><span class="l"><span>העסק שלכם הצליח</span></span><span class="l"><span>בפה לאוזן.</span></span><span class="l"><span>הגיע הזמן</span></span><span class="l"><span><span class="acc">לשלב הבא.</span></span></span></h1>
      <p class="hv__sub">מתחילים מהבנה של העסק שלכם, ואז בונים תוכנית שיווק ונכס דיגיטלי אחד שלוקחים אותו רחוק יותר.</p>
      <div class="hv__cta"><a class="btn btn--primary" href="#contact">השאירו פרטים, אחזור תוך 24 שעות</a><a class="hv__link" href="#projects">לפרויקטים <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M6 13l6 6 6-6" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg></a></div>
    </div>
    <div class="hv__obj" aria-hidden="true"><div class="hv__tilt"><div class="hv__layer hv__layer--a"></div><div class="hv__layer hv__layer--sq"></div><div class="hv__sweep"></div></div></div>
  </div>
</section>

<section class="sec on-paper" id="process" aria-labelledby="process-t">
  ${glassDefs}
  <div class="wrap">
    <div class="sec-head rv"><span class="eyebrow">איך אני עובדת</span><h2 class="t-display h2" id="process-t">לפני שבונים משהו, מבינים מה באמת צריך<span class="sq" aria-hidden="true"></span></h2></div>
    <ol class="steps" style="list-style:none;margin:0;padding:0">
      <li class="step rv"><div class="step__art">${icoLens}</div><div class="step__n"><b>01</b> שלב ראשון</div><h3 class="t-display h3">אבחון נתוני העסק</h3><p>כניסות, הזמנות והמרות. מסתכלים על המספרים ומוצאים איפה העסק דולף.</p></li>
      <li class="step rv"><div class="step__art">${icoPlan}</div><div class="step__n"><b>02</b> שלב שני</div><h3 class="t-display h3">תוכנית שיווק</h3><p>קהלי יעד, מסרים וערוצים. מי צריך לשמוע עליכם, מה להגיד לו, ואיפה.</p></li>
      <li class="step rv"><div class="step__art">${icoAsset}</div><div class="step__n"><b>03</b> שלב שלישי</div><h3 class="t-display h3">נכס דיגיטלי אחד</h3><p>במקום שלושה כלים מפוזרים, נכס אחד שעובד, בנוי לפי מה שהעסק צריך.</p></li>
    </ol>
    <div class="assets rv">
      <div><span class="eyebrow">הנכס יכול להיות</span></div>
      <ul class="assets__list">
        <li><b>חנות שמוכרת</b><span>אבחון נתוני העסק, תוכנית שיווק וחנות.</span></li>
        <li><b>מערכת שמסדרת את הבלגן</b><span>אבחון תהליכים ובניית מערכת אחת במקום כלים מפוזרים.</span></li>
        <li><b>אתר תדמית שמביא פניות</b><span>אתר שמסביר מי אתם ומוביל את מי שמגיע אל פנייה.</span></li>
        <li><b>ריטיינר</b><span>ליווי שוטף אחרי העלייה: תחזוקה, גיבויים ובנק שעות.</span></li>
      </ul>
    </div>
  </div>
</section>

<section class="sec" id="projects" aria-labelledby="projects-t">
  <div class="wrap">
    <div class="sec-head rv"><span class="eyebrow">פרויקטים נבחרים</span><h2 class="t-display h2" id="projects-t">כל עסק הוא סיפור אחר. גם הנכס שלו<span class="sq" aria-hidden="true"></span></h2></div>

    <article class="stage rv">
      <div class="stage__copy">
        <div class="stage__tag"><b>01</b> קטלוג דיגיטלי · סופר סת"ם</div>
        <h3 class="t-display h3">אתר תפילין ומזוזות</h3>
        <p>קטלוג שמוביל כל מבקר לפנייה בוואטסאפ, עם פאנל ניהול שמאפשר לעדכן מוצרים ותוכן בלי מפתח.</p>
        <ul class="ticks"><li>קטלוג מוצרים ברור</li><li>פנייה בוואטסאפ מכל עמוד</li><li>פאנל ניהול</li></ul>
        <div><a class="btn btn--ghost btn--sm" href="project-tefillin.html">לפרויקט המלא ${ARROW}</a></div>
      </div>
      <div class="stage__media">${devTefillin(true)}</div>
    </article>

    <article class="stage stage--flip rv">
      <div class="stage__copy">
        <div class="stage__tag"><b>02</b> מערכת · דמו</div>
        <h3 class="t-display h3">מרכז הזמנות ולקוחות</h3>
        <p>מערכת אחת במקום וואטסאפ ואקסל. הדמו בנוי בעטיפה של סטודיו לפרחים ומתנות, עם נתונים לדוגמה.</p>
        <ul class="ticks"><li>הזמנות ולקוחות במקום אחד</li><li>סטטוס לכל הזמנה</li><li>תמונת מצב יומית</li></ul>
        <div><a class="btn btn--ghost btn--sm" href="project-system.html">לפרויקט המלא ${ARROW}</a></div>
      </div>
      <div class="stage__media">${devSystem()}</div>
    </article>

    <div class="nextp rv">
      <div><h3 class="t-display h3">הפרויקט הבא שלכם</h3><p>מתחילים בשיחה קצרה על העסק.</p></div>
      <a class="btn btn--primary" href="#contact">נדבר על העסק שלכם</a>
    </div>
    <div class="all"><a class="btn btn--ghost" href="projects.html">לכל הפרויקטים ${ARROW}</a></div>
  </div>
</section>

<section class="sec on-paper" id="about" aria-labelledby="about-t">
  <div class="wrap about">
    <div class="about__fig rv">
      <div class="about__ph" data-photo><svg viewBox="0 0 900 520" aria-hidden="true"><path d="${aPath}" fill="none" stroke="#F3F3EE" stroke-opacity=".35" stroke-width="10"/><rect x="740" y="380" width="140" height="140" rx="22" fill="#C6FF34"/></svg><small>כאן תהיה התמונה שלי</small></div>
      <a class="about__link" href="#contact">בואו נכיר, השאירו פרטים ${ARROW}</a>
    </div>
    <div class="about__txt">
      <div class="rv" style="display:grid;gap:20px"><span class="eyebrow">אודות</span><h2 class="t-display h2" id="about-t">שרי אנקווה<span class="sq" aria-hidden="true"></span></h2></div>
      <div class="about__body rv">
        <p class="lead">עסקים שגדלים מגלים בשלב מסוים שמה שעבד כשהיו קטנים כבר לא מחזיק.</p>
        <p>ראיתי את זה מבפנים: עבדתי כשכירה על אתר החנות של עסק שצמח מהר, ארבעה סניפים ושני אתרים, ונכנסתי להבין מה באמת צריך. כך למשל, היום אני מנהלת להם את השיווק ומנתחת בעצמי את נתוני האתר, ההזמנות והקמפיינים.</p>
        <p class="pull">מה שלמדתי: אתר בלי תנועה הוא כמו לונה פארק מטורף שנבנה באמצע המדבר, בלי כבישים ובלי דרך להגיע אליו. וגם ההפך, כבישים מושלמים שמובילים לשטח ריק.</p>
        <p>לכן אני מתחילה מלהבין את העסק לעומק, ורק אחר כך בונה את שני החלקים יחד: תוכנית שיווק ונכס דיגיטלי אחד. כי אני מאמינה שעסק חייב גם נכס שעובד וגם תנועה אליו.</p>
      </div>
    </div>
  </div>
</section>
`;
write('index.html', { title: 'Sara Ankava | שיווק ונכסים דיגיטליים לעסקים שצומחים', desc: 'שרי אנקווה, אסטרטגית שיווק עם רגל טכנולוגית. מבינים את העסק, בונים תוכנית שיווק ונכס דיגיטלי אחד.', cur: 'home', body: home });

/* ================= פרויקטים ================= */
const projects = `
<div class="wrap pg">
  <header class="pg__head rv"><span class="eyebrow">פרויקטים</span><h1 class="t-display" style="font-size:var(--fs-1);line-height:1.08">כל עסק הוא סיפור אחר<span class="sq" aria-hidden="true"></span></h1><p class="lead muted">כאן כל הפרויקטים. לכל אחד יש עמוד משלו, עם מה נבנה ואיך זה נראה.</p></header>
  <div class="pgrid">
    <a class="pcard rv" href="project-tefillin.html"><div class="dev"><div class="dev__bar"><i></i><i></i><i></i><span>אתר סת"ם</span></div><div class="dev__scr"><img src="assets/img/tefillin-desktop.webp" width="1000" height="4788" alt="אתר תפילין ומזוזות" decoding="async"></div></div><div class="pcard__tags"><span class="chip">קטלוג</span><span class="chip">וואטסאפ</span><span class="chip">פאנל ניהול</span></div><h2 class="t-display h3">אתר תפילין ומזוזות</h2><p>קטלוג עם פנייה בוואטסאפ ופאנל ניהול.</p></a>
    <a class="pcard rv" href="project-system.html"><div class="dev"><div class="dev__bar"><i></i><i></i><i></i><span>מרכז הזמנות ולקוחות · דמו</span></div><div class="dev__scr">${dash()}</div></div><div class="pcard__tags"><span class="chip">מערכת</span><span class="chip">דמו</span><span class="chip">הזמנות ולקוחות</span></div><h2 class="t-display h3">מרכז הזמנות ולקוחות</h2><p>מערכת אחת במקום וואטסאפ ואקסל, בעטיפה של סטודיו לפרחים ומתנות.</p></a>
    <div class="pcard pcard--next rv"><span class="eyebrow">הפרויקט הבא</span><h2 class="t-display h3">הפרויקט הבא שלכם</h2><p>מתחילים בשיחה קצרה על העסק.</p><a class="btn btn--primary" href="#contact">נדבר על העסק שלכם</a></div>
  </div>
</div>`;
write('projects.html', { title: 'פרויקטים | Sara Ankava', desc: 'פרויקטים נבחרים של שרי אנקווה: אתר קטלוג עם וואטסאפ ופאנל ניהול, ומערכת הזמנות ולקוחות.', cur: 'projects', body: projects });

/* ================= עמוד פרויקט: תפילין ================= */
const back = `<a class="about__link rv" href="projects.html" style="color:var(--on-ink-2);border-color:var(--line-d);margin-bottom:var(--sp-group)">לכל הפרויקטים ${ARROW}</a>`;
const pTef = `
<div class="wrap pg">
  ${back}
  <header class="proj-hero">
    <div class="pg__head rv" style="margin:0">
      <span class="eyebrow">קטלוג דיגיטלי · סופר סת"ם</span>
      <h1 class="t-display" style="font-size:var(--fs-1);line-height:1.08">אתר תפילין ומזוזות<span class="sq" aria-hidden="true"></span></h1>
      <p class="lead muted">קטלוג שמוביל כל מבקר לפנייה בוואטסאפ, עם פאנל ניהול לעדכון מוצרים ותוכן.</p>
      <div class="proj-meta"><span class="chip">אפיון</span><span class="chip">עיצוב</span><span class="chip">פיתוח</span><span class="chip">פאנל ניהול</span></div>
    </div>
    <div class="rv" style="position:relative">${devTefillin(true)}</div>
  </header>

  <section class="sec-head rv"><span class="eyebrow">מה בניתי</span><h2 class="t-display h2">קטלוג שמוביל לפנייה<span class="sq" aria-hidden="true"></span></h2>
    <ul class="ticks" style="margin-top:8px"><li>קטלוג מוצרים: תפילין, מזוזות ופרשיות, עם תיאור ברור לכל מוצר</li><li>כפתור פנייה בוואטסאפ בכל עמוד, כדי שהמבקר לא יצטרך לחפש איך ליצור קשר</li><li>פאנל ניהול שמאפשר לעדכן מוצרים, מחירים ותוכן בלי מפתח</li></ul>
  </section>

  <div class="shots shots--2">
    <figure class="rv"><img src="assets/img/tefillin-mock-2-crop.webp" width="1100" height="966" alt="הדף הראשי של האתר על מסך מחשב נייד" decoding="async"><figcaption>דף הבית: הבטחה אחת וכפתורי פנייה</figcaption></figure>
    <figure class="rv"><img src="assets/img/tefillin-mock-4-crop.webp" width="1100" height="880" alt="עמוד מוצר בדסקטופ ובנייד" decoding="async"><figcaption>עמוד מוצר, בדסקטופ ובנייד</figcaption></figure>
  </div>
  <div class="shots" style="margin-top:var(--sp-inner)"><figure class="rv"><img src="assets/img/tefillin-mock-5-crop.webp" width="1100" height="929" alt="רשימת המוצרים עם מחירים וכפתור הצעת מחיר" decoding="async"><figcaption>רשימת מוצרים, עם כפתור פנייה לכל מוצר</figcaption></figure></div>

  <nav class="pnav" aria-label="ניווט בין פרויקטים"><a class="btn btn--ghost" href="projects.html">לכל הפרויקטים</a><a class="btn btn--primary" href="project-system.html">לפרויקט הבא ${ARROW}</a></nav>
</div>`;
write('project-tefillin.html', { title: 'אתר תפילין ומזוזות | Sara Ankava', desc: 'קטלוג דיגיטלי לסופר סת"ם עם פנייה בוואטסאפ ופאנל ניהול.', cur: 'projects', body: pTef });

/* ================= עמוד פרויקט: מערכת ================= */
const pSys = `
<div class="wrap pg">
  ${back}
  <header class="proj-hero">
    <div class="pg__head rv" style="margin:0">
      <span class="eyebrow">מערכת · דמו</span>
      <h1 class="t-display" style="font-size:var(--fs-1);line-height:1.08">מרכז הזמנות ולקוחות<span class="sq" aria-hidden="true"></span></h1>
      <p class="lead muted">מערכת אחת במקום וואטסאפ ואקסל, בעטיפה של סטודיו לפרחים ומתנות.</p>
      <div class="proj-meta"><span class="chip">אבחון תהליכים</span><span class="chip">מערכת</span><span class="chip">דמו עם נתונים לדוגמה</span></div>
    </div>
    <div class="rv">${devSystem()}</div>
  </header>

  <section class="sec-head rv"><span class="eyebrow">מה בניתי</span><h2 class="t-display h2">מקום אחד לכל מה שנכנס לעסק<span class="sq" aria-hidden="true"></span></h2>
    <ul class="ticks" style="margin-top:8px"><li>הזמנות ולקוחות במקום אחד, במקום הודעות פזורות ורשימות באקסל</li><li>סטטוס ברור לכל הזמנה: ממתינה, בהכנה, מאושרת</li><li>תמונת מצב יומית: כמה הזמנות, כמה ממתינות, וכמה משלוחים</li></ul>
    <p class="muted" style="margin:6px 0 0;font-size:var(--fs-5)">זהו דמו. השמות והנתונים בו לדוגמה בלבד.</p>
  </section>

  <div class="shots shots--2">
    <figure class="rv">${devSystem('cust')}<figcaption>מסך לקוחות</figcaption></figure>
    <figure class="rv">${devSystem()}<figcaption>מסך הזמנות</figcaption></figure>
  </div>

  <nav class="pnav" aria-label="ניווט בין פרויקטים"><a class="btn btn--ghost" href="project-tefillin.html">לפרויקט הקודם</a><a class="btn btn--primary" href="#contact">רוצים נכס כזה לעסק שלכם? נדבר ${ARROW}</a></nav>
</div>`;
write('project-system.html', { title: 'מרכז הזמנות ולקוחות | Sara Ankava', desc: 'דמו של מערכת הזמנות ולקוחות בעטיפה של סטודיו לפרחים ומתנות.', cur: 'projects', body: pSys });

/* ================= משפטי ו-404 ================= */
const legal = `
<div class="wrap pg">
  <header class="pg__head"><span class="eyebrow">פרטיות ונגישות</span><h1 class="t-display" style="font-size:var(--fs-2);line-height:1.1">הכול בשפה פשוטה<span class="sq" aria-hidden="true"></span></h1></header>
  <div class="legal">
    <section id="privacy"><h2>פרטיות</h2><p>כשמשאירים פרטים בטופס אני מקבלת שם, מספר טלפון, ואם בחרתם לכתוב, משפט על העסק.</p><p>הפרטים משמשים רק כדי לחזור אליכם לשיחה, ולא מועברים לאף גורם אחר.</p><p>אפשר לבקש לראות, לתקן או למחוק את הפרטים בכל עת, בהודעה בוואטסאפ.</p></section>
    <section id="accessibility"><h2>נגישות</h2><p>האתר נבנה כך שאפשר לנווט בו במקלדת, עם ניגודיות צבעים גבוהה ועם תמיכה בהעדפת "הפחתת תנועה" של המכשיר.</p><p>נתקלתם במשהו שלא נגיש? כתבו לי בוואטסאפ ואתקן.</p></section>
    <section id="cookies"><h2>עוגיות</h2><p>האתר לא משתמש בעוגיות מעקב או פרסום.</p></section>
  </div>
</div>`;
write('legal.html', { title: 'פרטיות ונגישות | Sara Ankava', desc: 'מדיניות פרטיות והצהרת נגישות של האתר.', cur: 'legal', body: legal });
const nf = `<section class="nf"><div><span class="eyebrow">שגיאה 404</span><b aria-hidden="true">404</b><h1 class="t-display h2">הדף הזה לא קיים<span class="sq" aria-hidden="true"></span></h1><p class="muted">אולי הקישור השתנה. אפשר לחזור לדף הבית.</p><a class="btn btn--primary" href="index.html">לדף הבית</a></div></section>`;
write('404.html', { title: 'הדף לא נמצא | Sara Ankava', desc: 'הדף לא נמצא.', cur: 'none', body: nf });
console.log('built');
