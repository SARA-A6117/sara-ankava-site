/* עץ אלמנטים לעורך העיצובי. סורק את ה-HTML של v7-light, מסמן אלמנטים ב-data-el (מזהה יציב) ובונה tree.json.
   לכל אלמנט: סוג, שם קריא, האם נעול ולמה, ואילו תכונות מותר לשנות בו (רשימה לבנה בלבד).
   שימוש:  node tools/elements.js mark    מוסיף data-el (בטוח להרצה חוזרת, לא משנה תוכן או מראה)
           node tools/elements.js list    סיכום לפי עמוד, אזור וסיבת נעילה
   build-site.js קורא ל-treeFor() ויוצר את assets/tree.json. */
const fs = require('fs'), path = require('path');
const DIR = path.resolve(__dirname, '..', 'versions', 'v7-light');
const PAGES = ['index', 'projects', 'privacy', 'terms', 'accessibility'];
const VOID = new Set(['meta', 'link', 'img', 'input', 'br', 'hr', 'source', 'area', 'base', 'col', 'embed', 'param', 'track', 'wbr']);
const SCOPE_HE = { nav: 'תפריט עליון', footer: 'פוטר', top: 'הירו', projects: 'פרויקטים', why: 'למה (לונה פארק)', process: 'תהליך', about: 'אודות', tools: 'כלים', contact: 'צור קשר', 'pp-hero': 'פתיח פרויקטים', 'pp-list': 'רשימת פרויקטים', 'pp-next': 'הפרויקט הבא', lp2__bar: 'למה (לונה פארק)', hdr: 'תפריט עליון' };
const TEXT_TAGS = new Set(['h1', 'h2', 'h3', 'h4', 'p', 'li', 'span', 'small', 'b', 'strong', 'em', 'label']);
const LOCK_CLASS = [[/\b(cta6|btn|cta-blink)\b/, 'button'], [/\b(stk)\b/, 'sticker'], [/\b(pj__st)\b/, 'outline'], [/\b(mk|mk--tef|mk--gan|doodle|pj3|pp-list)\b/, 'projects'], [/\b(lg-hero|lg-wrap|lg-body|lg-toc)\b/, 'legal'], [/\b(cursor|skip|sr-only|hp|wa|done)\b/, 'js']];
const PINNED = new Set(['why', 'process']);

function tokens(html) { return [...html.matchAll(/<!--[\s\S]*?-->|<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<svg[\s\S]*?<\/svg>|<(\/?)([a-zA-Z0-9]+)([^>]*)>|([^<]+)/g)]; }
const attr = (s, n) => { const m = s.match(new RegExp('\\b' + n + '="([^"]*)"')); return m ? m[1] : null; };

function parse(html) {
  const root = { tag: '#root', kids: [], attrs: '', texts: [] }, stack = [root], all = [];
  for (const m of tokens(html)) {
    if (m[2] === undefined && m[4] === undefined) continue;
    if (m[2] !== undefined) {
      const tag = m[2].toLowerCase(), attrs = m[3] || '';
      if (m[1] !== '/') {
        const el = { tag, attrs, tagEnd: m.index + m[0].length - 1, kids: [], texts: [], parent: stack[stack.length - 1], key: attr(attrs, 'data-el') };
        el.parent.kids.push(el); all.push(el);
        if (!VOID.has(tag)) stack.push(el);
      } else {
        for (let i = stack.length - 1; i > 0; i--) if (stack[i].tag === tag) { stack.length = i; break; }
      }
    } else if (m[4].trim()) stack[stack.length - 1].texts.push(m[4].replace(/\s+/g, ' ').trim());
  }
  const sub = (e) => { const ks = e.kids.map((k) => sub(k)); e.sub = e.texts.length > 0 || e.tag === 'img' || ks.some(Boolean); return e.sub; };
  sub(root);
  return { root, all };
}

