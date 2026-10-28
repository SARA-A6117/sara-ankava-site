// שרת סטטי קטן לתצוגה מקומית: node server.js
const http=require('http'),fs=require('fs'),path=require('path');
const root=__dirname, port=process.env.PORT||5192;
const types={'.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.woff2':'font/woff2','.json':'application/json','.txt':'text/plain; charset=utf-8','.ico':'image/x-icon'};
http.createServer((req,res)=>{
  let p=decodeURIComponent(req.url.split('?')[0]); if(p.endsWith('/'))p+='index.html';
  const f=path.join(root,p); if(!f.startsWith(root)){res.writeHead(403);return res.end();}
  fs.readFile(f,(e,b)=>{ if(e){ fs.readFile(path.join(root,'404.html'),(e2,b2)=>{res.writeHead(404,{'Content-Type':types['.html']});res.end(b2||'404');}); return; }
    res.writeHead(200,{'Content-Type':types[path.extname(f)]||'application/octet-stream','Cache-Control':'no-store'}); res.end(b); });
}).listen(port,()=>console.log('http://localhost:'+port));
