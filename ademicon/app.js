import {openSimulator,openPlanning,openVideo,openFAQ,openContent} from './dialogs.js';
const [scenes, links] = await Promise.all([
  fetch(new URL('./scenes.json',import.meta.url)).then(r=>{if(!r.ok)throw Error('Não foi possível carregar as cenas');return r.json()}),
  fetch(new URL('../LINKS_CONTEUDOS.json',import.meta.url)).then(r=>r.json())
]);
const root=document.querySelector('#preview');
root.replaceChildren();document.body.classList.add('js-preview');
const categories={veiculos:'Veículos',imoveis:'Imóveis',servicos:'Serviços',outros:'Outros bens móveis'};
const mainScenes=['01','02','03','10','11','12','13','14','15','16','17','18'];
const catalogImages={veiculos:['04'],imoveis:['05','06'],servicos:['07','08'],outros:['09']};
const pages={veiculos:1,imoveis:1,servicos:1,outros:1};
let activeCategory='',catalogNumber='03',activeSection='inicio',swapId=0,historyIndex=0;
const faq=[
 ['Como acontece a contemplação?','Ocorre por sorteio ou lance, conforme regras e recursos do grupo, sem data garantida.'],
 ['O que é um lance?','É uma oferta para concorrer à contemplação, segundo modalidades e condições do grupo; não garante vitória.'],
 ['Quais custos compõem o plano?','Consulte a taxa de administração e os demais encargos aplicáveis no contrato. As condições dependem do plano.'],
 ['As parcelas podem ser reajustadas?','Os critérios e índices dependem do contrato. Não há promessa de parcelas sempre fixas.'],
 ['O que posso adquirir com o crédito?','Depende do segmento, da finalidade permitida e dos requisitos da operação.'],
 ['O que acontece se eu cancelar?','Consulte o regulamento e o atendimento oficial para condições de exclusão e restituição. Não há promessa de devolução imediata ou prazo genérico.']
];
const stories=[['Letícia','historia_leticia'],['Francelize','historia_francelize'],['Cleverson e Lilian','historia_cleverson_lilian']];
const articles=[{title:'Conheça a Ademicon',description:'Vídeo institucional',action:()=>openVideo('Conheça a Ademicon',links.video_institucional),type:'videos'},{title:'Energia solar: dá para pagar com consórcio?',description:'Artigo da Ademicon',href:links.artigo_solar,type:'artigos'},{title:'Como funciona o consórcio de veículos?',description:'Artigo da Ademicon',href:links.artigo_veiculos,type:'artigos'},{title:'Entrevista à EXAME: o crescimento do consórcio no Brasil',href:links.entrevista_exame,type:'artigos'}];
function el(tag,attrs={},text){const e=document.createElement(tag);for(const [k,v] of Object.entries(attrs)){if(v!=null)e.setAttribute(k,String(v))}if(text!=null)e.textContent=text;return e}
function rectStyle(e,[x,y,w,h]){Object.assign(e.style,{left:`${x/1672*100}%`,top:`${y/941*100}%`,width:`${w/1672*100}%`,height:`${h/941*100}%`})}
function routeHref(h){if(h.action==='navigate')return '#'+h.target;if(h.action==='category'||h.action==='page')return `#consorcios/${h.category}/${h.page||pages[h.category]||1}`;if(h.action==='external')return links[h.key];return null}
function control(h,cls='hotspot'){
 const href=routeHref(h),c=el(href?'a':'button',{class:cls,'aria-label':h.label,'data-action':h.action});
 if(href){c.href=href;if(h.action==='external'){c.target='_blank';c.rel='noopener noreferrer'}else c.addEventListener('click',e=>{e.preventDefault();navigate(href)})}
 else {c.type='button';c.addEventListener('click',()=>act(h,c))}
 if(cls==='hotspot'){rectStyle(c,h.rect);c.append(el('span',{class:'sr-only'},h.label))}else c.textContent=h.label;
 if(h.action==='dropdown'){c.setAttribute('aria-expanded','false');c.setAttribute('aria-haspopup','true')}
 if(h.action==='category'&&h.category===activeCategory)c.setAttribute('aria-current','page');
 return c;
}
function act(h,trigger){
 switch(h.action){
 case 'simulate':openSimulator({category:h.category||activeCategory,product:h.product,mode:h.mode==='credito'?'Crédito pretendido':h.mode==='parcela'?'Parcela desejada':h.mode,amount:h.amount});break;
 case 'planning':openPlanning({category:h.category||activeCategory,product:h.product});break;
 case 'dropdown':toggleDropdown(trigger);break;
 case 'video':openVideo(h.label,links[h.key]);break;
 case 'historyPrevious':historyIndex=(historyIndex+2)%3;openVideo(`História de ${stories[historyIndex][0]}`,links[stories[historyIndex][1]]);break;
 case 'historyNext':historyIndex=(historyIndex+1)%3;openVideo(`História de ${stories[historyIndex][0]}`,links[stories[historyIndex][1]]);break;
 case 'stories':openContent('Histórias de conquistas',stories.map(([title,key])=>({title,description:'Relato publicado pela Ademicon. Capa ilustrativa.',action:()=>openVideo(`História de ${title}`,links[key])})));break;
 case 'blogFilter':openContent(h.filter==='todos'?'Todos os conteúdos':h.filter==='videos'?'Vídeos':'Artigos',articles.filter(a=>h.filter==='todos'||a.type===h.filter));break;
 case 'faq':openFAQ(...faq[h.index]);break;
 case 'faqFilter':{const indices={geral:[0,1,2,3,4,5],contemplacao:[0,1],parcelas:[2,3],contrato:[4,5]}[h.filter];openContent(h.label,indices.map(i=>({title:faq[i][0],description:faq[i][1]})).concat(regulations()));break}
 case 'regulations':openContent('Regulamentos oficiais',regulations());break;
 default:throw Error(`Ação desconhecida: ${h.action}`);
 }
}
function regulations(){return ['imoveis','veiculos','servicos'].map(c=>({title:`Regulamento de ${categories[c].toLowerCase()}`,href:links[`regulamento_${c}`]}))}
let currentDrop=null;
function closeDropdown(restore=false){if(!currentDrop)return;const {panel,trigger}=currentDrop;panel.remove();trigger.setAttribute('aria-expanded','false');currentDrop=null;if(restore)trigger.focus()}
function toggleDropdown(trigger){if(currentDrop?.trigger===trigger){closeDropdown(true);return}closeDropdown();const panel=el('nav',{class:'drop-panel','aria-label':'Categorias de consórcios'});panel.append(control({label:'Visão geral',action:'navigate',target:'consorcios'},'drop-link'));for(const [c,label] of Object.entries(categories))panel.append(control({label,action:'category',category:c},'drop-link'));trigger.closest('.scene__interactions').append(panel);trigger.setAttribute('aria-expanded','true');currentDrop={panel,trigger};panel.querySelector('a').focus()}
document.addEventListener('click',e=>{if(currentDrop&&!currentDrop.panel.contains(e.target)&&e.target!==currentDrop.trigger)closeDropdown()});
document.addEventListener('keydown',e=>{if(currentDrop&&e.key==='Escape'){e.preventDefault();closeDropdown(true)}if(currentDrop&&e.key==='Tab'){const focusable=[currentDrop.trigger,...currentDrop.panel.querySelectorAll('a')];if(e.shiftKey&&document.activeElement===focusable[0]){e.preventDefault();focusable.at(-1).focus()}else if(!e.shiftKey&&document.activeElement===focusable.at(-1)){e.preventDefault();focusable[0].focus()}}});
function picture(s,first=false){const p=el('picture');p.append(el('source',{type:'image/webp',srcset:`assets/ademicon/${s.file}.webp`}));p.append(el('img',{class:'scene__image',src:`assets/aprovadas/${s.file}.png`,alt:'',width:1672,height:941,loading:first?'eager':'lazy',decoding:'async',fetchpriority:first?'high':'auto'}));return p}
const navRects={inicio:[519,49,165,63],sobre:[683,49,221,63],consorcios:[906,49,219,63],blog:[1130,49,151,63]};
function nativeActive(num){return num==='01'?'inicio':num==='14'?'blog':Number(num)>=3&&Number(num)<=9?'consorcios':'sobre'}
function syncNavPixel(img){const key=img.dataset.navPixel,num=img.dataset.navScene;const selected=key===activeSection;img.hidden=selected===(key===nativeActive(num));const src=`assets/ademicon/nav-${num}-${key}-${selected?'active':'neutral'}.png`;if(img.getAttribute('src')!==src)img.src=src}
function addNavPixels(layer,num){for(const [key,rect] of Object.entries(navRects)){const img=el('img',{class:'nav-pixel','data-nav-pixel':key,'data-nav-scene':num,alt:'','aria-hidden':'true'});rectStyle(img,rect);syncNavPixel(img);layer.append(img)}}
function paint(section,num){
 const s=scenes[num];section.dataset.scene=num;section.replaceChildren();section.setAttribute('aria-labelledby',`${section.id}-title`);
 const semantics=el('div',{class:'sr-only'});semantics.append(el(section.id==='inicio'?'h1':'h2',{id:`${section.id}-title`},s.title));if(s.description)semantics.append(el('p',{},s.description));if(s.products)semantics.append(el('p',{},s.products.join('; ')));section.append(semantics,picture(s,num==='01'));
 const layer=el('div',{class:'scene__interactions'});if(num!=='18')addNavPixels(layer,num);
 const nav=el('nav',{'aria-label':`Navegação em ${s.title}`,class:'scene-nav'});
 s.hotspots.forEach((h,i)=>{const c=control(h);if(i<6&&num!=='18'){nav.append(c);if(h.action==='navigate'&&['inicio','sobre','blog'].includes(h.target))c.dataset.navTarget=h.target;if(h.action==='dropdown')c.dataset.navTarget='consorcios'}else layer.append(c)});
 if(num!=='18')layer.append(nav);section.append(layer);
 if(section.id==='consorcios'&&num!=='03')section.append(control({label:'← Visão geral',action:'navigate',target:'consorcios'},'category-return'));
 section.append(mobile(s,num));
}
function button(parent,label,action,extra={},secondary=false){const b=control({label,action,...extra},`button${secondary?' secondary':''}`);parent.append(b);return b}
function mobile(s,num){
 const div=el('div',{class:`mobile-content${num==='18'?' mobile-footer':''}`});
 div.append(el('p',{class:'eyebrow'},({inicio:'Consórcios para suas conquistas',sobre:'A essência da Ademicon',consorcios:'Consórcios para seus objetivos',historias:'Histórias de conquistas',blog:'Blog e conteúdos',planejamento:'Vamos construir seus planos',contato:'Seu próximo passo'}[s.id]||'Ademicon · consórcio e investimento')));
 div.append(el(num==='01'?'h1':'h2',{},s.title));
 if(s.description)div.append(el('p',{},s.description));
 const photo={inicio:'hero',sobre:'sobre',diferenciais:'diferenciais',contato:'contato'}[s.id];if(photo)div.append(el('img',{class:'mobile-photo',src:`assets/ademicon/${photo}.webp`,alt:s.id==='inicio'?'Consultor Ademicon em composição ilustrativa aprovada.':'Composição ilustrativa aprovada da Ademicon.',loading:num==='01'?'eager':'lazy',width:600,height:500}));
 if(num==='01'){button(div,'Conhecer as opções','navigate',{target:'consorcios'});button(div,'Simular meu consórcio','simulate',{},true);div.append(el('p',{class:'preview-note'},'Prévia demonstrativa. Organize seu objetivo sem cotação comercial ou envio de dados.'));return div}
 if(num==='02'){button(div,'Conheça nossas soluções','navigate',{target:'consorcios'});button(div,'Entenda o consórcio','navigate',{target:'como-funciona'},true);return div}
 if(['03','04','05','06','07','08','09'].includes(num)){
  const tabs=el('nav',{class:'mobile-tabs','aria-label':'Categorias do catálogo'});tabs.append(control({label:'Visão geral',action:'navigate',target:'consorcios'},'tab'));for(const [category,label]of Object.entries(categories))tabs.append(control({label,action:'category',category},'tab'));div.append(tabs);
  if(s.products){const cards=el('div',{class:'mobile-products'});s.products.forEach((name,i)=>{const card=el('article',{class:'mobile-card'});card.append(el('img',{src:`assets/ademicon/product-${num}-${i}.webp`,alt:'',width:500,height:300,loading:'lazy'}),el('h3',{},name));if(s.descriptions?.[i])card.append(el('p',{},s.descriptions[i]));const h=s.hotspots.find(h=>h.action==='planning'&&h.product===name)||s.hotspots.filter(h=>h.action==='planning')[i];button(card,'Conhecer opções','planning',{category:h?.category||s.category,product:h?.product||name});cards.append(card)});div.append(cards)}else button(div,'Consultar meu objetivo','planning',{category:'outros'});
  if(s.category&&catalogImages[s.category].length===2){const pager=el('nav',{class:'mobile-pagination','aria-label':'Paginação do catálogo'});pager.append(control({label:'← Anterior',action:'page',category:s.category,page:1},'page-link'),el('span',{},`Página ${s.page} de 2`),control({label:'Próxima →',action:'page',category:s.category,page:2},'page-link'));div.append(pager)}return div;
 }
 if(num==='10'){const list=el('ol');s.content.slice(0,4).forEach(text=>list.append(el('li',{},text)));div.append(list,el('p',{},s.content.at(-1)));button(div,'Encontrar meu consórcio','navigate',{target:'consorcios'});return div}
 if(num==='11'){button(div,'Quero receber orientação','planning');return div}
 if(num==='12'){const cards=el('div',{class:'mobile-products'});stories.forEach(([name,key],i)=>{const card=el('article',{class:'mobile-card'});card.append(el('img',{src:`assets/ademicon/story-${i}.webp`,alt:'Capa ilustrativa, sem representar os bens ou clientes reais.',loading:'lazy',width:500,height:300}),el('h3',{},name));button(card,'Assistir à história','video',{key});cards.append(card)});div.append(cards,el('p',{class:'preview-note'},'Relatos publicados pela Ademicon. Capas ilustrativas.'));return div}
 if(num==='13'){button(div,'Quero entender minhas opções','planning');return div}
 if(num==='14'){const tabs=el('div',{class:'mobile-tabs'});for(const [filter,label]of [['todos','Todos'],['artigos','Artigos'],['videos','Vídeos']])button(tabs,label,'blogFilter',{filter},true);div.append(tabs);const cards=el('div',{class:'mobile-products'});articles.forEach((article,i)=>{const card=el('article',{class:'mobile-card'});card.append(el('h3',{},article.title));button(card,i===0?'Assistir ao vídeo':'Ler conteúdo',i===0?'video':'external',{key:['video_institucional','artigo_solar','artigo_veiculos','entrevista_exame'][i]});cards.append(card)});div.append(cards);return div}
 if(num==='15'){faq.forEach(([q,a])=>{const d=el('details');d.append(el('summary',{},q),el('p',{},a));div.append(d)});button(div,'Regulamentos oficiais','regulations',{},true);button(div,'Conversar com um consultor','planning');return div}
 if(num==='16'){div.append(el('p',{class:'preview-note'},'Prévia demonstrativa — utilize dados de teste. Nada será enviado.'));button(div,'Começar meu planejamento','planning');return div}
 if(num==='17'){div.append(el('address',{},'Alameda Grajaú, 129, Alphaville Ind, Barueri SP, 06454-050, Brasil.'));button(div,'Solicitar atendimento','planning');button(div,'Como chegar','external',{key:'rota_endereco'},true);return div}
 if(num==='18'){button(div,'Começar meu planejamento','planning');button(div,'Voltar ao início','navigate',{target:'inicio'},true);div.append(el('p',{class:'preview-note'},'Prévia demonstrativa. Nenhum dado é enviado.'));const footer=el('nav',{'aria-label':'Rodapé'});s.hotspots.slice(3).forEach(h=>footer.append(control(h,'footer-link')));div.append(footer);return div}
 return div;
}
for(const num of mainScenes){const section=el('section',{id:scenes[num].id,class:'scene'});paint(section,num);root.append(section)}
function setActive(id){activeSection=['inicio','sobre','consorcios','blog'].includes(id)?id:'';document.querySelectorAll('[data-nav-pixel]').forEach(syncNavPixel);document.querySelectorAll('[data-nav-target]').forEach(link=>{if(link.dataset.navTarget===activeSection)link.setAttribute('aria-current','page');else link.removeAttribute('aria-current')});document.querySelectorAll('#mobile-menu a').forEach(a=>{if(a.hash==='#'+activeSection)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current')})}
let ticking=false;function trackSection(){if(ticking)return;ticking=true;requestAnimationFrame(()=>{ticking=false;let best='',area=-1;for(const section of root.children){const r=section.getBoundingClientRect(),visible=Math.max(0,Math.min(r.bottom,innerHeight)-Math.max(r.top,0));if(visible>area){area=visible;best=section.id}}setActive(best)})}addEventListener('scroll',trackSection,{passive:true});addEventListener('resize',trackSection);
const motion=matchMedia('(prefers-reduced-motion: reduce)');const entered=new WeakSet();const observer=new IntersectionObserver(entries=>{for(const entry of entries){if(entry.isIntersecting&&!entered.has(entry.target)){entered.add(entry.target);if(!motion.matches&&entry.target.id!=='inicio'){entry.target.classList.add('is-entering');setTimeout(()=>entry.target.classList.remove('is-entering'),750)}}}},{threshold:.12});[...root.children].forEach(s=>observer.observe(s));
async function applyRoute(scroll=true){
 const token=++swapId;closeDropdown();const parts=location.hash.slice(1).split('/'),id=parts[0]||'inicio';let num='03';
 if(id==='consorcios'&&Object.hasOwn(catalogImages,parts[1])){activeCategory=parts[1];const requested=Number(parts[2]);pages[activeCategory]=Math.max(1,Math.min(catalogImages[activeCategory].length,Number.isInteger(requested)&&requested>0?requested:pages[activeCategory]));num=catalogImages[activeCategory][pages[activeCategory]-1]}else if(id==='consorcios')activeCategory='';
 if(id==='consorcios'&&num!==catalogNumber){const image=new Image();image.src=`assets/ademicon/${scenes[num].file}.webp`;try{await image.decode()}catch{}if(token!==swapId)return;const section=document.querySelector('#consorcios');const previous=section.querySelector(':scope>picture')?.cloneNode(true);paint(section,num);catalogNumber=num;if(previous){previous.classList.add('catalog-previous');previous.setAttribute('aria-hidden','true');section.insertBefore(previous,section.querySelector(':scope>picture'))}section.classList.add('catalog-changing');setTimeout(()=>{previous?.remove();if(section.dataset.scene===num)section.classList.remove('catalog-changing')},300)}
 document.querySelector('#mobile-menu').hidden=true;document.querySelector('#mobile-toggle').setAttribute('aria-expanded','false');
 const target=document.getElementById(id)||document.getElementById('inicio');if(scroll)target.scrollIntoView({behavior:'instant',block:'start'});trackSection();
}
function navigate(hash){if(location.hash!==hash)history.pushState(null,'',hash);applyRoute()}
addEventListener('popstate',()=>applyRoute());addEventListener('hashchange',()=>applyRoute());
const menu=document.querySelector('#mobile-menu');for(const [target,label] of [['inicio','Início'],['sobre','Quem Somos'],['consorcios','Consórcios · visão geral'],['blog','Blog'],['planejamento','Planejamento'],['contato','Contato']])menu.append(control({label,action:'navigate',target},'mobile-link'));for(const [category,label]of Object.entries(categories))menu.append(control({label,action:'category',category},'mobile-link'));
const toggle=document.querySelector('#mobile-toggle');toggle.addEventListener('click',()=>{menu.hidden=!menu.hidden;toggle.setAttribute('aria-expanded',String(!menu.hidden));if(!menu.hidden)menu.querySelector('a').focus()});document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!menu.hidden){menu.hidden=true;toggle.setAttribute('aria-expanded','false');toggle.focus()}});document.addEventListener('click',e=>{if(!menu.hidden&&!e.target.closest('.mobile-header')){menu.hidden=true;toggle.setAttribute('aria-expanded','false')}});
if(!motion.matches){const intro=el('div',{class:'brand-intro','aria-hidden':'true'});intro.append(el('img',{src:'assets/ademicon/marca.png',alt:'',width:300,height:68}));document.body.append(intro);setTimeout(()=>intro.remove(),850)}
await applyRoute(Boolean(location.hash));trackSection();
