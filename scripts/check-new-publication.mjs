import { readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import assert from 'node:assert/strict';

const file='content/publications.json';
const original=await readFile(file,'utf8');
const sample=JSON.parse(await readFile('docs/publication-example.json','utf8'));
sample.id='acceptance-probe'; sample.slug='verificacao-de-publicacao';sample.path='/publicacoes/verificacao-de-publicacao';sample.title='Verificação de uma nova publicação';
function build() {
  const result=spawnSync(process.execPath,['node_modules/@react-router/dev/bin.cjs','build'],{encoding:'utf8'});
  if(result.status!==0) throw new Error(result.stderr || result.stdout);
  const finalize=spawnSync(process.execPath,['scripts/finalize-build.mjs'],{encoding:'utf8'});
  if(finalize.status!==0) throw new Error(finalize.stderr);
}
try {
  const entries=JSON.parse(original);entries.push(sample);await writeFile(file,JSON.stringify(entries,null,2)+'\n');
  build();
  assert.ok(existsSync(`build/client${sample.path}/index.html`));
  assert.match(await readFile(`build/client${sample.path}/index.html`,'utf8'),/Verificação de uma nova publicação/);
  assert.ok((await readFile('build/client/sitemap.xml','utf8')).includes(sample.path));
  assert.ok(JSON.parse(await readFile('build/client/search-index.json','utf8')).some(x=>x.id===sample.id));
  assert.ok((await readFile('build/client/publicacoes.data','utf8')).includes(sample.id));
  console.log('Nova publicação: página, metadados, listagem, busca e sitemap gerados sem alterar rotas.');
} finally {
  await writeFile(file,original);
  build();
  console.log('Fixture removida e build final restaurado.');
}
