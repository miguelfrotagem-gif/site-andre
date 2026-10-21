import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
const base=process.env.TEST_URL||'http://127.0.0.1:3000';
const output='/tmp/hensec-checks';await mkdir(output,{recursive:true});
const target=await(await fetch('http://127.0.0.1:9222/json/new?about:blank',{method:'PUT'})).json();
const ws=new WebSocket(target.webSocketDebuggerUrl);await new Promise(r=>ws.addEventListener('open',r,{once:true}));
let id=0;const pending=new Map(),errors=[];
ws.addEventListener('message',e=>{const d=JSON.parse(e.data);if(d.id){const p=pending.get(d.id);if(p){pending.delete(d.id);d.error?p.reject(d.error):p.resolve(d.result)}}if(d.method==='Runtime.exceptionThrown')errors.push(d.params.exceptionDetails.text);if(d.method==='Log.entryAdded'&&d.params.entry.level==='error')errors.push(d.params.entry.text)});
const send=(method,params={})=>new Promise((resolve,reject)=>{const i=++id;pending.set(i,{resolve,reject});ws.send(JSON.stringify({id:i,method,params}))});
const evaluate=async expression=>{const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value};
const wait=ms=>new Promise(r=>setTimeout(r,ms));
let checks=0;function check(v,message){assert.ok(v,message);checks++}
try{
await send('Page.enable');await send('Page.bringToFront');await send('Runtime.enable');await send('Log.enable');
await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
for(const [width,height] of [[1920,1080],[1600,900],[1440,900],[1366,768],[1280,720],[768,1024],[390,844],[320,700]]){
 await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});
 await send('Page.navigate',{url:base});await wait(200);await evaluate('document.fonts.ready');
 check((await evaluate('document.title')).includes('HENSEG'),'marca');
 check(await evaluate('document.documentElement.scrollWidth<=innerWidth'),`sem overflow ${width}`);
 assert.deepEqual(await evaluate('[...document.querySelectorAll("main>section")].map(e=>e.id)'),['inicio','solucoes','sobre','etapas','contato']);checks++;
 check(await evaluate('document.querySelectorAll("h1").length===1'),'h1 único');
 check(await evaluate(`(()=>{const img=document.querySelector('.brand-logo'),header=document.querySelector('.site-header').getBoundingClientRect(),r=img.getBoundingClientRect();return img.complete&&img.naturalWidth>0&&r.top>=header.top&&r.bottom<=header.bottom&&r.left>=header.left&&r.right<=header.right})()`),`logo carregada sem cortes ${width}`);
 for(const section of ['inicio','solucoes','sobre','contato']){
  await evaluate(`document.querySelector('#${section}').scrollIntoView({behavior:'instant'})`);await wait(90);
  check(await evaluate(`document.querySelector('nav [aria-current]')?.hash==='#${section}'`),`menu ativo ${section} ${width}`);
  if(width>=1024){
   const m=await evaluate(`(()=>{let s=document.querySelector('#${section}'),r=s.getBoundingClientRect();return {height:r.height,screen:innerHeight,over:[...s.querySelectorAll('h1,h2,h3,.button,.text-link,.steps,.auxiliary')].filter(el=>{let b=el.getBoundingClientRect();return b.top<r.top||b.bottom>r.bottom||b.left<0||b.right>innerWidth}).map(e=>e.textContent)}})()`);
   check(Math.abs(m.height-m.screen)<=1,`seção cabe em viewport ${section} ${width}: ${JSON.stringify(m)}`);check(!m.over.length,`conteúdo seguro ${section} ${width}`);
  }
  if(width===1440||width===390){const shot=await send('Page.captureScreenshot',{format:'png'});await writeFile(`${output}/${section}-${width}.png`,Buffer.from(shot.data,'base64'))}
 }

 check(await evaluate(`[...document.querySelectorAll('a[href^="#"]')].every(a=>document.querySelector(a.getAttribute('href')))`),'âncoras válidas');
 if(width===390){await evaluate(`document.querySelector('.menu-toggle').click()`);check(await evaluate(`document.querySelector('.menu-toggle').getAttribute('aria-expanded')==='true'`),'menu abre');await evaluate(`document.querySelector('nav a[href="#sobre"]').click()`);await wait(90);check(await evaluate(`document.querySelector('.menu-toggle').getAttribute('aria-expanded')==='false'`),'menu fecha ao navegar')}
}
// Verify the narrative in reduced motion, then real desktop scroll in both directions.
check(await evaluate(`document.querySelectorAll('.story-moment').length===3&&[...document.querySelectorAll('.story-moment')].every(e=>getComputedStyle(e).position!=='absolute'&&!e.inert)`),'narrativa estática acessível em movimento reduzido');
for(const [width,height] of [[1920,1080],[1600,900],[1440,900],[1366,768],[1280,720],[768,1024],[390,844],[320,700]]) {
 await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});
 await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'no-preference'}]});
 await wait(100);
 await evaluate(`Promise.all([...document.querySelectorAll('.story-image img')].map(img=>{img.loading='eager';return img.decode()}))`);
 check(await evaluate(`new Set([...document.querySelectorAll('.story-image img')].map(e=>e.src)).size===3`),'três imagens distintas');
 if(width>=1024) {
  check(await evaluate(`document.querySelector('.protection-story').offsetHeight===innerHeight*3`),`300vh desktop ${width}`);
  for(const [p,active] of [[0,0],[.5,1],[1,2],[.5,1],[0,0],[.335,0]]) {
   await evaluate(`(()=>{const s=document.querySelector('.protection-story');scrollTo({top:s.offsetTop+(s.offsetHeight-innerHeight)*${p},behavior:'instant'})})()`);await wait(650);
   const values=await evaluate(`[...document.querySelectorAll('.story-moment')].map(e=>Number(e.style.getPropertyValue('--moment-opacity')))`);
   if(p!==.335)check(values[active]>.99,`etapa ${active+1}, progresso ${p}, ${width}: ${values}`);
   else check(values[0]>.2&&values[0]<.8&&values[1]>.2&&values[1]<.8,'crossfade gradual');
   check(await evaluate(`Math.abs(document.querySelector('.story-stage').getBoundingClientRect().top)<2`),'sticky durante narrativa');
   check(await evaluate(`(()=>{const s=document.querySelector('.story-stage').getBoundingClientRect();return [...document.querySelectorAll('.story-moment.is-visible .story-copy')].every(e=>{const r=e.getBoundingClientRect();return r.top>=s.top&&r.bottom<=s.bottom})})()`),`texto seguro ${width}`);
  }
  for(const i of [0,1,2]) {
   await evaluate(`(()=>{const s=document.querySelector('.protection-story');scrollTo({top:s.offsetTop+(s.offsetHeight-innerHeight)*${i/2},behavior:'instant'})})()`);await wait(650);
   if(width===1440){const shot=await send('Page.captureScreenshot',{format:'png'});await writeFile(`${output}/narrativa-${i+1}-${width}.png`,Buffer.from(shot.data,'base64'))}
  }
  await evaluate(`document.querySelector('.story-cta').focus()`);check(await evaluate(`document.activeElement.classList.contains('story-cta')`),'CTA final acessível ao teclado');
  await evaluate(`document.querySelector('.story-cta').click()`);await wait(1000);check(await evaluate(`document.querySelector('nav [aria-current]')?.hash==='#solucoes'`),'CTA final chega a Soluções');
 } else {
  check(await evaluate(`[...document.querySelectorAll('.story-moment')].every(e=>!e.inert&&getComputedStyle(e).position!=='absolute')`),'mobile mantém três momentos em fluxo');
  check(await evaluate(`document.documentElement.scrollWidth<=innerWidth`),`mobile sem overflow ${width}`);
  if(width===390){await evaluate(`document.querySelector('.protection-story').scrollIntoView({behavior:'instant'})`);const shot=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:true,clip:await evaluate(`(()=>{const r=document.querySelector('.protection-story').getBoundingClientRect();return {x:r.left+scrollX,y:r.top+scrollY,width:r.width,height:r.height,scale:1}})()`)});await writeFile(`${output}/narrativa-mobile.png`,Buffer.from(shot.data,'base64'))}
 }
}
await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
await evaluate(`document.querySelector('#contato').scrollIntoView();document.querySelector('#whatsapp-cta').click()`);
check(await evaluate(`!document.querySelector('#contact-status').hidden&&document.activeElement.id==='contact-status'`),'número ausente tem status acessível');
check(await evaluate(`!document.querySelector('#whatsapp-cta').href.includes('wa.me')`),'nenhum número inventado');
// Inject a synthetic number only inside the browser test; never save it to config.
await send('Page.addScriptToEvaluateOnNewDocument',{source:`Object.defineProperty(window,'HENSEC_CONFIG',{configurable:true,set(v){v.whatsappNumber='5511000000000';Object.defineProperty(window,'HENSEC_CONFIG',{value:v,configurable:true})}})`});
await send('Page.navigate',{url:base});await wait(200);
for(const [solution,word] of [['cameras','câmeras'],['alarmes','alarme'],['acesso','acesso']]){
 await evaluate(`document.querySelector('[data-solution="${solution}"]').click()`);
 const href=await evaluate(`document.querySelector('#whatsapp-cta').href`);check(href.startsWith('https://wa.me/5511000000000?text='),'wa.me válido');check(new URL(href).searchParams.get('text').includes(word),'mensagem da solução');
}
await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'no-preference'}]});await send('Page.navigate',{url:base});await wait(100);
await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});await wait(100);
check(await evaluate(`document.getAnimations().every(a=>a.playState!=='running')`),'movimento reduzido interrompe animações');
check(errors.length===0,`console limpo: ${errors.join(',')}`);
for(const path of ['/assets/hensec/hero.webp','/assets/hensec/sobre.webp','/assets/hensec/contato-mensagem.webp','/assets/hensec/solucoes.webp'])check((await fetch(base+path)).ok,`asset ${path}`);
console.log(`${checks} verificações passaram. Capturas em ${output}.`);
}finally{ws.close();await fetch(`http://127.0.0.1:9222/json/close/${target.id}`)}
