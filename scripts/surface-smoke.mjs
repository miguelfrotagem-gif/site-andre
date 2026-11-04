import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {getBudgetUrl,WHATSAPP_PHONE,WHATSAPP_MESSAGE} from '../fs/config.js';
const base=process.env.TEST_URL||'http://127.0.0.1:3000';
const cdp=process.env.CDP_URL||'http://127.0.0.1:9222';
const output='/tmp/fs-surface-checks'; await mkdir(output,{recursive:true});
const target=await(await fetch(`${cdp}/json/new?about:blank`,{method:'PUT'})).json();
const ws=new WebSocket(target.webSocketDebuggerUrl);
await new Promise((resolve,reject)=>{ws.addEventListener('open',resolve,{once:true});ws.addEventListener('error',reject,{once:true});});
let seq=0;const pending=new Map(),errors=[],failures=[],passes=[];
ws.addEventListener('message',event=>{const data=JSON.parse(event.data);if(data.id){const p=pending.get(data.id);if(p){pending.delete(data.id);clearTimeout(p.timer);data.error?p.reject(Error(JSON.stringify(data.error))):p.resolve(data.result);}}if(data.method==='Runtime.exceptionThrown')errors.push(data.params.exceptionDetails.exception?.description||data.params.exceptionDetails.text);if(data.method==='Network.responseReceived'&&data.params.response.url.startsWith(base)&&data.params.response.status>=400)failures.push(data.params.response.url);});
function send(method,params={}){return new Promise((resolve,reject)=>{const id=++seq;const timer=setTimeout(()=>reject(Error(`CDP timeout: ${method}`)),20000);pending.set(id,{resolve,reject,timer});ws.send(JSON.stringify({id,method,params}));});}
async function ev(expression){const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description||JSON.stringify(r.exceptionDetails));return r.result.value;}
const pause=ms=>new Promise(r=>setTimeout(r,ms));
function check(value,label){assert.ok(value,label);passes.push(label);}
async function until(expression,label){for(let i=0;i<100;i++){if(await ev(expression))return;await pause(40);}throw Error(`Timeout: ${label}`);}
async function key(key, {shift=false}={}){const windowsVirtualKeyCode={Enter:13,Escape:27,Tab:9}[key]||0;const params={key,code:key,windowsVirtualKeyCode,modifiers:shift?8:0};await send('Input.dispatchKeyEvent',{type:'keyDown',...params,...(key==='Enter'?{text:'\r'}:{})});await send('Input.dispatchKeyEvent',{type:'keyUp',...params});}
async function click(selector){await ev(`(()=>{const e=document.querySelector(${JSON.stringify(selector)});if(!e.closest('.site-header'))e.scrollIntoView({block:'center',behavior:'instant'});else if(e.closest('.menu-panel'))e.scrollIntoView({block:'nearest',behavior:'instant'})})()`);const p=await ev(`(()=>{const r=document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()`);await send('Input.dispatchMouseEvent',{type:'mousePressed',...p,button:'left',clickCount:1});await send('Input.dispatchMouseEvent',{type:'mouseReleased',...p,button:'left',clickCount:1});}
async function shot(name){const r=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});await writeFile(`${output}/${name}.png`,Buffer.from(r.data,'base64'));}

