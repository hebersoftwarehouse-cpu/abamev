import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { load } from 'cheerio';
import { records, publicPaths, isUnlistedChair } from '../scripts/content.mjs';
import { XMLParser } from 'fast-xml-parser';

const built=existsSync('dist/sitemap.xml');
test('cada rota possui HTML completo, título, canonical e capa social locais', {skip:!built}, () => {
  for(const path of publicPaths()) {
    const file=`dist${path==='/'?'':path}/index.html`;
    assert.ok(existsSync(file),file);
    const $=load(readFileSync(file,'utf8'));
    assert.equal($('h1').length,1,`${path}: h1`);
    assert.equal($('head title').length,1,`${path}: title`);
    assert.equal($('head meta[name="description"]').length,1,`${path}: description`);
    assert.equal($('head link[rel="canonical"]').length,1,`${path}: canonical`);
    const structured=$('head script[type="application/ld+json"]');
    assert.equal(structured.length,1,`${path}: dados estruturados`);
    assert.equal(JSON.parse(structured.text())[0]['@type'],'Organization',`${path}: organização`);
    const image=$('meta[property="og:image"]').attr('content');
    assert.ok(image.endsWith('/social/abamev.png'),`${path}: imagem da marca`);
    assert.ok(existsSync(`dist${new URL(image).pathname}`),image);
    assert.ok($('main').text().trim().length>60,`${path}: HTML sem conteúdo`);
    assert.ok(!$('iframe').length,`${path}: vídeo carregado antes da interação`);
  }
});
test('conteúdos publicados entram automaticamente no sitemap e na busca', {skip:!built}, () => {
  const sitemap=readFileSync('dist/sitemap.xml','utf8');
  const search=JSON.parse(readFileSync('dist/search-index.json','utf8'));
  const all = records();
  assert.equal(search.length,all.filter(x=>!isUnlistedChair(x)).length);
  for(const entry of all) {
    const listed = !isUnlistedChair(entry);
    assert.equal(sitemap.includes(`${entry.path}</loc>`),listed,entry.path);
    assert.equal(search.some(x=>x.id===entry.id),listed,entry.id);
  }
});

test('cadeiras vagas a partir da 31 ficam fora da listagem e da indexação', {skip:!built}, () => {
  const $directory = load(readFileSync('dist/academicos/cadeiras/index.html','utf8'));
  for (const entry of records().filter(x=>x.chair)) {
    const listed = !isUnlistedChair(entry);
    assert.equal($directory(`main a[href="${entry.path}"]`).length, listed ? 1 : 0);
    if (!listed) {
      const $page = load(readFileSync(`dist${entry.path}/index.html`,'utf8'));
      assert.equal($page('meta[name="robots"]').attr('content'), 'noindex, follow');
    }
  }
});

test('links internos apontam para páginas, arquivos ou redirecionamentos existentes', {skip:!built}, () => {
  const paths=new Set(publicPaths());
  const redirects=JSON.parse(readFileSync('content/redirects.json','utf8'));
  for(const path of paths) {
    const $=load(readFileSync(`dist${path==='/'?'':path}/index.html`,'utf8'));
    $('a[href^="/"]').each((_,el)=>{
      const href=$(el).attr('href').split(/[?#]/)[0];
      assert.ok(paths.has(href) || redirects[href] || existsSync(`dist${href}`),`${path} → ${href}`);
    });
    $('a[href^="#"]').each((_,el)=>{const id=$(el).attr('href').slice(1);assert.ok($('[id]').toArray().some(target=>$(target).attr('id')===id),`${path}: âncora ${id}`);});
  }
});

test('o HTML preserva todos os parágrafos textuais do acervo migrado', {skip:!built}, () => {
  const root=new XMLParser({ignoreAttributes:false,trimValues:false}).parse(readFileSync('abamev-wordpress.xml','utf8')).rss.channel;
  const normalize=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^\p{L}\p{N}]/gu,'').toLowerCase();
  const all=records();
  for(const source of root.item) {
    const entry=all.find(x=>x.id===String(source['wp:post_id']));
    if(!entry || ['25','26'].includes(entry.id)) continue;
    const $source=load(source['content:encoded'] || '');
    const $page=load(readFileSync(`dist${entry.path}/index.html`,'utf8'));
    const text=normalize($page('[class*="_prose_"]').text());
    $source('p, figcaption').each((_,el)=>{
      const original = $source(el).text();
      const paragraph=normalize(entry.id==='31' ? original.replace(/\bPENILDO SILVA\b/gi, 'PENILDON SILVA') : original);
      if(paragraph) assert.ok(text.includes(paragraph),`${entry.id}: ${$source(el).text().slice(0,100)}`);
    });
  }
});
