// בונה את דפי v6 מחלקים משותפים: node tools/build.js  (מתוך התיקייה versions/v6)
const fs = require('fs'), path = require('path');
const out = p => path.join(__dirname, '..', p);
const A_D = 'M260 520A260 260 0 0 1 0 260A350 260 0 0 1 350 0A350 260 0 0 1 700 260L700 490Q700 520 670 520L500 520L500 275.6A160 86 0 1 0 486 299.5L486 520Z';

const sprite = `<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false"><defs>
<linearGradient id="gl" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#C6FF34" stop-opacity=".95"/><stop offset="1" stop-color="#C6FF34" stop-opacity=".32"/></linearGradient>
<symbol id="mark" viewBox="0 0 900 520"><path d="${A_D}" fill="currentColor"/><rect x="740" y="380" width="140" height="140" rx="14" fill="currentColor"/></symbol>
<symbol id="arr" viewBox="0 0 24 24"><path d="M20 12H5m6-6-6 6 6 6" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></symbol>
<symbol id="wa" viewBox="0 0 24 24"><path fill="currentColor" d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></symbol>
</defs></svg>`;
const arr = '<svg aria-hidden="true"><use href="#arr"/></svg>';
const mark = (cls = '') => `<svg class="${cls}" viewBox="0 0 900 520" aria-hidden="true"><use href="#mark"/></svg>`;

// איורי זכוכית אקריליק (בלי זוהר): אותה משפחת חומר כמו האובייקט בהירו
const ill1 = `<svg viewBox="0 0 220 170" role="img" aria-label="איור: עמודות נתונים ועדשה"><g stroke="#000" stroke-width="1.5" stroke-linejoin="round"><rect x="18" y="72" width="44" height="78" rx="8" fill="url(#gl)"/><rect x="74" y="36" width="44" height="114" rx="8" fill="url(#gl)"/><rect x="130" y="94" width="44" height="56" rx="8" fill="url(#gl)"/><path d="M6 150h208" stroke-linecap="round"/><path d="M178 78l26 26" stroke-width="7" stroke-linecap="round"/><circle cx="156" cy="54" r="34" fill="#fff" fill-opacity=".4"/></g><g stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".8" fill="none"><path d="M27 86v44M83 50v84M139 108v28M134 44a24 24 0 0 1 18-14"/></g></svg>`;
const ill2 = `<svg viewBox="0 0 220 170" role="img" aria-label="איור: שלושה עיגולים חופפים"><g stroke="#000" stroke-width="1.5" style="mix-blend-mode:multiply"><circle cx="84" cy="104" r="52" fill="url(#gl)"/><circle cx="140" cy="104" r="52" fill="url(#gl)"/><circle cx="112" cy="56" r="52" fill="url(#gl)"/></g><rect x="106" y="84" width="12" height="12" fill="#000"/><g stroke="#fff" stroke-width="3" stroke-linecap="round" fill="none" opacity=".8"><path d="M44 90a40 40 0 0 1 22-30M100 38a40 40 0 0 1 22-6M102 128a40 40 0 0 1-12-16"/></g></svg>`;
const ill3 = `<svg viewBox="0 0 220 150" role="img" aria-label="איור: ה-a והריבוע מהלוגו"><g transform="translate(10 14) scale(.19)" stroke="#000" stroke-width="8" stroke-linejoin="round"><path d="${A_D}" fill="url(#gl)"/><rect x="740" y="380" width="140" height="140" rx="14" fill="url(#gl)"/></g><path d="M30 92a74 56 0 0 1 56-60" stroke="#fff" stroke-width="3" stroke-linecap="round" fill="none" opacity=".85" transform="translate(10 14)"/></svg>`;

const header = (active = '') => {
  const h = active === 'home' ? '' : 'index.html';
  return `<a class="skip" href="#main">דלגו לתוכן</a>
<header class="hd"><div class="hd__in">
<a class="hd__logo" href="${h || '#top'}" aria-label="Sara Ankava, לדף הבית"><img src="assets/brand/logo-lime.png" width="1073" height="125" alt="Sara Ankava"></a>
<nav class="nav" aria-label="ראשי"><a href="${h}#how">איך עובדים</a><a href="${active === 'projects' ? 'projects.html' : h + '#projects'}"${active === 'projects' ? ' aria-current="page"' : ''}>פרויקטים</a><a href="${h}#about">אודות</a><a href="${h}#contact">צרו קשר</a></nav>
<a class="btn" href="${h}#contact">בואו נדבר ${arr}</a>
</div></header>`;
};

