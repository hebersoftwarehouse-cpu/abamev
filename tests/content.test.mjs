import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { XMLParser } from 'fast-xml-parser';
import { load } from 'cheerio';
import { records, publicPaths, readCollection } from '../scripts/content.mjs';
import { validate } from '../scripts/validate-content.mjs';

const all = records();
const report = JSON.parse(readFileSync('docs/migration-report.json', 'utf8'));
const redirects = JSON.parse(readFileSync('content/redirects.json', 'utf8'));
test('cada registro do XML tem uma decisão rastreável', () => {
  assert.equal(report.records.length, 122);
  assert.equal(new Set(report.records.map(x=>x.id)).size,122);
  assert.equal(report.categories.length,25);
  for(const record of report.records) {
    assert.ok(['migrated','consolidated','excluded','pending'].includes(record.status));
    if(record.status!=='excluded') assert.ok(all.some(x=>x.path===record.destination), record.id);
  }
  for(const id of ['3','17','22','23','120','10']) assert.ok(!all.some(x=>x.id===id));
});
test('as quarenta cadeiras e dez diretorias são preservadas', () => {
  assert.deepEqual(readCollection('academics').filter(x=>x.chair).map(x=>x.chair).sort((a,b)=>a-b),Array.from({length:40},(_,i)=>i+1));
  assert.equal(readCollection('boards').length,10);
  assert.ok(readCollection('boards').find(x=>x.boardNumber===10).positions.some(x=>x.role==='Presidente' && x.name.includes('Paulo Emílio')));
});
test('regulamentos das categorias estão completos', () => {
  const merit=all.find(x=>x.id==='category-merito'), jubilee=all.find(x=>x.id==='category-jubileu');
  assert.match(merit.body,/Art\.11/);assert.match(merit.body,/2003/);
  assert.match(jubilee.body,/Art\.10/);assert.match(jubilee.body,/2004/);
});
test('não há colisões, imagens ausentes ou arquivos locais quebrados', () => {
  assert.deepEqual(validate(all),[]);
  for(const item of all) for(const match of item.body.matchAll(/\]\((\/(?:media|documents)\/[^)]+)\)/g)) assert.ok(existsSync(`public${match[1]}`),match[1]);
});
test('arquivos recuperados são PDFs e indisponibilidade é explícita', () => {
  const attachments=all.flatMap(x=>x.attachments);
  assert.equal(attachments.filter(x=>x.status==='recovered').length,14);
  assert.equal(attachments.filter(x=>x.status==='unavailable').length,1);
  for(const file of attachments.filter(x=>x.status==='recovered')) assert.match(readFileSync(`public${file.src}`).subarray(0,20).toString(),/%PDF-/);
});
test('o vídeo duplicado mantém ambos os endereços antigos', () => {
  assert.equal(redirects['/node/100'], redirects['/node/101']);
  assert.equal(all.filter(x=>x.title==='Companhia Veterinária Alemã').length,1);
  for(const target of Object.values(redirects)) assert.ok(publicPaths().includes(target),target);
});
test('a biografia de José Alberto da Silva Lira reúne as homenagens e os endereços antigos', () => {
  const profiles = all.filter(x => /^(Memorial )?José Alberto da Silva Lira$/.test(x.title) && !x.chair);
  assert.equal(profiles.length, 1);
  assert.match(profiles[0].body, /Homenagens apresentadas/);
  for (const path of ['/node/51', '/node/89', '/memorial_lira', '/academicos/memorial-jose-alberto-da-silva-lira']) {
    assert.equal(redirects[path], profiles[0].path);
  }
});
test('data original, títulos originais e proveniência são preservados', () => {
  for(const item of all.filter(x=>!x.id.startsWith('category-'))) {
    assert.ok(item.originalTitle); assert.ok(item.source.originalUrl);
    assert.ok(item.sourcePublishedAt); assert.equal(item.author,null);
  }
});
test('todos os parágrafos dos documentos normativos sobrevivem à conversão', () => {
  const root=new XMLParser({ignoreAttributes:false,trimValues:false}).parse(readFileSync('abamev-wordpress.xml','utf8')).rss.channel;
  const normalize=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^\p{L}\p{N}]/gu,'').toLowerCase();
  for(const id of ['25','26']) {
    const source=root.item.find(x=>String(x['wp:post_id'])===id);
    const $=load(source['content:encoded']);
    const output=normalize(all.find(x=>x.id===id).body);
    $('p').each((_,p)=>{const paragraph=normalize($(p).text());if(paragraph) assert.ok(output.includes(paragraph),`${id}: ${$(p).text().slice(0,80)}`);});
  }
});
test('validação rejeita uma nova publicação com rota duplicada', () => {
  assert.ok(validate([...all,{...all[0],id:'novo'}]).some(x=>x.includes('Rota repetida')));
});
