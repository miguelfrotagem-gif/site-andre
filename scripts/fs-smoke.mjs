import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {getBudgetUrl,WHATSAPP_PHONE,WHATSAPP_MESSAGE} from '../fs/config.js';
const base=process.env.TEST_URL||'http://127.0.0.1:3000';
const cdp=process.env.CDP_URL||'http://127.0.0.1:9222';
const output='/tmp/fs-checks'; await mkdir(output,{recursive:true});
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
async function key(key,code=key){const windowsVirtualKeyCode={Enter:13,Escape:27,Tab:9}[key]||0;await send('Input.dispatchKeyEvent',{type:'keyDown',key,code,windowsVirtualKeyCode,...(key==='Enter'?{text:'\r'}:{})});await send('Input.dispatchKeyEvent',{type:'keyUp',key,code,windowsVirtualKeyCode});}
async function click(selector){await ev(`document.querySelector(${JSON.stringify(selector)}).scrollIntoView({block:'center',behavior:'instant'})`);const p=await ev(`(()=>{const r=document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()`);await send('Input.dispatchMouseEvent',{type:'mousePressed',...p,button:'left',clickCount:1});await send('Input.dispatchMouseEvent',{type:'mouseReleased',...p,button:'left',clickCount:1});}
async function shot(name,section){const rect=section?await ev(`(()=>{const r=document.getElementById('${section}').getBoundingClientRect();return {x:0,y:r.top+scrollY,width:innerWidth,height:r.height,scale:1}})()`):null;const r=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:true,...(rect?{clip:rect}:{})});await writeFile(`${output}/${name}.png`,Buffer.from(r.data,'base64'));}
const ids=['inicio','sobre','servicos','projetos','contato'];
try{
 await send('Page.enable');await send('Runtime.enable');await send('Network.enable');
 await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
 for(const [width,height] of [[1672,941],[1920,1080],[1440,900],[1366,768],[768,1024],[360,800],[390,844],[430,932],[320,800]]){
  await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<=768});
  await send('Page.navigate',{url:base});await until(`document.querySelector('#contact-title')&&document.readyState==='complete'`,'page load');await ev('document.fonts.ready');
  await ev(`Promise.all([...document.images].map(i=>{i.loading='eager';return i.decode()}))`);await pause(80);
  check(await ev(`document.documentElement.scrollWidth<=innerWidth`),`no horizontal overflow ${width}`);
  check(await ev(`JSON.stringify([...document.querySelectorAll('main>section')].map(s=>s.id))===${JSON.stringify(JSON.stringify(ids))}`),`five ordered sections ${width}`);
  check(await ev(`document.querySelectorAll('header').length===1&&document.querySelectorAll('footer').length===1&&document.querySelectorAll('h1').length===1`),`single header footer and h1 ${width}`);
  check(await ev(`document.fonts.check('800 24px Montserrat')&&[...document.images].every(i=>i.complete&&i.naturalWidth>0)`),`fonts and all photos loaded ${width}`);
  check(await ev(`(()=>{const r=document.querySelector('.brand img').getBoundingClientRect(),h=document.querySelector('header').getBoundingClientRect();return r.top>h.top&&r.bottom<h.bottom&&r.left>=h.left&&r.right<=h.right})()`),`logo fits header ${width}`);
  check(await ev(`[...document.querySelectorAll('a[href^="#"]')].every(a=>a.hash.length>1&&document.getElementById(a.hash.slice(1)))`),`all anchor targets exist ${width}`);
  check(await ev(`[...document.querySelectorAll('[data-budget]')].every(a=>a.getAttribute('href')==='#contato')`),`no invented WhatsApp links ${width}`);
  check(await ev(`[...document.querySelectorAll('.button,.menu-toggle')].filter(e=>e.getClientRects().length).every(e=>e.getBoundingClientRect().height>=44)`),`touch targets at least 44px ${width}`);
  check(await ev(`[...document.querySelectorAll('h1,h2,h3,.button,.card-copy,.gallery figcaption,.copyright')].every(e=>{const r=e.getBoundingClientRect();return r.left>=-.5&&r.right<=innerWidth+.5})`),`text and controls within viewport ${width}`);
  check(await ev(`[...document.querySelectorAll('.card-copy')].every(e=>{const r=e.getBoundingClientRect(),c=e.closest('article').getBoundingClientRect();return r.top>=c.top&&r.bottom<=c.bottom})`),`service captions contained ${width}`);
  for(const id of ids){await ev(`document.getElementById('${id}').scrollIntoView({behavior:'instant'})`);await pause(90);check(await ev(`document.querySelector('#navigation [aria-current]')?.hash==='#${id}'`),`scrollspy ${id} ${width}`);await ev('document.activeElement?.blur()');await shot(`${id}-${width}`,id);}
  await ev('scrollTo({top:document.documentElement.scrollHeight,behavior:"instant"})');await pause(60);check(await ev(`document.querySelector('#navigation [aria-current]').hash==='#contato'`),`footer keeps contact active ${width}`);
  if(width<=900){
   await click('.menu-toggle');check(await ev(`document.querySelector('.menu-toggle').getAttribute('aria-expanded')==='true'&&!document.querySelector('#navigation').hidden&&document.activeElement===document.querySelector('#navigation a')`),`mobile menu focus opens ${width}`);
   await key('Escape');check(await ev(`document.querySelector('#navigation').hidden&&document.activeElement===document.querySelector('.menu-toggle')&&document.activeElement.getAttribute('aria-expanded')==='false'`),`mobile menu Escape returns focus ${width}`);
   await click('.menu-toggle');await key('Tab');await key('Enter');await pause(100);check(await ev(`document.querySelector('#navigation').hidden&&location.hash==='#sobre'&&document.activeElement.id==='sobre'`),`keyboard menu selects about and closes ${width}`);
  }
 }
 // Actual pointer and keyboard interaction with each photo, including native dialog focus.
 for(let index=0;index<3;index++){
  const sel=`.gallery figure:nth-child(${index+1}) button`;await click(sel);await until(`document.querySelector('dialog').open`,'gallery opens');await ev(`document.querySelector('dialog img').decode()`);
  check(await ev(`document.querySelector('dialog img').src===document.querySelector(${JSON.stringify(sel)}).dataset.image.replace(/^/,location.origin+'/')&&document.querySelector('dialog').contains(document.activeElement)`),`photo ${index+1} opens with focus inside`);
  if(index===0)await shot('lightbox-320');
  if(index===1)await click('.lightbox-close');else await key('Escape');
  await until(`!document.querySelector('dialog').open&&document.activeElement===document.querySelector(${JSON.stringify(sel)})`,'dialog closes and focus returns');
  check(await ev(`!document.querySelector('dialog').open&&document.activeElement===document.querySelector(${JSON.stringify(sel)})`),`photo ${index+1} close restores focus`);
 }
 await ev(`document.querySelector('.gallery-open').focus()`);await key('Enter');await until(`document.querySelector('dialog').open`,'keyboard opens dialog');check(await ev(`document.querySelector('dialog').open`),'gallery opens by keyboard');await key('Escape');await until(`!document.querySelector('dialog').open`,'keyboard closes dialog');
 check(await ev(`getComputedStyle(document.querySelector('h1 span')).animationName==='none'&&getComputedStyle(document.documentElement).scrollBehavior==='auto'`),'reduced motion disables animations and smooth scrolling');
 // Mid-transition scrollspy must use the visible section, not a clicked destination.
 await send('Emulation.setDeviceMetricsOverride',{width:1672,height:941,deviceScaleFactor:1,mobile:false});
 for(const id of ids.slice(1)){await ev(`scrollTo({top:document.getElementById('${id}').offsetTop-innerHeight*.32-40,behavior:'instant'})`);await pause(50);const previous=ids[ids.indexOf(id)-1];check(await ev(`document.querySelector('#navigation [aria-current]').hash==='#${previous}'`),`transition before ${id}`);await ev(`scrollBy({top:80,behavior:'instant'})`);await pause(50);check(await ev(`document.querySelector('#navigation [aria-current]').hash==='#${id}'`),`transition into ${id}`);}
 await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'no-preference'}]});await send('Page.navigate',{url:base});await until(`document.querySelector('h1')&&document.readyState==='complete'`,'animated page');await pause(1300);check(await ev(`getComputedStyle(document.querySelector('h1 span')).opacity==='1'`),'hero animation completes');await shot('hero-normal-motion-1672','inicio');
 await send('Emulation.setScriptExecutionDisabled',{value:true});await send('Page.navigate',{url:base});await pause(800);check(await ev(`[...document.querySelectorAll('.reveal')].every(e=>getComputedStyle(e).opacity==='1')`),'content remains visible without JavaScript');
 await send('Emulation.setDeviceMetricsOverride',{width:320,height:800,deviceScaleFactor:1,mobile:true});await pause(100);check(await ev(`!document.querySelector('#navigation').hidden&&getComputedStyle(document.querySelector('#navigation')).display!=='none'`),'navigation remains accessible without JavaScript on mobile');check(await ev(`document.documentElement.scrollWidth<=innerWidth`),'no horizontal overflow without JavaScript on mobile');await shot('no-js-320','inicio');await send('Emulation.setScriptExecutionDisabled',{value:false});
 assert.equal(WHATSAPP_PHONE,'');assert.equal(getBudgetUrl(),'#contato');assert.equal(getBudgetUrl('invalid'),'#contato');passes.push('empty and invalid WhatsApp config use contact');
 assert.equal(decodeURIComponent(new URL(getBudgetUrl('5511999999999')).searchParams.get('text')),WHATSAPP_MESSAGE);passes.push('WhatsApp message encodes and decodes correctly');
 check(errors.length===0,`no browser exceptions: ${errors.join(';')}`);check(failures.length===0,`no failed local assets: ${failures.join(';')}`);
 await writeFile(`${output}/report.json`,JSON.stringify({status:'passed',checks:passes.length,viewports:9,passes,errors,failures},null,2));console.log(`${passes.length} verificações FS passaram em 9 viewports. Capturas: ${output}`);
}catch(error){await writeFile(`${output}/report.json`,JSON.stringify({status:'failed',checks:passes.length,passes,error:String(error),errors,failures},null,2));await shot('failure').catch(()=>{});throw error;}finally{await send('Page.close').catch(()=>{});ws.close();}
