const config = window.SOLAR_CONFIG || {};
const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => [...root.querySelectorAll(s)];
const normalize = text => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const normalizeNumber = value => String(value || '').replace(/\D/g, '');
const number = normalizeNumber(config.whatsappNumber);
const validNumber = /^[1-9]\d{9,14}$/.test(number);
let solution = null;
let project = 'residencial';
const messages = config.messages || {};
let message = messages.contact || config.generalMessage || 'Olá! Gostaria de conversar sobre energia solar.';
$$('[data-brand]').forEach(el => { el.textContent = config.brandName || 'Inovar'; });
if (validNumber) $$('[data-phone]').forEach(el => {
 el.href = `tel:+${number}`;
 el.textContent = /^55\d{11}$/.test(number) ? `(${number.slice(2,4)}) ${number.slice(4,9)}-${number.slice(9)}` : `+${number}`;
});
$$('[data-owner]').forEach(el => { el.textContent = config.ownerName || 'Eude Militão'; });
if (config.logoUrl) $$('[data-logo]').forEach(img => { img.src = config.logoUrl; });
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
 const status = $('#contact-status');
 status.hidden = true;
 status.textContent = '';
 $('#whatsapp-cta').removeAttribute('aria-describedby');
 const cta = $('#whatsapp-cta');
 cta.href = validNumber ? `https://wa.me/${number}?text=${encodeURIComponent(message)}` : '#contact-status';
 if(validNumber) { cta.target = '_blank'; cta.rel = 'noopener noreferrer'; }
}
setMessage(message);
$('#whatsapp-cta').addEventListener('click', event => {
 if (validNumber) return;
 event.preventDefault();
 const status = $('#contact-status');
 status.hidden = false;
 status.textContent = 'O WhatsApp ainda não está disponível. Tente novamente em breve.';
 event.currentTarget.setAttribute('aria-describedby', 'contact-status');
 status.focus({preventScroll:true});
 status.scrollIntoView({block:'nearest', behavior:'instant'});
});
const solutionText = {
 overview: 'Escolha casa, empresa ou campo para conhecer a solução para o seu imóvel.',
 residencial: 'Para sua casa: uma análise do consumo, do telhado e da sua rotina.',
 empresarial: 'Para sua empresa: uma análise dos custos de energia e do perfil de operação.',
 rural: 'Para o campo: uma análise do consumo e das necessidades da sua produção.'
};
const scene = $('#solution-scene'), camera = $('.solution-camera', scene);
const overviewAlt = camera.alt;
const solutionAlt = {
 residencial: 'Casa com os painéis solares no telhado em destaque.',
 empresarial: 'Edifício empresarial e seu telhado com painéis solares em destaque.',
 rural: 'Propriedade rural com painéis solares e silos em destaque.'
};
const cameraMotion = matchMedia('(prefers-reduced-motion:reduce)');
scene.style.setProperty('--camera-duration', `${config.solutionScene.duration}ms`);
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
let instantFrame;
function updateCamera(instant = false) {
 if (instant) {
  cancelAnimationFrame(instantFrame);
  scene.classList.add('camera-instant');
 }
 if (!solution) camera.style.removeProperty('transform');
 else {
  const layout = config.solutionScene[matchMedia('(max-width:1023px)').matches ? 'mobile' : 'desktop'];
  const target = layout.targets[solution];
  const windowRect = scene.getBoundingClientRect(), imageStyle = getComputedStyle(camera);
  const w = windowRect.width, h = windowRect.height;
  const iw = parseFloat(imageStyle.width), ih = parseFloat(imageStyle.height);
  if (!w || !h || !iw || !ih) return;
  const bx = (w - iw) / 2, by = (h - ih) / 2;
  const [x0, y0, x1, y1] = target.region;
  const focus = target.focus || layout.focus;
  // Fit the full target region, keep the image covering the visual window,
  // then place its interest point in the area unobstructed by HTML controls.
  const cover = Math.max(w / iw, h / ih);
  const scale = Math.max(cover, Math.min(target.zoom, w / (iw * (x1 - x0)), h / (ih * (y1 - y0))));
  const minX = Math.max(w - iw * scale - bx, -bx - x0 * iw * scale);
  const maxX = Math.min(-bx, w - bx - x1 * iw * scale);
  const minY = Math.max(h - ih * scale - by, -by - y0 * ih * scale);
  const maxY = Math.min(-by, h - by - y1 * ih * scale);
  const x = clamp(w * focus[0] - bx - target.center[0] * iw * scale, minX, maxX);
  const y = clamp(h * focus[1] - by - target.center[1] * ih * scale, minY, maxY);
  camera.style.transform = `translate(${x}px, ${y}px) scale(${scale})`;
 }
 if (instant) instantFrame = requestAnimationFrame(() => {
  // Commit the recalculated frame before allowing the next user transition.
  camera.getBoundingClientRect();
  instantFrame = requestAnimationFrame(() => scene.classList.remove('camera-instant'));
 });
}
function reserveSolutionCopy() {
 const summary = $('#solution-summary'), style = getComputedStyle(summary);
 const measure = document.createElement('p');
 Object.assign(measure.style, {position:'absolute', visibility:'hidden', pointerEvents:'none', width:`${summary.clientWidth}px`, font:style.font, lineHeight:style.lineHeight, letterSpacing:style.letterSpacing, margin:'0', padding:'0'});
 measure.setAttribute('aria-hidden', 'true');
 summary.parentElement.append(measure);
 let height = 0;
 Object.values(solutionText).forEach(text => {measure.textContent = text; height = Math.max(height, measure.getBoundingClientRect().height);});
 measure.remove();
 summary.style.minBlockSize = `${Math.ceil(height)}px`;
}
function chooseSolution(value, event) {
 solution = value;
 scene.dataset.focus = value || 'overview';
 camera.alt = value ? solutionAlt[value] : overviewAlt;
 $$('[data-solution]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.solution === value)));
 $('#solution-summary').textContent = solutionText[value || 'overview'];
 updateCamera(cameraMotion.matches);
 if (value && event?.detail > 0 && matchMedia('(max-width:1023px)').matches) {
  const rect = scene.getBoundingClientRect();
  const reference = header.getBoundingClientRect().height;
  if (rect.bottom < reference + (innerHeight - reference) * .4) {
   scene.scrollIntoView({block:'start', behavior:cameraMotion.matches ? 'instant' : 'smooth'});
  }
 }
}
$$('[data-solution]').forEach(b => b.addEventListener('click', event => chooseSolution(b.dataset.solution, event)));
$('#solution-overview').addEventListener('click', () => chooseSolution(null));
$('#solution-cta').addEventListener('click', () => setMessage(solution ? messages[solution] || `Olá! Tenho interesse em energia solar para um imóvel ${solution}.` : config.generalMessage));
let cameraResizeFrame;
function refreshScene() {
 cancelAnimationFrame(cameraResizeFrame);
 cameraResizeFrame = requestAnimationFrame(() => { reserveSolutionCopy(); updateCamera(true); });
}
if ('ResizeObserver' in window) {
 const sceneObserver = new ResizeObserver(refreshScene);
 sceneObserver.observe(scene);
 sceneObserver.observe($('.solution-note'));
} else window.addEventListener('resize', refreshScene);
camera.addEventListener('load', refreshScene);
document.fonts?.ready.then(refreshScene);
cameraMotion.addEventListener('change', () => updateCamera(true));
refreshScene();
$$('[data-project]').forEach(b => b.addEventListener('click', () => {
 project=b.dataset.project;
 $$('[data-project]').forEach(el => el.setAttribute('aria-pressed',String(el===b)));
 $('#project-summary').textContent = {residencial:'Residencial · Solução para o consumo da sua casa.',empresarial:'Empresarial · Solução para o consumo da sua empresa.',rural:'Rural · Solução para as necessidades da sua produção.'}[project];
}));
$('#project-cta').addEventListener('click', () => setMessage(messages.project || 'Olá! Vi os projetos no site e gostaria de uma solução para o meu imóvel.'));
$$('[data-message]').forEach(el => el.addEventListener('click', () => setMessage(messages[el.dataset.message] || config.generalMessage)));
$$('[data-context]').forEach(el => el.addEventListener('click', () => setMessage(el.dataset.context)));
// Measure the one global header, including font/configuration changes.
const header = $('.site-header');
function measureHeader() {
 document.documentElement.style.setProperty('--header-height', `${header.getBoundingClientRect().height}px`);
}
measureHeader();
if ('ResizeObserver' in window) new ResizeObserver(measureHeader).observe(header);
else window.addEventListener('resize', measureHeader);
document.fonts?.ready.then(measureHeader);
const nav = $('#navigation'), menu = $('.menu-toggle');
function closeMenu(returnFocus = false) { nav.classList.remove('open'); menu.setAttribute('aria-expanded','false'); menu.firstChild.textContent = 'Abrir menu '; if(returnFocus) menu.focus(); }
menu.addEventListener('click', () => {
 const open = menu.getAttribute('aria-expanded') !== 'true';
 menu.setAttribute('aria-expanded',String(open)); nav.classList.toggle('open',open); menu.firstChild.textContent = open ? 'Fechar menu ' : 'Abrir menu ';
});
nav.addEventListener('click', e => {
 if(e.target.closest('a')) { const link=e.target.closest('a'); if(link.hash === '#contato')setMessage(messages[link.dataset.message || 'contact'] || config.generalMessage); const target = $(link.getAttribute('href'));closeMenu(); activateNavigation(target); target.setAttribute('tabindex','-1');target.focus({preventScroll:true}); }
});
document.addEventListener('keydown',e => { if(e.key==='Escape' && menu.getAttribute('aria-expanded')==='true') closeMenu(true); });
document.addEventListener('click',e => { if(!e.target.closest('.site-header') && menu.getAttribute('aria-expanded')==='true')closeMenu(); });
const narrow = matchMedia('(max-width:1023px)');
narrow.addEventListener('change',()=>closeMenu());
// One scrollspy writer: the section crossing the first quarter below the header.
const sections = $$('main > section');
const sectionLinks = $$('#navigation a:not(.menu-proposal)');
let spyFrame = 0, pendingNavigation = null, navigationTimer;
function setActiveSection(id) {
 sectionLinks.forEach(link => {
  if (link.hash === `#${id}`) link.setAttribute('aria-current', 'location');
  else link.removeAttribute('aria-current');
 });
}
function updateScrollspy() {
 spyFrame = 0;
 const top = header.getBoundingClientRect().height;
 const line = top + Math.max(0, innerHeight - top) * .25;
 const positions = sections.map(section => ({section, rect:section.getBoundingClientRect()}));
 const current = positions.find(({rect}) => rect.top <= line && rect.bottom > line)
  || (positions[0].rect.top > line ? positions[0] : positions.at(-1));
 if (pendingNavigation) {
  if (current.section === pendingNavigation.section || performance.now() >= pendingNavigation.until) pendingNavigation = null;
  else { setActiveSection(pendingNavigation.section.id); return; }
 }
 setActiveSection(current.section.id);
}
function scheduleScrollspy() {
 if (!spyFrame) spyFrame = requestAnimationFrame(updateScrollspy);
}
function releaseNavigation() {
 pendingNavigation = null;
 clearTimeout(navigationTimer);
 scheduleScrollspy();
}
function activateNavigation(section) {
 pendingNavigation = {section, until: performance.now() + 1400};
 clearTimeout(navigationTimer);
 navigationTimer = setTimeout(releaseNavigation, 1400);
 setActiveSection(section.id);
}
window.addEventListener('scroll', scheduleScrollspy, {passive:true});
window.addEventListener('resize', releaseNavigation);
window.addEventListener('hashchange', scheduleScrollspy);
window.addEventListener('pageshow', scheduleScrollspy);
window.addEventListener('popstate', releaseNavigation);
window.addEventListener('scrollend', releaseNavigation);
['wheel', 'touchstart', 'pointerdown'].forEach(type => window.addEventListener(type, releaseNavigation, {passive:true}));
document.addEventListener('keydown', event => {
 if (['ArrowUp','ArrowDown','PageUp','PageDown','Home','End',' '].includes(event.key)) releaseNavigation();
});
if ('ResizeObserver' in window) {
 const spyObserver = new ResizeObserver(scheduleScrollspy);
 [header, ...sections].forEach(element => spyObserver.observe(element));
}
document.fonts?.ready.then(scheduleScrollspy);
scheduleScrollspy();
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
$$('.faq-item h3 button').forEach(button => button.addEventListener('click', () => {
 const open = button.getAttribute('aria-expanded') !== 'true';
 if (open) $$('.faq-item h3 button[aria-expanded="true"]').filter(other => other !== button).forEach(other => setAnswer(other, false));
 setAnswer(button, open);
}));
function filterFaq(){
 const term=normalize($('#faq-search').value.trim());let count=0;
 $$('.faq-item').forEach(item=>{const match=normalize(item.textContent).includes(term);if(!match&&item.contains(document.activeElement))$('#faq-search').focus();item.hidden=!match;if(match)count++;});
 $('#no-results').hidden=count!==0;$('#search-status').textContent=`${count} ${count===1?'resposta encontrada':'respostas encontradas'}.`;
}
$('#faq-search').addEventListener('input',filterFaq);$('#clear-search').addEventListener('click',()=>{$('#faq-search').value='';filterFaq();$('#faq-search').focus();});filterFaq();
// Entrances run once, without hidden CSS states, scroll interception or photo scaling.
const motion = matchMedia('(prefers-reduced-motion:reduce)');
const entered = new WeakSet();
let entranceObserver;
const entranceTargets = $$('.hero-copy > .eyebrow, .hero-copy h1, .hero-support > .lead, .hero-support .actions > a, .hero-disclaimer, .section-intro .eyebrow, .section-intro h2, .section-intro p:not(.eyebrow), .solution-options button, .solution-note, .timeline li, .process-section .actions, .project-types, .project-panel, .faq-surface, .faq-section .actions, .contact-native, .contact-portrait, .scene-visual');
function enter(element) {
 if (entered.has(element) || motion.matches) return;
 entered.add(element);
 const photo = element.matches('.scene-visual, .contact-portrait');
 let delay = 0;
 if (element.matches('h1, h2')) delay = 60;
 else if (element.matches('.lead, .section-intro p:not(.eyebrow)')) delay = 120;
 else if (element.matches('.hero-support .actions > a')) delay = 180 + $$('.hero-support .actions > a').indexOf(element) * 60;
 else if (element.matches('.hero-disclaimer, .solution-note')) delay = 210;
 else if (element.matches('.timeline li, .solution-options button')) delay = [...element.parentElement.children].indexOf(element) * 70;
 const from = photo ? {opacity: 0} : {opacity: 0, translate: '0 14px'};
 const to = photo ? {opacity: 1} : {opacity: 1, translate: '0 0'};
 element.animate([from, to], {duration: photo ? 620 : 560, delay, easing: 'cubic-bezier(.2,.65,.25,1)', fill: 'backwards'});
}
function startEntrances(initial = false) {
 if (motion.matches || !('IntersectionObserver' in window) || !Element.prototype.animate) return;
 entranceObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
   if (!entry.isIntersecting) return;
   enter(entry.target);
   entranceObserver.unobserve(entry.target);
  });
 }, {threshold: .06});
 entranceTargets.forEach(element => {
  if (!initial && element.getBoundingClientRect().top < innerHeight) entered.add(element);
  if (!entered.has(element)) entranceObserver.observe(element);
 });
 if (initial) header.animate([{opacity: 0, translate: '0 -8px'}, {opacity: 1, translate: '0 0'}], {duration: 400, easing: 'ease-out'});
}
startEntrances(true);
motion.addEventListener('change', event => {
 if (event.matches) {
  entranceObserver?.disconnect();
  document.getAnimations().forEach(animation => animation.finish());
 } else startEntrances();
});
