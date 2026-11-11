import { load } from 'cheerio';
import TurndownService from 'turndown';

const cellMarkdown = new TurndownService({ emDelimiter:'*' });
export function tableToMarkdown(html) {
  const $=load(html,{},false);
  const rows=$('tr').toArray().map(tr=>$(tr).children('th,td').toArray().flatMap(cell=>{
    const content=cellMarkdown.turndown($(cell).html() || '').replace(/\n+/g,' ').replace(/\|/g,'\\|').replace(/\u00a0/g,' ').trim();
    return [content,...Array.from({length:Math.max(0,Number($(cell).attr('colspan')||1)-1)},()=> '')];
  })).filter(row=>row.length);
  if(!rows.length) return '';
  const width=Math.max(...rows.map(r=>r.length));
  const header=$('tr').first().find('th').length ? rows.shift() : Array.from({length:width},()=> '');
  const line=row=>'| '+Array.from({length:width},(_,i)=>row[i]||'').join(' | ')+' |';
  return '\n\n'+[line(header),line(Array.from({length:width},()=> '---')),...rows.map(line)].join('\n')+'\n\n';
}
