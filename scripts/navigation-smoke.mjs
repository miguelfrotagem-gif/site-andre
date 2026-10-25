import assert from 'node:assert/strict';
const base=process.env.TEST_URL||'http://127.0.0.1:3000/hensec.html';
const target=await(await fetch('http://127.0.0.1:9222/json/new?about:blank',{method:'PUT'})).json();
const ws=new WebSocket(target.webSocketDebuggerUrl);await new Promise(r=>ws.addEventListener('open',r,{once:true}));
let sequence=0,checks=0;const pending=new Map(),errors=[];
ws.addEventListener('message',event=>{const d=JSON.parse(event.data);if(d.id){const p=pending.get(d.id);if(p){pending.delete(d.id);d.error?p.reject(d.error):p.resolve(d.result)}}if(d.method==='Runtime.exceptionThrown')errors.push(d.params.exceptionDetails.text)});
const send=(method,params={})=>new Promise((resolve,reject)=>{const id=++sequence;pending.set(id,{resolve,reject});ws.send(JSON.stringify({id,method,params}))});
const evaluate=async expression=>{const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value};
const wait=ms=>new Promise(r=>setTimeout(r,ms));
function check(value,message){assert.ok(value,message);checks++;}
const current=()=>evaluate(`document.querySelector('#navigation [aria-current="location"]')?.hash`);
const selected=()=>evaluate(`document.querySelectorAll('#navigation [aria-current="location"]').length`);
async function clickNav(id){
 if(await evaluate(`getComputedStyle(document.querySelector('.menu-toggle')).display!=='none'`))await evaluate(`document.querySelector('.menu-toggle').click()`);
 await evaluate(`document.querySelector('#navigation a:not(.mobile-nav)[href="#${id}"]').click()`);
}
try{
 await send('Page.enable');await send('Page.bringToFront');await send('Runtime.enable');
 for(const [width,height] of [[1440,900],[1280,720]]){
  await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});
  await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'no-preference'}]});
  await send('Page.navigate',{url:base});await wait(300);await evaluate('document.fonts.ready');
  await evaluate(`(()=>{const n=document.querySelector('#cookie-notice');if(!n.hidden)n.querySelector('[data-confirm-privacy]').click()})()`);
  for(const id of ['contato','solucoes','tecnologias','sobre','inicio','contato']){
   await clickNav(id);await wait(60);
   check(await current()===`#${id}`,`destino destacado durante a rolagem ${id} ${width}`);
   await wait(1450);
   check(await current()===`#${id}`,`destino correto após a rolagem ${id} ${width}`);
   check(await selected()===1,`uma seção ativa ${id} ${width}`);
  }
  if(width>=1024){
   const rect=await evaluate(`(()=>{const r=document.querySelector('#navigation a:not(.mobile-nav)[href="#solucoes"]').getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()`);
   await send('Input.dispatchMouseEvent',{type:'mouseMoved',x:rect.x,y:rect.y});await wait(300);
   check(await current()==='#contato','hover não altera Contato');
   check(await evaluate(`getComputedStyle(document.querySelector('#navigation a:not(.mobile-nav)[href="#solucoes"]'),'::after').transform==='matrix(0, 0, 0, 1, 0, 0)'`),'Soluções sem sublinhado falso por hover');
  }
  // Native manual movement, including upward travel from contact.
  for(const [id,hash] of [['sobre','sobre'],['solucoes','solucoes'],['tecnologias','tecnologias'],['contato','contato']]){
   await evaluate(`document.querySelector('#${id}').scrollIntoView({behavior:'instant'})`);await wait(100);
   check(await current()===`#${hash}`,`rolagem manual reversível ${id} ${width}`);
  }
  await evaluate(`scrollTo({top:document.documentElement.scrollHeight,behavior:'instant'})`);await wait(100);
  check(await current()==='#contato','rodapé mantém Contato');
  // A content resize shifts Contact while it stays in the viewport: no scroll event is required.
  await evaluate(`(()=>{const c=document.querySelector('#contato');c.scrollIntoView({behavior:'instant'});window.oldHeight=document.querySelector('.m-faq').style.minHeight;document.querySelector('.m-faq').style.minHeight='200svh'})()`);await wait(140);
  const expected=await evaluate(`(()=>{const top=document.querySelector('.site-header').getBoundingClientRect().bottom+12;const candidates=[...document.querySelectorAll('main>section')].map(s=>{const r=s.getBoundingClientRect();return {s,n:Math.max(0,Math.min(innerHeight,r.bottom)-Math.max(top,r.top))}}).sort((a,b)=>b.n-a.n);const s=candidates[0].s;return '#'+(s.dataset.desktopNav||s.dataset.navSection||s.id)})()`);
  check(await current()===expected,`recalcula após mudança de altura ${width}`);
  await evaluate(`document.querySelector('.m-faq').style.minHeight=window.oldHeight`);await wait(100);
  // Interrupt a jump using actual wheel input; target selection must not get stuck.
  await evaluate(`document.querySelector('#inicio').scrollIntoView({behavior:'instant'})`);await wait(100);
  await clickNav('contato');await wait(80);
  await send('Input.dispatchMouseEvent',{type:'mouseWheel',x:width/2,y:height/2,deltaX:0,deltaY:-120});await wait(250);
  await evaluate(`document.querySelector('#solucoes').scrollIntoView({behavior:'instant'})`);await wait(140);
  const interrupted=await current();
  // Wheel inertia may continue after an instant programmatic jump. Check the
  // actual visible section independently using the center of the usable viewport.
  const visibleAfterInterrupt=await evaluate(`(()=>{const header=document.querySelector('.site-header').getBoundingClientRect();const section=document.elementFromPoint(innerWidth/2,(header.bottom+12+innerHeight)/2)?.closest('main>section');return section?'#'+(section.dataset.desktopNav||section.dataset.navSection||section.id):null})()`);
  check(interrupted!=='#contato'&&interrupted===visibleAfterInterrupt,`interrupção acompanha a seção visível ${width}`);
  await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
  await clickNav('contato');await wait(140);
  check(await current()==='#contato',`Contato com movimento reduzido ${width}`);
 }
 check(errors.length===0,`console limpo: ${errors.join(',')}`);
 console.log(`${checks} verificações de navegação passaram.`);
}finally{ws.close();await fetch(`http://127.0.0.1:9222/json/close/${target.id}`)}
