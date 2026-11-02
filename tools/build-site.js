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
       .replace(/<meta name="robots" content="[^"]*">/, '<meta name="robots" content="noindex,follow">')
       .replace(/(rel="canonical" href="https:\/\/sarankava\.com)\/projects"/, '$1/dark/projects"')
       .replace(/(rel="canonical" href="https:\/\/sarankava\.com)\/"/, '$1/dark"');
  fs.writeFileSync(p, h);
}
console.log('dist ready');
