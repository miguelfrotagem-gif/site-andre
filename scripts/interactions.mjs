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
const ids=['inicio','solucoes','como-funciona','projetos','duvidas','contato'];
async function assertActive(expected, label='') {
 assert.deepEqual(await evaluate(`[...document.querySelectorAll('#navigation [aria-current]')].map(a=>[a.hash,a.getAttribute('aria-current')])`), [[`#${expected}`,'location']], label);
}
async function readyScene() {
 await wait(80); // Let picture resolve a new responsive source before decode().
 await evaluate(`(async()=>{const i=document.querySelector('.solution-camera');i.loading='eager';await i.decode();await document.fonts.ready})()`);
 await wait(70);
}
async function geometry() {
 return evaluate(`(()=>{const s=document.querySelector('#solucoes');return [s,document.querySelector('#solution-scene'),...s.querySelectorAll('h2,[data-solution],#solution-cta,#solution-overview')].map(e=>{const r=e.getBoundingClientRect();return [r.left+scrollX,r.top+scrollY,r.width,r.height]})})()`);
}
function stable(before, after, label) {
 before.forEach((r,i)=>r.forEach((v,j)=>assert.ok(Math.abs(v-after[i][j])<1,`${label}: caixa ${i}, dimensão ${j}: ${v} / ${after[i][j]}`)));
}
async function swipe(startY, distance) {
 const point = y => [{x:280,y,id:0,radiusX:1,radiusY:1,force:1}];
 await send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:point(startY)});
 for(let n=1;n<=8;n++){
  await send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:point(startY+distance*n/8)});await wait(25);
 }
 await wait(180); // Lift at rest so the assertion is independent of momentum.
 await send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await wait(60);
}
async function assertFrame(value, width) {
 const frame=await evaluate(`(()=>{const p=document.querySelector('#solution-scene'),i=p.querySelector('img'),r=p.getBoundingClientRect(),ir=i.getBoundingClientRect(),m=new DOMMatrixReadOnly(getComputedStyle(i).transform),variant=SOLAR_CONFIG.solutionScene[innerWidth<1024?'mobile':'desktop'],t=variant.targets['${value}'];return {matrix:[m.a,m.b,m.c,m.d],coverage:ir.left<=r.left+1&&ir.top<=r.top+1&&ir.right>=r.right-1&&ir.bottom>=r.bottom-1,region:ir.left+t.region[0]*ir.width>=r.left-1&&ir.top+t.region[1]*ir.height>=r.top-1&&ir.left+t.region[2]*ir.width<=r.right+1&&ir.top+t.region[3]*ir.height<=r.bottom+1,center:[(ir.left+t.center[0]*ir.width-r.left)/r.width,(ir.top+t.center[1]*ir.height-r.top)/r.height],pressed:[...document.querySelectorAll('[data-solution][aria-pressed=true]')].map(b=>b.dataset.solution),clipped:getComputedStyle(p).overflowX==='clip',others:[...document.querySelectorAll('.scene-visual img:not(.solution-camera),.site-header,.section-content')].every(e=>getComputedStyle(e).transform==='none'),noOverflow:document.documentElement.scrollWidth<=innerWidth}})()`);
 assert.deepEqual(frame.pressed,[value]);
 assert.ok(frame.matrix[0]>1&&frame.matrix[0]<=1.91);
 assert.equal(frame.matrix[0],frame.matrix[3]);assert.equal(frame.matrix[1],0);assert.equal(frame.matrix[2],0);
 for(const k of ['coverage','region','clipped','others','noOverflow'])assert.equal(frame[k],true,`${width} ${value}: ${k}`);
 assert.ok(frame.center[0]>(width<1024?.3:.62)&&frame.center[0]<.86,`${width} ${value}: centro horizontal`);
 assert.ok(frame.center[1]>.48&&frame.center[1]<.78,`${width} ${value}: centro vertical`);
 return frame.matrix[0];
}
try {
 await send('Page.enable');await send('Runtime.enable');await send('Log.enable');await send('Page.bringToFront');
 const {windowId}=await send('Browser.getWindowForTarget',{targetId:target.id});await send('Browser.setWindowBounds',{windowId,bounds:{width:2000,height:1200}});
 await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
 await viewport(1366,768);await send('Page.navigate',{url:base});await wait(350);await readyScene();
 assert.equal(await evaluate(`new Set([...document.querySelectorAll('[id]')].map(e=>e.id)).size===document.querySelectorAll('[id]').length`),true,'IDs únicos');
 assert.deepEqual(await evaluate(`document.querySelectorAll('[data-solution][aria-pressed=true]').length`),0,'visão geral inicial');
 assert.equal(await evaluate(`getComputedStyle(document.querySelector('.solution-camera')).transform`),'none','sem aproximação de entrada');
 for(const [width,height] of [[1366,768],[390,844],[1280,480]]){
  await viewport(width,height);await readyScene();
  for(const id of [...ids,...ids.slice().reverse()]){
   await evaluate(`document.querySelector('#${id}').scrollIntoView({behavior:'instant'})`);await wait(45);
   await assertActive(id,`${width}: descida/subida ${id}`);
  }
  for(let n=1;n<ids.length;n++){
   for(const [offset,expected] of [[-8,ids[n-1]],[8,ids[n]]]){
    await evaluate(`(()=>{const h=document.querySelector('.site-header').getBoundingClientRect().height,line=h+(innerHeight-h)*.25,s=document.querySelector('#${ids[n]}');scrollTo({top:s.getBoundingClientRect().top+scrollY-line+${offset},behavior:'instant'})})()`);await wait(40);
    await assertActive(expected,`${width}: linha de leitura ${ids[n]} ${offset}`);
   }
  }
 }
 console.log('PASS: scrollspy nas seis seções, descida/subida e transições na linha de leitura, incluindo alturas diferentes e desktop baixo');
 await viewport(1366,768);await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'no-preference'}]});
 await evaluate(`scrollTo({top:0,behavior:'instant'})`);await wait(60);
 assert.equal(await evaluate(`(()=>{document.querySelector('#navigation a[href="#contato"]').click();return document.querySelector('#navigation [aria-current]').hash})()`),'#contato','destaque imediato ao clicar');
 await wait(850);await assertActive('contato');
 await send('Input.synthesizeScrollGesture',{x:500,y:400,yDistance:720,speed:1800,gestureSourceType:'mouse'});await wait(250);await assertActive('duvidas','roda após clique libera destino anterior');
 await evaluate(`document.querySelector('#navigation a[href="#inicio"]').click()`);await wait(850);await assertActive('inicio');
 await evaluate(`document.querySelector('#navigation a[href="#contato"]').click()`);await wait(30);
 await send('Input.synthesizeScrollGesture',{x:500,y:400,yDistance:500,speed:1800,gestureSourceType:'mouse'});await wait(100);
 assert.equal(await evaluate(`(()=>{const h=document.querySelector('.site-header').getBoundingClientRect().height,line=h+(innerHeight-h)*.25,s=[...document.querySelectorAll('main>section')].find(s=>{const r=s.getBoundingClientRect();return r.top<=line&&r.bottom>line});return document.querySelector('#navigation [aria-current]').hash==='#'+s.id})()`),true,'interrupção manual segue a seção em leitura');
 await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
 await viewport(390,844);await readyScene();
 await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
 await send('Emulation.setTouchEmulationEnabled',{enabled:true});await wait(100);
 await evaluate(`document.querySelector('#solucoes').scrollIntoView({behavior:'instant'})`);await wait(70);
 for(let n=0;n<3;n++)await swipe(650,-400);await wait(100);
 await assertActive('como-funciona','rolagem por toque para baixo');
 for(let n=0;n<3;n++)await swipe(180,400);await wait(100);
 await assertActive('solucoes','rolagem por toque para cima');
 await send('Emulation.setTouchEmulationEnabled',{enabled:false});
 console.log('PASS: clique imediato, scroll suave, roda após clique, interrupção manual e gesto de toque nos dois sentidos');
 for(const [width,height] of [[1100,760],[1366,768],[1440,900],[1920,1080],[360,800],[390,844],[768,1024],[1280,480]]){
  await viewport(width,height);await readyScene();
  await evaluate(`document.querySelector('#solution-overview').click();document.querySelector('#solucoes').scrollIntoView({behavior:'instant'})`);await wait(50);
  const before=await geometry(),source=await evaluate(`document.querySelector('.solution-camera').currentSrc`);
  const zooms=[];
  for(const [value,fragment] of [['residencial','sua casa'],['empresarial','sua empresa'],['rural','campo']]){
   await evaluate(`document.querySelector('[data-solution="${value}"]').focus({preventScroll:true});document.querySelector('[data-solution="${value}"]').click()`);await wait(50);
   zooms.push(await assertFrame(value,width));
   stable(before,await geometry(),`${width}: seleção ${value} sem salto`);
   assert.equal(await evaluate(`document.activeElement.dataset.solution`),value,'foco permanece no controle');
   assert.match(await evaluate(`document.querySelector('#solution-summary').textContent`),new RegExp(fragment));
   assert.equal(await evaluate(`document.querySelector('.solution-camera').currentSrc`),source,'mesma paisagem');
   await screenshot(`camera-${value}-${width}x${height}`);
  }
  assert.equal(new Set(zooms).size,3,'aproximações distintas');
  const scrollBefore=await evaluate('scrollY');
  await evaluate(`document.querySelector('#solution-overview').click()`);await wait(50);
  assert.equal(await evaluate(`getComputedStyle(document.querySelector('.solution-camera')).transform`),'none');
  assert.equal(await evaluate(`document.querySelectorAll('[data-solution][aria-pressed=true]').length`),0);
  assert.equal(await evaluate('scrollY'),scrollBefore,'visão geral não troca de seção');
  stable(before,await geometry(),`${width}: reset sem salto`);
  if(width>=1100&&height>=760)assert.equal(await evaluate(`Math.abs(document.querySelector('#solucoes').getBoundingClientRect().height-(innerHeight-document.querySelector('.site-header').getBoundingClientRect().height))<1`),true,'seção desktop completa');
  console.log(`PASS: ${width}x${height}, três alvos inteiros, sem bordas vazias, mesma paisagem, controles estáveis e reset`);
 }
 // Real pointer on mobile brings an offscreen landscape back into view, without focusing it.
 await viewport(390,844);await readyScene();
 await evaluate(`document.querySelector('[data-solution="empresarial"]').scrollIntoView({block:'center',behavior:'instant'})`);await wait(50);
 const point=await evaluate(`(()=>{const r=document.querySelector('[data-solution="empresarial"]').getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height/2}})()`);
 await send('Input.dispatchMouseEvent',{type:'mousePressed',button:'left',clickCount:1,...point});await send('Input.dispatchMouseEvent',{type:'mouseReleased',button:'left',clickCount:1,...point});await wait(100);
 assert.equal(await evaluate(`document.querySelector('#solution-scene').getBoundingClientRect().bottom>innerHeight*.6`),true,'cena de volta à área visível no toque/clique mobile');
 assert.equal(await evaluate(`document.activeElement.dataset.solution`),'empresarial','sem deslocamento de foco para a foto');
 await viewport(1366,768);await readyScene();await evaluate(`document.querySelector('#solution-overview').click();document.querySelector('#solucoes').scrollIntoView({behavior:'instant'})`);await wait(50);
 await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'no-preference'}]});await wait(70);
 const before=await geometry();
 await evaluate(`document.querySelector('[data-solution="residencial"]').click()`);await wait(120);
 const mid=await evaluate(`new DOMMatrixReadOnly(getComputedStyle(document.querySelector('.solution-camera')).transform).a`);
 assert.ok(mid>1&&mid<1.38,'transição de câmera real');
 await evaluate(`document.querySelector('[data-solution="empresarial"]').click()`);await wait(80);
 const changing=await evaluate(`new DOMMatrixReadOnly(getComputedStyle(document.querySelector('.solution-camera')).transform).a`);
 await evaluate(`document.querySelector('[data-solution="rural"]').click()`);await wait(20);
 assert.ok(await evaluate(`new DOMMatrixReadOnly(getComputedStyle(document.querySelector('.solution-camera')).transform).a`)>=changing-.01,'parte do enquadramento atual');
 for(let n=0;n<13;n++){
  assert.equal(await evaluate(`(()=>{const p=document.querySelector('#solution-scene').getBoundingClientRect(),i=document.querySelector('.solution-camera').getBoundingClientRect();return i.left<=p.left+1&&i.right>=p.right-1&&i.top<=p.top+1&&i.bottom>=p.bottom-1})()`),true,'sem vazio durante a transição');
  assert.ok(await evaluate(`document.querySelector('.solution-camera').getAnimations().length`)<=1,'sem fila de animações');
  stable(before,await geometry(),'troca rápida sem salto');await wait(65);
 }
 await assertFrame('rural',1366);
 await evaluate(`document.querySelector('[data-solution="empresarial"]').click()`);await wait(80);
 await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});await wait(50);
 await assertFrame('empresarial',1366);
 assert.equal(await evaluate(`document.querySelector('.solution-camera').getAnimations().length`),0,'movimento reduzido interrompe imediatamente');
 await viewport(390,844);await readyScene();await assertFrame('empresarial',390);
 await viewport(1920,1080);await readyScene();await assertFrame('empresarial',1920);
 console.log('PASS: ponteiro mobile com cena visível, troca rápida sem retorno à visão geral/fila, cobertura durante animação, movimento reduzido e recálculo de alvos ao redimensionar');
 await send('Page.navigate',{url:base+'#solucoes'});await wait(100);await assertFrame('empresarial',1920);
 await send('Page.navigate',{url:'about:blank'});await wait(50);
 await send('Page.navigate',{url:base+'#solucoes'});await wait(350);await readyScene();await assertActive('solucoes','entrada direta pelo link da seção');
 assert.equal(await evaluate(`getComputedStyle(document.querySelector('.solution-camera')).transform`),'none','link direto não inicia zoom');
 console.log('PASS: navegação interna preserva a escolha; entrada direta nova em Soluções começa na visão geral e destaca o menu correto');
 assert.deepEqual(errors,[],'erros no navegador');
}finally{ws.close();await fetch('http://127.0.0.1:9222/json/close/'+target.id).catch(()=>{});}
