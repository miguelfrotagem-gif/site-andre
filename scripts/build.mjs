import {cp, mkdir, rm, readFile, writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
await rm('dist',{recursive:true,force:true});
await mkdir('dist',{recursive:true});
for(const file of ['baixar.html','downloads','index.html','hc.html','hc','fs-perfuracao.html','ademicon.html','fs','hensec.html','privacidade.html','cookies.html','styles.css','mobile.css','desktop.css','contact.css','entry.js','mobile.js','app.js','config.js','site-extras.js','assets','.nojekyll','ademicon','LINKS_CONTEUDOS.json','MANIFESTO_EXTRAIDO.json']) {
  await cp(file,`dist/${file}`,{recursive:true});
}
const pages={
  'index.html':['hc/styles.css','hc/app.js'],
  'hc.html':['hc/styles.css','hc/app.js'],
  'fs-perfuracao.html':['fs/styles.css','fs/surface.css','fs/app.js'],
  'ademicon.html':['ademicon/styles.css','ademicon/dialogs.css','ademicon/app.js'],
  'hensec.html':['styles.css','mobile.css','desktop.css','contact.css','entry.js','mobile.js','config.js','app.js','site-extras.js'],
  'privacidade.html':['styles.css','site-extras.js'],
  'cookies.html':['styles.css','site-extras.js']
};
// Version HC configuration with its module so reviewed configuration changes reach browsers.
let hcApp=await readFile('dist/hc/app.js','utf8');
const hcConfigVersion=createHash('sha256').update(await readFile('hc/config.js')).digest('hex').slice(0,12);
await writeFile('dist/hc/app.js',hcApp.replace("'./config.js'",`'./config.js?v=${hcConfigVersion}'`));
// Version both imports so configuration and component updates bypass stale CDN caches.
let fsApp=await readFile('dist/fs/app.js','utf8');
for(const dependency of ['config','surface']) {
  const version=createHash('sha256').update(await readFile(`fs/${dependency}.js`)).digest('hex').slice(0,12);
  fsApp=fsApp.replace(new RegExp(`'\\./${dependency}\\.js(?:\\?[^']*)?'`),`'./${dependency}.js?v=${version}'`);
}
await writeFile('dist/fs/app.js',fsApp);
for(const [page,files] of Object.entries(pages)) {
  let html=await readFile(`dist/${page}`,'utf8');
  for(const file of files) {
    const version=createHash('sha256').update(await readFile(`dist/${file}`)).digest('hex').slice(0,12);
    const attribute=file.endsWith('.css')?'href':'src';
    const escapedFile=file.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
    html=html.replace(new RegExp(`${attribute}="${escapedFile}(?:\\?[^\"]*)?"`),()=>`${attribute}="${file}?v=${version}"`);
  }
  await writeFile(`dist/${page}`,html);
}
console.log('Build concluído em dist/: HC na raiz; FS Perfuração, Ademicon e HENSEC preservados em páginas próprias.');
