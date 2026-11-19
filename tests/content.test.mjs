import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
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
test('o acervo conserva as quarenta cadeiras e inclui as onze diretorias', () => {
  assert.deepEqual(readCollection('academics').filter(x=>x.chair).map(x=>x.chair).sort((a,b)=>a-b),Array.from({length:40},(_,i)=>i+1));
  const boards = readCollection('boards');
  assert.deepEqual(boards.map(x=>x.boardNumber), Array.from({length:11},(_,i)=>i+1));
  assert.ok(boards.every(x=>x.boardPeriod));
  assert.ok(boards.at(-1).positions.some(x=>x.role==='Presidente' && x.name.includes('Paulo Emílio')));
  assert.match(boards.at(-1).body, /10 de agosto de 2024 a 10 de agosto de 2027/);
});
test('todos os patronos das cadeiras listadas têm os anos de nascimento e falecimento', () => {
  const chairs = readCollection('academics').filter(entry => entry.chair && entry.chair <= 30);
  assert.equal(chairs.length, 30);
  for (const entry of chairs) {
    assert.match(entry.patron, /\(\d{4}\s*-\s*\d{4}\)$/, `Cadeira ${entry.chair}`);
    assert.ok(entry.summary.includes(entry.patron), `Resumo da cadeira ${entry.chair}`);
  }
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
  assert.equal(attachments.filter(x=>x.status==='recovered').length,16);
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
    assert.ok(item.originalTitle);
    assert.equal(item.author,null);
    if (item.source.originalUrl) assert.ok(item.sourcePublishedAt);
    else {
      assert.ok(item.source.fileName);
      assert.equal(item.sourcePublishedAt,null);
    }
  }
});
test('os documentos normativos novos têm todos os artigos e os PDFs correspondentes', () => {
  for (const [id, articleCount, file] of [
    ['25', 38, 'estatuto-abamev.pdf'],
    ['26', 44, 'regimento-interno-abamev.pdf'],
  ]) {
    const entry = all.find(x=>x.id===id);
    assert.deepEqual(
      [...entry.body.matchAll(/^Art\.\s*(\d+)/gm)].map(match=>Number(match[1])),
      Array.from({length:articleCount},(_,i)=>i+1),
    );
    assert.equal(entry.attachments[0].src, `/documents/${file}`);
  }
});
test('validação rejeita uma nova publicação com rota duplicada', () => {
  assert.ok(validate([...all,{...all[0],id:'novo'}]).some(x=>x.includes('Rota repetida')));
});