const footer = `<footer class="ft on-dark" id="contact"><div class="wrap">
<div class="ft__grid">
<div class="rv"><p class="tag" style="margin-bottom:24px">צרו קשר</p><h2 class="h2">מה קורה כשפונים אליי?</h2>
<ol class="flow">
<li><div><b>משאירים פרטים</b><span>שם, טלפון ושורה על העסק. זה לוקח דקה.</span></div></li>
<li><div><b>אני חוזרת תוך 24 שעות</b><span>שיחה קצרה על העסק שלכם: מה עובד היום ולאן רוצים להגיע.</span></div></li>
<li><div><b>מבינים מה הצעד הנכון</b><span>אם יש התאמה, מתחילים באבחון נתוני העסק.</span></div></li>
</ol>
<div class="socials"><a href="https://wa.me/972533175560" rel="noopener"><svg aria-hidden="true"><use href="#wa"/></svg>וואטסאפ</a></div>
</div>
<form class="form rv" id="lead" novalidate style="--d:2">
<div class="form__body" style="display:grid;gap:22px">
<h3 class="h3">נעים להכיר. מה העסק שלכם?</h3>
<div class="f"><label for="f-name">שם מלא</label><input id="f-name" type="text" autocomplete="name" placeholder="איך קוראים לכם?" aria-describedby="f-name-e"><span class="err" id="f-name-e" role="alert"></span></div>
<div class="f"><label for="f-tel">טלפון</label><input id="f-tel" type="tel" inputmode="tel" autocomplete="tel" placeholder="050-000-0000" dir="ltr" style="text-align:right" aria-describedby="f-tel-e"><span class="err" id="f-tel-e" role="alert"></span></div>
<fieldset class="f"><legend>מה מעניין אתכם? (אפשר לבחור כמה)</legend><div class="chips">
<label class="chip"><input type="checkbox" name="svc" value="חנות שמוכרת"><span>חנות שמוכרת</span></label>
<label class="chip"><input type="checkbox" name="svc" value="מערכת שמסדרת את הבלגן"><span>מערכת שמסדרת את הבלגן</span></label>
<label class="chip"><input type="checkbox" name="svc" value="אתר תדמית שמביא פניות"><span>אתר תדמית שמביא פניות</span></label>
<label class="chip"><input type="checkbox" name="svc" value="ריטיינר: ליווי שוטף"><span>ריטיינר: ליווי שוטף</span></label>
</div></fieldset>
<div class="f"><label for="f-note">ספרו בקצרה על העסק (לא חובה)</label><textarea id="f-note" placeholder="מה העסק עושה, ומה הייתם רוצים לקדם?"></textarea></div>
<button class="btn btn--xl" type="submit"><span class="row"><span>השאירו פרטים</span>${arr}</span><small>ותוך 24 שעות אחזור אליכם לשיחה קצרה על העסק שלכם</small></button>
<p class="form__note">הפרטים משמשים רק כדי לחזור אליכם. <a href="legal.html#privacy">מדיניות פרטיות</a></p>
</div>
<div class="form__ok" role="status"><h3 class="h3" id="ok-h" tabindex="-1">תודה, קיבלתי.</h3><p class="mute">אם חלון הוואטסאפ לא נפתח, לחצו כאן כדי שההודעה תגיע אליי מיד.</p><a class="btn" id="ok-wa" href="https://wa.me/972533175560" rel="noopener"><svg aria-hidden="true" style="width:22px;height:22px"><use href="#wa"/></svg>המשך בוואטסאפ</a></div>
</form>
</div>
<div class="ft__bar"><img src="assets/brand/logo-lime.png" width="1073" height="125" alt="Sara Ankava"><span>שיווק ונכסים דיגיטליים</span><nav aria-label="משני"><a href="projects.html">פרויקטים</a><a href="legal.html">נגישות ופרטיות</a></nav><span dir="ltr">© <span id="yr">2026</span> Sara Ankava</span></div>
</div></footer>
<a class="wa" href="https://wa.me/972533175560" rel="noopener" aria-label="שלחו לי הודעה בוואטסאפ"><span class="wa__l">דברו איתי בוואטסאפ</span><span class="wa__b"><svg aria-hidden="true"><use href="#wa"/></svg></span></a>`;