const states=['estrutura','operacao','detalhes'];
const texts={estrutura:'Conheça a estrutura que acompanha o trabalho em campo.',operacao:'Veja uma representação do percurso da perfuração.',detalhes:'Observe os detalhes que fazem parte de cada etapa.'};
async function load(width,height,motion='reduce'){
 await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<=1100});
 await send('Emulation.setTouchEmulationEnabled',{enabled:width<=1100});
 await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:motion}]});
 await send('Page.navigate',{url:base});await until(`document.readyState==='complete'&&document.querySelector('.surface-experience')?.dataset.enhanced==='true'`,'cutaway initialized');await ev('document.fonts.ready');await ev(`Promise.all([...document.images].map(i=>{i.loading='eager';return i.decode()}))`);
}
async function scrollSurface(){await ev(`document.querySelector('.surface-experience').scrollIntoView({behavior:'instant'})`);await pause(80);}
async function componentShot(name){await scrollSurface();const clip=await ev(`(()=>{const r=document.querySelector('.surface-experience').getBoundingClientRect();return {x:0,y:r.top+scrollY,width:innerWidth,height:r.height,scale:1}})()`);const r=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:true,clip});await writeFile(`${output}/${name}.png`,Buffer.from(r.data,'base64'));}
async function assertState(state,label){
 check(await ev(`document.querySelector('.surface-experience').dataset.state==='${state}'&&document.querySelectorAll('.surface-tabs [aria-selected="true"]').length===1&&document.querySelector('#surface-tab-${state}').getAttribute('aria-selected')==='true'&&document.querySelectorAll('.surface-hotspot[aria-pressed="true"]').length===1&&document.querySelector('.surface-hotspot[data-surface-state="${state}"]').getAttribute('aria-pressed')==='true'`),`selection and markers synchronized ${label}`);
 check(await ev(`document.querySelector('.surface-info-text').textContent===${JSON.stringify(texts[state])}&&document.querySelector('.surface-info').getAttribute('aria-labelledby')==='surface-tab-${state}'&&document.querySelectorAll('.surface-info').length===1`),`single explanatory panel updates ${label}`);
 const focus={estrutura:'.surface-machine-focus',operacao:'.surface-operation-focus',detalhes:'.surface-lens'}[state];
 check(await ev(`Number(getComputedStyle(document.querySelector('${focus}')).opacity)>.98`),`distinct visible scene focus ${label}`);
 check(await ev(`Number(getComputedStyle(document.querySelector('.surface-focus-guide--${state}')).opacity)>.98`),`gold guide follows selected state ${label}`);
}
try{
 await send('Page.enable');await send('Page.bringToFront');await send('Runtime.enable');await send('Network.enable');
 for(const [width,height] of [[320,740],[360,800],[390,844],[430,932],[768,1024],[844,390],[1366,768],[1672,941],[1900,650],[1920,1080]]){
  await load(width,height);await scrollSurface();const tag=`${width}x${height}`;
  check(await ev(`document.documentElement.scrollWidth<=innerWidth`),`no overflow ${tag}`);
  check(await ev(`document.querySelector('#por-baixo').previousElementSibling.id==='servicos'&&document.querySelector('#por-baixo').nextElementSibling.id==='projetos'&&document.querySelectorAll('header').length===1&&document.querySelectorAll('#navigation a').length===5`),`integration preserves section order and single header ${tag}`);
  check(await ev(`document.querySelector('#navigation [aria-current]').hash==='#servicos'`),`cutaway belongs to services context ${tag}`);
  check(await ev(`document.querySelector('#surface-title').getBoundingClientRect().top>=document.querySelector('header').getBoundingClientRect().bottom`),`heading anchor honors header ${tag}`);
  check(await ev(`[...document.querySelectorAll('.surface-tabs button,.surface-hotspot,.surface-cta')].every(e=>{const r=e.getBoundingClientRect();return r.height>=44&&r.width>=44&&r.left>=0&&r.right<=innerWidth})`),`touch controls sized and in bounds ${tag}`);
  check(await ev(`[...document.querySelectorAll('.surface-hotspot')].every(e=>{const r=e.getBoundingClientRect(),s=document.querySelector('.surface-scene').getBoundingClientRect();return r.left>=s.left&&r.right<=s.right&&r.top>=s.top&&r.bottom<=s.bottom})`),`markers stay inside scene ${tag}`);
  check(await ev(`document.querySelector('.surface-disclaimer').textContent==='Representação ilustrativa.'&&new URL(document.querySelector('.surface-cta').href).pathname==='/559888310153'`),`illustration label and real WhatsApp destination ${tag}`);
  check(await ev(`document.querySelector('.surface-experience').dataset.introDone==='true'&&!document.querySelector('.surface-experience').classList.contains('surface-introducing')`),`reduced motion immediately displays complete scene ${tag}`);
  const original=await ev(`({scene:document.querySelector('.surface-scene').getBoundingClientRect().height,section:document.querySelector('.surface-experience').getBoundingClientRect().height})`);
  await assertState('estrutura',`initial ${tag}`);
  if([390,1672,1900].includes(width))await componentShot(`initial-${tag}`);
  for(const state of ['operacao','detalhes','estrutura']){
   await click(`#surface-tab-${state}`);await assertState(state,`${state} ${tag}`);
   check(await ev(`Math.abs(document.querySelector('.surface-scene').getBoundingClientRect().height-${original.scene})<.5&&Math.abs(document.querySelector('.surface-experience').getBoundingClientRect().height-${original.section})<.5`),`state change preserves geometry ${state} ${tag}`);
   if(state==='operacao'&&[390,1672,1900].includes(width))await componentShot(`operation-${tag}`);
   if(state==='detalhes'&&[390,1672].includes(width))await componentShot(`details-${tag}`);
  }
  await click('.surface-hotspot--detalhes');await assertState('detalhes',`point ${tag}`);
  await ev(`document.querySelector('#surface-tab-estrutura').focus()`);await key('ArrowRight');await assertState('operacao',`keyboard right ${tag}`);check(await ev(`document.activeElement.id==='surface-tab-operacao'`),`keyboard focus follows selection ${tag}`);await key('End');await assertState('detalhes',`keyboard end ${tag}`);await key('Home');await assertState('estrutura',`keyboard home ${tag}`);
  if(width<=1100){
   await ev(`document.querySelector('.surface-scene').scrollIntoView({behavior:'instant'})`);const point=await ev(`(()=>{const r=document.querySelector('.surface-hotspot--operacao').getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()`);
   // Scroll to the button if the portrait scene exceeds a short landscape viewport.
   await ev(`document.querySelector('.surface-hotspot--operacao').scrollIntoView({behavior:'instant',block:'center'})`);const actual=await ev(`(()=>{const r=document.querySelector('.surface-hotspot--operacao').getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()`);
   await send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[actual]});await send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await assertState('operacao',`touch ${tag}`);
  }
  await ev(`document.querySelector('.surface-cta').scrollIntoView({behavior:'instant',block:'center'})`);check(await ev(`(()=>{const r=document.querySelector('.surface-cta').getBoundingClientRect();return r.top>=document.querySelector('header').getBoundingClientRect().bottom&&r.bottom<=innerHeight})()`),`final CTA remains reachable ${tag}`);
 }
 // User action cancels the introduction and no later step overrides their choice.
 await load(390,844,'no-preference');await scrollSurface();await ev(`document.querySelector('.surface-strata').scrollIntoView({behavior:'instant',block:'center'})`);await until(`document.querySelector('.surface-experience').classList.contains('surface-introducing')`,'introduction begins');
 await ev(`document.querySelector('.surface-hotspot--operacao').click()`);check(await ev(`document.querySelector('.surface-experience').dataset.introDone==='true'&&!document.querySelector('.surface-experience').classList.contains('surface-introducing')`),'early input takes priority over introduction');await pause(1100);await assertState('operacao','after introduction cancellation');
 await ev('scrollTo({top:0,behavior:"instant"})');await scrollSurface();check(await ev(`!document.querySelector('.surface-experience').classList.contains('surface-introducing')`),'returning never repeats the introduction');
 // A fresh normal-motion introduction completes once; leaving early finishes it offscreen.
 await load(390,844,'no-preference');await scrollSurface();await ev(`document.querySelector('.surface-strata').scrollIntoView({behavior:'instant',block:'center'})`);await until(`document.querySelector('.surface-experience').dataset.introDone==='true'`,'introduction completes');check(await ev(`!document.querySelector('.surface-experience').classList.contains('surface-introducing')`),'normal introduction completes without hidden layers');await componentShot('initial-normal-motion-390');
 await load(390,844,'no-preference');await scrollSurface();await ev(`document.querySelector('.surface-strata').scrollIntoView({behavior:'instant',block:'center'})`);await pause(40);await ev('scrollTo({top:0,behavior:"instant"})');await pause(100);check(await ev(`document.querySelector('.surface-experience').dataset.introDone==='true'`),'leaving during introduction stops offscreen animation');
 // Resize one explored scene through all layouts, without replacing its state.
 await scrollSurface();await ev(`document.querySelector('#surface-tab-detalhes').click()`);
 for(const [width,height] of [[1672,941],[1900,650],[390,844],[320,740]]){
  await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<=1100});await pause(120);check(await ev(`document.querySelector('.surface-experience').dataset.state==='detalhes'&&document.documentElement.scrollWidth<=innerWidth`),`resizing preserves explored state ${width}`);
 }
 // With scripting disabled the original illustration and all three concepts remain readable.
 await send('Emulation.setScriptExecutionDisabled',{value:true});await send('Page.navigate',{url:base});await pause(600);check(await ev(`document.querySelector('.surface-fallback')?.getBoundingClientRect().height>0&&getComputedStyle(document.querySelector('.surface-strata')).clipPath==='none'`),'no-JavaScript fallback keeps complete illustration and explanations');await send('Emulation.setScriptExecutionDisabled',{value:false});
 check(errors.length===0,`no browser errors: ${errors.join(';')}`);check(failures.length===0,`no local asset failures: ${failures.join(';')}`);
 await writeFile(`${output}/report.json`,JSON.stringify({status:'passed',checks:passes.length,passes,errors,failures},null,2));console.log(`${passes.length} verificações da experiência passaram. Capturas: ${output}`);
}catch(error){await writeFile(`${output}/report.json`,JSON.stringify({status:'failed',checks:passes.length,passes,error:String(error),errors,failures},null,2));await shot('failure').catch(()=>{});throw error;}finally{await send('Page.close').catch(()=>{});ws.close();}
