import assert from 'node:assert/strict';
import {mkdir, writeFile} from 'node:fs/promises';
const base = process.env.TEST_URL || 'http://127.0.0.1:3000';
const output = process.env.SCREENSHOT_DIR || '/tmp/estetica-checks';
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
  await viewport(1440,900);
  await send('Page.navigate',{url:base}); await wait(500);
  await evaluate('document.fonts.ready');
  await evaluate('Promise.all([...document.images].map(i=>{i.loading="eager";return i.decode()}))');
  assert.match(await evaluate('document.title'),/Estética Automotiva/);
  assert.equal(await evaluate('document.fonts.check("700 30px Manrope")'),true);
  const matrix=[[1920,1080],[1440,900],[1366,768],[1280,720],[1024,768],[768,1024],[390,844],[360,800]];
  for(const [width,height] of matrix) {
    await viewport(width,height); await evaluate('scrollTo(0,0)'); await wait(100);
    const result=await evaluate(`(() => {
      const rect=s=>document.querySelector(s).getBoundingClientRect();
      const within=r=>r.top>=-1 && r.left>=-1 && r.right<=innerWidth+1 && r.bottom<=innerHeight+1;
      const img=document.querySelector('.hero-media img'), photo=img.getBoundingClientRect();
      const stage=rect('.hero-media'), fold=rect('.first-fold');
      return {
        noOverflow:document.documentElement.scrollWidth<=innerWidth,
        visible:['.site-header','h1','.hero-subtitle','.hero-actions .button','.hero-actions .text-link'].every(s=>within(rect(s))),
        photoVisible:within(photo),
        contain:getComputedStyle(img).objectFit==='contain',
        noDistortion:Math.abs(photo.width/photo.height-img.naturalWidth/img.naturalHeight)<.02,
        carSafe:photo.top+photo.height*.04>=stage.top && photo.bottom-photo.height*.07<=fold.bottom,
        foldNoScroll:document.querySelector('.first-fold').scrollHeight<=fold.height+1,
        normalScrolling:![document.body,document.documentElement].some(e=>['hidden','clip'].includes(getComputedStyle(e).overflowY))
      };
    })()`);
    for(const [check,passed] of Object.entries(result)) assert.equal(passed,true,`${width}x${height}: ${check}`);
    await screenshot(`${width}x${height}`);
    if(width===1440||width===390) await screenshot(`pagina-${width}`,true);
    console.log(`PASS: ${width}x${height} — cabeçalho, copy, CTAs e foto inteira na primeira tela; sem overflow ou distorção`);
  }
  // Reflow equivalente a 200% em um viewport físico de 1440x900.
  await viewport(720,450);
  assert.equal(await evaluate('document.documentElement.scrollWidth<=innerWidth'),true,'reflow 200%');
  await evaluate('document.querySelector(".contact-button").scrollIntoView({block:"center"})');
  assert.equal(await evaluate('document.querySelector(".contact-button").getBoundingClientRect().bottom<=innerHeight'),true,'CTA acessível no reflow');
  await screenshot('zoom-200-equivalente',true);
  console.log('PASS: reflow equivalente a zoom 200% (720x450 em 1440x900), conteúdo e CTA acessíveis');
  for(const [width,height] of [[320,700],[844,390],[1280,480]]) {
    await viewport(width,height);
    assert.equal(await evaluate('document.documentElement.scrollWidth<=innerWidth'),true,`tela baixa/estreita ${width}`);
    await evaluate('document.querySelector(".contact-button").scrollIntoView({block:"center"})');
    assert.equal(await evaluate('document.querySelector(".contact-button").getBoundingClientRect().bottom<=innerHeight'),true);
  }
  console.log('PASS: 320px e landscape baixo, com crescimento natural da página');

  await viewport(390,844); await evaluate('scrollTo(0,0)');
  assert.equal(await evaluate('getComputedStyle(document.getElementById("navigation")).display'), 'none');
  await evaluate('document.querySelector(".menu-toggle").focus()');
  await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Enter',code:'Enter',windowsVirtualKeyCode:13,text:'\r',unmodifiedText:'\r'});
  await send('Input.dispatchKeyEvent',{type:'keyUp',key:'Enter',code:'Enter',windowsVirtualKeyCode:13});
  assert.equal(await evaluate('document.querySelector(".menu-toggle").getAttribute("aria-expanded")'),'true');
  await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Tab',code:'Tab',windowsVirtualKeyCode:9});
  assert.equal(await evaluate('document.activeElement.getAttribute("href")'),'#inicio');
  assert.equal(await evaluate('getComputedStyle(document.activeElement).outlineStyle'),'solid');
  await screenshot('menu-foco');
  await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});
  assert.equal(await evaluate('document.activeElement.className'),'menu-toggle');
  assert.equal(await evaluate('document.querySelector(".menu-toggle").getAttribute("aria-expanded")'),'false');
  await evaluate(`document.querySelector('.menu-toggle').click();document.querySelector('#navigation a[href="#servicos"]').click()`);
  assert.equal(await evaluate('document.querySelector(".menu-toggle").getAttribute("aria-expanded")'),'false');
  console.log('PASS: menu por teclado, foco visível, Escape e fechamento por navegação');

  for(const section of ['inicio','servicos','sobre','processo','contato']) {
    await evaluate(`document.getElementById('${section}').scrollIntoView()`); await wait(40);
    assert.equal(await evaluate(`document.getElementById('${section}').getBoundingClientRect().top>=-1`),true,`âncora ${section}`);
  }
  assert.equal(await evaluate('[...document.querySelectorAll("a")].filter(a=>a.hash).every(a=>document.getElementById(a.hash.slice(1)))'),true);
  assert.equal(await evaluate('[...document.images].every(i=>i.complete&&i.naturalWidth>0)'),true);
  assert.equal(await evaluate('document.querySelectorAll(".process-steps li").length'),4);
  assert.equal(await evaluate('document.querySelectorAll(".service-card").length'),3);
  assert.equal(await evaluate(`document.querySelectorAll('a[href*="wa.me"]').length`),0,'nenhum telefone inventado');
  for (const service of ['Lavagem detalhada','Polimento','Higienização interna']) {
    await evaluate(`document.querySelector('[data-service="${service}"]').click()`);
    assert.match(await evaluate('document.getElementById("selected-service").textContent'),new RegExp(service));
    assert.equal(await evaluate('location.hash'),'#contato');
  }
  await evaluate('document.querySelector("[data-whatsapp]").click()');
  assert.equal(await evaluate('location.hash'),'#contact-status');
  assert.match(await evaluate('document.getElementById("contact-status").textContent'),/ainda não foi configurado/);
  assert.equal(await evaluate('getComputedStyle(document.documentElement).scrollBehavior'),'auto');
  assert.equal(await evaluate('document.getAnimations().filter(a=>a.playState==="running").length'),0);
  console.log('PASS: imagens, âncoras, quatro etapas, seleção de serviços e contato honestamente pendente; movimento reduzido');

  // Confirma melhoria progressiva sem executar JavaScript da página.
  await send('Emulation.setScriptExecutionDisabled',{value:true});
  await send('Page.reload'); await wait(300);
  assert.equal(await evaluate('getComputedStyle(document.getElementById("navigation")).display!=="none"'),true);
  assert.equal(await evaluate('getComputedStyle(document.querySelector("h1")).visibility'),'visible');
  await send('Emulation.setScriptExecutionDisabled',{value:false});
  assert.deepEqual(errors,[],'console limpo');
  console.log('PASS: conteúdo e navegação disponíveis sem JavaScript; sem erros de console');
  // Motion is tested with the real browser timeline, not only static CSS.
  await send('Page.addScriptToEvaluateOnNewDocument',{source:`
    window.motionShifts=[];
    new PerformanceObserver(list=>{
      for(const entry of list.getEntries()) if(!entry.hadRecentInput) window.motionShifts.push(entry.value);
    }).observe({type:'layout-shift',buffered:true});
  `});
  await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'no-preference'}]});
  for(const [width,height] of [[1920,1080],[1440,900],[1366,768],[390,844],[360,800]]) {
    await viewport(width,height);
    await send('Page.navigate',{url:base});
    await evaluate(`new Promise(resolve=>{
      const check=()=>document.querySelector('.hero-media img')&&document.documentElement.classList.contains('motion-active') ? resolve() : setTimeout(check,10);
      check();
    })`);
    const timing=await evaluate(`document.getAnimations().filter(a=>a.id.startsWith('hero-')).map(a=>({id:a.id,delay:a.effect.getTiming().delay,duration:a.effect.getTiming().duration}))`);
    assert.equal(timing.length,6,`entradas da hero ${width}`);
    assert.ok(Math.max(...timing.map(t=>t.delay+t.duration))<=1000,'coreografia termina em 1s');
    const samples=await evaluate(`new Promise(resolve=>{
      const start=performance.now();let samples=0,overflow=false,cut=false;
      function sample(){
        samples++;
        overflow ||= document.documentElement.scrollWidth>innerWidth;
        const image=document.querySelector('.hero-media img').getBoundingClientRect();
        const car={top:image.top+image.height*.04,bottom:image.bottom-image.height*.07,left:image.left+image.width*.07,right:image.right-image.width*.09};
        const copy=['.site-header','h1','.hero-subtitle','.hero-actions'].map(s=>document.querySelector(s).getBoundingClientRect());
        cut ||= car.top<0||car.bottom>innerHeight||car.left<0||car.right>innerWidth||copy.some(r=>r.top<0||r.bottom>innerHeight||r.left<0||r.right>innerWidth);
        if(performance.now()-start<1100) requestAnimationFrame(sample);
        else resolve({samples,overflow,cut,shifts:window.motionShifts.reduce((a,b)=>a+b,0)});
      }
      requestAnimationFrame(sample);
    })`);
    assert.equal(samples.overflow,false,`overflow durante movimento ${width}`);
    assert.equal(samples.cut,false,`carro/copy durante movimento ${width}`);
    assert.ok(samples.samples>10,'quadros efetivamente observados');
    assert.ok(samples.shifts<.01,`layout shift inesperado: ${samples.shifts}`);
    await screenshot(`movimento-${width}`);
    console.log(`PASS: movimento ${width}x${height} — ${samples.samples} quadros sem cortes ou overflow; layout shift ${samples.shifts.toFixed(4)}`);
  }
  await viewport(1440,900);
  await send('Page.navigate',{url:base});await wait(1050);
  await send('Input.dispatchMouseEvent',{type:'mouseMoved',x:1380,y:500});await wait(450);
  const pointer=await evaluate(`({fine:matchMedia('(min-width:901px) and (hover:hover) and (pointer:fine)').matches,x:parseFloat(document.querySelector('.hero-media img').style.getPropertyValue('--pointer-x'))||0,y:parseFloat(document.querySelector('.hero-media img').style.getPropertyValue('--pointer-y'))||0})`);
  assert.equal(pointer.fine,true);
  assert.ok(Math.abs(pointer.x)>0&&Math.abs(pointer.x)<=4&&Math.abs(pointer.y)<=2,'parallax leve do mouse');
  await evaluate(`document.querySelector('.service-grid').scrollIntoView({block:'center',behavior:'instant'})`);await wait(80);
  const cards=await evaluate(`document.getAnimations().filter(a=>a.id.startsWith('service-card-')).map(a=>a.effect.getTiming().delay).sort((a,b)=>a-b)`);
  assert.deepEqual(cards,[0,100,200],'cards em sequência');
  assert.equal(await evaluate(`getComputedStyle(document.querySelector('.hero-light')).animationPlayState`),'paused','luz pausada fora da tela');
  await wait(800);
  const cardRect=await evaluate(`document.querySelector('.service-card').getBoundingClientRect().toJSON()`);
  await send('Input.dispatchMouseEvent',{type:'mouseMoved',x:Math.round(cardRect.x+cardRect.width/2),y:Math.round(cardRect.y+80)});await wait(720);
  assert.match(await evaluate(`getComputedStyle(document.querySelector('.service-photo img')).transform`),/1.03/,'zoom discreto da foto');
  assert.equal(await evaluate('document.documentElement.scrollWidth<=innerWidth'),true);
  await screenshot('card-hover');
  await evaluate(`document.querySelector('.service-card a').focus()`);
  assert.equal(await evaluate(`getComputedStyle(document.activeElement).outlineStyle`),'solid');
  await screenshot('card-foco');
  await evaluate(`document.querySelector('.about').scrollIntoView({block:'center',behavior:'instant'})`);await wait(700);
  const drift=await evaluate(`parseFloat(document.querySelector('.about-photo img').style.getPropertyValue('--photo-drift'))||0`);
  assert.ok(Math.abs(drift)<=6,'parallax da foto limitado a 12px no total');
  await screenshot('sobre-movimento');
  await evaluate(`document.querySelector('.process-steps').scrollIntoView({block:'center',behavior:'instant'})`);await wait(80);
  const processTiming=await evaluate(`document.getAnimations().filter(a=>a.id.startsWith('process-description-')).map(a=>a.effect.getTiming()).map(t=>t.delay+t.duration)`);
  assert.equal(processTiming.length,4);
  assert.ok(Math.max(...processTiming)>=800&&Math.max(...processTiming)<=1200,'processo entre .8s e 1.2s');
  await screenshot('processo-durante');
  await wait(1100);await screenshot('processo-final');
  await evaluate(`document.querySelector('.service-grid').scrollIntoView({behavior:'instant'})`);await wait(50);
  await evaluate(`document.querySelector('.process-steps').scrollIntoView({behavior:'instant'})`);await wait(80);
  assert.equal(await evaluate(`document.getAnimations().filter(a=>a.id.startsWith('process-description-')&&a.playState==='running').length`),0,'revelação não repete');
  await evaluate(`document.querySelector('[data-motion-toggle]').click()`);
  assert.equal(await evaluate(`document.documentElement.classList.contains('motion-paused')`),true);
  assert.equal(await evaluate(`document.getAnimations().filter(a=>a.playState==='running').length`),0,'pausa cancela movimentos');
  await evaluate(`document.querySelector('[data-motion-toggle]').click()`);
  await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});await wait(50);
  assert.equal(await evaluate(`document.getAnimations().filter(a=>a.playState==='running').length`),0,'mudança dinâmica para movimento reduzido');
  assert.equal(await evaluate(`getComputedStyle(document.querySelector('[data-motion-toggle]')).display`),'none');
  assert.deepEqual(errors,[],'console limpo também com movimento');
  console.log('PASS: parallax limitado, hover/foco, linha e etapas sincronizadas, revelação única, pausa manual e movimento reduzido dinâmico');
  console.log(`Capturas desta execução: ${output}`);
} finally {
  await send('Page.close').catch(()=>{}); ws.close();
}
