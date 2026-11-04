import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {getBudgetUrl,WHATSAPP_PHONE,WHATSAPP_MESSAGE} from '../fs/config.js';
const base=process.env.TEST_URL||'http://127.0.0.1:3000';
const cdp=process.env.CDP_URL||'http://127.0.0.1:9222';
const output='/tmp/fs-mobile-checks'; await mkdir(output,{recursive:true});
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
const ids=['inicio','sobre','servicos','projetos','contato'];
const viewports=[[320,740],[360,800],[390,844],[430,932],[768,1024],[844,390],[1366,768],[1440,900],[1672,941],[1920,1080]];
async function closed(){await until(`document.querySelector('.header-layer').dataset.menuState==='closed'`,'menu fully closed');}
async function open(){await click('.menu-toggle');await until(`document.querySelector('.header-layer').dataset.menuState==='open'`,'menu open');}
async function jump(id){await ev(`document.getElementById('${id}').scrollIntoView({behavior:'instant'})`);await pause(80);}
async function viewport(width,height){await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<=1100});}
async function load(hash=''){
 await send('Page.navigate',{url:base+'/'+hash});await until(`document.querySelector('#contact-title')&&document.readyState==='complete'`,'page load');await ev('document.fonts.ready');
 await ev(`Promise.all([...document.images].map(i=>{i.loading='eager';return i.decode()}))`);await pause(80);
}
try{
 await send('Page.enable');await send('Page.bringToFront');await send('Runtime.enable');await send('Network.enable');
 await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
 for(const [width,height] of viewports){
  await viewport(width,height);await load();
  const tag=`${width}x${height}`;
  check(await ev(`document.documentElement.scrollWidth<=innerWidth`),`no horizontal overflow ${tag}`);
  check(await ev(`JSON.stringify([...document.querySelectorAll('main>section')].map(s=>s.id))===${JSON.stringify(JSON.stringify(ids))}`),`five ordered sections ${tag}`);
  check(await ev(`document.querySelectorAll('header').length===1&&document.querySelectorAll('footer').length===1&&document.querySelectorAll('nav').length===1&&document.querySelectorAll('h1').length===1`),`single global header nav footer and h1 ${tag}`);
  check(await ev(`document.fonts.check('800 24px Manrope')&&[...document.images].every(i=>i.complete&&i.naturalWidth>0)`),`fonts and photos loaded ${tag}`);
  check(await ev(`(()=>{const r=document.querySelector('.brand img').getBoundingClientRect(),h=document.querySelector('header').getBoundingClientRect();return r.top>h.top&&r.bottom<h.bottom&&r.left>=h.left&&r.right<=h.right})()`),`logo fits header ${tag}`);
  check(await ev(`[...document.querySelectorAll('a[href^="#"]')].every(a=>document.getElementById(a.hash.slice(1)))`),`anchor targets exist ${tag}`);
  check(await ev(`[...document.querySelectorAll('[data-budget],[data-whatsapp]')].every(a=>new URL(a.href).hostname==='wa.me'&&new URL(a.href).pathname==='/559888310153')&&getComputedStyle(document.querySelector('[data-whatsapp]')).backgroundColor==='rgb(37, 211, 102)'&&!document.querySelector('[data-whatsapp]').hasAttribute('aria-disabled')&&document.querySelector('#whatsapp-note').hidden`),`WhatsApp green and all CTAs use confirmed phone ${tag}`);
  if(width>1100)check(await ev(`document.querySelector('.hero-bottom').getBoundingClientRect().top-document.querySelector('.hero-actions').getBoundingClientRect().bottom>=47`),`hero buttons and values separated ${tag}`);
  check(await ev(`[...document.querySelectorAll('.button,.menu-toggle')].filter(e=>e.getClientRects().length).every(e=>e.getBoundingClientRect().height>=44)`),`touch targets >=44px ${tag}`);
  check(await ev(`[...document.querySelectorAll('h1,h2,h3,.button,.card-copy,figcaption,.copyright')].filter(e=>e.getClientRects().length).every(e=>{const r=e.getBoundingClientRect();return r.left>=-.5&&r.right<=innerWidth+.5})`),`text and controls inside viewport ${tag}`);
  if(width<=1100)check(await ev(`(()=>{const b=document.querySelector('.brand').getBoundingClientRect(),c=document.querySelector('.header-cta').getBoundingClientRect(),t=document.querySelector('.menu-toggle').getBoundingClientRect();return b.right<c.left&&c.right<t.left})()`),`mobile header controls never overlap ${tag}`);
  const headerRect=await ev(`JSON.stringify(document.querySelector('header').getBoundingClientRect())`);
  for(const id of ids){
   await jump(id);
   check(await ev(`document.querySelector('#navigation [aria-current]')?.hash==='#${id}'`),`scrollspy ${id} ${tag}`);
   check(await ev(`getComputedStyle(document.querySelector('header')).position==='fixed'&&Math.abs(document.querySelector('header').getBoundingClientRect().top-${JSON.parse(headerRect).top})<1`),`header stays fixed in ${id} ${tag}`);
   if(id!=='inicio')check(await ev(`document.querySelector('#${id} h2').getBoundingClientRect().top>=document.querySelector('header').getBoundingClientRect().bottom`),`anchor title not hidden ${id} ${tag}`);
   await shot(`${id}-${tag}`);
   if(width<=1100){
    const y=await ev('scrollY');const mainTop=await ev(`document.querySelector('main').getBoundingClientRect().top`);
    await open();
    check(await ev(`document.querySelector('.header-layer').getAttribute('aria-modal')==='true'&&document.querySelector('.menu-toggle').getAttribute('aria-label')==='Fechar menu'&&document.activeElement===document.querySelector('#navigation a')&&document.querySelector('main').inert`),`modal semantics focus and inert background ${id} ${tag}`);
    check(await ev(`Math.abs(document.querySelector('main').getBoundingClientRect().top-(${mainTop}))<1`),`opening preserves visual scroll position ${id} ${tag}`);
    check(await ev(`(()=>{const h=document.querySelector('header').getBoundingClientRect(),p=document.querySelector('#menu-panel').getBoundingClientRect();return Math.abs(p.left-h.left)<2&&p.top-h.bottom>=8&&p.top-h.bottom<=12&&p.bottom<=innerHeight-8})()`),`panel aligned and bounded ${id} ${tag}`);
    check(await ev(`[...document.querySelectorAll('#navigation a')].every(a=>a.getBoundingClientRect().height>=52)`),`menu rows >=52px ${id} ${tag}`);
    if(id==='projetos'&&[390,844].includes(width)){await shot(`menu-${tag}`);}
    await key('Escape');await closed();
    check(await ev(`Math.abs(scrollY-${y})<1&&!document.querySelector('main').inert&&!document.body.hasAttribute('data-menu-locked')&&document.activeElement===document.querySelector('.menu-toggle')&&document.querySelector('.menu-backdrop').hidden`),`Escape unlocks restores position and focus ${id} ${tag}`);
   }
  }
  await ev('scrollTo({top:document.documentElement.scrollHeight,behavior:"instant"})');await pause(60);
  check(await ev(`document.querySelector('#navigation [aria-current]').hash==='#contato'&&document.querySelector('header').getBoundingClientRect().top>=0`),`footer keeps header visible and contact active ${tag}`);
  if(width<=1100){
   await open();await click('#navigation a[href="#sobre"]');await closed();await until(`location.hash==='#sobre'&&document.activeElement.id==='sobre'`,'menu anchor navigation');await pause(80);
   check(await ev(`document.querySelector('#sobre').getBoundingClientRect().top>=document.querySelector('header').getBoundingClientRect().bottom`),`menu selection restores scroll then honors anchor offset ${tag}`);
   await open();await click('.menu-toggle');await closed();check(await ev(`document.activeElement===document.querySelector('.menu-toggle')`),`X closes menu ${tag}`);
   await open();const point=await ev(`({x:innerWidth/2,y:innerHeight-4})`);await send('Input.dispatchMouseEvent',{type:'mousePressed',...point,button:'left',clickCount:1});await send('Input.dispatchMouseEvent',{type:'mouseReleased',...point,button:'left',clickCount:1});await closed();check(true,`backdrop click closes ${tag}`);
   await open();await ev(`document.querySelector('.menu-toggle').focus()`);await key('Tab');check(await ev(`document.activeElement===document.querySelector('.brand')`),`Tab wraps within modal ${tag}`);await key('Tab',{shift:true});check(await ev(`document.activeElement===document.querySelector('.menu-toggle')`),`Shift Tab wraps within modal ${tag}`);await key('Escape');await closed();
   if(height<500){await open();await ev(`document.querySelector('#menu-panel').scrollTop=10000`);check(await ev(`(()=>{const c=document.querySelector('.panel-cta').getBoundingClientRect(),p=document.querySelector('#menu-panel').getBoundingClientRect();return c.top>=p.top&&c.bottom<=p.bottom})()`),'landscape panel scroll keeps last CTA reachable');await shot('menu-landscape-bottom');check(await ev(`new URL(document.querySelector('.panel-cta').href).pathname==='/559888310153'`),'landscape last CTA uses confirmed WhatsApp');await key('Escape');await closed();}
  }
 }
 // Repeated interactions must not leave an invisible backdrop, inert main, or scroll lock.
 await viewport(390,844);await load('#projetos');await jump('projetos');
 await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'no-preference'}]});
 await open();await pause(350);await shot('menu-390-animated');const y=await ev(`-parseFloat(document.body.style.top)`);
 await click('.menu-toggle');check(await ev(`document.querySelector('.header-layer').dataset.menuState==='closing'&&!document.querySelector('#menu-panel').hidden`),'closing keeps panel mounted for exit animation');await pause(40);await click('.menu-toggle');await pause(260);check(await ev(`document.querySelector('.header-layer').dataset.menuState==='open'&&document.querySelector('main').inert`),'rapid close then reopen remains functional');await click('.menu-toggle');await closed();check(await ev(`Math.abs(scrollY-${y})<1&&!document.querySelector('main').inert&&document.querySelector('.menu-backdrop').hidden`),'rapid interactions clean up without position shift');
 await open();await viewport(1440,900);await closed();check(await ev(`!document.querySelector('#menu-panel').hidden&&!document.querySelector('main').inert&&!document.body.hasAttribute('data-menu-locked')&&document.querySelector('.menu-backdrop').hidden`),'desktop resize clears modal and scrolling locks');
 // Deep-link reload and browser back/forward retain anchors below the header.
 await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});await load('#servicos');check(await ev(`document.querySelector('#servicos').getBoundingClientRect().top>=document.querySelector('header').getBoundingClientRect().bottom`),'deep link reload honors fixed header');
 await click('#navigation a[href="#contato"]');await pause(100);await ev('history.back()');await until(`location.hash==='#servicos'`,'history back');await pause(100);check(await ev(`document.querySelector('#navigation [aria-current]').hash==='#servicos'`),'browser back restores section');
 // All gallery photos remain keyboard and pointer accessible.
 await viewport(390,844);
 for(let i=0;i<3;i++){
  const selector=`.gallery figure:nth-child(${i+1}) button`;await click(selector);await until(`document.querySelector('.lightbox').open`,'lightbox');await ev(`document.querySelector('.lightbox img').decode()`);check(await ev(`document.querySelector('.lightbox').contains(document.activeElement)`),`gallery photo ${i+1} receives modal focus`);
  if(i===0)await shot('gallery-390');
  if(i===1)await click('.lightbox-close');else await key('Escape');await until(`!document.querySelector('.lightbox').open&&document.activeElement===document.querySelector(${JSON.stringify(selector)})`,'lightbox close');check(true,`gallery photo ${i+1} restores focus`);
 }
 // Text-only enlargement is emulated by doubling content font sizes, not scaling the page.
 await load();await ev(`document.querySelectorAll('main p,main h1,main h2,main h3').forEach(e=>e.style.fontSize=parseFloat(getComputedStyle(e).fontSize)*2+'px')`);await pause(100);check(await ev(`document.documentElement.scrollWidth<=innerWidth`),'200% content text has no horizontal overflow');await jump('servicos');await shot('text-200-percent-390');
 await load();check(await ev(`getComputedStyle(document.querySelector('h1 span')).animationName==='none'&&getComputedStyle(document.documentElement).scrollBehavior==='auto'`),'reduced motion disables animation and smooth scroll');
 await open();await shot('menu-390-reduced-motion');await key('Escape');await closed();
 // JavaScript disabled: all section content and navigation stay available in normal flow.
 await send('Emulation.setScriptExecutionDisabled',{value:true});await load();check(await ev(`[...document.querySelectorAll('.reveal')].every(e=>getComputedStyle(e).opacity==='1')&&!document.querySelector('#menu-panel').hidden`),'content and navigation remain available without JavaScript');await send('Emulation.setScriptExecutionDisabled',{value:false});
 assert.equal(WHATSAPP_PHONE,'559888310153');assert.equal(new URL(getBudgetUrl()).pathname,'/559888310153');assert.equal(getBudgetUrl(''),'#contato');assert.equal(getBudgetUrl('invalid'),'#contato');assert.equal(new URL(getBudgetUrl('5511999999999')).searchParams.get('text'),WHATSAPP_MESSAGE);check(true,'centralized WhatsApp config encodes confirmed destination and rejects missing number');check(await ev(`![...document.querySelectorAll('p')].some(p=>p.textContent.includes('Imagens ilustrativas'))`),'illustrative notices removed while photo captions remain');
 check(errors.length===0,`no browser exceptions: ${errors.join(';')}`);check(failures.length===0,`no failed local assets: ${failures.join(';')}`);
 await writeFile(`${output}/report.json`,JSON.stringify({status:'passed',checks:passes.length,viewports,passes,errors,failures},null,2));console.log(`${passes.length} verificações FS passaram em ${viewports.length} viewports. Capturas: ${output}`);
}catch(error){await writeFile(`${output}/report.json`,JSON.stringify({status:'failed',checks:passes.length,passes,error:String(error),errors,failures},null,2));await shot('failure').catch(()=>{});throw error;}finally{await send('Page.close').catch(()=>{});ws.close();}
