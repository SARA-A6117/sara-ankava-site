// מוקאפים לפרויקטים: דסקטופ + מובייל. מידות ב-cqw, כך שהכול מתכווץ יחד עם הקונטיינר.
const bar = url => `<div class="mk__bar"><b></b><b></b><b></b><span lang="en" dir="ltr">${url}</span></div>`;

/* ---------- איורים ---------- */
const tefillin = `<svg class="mk__art" viewBox="0 0 120 120" aria-hidden="true"><path d="M60 72C60 94 44 98 40 116" fill="none" stroke="#1d1610" stroke-width="8" stroke-linecap="round"/><path d="M62 72C64 92 82 96 86 114" fill="none" stroke="#1d1610" stroke-width="8" stroke-linecap="round"/><rect x="36" y="24" width="50" height="50" rx="5" fill="#1d1610"/><rect x="40" y="28" width="42" height="9" rx="2" fill="#3a2d22"/><path d="M47 52h28M47 61h28" stroke="#B08D57" stroke-width="2.2" stroke-linecap="round"/></svg>`;
const mezuzah = `<svg class="mk__art" viewBox="0 0 120 120" aria-hidden="true"><rect x="45" y="10" width="30" height="100" rx="10" fill="#B08D57"/><rect x="50" y="15" width="20" height="90" rx="7" fill="none" stroke="#2B2118" stroke-opacity=".28"/><text x="60" y="68" text-anchor="middle" font-size="27" font-weight="700" fill="#2B2118" font-family="Sara Ankava,Rubik,sans-serif">ש</text></svg>`;
const bag = `<svg class="mk__art" viewBox="0 0 120 120" aria-hidden="true"><rect x="26" y="40" width="68" height="50" rx="8" fill="#2B2118"/><path d="M46 40v-8a14 14 0 0 1 28 0v8" fill="none" stroke="#2B2118" stroke-width="6"/><rect x="26" y="58" width="68" height="6" fill="#B08D57"/></svg>`;
const case1 = `<svg class="mk__art" viewBox="0 0 120 120" aria-hidden="true"><rect x="30" y="28" width="60" height="64" rx="9" fill="#B08D57"/><rect x="38" y="36" width="44" height="48" rx="5" fill="none" stroke="#2B2118" stroke-opacity=".35"/><circle cx="60" cy="60" r="8" fill="#2B2118"/></svg>`;
const blocks = `<svg class="mk__art" viewBox="0 0 120 120" aria-hidden="true"><rect x="14" y="62" width="42" height="42" rx="5" fill="#FF7A3D"/><circle cx="84" cy="83" r="21" fill="#1F3A5F"/><path d="M26 62l23-34 23 34z" fill="#7FD1C7"/><rect x="62" y="40" width="26" height="26" rx="4" fill="#9ED36A"/></svg>`;

/* ---------- אתר תפילין ומזוזות ---------- */
const tefDesktop = (url = 'tefillin-mezuzot.co.il') => `<div class="mk__win">${bar(url)}
  <div class="mk__page">
    <div class="mk__nav"><span class="mk__brand">תפילין ומזוזות</span><span class="mk__links"><span>קטלוג</span><span>איך בוחרים</span><span>שאלות</span><span>צור קשר</span></span><span class="mk__cta">שאלו בוואטסאפ</span></div>
    <div class="mk__hero">
      <div><h4 class="mk__h">תפילין ומזוזות.<br>בחירה פשוטה.</h4><p class="mk__p">קטלוג מסודר, והשאלות נענות בהודעה אחת.</p><div class="mk__btns"><span class="mk__btn">לקטלוג</span><span class="mk__btn mk__btn--wa">שאלו בוואטסאפ</span></div></div>
      <div class="mk__vis">${tefillin}</div>
    </div>
    <div class="mk__row">
      <div class="mk__card"><div class="mk__vis">${tefillin}</div><b>תפילין</b><small>לפרטים</small></div>
      <div class="mk__card"><div class="mk__vis">${mezuzah}</div><b>מזוזות</b><small>לפרטים</small></div>
      <div class="mk__card"><div class="mk__vis">${case1}</div><b>בתים ונרתיקים</b><small>לפרטים</small></div>
      <div class="mk__card"><div class="mk__vis">${bag}</div><b>תיקים</b><small>לפרטים</small></div>
    </div>
  </div><span class="mk__wa"></span></div>`;
