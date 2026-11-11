import { mkdir, writeFile, readFile, copyFile } from 'node:fs/promises';
import { records, publicPaths } from './content.mjs';
import sharp from 'sharp';

const site = JSON.parse(await readFile('content/site.json', 'utf8'));
const base = (process.env.VITE_SITE_URL || site.url).replace(/\/$/, '');
const noindex = process.env.VITE_NOINDEX === 'true' || Boolean(process.env.VERCEL_ENV && process.env.VERCEL_ENV !== 'production' || process.env.CONTEXT && process.env.CONTEXT !== 'production');
const entries = records();
const redirects = JSON.parse(await readFile('content/redirects.json', 'utf8'));
const output = 'build/client';
const xml = text => String(text).replace(/[<>&"']/g, x=>({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&apos;'}[x]));
const index = entries.map(x=>({ id:x.id, title:x.title, summary:x.summary, category:x.category, path:x.path, text:(x.chair ? `cadeira ${x.chair} ` : '')+x.body.replace(/!\[[^\]]*\]\([^)]*\)/g,' ').replace(/\[([^\]]*)\]\([^)]*\)/g,'$1').replace(/[#*_`|]/g,'').replace(/\s+/g,' ').trim() }));
await mkdir(`${output}/social`, {recursive:true});
await writeFile('public/search-index.json', JSON.stringify(index));
await writeFile(`${output}/search-index.json`, JSON.stringify(index));
const paths = publicPaths().filter(p=>!['/404','/busca'].includes(p) && !/emeritos|benemeritos/.test(p));
await writeFile(`${output}/sitemap.xml`, `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${paths.map(p=>`\n  <url><loc>${xml(base + (p==='/'?'':p))}</loc></url>`).join('')}\n</urlset>\n`);
await writeFile(`${output}/robots.txt`, `User-agent: *\n${noindex ? 'Disallow: /' : 'Allow: /\nDisallow: /busca\nSitemap: '+base+'/sitemap.xml'}\n`);
await copyFile(`${output}/404/index.html`, `${output}/404.html`);
await writeFile(`${output}/_redirects`, Object.entries(redirects).map(([from,to])=>`${from} ${to} 301`).join('\n')+'\n/* /404.html 404\n');
await writeFile('vercel.json', JSON.stringify({ framework:null, buildCommand:'npm run build', outputDirectory:output, cleanUrls:true, trailingSlash:false, redirects:Object.entries(redirects).map(([source,destination])=>({source,destination,permanent:true})), headers:[{source:'/assets/(.*)',headers:[{key:'Cache-Control',value:'public, max-age=31536000, immutable'}]},{source:'/(.*)',headers:[{key:'X-Content-Type-Options',value:'nosniff'},{key:'Referrer-Policy',value:'strict-origin-when-cross-origin'}]}] },null,2)+'\n');
function wrap(title) {
  const words = title.split(' '), lines = []; let line='';
  for(const word of words) { if((line+' '+word).length>39 && line) {lines.push(line);line=word;} else line+=(line?' ':'')+word; }
  if(line) lines.push(line);
  return lines.slice(0,4).map((line,i)=>`<text x="85" y="${235+i*65}" font-family="Georgia, serif" font-size="51" fill="#f4f3e7">${xml(line)}${i===3 && lines.length>4?'…':''}</text>`).join('');
}
for (const entry of [{id:'default',title:'Memória, ciência e legado da Medicina Veterinária na Bahia.'},...entries]) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630"><rect width="1200" height="630" fill="#204a3c"/><rect x="28" y="28" width="1144" height="574" fill="none" stroke="#b6aa6e" stroke-opacity=".5"/><text x="85" y="119" font-family="Georgia,serif" font-size="47" fill="#e8dfb5" letter-spacing="4">ABAMEV</text><text x="85" y="155" font-family="Arial,sans-serif" font-size="14" fill="#d6dfce" letter-spacing="2">ACADEMIA BAIANA DE MEDICINA VETERINÁRIA</text>${wrap(entry.title)}<path d="M85 537H1115" stroke="#93a088" stroke-opacity=".6"/><text x="85" y="571" font-family="Arial,sans-serif" font-size="15" fill="#d3d8b9" letter-spacing="3">MEMÓRIA · CIÊNCIA · LEGADO</text><text x="1115" y="571" text-anchor="end" font-family="Arial,sans-serif" font-size="14" fill="#b9c9b4">abamev.org.br</text></svg>`;
  await sharp(Buffer.from(svg)).png().toFile(`${output}/social/${entry.id}.png`);
}
console.log(`${paths.length} URLs no sitemap; ${entries.length} entradas de busca; ${Object.keys(redirects).length} redirecionamentos.`);
