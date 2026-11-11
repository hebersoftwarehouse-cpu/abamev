import { mkdir, writeFile, readFile, copyFile } from 'node:fs/promises';
import { records, publicPaths } from './content.mjs';
import sharp from 'sharp';

const site = JSON.parse(await readFile('content/site.json', 'utf8'));
const base = (process.env.VITE_SITE_URL || site.url).replace(/\/$/, '');
const noindex = process.env.VITE_NOINDEX === 'true' || Boolean(process.env.VERCEL_ENV && process.env.VERCEL_ENV !== 'production' || process.env.CONTEXT && process.env.CONTEXT !== 'production');
const entries = records();
const redirects = JSON.parse(await readFile('content/redirects.json', 'utf8'));
const output = 'dist';
const xml = text => String(text).replace(/[<>&"']/g, x=>({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&apos;'}[x]));
const index = entries.map(x=>({ id:x.id, title:x.title, summary:x.summary, category:x.category, path:x.path, text:(x.chair ? `cadeira ${x.chair} ` : '')+x.body.replace(/!\[[^\]]*\]\([^)]*\)/g,' ').replace(/\[([^\]]*)\]\([^)]*\)/g,'$1').replace(/[#*_`|]/g,'').replace(/\s+/g,' ').trim() }));
await mkdir(`${output}/social`, {recursive:true});
await writeFile('public/search-index.json', JSON.stringify(index));
await writeFile(`${output}/search-index.json`, JSON.stringify(index));
const paths = publicPaths().filter(p=>!['/404','/busca'].includes(p) && !/emeritos|benemeritos/.test(p));
await writeFile(`${output}/sitemap.xml`, `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${paths.map(p=>`\n  <url><loc>${xml(base + (p==='/'?'':p))}</loc></url>`).join('')}\n</urlset>\n`);
await writeFile(`${output}/robots.txt`, `User-agent: *\n${noindex ? 'Disallow: /' : 'Allow: /\nDisallow: /busca\nSitemap: '+base+'/sitemap.xml'}\n`);
await mkdir(`${output}/404`, {recursive:true});
await copyFile(`${output}/404.html`, `${output}/404/index.html`);
await writeFile(`${output}/_redirects`, Object.entries(redirects).map(([from,to])=>`${from} ${to} 301`).join('\n')+'\n/* /404.html 404\n');
await writeFile('vercel.json', JSON.stringify({ framework:null, buildCommand:'npm run build', outputDirectory:output, cleanUrls:true, trailingSlash:false, redirects:Object.entries(redirects).map(([source,destination])=>({source,destination,permanent:true})), headers:[{source:'/_astro/(.*)',headers:[{key:'Cache-Control',value:'public, max-age=31536000, immutable'}]},{source:'/(.*)',headers:[{key:'X-Content-Type-Options',value:'nosniff'},{key:'Referrer-Policy',value:'strict-origin-when-cross-origin'}]}] },null,2)+'\n');
const crestMask = Buffer.from('<svg width="260" height="260" xmlns="http://www.w3.org/2000/svg"><circle cx="130" cy="130" r="130" fill="white"/></svg>');
const crest = await sharp('public/images/brands/abamev.png')
  .resize(260, 260, { fit: 'cover' })
  .composite([{ input: crestMask, blend: 'dest-in' }])
  .png()
  .toBuffer();
await sharp({
  create: { width: 1200, height: 630, channels: 4, background: '#ffffff' },
})
  .composite([{ input: crest, gravity: 'centre' }])
  .png()
  .toFile(`${output}/social/abamev.png`);
console.log(`${paths.length} URLs no sitemap; ${entries.length} entradas de busca; ${Object.keys(redirects).length} redirecionamentos.`);