const head = (title, desc, file) => `<!doctype html>
<html lang="he" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title}</title><meta name="description" content="${desc}"><meta name="theme-color" content="#000000">
<meta property="og:type" content="website"><meta property="og:locale" content="he_IL"><meta property="og:title" content="${title}"><meta property="og:description" content="${desc}">
<link rel="icon" href="assets/brand/favicon.svg" type="image/svg+xml">
<link rel="preload" href="assets/fonts/SaraAnkava-Bold-v1.2.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Rubik:wght@400;500&display=swap">
<link rel="stylesheet" href="assets/css/s.css?v=1">
<script>document.documentElement.classList.add('js')</script></head>`;
const tail = `<script src="assets/js/s.js?v=1" defer></script></body></html>`;

// מוקאפים
const dev = (img, alt, url) => `<div class="dev"><div class="dev__bar"><i></i><i></i><i></i><u>${url}</u></div><img src="assets/img/${img}" width="1200" height="750" alt="${alt}" loading="lazy"></div>`;
const phone = (img, alt) => `<div class="phone"><img src="assets/img/${img}" width="390" height="844" alt="${alt}" loading="lazy"></div>`;
const dash = `<div class="dev"><div class="dev__bar"><i></i><i></i><i></i><u>demo · studio</u></div><div class="dashc"><div class="dash" role="img" aria-label="דמו: מסך הזמנות ולקוחות של סטודיו לפרחים ומתנות">
<div class="dash__sb"><b>סטודיו פרחים</b><span class="on">הזמנות</span><span>לקוחות</span><span>משלוחים</span><span>מלאי</span><span>דוחות</span></div>
<div class="dash__m"><div class="dash__t">הזמנות היום<i>+ הזמנה חדשה</i></div>
<div class="dash__k"><div><small>הזמנות פתוחות</small><strong>12</strong></div><div><small>למשלוח היום</small><strong>7</strong></div><div><small>לקוחות חוזרים</small><strong>64%</strong></div></div>
<div class="dash__tb"><div><span>לקוח</span><span>הזמנה</span><span>מועד</span><span>סטטוס</span></div>
<div><span>נועה ל.</span><span>זר ורדים</span><span>היום, 16:00</span><em class="g">בהכנה</em></div>
<div><span>דנה כ.</span><span>סל מתנה</span><span>היום, 18:30</span><em>חדש</em></div>
<div><span>משרד אורן</span><span>12 זרים</span><span>מחר, 09:00</span><em class="k">מאושר</em></div>
<div><span>רוני ש.</span><span>עציץ + כרטיס</span><span>מחר, 12:00</span><em>חדש</em></div>
<div><span>גלית מ.</span><span>זר חתונה</span><span>שישי, 10:00</span><em class="k">מאושר</em></div>
<div><span>אלון ד.</span><span>סל פירות</span><span>שישי, 13:00</span><em class="g">בהכנה</em></div></div></div></div></div></div>`;

