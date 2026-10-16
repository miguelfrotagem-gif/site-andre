import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
// Uma aba isolada evita interferência de capturas e verificações anteriores.
const target = await (await fetch('http://127.0.0.1:9222/json/new?about:blank', {method:'PUT'})).json();
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise(resolve=>ws.addEventListener('open',resolve,{once:true}));
let id=0;const pending=new Map();const errors=[];
ws.addEventListener('message',event=>{const data=JSON.parse(event.data);if(data.id){const p=pending.get(data.id);if(!p)return;pending.delete(data.id);if(data.error)p.reject(new Error(data.error.message));else p.resolve(data.result);}if(data.method==='Runtime.exceptionThrown')errors.push(data.params.exceptionDetails.text);});
function send(method,params={}){return new Promise((resolve,reject)=>{
 const messageId=++id;
 const timer=setTimeout(()=>{pending.delete(messageId);reject(new Error(`Tempo excedido em ${method}`));},10000);
 pending.set(messageId,{resolve:value=>{clearTimeout(timer);resolve(value)},reject:error=>{clearTimeout(timer);reject(error)}});
 ws.send(JSON.stringify({id:messageId,method,params}));
});}
async function evaluate(expression){const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw new Error(JSON.stringify(r.exceptionDetails));return r.result.value;}
const wait=ms=>new Promise(r=>setTimeout(r,ms));
async function reloadPage() {
 let handler;
 let timeout;
 const loaded=new Promise((resolve,reject)=>{
  handler=event=>{if(JSON.parse(event.data).method==='Page.loadEventFired'){clearTimeout(timeout);ws.removeEventListener('message',handler);resolve();}};
  ws.addEventListener('message',handler);
  timeout=setTimeout(()=>{ws.removeEventListener('message',handler);reject(new Error('A página não terminou de carregar'));},10000);
 });
 await send('Page.reload');await loaded;
}
try {
await send('Page.enable');await send('Runtime.enable');await send('Page.bringToFront');
await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
await send('Page.navigate',{url:process.env.TEST_URL || 'http://127.0.0.1:3000'});await wait(1200);
assert.equal(await evaluate('document.title.includes("GJ Ar Condicionado")'),true);
for(const width of [1440,1366,768,390,360,320]){
await send('Emulation.setDeviceMetricsOverride',{width,height:width>=1000?768:width===768?1024:800,deviceScaleFactor:1,mobile:width<761});await wait(150);
assert.equal(await evaluate('document.documentElement.scrollWidth <= innerWidth'),true,`overflow ${width}`);
if(width===1440||width===390){const shot=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});await writeFile(`/tmp/gj-${width}.png`,Buffer.from(shot.data,'base64'));}
}
console.log('PASS: layouts 1440, 1366, 768, 390, 360 e 320px sem overflow');
await evaluate('Promise.all(Array.from(document.images).map(i=>{i.loading="eager";return i.decode()}))');
assert.equal(await evaluate('Array.from(document.images).every(i=>i.complete && i.naturalWidth>0)'),true,'imagens');
assert.equal(await evaluate('Array.from(document.querySelectorAll("a")).every(a=>a.hasAttribute("href") && a.getAttribute("href")!=="#")'),true,'links');
assert.equal(await evaluate('Array.from(document.querySelectorAll("a")).filter(a=>a.hash).every(a=>document.getElementById(a.hash.slice(1)))'),true,'âncoras');
console.log('PASS: imagens e destinos de todos os links');
assert.equal(await evaluate('getComputedStyle(document.querySelector(".hero-copy .text-link")).fontSize'), '16px');
assert.equal(await evaluate('document.querySelector(".hero-copy .text-link").getBoundingClientRect().height >= 44'),true);
for (const section of ['servicos','manutencao','empresa','contato']) {
 await evaluate(`document.getElementById('${section}').scrollIntoView({behavior:'instant'})`);await wait(80);
 assert.equal(await evaluate(`document.getElementById('${section}').getBoundingClientRect().top >= document.querySelector('header').getBoundingClientRect().bottom - 1`),true,`âncora ${section}`);
}
console.log('PASS: link secundário legível e âncoras abaixo do cabeçalho');

await evaluate('document.querySelector(".menu-toggle").click()');assert.equal(await evaluate('document.querySelector(".menu-toggle").getAttribute("aria-expanded")'),'true');
await evaluate('Array.from(document.querySelectorAll("#navigation a")).find(a=>a.hash==="#contato").click()');assert.equal(await evaluate('document.querySelector(".menu-toggle").getAttribute("aria-expanded")'),'false');
await evaluate('document.querySelector(".menu-toggle").click();document.dispatchEvent(new KeyboardEvent("keydown",{key:"Escape"}))');assert.equal(await evaluate('document.activeElement.className'),'menu-toggle');
console.log('PASS: menu abre, fecha por navegação e Escape devolve foco');
assert.equal(await evaluate('document.getElementById("orcamento") === null && document.querySelector("form") === null'),true);
const links = await evaluate('Array.from(document.querySelectorAll("[data-wa]")).map(a=>({type:a.dataset.wa,href:a.href}))');
assert.equal(await evaluate('window.GJ_CONFIG.whatsapp'),'+55 61 9399-5799');
assert.equal(await evaluate('Array.from(document.querySelectorAll("[data-contact-phone]")).every(e=>e.textContent===window.GJ_CONFIG.whatsapp)'),true);
for (const link of links) { const url = new URL(link.href); assert.equal(url.origin, 'https://wa.me'); assert.equal(url.pathname, '/556193995799'); assert.ok(url.searchParams.get('text')); }
assert.notEqual(links.find(l=>l.type==='orcamento').href,links.find(l=>l.type==='encomendas').href);
console.log('PASS: seção removida, sem âncoras órfãs e links WhatsApp com mensagens por serviço');
assert.match(new URL(links.find(l=>l.type==='agendamento').href).searchParams.get('text'),/agendar/);
await evaluate('document.getElementById("manutencao").scrollIntoView()');await wait(150);
assert.equal(await evaluate('Array.from(document.querySelectorAll("#navigation a")).find(a=>a.hash==="#manutencao").getAttribute("aria-current")'),'location');
console.log('PASS: seção Manutenção tem agendamento e destaque ativo no menu');
assert.equal(await evaluate('getComputedStyle(document.querySelector(".route-line i")).animationName'),'none');
console.log('PASS: preferência de movimento reduzido');
await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'no-preference'}]});
await evaluate('sessionStorage.removeItem("gj-intro-seen")');
await reloadPage();await wait(100);
assert.equal(await evaluate('document.querySelector("#brand-intro").hidden'),false);
await wait(3000);
assert.equal(await evaluate('document.querySelector("#brand-intro").hidden'),true);
await reloadPage();await wait(100);
assert.equal(await evaluate('document.querySelector("#brand-intro").hidden'),true);
await evaluate('sessionStorage.removeItem("gj-intro-seen")');
await reloadPage();await wait(100);
await evaluate('document.querySelector(".intro-skip").click()');
assert.equal(await evaluate('document.querySelector("#brand-intro").hidden'),true);
console.log('PASS: abertura encerra, aparece uma vez por sessão e permite pular');
assert.deepEqual(errors,[]);console.log('PASS: sem exceções JavaScript');
} finally {await send('Page.close').catch(()=>{});ws.close();}
