import assert from 'node:assert/strict';
import {mkdir, writeFile} from 'node:fs/promises';
const base = process.env.TEST_URL || 'http://127.0.0.1:3000';
const output = process.env.SCREENSHOT_DIR || '/tmp/ghc-checks';
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
  if (data.method==='Log.entryAdded' && data.params.entry.level==='error') errors.push(data.params.entry.text);
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
try {
  await send('Page.enable'); await send('Runtime.enable'); await send('Log.enable');
  await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
  await viewport(1440,900); await send('Page.navigate',{url:base}); await wait(500);
  await evaluate('document.fonts.ready');
  await evaluate('Promise.all([...document.images].map(i=>{i.loading="eager";return i.decode()}))');
  assert.match(await evaluate('document.title'),/G Hot e Cold/);
  assert.equal(await evaluate('document.querySelectorAll("h1").length'),1);
  assert.equal(await evaluate('document.querySelectorAll("header").length'),1);
  const matrix=[[1440,900],[1366,768],[1024,768],[768,1024],[390,844],[360,800],[320,700],[844,390]];
  for(const [w,h] of matrix){
    await viewport(w,h);await evaluate('scrollTo(0,0)');await wait(120);
    const r=await evaluate(`(() => {
      const images=[...document.querySelectorAll('main img')];
      return {overflow:document.documentElement.scrollWidth>innerWidth,
      images:images.every(i=>i.complete&&i.naturalWidth>0),
      contain:images.every(i=>getComputedStyle(i).objectFit==='contain'),
      ratio:images.every(i=>getComputedStyle(i).objectFit==='contain' || Math.abs(i.clientWidth/i.clientHeight-i.naturalWidth/i.naturalHeight)<.03),
      actions:[...document.querySelectorAll('.hero .actions a')].every(a=>{const r=a.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth}),
      scales:images.every(i=>getComputedStyle(i).transform==='none')};
    })()`);
    assert.equal(r.overflow,false,`${w}: overflow`);
    for(const key of ['images','contain','ratio','actions','scales'])assert.equal(r[key],true,`${w}: ${key}`);
    await screenshot(`${w}x${h}`);
    if(w===1440||w===390)await screenshot(`pagina-${w}`,true);
    console.log(`PASS: ${w}x${h}, imagens íntegras e proporcionais, sem zoom ou overflow`);
  }
  await viewport(390,844);
  await evaluate('document.querySelector(".menu-toggle").click()');
  assert.equal(await evaluate('document.querySelector(".menu-toggle").getAttribute("aria-expanded")'),'true');
  assert.equal(await evaluate('document.activeElement.getAttribute("href")'),'#inicio');
  await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape'});
  assert.equal(await evaluate('document.querySelector(".menu-toggle").getAttribute("aria-expanded")'),'false');
  assert.equal(await evaluate('document.activeElement.className'),'menu-toggle');
  await evaluate('document.querySelector("[data-interest=Refrigeração]").click()');
  assert.equal(await evaluate('document.querySelector("#interest").value'),'Refrigeração');
  await evaluate('document.querySelector("form").requestSubmit()');
  assert.equal(await evaluate('document.querySelectorAll("[aria-invalid=true]").length'),3);
  assert.equal(await evaluate('document.activeElement.id'),'name');
  await evaluate(`document.querySelector('#name').value='Teste de navegação';document.querySelector('#phone').value='11912345678';document.querySelector('#message').value='Gostaria de conversar sobre meu ambiente.';document.querySelector('form').requestSubmit()`);
  assert.equal(await evaluate('document.querySelector("#review").hidden'),false);
  assert.match(await evaluate('document.querySelector("#prepared").value'),/Refrigeração/);
  assert.match(await evaluate('document.querySelector("#form-status").textContent'),/nada foi enviado/);
  await evaluate('document.querySelector("[data-person=adriano]").click();document.querySelector("form").requestSubmit()');
  assert.match(await evaluate('document.querySelector("#prepared").value'),/Adriano/);
  await evaluate('document.querySelector("#name").value="";document.querySelector("form").requestSubmit()');
  assert.equal(await evaluate('document.querySelector("#phone").value'),'11912345678');
  assert.equal(await evaluate('Object.keys(localStorage).length'),0);
  console.log('PASS: menu por teclado e Escape, soluções e profissionais, validação, preservação dos dados, revisão sem envio');
  // Testa a construção do destino configurado sem abrir um canal externo.
  await evaluate(`window.GHC_CONFIG={whatsapp:'5511987654321'};window.__opened='';HTMLAnchorElement.prototype.click=function(){window.__opened=this.href}`);
  // Recarrega somente o script, mantendo a configuração controlada no contexto de teste.
  await evaluate(`fetch(${JSON.stringify(new URL('app.js', base).href)}).then(r=>r.text()).then(source=>{document.querySelector('#name').value='Teste';document.querySelector('form').replaceWith(document.querySelector('form').cloneNode(true));document.querySelector('#interest').value='Refrigeração';(0,eval)(source)})`);
  await evaluate('document.querySelector("form").requestSubmit()');
  assert.match(await evaluate('window.__opened'),/^https:\/\/wa\.me\/5511987654321\?text=/);
  assert.match(await evaluate('decodeURIComponent(window.__opened)'),/Gostaria de conversar/);
  console.log('PASS: destino WhatsApp configurado e mensagem codificada, sem envio externo');
  await send('Page.navigate',{url:base});await wait(300);
  await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'no-preference'}]});
  await viewport(1440,900);await send('Page.navigate',{url:base});await wait(450);
  assert.equal(await evaluate('document.querySelector("#brand-intro").hidden'),false);
  assert.match(await evaluate('document.querySelector(".intro-brand").textContent'),/Hot.*Cold/);
  await screenshot('entrada-marca-desktop');
  await wait(1800);
  assert.equal(await evaluate('document.querySelector("#brand-intro").hidden'),true);
  assert.equal(await evaluate('getComputedStyle(document.querySelector(".hero .scene-photo")).transform'),'none');
  assert.equal(await evaluate('getComputedStyle(document.querySelector("h1 span")).opacity'),'1');
  await screenshot('hero-apos-entrada');
  await viewport(390,844);await send('Page.navigate',{url:base});await wait(450);
  assert.equal(await evaluate('document.querySelector(".intro-brand").getBoundingClientRect().right<=innerWidth'),true);
  await screenshot('entrada-marca-mobile');
  await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape'});
  assert.equal(await evaluate('document.querySelector("#brand-intro").hidden'),true);
  console.log('PASS: entrada da logomarca e nome, desktop/mobile, encerramento automático e por teclado, Hero sem zoom');
  assert.equal(await evaluate('document.documentElement.classList.contains("motion")'),true);
  await evaluate('document.querySelector("#motion-toggle").click()');
  assert.equal(await evaluate('document.documentElement.classList.contains("motion-paused")'),true);
  await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
  assert.equal(await evaluate('getComputedStyle(document.querySelector("h1 span")).animationName'),'none');
  assert.equal(await evaluate('document.querySelector("#brand-intro").hidden'),true);
  for(const id of ['solucoes','equipe','contato']){await evaluate(`document.querySelector('#${id}').scrollIntoView()`);await wait(200);await screenshot(`section-${id}`);}
  console.log('PASS: animações, pausa manual e preferência por movimento reduzido');
  await send('Emulation.setScriptExecutionDisabled',{value:true});await send('Page.navigate',{url:base});await wait(400);
  assert.match(await evaluate('document.body.innerText'),/O clima ideal/);
  assert.equal(await evaluate('getComputedStyle(document.querySelector("h1")).opacity'),'1');
  assert.equal(await evaluate('document.querySelector("#navigation").hidden'),false);
  assert.equal(errors.length,0,errors.join(' | '));
  console.log('PASS: conteúdo e navegação sem JavaScript; nenhum erro de console');
  console.log(`Capturas: ${output}`);
} finally { await send('Emulation.setScriptExecutionDisabled',{value:false}).catch(()=>{});ws.close(); }
