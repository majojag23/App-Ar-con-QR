import http from 'node:http';import fs from 'node:fs';import path from 'node:path';
const root=path.resolve(process.argv[2]||'.'),port=+process.argv[3]||8099;
const T={'.html':'text/html;charset=utf-8','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml','.mind':'application/octet-stream','.json':'application/json','.mp3':'audio/mpeg'};
http.createServer((q,r)=>{let u=decodeURIComponent(q.url.split('?')[0]);if(u.endsWith('/'))u+='index.html';const f=path.join(root,u);
 if(!f.startsWith(root)||!fs.existsSync(f)||fs.statSync(f).isDirectory()){r.writeHead(404);return r.end('404')}
 r.writeHead(200,{'Content-Type':T[path.extname(f)]||'application/octet-stream','Cache-Control':'no-store'});fs.createReadStream(f).pipe(r)}).listen(port,()=>console.log('http://localhost:'+port));
