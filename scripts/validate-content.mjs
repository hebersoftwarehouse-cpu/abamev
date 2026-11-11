import { records } from './content.mjs';
import { existsSync } from 'node:fs';

export function validate(items) {
  const errors = [], ids = new Set(), paths = new Set();
  for (const item of items) {
    if (!item.id || !item.title || !item.path || !item.slug || typeof item.body !== 'string') errors.push(`Campos obrigatórios ausentes: ${item.id}`);
    if (ids.has(item.id)) errors.push(`ID repetido: ${item.id}`);
    if (paths.has(item.path)) errors.push(`Rota repetida: ${item.path}`);
    if (!/^\/[a-z0-9/-]+$/.test(item.path)) errors.push(`Rota inválida: ${item.path}`);
    ids.add(item.id); paths.add(item.path);
    if (item.sourcePublishedAt && Number.isNaN(Date.parse(item.sourcePublishedAt))) errors.push(`Data inválida: ${item.id}`);
    if (item.body.includes('data:image')) errors.push(`Imagem embutida no JSON: ${item.id}`);
    for (const m of item.images || []) if (!existsSync(`public${m.src}`)) errors.push(`Imagem ausente: ${m.src}`);
    for (const a of item.attachments || []) if (a.status === 'recovered' && !existsSync(`public${a.src}`)) errors.push(`PDF ausente: ${a.src}`);
  }
  return errors;
}
if (process.argv[1]?.endsWith('validate-content.mjs')) {
  const errors = validate(records());
  if (errors.length) { console.error(errors.join('\n')); process.exitCode = 1; }
  else console.log('Conteúdo validado.');
}