// ====== דף הבית ======
const home = `${head('Sara Ankava | שיווק ונכסים דיגיטליים', 'שרי אנקווה, אסטרטגית שיווק עם רגל טכנולוגית. מתחילים מהבנה של העסק, ואז בונים תוכנית שיווק ונכס דיגיטלי אחד.', 'index.html')}
<body id="top">${sprite}${header('home')}
<main id="main">
<section class="hero" aria-labelledby="h1">
<div class="obj" aria-hidden="true"><div class="obj__tilt"><div class="obj__l obj__a"></div><div class="obj__l obj__sq"></div></div></div>
<div class="hero__txt"><div class="hero__col">
<p class="tag">שיווק ונכסים דיגיטליים</p>
<h1 class="h1" id="h1"><span class="ln" style="--i:0"><span>העסק שלכם הצליח</span></span><span class="ln" style="--i:1"><span>בפה לאוזן.</span></span><span class="ln" style="--i:2"><span>הגיע הזמן</span></span><span class="ln" style="--i:3"><span>לשלב <span class="hl">הבא.</span></span></span></h1>
<p class="hero__sub">מתחילים מהבנה של העסק שלכם, ואז בונים תוכנית שיווק ונכס דיגיטלי אחד שלוקחים אותו רחוק יותר.</p>
<div class="hero__cta"><a class="btn btn--xl" href="#contact"><span class="row"><span>השאירו פרטים</span>${arr}</span><small>ותוך 24 שעות אחזור אליכם לשיחה קצרה על העסק שלכם</small></a><a class="cue" href="#projects"><i></i>לפרויקטים</a></div>
</div></div>
</section>

<div class="strip" aria-hidden="true"><div class="strip__t">${Array(2).fill(`<span>אבחון נתוני העסק ${mark()} תוכנית שיווק ${mark()} נכס דיגיטלי אחד ${mark()} אבחון נתוני העסק ${mark()} תוכנית שיווק ${mark()} נכס דיגיטלי אחד ${mark()}</span>`).join('')}</div></div>

<section class="sec on-light" id="how" aria-labelledby="how-h"><div class="wrap how">
<div class="how__aside rv"><p class="tag">איך עובדים</p><h2 class="h2" id="how-h">לפני שבונים משהו, מבינים מה באמת צריך.</h2><p class="mute">שלושה שלבים, בסדר הזה. כל שלב נשען על הקודם, ובסוף יש לכם תוכנית ונכס אחד שעובדים יחד.</p>
<p class="after"><span><b>אחרי העלייה לאוויר:</b> ריטיינר, ליווי שוטף הכולל תחזוקה, גיבויים ובנק שעות.</span></p></div>
<ol class="steps">
<li class="step"><div><p class="step__n"><b>1</b><bdi dir="ltr">01 / 03</bdi></p><h3 class="h3">אבחון נתוני העסק</h3><p>כניסות, הזמנות והמרות. קוראים את המספרים של העסק ומבינים מאיפה מגיעים הלקוחות ואיפה הכי כדאי להשקיע.</p></div>${ill1}</li>
<li class="step"><div><p class="step__n"><b>2</b><bdi dir="ltr">02 / 03</bdi></p><h3 class="h3">תוכנית שיווק</h3><p>קהלי יעד, מסרים וערוצים. מי הלקוחות הנכונים, מה אומרים להם ואיפה פוגשים אותם.</p></div>${ill2}</li>
<li class="step"><div><p class="step__n"><b>3</b><bdi dir="ltr">03 / 03</bdi></p><h3 class="h3">נכס דיגיטלי אחד</h3><p>במקום שלושה כלים שלא מדברים זה עם זה, בונים נכס אחד שעובד לפי התוכנית.</p><ul class="step__tags"><li>חנות שמוכרת</li><li>מערכת שמסדרת את הבלגן</li><li>אתר תדמית שמביא פניות</li></ul></div>${ill3}</li>
</ol></div></section>

<section class="sec" id="projects" aria-labelledby="pj-h"><div class="wrap">
<div class="pj-head rv"><div style="display:grid;gap:24px"><p class="tag">פרויקטים נבחרים</p><h2 class="h2" id="pj-h">כל עסק הוא סיפור אחר. גם הנכס שלו צריך להיות.</h2></div></div>

<article class="stage rv"><div class="stage__media">${dev('t-home.webp', 'צילום מסך של אתר תפילין ומזוזות בדסקטופ', 'refael-ankava.com')}${phone('t-home-m.webp', 'צילום מסך של האתר במובייל')}</div>
<div><p class="stage__n"><i></i>01 / אתר + קטלוג</p><h3 class="h3">אתר תפילין ומזוזות</h3>
<ul class="stage__what"><li>קטלוג מוצרים עם פנייה ישירה בוואטסאפ, במקום עגלת קניות.</li><li>פאנל ניהול לעדכון מוצרים ותוכן, בלי מתכנת.</li><li>ניהול הפניות שמגיעות מהאתר.</li></ul>
<a class="btn" href="project-tefillin.html">לפרויקט המלא ${arr}</a></div></article>

<article class="stage stage--rev rv"><div class="stage__media">${dash}</div>
<div><p class="stage__n"><i></i>02 / מערכת (דמו)</p><h3 class="h3">מערכת מרכז הזמנות ולקוחות</h3>
<ul class="stage__what"><li>כל ההזמנות והלקוחות במקום אחד, במקום וואטסאפ ואקסל.</li><li>אבחון התהליך: איך הזמנה מתקדמת מהפנייה ועד המסירה.</li><li>דמו בעטיפה של סטודיו לפרחים ומתנות.</li></ul>
<a class="btn" href="project-orders.html">לפרויקט המלא ${arr}</a></div></article>

<div class="next rv"><div class="next__mark" style="color:var(--lime)">${mark()}</div><div><h3 class="h3">הפרויקט הבא שלכם</h3><p class="mute">העסק שלכם יכול להיות כאן. מתחילים משיחה קצרה.</p></div><div class="next__btn"><a class="btn" href="#contact">בואו נדבר ${arr}</a></div></div>
<div class="all"><a class="btn btn--ghost" href="projects.html">לכל הפרויקטים ${arr}</a></div>
</div></section>

<section class="sec on-light" id="about" aria-labelledby="ab-h" style="overflow:hidden"><div class="wrap about">
<div class="about__ph rv"><div style="position:relative;width:100%"><div class="bub"><div class="bub__ph"><svg viewBox="0 0 900 520" aria-hidden="true" style="color:rgb(255 255 255/.25)"><use href="#mark"/></svg><span>כאן תופיע התמונה שלי<br>(assets/img/sara.jpg)</span></div></div><span class="bub-sq" aria-hidden="true"></span></div><a class="btn" href="#contact">לדבר איתי ${arr}</a></div>
<div class="about__txt rv" style="--d:1"><p class="tag">אודות</p><h2 class="h2" id="ab-h">שרי אנקווה. אסטרטגית שיווק עם רגל טכנולוגית.</h2>
<p class="body">עסקים שגדלים מגלים בשלב מסוים שמה שעבד כשהיו קטנים כבר לא מחזיק. ראיתי את זה מבפנים: עבדתי כשכירה על אתר החנות של עסק שצמח מהר, ארבעה סניפים ושני אתרים, ונכנסתי להבין מה באמת צריך. כך למשל, היום אני מנהלת להם את השיווק ומנתחת בעצמי את נתוני האתר, ההזמנות והקמפיינים. מה שלמדתי: <strong>אתר בלי תנועה הוא כמו לונה פארק מטורף שנבנה באמצע המדבר, בלי כבישים ובלי דרך להגיע אליו.</strong> וגם ההפך, כבישים מושלמים שמובילים לשטח ריק. לכן אני מתחילה מלהבין את העסק לעומק, ורק אחר כך בונה את שני החלקים יחד: תוכנית שיווק ונכס דיגיטלי אחד. <strong>כי אני מאמינה שעסק חייב גם נכס שעובד וגם תנועה אליו.</strong></p></div>
</div></section>
</main>
${footer}
${tail}`;