/* מסווג כל אלמנט: ברירת מחדל נעול רק אם מתקיים אחד הכללים. מחזיר גם הקשר (scope, pinned, מצב) לילדים */
function classify(page, root) {
  const out = [];
  (function walk(el, ctx) {
    for (const k of el.kids) {
      const id = attr(k.attrs, 'id'), cls = attr(k.attrs, 'class') || '';
      let scope = ctx.scope, locked = ctx.locked, skipKids = false;
      if (/^(section|header|footer|nav)$/.test(k.tag)) scope = k.tag === 'footer' ? 'footer' : k.tag === 'nav' ? 'nav' : id || cls.split(/\s+/)[0] || k.tag;
      if (!locked) {
        if (page === 'index' && k.tag === 'section' && id === 'top') locked = 'hero';
        else if (page === 'index' && k.tag === 'section' && id === 'projects') locked = 'projects';
        else if (k.tag === 'nav' || scope === 'hdr' && k.tag === 'header') locked = 'nav';
        else if (k.tag === 'form') locked = 'form';
        else if (/data-gn=/.test(k.attrs)) locked = 'gradient';
        else if (/data-motion-toggle|data-wa\b/.test(k.attrs)) locked = 'js';
        else if (k.tag === 'img') locked = 'image';
        else if (k.tag === 'button') locked = 'button';
        else if (attr(k.attrs, 'aria-hidden') === 'true') { locked = 'decor'; skipKids = true; }
        else for (const [re, why] of LOCK_CLASS) if (re.test(cls)) { locked = why; break; }
      }
      const pinned = ctx.pinned || (k.tag === 'section' && PINNED.has(id)) || (/^lp2/.test(cls) && true);
      const eligible = k.sub && (TEXT_TAGS.has(k.tag) || /^(h1|h2|h3|h4|p|ul|ol|li|a|section|header|footer|nav|main|aside|article|figure|img|button|form)$/.test(k.tag) || (k.tag === 'div' && cls));
      if (eligible) out.push({ el: k, scope, locked, pinned: !!pinned, cls, id });
      if (!skipKids) walk(k, { scope, locked, pinned: !!pinned });
    }
  })(root, { scope: '', locked: null, pinned: false });
  return out;
}
/* (classify מחזיר את רשימת האלמנטים הזכאים) */

function kindOf(el) {
  if (/^h[1-4]$/.test(el.tag)) return 'heading';
  if (/^(section|header|footer|nav|main)$/.test(el.tag)) return 'section';
  if (el.tag === 'ul' || el.tag === 'ol') return 'list';
  if (el.tag === 'a') return 'link';
  if (el.tag === 'img' || el.tag === 'figure') return 'image';
  if (el.tag === 'button') return 'button';
  if (el.tag === 'form') return 'form';
  if (el.tag === 'div' || el.tag === 'article' || el.tag === 'aside') return 'container';
  return 'text';
}
/* מה מותר לשנות. רשימה לבנה: color, size, weight, space, hide */
function allowFor(c, kind) {
  if (c.locked) return [];
  const textish = kind === 'heading' || kind === 'text' || kind === 'link';
  /* כותרות לא מוסתרות (SEO ונגישות). קישורי פוטר: בלי שינוי גודל (יעד לחיצה קטן) */
  if (c.scope === 'footer') return kind === 'link' ? ['color', 'weight'] : textish ? ['color', 'size', 'weight'] : [];
  if (c.pinned) return textish ? ['color', 'size', 'weight'] : [];
  if (textish) return kind === 'heading' ? ['color', 'size', 'weight', 'space'] : ['color', 'size', 'weight', 'space', 'hide'];
  if (kind === 'list' || kind === 'container') return c.scope === 'contact' ? ['space'] : ['space', 'hide'];
  if (kind === 'section') return c.scope === 'tools' || c.scope === 'about' ? ['space', 'hide'] : c.scope === 'contact' ? ['space'] : [];
  return [];
}

/* רקעים אפשריים מאחורי הטקסט (לבדיקת ניגודיות): צור קשר קובלט, שבב ספרות בלמה פחם/קובלט, השאר קרם */
function bgFor(c) { if (c.scope === 'contact') return ['cobalt']; if (/\blp2__n\b/.test(c.cls)) return ['charcoal', 'cobalt']; return ['cream']; }

