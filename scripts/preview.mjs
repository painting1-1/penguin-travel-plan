import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.webmanifest':'application/manifest+json','.svg':'image/svg+xml','.png':'image/png','.md':'text/plain; charset=utf-8'};
const port=Number(process.env.PORT||8000);
http.createServer((req,res)=>{
  try{
    const url=new URL(req.url,'http://localhost'),decoded=decodeURIComponent(url.pathname);
    const file=path.resolve(root,'.'+(decoded==='/'?'/index.html':decoded));
    if(file!==root&&!file.startsWith(root+path.sep)){res.writeHead(403);res.end('Forbidden');return;}
    res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');
    if(req.method==='HEAD'){res.end();return;}res.end(fs.readFileSync(file));
  }catch{res.writeHead(404);res.end('Not found');}
}).listen(port,'127.0.0.1',()=>console.log(`Open http://localhost:${port}/ — local browser storage`));
