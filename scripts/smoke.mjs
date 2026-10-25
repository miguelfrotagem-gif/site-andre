import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
const base=process.env.TEST_URL||'http://127.0.0.1:3000/hensec.html';
const output='/tmp/henseg-desktop-checks';await mkdir(output,{recursive:true});
const t=await(await fetch('http://127.0.0.1:9222/json/new?about:blank',{method:'PUT'})).json();
const ws=new WebSocket(t.webSocketDebuggerUrl);await new Promise(r=>ws.addEventListener('open',r,{once:true}));
let n=0,count=0;const pending=new Map(),errors=[],external=[];
ws.onmessage=e=>{const d=JSON.parse(e.data);if(d.id){const p=pending.get(d.id);pending.delete(d.id);d.error?p?.reject(d.error):p?.resolve(d.result)}if(d.method==='Runtime.exceptionThrown')errors.push(d.params.exceptionDetails.text);if(d.method==='Log.entryAdded'&&d.params.entry.level==='error')errors.push(d.params.entry.text);if(d.method==='Network.requestWillBeSent'&&/^https?:/.test(d.params.request.url)&&!d.params.request.url.startsWith(new URL(base).origin))external.push(d.params.request.url)};
const send=(method,params={})=>new Promise((resolve,reject)=>{pending.set(++n,{resolve,reject});ws.send(JSON.stringify({id:n,method,params}))});
const ev=async expression=>{const r=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value};
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const check=(v,msg)=>{assert.ok(v,msg);count++};
const ids=['inicio','solucoes','alarmes','cameras','cerca','interfone','facial','sobre','etapas','duvidas','instagram','contato'];
const products=['alarmes','cameras','cerca','interfone','facial'];
const active=()=>ev(`document.querySelector('#navigation [aria-current="location"]')?.hash`);
async function jump(id){await ev(`document.querySelector('#${id}').scrollIntoView({behavior:'instant'})`);await wait(90);}
async function key(key,code){await send('Input.dispatchKeyEvent',{type:'keyDown',key,code:key,windowsVirtualKeyCode:code,nativeVirtualKeyCode:code,...(key==='Enter'?{text:'\r',unmodifiedText:'\r'}:{})});await send('Input.dispatchKeyEvent',{type:'keyUp',key,code:key,windowsVirtualKeyCode:code,nativeVirtualKeyCode:code});}
try {
 await send('Page.enable');await send('Page.bringToFront');await send('Runtime.enable');await send('Log.enable');await send('Network.enable');
 await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
 for(const [width,height] of [[1672,941],[1920,1080],[1600,900],[1440,900],[1366,768],[1280,720],[1280,600],[1024,768],[768,1024]]){
  await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});await send('Page.navigate',{url:base});await wait(220);await ev('document.fonts.ready');
  await ev(`document.querySelector('#cookie-notice [data-confirm-privacy]').click()`);
  await ev(`Promise.all([...document.querySelectorAll('main img')].map(i=>{i.loading='eager';return i.decode()}))`);
  assert.deepEqual(await ev(`[...document.querySelectorAll('main>section')].map(e=>e.id)`),ids);count++;
  assert.deepEqual(await ev(`[...document.querySelectorAll('.m-solution-list>a')].map(e=>e.hash)`),products.map(id=>'#'+id));count++;
  check(await ev(`document.querySelectorAll('main').length===1&&document.querySelectorAll('h1').length===1&&document.querySelectorAll('.site-header').length===1&&document.querySelectorAll('.floating-contact').length===1`),'componentes compartilhados sem duplicar página/cabeçalho');
  check(await ev(`document.documentElement.scrollWidth<=innerWidth`),`sem overflow ${width}x${height}`);
  check(await ev(`document.querySelector('#m-hero-title .desktop-copy').getClientRects().length>0&&document.querySelector('#m-hero-title').textContent.includes('O seu acesso também.')&&document.querySelector('#inicio .m-lead .desktop-copy').textContent.includes('cerca elétrica')`),'hero e prioridades atuais');
  check(await ev(`document.querySelector('.site-header').getBoundingClientRect().height>=72&&document.querySelector('.site-header').getBoundingClientRect().height<=88&&[...document.querySelectorAll('.site-header a')].filter(e=>e.getClientRects().length).every(e=>{const r=e.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth})`),`cabeçalho compacto sem cortes ${width}`);
  check(await ev(`[...document.querySelectorAll('.m-product img,.m-solution-photo img,.m-desktop-hero-visual img')].every(i=>{const r=i.getBoundingClientRect();return !r.width||(i.complete&&i.naturalWidth&&r.width<=i.naturalWidth+1&&r.height<=i.naturalHeight+1&&getComputedStyle(i).objectFit==='contain'&&Math.abs(r.width/r.height-i.naturalWidth/i.naturalHeight)<.03)})`),`equipamentos completos e sem ampliação ${width}`);
  check(await ev(`[...document.querySelectorAll('.m-button')].filter(e=>e.getClientRects().length).every(e=>e.getBoundingClientRect().height>=52&&(!e.href||e.hash||new URL(e.href).pathname==='/5511945549849'))`),'botões acessíveis e WhatsApp oficial');
  for(const id of ids){
   await jump(id);const expected=products.includes(id)?'tecnologias':id==='etapas'?'sobre':(id==='duvidas'||id==='instagram')?'contato':id;
   check(await active()===`#${expected}`,`menu ${id} ${width}`);
   check(await ev(`document.querySelectorAll('#navigation [aria-current="location"]').length===1`),'apenas um item ativo');
   check(await ev(`(()=>{const s=document.querySelector('#${id}'),r=s.getBoundingClientRect();return [...s.querySelectorAll('h1,h2,h3,.m-button,input,select,textarea,summary')].filter(e=>e.getClientRects().length).every(e=>{const b=e.getBoundingClientRect();return b.left>=r.left-1&&b.right<=r.right+1&&b.top>=r.top-1&&b.bottom<=r.bottom+1})})()`),`conteúdo sem corte ${id} ${width}`);
   if(width===1672){
    check(await ev(`(()=>{const s=document.querySelector('#${id}'),r=s.getBoundingClientRect();return r.height<=innerHeight+2&&[...s.querySelectorAll('h1,h2,.m-button,.m-product-figure,.contact-whatsapp-panel,.contact-auxiliary')].filter(e=>e.getClientRects().length).every(e=>{const b=e.getBoundingClientRect();return b.top>=document.querySelector('.site-header').getBoundingClientRect().bottom+8&&b.bottom<=innerHeight-8})})()`),`elementos essenciais na tela de referência ${id}`);
    const shot=await send('Page.captureScreenshot',{format:'png'});await writeFile(`${output}/${id}-1672.png`,Buffer.from(shot.data,'base64'));
   }
   check(await ev(`(()=>{const f=document.querySelector('.floating-contact');if(getComputedStyle(f).visibility==='hidden')return true;const r=f.getBoundingClientRect();return [...document.querySelectorAll('.m-button,.contact-whatsapp-panel,.contact-auxiliary,.mobile-footer,.instagram-profile-card,.m-solution-link,.m-faq-item summary')].every(e=>{const b=e.getBoundingClientRect();return !b.width||b.bottom<=r.top||b.top>=r.bottom||b.right<=r.left||b.left>=r.right})})()`),`WhatsApp não cobre conteúdo ${id} ${width}`);
  }
 }
 check(await ev(`[...document.querySelectorAll('a[href^="#"]')].every(a=>document.getElementById(a.hash.slice(1)))`),'todos os links internos têm destino');
 check(await ev(`document.querySelector('.m-process-route').textContent.replace(/\\s/g,'')==='01→02→03→04'&&[...document.querySelectorAll('.m-process-list li>span')].map(e=>e.textContent).join(',')==='01,02,03,04'`),'etapas sem salto de 02 a 04');
 check(await ev(`!document.querySelector('#cameras').textContent.includes('VIP 3240')&&!document.querySelector('#cameras').textContent.toLowerCase().includes('inteligência artificial')&&!document.querySelector('#cerca').textContent.includes('6012')&&!document.querySelector('#facial').textContent.includes('3420')&&document.querySelector('#alarmes').textContent.includes('Sistema 8000')&&!document.querySelector('#alarmes').textContent.includes('AMT 8000 PRO')`),'modelos e especificações não inferidos');
 await jump('facial');await ev(`document.querySelector('.m-complementary').open=true`);await wait(100);
 check(await ev(`document.querySelector('.m-complementary summary').getAttribute('aria-expanded')==='true'&&document.querySelector('.m-complementary').textContent.includes('SS 3430 MF BIO')&&!document.querySelector('.m-complementary').textContent.includes('IFR 7000')`),'complementares reais após cinco prioridades');
 await ev(`document.querySelector('.m-complementary').open=false`);
 await jump('duvidas');await ev(`document.querySelector('.m-faq-item[open]').open=false;document.querySelector('.m-faq-item summary').focus()`);await key('Enter',13);await wait(80);
 check(await ev(`document.querySelector('.m-faq-item').open&&document.querySelector('.m-faq-item summary').getAttribute('aria-expanded')==='true'`),'FAQ por teclado e aria-expanded');
 await ev(`document.querySelectorAll('.m-faq-item')[1].open=true`);await wait(80);check(await ev(`document.querySelectorAll('.m-faq-item[open]').length===1&&document.querySelector('.m-faq-item summary').getAttribute('aria-expanded')==='false'`),'estado de FAQ sincronizado sem sobreposição');
 await jump('contato');
 check(await ev(`document.querySelectorAll('form,input,select,textarea').length===0`),'formulário removido de todos os formatos');
 check(await ev(`document.querySelector('#m-contact-title').textContent==='Sua segurança começa aqui.'&&document.querySelector('.contact-whatsapp-panel h3').textContent==='Vamos conversar?'`),'contato com texto da referência');
 check(await ev(`(()=>{const u=new URL(document.querySelector('.contact-whatsapp-button').href);return u.hostname==='wa.me'&&u.pathname==='/5511945549849'&&u.searchParams.get('text')==='Olá! Gostaria de uma solução de segurança para o meu espaço.'})()`),'CTA direto para WhatsApp oficial com mensagem');
 check(await ev(`document.querySelector('.contact-auxiliary a').hash==='#duvidas'&&document.querySelector('.contact-auxiliary [data-contact-link="projeto"]').href.includes('/5511945549849?text=')`),'links de dúvidas e projeto funcionam');
 check(await ev(`!document.querySelector('.contact-photo').textContent.trim()&&getComputedStyle(document.querySelector('.contact-photo')).backgroundImage.includes('contato-conversa.webp')`),'fundo fotográfico separado dos textos reais');
 await ev(`document.querySelector('.mobile-footer [data-open-privacy]').click()`);check(await ev(`document.querySelector('#privacy-dialog').open`),'preferências do rodapé funcionam');
 await ev(`document.querySelector('[data-reset-privacy]').click()`);check(await ev(`localStorage.getItem('henseg_privacy_v1')===null`),'apagar preferências remove armazenamento');await ev(`document.querySelector('[data-close-privacy]').click()`);check(await ev(`!document.querySelector('#cookie-notice').hidden&&getComputedStyle(document.querySelector('.floating-contact')).visibility==='hidden'`),'aviso volta e flutuante cede espaço');
 await ev(`document.querySelector('#cookie-notice [data-confirm-privacy]').click()`);check(await ev(`JSON.parse(localStorage.getItem('henseg_privacy_v1')).expiresAt>Date.now()&&document.cookie===''`),'somente memória de privacidade, sem cookies próprios');
 for(const file of ['privacidade.html','cookies.html']){
  await send('Page.navigate',{url:new URL(file,base).href});await wait(200);check(await ev(`document.body.textContent.includes('61.285.070/0001-28')&&document.documentElement.scrollWidth<=innerWidth`),`política e identificação ${file}`);await ev(`document.querySelector('.policy-footer [data-open-privacy]').click()`);check(await ev(`document.querySelector('#privacy-dialog').open`),'preferências nas políticas');await key('Escape',27);check(await ev(`!document.querySelector('#privacy-dialog').open`),'Escape fecha preferências');
 }
 await ev(`localStorage.setItem('henseg_privacy_v1',JSON.stringify({version:1,acknowledged:true,expiresAt:Date.now()-1}))`);await send('Page.navigate',{url:base});await wait(200);check(await ev(`!document.querySelector('#cookie-notice').hidden`),'preferência expirada não reutilizada');
 await ev(`localStorage.removeItem('henseg_privacy_v1')`);const denied=await send('Page.addScriptToEvaluateOnNewDocument',{source:`Storage.prototype.setItem=function(){throw new DOMException('Blocked','SecurityError')}`});await send('Page.navigate',{url:base});await wait(200);await ev(`document.querySelector('#cookie-notice [data-confirm-privacy]').click()`);check(await ev(`document.querySelector('#cookie-notice').hidden&&document.querySelector('#privacy-save-status').textContent.includes('esta visita')`),'armazenamento bloqueado não impede navegação');await send('Page.removeScriptToEvaluateOnNewDocument',{identifier:denied.identifier});
 check(external.length===0,`sem requisições externas automáticas: ${external.join(',')}`);check(errors.length===0,`console limpo: ${errors.join(',')}`);
 console.log(`${count} verificações desktop e privacidade passaram. Capturas em ${output}.`);
} finally {ws.close();await fetch(`http://127.0.0.1:9222/json/close/${t.id}`);}
