import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
const base=process.env.TEST_URL||'http://127.0.0.1:3000/hensec.html';
const output='/tmp/henseg-mobile-checks';await mkdir(output,{recursive:true});
const t=await(await fetch('http://127.0.0.1:9222/json/new?about:blank',{method:'PUT'})).json();
const ws=new WebSocket(t.webSocketDebuggerUrl);await new Promise(r=>ws.addEventListener('open',r,{once:true}));
let n=0,count=0;const pending=new Map(),errors=[],external=[];
ws.onmessage=e=>{const d=JSON.parse(e.data);if(d.id){const p=pending.get(d.id);pending.delete(d.id);d.error?p?.reject(d.error):p?.resolve(d.result)}if(d.method==='Runtime.exceptionThrown')errors.push(d.params.exceptionDetails.text);if(d.method==='Log.entryAdded'&&d.params.entry.level==='error')errors.push(d.params.entry.text);if(d.method==='Network.requestWillBeSent'&&/^https?:/.test(d.params.request.url)&&!d.params.request.url.startsWith(new URL(base).origin))external.push(d.params.request.url)};
const send=(method,params={})=>new Promise((resolve,reject)=>{pending.set(++n,{resolve,reject});ws.send(JSON.stringify({id:n,method,params}))});
const ev=async expression=>{const r=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value};
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const check=(v,msg)=>{assert.ok(v,msg);count++};
const active=()=>ev(`document.querySelector('#navigation [aria-current="location"]')?.hash`);
const ids=['inicio','solucoes','alarmes','cameras','cerca','interfone','facial','sobre','etapas','duvidas','instagram','contato'];
const products=['alarmes','cameras','cerca','interfone','facial'];
async function jump(id){await ev(`document.querySelector('#${id}').scrollIntoView({behavior:'instant'})`);await wait(80);}
async function key(key,code){await send('Input.dispatchKeyEvent',{type:'keyDown',key,code:key,windowsVirtualKeyCode:code,nativeVirtualKeyCode:code,...(key==='Enter'?{text:'\r',unmodifiedText:'\r'}:{})});await send('Input.dispatchKeyEvent',{type:'keyUp',key,code:key,windowsVirtualKeyCode:code,nativeVirtualKeyCode:code});}
try {
 await send('Page.enable');await send('Page.bringToFront');await send('Runtime.enable');await send('Log.enable');await send('Network.enable');
 await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
 for(const [width,height] of [[360,800],[375,667],[390,844],[414,896],[430,932],[390,568],[740,360],[844,390],[320,700]]){
  await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:true});
  await send('Page.navigate',{url:base});await wait(220);await ev('document.fonts.ready');
  await ev(`document.querySelector('#cookie-notice [data-confirm-privacy]').click()`);
  await ev(`Promise.all([...document.querySelectorAll('.mobile-section img')].map(i=>{i.loading='eager';return i.decode()}))`);
  assert.deepEqual(await ev(`[...document.querySelectorAll('main>section')].filter(e=>e.getClientRects().length).map(e=>e.id)`),ids.map(id=>id));count++;
  assert.deepEqual(await ev(`[...document.querySelectorAll('.m-solution-list>a')].map(e=>e.hash)`),products.map(id=>'#'+id));count++;
  assert.deepEqual(await ev(`[...document.querySelectorAll('#navigation .mobile-nav')].map(e=>e.hash)`),['#inicio','#solucoes','#tecnologias','#sobre','#contato']);count++;
  check(await ev(`document.documentElement.scrollWidth<=innerWidth`),`sem overflow ${width}x${height}`);
  check(await ev(`[...document.querySelectorAll('h1')].filter(e=>e.getClientRects().length).length===1`),'um título principal visível');
  check(await ev(`document.querySelectorAll('.site-header').length===1&&document.querySelectorAll('.site-header .brand img').length===1&&!document.querySelector('.brand-wordmark')`),'um cabeçalho e marca sem repetição');
  check(await ev(`[...document.querySelectorAll('.m-product img')].filter(i=>i.getClientRects().length).every(i=>{const r=i.getBoundingClientRect();return i.complete&&i.naturalWidth&&r.width<=i.naturalWidth+1&&r.height<=i.naturalHeight+1&&getComputedStyle(i).objectFit==='contain'&&Math.abs(r.width/r.height-i.naturalWidth/i.naturalHeight)<.03})`),`produtos completos, proporção e resolução ${width}`);
  check(await ev(`[...document.querySelectorAll('.mobile-section .m-button')].every(a=>{const r=a.getBoundingClientRect();return r.height>=52&&r.left>=0&&r.right<=innerWidth+1&&(!a.href||a.hash||new URL(a.href).pathname==='/5511945549849')})`),`botões confortáveis e contato real ${width}`);
  for(const id of ids){
   await jump(id);
   check(await active()===`#${products.includes(id)?'tecnologias':id==='etapas'?'sobre':(id==='duvidas'||id==='instagram')?'contato':id}`,`seção ativa ${id} ${width}`);
   check(await ev(`(()=>{const s=document.querySelector('#${id}'),r=s.getBoundingClientRect();return [...s.querySelectorAll('h1,h2,h3,a,input,select,button,summary')].every(e=>{const b=e.getBoundingClientRect();return !b.width||(b.left>=r.left-1&&b.right<=r.right+1&&b.top>=r.top-1&&b.bottom<=r.bottom+1)})})()`),`conteúdo contido sem cortes ${id} ${width}`);
   if(width===390&&height===844){const shot=await send('Page.captureScreenshot',{format:'png'});await writeFile(`${output}/${id}-390.png`,Buffer.from(shot.data,'base64'));}
   check(await ev(`(()=>{const f=document.querySelector('.floating-contact');if(getComputedStyle(f).visibility==='hidden')return true;const r=f.getBoundingClientRect();return [...document.querySelectorAll('.mobile-section .m-button,.contact-whatsapp-panel,.contact-auxiliary,.mobile-footer,.instagram-profile-card,.m-solution-link,.m-faq-item summary')].every(e=>{const b=e.getBoundingClientRect();return !b.width||b.bottom<=r.top||b.top>=r.bottom||b.right<=r.left||b.left>=r.right})})()`),`flutuante sem sobreposição ${id} ${width}`);
  }
  await ev(`document.querySelector('.menu-toggle').click()`);
  check(await ev(`document.querySelector('.menu-toggle').getAttribute('aria-expanded')==='true'`),'menu abre');
  await ev(`document.querySelector('#navigation a[href="#tecnologias"]').click()`);await wait(100);
  check(await ev(`document.querySelector('.menu-toggle').getAttribute('aria-expanded')==='false'&&document.activeElement.id==='tecnologias'`),'menu fecha e foco vai ao destino');
  check(await active()==='#tecnologias','categoria correta após menu');
  await jump('contato');
  check(await ev(`document.querySelectorAll('form,input,select,textarea').length===0&&document.querySelector('.contact-whatsapp-button').getBoundingClientRect().height>=56`),'contato sem formulário e com ação confortável');
 }
 // Keyboard menu controls and native FAQ disclosure.
 await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});await wait(100);
 await ev(`document.querySelector('.menu-toggle').focus()`);await key('Enter',13);check(await ev(`document.querySelector('.menu-toggle').getAttribute('aria-expanded')==='true'`),'menu abre por Enter');
 await key('Escape',27);check(await ev(`document.querySelector('.menu-toggle').getAttribute('aria-expanded')==='false'&&document.activeElement.classList.contains('menu-toggle')`),'Escape fecha e preserva foco');
 await jump('duvidas');await ev(`document.querySelector('.m-faq-item[open]').open=false;document.querySelector('.m-faq-item summary').focus()`);await key('Enter',13);
 check(await ev(`document.querySelector('.m-faq-item').open`),'FAQ abre por teclado');
 await ev(`document.querySelectorAll('.m-faq-item')[1].open=true`);check(await ev(`document.querySelectorAll('.m-faq-item[open]').length===1`),'respostas não se sobrepõem');
 // Contact is a direct WhatsApp action, without collecting visitor data.
 await jump('contato');
 check(await ev(`document.querySelectorAll('form').length===0&&document.querySelector('.contact-whatsapp-panel h3').textContent==='Vamos conversar?'`),'contato direto sem formulário');
 check(await ev(`(()=>{const a=document.querySelector('.contact-whatsapp-button'),u=new URL(a.href);return u.hostname==='wa.me'&&u.pathname==='/5511945549849'&&u.searchParams.get('text').includes('uma solução de segurança')&&a.target==='_blank'&&a.rel.includes('noopener')})()`),'WhatsApp oficial e mensagem revisável');
 check(await ev(`document.querySelector('.contact-auxiliary a').hash==='#duvidas'&&document.querySelector('.contact-auxiliary [data-contact-link="projeto"]').href.includes('/5511945549849?text=')`),'dúvidas e projeto com destinos reais');
 // Text resizing grows the layout naturally; mobile has no sticky product sections.
 await ev(`document.querySelectorAll('.mobile-section,.mobile-footer').forEach(s=>s.querySelectorAll('*').forEach(e=>{const size=parseFloat(getComputedStyle(e).fontSize);e.style.fontSize=(size*1.5)+'px'}))`);await wait(150);
 check(await ev(`document.documentElement.scrollWidth<=innerWidth`),'texto a 150% sem overflow');
 check(await ev(`[...document.querySelectorAll('.m-product,.m-photo')].every(e=>!['sticky','fixed'].includes(getComputedStyle(e).position)&&getComputedStyle(e).overflowY!=='scroll'&&getComputedStyle(e).overflowY!=='auto')`),'produtos em fluxo sem scroll interno');
 // Motion allowed and manual interruption: no stale active item.
 await send('Page.navigate',{url:base});await wait(200);await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'no-preference'}]});
 await ev(`document.querySelector('#navigation a[href="#contato"]').click()`);await wait(60);check(await active()==='#contato','destino destacado durante animação');await wait(1500);check(await active()==='#contato','Contato correto após animação');
 await jump('inicio');await ev(`document.querySelector('#navigation a[href="#contato"]').click()`);await wait(80);await send('Input.dispatchMouseEvent',{type:'mouseWheel',x:180,y:450,deltaX:0,deltaY:-100});await wait(150);await jump('solucoes');check(await active()==='#solucoes','interrupção libera destino anterior');
 await jump('contato');await ev(`document.querySelector('.mobile-footer [data-open-privacy]').click()`);check(await ev(`document.querySelector('#privacy-dialog').open`),'cookies funcionam no rodapé mobile');await key('Escape',27);check(await ev(`!document.querySelector('#privacy-dialog').open&&document.activeElement.closest('.mobile-footer')!==null`),'cookies devolvem foco ao rodapé visível');
 check(external.length===0,`nenhum envio externo automático: ${external.join(',')}`);check(errors.length===0,`console limpo: ${errors.join(',')}`);
 console.log(`${count} verificações mobile passaram. Capturas em ${output}.`);
} finally {ws.close();await fetch(`http://127.0.0.1:9222/json/close/${t.id}`);}
