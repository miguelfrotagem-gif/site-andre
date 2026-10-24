import {cp, mkdir, rm, readFile, writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
await rm('dist',{recursive:true,force:true});
await mkdir('dist',{recursive:true});
for(const file of ['index.html','hensec.html','privacidade.html','cookies.html','styles.css','app.js','config.js','site-extras.js','assets','.nojekyll','ademicon','LINKS_CONTEUDOS.json','MANIFESTO_EXTRAIDO.json']) {
  await cp(file,`dist/${file}`,{recursive:true});
}
const pages={
  'index.html':['ademicon/styles.css','ademicon/dialogs.css','ademicon/app.js'],
  'hensec.html':['styles.css','config.js','app.js','site-extras.js'],
  'privacidade.html':['styles.css','site-extras.js'],
  'cookies.html':['styles.css','site-extras.js']
};
for(const [page,files] of Object.entries(pages)) {
  let html=await readFile(`dist/${page}`,'utf8');
  for(const file of files) {
    const version=createHash('sha256').update(await readFile(file)).digest('hex').slice(0,12);
    const attribute=file.endsWith('.css')?'href':'src';
    html=html.replace(`${attribute}="${file}"`,()=>`${attribute}="${file}?v=${version}"`);
  }
  await writeFile(`dist/${page}`,html);
}
console.log('Build concluído em dist/: Ademicon preservado na raiz; HENSEG em hensec.html, com políticas e versões de cache.');
