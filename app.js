const config = window.SOLAR_CONFIG || {};
const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => [...root.querySelectorAll(s)];
const normalize = text => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const normalizeNumber = value => String(value || '').replace(/\D/g, '');
const number = normalizeNumber(config.whatsappNumber);
const validNumber = /^[1-9]\d{9,14}$/.test(number);
let solution = 'residencial';
let project = 'residencial';
const messages = config.messages || {};
let message = messages.contact || config.generalMessage || 'Olá! Gostaria de conversar sobre energia solar.';
$$('[data-brand]').forEach(el => { el.textContent = config.brandName || 'Energia Solar'; });
$$('[data-owner]').forEach(el => { el.textContent = config.ownerName || 'Eude Militão'; });
if (config.logoUrl) {
 const img = document.createElement('img'); img.src = config.logoUrl; img.alt = ''; img.width = 36; img.height = 36;
 $('.brand .sun').replaceWith(img);
}
if (config.savingsClaim?.validated === true && Number(config.savingsClaim.percentage) > 0 && Number(config.savingsClaim.percentage) <= 100) {
 const percent = document.createElement('em');
 percent.className = 'savings-percent';
 percent.textContent = `${config.savingsClaim.percentage}%`;
 const rest = document.createElement('span');
 rest.className = 'line';
 rest.textContent = 'na sua conta de luz.';
 $('h1').replaceChildren(document.createTextNode('Até '), percent, document.createTextNode(' menos '), rest);
 $('.hero-disclaimer').textContent = 'A economia varia conforme o projeto e o consumo.';
}
function setMessage(value) {
 message = value;
 $('#contact-context').textContent = value;
 const cta = $('#whatsapp-cta');
 cta.href = validNumber ? `https://wa.me/${number}?text=${encodeURIComponent(message)}` : '#contact-status';
 if(validNumber) { cta.target = '_blank'; cta.rel = 'noopener noreferrer'; $('#contact-status').textContent = 'Você será direcionado ao WhatsApp para iniciar a conversa. Nenhuma mensagem é enviada automaticamente.'; }
}
setMessage(message);
$('#whatsapp-cta').addEventListener('click', () => { if(!validNumber) $('#contact-status').focus({preventScroll:true}); });
const solutionText = {
 residencial:'Para sua casa: uma análise do consumo, do telhado e da sua rotina.',
 empresarial:'Para sua empresa: uma análise dos custos de energia e do perfil de operação.',
 rural:'Para o campo: uma análise do consumo e das necessidades da sua produção.'
};
function chooseSolution(value) {
 solution = value;
 $$('[data-solution]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.solution === value)));
 $('#solution-summary').textContent = solutionText[value];
}
$$('[data-solution]').forEach(b => b.addEventListener('click', () => chooseSolution(b.dataset.solution)));
$('#solution-cta').addEventListener('click', () => setMessage(messages[solution] || `Olá! Tenho interesse em energia solar para um imóvel ${solution}.`));
$$('[data-project]').forEach(b => b.addEventListener('click', () => {
 project=b.dataset.project;
 $$('[data-project]').forEach(el => el.setAttribute('aria-pressed',String(el===b)));
 $('#project-summary').textContent = {residencial:'Residencial: explore uma solução adequada ao consumo da sua casa.',empresarial:'Empresarial: explore uma solução para o consumo e a operação da sua empresa.',rural:'Rural: explore uma solução para as necessidades da sua produção.'}[project];
}));
$('#project-cta').addEventListener('click', () => setMessage(messages.project || 'Olá! Vi os projetos no site e gostaria de uma solução para o meu imóvel.'));
$$('[data-message]').forEach(el => el.addEventListener('click', () => setMessage(messages[el.dataset.message] || config.generalMessage)));
$$('[data-context]').forEach(el => el.addEventListener('click', () => setMessage(el.dataset.context)));
const nav = $('#navigation'), menu = $('.menu-toggle');
function closeMenu(returnFocus = false) { nav.classList.remove('open'); menu.setAttribute('aria-expanded','false'); menu.firstChild.textContent = 'Abrir menu '; if(returnFocus) menu.focus(); }
menu.addEventListener('click', () => {
 const open = menu.getAttribute('aria-expanded') !== 'true';
 menu.setAttribute('aria-expanded',String(open)); nav.classList.toggle('open',open); menu.firstChild.textContent = open ? 'Fechar menu ' : 'Abrir menu ';
});
nav.addEventListener('click', e => {
 if(e.target.closest('a')) { const link=e.target.closest('a'); if(link.hash === '#contato')setMessage(messages[link.dataset.message || 'contact'] || config.generalMessage); const target = $(link.getAttribute('href'));closeMenu(); target.setAttribute('tabindex','-1');target.focus({preventScroll:true}); }
});
document.addEventListener('keydown',e => { if(e.key==='Escape' && menu.getAttribute('aria-expanded')==='true') closeMenu(true); });
document.addEventListener('click',e => { if(!e.target.closest('.site-header') && menu.getAttribute('aria-expanded')==='true')closeMenu(); });
const narrow = matchMedia('(max-width:1023px)');
narrow.addEventListener('change',()=>closeMenu());
if ('IntersectionObserver' in window) {
 const navObserver = new IntersectionObserver(entries => {
  const active=entries.filter(e=>e.isIntersecting).sort((a,b)=>b.intersectionRatio-a.intersectionRatio)[0];
  if(active) $$('#navigation a:not(.menu-proposal)').forEach(a=> {if(a.hash===`#${active.target.id}`)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current');});
 },{rootMargin:'-15% 0px -45% 0px',threshold:[0,.1,.3,.6]});
 $$('main>section').forEach(s=>navObserver.observe(s));
}
const answerAnimations = new WeakMap();
function setAnswer(button, open) {
 const region = $('#' + button.getAttribute('aria-controls'));
 const previous = answerAnimations.get(region);
 const currentHeight = region.hidden ? 0 : region.getBoundingClientRect().height;
 previous?.cancel();
 button.setAttribute('aria-expanded', String(open));
 $('span', button).textContent = open ? '−' : '+';
 if (matchMedia('(prefers-reduced-motion:reduce)').matches || !region.animate) {
  region.hidden = !open;
  region.style.removeProperty('overflow');
  return;
 }
 region.hidden = false;
 region.style.overflow = 'hidden';
 const targetHeight = open ? region.scrollHeight : 0;
 const animation = region.animate([
  { height: `${currentHeight}px`, opacity: open ? .6 : 1 },
  { height: `${targetHeight}px`, opacity: open ? 1 : 0 }
 ], { duration: 220, easing: 'cubic-bezier(.2,.65,.25,1)' });
 answerAnimations.set(region, animation);
 animation.onfinish = () => {
  region.hidden = !open;
  region.style.removeProperty('overflow');
  answerAnimations.delete(region);
 };
}
$$('.faq-item h3 button').forEach(b=>b.addEventListener('click',()=>setAnswer(b,b.getAttribute('aria-expanded')!=='true')));
function filterFaq(){
 const term=normalize($('#faq-search').value.trim());let count=0;
 $$('.faq-item').forEach(item=>{const match=normalize(item.textContent).includes(term);if(!match&&item.contains(document.activeElement))$('#faq-search').focus();item.hidden=!match;if(match)count++;});
 $('#no-results').hidden=count!==0;$('#search-status').textContent=`${count} ${count===1?'resposta encontrada':'respostas encontradas'}.`;
}
$('#faq-search').addEventListener('input',filterFaq);$('#clear-search').addEventListener('click',()=>{$('#faq-search').value='';filterFaq();$('#faq-search').focus();});filterFaq();
const motion=matchMedia('(prefers-reduced-motion:reduce)');
if (!motion.matches) document.documentElement.classList.add('motion-ready');
motion.addEventListener('change', e => { if(e.matches){ document.documentElement.classList.remove('motion-ready'); document.getAnimations().forEach(a=>a.finish()); } });
if('IntersectionObserver'in window&&!motion.matches){
 const io=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('revealed');io.unobserve(e.target);}}),{threshold:.08});
 $$('.section-intro,.timeline li,.solution-layout').forEach(el=>{if(el.getBoundingClientRect().top>innerHeight){el.classList.add('reveal-ready');if(el.closest('.timeline'))el.style.transitionDelay=`${[...el.parentElement.children].indexOf(el)*70}ms`;io.observe(el);}});
 motion.addEventListener('change',e=>{if(e.matches){$$('.reveal-ready').forEach(el=>el.classList.add('revealed'));io.disconnect();}});
}
