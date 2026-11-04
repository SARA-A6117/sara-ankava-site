/* טקסטי האתר העריכים. סורק את ה-HTML של v7-light, מסמן טקסטים בלבד ב-data-slot, ומייצר manifest.
   שימוש:  node tools/slots.js mark      מוסיף data-slot לטקסטים שעוד לא מסומנים (בטוח להרצה חוזרת, לא משנה תוכן ומראה)
           node tools/slots.js list      מדפיס את המשבצות
   build-site.js משתמש ב-scan() כדי לבנות את assets/slots.json ולהחליף טקסטים מהמסד. */
const fs = require('fs'), path = require('path');
const DIR = path.resolve(__dirname, '..', 'versions', 'v7-light');
const PAGES = { index: 'דף הבית', projects: 'פרויקטים', privacy: 'פרטיות', terms: 'תנאי שימוש', accessibility: 'נגישות' };
const VOID = new Set(['meta', 'link', 'img', 'input', 'br', 'hr', 'source', 'area', 'base', 'col', 'embed', 'param', 'track', 'wbr']);
const TEXT_TAGS = new Set(['h1', 'h2', 'h3', 'h4', 'p', 'li', 'a', 'span', 'small', 'b', 'strong', 'label', 'button', 'em', 'div']);
/* מקומות שלא נערכים: אזורים סופיים (הירו, פרויקטים), תוכן מהמסד (עמודים משפטיים, רשימת פרויקטים), איורים */
const EXCLUDE_ID = new Set(['top', 'projects']);
const EXCLUDE_CLASS = /\b(pp-list|lg-hero|lg-wrap|lg-body|mk|mk--tef|mk--gan|pj3|stk|doodle|cursor|skip|sr-only|hp)\b/;
const SCOPE_NAMES = { nav: 'תפריט עליון', footer: 'פוטר', why: 'למה (לונה פארק)', lp2__bar: 'למה (לונה פארק)', process: 'תהליך', about: 'אודות', tools: 'כלים', contact: 'צור קשר', 'pp-hero': 'פתיח פרויקטים', 'pp-next': 'הפרויקט הבא', hdr: 'תפריט עליון' };

function tokens(html) { return [...html.matchAll(/<!--[\s\S]*?-->|<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<svg[\s\S]*?<\/svg>|<(\/?)([a-zA-Z0-9]+)([^>]*)>|([^<]+)/g)]; }
function attr(s, n) { const m = s.match(new RegExp('\\b' + n + '="([^"]*)"')); return m ? m[1] : null; }

/* מחזיר רשימת מועמדים: {tagEnd (אינדקס '>' של תג הפתיחה), text, key|null, scope, tag} */
function scan(html, pageName) {
  const out = [], stack = [], counters = {};
  for (const m of tokens(html)) {
    if (m[2] === undefined && m[4] === undefined) continue;             /* הערה/סקריפט/סגנון/svg */
    if (m[2] !== undefined) {
      const closing = m[1] === '/', tag = m[2].toLowerCase(), attrs = m[3] || '';
      if (!closing) {
        const parent = stack[stack.length - 1];
        if (parent) parent.kids++;
        if (VOID.has(tag)) continue;
        const id = attr(attrs, 'id'), cls = attr(attrs, 'class') || '';
        const scopeTag = /^(section|header|footer|nav)$/.test(tag);
        const excl = (parent && parent.excl) || /data-motion-toggle/.test(attrs) || attr(attrs, 'aria-hidden') === 'true' || (id && EXCLUDE_ID.has(id) && tag === 'section') || EXCLUDE_CLASS.test(cls) || tag === 'form' || tag === 'button' && false;
        let scope = parent ? parent.scope : '';
        if (scopeTag) scope = (tag === 'footer' ? 'footer' : tag === 'nav' ? 'nav' : id || (cls.split(/\s+/)[0]) || tag);
        stack.push({ tag, tagEnd: m.index + m[0].length - 1, key: attr(attrs, 'data-slot'), excl, scope, kids: 0, texts: [] });
      } else {
        const el = stack.pop(); if (!el) continue;
        if (!el.excl && TEXT_TAGS.has(el.tag) && el.kids === 0 && el.texts.length === 1) {
          const t = el.texts[0].replace(/\s+/g, ' ').trim();
          if (t.length >= 2 && /[֐-׿A-Za-z]/.test(t) && !/^[\d\s.\/%+©-]+$/.test(t) && !/^&/.test(t)) out.push({ tagEnd: el.tagEnd, text: t, key: el.key, scope: el.scope, tag: el.tag });
        }
      }
    } else {
      const el = stack[stack.length - 1];
      if (el && m[4].trim()) el.texts.push(m[4]);
    }
  }
  return out;
}

function mark() {
  let total = 0; const manifestKeys = {};
  for (const p of Object.keys(PAGES)) {
    const f = path.join(DIR, p + '.html'); let html = fs.readFileSync(f, 'utf8');
    const found = scan(html, p), counters = {};
    const ins = [];
    const keyOf = {};   /* טקסט זהה בעמוד (כותרת שחוזרת בסרגל, כפתור "בואו נדבר" בהדר) משתמש באותו מפתח */
    for (const c of found) {
      if (c.key) continue;
      const shared = c.scope === 'nav' || c.scope === 'footer';
      const scopeName = shared ? c.scope : (p === 'index' ? '' : p + '.') + c.scope;
      const family = /(^|\.)hdr$/.test(c.scope) ? 'nav' : c.scope === 'lp2__bar' ? 'why' : null;
      if (family && keyOf[family + '|' + c.text]) { ins.push({ at: c.tagEnd, key: keyOf[family + '|' + c.text] }); continue; }
      counters[scopeName] = (counters[scopeName] || 0) + 1;
      const key = scopeName + '.' + counters[scopeName];
      keyOf[c.scope + '|' + c.text] = key; if (shared || c.scope === 'why') keyOf[c.scope + '|' + c.text] = key;
      ins.push({ at: c.tagEnd, key });
    }
    ins.sort((a, b) => b.at - a.at).forEach((i) => { html = html.slice(0, i.at) + ' data-slot="' + i.key + '"' + html.slice(i.at); });
    if (ins.length) fs.writeFileSync(f, html);
    total += ins.length; console.log(p + ': +' + ins.length);
  }
  console.log('marked ' + total);
}

if (require.main === module) {
  const cmd = process.argv[2];
  if (cmd === 'mark') mark();
  else if (cmd === 'list') {
    for (const p of Object.keys(PAGES)) scan(fs.readFileSync(path.join(DIR, p + '.html'), 'utf8'), p).filter((c) => c.key).forEach((c) => console.log(p + ' | ' + c.key + ' | ' + c.text.slice(0, 50)));
  } else console.log('usage: node tools/slots.js mark|list');
}
module.exports = { scan, PAGES, SCOPE_NAMES };