function build(page, html) {
  const { root } = parse(html), items = classify(page, root), counters = {}, nodes = [], inserts = [];
  const keyOf = new Map();
  const baseOf = (c) => { const shared = c.scope === 'nav' || c.scope === 'footer' || c.scope === 'hdr'; return (shared ? (c.scope === 'hdr' ? 'nav' : c.scope) : (page === 'index' ? '' : page + '.') + c.scope) || 'page'; };
  for (const c of items) { if (!c.el.key) continue; const b = baseOf(c), pre = b + '.' + c.el.tag, m = c.el.key.startsWith(pre) && /^\d+$/.test(c.el.key.slice(pre.length)) ? Number(c.el.key.slice(pre.length)) : 0; counters[b + '|' + c.el.tag] = Math.max(counters[b + '|' + c.el.tag] || 0, m); }
  const seen = new Set();
  for (const c of items) {
    const shared = c.scope === 'nav' || c.scope === 'footer' || c.scope === 'hdr';
    const base = (shared ? (c.scope === 'hdr' ? 'nav' : c.scope) : (page === 'index' ? '' : page + '.') + c.scope) || 'page';
    let key = c.el.key;
    if (!key) {
      const t = c.el.tag; counters[base + '|' + t] = (counters[base + '|' + t] || 0) + 1;
      key = base.replace(/\.$/, '') + '.' + t + counters[base + '|' + t]; inserts.push({ at: c.el.tagEnd, key });
    }
    if (seen.has(key)) throw new Error('duplicate data-el in ' + page + ': ' + key);
    seen.add(key); keyOf.set(c.el, key);
  }
  for (const c of items) {
    const kind = kindOf(c.el); let anc = c.el.parent, parent = null;
    while (anc && !parent) { parent = keyOf.get(anc) || null; anc = anc.parent; }
    const own = c.el.texts.join(' ');
    const label = (SCOPE_HE[c.scope] && /^(section|header|footer|nav)$/.test(c.el.tag)) ? SCOPE_HE[c.scope] : own ? own.slice(0, 32) : (c.cls ? c.cls.split(/\s+/)[0] : kind);
    nodes.push({ id: keyOf.get(c.el), parent, tag: c.el.tag, kind, label, scope: SCOPE_HE[c.scope] || c.scope, locked: c.locked || null, allow: allowFor(c, kind), bg: bgFor(c) });
  }
  return { nodes, inserts };
}

/* עץ של כל העמודים (נקרא מ-build-site.js על קבצי dist) */
function treeFor(dir) {
  const pages = {};
  for (const p of PAGES) pages[p] = build(p, fs.readFileSync(path.join(dir, p + '.html'), 'utf8')).nodes;
  return { pages };
}

if (require.main === module) {
  const cmd = process.argv[2];
  if (cmd === 'mark') {
    let total = 0;
    for (const p of PAGES) {
      const f = path.join(DIR, p + '.html'); let html = fs.readFileSync(f, 'utf8');
      const { inserts } = build(p, html);
      inserts.sort((a, b) => b.at - a.at).forEach((i) => { html = html.slice(0, i.at) + ' data-el="' + i.key + '"' + html.slice(i.at); });
      if (inserts.length) fs.writeFileSync(f, html);
      total += inserts.length; console.log(p + ': +' + inserts.length);
    }
    console.log('marked ' + total);
  } else if (cmd === 'list') {
    for (const p of PAGES) {
      const { nodes } = build(p, fs.readFileSync(path.join(DIR, p + '.html'), 'utf8')), why = {}, open = nodes.filter((n) => !n.locked).length;
      nodes.forEach((n) => { if (n.locked) why[n.locked] = (why[n.locked] || 0) + 1; });
      console.log(p + ': ' + nodes.length + ' אלמנטים, ' + open + ' פתוחים, נעולים לפי סיבה:', JSON.stringify(why));
    }
  } else console.log('usage: node tools/elements.js mark|list');
}
module.exports = { treeFor, build, PAGES };