const tefPhone = (art = mezuzah, title = 'מזוזה') => `<div class="mk__phone"><div class="mk__scr">
    <div class="mk__ptop"><span class="mk__brand">תפילין ומזוזות</span><span class="mk__ham"><i></i><i></i></span></div>
    <div class="mk__vis">${art}</div>
    <b class="mk__ph">${title}</b>
    <div class="mk__chips"><span class="on">רגיל</span><span>מהודר</span><span>מהודר+</span></div>
    <span class="mk__pbtn">שאלו על הפריט</span>
  </div></div>`;
const tefPdp = `<div class="mk__win">${bar('tefillin-mezuzot.co.il/mezuzot')}
  <div class="mk__page mk__page--pdp">
    <div class="mk__nav"><span class="mk__brand">תפילין ומזוזות</span><span class="mk__links"><span>קטלוג</span><span>איך בוחרים</span><span>שאלות</span></span><span class="mk__cta">שאלו בוואטסאפ</span></div>
    <div class="mk__pdp">
      <div><div class="mk__vis mk__vis--lg">${mezuzah}</div><div class="mk__thumbs"><div class="mk__vis">${mezuzah}</div><div class="mk__vis">${case1}</div><div class="mk__vis">${tefillin}</div><div class="mk__vis">${bag}</div></div></div>
      <div><small class="mk__crumb">קטלוג / מזוזות</small><h4 class="mk__h">מזוזה</h4><p class="mk__p">בחרו רמת כתב, השוו בין האפשרויות ושאלו על הפריט בהודעה אחת.</p>
        <div class="mk__chips mk__chips--lg"><span class="on">רגיל</span><span>מהודר</span><span>מהודר+</span></div>
        <div class="mk__table"><i></i><i></i><i></i></div>
        <div class="mk__btns"><span class="mk__btn mk__btn--wa">שאלו על הפריט</span><span class="mk__btn">להשוואה</span></div></div>
    </div>
  </div></div>`;
const tefCombo = () => `<div class="mk mk--tef" aria-hidden="true">${tefDesktop()}${tefPhone()}</div>`;
const tefPhones3 = () => `<div class="mk mk--tef mk--phones" aria-hidden="true">${tefPhone(mezuzah, 'מזוזה')}${tefPhone(tefillin, 'תפילין')}${tefPhone(bag, 'תיקים')}</div>`;

/* ---------- הכל לגן ---------- */
const cats = [['ריהוט', '#FF7A3D'], ['יצירה', '#7FD1C7'], ['משחקים', '#B9A7FF'], ['חצר', '#9ED36A'], ['כיתה', '#FFC1D6'], ['אומנות', '#FFD66B']];
const ganDesktop = () => `<div class="mk__win">${bar('hakol-lagan.co.il')}
  <div class="mk__page">
    <div class="mk__nav"><span class="mk__brand">הכל לגן</span><span class="mk__links"><span>קטגוריות</span><span>סניפים</span><span>מבצעים</span><span>צור קשר</span></span><span class="mk__cta">לסניף הקרוב</span></div>
    <div class="mk__hero">
      <div><h4 class="mk__h">הכל לגן.<br>במקום אחד.</h4><p class="mk__p">ציוד לגני ילדים, מסודר לפי מה שהגננת מחפשת.</p><div class="mk__search"><span>מה הגננת מחפשת?</span><i>חיפוש</i></div></div>
      <div class="mk__vis">${blocks}</div>
    </div>
    <div class="mk__cats">${cats.map(([t, c]) => `<div><i style="--c:${c}"></i><span>${t}</span></div>`).join('')}</div>
  </div></div>`;
const ganPhone = () => `<div class="mk__phone"><div class="mk__scr">
    <div class="mk__ptop"><span class="mk__brand">הכל לגן</span><span class="mk__ham"><i></i><i></i></span></div>
    <div class="mk__search mk__search--sm"><span>מה הגננת מחפשת?</span></div>
    <div class="mk__grid6">${cats.map(([t, c]) => `<div style="--c:${c}"><i></i><span>${t}</span></div>`).join('')}</div>
  </div></div>`;
const ganCombo = () => `<div class="mk mk--gan" aria-hidden="true">${ganDesktop()}${ganPhone()}</div>`;

module.exports = { tefCombo, tefPhones3, tefDesktop, tefPdp: () => `<div class="mk mk--tef" aria-hidden="true">${tefPdp}</div>`, tefHomeOnly: () => `<div class="mk mk--tef" aria-hidden="true">${tefDesktop()}</div>`, ganCombo };
