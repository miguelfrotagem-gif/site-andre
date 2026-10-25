import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
const base=process.env.TEST_URL||'http://127.0.0.1:3000/hensec.html';
const output='/tmp/hensec-checks';await mkdir(output,{recursive:true});
const target=await(await fetch('http://127.0.0.1:9222/json/new?about:blank',{method:'PUT'})).json();
const ws=new WebSocket(target.webSocketDebuggerUrl);await new Promise(r=>ws.addEventListener('open',r,{once:true}));
let id=0;const pending=new Map(),errors=[];
ws.addEventListener('message',e=>{const d=JSON.parse(e.data);if(d.id){const p=pending.get(d.id);if(p){pending.delete(d.id);d.error?p.reject(d.error):p.resolve(d.result)}}if(d.method==='Runtime.exceptionThrown')errors.push(d.params.exceptionDetails.text);if(d.method==='Log.entryAdded'&&d.params.entry.level==='error')errors.push(d.params.entry.text)});
const send=(method,params={})=>new Promise((resolve,reject)=>{const i=++id;pending.set(i,{resolve,reject});ws.send(JSON.stringify({id:i,method,params}))});
const evaluate=async expression=>{const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value};
const wait=ms=>new Promise(r=>setTimeout(r,ms));
let checks=0;function check(v,message){assert.ok(v,message);checks++}
try {
 await send('Page.enable');await send('Page.bringToFront');await send('Runtime.enable');await send('Log.enable');await send('Network.enable');
 const external=[];
 ws.addEventListener('message',event=>{const d=JSON.parse(event.data);if(d.method==='Network.requestWillBeSent'){const u=d.params.request.url;if(/^https?:/.test(u)&&!u.startsWith(new URL(base).origin))external.push(u);}});
 await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
 await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:false});
 await send('Page.navigate',{url:base});await wait(250);
 await evaluate('localStorage.clear()');await send('Page.navigate',{url:base});await wait(200);
 check(await evaluate(`!document.querySelector('#cookie-notice').hidden`),'aviso aparece sem preferência');
 check(await evaluate(`document.cookie===''`),'site não define cookies');
 check(await evaluate(`!document.querySelector('input[type=checkbox]')`),'sem categorias fictícias de consentimento');
 check(await evaluate(`(()=>{const n=document.querySelector('#cookie-notice').getBoundingClientRect(),w=document.querySelector('.floating-contact').getBoundingClientRect();return n.right<=innerWidth&&n.left>=0&&(n.bottom<=w.top||n.right<=w.left)})()`),'aviso não sobrepõe WhatsApp no celular');
 {const shot=await send('Page.captureScreenshot',{format:'png'});await writeFile(`${output}/cookies-mobile.png`,Buffer.from(shot.data,'base64'));}
 await evaluate(`document.querySelector('#cookie-notice [data-confirm-privacy]').click()`);
 check(await evaluate(`document.querySelector('#cookie-notice').hidden`),'confirmar fecha aviso');
 check(await evaluate(`(()=>{const c=JSON.parse(localStorage.getItem('henseg_privacy_v1'));return c.version===1&&c.acknowledged&&c.expiresAt>Date.now()&&c.expiresAt-Date.now()<=180*86400000})()`),'escolha versionada, mínima e limitada a 180 dias');
 for(const [width,height] of [[1920,1080],[1600,900],[1440,900],[1366,768],[1280,720],[1280,600],[768,1024],[430,932],[390,844],[360,800],[320,700]]) {
  await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});
  await send('Page.navigate',{url:base});await wait(180);await evaluate('document.fonts.ready');
  check(await evaluate('document.title.includes("HENSEG")'),'marca correta');
  check(await evaluate(`document.querySelector('.footer-bottom').textContent.includes('61.285.070/0001-28')&&window.HENSEC_CONFIG.portfolio.brand==='Intelbras'`),'CNPJ e marca de equipamentos confirmados');
  check(await evaluate('document.documentElement.scrollWidth<=innerWidth'),`sem overflow ${width}×${height}`);
  assert.deepEqual(await evaluate('[...document.querySelectorAll("main>section")].map(s=>s.id)'),['inicio','tecnologias','solucoes','ambientes','sobre','galeria','duvidas','contato']);checks++;
  check(await evaluate(`!document.querySelector('.brand-intro')&&!document.querySelector('main').inert`),'hero disponível sem abertura longa');
  check(await evaluate(`document.querySelectorAll('h1').length===1&&document.querySelector('h1').textContent.includes('A segurança')`),'headline de acesso');
  check(await evaluate(`document.querySelector('.access-hero-visual img').complete&&document.querySelector('.access-hero-visual img').naturalWidth>0`),'hero carrega imagem');
  check(await evaluate(`document.querySelector('.access-hero .button').href.startsWith('https://wa.me/5511945549849?text=')&&document.querySelector('.floating-contact').href.startsWith('https://wa.me/5511945549849?text=')`),'WhatsApp oficial nos CTAs');
  check(await evaluate(`getComputedStyle(document.querySelector('.floating-contact')).backgroundColor==='rgb(37, 211, 102)'`),'botão WhatsApp verde');
  check(await evaluate(`(()=>{const r=document.querySelector('.site-header').getBoundingClientRect();return [...document.querySelectorAll('.site-header a')].filter(e=>e.getBoundingClientRect().width).every(e=>{const b=e.getBoundingClientRect();return b.left>=r.left&&b.right<=r.right})})()`),`cabeçalho cabe ${width}`);
  check(await evaluate(`document.querySelector('#cookie-notice').hidden`),'escolha persiste');
  for(const [section,current] of [['inicio','inicio'],['tecnologias','tecnologias'],['solucoes','solucoes'],['ambientes','solucoes'],['sobre','sobre'],['galeria','tecnologias'],['duvidas','contato'],['contato','contato']]) {
   await evaluate(`document.querySelector('#${section}').scrollIntoView({behavior:'instant'})`);await wait(65);
   check(await evaluate(`document.querySelector('nav [aria-current]')?.hash==='#${current}'`),`menu ${section} ${width}`);
   check(await evaluate(`(()=>{const s=document.querySelector('#${section}'),r=s.getBoundingClientRect();return [...s.querySelectorAll('h1,h2,h3,.button,.text-link')].every(e=>{const b=e.getBoundingClientRect();return b.width===0||(b.left>=-1&&b.right<=innerWidth+1&&b.top>=r.top-1&&b.bottom<=r.bottom+1)})})()`),`conteúdo sem cortes ${section} ${width}`);
   if((width===1440&&height===900||width===390)&&['inicio','tecnologias','galeria','duvidas','contato'].includes(section)) {
    const images=await evaluate(`Promise.all([...document.querySelector('#${section}').querySelectorAll('img')].filter(i=>i.getBoundingClientRect().width).map(i=>{i.loading='eager';return i.decode().catch(()=>{})})).then(()=>true)`);
    const shot=await send('Page.captureScreenshot',{format:'png'});await writeFile(`${output}/atualizado-${section}-${width}.png`,Buffer.from(shot.data,'base64'));
   }
  }
  check(await evaluate(`[...document.querySelectorAll('a[href^="#"]')].every(a=>document.querySelector(a.getAttribute('href')))`),'âncoras existem');
  if(width===390) {
   await evaluate(`document.querySelector('.menu-toggle').click()`);
   check(await evaluate(`document.querySelector('.menu-toggle').getAttribute('aria-expanded')==='true'`),'menu móvel abre');
   await evaluate(`document.querySelector('nav a[href="#tecnologias"]').click()`);await wait(90);
   check(await evaluate(`document.querySelector('.menu-toggle').getAttribute('aria-expanded')==='false'`),'menu móvel fecha');
  }
 }
 // The technology section is complete without media or empty photo placeholders.
 check(await evaluate(`document.querySelectorAll('#tecnologias .technology-step').length===4&&document.querySelectorAll('#tecnologias .technology-extra').length===2`),'quatro etapas e dois blocos complementares');
 check(await evaluate(`document.querySelector('#technology-title').textContent==='Tecnologia que transforma a sua segurança.'`),'novo título completo');
 check(await evaluate(`!document.querySelector('#tecnologias img,#tecnologias picture,#tecnologias video,#tecnologias svg,#tecnologias canvas,#tecnologias .technology-visual,#tecnologias .technology-frames')`),'tecnologias sem imagens ou espaços de fotografia');
 check(await evaluate(`[...document.querySelectorAll('#tecnologias *')].every(e=>getComputedStyle(e).backgroundImage==='none')`),'nenhuma imagem de fundo na seção');
 check(await evaluate(`window.HENSEC_CONFIG.technologyReferences.length===6&&window.HENSEC_CONFIG.technologyReferences.every(r=>r.confirmed===false)`),'modelos editáveis tratados como referências');
 check(await evaluate(`(()=>{const refs=window.HENSEC_CONFIG.technologyReferences;return refs.every(r=>{const a=document.querySelector('[data-technology-reference="'+r.id+'"]');return a.querySelector('[data-reference-model]').textContent===r.model&&new URL(a.querySelector('[data-whatsapp]').href).searchParams.get('text').includes(r.model)&&a.querySelector('[data-whatsapp]').href.startsWith('https://wa.me/5511945549849?text=')})})()`),'seis referências e seis mensagens corretas');
 check(await evaluate(`!document.querySelector('[data-technology-reference="cameras-ia"]').textContent.toLowerCase().includes('reconhecimento facial')`),'câmera IA sem atribuição de reconhecimento facial');
 // Desktop narrative follows real content position, including reversal.
 await send('Emulation.setDeviceMetricsOverride',{width:1440,height:900,deviceScaleFactor:1,mobile:false});
 await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'no-preference'}]});
 await send('Page.navigate',{url:base});await wait(600);
 check(await evaluate(`!document.querySelector('.brand-intro')&&Number(getComputedStyle(document.querySelector('.hero .actions')).opacity)>.4`),'CTAs entram rapidamente');
 for(const i of [0,1,2,3,2,1,0]) {
  await evaluate(`(()=>{const e=document.querySelector('[data-technology-step="${i}"]'),r=e.getBoundingClientRect();scrollTo({top:scrollY+r.top+r.height/2-innerHeight*.52,behavior:'instant'})})()`);await wait(100);
  check(await evaluate(`document.querySelector('[data-technology-go][aria-current]')?.dataset.technologyGo==='${i}'`),`tecnologia ativa e reversível ${i}`);
  check(await evaluate(`getComputedStyle(document.querySelector('.technology-story-rail')).position==='sticky'`),'título temporariamente sticky');
  check(await evaluate(`(()=>{const r=document.querySelector('.technology-story-rail').getBoundingClientRect(),safe=parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--nav-height'))+18;return r.top>=safe-2&&r.bottom<=innerHeight})()`),'sticky na área segura');
 }
 const lateProgress=await evaluate(`document.querySelector('#tecnologias').style.getPropertyValue('--tech-progress')`);
 await evaluate(`document.querySelector('[data-technology-go="3"]').click()`);await wait(1200);
 check(await evaluate(`document.querySelector('[data-technology-go][aria-current]')?.dataset.technologyGo==='3'`),'indicador clicável leva à quarta etapa');
 check(await evaluate(`Number(document.querySelector('#tecnologias').style.getPropertyValue('--tech-progress'))>Number('${lateProgress}')`),'linha acompanha avanço real do scroll');
 await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});await wait(100);
 check(await evaluate(`!document.querySelector('#tecnologias').classList.contains('technology-enhanced')&&[...document.querySelectorAll('#tecnologias .technology-copy')].every(e=>getComputedStyle(e).opacity==='1'&&getComputedStyle(e).transform==='none')`),'movimento reduzido mantém os seis conteúdos estáticos e legíveis');
 // Distinct images and messages for actual supported environments.
 await evaluate(`document.querySelector('#tab-empresa').click()`);
 check(await evaluate(`!document.querySelector('#panel-empresa').hidden&&document.querySelector('#panel-residencia').hidden`),'aba troca conteúdo');
 check(await evaluate(`document.querySelector('#panel-empresa img').src!==document.querySelector('#panel-residencia img').src`),'abas não repetem foto');
 check(await evaluate(`new URL(document.querySelector('#panel-empresa .button').href).searchParams.get('text').includes('empresa')`),'mensagem empresarial');
 await evaluate(`document.querySelector('#tab-residencia').click()`);
 check(await evaluate(`new URL(document.querySelector('#panel-residencia .button').href).searchParams.get('text').includes('casa')`),'mensagem residencial');
 await evaluate(`document.querySelector('#tab-residencia').focus()`);
 await send('Input.dispatchKeyEvent',{type:'keyDown',key:'ArrowRight',code:'ArrowRight'});await send('Input.dispatchKeyEvent',{type:'keyUp',key:'ArrowRight',code:'ArrowRight'});
 check(await evaluate(`document.activeElement.id==='tab-empresa'&&document.querySelector('#tab-empresa').getAttribute('aria-selected')==='true'`),'abas pelo teclado');
 // Gallery, zoom, focus and native touch scrolling.
 for(const i of [1,3,0]) {
  await evaluate(`document.querySelector('[data-gallery-select="${i}"]').click()`);await wait(120);
  check(await evaluate(`document.querySelector('[data-gallery-select][aria-current]')?.dataset.gallerySelect==='${i}'`),`galeria seleciona foto ${i}`);
 }
 check(await evaluate(`new Set([...document.querySelectorAll('.gallery-slide img')].map(i=>i.src)).size===4`),'quatro fotos distintas');
 await evaluate(`document.querySelector('[data-gallery-expand]').click()`);
 check(await evaluate(`document.querySelector('#gallery-modal').open&&document.querySelector('#gallery-modal img').naturalWidth>0`),'ampliação funcional');
 await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape',windowsVirtualKeyCode:27,nativeVirtualKeyCode:27});await send('Input.dispatchKeyEvent',{type:'keyUp',key:'Escape',code:'Escape',windowsVirtualKeyCode:27,nativeVirtualKeyCode:27});
 check(await evaluate(`!document.querySelector('#gallery-modal').open&&document.activeElement.hasAttribute('data-gallery-expand')`),'Escape fecha zoom e devolve foco');
 await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});await send('Emulation.setTouchEmulationEnabled',{enabled:true});await wait(100);
 await evaluate(`document.querySelector('.gallery-track').scrollIntoView({block:'center',behavior:'instant'})`);await wait(80);
 const touch=await evaluate(`(()=>{const r=document.querySelector('.gallery-track').getBoundingClientRect();return {x:r.left+r.width*.85,y:Math.max(140,Math.min(innerHeight-150,r.top+r.height*.35)),width:r.width}})()`);
 await send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:touch.x,y:touch.y}]});
 for(let n=1;n<=8;n++){await send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:touch.x-touch.width*.075*n,y:touch.y}]});await wait(25);}
 await send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await wait(400);
 check(await evaluate(`document.querySelector('.gallery-track').scrollLeft>50`),'galeria desliza com gesto real');
 await send('Emulation.setTouchEmulationEnabled',{enabled:false});
 // FAQ is semantic, opens with the keyboard and keeps one answer at a time.
 await evaluate(`document.querySelector('.faq-item summary').focus()`);
 await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Enter',code:'Enter',windowsVirtualKeyCode:13,nativeVirtualKeyCode:13,text:'\r',unmodifiedText:'\r'});await send('Input.dispatchKeyEvent',{type:'keyUp',key:'Enter',code:'Enter',windowsVirtualKeyCode:13,nativeVirtualKeyCode:13});
 check(await evaluate(`document.querySelector('.faq-item').open`),'FAQ acessível pelo teclado');
 await evaluate(`document.querySelectorAll('.faq-item')[1].open=true`);
 check(await evaluate(`document.querySelectorAll('.faq-item[open]').length===1`),'uma resposta por vez');
 // Preferences can be reopened and erased, without third-party tracking.
 await evaluate(`document.querySelector('.footer-bottom [data-open-privacy]').click()`);
 check(await evaluate(`document.querySelector('#privacy-dialog').open`),'preferências reabrem no rodapé');
 await evaluate(`document.querySelector('[data-reset-privacy]').click()`);
 check(await evaluate(`localStorage.getItem('henseg_privacy_v1')===null`),'apagar escolha remove armazenamento');
 await evaluate(`document.querySelector('[data-close-privacy]').click()`);
 check(await evaluate(`!document.querySelector('#cookie-notice').hidden`),'apagar faz aviso reaparecer');
 await evaluate(`document.querySelector('#cookie-notice [data-open-privacy]').click()`);
 await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape',windowsVirtualKeyCode:27,nativeVirtualKeyCode:27});await send('Input.dispatchKeyEvent',{type:'keyUp',key:'Escape',code:'Escape',windowsVirtualKeyCode:27,nativeVirtualKeyCode:27});
 check(await evaluate(`!document.querySelector('#privacy-dialog').open&&document.activeElement.hasAttribute('data-open-privacy')`),'Escape fecha preferências e devolve foco');
 await evaluate(`localStorage.setItem('henseg_privacy_v1',JSON.stringify({version:1,acknowledged:true,expiresAt:Date.now()-1}))`);
 await send('Page.navigate',{url:base});await wait(200);
 check(await evaluate(`!document.querySelector('#cookie-notice').hidden`),'escolha expirada não é reutilizada');
 await evaluate(`document.querySelector('#cookie-notice [data-confirm-privacy]').click()`);
 for(const page of ['privacidade.html','cookies.html']) {
  await send('Page.navigate',{url:new URL(page,new URL('.',base)).href});await wait(200);
  check(await evaluate('document.documentElement.scrollWidth<=innerWidth'),`política mobile sem overflow ${page}`);
  check(await evaluate(`document.querySelectorAll('h1').length===1&&document.querySelector('h1').textContent.length>10&&document.body.textContent.includes('61.285.070/0001-28')`),`conteúdo e identificação da política ${page}`);
  check(await evaluate(`!document.querySelector('#cookie-notice').hidden===false`),'escolha compartilha a mesma origem');
  await evaluate(`document.querySelector('.policy-footer [data-open-privacy]').click()`);
  check(await evaluate(`document.querySelector('#privacy-dialog').open`),'preferências nas políticas');
  await evaluate(`document.querySelector('[data-close-privacy]').click()`);
  if(page==='privacidade.html'){const shot=await send('Page.captureScreenshot',{format:'png'});await writeFile(`${output}/privacidade-mobile.png`,Buffer.from(shot.data,'base64'));}
 }
 await evaluate(`localStorage.removeItem('henseg_privacy_v1')`);
 const denied=await send('Page.addScriptToEvaluateOnNewDocument',{source:`Storage.prototype.setItem=function(){throw new DOMException('Blocked','SecurityError')}`});
 await send('Page.navigate',{url:base});await wait(200);
 await evaluate(`document.querySelector('#cookie-notice [data-confirm-privacy]').click()`);
 check(await evaluate(`document.querySelector('#cookie-notice').hidden&&!document.querySelector('main').inert`),'armazenamento bloqueado não trava navegação');
 check(await evaluate(`document.querySelector('#privacy-save-status').textContent.includes('esta visita')`),'limitação de persistência informada sem falso sucesso');
 await send('Page.removeScriptToEvaluateOnNewDocument',{identifier:denied.identifier});
 check(external.length===0,`nenhum pedido externo automático: ${external.join(',')}`);
 check(errors.length===0,`console sem erros: ${errors.join(',')}`);
 for(const path of ['/privacidade.html','/cookies.html','/site-extras.js','/assets/hensec/tecnologia-facial.webp','/assets/hensec/tecnologia-biometria.webp','/assets/hensec/ambiente-empresa.webp'])check((await fetch(new URL(path.replace(/^\//,''),new URL('.',base)))).ok,`recurso disponível ${path}`);
 console.log(`${checks} verificações passaram. Capturas em ${output}.`);
} finally {ws.close();await fetch(`http://127.0.0.1:9222/json/close/${target.id}`);}