// ====== עמוד פרויקטים ======
const projects = `${head('פרויקטים | Sara Ankava', 'פרויקטים נבחרים של שרי אנקווה: אתר קטלוג עם פאנל ניהול ומערכת הזמנות ולקוחות.', 'projects.html')}
<body id="top">${sprite}${header('projects')}
<main id="main"><section class="pg-hero"><div class="wrap"><p class="tag rv" style="margin-bottom:24px">פרויקטים</p><h1 class="h1 rv" style="--d:1">ככה זה נראה כשמתחילים מהנתונים.</h1><p class="lead mute rv" style="--d:2;max-width:26em">בכל פרויקט כאן: קודם הבנה של העסק, אחר כך נכס אחד שעובד.</p></div></section>
<section style="padding-bottom:var(--gs)"><div class="wrap grid2">
<a class="card rv" href="project-tefillin.html"><div class="card__m">${dev('t-home.webp', 'אתר תפילין ומזוזות', 'refael-ankava.com')}${phone('t-home-m.webp', 'האתר במובייל')}</div><div class="card__t"><div><p class="card__k">01 · אתר קטלוג + פאנל ניהול</p><h2 class="h3">אתר תפילין ומזוזות</h2></div>${arr}</div></a>
<a class="card rv" style="--d:1" href="project-orders.html"><div class="card__m">${dash}</div><div class="card__t"><div><p class="card__k">02 · מערכת (דמו)</p><h2 class="h3">מערכת מרכז הזמנות ולקוחות</h2></div>${arr}</div></a>
<div class="card card--soon rv" style="--d:2"><p class="card__k">03 · מקום לפרויקט הבא</p><h2 class="h3">הפרויקט הבא שלכם</h2><p class="mute">העסק שלכם יכול להיות כאן.</p><a class="btn" href="index.html#contact">בואו נדבר ${arr}</a></div>
</div></section></main>
${footer}
${tail}`;

