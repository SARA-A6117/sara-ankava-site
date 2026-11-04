/* בונה את dist/ לפריסה: / = versions/v7-light (בהיר), /dark = versions/v6 (כהה). בלי תלויות. */
const fs = require('fs'), path = require('path');
const root = path.resolve(__dirname, '..'), dist = path.join(root, 'dist');
const SKIP = /^(shots|grain-proof.*|page-1440\.png|contact-1440\.jpg|projects-1440\.jpg|hero-el\d\.png|lw-\d\.jpg|pj-.*\.jpg|og-gen\.html)$/;
function copy(src, dst) {
  fs.mkdirSync(dst, { recursive: true });
  for (const e of fs.readdirSync(src, { withFileTypes: true })) {
    if (SKIP.test(e.name)) continue;
    const s = path.join(src, e.name), d = path.join(dst, e.name);
    e.isDirectory() ? copy(s, d) : fs.copyFileSync(s, d);
  }
}
fs.rmSync(dist, { recursive: true, force: true });
copy(path.join(root, 'versions', 'v7-light'), dist);
const dark = path.join(dist, 'dark');
copy(path.join(root, 'versions', 'v6'), dark);
for (const f of ['admin.html', 'robots.txt', 'sitemap.xml']) fs.rmSync(path.join(dark, f), { force: true });
for (const f of ['index.html', 'projects.html']) {
  const p = path.join(dark, f);
  let h = fs.readFileSync(p, 'utf8');
  h = h.replace(/(href|src)="assets\//g, '$1="/dark/assets/')
       .replace(/href="index\.html#/g, 'href="/dark#').replace(/href="index\.html"/g, 'href="/dark"')
       .replace(/href="\/?projects\.html"/g, 'href="/dark/projects"')
       .replace(/\/legal\.html#accessibility/g, '/accessibility').replace(/\/legal\.html#privacy/g, '/privacy')
       .replace(/<meta name="robots" content="[^"]*">/, '<meta name="robots" content="noindex,follow">')
       .replace(/(rel="canonical" href="https:\/\/sarankava\.com)\/projects"/, '$1/dark/projects"')
       .replace(/(rel="canonical" href="https:\/\/sarankava\.com)\/"/, '$1/dark"');
  fs.writeFileSync(p, h);
}

/* ---- טקסטי האתר: manifest לעורך, והחלפת טקסטים מפורסמים מהמסד (אם אין חיבור, נשאר הטקסט שבקוד) ---- */
const { scan, PAGES, SCOPE_NAMES } = require('./slots.js');
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const escRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const decode = (s) => s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
const SEO_PAGES = { index: ['/', 'דף הבית'], projects: ['/projects', 'פרויקטים'], privacy: ['/privacy', 'מדיניות פרטיות'], terms: ['/terms', 'תנאי שימוש'], accessibility: ['/accessibility', 'הצהרת נגישות'] };

function manifest() {
  const slots = new Map();
  for (const p of Object.keys(PAGES)) {
    const html = fs.readFileSync(path.join(dist, p + '.html'), 'utf8');
    for (const c of scan(html, p)) {
      if (!c.key) continue;
      const e = slots.get(c.key) || { key: c.key, group: SCOPE_NAMES[c.scope] || c.scope, text: c.text, pages: [], scope: c.scope };
      if (!e.pages.includes(p)) e.pages.push(p);
      slots.set(c.key, e);
    }
    const t = (html.match(/<title>([^<]*)<\/title>/) || [])[1], d = (html.match(/<meta name="description" content="([^"]*)"/) || [])[1];
    if (t) slots.set('seo.' + p + '.title', { key: 'seo.' + p + '.title', group: 'SEO: ' + SEO_PAGES[p][1], text: decode(t), pages: [p], scope: 'seo', label: 'כותרת בגוגל (עד 60 תווים)' });
    if (d) slots.set('seo.' + p + '.description', { key: 'seo.' + p + '.description', group: 'SEO: ' + SEO_PAGES[p][1], text: decode(d), pages: [p], scope: 'seo', label: 'תיאור בגוגל (עד 155 תווים)', kind: 'longtext' });
  }
  const list = [...slots.values()].map((s) => Object.assign({ kind: s.kind || (s.text.length > 70 ? 'longtext' : 'text') }, s));
  fs.writeFileSync(path.join(dist, 'assets', 'slots.json'), JSON.stringify({ slots: list }));
  return list.length;
}

async function loadTexts() {
  if (process.env.TEXTS_JSON) return JSON.parse(fs.readFileSync(process.env.TEXTS_JSON, 'utf8'));   /* לבדיקות */
  try {
    const cfg = fs.readFileSync(path.join(root, 'versions', 'v7-light', 'assets', 'js', 'admin-config.js'), 'utf8');
    const url = (cfg.match(/url:\s*'([^']+)'/) || [])[1], key = (cfg.match(/anonKey:\s*'([^']+)'/) || [])[1];
    if (!url || !key || process.env.SKIP_TEXTS === '1') return {};
    const r = await fetch(url.replace(/\/$/, '') + '/rest/v1/site_texts?select=key,value&value=not.is.null', { headers: { apikey: key, Authorization: 'Bearer ' + key }, signal: AbortSignal.timeout(8000) });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const map = {}; (await r.json()).forEach((x) => { if (x.value && x.value.trim()) map[x.key] = x.value; });
    return map;
  } catch (e) { console.warn('site_texts: using texts from code (' + e.message + ')'); return {}; }
}

function applyTexts(map) {
  let n = 0;
  for (const p of Object.keys(PAGES)) {
    const f = path.join(dist, p + '.html'); let h = fs.readFileSync(f, 'utf8');
    for (const [k, v] of Object.entries(map)) {
      if (k.startsWith('seo.')) {
        const m = k.match(/^seo\.([a-z]+)\.(title|description)$/); if (!m || m[1] !== p) continue;
        const val = esc(v);
        if (m[2] === 'title') h = h.replace(/<title>[^<]*<\/title>/, '<title>' + val + '</title>').replace(/(<meta property="og:title" content=")[^"]*"/, '$1' + val + '"').replace(/(<meta name="twitter:title" content=")[^"]*"/, '$1' + val + '"');
        else h = h.replace(/(<meta name="description" content=")[^"]*"/, '$1' + val + '"').replace(/(<meta property="og:description" content=")[^"]*"/, '$1' + val + '"').replace(/(<meta name="twitter:description" content=")[^"]*"/, '$1' + val + '"');
        n++; continue;
      }
      const re = new RegExp('(<[a-zA-Z0-9]+[^>]*\\sdata-slot="' + escRe(k) + '"[^>]*>)([^<]*)(<)', 'g');
      h = h.replace(re, (all, a, b, c) => { n++; return a + esc(v) + c; });
    }
    fs.writeFileSync(f, h);
  }
  return n;
}

(async () => {
  const slotsN = manifest();
  const map = await loadTexts();
  const applied = applyTexts(map);
  console.log('slots: ' + slotsN + ', replaced from DB: ' + applied);
  console.log('dist ready');
})();
