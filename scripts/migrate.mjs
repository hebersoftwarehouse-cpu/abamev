import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { XMLParser } from 'fast-xml-parser';
import { load } from 'cheerio';
import TurndownService from 'turndown';
import { gfm } from 'turndown-plugin-gfm';
import sharp from 'sharp';
import { tableToMarkdown } from './tables.mjs';

const ns = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_', trimValues: false });
const channel = ns.parse(await readFile('abamev-wordpress.xml', 'utf8')).rss.channel;
const arr = value => value == null ? [] : Array.isArray(value) ? value : [value];
const text = value => typeof value === 'object' ? String(value?.['#text'] ?? '') : String(value ?? '');
const clean = value => text(value).replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim();
const slugify = value => clean(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const report = { source: 'abamev-wordpress.xml', records: [], categories: [], media: [], attachments: [] };
const collections = { publications: [], pages: [], academics: [], boards: [] };
const images = new Map();
const redirects = {};
const td = new TurndownService({ headingStyle: 'atx', bulletListMarker: '-', emDelimiter: '*', strongDelimiter: '**' });
td.use(gfm);
td.addRule('allTables', { filter: 'table', replacement: (_, node) => tableToMarkdown(node.outerHTML) });
td.addRule('caption', { filter: 'figcaption', replacement: content => `\n\n*${content.trim()}*\n\n` });
for (const dir of ['content', 'public/media', 'public/documents', 'archive/originals', 'docs']) await mkdir(dir, { recursive: true });

async function image(src, label) {
  if (images.has(src)) return images.get(src);
  let result;
  if (src.startsWith('data:image/')) {
    try {
      const buf = Buffer.from(src.split(',')[1], 'base64');
      const hash = createHash('sha256').update(buf).digest('hex').slice(0, 16);
      const meta = await sharp(buf).metadata();
      const original = `archive/originals/${hash}.${meta.format || 'bin'}`;
      await writeFile(original, buf);
      const path = `/media/${hash}.webp`;
      await sharp(buf).rotate().resize({ width: 1440, withoutEnlargement: true }).webp({ quality: 85 }).toFile(`public${path}`);
      result = { src: path, alt: label || 'Imagem do acervo da ABAMEV', width: meta.width, height: meta.height };
      report.media.push({ type: 'embedded', original, ...result, status: 'extracted' });
    } catch (e) { report.media.push({ type: 'embedded', label, status: 'pending', reason: e.message }); }
  } else {
    const hash = createHash('sha256').update(src).digest('hex').slice(0, 16);
    result = { src: `/media/${hash}.webp`, alt: label || 'Fotografia do acervo da ABAMEV' };
    report.media.push({ type: 'external', original: src, ...result, status: 'pending' });
  }
  images.set(src, result);
  return result;
}

async function convert(html, title, id) {
  const $ = load(html, {}, false);
  const foundImages = [];
  const videos = [];
  const attachments = [];
  $('script, style, object').remove();
  $('h1,h2,h3').each((_, el) => { if (!$(el).text().trim() && $(el).find('img').length) $(el).replaceWith($(el).html()); });
  for (const el of $('img').toArray()) {
    const alt = ($(el).attr('alt') || '').replace(/Descrição gerada automaticamente.*$/i, '').trim();
    const caption = $(el).closest('figure').find('figcaption').text().trim();
    const img = await image($(el).attr('src') || '', caption || alt || title);
    if (img) { foundImages.push(img); $(el).replaceWith(`<img src="${img.src}" alt="${img.alt.replaceAll('"', '&quot;')}" />`); }
    else $(el).remove();
  }
  $('iframe').each((_, el) => {
    const src = $(el).attr('src') || '';
    const match = src.match(/youtube(?:-nocookie)?\.com\/embed\/([\w-]+)/);
    if (match && !videos.some(v => v.id === match[1])) videos.push({ id: match[1], title });
    $(el).remove();
  });
  $('a').each((_, el) => {
    const href = $(el).attr('href') || '';
    const drive = href.match(/drive\.google\.com\/file\/d\/([^/]+)/);
    if (drive) {
      const a = { id: drive[1], title: $(el).text().trim() || title, originalUrl: href, src: `/documents/${drive[1]}.pdf`, status: 'pending' };
      attachments.push(a); report.attachments.push({ ...a, recordId: id });
      $(el).attr('href', a.src);
    }
  });
  // Promote structural labels without changing the original words.
  $('p').each((_, el) => {
    const s = clean($(el).text());
    if (/^CAP[IÍ]TULO\s+[IVXLCDM]+$/i.test(s) || /^(Diretoria|Conselho Fiscal|Comissões Permanentes)$/.test(s)) {
      $(el).replaceWith(`<h2>${$(el).text()}</h2>`);
    } else if (/^PATRONO DA CADEIRA|^Acadêmico Titular e|^SAUDAÇÃO PROFERIDA|^1[º°] OCUPANTE|^2[º°] OCUPANTE/i.test(s)) {
      $(el).replaceWith(`<h2>${$(el).text()}</h2>`);
    }
  });
  const plain = clean($.root().text());
  let markdown = td.turndown($.html()).replace(/\u00a0/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
  // A biography can contain a source h1; the page owns its single h1.
  markdown = markdown.replace(/^# /gm, '## ');
  return { body: markdown, images: foundImages, videos, attachments, plain };
}

const titleOverrides = {
  ...JSON.parse(await readFile('content/editorial-overrides.json', 'utf8')),
  '18': 'Convenção Internacional on-line em Medicina Veterinária Legal',
  '24': 'História da Academia', '25': 'Estatuto', '26': 'Regimento interno',
  '30': 'Comendadores da ABAMEV', '46': 'Hans Merkt', '47': 'Wilhelm Brass',
  '48': 'Membro honorário nº 3', '49': 'Membro honorário nº 4',
  '50': '60 anos de cooperação Brasil–Alemanha na Medicina Veterinária',
  '51': 'Memorial José Alberto da Silva Lira', '52': 'Covid-19: apontamentos do acervo',
  '90': 'O que é ser acadêmico', '97': 'Hans Merkt: 60 anos do intercâmbio TiHo–Brasil',
  '100': 'Companhia Veterinária Alemã', '101': 'Companhia Veterinária Alemã',
  '141': 'Ordem do Mérito da Medicina Veterinária da Bahia — 2022'
};
const paths = { '24': '/academia/historia', '25': '/documentos/estatuto', '26': '/documentos/regimento', '27': '/academia/simbolos/bandeira', '28': '/academia/simbolos/boton', '29': '/academia/simbolos/medalha', '30': '/homenagens/comendadores', '51': '/academicos/memorial-jose-alberto-da-silva-lira' };
const date = value => clean(value).replace(' ', 'T') + '-03:00';
const pretty = value => value === value.toUpperCase() ? value.toLocaleLowerCase('pt-BR').replace(/^\p{L}/u, x => x.toUpperCase()).replace(/\b(ufba|abamev|covid|crmv|tiho)\b/g, x => ({ ufba: 'UFBA', abamev: 'ABAMEV', covid: 'Covid', crmv: 'CRMV', tiho: 'TiHo' })[x]) : value;

for (const item of arr(channel.item)) {
  const id = clean(item['wp:post_id']);
  const originalTitle = clean(item.title);
  const meta = Object.fromEntries(arr(item['wp:postmeta']).map(x => [clean(x['wp:meta_key']), clean(x['wp:meta_value'])]));
  const originalUrl = meta._drupal_original_url || `https://www.abamev.org.br/node/${id}`;
  const categories = arr(item.category).filter(x => x['@_domain'] === 'category').map(clean);
  const disposition = { id, originalTitle, originalUrl, status: 'migrated', destination: null };
  if (clean(item['wp:status']) !== 'publish' || ['3', '22', '23'].includes(id) || id === '10') {
    disposition.status = 'excluded';
    disposition.reason = id === '10' ? 'Política antiga de cookies excluída.' : clean(item['wp:status']) !== 'publish' ? 'Rascunho não publicado.' : 'Registro de teste.';
    report.records.push(disposition); continue;
  }
  const title = titleOverrides[id] || pretty(originalTitle);
  const slug = slugify(title);
  const converted = await convert(text(item['content:encoded']), title, id);
  let collection = 'publications';
  let path = `/publicacoes/${slug}`;
  if (categories.some(c => /Acadêmicos|Membros Honorários|Correspondentes/.test(c))) { collection = 'academics'; path = `/academicos/${slug}`; }
  if (categories.includes('Diretorias')) { collection = 'boards'; path = `/academia/diretorias/${id === '116' ? '10' : id === '111' ? '9' : Number(id) - 32}`; }
  if (categories.some(c => /Eventos|Fatos e vídeos|Informativo/.test(c))) path = `/noticias/${slug}`;
  if (categories.some(c => /Ordem do Mérito/.test(c))) path = `/homenagens/${slug}`;
  if (paths[id]) { path = paths[id]; if (collection === 'publications') collection = 'pages'; }
  const chairMatch = originalTitle.match(/Cadeira\s*N[º°o]?\s*(\d+)/i);
  const chair = chairMatch ? Number(chairMatch[1]) : null;
  if (chair) path = `/academicos/cadeiras/${chair}`;
  const $ = load(text(item['content:encoded']), {}, false);
  const captions = $('figcaption').map((_, el) => clean($(el).text())).get();
  const headings = $('p').map((_, el) => clean($(el).text())).get().filter(p => /^Acadêmico Titular|^PATRONO DA CADEIRA/i.test(p));
  const seatName = chair ? originalTitle.replace(/^.*?\d+\s*(?:-|–)?\s*/, '').trim() : null;
  const empty = !converted.body && !converted.videos.length;
  const summary = id === '97' ? 'Uma homenagem ao professor Hans Merkt e à sua contribuição para a cooperação científica entre o Brasil e a Alemanha.' : id === '90' ? 'Uma reflexão sobre o significado de integrar uma academia e contribuir para a memória e o conhecimento da profissão.' : id === '141' ? 'A Academia reconhece as contribuições de Humberto Miranda Oliveira e Maurício Mário Lima Nogueira à Medicina Veterinária baiana.' : converted.plain.slice(0, 210).replace(/\s+\S*$/, '') + (converted.plain.length > 210 ? '…' : '') || (converted.videos.length ? 'Registro audiovisual preservado no acervo da Academia Baiana de Medicina Veterinária.' : 'Esta cadeira está registrada no acervo, sem biografia disponível na fonte importada.');
  const record = {
    id, slug, path, title, originalTitle, summary,
    category: categories[0] || 'Publicações', categories,
    format: converted.videos.length ? 'Vídeo' : converted.attachments.length ? 'Documento' : 'Artigo',
    sourcePublishedAt: date(item['wp:post_date']), author: null,
    body: converted.body, cover: converted.images[0] || null, images: converted.images,
    attachments: converted.attachments, videos: converted.videos,
    source: { originalUrl, drupalId: meta._drupal_nid || id }, legacyUrls: [new URL(originalUrl).pathname, `/node/${id}`],
    ...(chair ? { chair, occupant: /vazi/i.test(seatName || '') || !seatName ? null : seatName, vacancyInSource: /vazi/i.test(originalTitle), patron: captions[0]?.replace(/^PATRONO\s*/i, '') || null, biographySections: headings } : {}),
    ...(collection === 'boards' ? { boardNumber: Number(path.split('/').at(-1)), positions: $('table').first().find('tr').map((_, tr) => { const cells = $(tr).find('td').map((_, td) => clean($(td).text())).get(); return cells.length >= 2 ? { role: cells[0], name: cells[1] } : null; }).get() } : {}),
    empty
  };
  if (id === '101') { disposition.status = 'consolidated'; disposition.reason = 'Mesmo vídeo do registro 100.'; path = collections.publications.find(x => x.id === '100').path; }
  else collections[collection].push(record);
  disposition.destination = path;
  if (empty) { disposition.status = 'pending'; disposition.reason = 'Cadeira preservada; a fonte não contém biografia.'; }
  for (const url of record.legacyUrls) redirects[url] = path;
  report.records.push(disposition);
}
for (const cat of arr(channel['wp:category'])) {
  const name = clean(cat['wp:cat_name']);
  const alias = clean(cat['wp:category_nicename']);
  const description = text(cat['wp:category_description']);
  report.categories.push({ name, alias, hasDescription: Boolean(description.trim()) });
  if (!['merito', 'jubileu'].includes(alias)) continue;
  const title = alias === 'merito' ? 'Ordem do Mérito da Medicina Veterinária da Bahia' : 'Jubileu de Ouro Médico Veterinário da Bahia';
  const converted = await convert(description, title, `category-${alias}`);
  collections.pages.push({ id: `category-${alias}`, slug: alias, path: `/homenagens/${alias === 'merito' ? 'ordem-do-merito' : 'jubileu-de-ouro'}`, title, originalTitle: name, summary: alias === 'merito' ? 'O mais alto reconhecimento da Academia às personalidades que contribuíram para o engrandecimento da Medicina Veterinária na Bahia.' : 'Reconhecimento à trajetória de profissionais com cinquenta anos de graduação e exemplar conduta ética.', category: 'Regulamento', categories: ['Homenagens'], format: 'Documento', sourcePublishedAt: null, author: null, ...converted, cover: null, source: { originalUrl: `https://www.abamev.org.br/${alias}` }, legacyUrls: [`/${alias}`] });
}
const aliases = { academia: '/academia/historia', documentos: '/documentos/estatuto', reghist: '/academia/historia', legislacao: '/documentos/estatuto', estatuto: '/documentos/estatuto', regimento: '/documentos/regimento', simbolos: '/academia/simbolos', diretorias: '/academia/diretorias', macademicos: '/academicos/cadeiras', academicos: '/academicos/cadeiras', honorarios: '/academicos/honorarios', correspondentes: '/academicos/correspondentes', falecidos: '/academicos/memorial', emeritos: '/academicos/cadeiras', benemeritos: '/academicos/cadeiras', 'academicos/emeritos': '/academicos/cadeiras', 'academicos/benemeritos': '/academicos/cadeiras', homenagens: '/homenagens/agraciados', merito: '/homenagens/ordem-do-merito', jubileu: '/homenagens/jubileu-de-ouro', publicacoes: '/publicacoes', regfotos: '/noticias/videos', informativo: '/noticias', livro60anos: collections.publications.find(x => x.id === '50')?.path, memorial_lira: '/academicos/memorial-jose-alberto-da-silva-lira', covid19: collections.publications.find(x => x.id === '52')?.path, agenda: '/noticias/eventos', 'event-created/month': '/noticias/eventos', 'event-created/week': '/noticias/eventos', 'event-created/year': '/noticias/eventos', 'search/node': '/busca', node: '/noticias' };
for (const [from, to] of Object.entries(aliases)) if (to && `/${from}` !== to) redirects[`/${from}`] = to;
for (const [name, data] of Object.entries(collections)) await writeFile(`content/${name}.json`, JSON.stringify(data, null, 2) + '\n');
await writeFile('content/redirects.json', JSON.stringify(redirects, null, 2) + '\n');
await writeFile('docs/migration-report.json', JSON.stringify(report, null, 2) + '\n');
console.log(`Migrados ${Object.values(collections).flat().length} conteúdos; ${report.records.length} registros reconciliados; ${report.media.length} mídias únicas.`);
await import('./editorial.mjs');
