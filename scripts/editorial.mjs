import { readFile, writeFile } from 'node:fs/promises';
import { collectionNames, readCollection } from './content.mjs';

const overrides = JSON.parse(await readFile('content/editorial-overrides.json', 'utf8'));
const pages = readCollection('pages');
const academics = readCollection('academics');
const tribute = pages.find(entry => entry.id === '51');
const biography = academics.find(entry => entry.id === '89');

if (tribute && biography) {
  biography.body = tribute.body;
  biography.images = tribute.images;
  biography.legacyUrls = [...new Set([...biography.legacyUrls, ...tribute.legacyUrls, tribute.path])];

  const redirects = JSON.parse(await readFile('content/redirects.json', 'utf8'));
  for (const url of biography.legacyUrls) redirects[url] = biography.path;
  redirects['/falecidos'] = '/academicos/falecidos';
  redirects['/academicos/memorial'] = '/academicos/falecidos';
  await writeFile('content/redirects.json', JSON.stringify(redirects, null, 2) + '\n');

  const report = JSON.parse(await readFile('docs/migration-report.json', 'utf8'));
  Object.assign(report.records.find(record => record.id === tribute.id), {
    status: 'consolidated',
    destination: biography.path,
    reason: 'A versão ampliada da biografia, com homenagens, foi incorporada ao registro 89.',
  });
  await writeFile('docs/migration-report.json', JSON.stringify(report, null, 2) + '\n');
}

for (const name of collectionNames) {
  const entries = name === 'pages' ? pages.filter(entry => entry !== tribute)
    : name === 'academics' ? academics
    : readCollection(name);
  for (const entry of entries) {
    entry.body = entry.body.replace(/^## (.*!\[.*)$/gm, '$1');
    entry.body = entry.body.replace(/\[(\*Imagem referenciada na fonte original; arquivo indisponível\.\*)\]\([^)]*\)/g, '$1');
    if (overrides[entry.id]) entry.title = overrides[entry.id];
    entry.summary = entry.summary.replace(/\*+/g, '').replace(/\s{2,}/g, ' ').trim();
    if (/^Arquivo em PDF|^Artigo em PDF|^Texto em PDF|Documento preservado no acervo/i.test(entry.summary)) entry.summary = 'Documento disponível para leitura em PDF.';
    if (/^Registro audiovisual preservado/i.test(entry.summary)) entry.summary = 'Assista ao vídeo.';
    if (entry.chair) {
      entry.title = entry.occupant || `Cadeira nº ${entry.chair}`;
      if (entry.patron) entry.patron = entry.patron.replace(/^PATRON[O0]\s*:?\s*/i, '').replace(/^:\s*/, '').replace(/\.$/, '');
      if (entry.chair === 10) entry.patron = 'Nelson Baeta Alvim';
      if (entry.chair === 31) entry.patron = null;
      entry.summary = `Cadeira nº ${entry.chair} da Academia Baiana de Medicina Veterinária${entry.patron ? `, que tem como patrono ${entry.patron}` : ''}.`;
    }
    if (entry.boardNumber) {
      entry.title = `${entry.boardNumber}ª Diretoria`;
      entry.summary = `Composição da ${entry.boardNumber}ª Diretoria, do Conselho Fiscal e das comissões da ABAMEV.`;
    }
    if (entry.id === '25') entry.summary = 'O texto integral do Estatuto da Academia, organizado por capítulos e artigos.';
    if (entry.id === '26') entry.summary = 'O Regimento Interno da Academia: símbolos, normas de funcionamento e organização.';
    if (entry.id === '27') entry.summary = 'A bandeira oficial da Academia Baiana de Medicina Veterinária.';
    if (entry.id === '27' && entry.cover) entry.cover = { ...entry.cover, src: '/images/bandeira.webp', width: 854, height: 598 };
    if (entry.id === '28') entry.summary = 'O bóton usado pelos acadêmicos da ABAMEV.';
    if (entry.id === '29') entry.summary = 'A medalha acadêmica da Academia Baiana de Medicina Veterinária.';
  }
  await writeFile(`content/${name}.json`, JSON.stringify(entries, null, 2) + '\n');
}
