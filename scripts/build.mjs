import {cp, mkdir, rm, readFile, writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';

await rm('dist', {recursive:true, force:true});
await mkdir('dist', {recursive:true});
for (const file of ['index.html', 'styles.css', 'app.js', 'config.js', 'assets', '.nojekyll', 'hensec.html', 'ademicon', 'LINKS_CONTEUDOS.json', 'MANIFESTO_EXTRAIDO.json']) {
  await cp(file, `dist/${file}`, {recursive:true});
}

// Pages caches stable URLs. Give each published stylesheet/script a content version.
let html = await readFile('dist/index.html', 'utf8');
for (const file of ['ademicon/styles.css', 'ademicon/dialogs.css', 'ademicon/app.js']) {
  const contents = await readFile(`dist/${file}`);
  const version = createHash('sha256').update(contents).digest('hex').slice(0, 12);
  const attribute = file.endsWith('.css') ? 'href' : 'src';
  html = html.replace(`${attribute}="${file}"`, () => `${attribute}="${file}?v=${version}"`);
}
await writeFile('dist/index.html', html);
console.log('Build concluído em dist/ com versões de cache para CSS e JavaScript.');
