/* מריצים רק אחרי ש-sarankava.com כבר מגיש את האתר החדש (DNS הועבר ל-Vercel).
   מחליף כתובות מוחלטות שעדיין על vercel.app (og:image, twitter:image, סכמה, llms.txt) לדומיין הרשמי.
   שימוש: node tools/go-live.js  ואז  node tools/build-site.js, בדיקה, commit ודחיפה. */
const fs = require('fs'), path = require('path');
const dir = path.resolve(__dirname, '..', 'versions', 'v7-light');
const OLD = 'https://sara-ankava-site.vercel.app', NEW = 'https://sarankava.com';
let n = 0;
for (const f of ['index.html', 'projects.html', 'privacy.html', 'terms.html', 'accessibility.html', 'llms.txt']) {
  const p = path.join(dir, f), s = fs.readFileSync(p, 'utf8');
  const t = s.split(OLD).join(NEW);
  if (t !== s) { fs.writeFileSync(p, t); n++; console.log('updated', f); }
}
console.log(n ? 'done: ' + n + ' files' : 'nothing to change');
