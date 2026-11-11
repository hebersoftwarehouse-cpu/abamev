import { readFile, writeFile, mkdir, stat } from 'node:fs/promises';
import sharp from 'sharp';
import { collectionNames, readCollection } from './content.mjs';

const report = JSON.parse(await readFile('docs/migration-report.json', 'utf8'));
const exists = async p => { try { return (await stat(p)).size > 0; } catch { return false; } };
async function download(url, timeout = 25000) {
  const res = await fetch(url, { signal: AbortSignal.timeout(timeout), headers: { 'User-Agent': 'ABAMEV-Archive-Recovery/1.0' } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return { bytes: Buffer.from(await res.arrayBuffer()), type: res.headers.get('content-type') || '' };
}
async function pool(items, task) {
  let next = 0;
  await Promise.all(Array.from({ length: 4 }, async () => { while (next < items.length) await task(items[next++]); }));
}
await pool(report.media.filter(m => m.type === 'external'), async m => {
  if (await exists(`public${m.src}`)) { m.status = 'recovered'; return; }
  const candidates = [m.original];
  if (m.original.includes('abamev.org.br')) candidates.push(`https://web.archive.org/web/20250327232422im_/${m.original}`);
  for (const url of candidates) {
    try {
      const { bytes } = await download(url);
      const meta = await sharp(bytes).metadata();
      const name = m.src.split('/').at(-1).replace('.webp', `.${meta.format}`);
      await writeFile(`archive/originals/${name}`, bytes);
      await sharp(bytes).rotate().resize({ width: 1440, withoutEnlargement: true }).webp({ quality: 85 }).toFile(`public${m.src}`);
      Object.assign(m, { status: 'recovered', recoveredFrom: url, width: meta.width, height: meta.height });
      break;
    } catch (e) { m.reason = e.message; m.status = 'unavailable'; }
  }
  console.log('Imagem:', m.src, m.status);
});
await pool(report.attachments, async a => {
  if (await exists(`public${a.src}`)) { a.status = 'recovered'; return; }
  try {
    const { bytes } = await download(`https://drive.google.com/uc?export=download&id=${encodeURIComponent(a.id)}`, 40000);
    if (!bytes.subarray(0, 100).toString().includes('%PDF-')) throw new Error('O provedor não entregou um PDF público.');
    await writeFile(`public${a.src}`, bytes);
    a.status = 'recovered'; a.bytes = bytes.length;
  } catch (e) { a.status = 'unavailable'; a.reason = e.message; }
  console.log('Documento:', a.id, a.status);
});
for (const name of collectionNames) {
  const data = readCollection(name);
  for (const record of data) {
    for (const m of record.images) {
      const entry = report.media.find(x => x.src === m.src);
      if (entry?.status === 'unavailable') record.body = record.body.replaceAll(`![${m.alt}](${m.src})`, '');
    }
    record.images = record.images.filter(m => report.media.find(x => x.src === m.src)?.status !== 'unavailable');
    if (record.cover && !record.images.some(m => m.src === record.cover.src)) record.cover = record.images[0] || null;
    record.body = record.body.replace(/\[(\*Imagem referenciada na fonte original; arquivo indisponível\.\*)\]\([^)]*\)/g, '$1');
    for (const a of record.attachments) {
      Object.assign(a, report.attachments.find(x => x.id === a.id) || {});
      if (a.status !== 'recovered') record.body = record.body.replaceAll(`](${a.src})`, `](${a.originalUrl})`);
    }
  }
  await writeFile(`content/${name}.json`, JSON.stringify(data, null, 2) + '\n');
}
await writeFile('docs/migration-report.json', JSON.stringify(report, null, 2) + '\n');
console.log('Recuperação concluída.');
