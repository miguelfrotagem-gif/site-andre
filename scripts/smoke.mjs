import assert from 'node:assert/strict';
import {mkdir, writeFile} from 'node:fs/promises';
const base = process.env.TEST_URL || 'http://127.0.0.1:3000';
const output = process.env.SCREENSHOT_DIR || '/tmp/solar-checks';
await mkdir(output, {recursive:true});
const target = await (await fetch('http://127.0.0.1:9222/json/new?about:blank', {method:'PUT'})).json();
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise(resolve => ws.addEventListener('open', resolve, {once:true}));
let id=0; const pending=new Map(); const errors=[];
ws.addEventListener('message', event => {
  const data=JSON.parse(event.data);
  if (data.id) {
    const p=pending.get(data.id); if (!p) return;
    pending.delete(data.id);
    data.error ? p.reject(new Error(data.error.message)) : p.resolve(data.result);
  }
  if (data.method==='Runtime.exceptionThrown') errors.push(data.params.exceptionDetails.text);
  if (data.method==='Log.entryAdded' && data.params.entry.level==='error') errors.push(`${data.params.entry.text} ${data.params.entry.url || ''}`);
});
function send(method, params={}) {
  return new Promise((resolve,reject) => {
    const messageId=++id;
    const timer=setTimeout(() => {pending.delete(messageId);reject(new Error(`Tempo excedido: ${method}`));},15000);
    pending.set(messageId,{resolve:r=>{clearTimeout(timer);resolve(r);},reject:e=>{clearTimeout(timer);reject(e);}});
    ws.send(JSON.stringify({id:messageId,method,params}));
  });
}
async function evaluate(expression) {
  const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});
  if(r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails));
  return r.result.value;
}
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const viewport=(width,height)=>send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});
async function screenshot(name,full=false) {
  const options={format:'png',captureBeyondViewport:full};
  if(full) {
    const m=await send('Page.getLayoutMetrics');
    options.clip={x:0,y:0,width:m.cssLayoutViewport.clientWidth,height:m.cssContentSize.height,scale:1};
  }
  const shot=await send('Page.captureScreenshot',options);
  await writeFile(`${output}/${name}.png`,Buffer.from(shot.data,'base64'));
}
async function key(key, code = key, text) {
 await send('Input.dispatchKeyEvent', {type:'keyDown', key, code, ...(text ? {text, unmodifiedText:text} : {})});
 await send('Input.dispatchKeyEvent', {type:'keyUp', key, code});
}
async function sectionCapture(sectionId, width) {
 await evaluate(`(async()=>{const s=document.getElementById('${sectionId}');s.scrollIntoView({block:'start'});await Promise.all([...s.querySelectorAll('img')].filter(i=>i.getBoundingClientRect().width>0).map(i=>{i.loading='eager';return i.decode()}));})()`);
 await wait(120);
 // A full-section capture excludes the sticky global header; viewport captures keep it.
 await evaluate(`document.activeElement?.blur();document.querySelector('.site-header').style.position='static'`);
 const clip=await evaluate(`(()=>{const r=document.getElementById('${sectionId}').getBoundingClientRect();return {x:r.left+scrollX,y:r.top+scrollY,width:r.width,height:r.height,scale:1}})()`);
 const shot=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:true,clip});
 await writeFile(`${output}/${sectionId}-${width}.png`,Buffer.from(shot.data,'base64'));
 await evaluate(`document.querySelector('.site-header').style.removeProperty('position')`);
}
try {
 await send('Page.enable');await send('Runtime.enable');await send('Log.enable');
 await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
 await viewport(390,844);await send('Page.navigate',{url:base});await wait(450);await evaluate('document.fonts.ready');
 assert.match(await evaluate('document.title'),/Energia Solar/);
 assert.deepEqual(await evaluate('[...document.querySelectorAll("main>section")].map(e=>e.id)'),['inicio','solucoes','como-funciona','projetos','duvidas','contato']);
 assert.equal(await evaluate('document.querySelectorAll("h1").length'),1);
 assert.equal(await evaluate('document.querySelector("h1").textContent.includes("90%")'),false);
 assert.equal(await evaluate(`document.querySelector('#contato form')`),null,'contato sem formulário');
 const matrix=[[320,700],[360,800],[375,812],[390,844],[430,932],[480,900],[640,900],[768,1024],[912,1368],[1023,768],[1024,768],[1366,768],[1440,900],[1920,1080],[2560,1080],[844,390],[1280,480],[720,450]];
 for(const [width,height] of matrix){
  await viewport(width,height);await evaluate('scrollTo(0,0)');await wait(40);
  await evaluate(`Promise.all([...document.images].filter(i=>i.getBoundingClientRect().width>0).map(i=>{i.loading='eager';return i.decode()}))`);
  assert.equal(await evaluate('document.documentElement.scrollWidth<=innerWidth'),true,`overflow ${width}x${height}`);
  const frames=await evaluate(`(()=>{const edge=document.documentElement.clientWidth;return [...document.querySelectorAll('main>section')].map(section=>{const r=section.getBoundingClientRect(),pictures=section.querySelectorAll('picture.scene-visual'),img=pictures[0]?.querySelector('img'),ir=img?.getBoundingClientRect(),style=img&&getComputedStyle(img);return {id:section.id,one:pictures.length===1,outer:Math.abs(r.left)<.5&&Math.abs(r.right-edge)<.5,photo:!!ir&&Math.abs(ir.left)<.5&&Math.abs(ir.right-edge)<.5,noFrame:style?.borderRadius==='0px',rightAsset:img?.currentSrc.includes('/mobile/')===(${width}<1024)}})})()`);
  for(const frame of frames)for(const check of ['one','outer','photo','noFrame','rightAsset'])assert.equal(frame[check],true,`${width}: ${frame.id} ${check}`);
  assert.equal(await evaluate(`document.querySelectorAll('details.reference,.reference-hotspot,.desktop-open,#art-dialog').length`),0,'sem visualizadores públicos');

  const images=await evaluate(`(()=>[...document.querySelectorAll('.scene-visual img')].filter(i=>i.getBoundingClientRect().width>0).map(i=>{const r=i.getBoundingClientRect(),s=getComputedStyle(i);return {path:i.currentSrc.split('/').pop(),ratioOK:Math.abs(r.width/r.height-i.naturalWidth/i.naturalHeight)<.003,inside:r.left>=-.5&&r.right<=innerWidth+.5,contain:s.objectFit==='contain',noZoom:s.transform==='none'}}))()`);
  for(const img of images)for(const k of ['ratioOK','inside','contain','noZoom'])assert.equal(img[k],true,`${width}: ${img.path} ${k}`);
  assert.equal(await evaluate(`document.querySelector('.hero-photo').currentSrc.includes('/mobile/')`),width<1024,'picture seleciona enquadramento próprio');
  assert.equal(await evaluate(`(()=>{const r=document.querySelector('h1').getBoundingClientRect();return r.left>=0&&r.right<=innerWidth+1})()`),true,`h1 ${width}`);
  assert.equal(await evaluate(`(()=>{const a=document.querySelector('.brand').getBoundingClientRect(),b=document.querySelector('${width<1024?'.menu-toggle':'#navigation'}').getBoundingClientRect();return a.right+5<=b.left})()`),true,`cabeçalho sem colisão ${width}`);
  if(width<1024){
   assert.equal(await evaluate(`[...document.querySelectorAll('.button,.solution-options button,.project-types button')].filter(b=>b.getBoundingClientRect().width>0).every(b=>b.getBoundingClientRect().height>=44)`),true,`toque ${width}`);
   assert.equal(await evaluate(`(()=>{const portrait=document.querySelector('.owner-portrait').getBoundingClientRect(),cta=document.querySelector('#whatsapp-cta').getBoundingClientRect(),title=document.querySelector('#contato .section-intro').getBoundingClientRect();return title.bottom<=portrait.top+1&&portrait.bottom<cta.top})()`),true,`retrato livre de texto e CTA ${width}`);
  }
  console.log(`PASS: ${width}x${height}, fotos inteiras nas proporções próprias, sem zoom/overflow; cabeçalho livre e controles tocáveis`);
 }
 await viewport(390,844);await evaluate(`scrollTo(0,0);document.querySelector('.menu-toggle').focus()`);
 await key('Enter','Enter','\r');
 assert.equal(await evaluate(`document.querySelector('.menu-toggle').getAttribute('aria-expanded')`),'true');
 assert.equal(await evaluate(`document.querySelector('.menu-proposal').getBoundingClientRect().height>=44`),true);
 await key('Escape');
 assert.equal(await evaluate(`document.querySelector('.menu-toggle').getAttribute('aria-expanded')`),'false');
 assert.equal(await evaluate(`document.activeElement===document.querySelector('.menu-toggle')`),true);
 await evaluate(`document.querySelector('.menu-toggle').click();document.querySelector('#navigation a[href="#solucoes"]').click()`);
 assert.equal(await evaluate(`document.querySelector('.menu-toggle').getAttribute('aria-expanded')`),'false');
 assert.equal(await evaluate(`document.activeElement.id`),'solucoes');
 assert.equal(await evaluate(`['hidden','clip'].includes(getComputedStyle(document.body).overflowY)`),false);
 await evaluate(`document.querySelector('.menu-toggle').click();document.querySelector('.menu-proposal').click()`);
 assert.match(await evaluate(`document.querySelector('#contact-context').textContent`),/solicitar uma proposta/);
 for(const [type,fragment] of [['residencial','minha casa'],['empresarial','minha empresa'],['rural','propriedade rural']]){
  await evaluate(`document.querySelector('[data-solution="${type}"]').click();document.querySelector('#solution-cta').click()`);
  assert.match(await evaluate(`document.querySelector('#contact-context').textContent`),new RegExp(fragment));
  assert.equal(await evaluate(`document.querySelector('[data-solution="${type}"]').getAttribute('aria-pressed')`),'true');
 }
 await evaluate(`document.querySelector('#whatsapp-cta').click()`);
 assert.equal(await evaluate(`document.activeElement.id`),'contact-status');
 assert.equal(await evaluate(`document.querySelector('#whatsapp-cta').href.includes('wa.me')`),false);
 console.log('PASS: menu por teclado, Escape/retorno de foco, seleção/fechamento, proposta, scroll livre e três mensagens de solução');
 assert.equal(await evaluate(`document.querySelector('#answer-1').hidden`),false);
 await evaluate(`document.querySelector('#question-1').click()`);
 assert.equal(await evaluate(`document.querySelector('#answer-1').hidden`),true);
 await evaluate(`document.querySelector('#question-1').click()`);
 assert.equal(await evaluate(`document.querySelector('#answer-1').hidden`),false);
 await evaluate(`document.querySelector('#question-1').focus();document.querySelector('#faq-search').value='LUMINOSIDADE';document.querySelector('#faq-search').dispatchEvent(new Event('input'))`);
 assert.equal(await evaluate(`document.querySelectorAll('.faq-item:not([hidden])').length`),1,'busca também na resposta');
 assert.equal(await evaluate(`document.activeElement.id`),'faq-search','foco sai de pergunta ocultada');
 await evaluate(`document.querySelector('#faq-search').value='GERACAO';document.querySelector('#faq-search').dispatchEvent(new Event('input'))`);
 assert.equal(await evaluate(`document.querySelectorAll('.faq-item:not([hidden])').length`),2,'busca sem acentos ou caixa');
 await evaluate(`document.querySelector('#faq-search').value='zzzinexistente';document.querySelector('#faq-search').dispatchEvent(new Event('input'))`);
 assert.equal(await evaluate(`document.querySelector('#no-results').hidden`),false);
 assert.equal(await evaluate(`document.querySelector('#duvidas .actions .button').getBoundingClientRect().height>=44`),true,'CTA preservado sem resultados');
 await evaluate(`document.querySelector('#clear-search').click()`);
 assert.equal(await evaluate(`document.querySelectorAll('.faq-item:not([hidden])').length`),5);
 await evaluate(`document.querySelector('[data-project="empresarial"]').click();document.querySelector('#project-cta').click()`);
 assert.match(await evaluate(`document.querySelector('#project-summary').textContent`),/Empresarial/);
 assert.match(await evaluate(`document.querySelector('#contact-context').textContent`),/Vi os projetos no site/);
 assert.equal(await evaluate(`document.querySelectorAll('.project-controls button:disabled').length`),2);
 assert.match(await evaluate(`document.querySelector('.project-controls').textContent`),/01 \/ 01/);
 console.log('PASS: FAQ real, busca por respostas/acentos, foco previsível, limpar, CTA sem resultados e projeto único honesto');
 // Real expansion with arbitrary content height, then a preference change during animation.
 await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'no-preference'}]});
 await evaluate(`document.querySelector('#question-2').click()`);await wait(300);
 assert.equal(await evaluate(`(()=>{const r=document.querySelector('#answer-2');return !r.hidden&&r.getBoundingClientRect().height>=r.scrollHeight-.5})()`),true,'resposta não cortada');
 await evaluate(`document.querySelector('#question-2').click()`);
 await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});await wait(30);
 assert.equal(await evaluate(`document.querySelector('#answer-2').hidden`),true);
 assert.equal(await evaluate(`[...document.querySelectorAll('.scene-visual img')].every(i=>getComputedStyle(i).transform==='none')`),true);
 console.log('PASS: expansão por altura real e preferência dinâmica por movimento reduzido, sem escala de fotografia');
 assert.equal(await evaluate(`document.querySelectorAll('#faq-surface').length`),1,'FAQ nativo único');
 assert.equal(await evaluate(`document.querySelectorAll('.site-header').length`),1,'cabeçalho global único');
 for(const width of [390,768,1366,1920]){
  await viewport(width,width<480?844:1000);
  await evaluate('scrollTo(0,0);document.activeElement?.blur()');await wait(80);await screenshot(`viewport-${width}`);
  for(const sectionId of ['inicio','solucoes','como-funciona','projetos','duvidas','contato']) await sectionCapture(sectionId,width);
 }
 console.log('PASS: seis composições únicas de ponta a ponta; sem referências/hotspots/modais; capturas em 390, 768, 1366 e 1920 px');
 await viewport(390,844);
 await send('Emulation.setScriptExecutionDisabled',{value:true});await send('Page.navigate',{url:base});await wait(400);
 assert.equal(await evaluate(`document.querySelector('#answer-2').getBoundingClientRect().height>0`),true);
 assert.equal(await evaluate(`document.querySelector('h1').getBoundingClientRect().height>0`),true);
 assert.equal(await evaluate(`document.querySelector('#navigation a[href="#solucoes"]').getBoundingClientRect().height>0`),true);
 assert.equal(await evaluate(`document.documentElement.scrollWidth<=innerWidth`),true);
 await send('Emulation.setScriptExecutionDisabled',{value:false});
 console.log('PASS: conteúdo, navegação e respostas sem JavaScript');
 const injection=await send('Page.addScriptToEvaluateOnNewDocument',{source:`Object.defineProperty(window,'SOLAR_CONFIG',{configurable:true,set(v){v.whatsappNumber='+55 (11) 99999-9999';Object.defineProperty(window,'SOLAR_CONFIG',{value:v,configurable:true});}});`});
 await send('Page.navigate',{url:base});await wait(300);
 for(const [selector,fragment] of [['.hero-support [data-message="hero"]','potencial de economia'],['#solution-cta','minha casa'],['#project-cta','Vi os projetos'],['#duvidas [data-message="faq"]','tirar uma dúvida']]){
  await evaluate(`document.querySelector('${selector}').click()`);
  const href=await evaluate(`document.querySelector('#whatsapp-cta').getAttribute('href')`);
  assert.equal(new URL(href).pathname,'/5511999999999');assert.match(new URL(href).searchParams.get('text'),new RegExp(fragment));
 }
 await send('Page.removeScriptToEvaluateOnNewDocument',{identifier:injection.identifier});
 await send('Page.navigate',{url:base});await wait(300);
 assert.equal(await evaluate(`document.querySelector('#whatsapp-cta').href.includes('wa.me')`),false);
 console.log('PASS: número normalizado e mensagens hero/solução/projeto/FAQ, com configuração exclusiva de teste e sem navegação externa');
 if (process.env.EXPORT_URL) {
  await viewport(390,844);
  await send('Page.navigate',{url:process.env.EXPORT_URL});await wait(400);
  await evaluate(`Promise.all([...document.images].filter(i=>i.getBoundingClientRect().width>0).map(i=>{i.loading='eager';return i.decode()}))`);
  assert.match(await evaluate('document.title'),/Energia Solar/);
  await evaluate(`document.querySelector('#question-2').click()`);
  assert.equal(await evaluate(`document.querySelector('#answer-2').hidden`),false,'FAQ no arquivo exportado');
  assert.equal(await evaluate(`document.querySelector('.owner-portrait').naturalWidth>0`),true,'retrato embutido');
  assert.equal(await evaluate(`document.querySelector('.hero-photo').naturalWidth`),934,'cena mobile embutida');
  assert.equal(await evaluate(`document.documentElement.scrollWidth<=innerWidth`),true);
  console.log('PASS: arquivo HTML independente com fotografia e retrato embutidos e FAQ funcional');
 }
 assert.deepEqual(errors,[],'erros de execução ou console');
 console.log(`PASS: suíte solar concluída; capturas em ${output}`);
} finally {ws.close();}
