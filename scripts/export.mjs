import {readFile,writeFile,mkdir} from 'node:fs/promises';
import path from 'node:path';
const mime={'.webp':'image/webp','.svg':'image/svg+xml','.ttf':'font/ttf'};
async function embed(text) {
  // Somente caminhos locais: preservar URLs absolutas dos metadados de SEO.
  const pattern = /(?<=["'(])assets\/[A-Za-z0-9_./-]+\.(?:webp|svg|ttf)/g;
  const embedded = new Map();
  for (const file of new Set(text.match(pattern))) {
    embedded.set(file, `data:${mime[path.extname(file)]};base64,${(await readFile(file)).toString('base64')}`);
  }
  return text.replace(pattern, file => embedded.get(file));
}

let html=await readFile('index.html','utf8');
html=html.replace('<link rel="stylesheet" href="styles.css">',`<style>${await embed(await readFile('styles.css','utf8'))}</style>`);
for(const script of ['config.js','app.js']) html=html.replace(`<script src="${script}" defer></script>`,'');
html=await embed(html);
html=html.replace('</body>',`<script>${await readFile('config.js','utf8')}\n${await readFile('app.js','utf8')}</script></body>`);
const destination=process.argv[2]||'dist/G-Hot-e-Cold.html';
await mkdir(path.dirname(destination),{recursive:true});
await writeFile(destination,html);
console.log(`HTML independente gerado: ${destination}`);
