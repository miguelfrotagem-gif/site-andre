import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
const targets = await (await fetch('http://127.0.0.1:9222/json')).json();
const target = targets.find(t=>t.type==='page');
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise(resolve=>ws.addEventListener('open',resolve,{once:true}));
let id=0;const pending=new Map();const errors=[];
ws.addEventListener('message',event=>{const data=JSON.parse(event.data);if(data.id){const p=pending.get(data.id);pending.delete(data.id);if(data.error)p.reject(new Error(data.error.message));else p.resolve(data.result);}if(data.method==='Runtime.exceptionThrown')errors.push(data.params.exceptionDetails.text);});
function send(method,params={}){return new Promise((resolve,reject)=>{pending.set(++id,{resolve,reject});ws.send(JSON.stringify({id,method,params}));});}
async function evaluate(expression){const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw new Error(JSON.stringify(r.exceptionDetails));return r.result.value;}
const wait=ms=>new Promise(r=>setTimeout(r,ms));
try {
await send('Page.enable');await send('Runtime.enable');
await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
await send('Page.navigate',{url:process.env.TEST_URL || 'http://127.0.0.1:3000'});await wait(1200);
assert.equal(await evaluate('document.title.includes("GJ Ar Condicionado")'),true);
for(const width of [1440,1024,768,390,320]){
await send('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:width<761});await wait(150);
assert.equal(await evaluate('document.documentElement.scrollWidth <= innerWidth'),true,`overflow ${width}`);
if(width===1440||width===390){const shot=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});await writeFile(`/tmp/gj-${width}.png`,Buffer.from(shot.data,'base64'));}
}
console.log('PASS: layouts 1440, 1024, 768, 390 e 320px sem overflow');
assert.equal(await evaluate('Array.from(document.images).every(i=>i.complete && i.naturalWidth>0)'),true,'imagens');
assert.equal(await evaluate('Array.from(document.querySelectorAll("a")).every(a=>a.hasAttribute("href") && a.getAttribute("href")!=="#")'),true,'links');
assert.equal(await evaluate('Array.from(document.querySelectorAll("a")).filter(a=>a.hash).every(a=>document.getElementById(a.hash.slice(1)))'),true,'âncoras');
console.log('PASS: imagens e destinos de todos os links');
await evaluate('document.querySelector(".menu-toggle").click()');assert.equal(await evaluate('document.querySelector(".menu-toggle").getAttribute("aria-expanded")'),'true');
await evaluate('Array.from(document.querySelectorAll("#navigation a")).find(a=>a.hash==="#contato").click()');assert.equal(await evaluate('document.querySelector(".menu-toggle").getAttribute("aria-expanded")'),'false');
await evaluate('document.querySelector(".menu-toggle").click();document.dispatchEvent(new KeyboardEvent("keydown",{key:"Escape"}))');assert.equal(await evaluate('document.activeElement.className'),'menu-toggle');
console.log('PASS: menu abre, fecha por navegação e Escape devolve foco');
await evaluate('window.__opened="";window.open=(url)=>{window.__opened=url;return null};document.querySelector("#quote-form").requestSubmit()');assert.equal(await evaluate('window.__opened'),'');
await evaluate('document.querySelector("#name").value="Maria Silva";document.querySelector("#phone").value="123";document.querySelector("#service").selectedIndex=1;document.querySelector("#quote-form").requestSubmit()');assert.equal(await evaluate('window.__opened'),'');
await evaluate('document.querySelector("#phone").value="(61) 99999-1234";document.querySelector("#phone").dispatchEvent(new Event("input"));document.querySelector("#quote-form").requestSubmit()');
let opened=await evaluate('window.__opened');assert.equal(new URL(opened).pathname,'/556193995799');assert.match(new URL(opened).searchParams.get('text'),/Maria Silva/);assert.match(new URL(opened).searchParams.get('text'),/Instalação/);
await evaluate('document.querySelector("#service").selectedIndex=3;document.querySelector("#quote-form").requestSubmit()');assert.match(new URL(await evaluate('window.__opened')).searchParams.get('text'),/encomenda urgente/);
assert.equal(await evaluate('document.querySelector("#whatsapp-fallback").href===window.__opened'),true);
console.log('PASS: formulário bloqueia dados inválidos e gera mensagens corretas para climatização e encomendas');
assert.equal(await evaluate('getComputedStyle(document.querySelector(".route-line i")).animationName'),'none');
console.log('PASS: preferência de movimento reduzido');
await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'no-preference'}]});
await evaluate('sessionStorage.removeItem("gj-intro-seen")');
await send('Page.reload');await wait(450);
assert.equal(await evaluate('document.querySelector("#brand-intro").hidden'),false);
await wait(2600);
assert.equal(await evaluate('document.querySelector("#brand-intro").hidden'),true);
await send('Page.reload');await wait(350);
assert.equal(await evaluate('document.querySelector("#brand-intro").hidden'),true);
await evaluate('sessionStorage.removeItem("gj-intro-seen")');
await send('Page.reload');await wait(350);
await evaluate('document.querySelector(".intro-skip").click()');
assert.equal(await evaluate('document.querySelector("#brand-intro").hidden'),true);
console.log('PASS: abertura encerra, aparece uma vez por sessão e permite pular');
assert.deepEqual(errors,[]);console.log('PASS: sem exceções JavaScript');
} finally {ws.close();}
