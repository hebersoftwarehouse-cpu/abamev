import { readFileSync } from 'node:fs';

export const collectionNames = ['publications', 'pages', 'academics', 'boards'];
export const readCollection = name => JSON.parse(readFileSync(new URL(`../content/${name}.json`, import.meta.url), 'utf8'));
export const records = () => collectionNames.flatMap(readCollection);
export const staticPaths = ['/', '/academia/simbolos', '/academia/diretorias', '/academicos/cadeiras', '/academicos/honorarios', '/academicos/correspondentes', '/academicos/falecidos', '/homenagens/agraciados', '/publicacoes', '/noticias', '/noticias/videos', '/noticias/eventos', '/busca', '/privacidade', '/404'];
export const publicPaths = () => [...new Set([...staticPaths, ...records().map(x => x.path)])];
