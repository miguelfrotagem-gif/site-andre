import assert from 'node:assert/strict';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
const base=process.env.TEST_URL||'http://127.0.0.1:3000';
const cdp=process.env.CDP_URL||'http://127.0.0.1:9222';
const output='/tmp/ademicon-checks';await mkdir(output,{recursive:true});
const target=await(await fetch(`${cdp}/json/new?about:blank`,{method:'PUT'})).json();
const ws=new WebSocket(target.webSocketDebuggerUrl);await new Promise((r,j)=>{ws.addEventListener('open',r,{once:true});ws.addEventListener('error',j,{once:true})});
let seq=0,checks=0;const pending=new Map(),errors=[],localFailures=[],mutations=[],passes=[];
ws.addEventListener('message',event=>{const data=JSON.parse(event.data);if(data.id){const p=pending.get(data.id);if(p){pending.delete(data.id);clearTimeout(p.timer);data.error?p.reject(new Error(JSON.stringify(data.error))):p.resolve(data.result)}}
if(data.method==='Runtime.exceptionThrown')errors.push(data.params.exceptionDetails.exception?.description||data.params.exceptionDetails.text);
if(data.method==='Network.responseReceived'){const {response}=data.params;if(response.url.startsWith(base)&&response.status>=400)localFailures.push(`${response.status} ${response.url}`)}
if(data.method==='Network.requestWillBeSent'){const {request}=data.params;if(!['GET','HEAD'].includes(request.method))mutations.push({url:request.url,method:request.method,postData:request.postData})}
});
function send(method,params={}){return new Promise((resolve,reject)=>{const id=++seq;const timer=setTimeout(()=>{pending.delete(id);reject(new Error(`CDP timeout: ${method}`))},20000);pending.set(id,{resolve,reject,timer});ws.send(JSON.stringify({id,method,params}))})}
async function evaluate(expression){const result=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(result.exceptionDetails)throw Error(result.exceptionDetails.exception?.description||JSON.stringify(result.exceptionDetails));return result.result.value}
const pause=ms=>new Promise(r=>setTimeout(r,ms));
function check(value,message){assert.ok(value,message);checks++;passes.push(message)}
async function until(expression,message,timeout=15000){const end=Date.now()+timeout;while(Date.now()<end){if(await evaluate(expression))return;await pause(60)}throw Error(`Timed out: ${message}`)}
async function navigate(hash=''){await send('Page.navigate',{url:base+'/'+hash});await until(`document.querySelectorAll('#preview>.scene').length===12`,'application ready');await until(`document.querySelector('#inicio .scene__image').complete&&document.querySelector('#inicio .scene__image').naturalWidth===1672`,'hero decoded');await pause(100)}
async function route(hash){await evaluate(`location.hash=${JSON.stringify(hash)}`);await pause(50)}
async function click(selector){await evaluate(`document.querySelector(${JSON.stringify(selector)}).scrollIntoView({behavior:'instant',block:'center',inline:'nearest'})`);await pause(30);const r=await evaluate(`(()=>{const r=document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height/2,w:r.width,h:r.height}})()`);assert.ok(r.w&&r.h,`click target visible: ${selector}`);await send('Input.dispatchMouseEvent',{type:'mousePressed',button:'left',clickCount:1,x:r.x,y:r.y});await send('Input.dispatchMouseEvent',{type:'mouseReleased',button:'left',clickCount:1,x:r.x,y:r.y});await pause(35)}
async function close(){await evaluate(`document.querySelector('dialog[open]')?.close()`);await until(`!document.querySelector('dialog')`,'dialog closed and memory cleared');await pause(30)}
async function shot(name){await until(`!document.querySelector('#consorcios>.catalog-previous')`,'catalog transition settled before screenshot');const result=await send('Page.captureScreenshot',{format:'png'});await writeFile(`${output}/${name}.png`,Buffer.from(result.data,'base64'))}
async function setViewport(width,height){await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});await pause(60)}
async function submit(){await evaluate(`document.querySelector('dialog form').requestSubmit()`);await pause(35)}
const report={startedAt:new Date().toISOString(),base};
try{
 await send('Page.enable');await send('Page.bringToFront');await send('Runtime.enable');await send('Network.enable');
 await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
 await setViewport(1672,941);await navigate();
 check((await evaluate('document.title')).includes('Ademicon'),'Ademicon document title');
 check(await evaluate(`document.querySelectorAll('#preview>.scene').length===12`),'home contains 12 main scenes');
 check(await evaluate(`!document.querySelector('.brand-intro')`),'reduced motion skips intro');
 check(await evaluate(`![...document.querySelectorAll('a')].some(a=>a.getAttribute('href')==='#'||!a.getAttribute('href'))`),'no empty or isolated hash links');
 await evaluate(`Promise.all([...document.querySelectorAll('#preview>.scene>picture img')].map(async img=>{img.loading='eager';await img.decode()}))`);
 check(await evaluate(`[...document.querySelectorAll('#preview>.scene>picture img')].every(img=>img.complete&&img.naturalWidth===1672&&img.naturalHeight===941)`),'all 12 initial desktop scene images decoded at reference dimensions');
 const sceneIds=await evaluate(`[...document.querySelectorAll('#preview>.scene')].map(s=>s.id)`);
 for(const [width,height] of [[1672,941],[1440,900],[1366,768]]){
  await setViewport(width,height);
  check(await evaluate(`document.documentElement.scrollWidth<=innerWidth`),`no desktop horizontal overflow ${width}`);
  check(await evaluate(`[...document.querySelectorAll('.scene')].every(s=>{const r=s.getBoundingClientRect();return Math.abs(r.width/r.height-1672/941)<.0001})`),`all desktop scenes preserve exact reference ratio ${width}`);
  check(await evaluate(`[...document.querySelectorAll('.scene')].every((s,i,a)=>!i||Math.abs(s.getBoundingClientRect().top-a[i-1].getBoundingClientRect().bottom)<.05)`),`no artificial scene gaps ${width}`);
  check(await evaluate(`[...document.querySelectorAll('.scene .hotspot')].every(e=>{const r=e.getBoundingClientRect(),s=e.closest('.scene').getBoundingClientRect();return r.left>=s.left-.1&&r.right<=s.right+.1&&r.top>=s.top-.1&&r.bottom<=s.bottom+.1})`),`hotspots within original scene boundaries ${width}`);
  for(const id of ['inicio','sobre','blog']){await evaluate(`document.getElementById('${id}').scrollIntoView({behavior:'instant'})`);await pause(60);check(await evaluate(`document.querySelector('#${id} [data-nav-target="${id}"]')?.getAttribute('aria-current')==='page'`),`active navigation follows scrolling ${id} ${width}`)}
  await evaluate(`document.querySelector('#inicio').scrollIntoView({behavior:'instant'})`);await shot(`hero-${width}`);
 }
 await setViewport(1672,941);
 for(const id of sceneIds){await evaluate(`document.getElementById('${id}').scrollIntoView({behavior:'instant'})`);await pause(50);await shot(`scene-${id}-1672`)}
 // Actual centered clicks verify the measured transparent controls.
 await click('#inicio .hotspot[aria-label="Conhecer as opções"]');
 check(await evaluate(`location.hash==='#consorcios'`),'hero CTA navigates to overview');
 await click('#consorcios .hotspot[data-action="dropdown"]');
 check(await evaluate(`document.querySelector('.drop-panel a')===document.activeElement`),'dropdown opens and receives keyboard focus');
 await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape'});await send('Input.dispatchKeyEvent',{type:'keyUp',key:'Escape',code:'Escape'});
 check(await evaluate(`!document.querySelector('.drop-panel')&&document.activeElement.getAttribute('data-action')==='dropdown'`),'Escape closes dropdown and restores trigger focus');
 await click('#consorcios .hotspot[data-action="dropdown"]');await click('.drop-panel a[aria-label="Imóveis"]');
 await until(`document.querySelector('#consorcios').dataset.scene==='05'`,'Imóveis first page');
 check(await evaluate(`location.hash==='#consorcios/imoveis/1'`),'category dropdown routes to correct first image');
 await click('#consorcios .hotspot[data-action="page"]');await until(`document.querySelector('#consorcios').dataset.scene==='06'`,'Imóveis next page');
 check(await evaluate(`location.hash==='#consorcios/imoveis/2'`),'Imóveis next arrow routes to second page');
 await evaluate('history.back()');await until(`document.querySelector('#consorcios').dataset.scene==='05'`,'browser history restores category page');checks++;passes.push('browser back restores category/page');
 await evaluate('history.forward()');await until(`document.querySelector('#consorcios').dataset.scene==='06'`,'browser forward restores category page');
 await send('Page.reload');await until(`document.querySelector('#consorcios')?.dataset.scene==='06'`,'direct hash survives reload');checks++;passes.push('direct category/page survives reload');
 const seen=new Set(['01','02','03','10','11','12','13','14','15','16','17','18']);
 for(const [category,page,num] of [['veiculos',1,'04'],['imoveis',1,'05'],['imoveis',2,'06'],['servicos',1,'07'],['servicos',2,'08'],['outros',1,'09']]){
  const previousBox=await evaluate(`(()=>{const r=document.querySelector('#consorcios').getBoundingClientRect();return {width:r.width,height:r.height}})()`);
  await route(`#consorcios/${category}/${page}`);await until(`document.querySelector('#consorcios').dataset.scene==='${num}'`,`${category} ${page}`);seen.add(num);
  await evaluate(`document.querySelector('#consorcios>picture:not(.catalog-previous) .scene__image').decode()`);
  check(await evaluate(`document.querySelectorAll('#consorcios>picture:not(.catalog-previous)').length===1&&[...document.querySelectorAll('#consorcios>.catalog-previous')].every(p=>p.getAttribute('aria-hidden')==='true'&&getComputedStyle(p).position==='absolute')`),`catalog ${num} crossfade keeps a single current image and decorative prior layer`);
  check(await evaluate(`(()=>{const r=document.querySelector('#consorcios').getBoundingClientRect();return Math.abs(r.width-${previousBox.width})<.1&&Math.abs(r.height-${previousBox.height})<.1})()`),`catalog ${num} transition preserves content dimensions`);
  await until(`!document.querySelector('#consorcios>.catalog-previous')`, `catalog ${num} removes prior image after transition`);
  check(await evaluate(`!document.querySelector('#consorcios>.catalog-previous')`),`catalog ${num} previous image removed after settling`);
  check(await evaluate(`document.querySelector('#consorcios>picture:not(.catalog-previous) .scene__image').naturalWidth===1672`),`catalog ${num} uses exact image dimensions`);
  check(await evaluate(`document.querySelectorAll('#consorcios>picture:not(.catalog-previous)').length===1`),`catalog ${num} shows one state only`);
  await shot(`catalog-${num}-1672`);
 }
 check(seen.size===18,'all 18 approved images reachable');
 // Untrusted hash segments must not index inherited object properties or fractional pages.
 for(const [hash,validScenes] of [['#consorcios/imoveis/1.5',['05','06']],['#consorcios/constructor/1',['03']],['#consorcios/__proto__/1',['03']]]){
  const beforeErrors=errors.length;
  await route(hash);await until(`!document.querySelector('#consorcios>.catalog-previous')`,'malformed route transition settled');
  check(validScenes.includes(await evaluate(`document.querySelector('#consorcios').dataset.scene`)),`malformed hash ${hash} resolves to a valid catalog state`);
  check(errors.length===beforeErrors,`malformed hash ${hash} causes no browser exception`);
 }
 // Check the actual animated crossfade as well as the reduced-motion workflow above.
 await route('#consorcios/veiculos/1');await until(`document.querySelector('#consorcios').dataset.scene==='04'&&!document.querySelector('#consorcios>.catalog-previous')`,'normal-motion baseline settled');
 const normalBox=await evaluate(`(()=>{const r=document.querySelector('#consorcios').getBoundingClientRect();return {width:r.width,height:r.height}})()`);
 await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'no-preference'}]});
 await route('#consorcios/imoveis/1');await until(`document.querySelector('#consorcios').dataset.scene==='05'`,'normal-motion catalog transition begins');
 check(await evaluate(`(()=>{const p=document.querySelector('#consorcios>.catalog-previous');return !!p&&p.getAttribute('aria-hidden')==='true'&&getComputedStyle(p).position==='absolute'&&getComputedStyle(p).pointerEvents==='none'&&!p.querySelector('a,button,input,select,textarea')})()`),'normal-motion crossfade prior picture is decorative, absolute and noninteractive');
 check(await evaluate(`getComputedStyle(document.querySelector('#consorcios>picture:not(.catalog-previous)')).animationName.includes('catalogFade')`),'normal-motion current picture fades over prior image');
 check(await evaluate(`(()=>{const r=document.querySelector('#consorcios').getBoundingClientRect();return Math.abs(r.width-${normalBox.width})<.1&&Math.abs(r.height-${normalBox.height})<.1})()`),'normal-motion crossfade preserves scene dimensions while animating');
 await until(`!document.querySelector('#consorcios>.catalog-previous')`,'normal-motion prior image removed');
 check(await evaluate(`(()=>{const r=document.querySelector('#consorcios').getBoundingClientRect();return document.querySelectorAll('#consorcios>picture').length===1&&Math.abs(r.width-${normalBox.width})<.1&&Math.abs(r.height-${normalBox.height})<.1})()`),'normal-motion crossfade settles to one image without layout shift');
 await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
 await route('#consorcios/servicos/1');await until(`document.querySelector('#consorcios').dataset.scene==='07'`,'services first page');await click('#consorcios .hotspot[data-action="page"]');await until(`document.querySelector('#consorcios').dataset.scene==='08'`,'services next page');
 check(await evaluate(`location.hash==='#consorcios/servicos/2'`),'Serviços arrow shows second approved image');
 await click('#consorcios .hotspot[aria-label="Saiba mais: Energia solar"]');
 check(await evaluate(`document.querySelector('dialog form [name=category]').value==='Serviços'&&document.querySelector('dialog form [name=product]').value==='Energia solar'`),'product CTA opens planning with correct category/product');await close();
 // Simulation is intentionally not a commercial calculator.
 await route('#inicio');await click('#inicio .hotspot[aria-label="Planejar por crédito"]');
 check(await evaluate(`document.querySelector('dialog [name=mode]:checked').value==='Crédito pretendido'`),'hero Crédito control opens credit intention');
 await evaluate(`document.querySelector('dialog [name=product]').value='Objetivo de teste';document.querySelector('dialog [name=amount]').value='150000';`);await submit();
 check(await evaluate(`document.querySelector('dialog').textContent.includes('150.000,00')&&document.querySelector('dialog').textContent.includes('Nenhuma condição comercial foi calculada')`),'simulation summary contains only declared intent and honest caveat');
 await click('dialog [data-action="edit"]');check(await evaluate(`document.querySelector('dialog [name=amount]').value==='150000'`),'simulation edit preserves declaration');await submit();await click('dialog [data-action="plan"]');
 check(await evaluate(`document.querySelector('dialog [name=value]').value==='150000'`),'simulation passes declared credit to planning');
 const preStorage=await evaluate(`({local:Object.keys(localStorage),session:Object.keys(sessionStorage)})`);
 const preMutations=mutations.length;
 await evaluate(`const t=document.querySelector('dialog textarea');t.value='🌱'.repeat(1001);t.dispatchEvent(new Event('input',{bubbles:true}))`);
 check(await evaluate(`Array.from(document.querySelector('dialog textarea').value).length===1000&&document.querySelector('#ad-character-count').textContent==='1000 / 1000 caracteres'`),'free text enforces 1000 Unicode characters with correct counter');
 await submit();check(await evaluate(`document.querySelector('[aria-current=step]').textContent.includes('Contato')`),'planning advances to contact');
 await evaluate(`document.querySelector('dialog [name=name]').value='Teste da prévia';document.querySelector('dialog [name=phone]').value='00000000000';document.querySelector('dialog [name=email]').value='teste@example.invalid';document.querySelector('dialog [name=preference]').value='E-mail'`);await submit();
 check(await evaluate(`document.querySelector('[aria-current=step]').textContent.includes('Revisão')&&document.querySelector('dialog').textContent.includes('Teste da prévia')`),'planning review contains entered test answers');
 await click('dialog [data-edit="0"]');check(await evaluate(`document.querySelector('dialog [name=product]').value==='Objetivo de teste'`),'planning edit restores goal');await submit();check(await evaluate(`document.querySelector('dialog [name=name]').value==='Teste da prévia'`),'planning retains contact while editing objective');await submit();
 await click('dialog [data-back]');check(await evaluate(`document.querySelector('dialog [name=name]').value==='Teste da prévia'`),'review back retains contact');await submit();await shot('planning-review');await submit();
 check(await evaluate(`document.querySelector('dialog [role=status]').textContent==='Demonstração concluída. Nenhum dado foi enviado.'`),'completion states no data sent');
 check(mutations.length===preMutations,'planning emits no network mutation request');
 assert.deepEqual(await evaluate(`({local:Object.keys(localStorage),session:Object.keys(sessionStorage)})`),preStorage);checks++;passes.push('planning creates no persistent browser storage');
 check(await evaluate(`!location.href.includes('Teste')&&!location.href.includes('150000')`),'answers absent from address');await close();
 await click('#inicio .hotspot[aria-label="Simular agora"]');await close();
 await route('#planejamento');await click('#planejamento .hotspot[data-action="planning"]');check(await evaluate(`document.querySelector('dialog [name=product]').value===''`),'closed flow answers discarded');await close();
 // Existing content filters and FAQ open actual curated content, no fake results.
 await route('#blog');await click('#blog .hotspot[aria-label="Artigos"]');check(await evaluate(`document.querySelectorAll('dialog .ad-content-list article').length===3&&!document.querySelector('dialog').textContent.includes('Vídeo institucional')`),'Artigos filter exposes three existing articles');await close();
 await click('#blog .hotspot[aria-label="Vídeos"]');check(await evaluate(`document.querySelectorAll('dialog .ad-content-list article').length===1&&document.querySelector('dialog').textContent.includes('Conheça a Ademicon')`),'Vídeos filter exposes existing institutional video');await close();
 await route('#duvidas');await click('#duvidas .hotspot[aria-label="O que é um lance?"]');check(await evaluate(`document.querySelector('dialog').textContent.includes('não garante vitória')&&document.querySelectorAll('dialog .ad-regulations a').length===3`),'FAQ shows honest answer and official regulations');await close();
 const hrefs=JSON.parse(await readFile(new URL('../LINKS_CONTEUDOS.json',import.meta.url),'utf8'));
 const actualExternal=await evaluate(`[...document.querySelectorAll('a[href^="https://"]')].map(a=>({href:a.href,target:a.target,rel:a.rel}))`);
 check(actualExternal.every(a=>Object.values(hrefs).includes(a.href)&&a.target==='_blank'&&a.rel.includes('noopener')&&a.rel.includes('noreferrer')),'external links use exact provided URLs and protected new tabs');
 await route('#historias');await click('#historias .hotspot[aria-label="Assistir à história de Letícia"]');
 check(await evaluate(`document.querySelector('dialog iframe').src==='https://www.youtube-nocookie.com/embed/rk73PQelv3U?autoplay=0'`),'video created after click without autoplay');
 check(await evaluate(`document.querySelector('dialog a').href===${JSON.stringify(hrefs.historia_leticia)}&&document.querySelector('dialog a').rel.includes('noopener')`),'video includes original YouTube fallback');await close();
 check(await evaluate(`!document.querySelector('iframe')`),'closing video removes player');
 for(const [width,height] of [[390,844],[320,700]]){
  await setViewport(width,height);await route('#inicio');await pause(100);
  check(await evaluate(`document.documentElement.scrollWidth<=innerWidth`),`no mobile horizontal overflow ${width}`);
  check(await evaluate(`getComputedStyle(document.querySelector('#inicio>picture')).display==='none'&&getComputedStyle(document.querySelector('#inicio .mobile-content')).display==='block'`),`mobile uses readable semantic adaptation ${width}`);
  check(await evaluate(`parseFloat(getComputedStyle(document.querySelector('#inicio .mobile-content h1')).fontSize)>=36`),`mobile headline remains legible ${width}`);
  await shot(`mobile-hero-${width}`);
  await click('#mobile-toggle');check(await evaluate(`document.querySelector('#mobile-toggle').getAttribute('aria-expanded')==='true'`),`mobile menu opens ${width}`);
  await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape'});await send('Input.dispatchKeyEvent',{type:'keyUp',key:'Escape',code:'Escape'});
  check(await evaluate(`document.querySelector('#mobile-menu').hidden&&document.activeElement.id==='mobile-toggle'`),`mobile Escape restores focus ${width}`);
  await route('#consorcios/imoveis/2');await until(`document.querySelector('#consorcios').dataset.scene==='06'`,'mobile catalog');
  await evaluate(`Promise.all([...document.querySelectorAll('#consorcios .mobile-card img')].map(async i=>{i.loading='eager';await i.decode()}))`);
  check(await evaluate(`[...document.querySelectorAll('#consorcios .mobile-card img')].every(i=>i.naturalWidth>0)`),`mobile catalog photos load ${width}`);
  check(await evaluate(`document.documentElement.scrollWidth<=innerWidth`),`mobile catalog has no overflow ${width}`);await shot(`mobile-catalog-${width}`);
  await route('#planejamento');await click('#planejamento .mobile-content .button');
  check(await evaluate(`(()=>{const r=document.querySelector('dialog').getBoundingClientRect();return r.left>=0&&r.right<=innerWidth&&r.height<=innerHeight})()`),`mobile modal fits viewport ${width}`);await shot(`mobile-modal-${width}`);await close();
 }
 check(errors.length===0,`no browser JavaScript exceptions: ${errors.join('; ')}`);
 check(localFailures.length===0,`no local resource failures: ${localFailures.join('; ')}`);
 report.status='passed';report.checks=checks;console.log(`${checks} verificações Ademicon passaram. Capturas em ${output}.`);
}catch(error){report.status='failed';report.error=error.stack;report.checks=checks;try{await shot('failure')}catch{}throw error}
finally{report.completedAt=new Date().toISOString();report.passes=passes;report.exceptions=errors;report.localFailures=localFailures;report.mutationRequests=mutations;await writeFile(`${output}/report.json`,JSON.stringify(report,null,2));ws.close();await fetch(`${cdp}/json/close/${target.id}`)}