// ====== עמודי פרויקט ======
const proj = (o) => `${head(o.title + ' | Sara Ankava', o.desc, o.file)}
<body id="top">${sprite}${header('projects')}
<main id="main"><section class="pg-hero"><div class="wrap">
<a class="cue" href="projects.html" style="margin-bottom:24px">← לכל הפרויקטים</a>
<p class="tag rv" style="margin-bottom:20px">${o.kind}</p><h1 class="h1 rv" style="--d:1">${o.name}</h1><p class="lead mute rv" style="--d:2;max-width:26em;margin-top:20px">${o.lead}</p>
<div class="stage__media rv" style="margin-top:var(--gg);--d:3">${o.hero}</div>
<dl class="facts">${o.facts.map(f => `<div><dt>${f[0]}</dt><dd>${f[1]}</dd></div>`).join('')}</dl></div></section>
<section><div class="wrap">${o.body}
<nav class="pn" aria-label="פרויקטים"><a href="${o.prev[0]}"><small>← הפרויקט הקודם</small><b>${o.prev[1]}</b></a><a href="${o.next[0]}"><small>הפרויקט הבא →</small><b>${o.next[1]}</b></a></nav>
<div class="all"><a class="btn" href="index.html#contact">בואו נדבר ${arr}</a></div></div></section></main>
${footer}
${tail}`;

