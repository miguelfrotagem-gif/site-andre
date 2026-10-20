import {readFile, writeFile, mkdir} from 'node:fs/promises';
import path from 'node:path';

const mime = {'.webp':'image/webp', '.svg':'image/svg+xml', '.ttf':'font/ttf', '.png':'image/png'};
async function embed(text) {
  const files = new Set(text.match(/assets\/[A-Za-z0-9_./-]+\.(?:webp|svg|ttf|png)/g));
  for (const file of files) {
    const data = `data:${mime[path.extname(file)]};base64,${(await readFile(file)).toString('base64')}`;
    text = text.replaceAll(file, () => data);
  }
  return text;
}

let html = await readFile('index.html', 'utf8');
const styles = await embed(await readFile('styles.css', 'utf8'));
// Replacement callbacks preserve literal $$, $& and other JavaScript characters.
html = html.replace('<link rel="stylesheet" href="styles.css">', () => `<style>${styles}</style>`);
const scripts = [];
for (const script of ['config.js', 'app.js']) {
  html = html.replace(`<script src="${script}" defer></script>`, '');
  scripts.push(await readFile(script, 'utf8'));
}
html = await embed(html);
html = html.replace('</body>', () => `<script>${scripts.join('\n')}</script></body>`);
const destination = process.argv[2] || 'dist/Energia-Solar.html';
await mkdir(path.dirname(destination), {recursive:true});
await writeFile(destination, html);
console.log(`HTML independente gerado: ${destination}`);
