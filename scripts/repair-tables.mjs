import { writeFile } from 'node:fs/promises';
import { collectionNames, readCollection } from './content.mjs';
import { tableToMarkdown } from './tables.mjs';

for(const name of collectionNames) {
  const entries=readCollection(name);
  for(const entry of entries) entry.body=entry.body.replace(/<table\b[\s\S]*?<\/table>/gi,tableToMarkdown);
  await writeFile(`content/${name}.json`,JSON.stringify(entries,null,2)+'\n');
}
