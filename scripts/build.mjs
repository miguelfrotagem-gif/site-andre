import {cp,mkdir,rm} from 'node:fs/promises';
await rm('dist',{recursive:true,force:true});
await mkdir('dist',{recursive:true});
for(const file of ['index.html','styles.css','app.js','config.js','assets','sitemap.xml','robots.txt','google0fb09980fc195192.html']) await cp(file,`dist/${file}`,{recursive:true});
console.log('Build concluído em dist/');
