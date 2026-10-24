import {readFile,writeFile,mkdir} from 'node:fs/promises';
import path from 'node:path';
const mime={'.webp':'image/webp','.svg':'image/svg+xml','.ttf':'font/ttf','.png':'image/png'};
async function embed(text) {
  const files=new Set(text.match(/assets\/[A-Za-z0-9_./-]+\.(?:webp|svg|ttf|png)/g));
  for(const file of files)text=text.replaceAll(file,()=>`data:${mime[path.extname(file)]};base64,${buffers.get(file)}`);
  return text;
}
const buffers=new Map();
const styles=await readFile('styles.css','utf8');
const sourceFiles=['hensec.html','privacidade.html','cookies.html'];
const sources=await Promise.all(sourceFiles.map(file=>readFile(file,'utf8')));
for(const source of [styles,...sources]) {
  for(const file of new Set(source.match(/assets\/[A-Za-z0-9_./-]+\.(?:webp|svg|ttf|png)/g)))if(!buffers.has(file))buffers.set(file,(await readFile(file)).toString('base64'));
}
const awaitableStyles=await embed(styles);
const destination=process.argv[2]||'dist/HENSEG.html';
await mkdir(path.dirname(destination),{recursive:true});
for(let i=0;i<sources.length;i++) {
  let html=sources[i].replace('<link rel="stylesheet" href="styles.css">',()=>`<style>${awaitableStyles}</style>`);
  const scripts=[];
  for(const script of ['config.js','app.js','site-extras.js']) {
    const tag=`<script src="${script}" defer></script>`;
    if(html.includes(tag)){html=html.replace(tag,'');scripts.push(await readFile(script,'utf8'));}
  }
  html=await embed(html);
  html=html.replace('</body>',()=>`<script>${scripts.join('\n')}</script></body>`);
  // Keep links between the exported HENSEG entry and the two policies functional.
  html=html.replaceAll('hensec.html',path.basename(destination));
  await writeFile(i===0?destination:path.join(path.dirname(destination),sourceFiles[i]),html);
}
console.log(`HENSEG exportada para ${destination}, com privacidade.html e cookies.html ao lado.`);
