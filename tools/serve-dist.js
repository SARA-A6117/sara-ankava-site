/* שרת בדיקה מקומי ל-dist שמדמה cleanUrls והפניות מ-vercel.json (לבדיקה בלבד) */
const http = require('http'), fs = require('fs'), path = require('path');
const root = path.resolve(__dirname, '..'), dist = path.join(root, 'dist');
const cfg = JSON.parse(fs.readFileSync(path.join(root, 'vercel.json'), 'utf8'));
const T = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.ttf': 'font/ttf', '.webp': 'image/webp', '.txt': 'text/plain', '.xml': 'application/xml' };
http.createServer((q, s) => {
  const u = new URL(q.url, 'http://x'); let p = decodeURIComponent(u.pathname);
  for (const r of cfg.redirects || []) {
    const base = r.source.replace(/\/:path\*$/, '');
    if (p === base || (r.source.endsWith(':path*') && p.startsWith(base + '/'))) { s.writeHead(r.permanent ? 308 : 307, { Location: r.destination }); return s.end(); }
  }
  const tries = [p, p + '.html', path.join(p, 'index.html')];
  for (const t of tries) {
    const f = path.join(dist, t);
    if (f.startsWith(dist) && fs.existsSync(f) && fs.statSync(f).isFile()) { s.writeHead(200, { 'Content-Type': T[path.extname(f)] || 'application/octet-stream' }); return fs.createReadStream(f).pipe(s); }
  }
  s.writeHead(404); s.end('404');
}).listen(5190, () => console.log('http://localhost:5190'));