const draft = '<span class="draft">טיוטה לעריכה</span>';
const tef = proj({
  file: 'project-tefillin.html', title: 'אתר תפילין ומזוזות', desc: 'אתר קטלוג לסופר סת״ם עם פנייה ישירה בוואטסאפ ופאנל ניהול.',
  kind: 'אתר + קטלוג', name: 'אתר תפילין ומזוזות', lead: 'אתר קטלוג שמוביל לפנייה בוואטסאפ, עם פאנל ניהול שמאפשר לעדכן בלי מתכנת.',
  hero: dev('t-home.webp', 'דף הבית של האתר בדסקטופ', 'refael-ankava.com') + phone('t-home-m.webp', 'דף הבית במובייל'),
  facts: [['סוג הנכס', 'אתר + קטלוג'], ['תחום', 'סת״ם: תפילין ומזוזות'], ['מה נכלל', 'אפיון, עיצוב, פיתוח, פאנל ניהול']],
  body: `<div class="cs rv"><h2 class="h2" style="font-size:var(--t3)">מה היה לפני</h2><div><p>[לעדכן] פסקה אחת: איפה היה העסק כשהגעתי, בלשון של בעל העסק, לא בז׳רגון.</p>${draft}</div></div>
<div class="cs rv"><h2 class="h2" style="font-size:var(--t3)">מה ראיתי בנתונים</h2><div><div class="finds"><div class="find"><b>ממצא 1</b><span>מה הנתונים הראו.</span></div><div class="find"><b>ממצא 2</b><span>איפה העסק דלף.</span></div><div class="find"><b>ממצא 3</b><span>מה זה אומר לבנייה.</span></div></div>${draft}</div></div>
<div class="cs rv"><h2 class="h2" style="font-size:var(--t3)">מה בניתי</h2><div class="shots">
<figure class="shot">${dev('t-mezuzot.webp', 'עמוד מוצר של מזוזות עם בחירת גודל וכפתור התקשרו', 'refael-ankava.com/mezuzot')}<figcaption>עמוד מוצר: גודל, תמונות ופנייה ישירה במקום עגלה.</figcaption></figure>
<div class="shots shots--2"><figure class="shot"><div class="dev"><div class="dev__bar"><i></i><i></i><i></i><u>סקרול מלא</u></div><div class="scrolly" role="img" aria-label="דף הבית המלא בגלילה" style="aspect-ratio:1200/750;background:url(assets/img/t-home-tall.webp) top/100% auto no-repeat;transition:background-position 14s linear" onmouseenter="this.style.backgroundPosition='bottom'" onmouseleave="this.style.backgroundPosition='top'"></div></div><figcaption>דף הבית המלא (העבירו עכבר כדי לגלול).</figcaption></figure>
<figure class="shot" style="justify-items:center"><div style="width:min(260px,70%)"><div class="dev" style="border-radius:26px"><img src="assets/img/t-mezuzot-m.webp" width="390" height="844" alt="עמוד מוצר במובייל" loading="lazy"></div></div><figcaption>אותו עמוד במובייל.</figcaption></figure></div>
<p class="mute">פאנל הניהול: צילום מסך יתווסף. ${draft}</p></div></div>`,
  prev: ['project-orders.html', 'מערכת מרכז הזמנות ולקוחות'], next: ['project-orders.html', 'מערכת מרכז הזמנות ולקוחות']
});
const ord = proj({
  file: 'project-orders.html', title: 'מערכת מרכז הזמנות ולקוחות', desc: 'דמו של מערכת הזמנות ולקוחות, בעטיפה של סטודיו לפרחים ומתנות.',
  kind: 'מערכת (דמו)', name: 'מערכת מרכז הזמנות ולקוחות', lead: 'מערכת אחת במקום וואטסאפ ואקסל. הדמו בנוי בעטיפה של סטודיו לפרחים ומתנות.',
  hero: dash,
  facts: [['סוג הנכס', 'מערכת ניהול'], ['תחום', 'סטודיו לפרחים ומתנות (דמו)'], ['מה נכלל', 'אבחון תהליך, אפיון, בניית מערכת']],
  body: `<div class="cs rv"><h2 class="h2" style="font-size:var(--t3)">מה היה לפני</h2><div><p>[לעדכן] הזמנות שמגיעות בוואטסאפ, רשימות באקסל, ואף אחד לא רואה את התמונה כולה.</p>${draft}</div></div>
<div class="cs rv"><h2 class="h2" style="font-size:var(--t3)">מה בניתי</h2><div><p>מסך הזמנות אחד: כל הזמנה, הלקוח שלה והסטטוס שלה. [צילומי המסך האמיתיים של המערכת יחליפו את הדמו הזה.]</p>${draft}</div></div>`,
  prev: ['project-tefillin.html', 'אתר תפילין ומזוזות'], next: ['project-tefillin.html', 'אתר תפילין ומזוזות']
});

// ====== משפטי ======
const legal = `${head('נגישות ופרטיות | Sara Ankava', 'הצהרת נגישות ומדיניות פרטיות של האתר.', 'legal.html')}
<body id="top">${sprite}${header('legal')}
<main id="main"><section class="pg-hero"><div class="wrap legal"><h1 class="h1" style="font-size:var(--t2)">נגישות ופרטיות</h1>
<h2 id="access">הצהרת נגישות</h2><p>אני שואפת שהאתר יהיה נגיש לכולם: ניווט במקלדת, ניגודיות גבוהה, טקסט אלטרנטיבי לתמונות ותמיכה בהקטנה והגדלה. אם נתקלתם בקושי, כתבו לי בוואטסאפ ואטפל בזה.</p>
<h2 id="privacy">מדיניות פרטיות</h2><p>הטופס באתר אוסף שם, טלפון ושורה על העסק, אך ורק כדי לחזור אליכם לשיחה. המידע לא נמכר ולא מועבר לצד שלישי. אפשר לבקש בכל עת למחוק את הפרטים שלכם.</p>
<p>${draft} הטקסט הזה הוא נוסח ראשוני ודורש בדיקה משפטית לפני עלייה לאוויר.</p></div></section></main>
${footer}
${tail}`;

for (const [f, c] of [['index.html', home], ['projects.html', projects], ['project-tefillin.html', tef], ['project-orders.html', ord], ['legal.html', legal]]) fs.writeFileSync(out(f), c);
console.log('built');
