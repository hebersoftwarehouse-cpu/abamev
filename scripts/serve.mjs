import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, extname } from 'node:path';

const root = resolve('dist');
const redirects = JSON.parse(await readFile('content/redirects.json', 'utf8'));
const types = { '.html':'text/html; charset=utf-8', '.js':'text/javascript', '.css':'text/css', '.json':'application/json', '.webp':'image/webp', '.png':'image/png', '.svg':'image/svg+xml', '.pdf':'application/pdf', '.woff2':'font/woff2', '.xml':'application/xml', '.txt':'text/plain' };
const port = Number(process.env.PORT || 4173);
createServer(async(req,res)=>{
  try {
    const path = decodeURIComponent(new URL(req.url,'http://localhost').pathname);
    if (redirects[path]) {res.writeHead(301,{Location:redirects[path]});res.end();return;}
    let file = resolve(root, '.'+path);
    if(file!==root && !file.startsWith(root+'/')) {res.writeHead(403);res.end();return;}
    let found=false;
    for(const candidate of [file, `${file}/index.html`, `${file}.html`]) {try {if((await stat(candidate)).isFile()){file=candidate;found=true;break;}}catch{}}
    if(!found) file=resolve(root,'404.html');
    const body=await readFile(file);
    res.writeHead(found?200:404, {'Content-Type':types[extname(file)] || 'application/octet-stream','Cache-Control':'no-cache'});
    res.end(req.method==='HEAD'?undefined:body);
  } catch {res.writeHead(500);res.end('Erro de leitura.');}
}).listen(port,'127.0.0.1',()=>console.log(`Local: http://127.0.0.1:${port}`));
