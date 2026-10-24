const config = window.HENSEC_CONFIG || {messages:{}};
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const nav = document.querySelector('#navigation');
const toggle = document.querySelector('.menu-toggle');
const sections = [...document.querySelectorAll('main > section')];
const links = [...nav.querySelectorAll('a')];
let selected = 'geral';
const number = String(config.whatsappNumber || '').replace(/\D/g, '');
const validNumber = /^[1-9]\d{9,14}$/.test(number);
const cta = document.querySelector('#whatsapp-cta');
const status = document.querySelector('#contact-status');
function updateContact(context) {
 selected = context;
 status.hidden = true;
 cta.href = validNumber ? `https://wa.me/${number}?text=${encodeURIComponent(config.messages[context] || config.messages.geral || '')}` : '#contact-status';
 if(validNumber){cta.target='_blank';cta.rel='noopener noreferrer';}
}
updateContact(selected);
const floatingContact = document.querySelector('.floating-contact');
if (validNumber && floatingContact) {
 floatingContact.href = `https://wa.me/${number}?text=${encodeURIComponent(config.messages.geral || '')}`;
 floatingContact.target = '_blank';
 floatingContact.rel = 'noopener noreferrer';
 floatingContact.setAttribute('aria-label','Conversar com a Henseg pelo WhatsApp');
}
function unavailable(event) {
 if(validNumber)return;
 event.preventDefault();
 status.textContent = 'O WhatsApp ainda não está disponível. Tente novamente em breve.';
 status.hidden = false;
 status.focus({preventScroll:true});
}
cta.addEventListener('click', unavailable);
document.querySelector('[data-question]').addEventListener('click', event => {
 updateContact('duvidas');
 if(validNumber){event.preventDefault();cta.click();}else unavailable(event);
});
document.querySelectorAll('[data-solution]').forEach(link => link.addEventListener('click',()=>updateContact(link.dataset.solution)));
document.querySelectorAll('a[href="#contato"]:not([data-solution])').forEach(link => link.addEventListener('click',()=>updateContact('geral')));
toggle.addEventListener('click',()=>{
 const open=toggle.getAttribute('aria-expanded')!=='true';
 toggle.setAttribute('aria-expanded',String(open));nav.classList.toggle('open',open);
});
function closeMenu(){toggle.setAttribute('aria-expanded','false');nav.classList.remove('open');}
links.forEach(link=>link.addEventListener('click',closeMenu));
document.addEventListener('keydown',event=>{if(event.key==='Escape' && nav.classList.contains('open')){closeMenu();toggle.focus();}});
document.addEventListener('click',event=>{if(!event.target.closest('.site-header'))closeMenu();});
let frame;
function syncSection(){
 cancelAnimationFrame(frame);
 frame=requestAnimationFrame(()=>{
 const line=innerHeight*.42;
 const current=sections.find(s=>{const r=s.getBoundingClientRect();return r.top<=line&&r.bottom>line}) || sections.filter(s=>s.getBoundingClientRect().top<=line).at(-1) || sections[0];
 links.forEach(a=>a.hash===`#${current.dataset.navSection || current.id}`?a.setAttribute('aria-current','location'):a.removeAttribute('aria-current'));
 if(!reduced.matches)sections.forEach(s=>{const r=s.getBoundingClientRect();if(r.bottom>0&&r.top<innerHeight)s.style.setProperty('--parallax',`${Math.max(-20,Math.min(20,-r.top*.025))}px`)});
 });
}
const sectionObserver=new IntersectionObserver(syncSection,{threshold:[0,.25,.5,.75,1]});sections.forEach(s=>sectionObserver.observe(s));
addEventListener('scroll',syncSection,{passive:true});addEventListener('resize',syncSection);syncSection();
const animations=new Set();
const revealObserver=new IntersectionObserver(entries=>entries.forEach(entry=>{
 if(!entry.isIntersecting)return;
 const element=entry.target;revealObserver.unobserve(element);
 if(reduced.matches)return;
 const siblings=[...element.parentElement.children].filter(e=>e.classList.contains('reveal'));
 const delay=Math.min(siblings.indexOf(element)*110,440);
 const animation=element.animate([{opacity:0,transform:'translateY(20px)'},{opacity:1,transform:'translateY(0)'}],{duration:700,delay,easing:'cubic-bezier(.2,.65,.3,1)',fill:'backwards'});
 animations.add(animation);animation.finished.then(()=>animations.delete(animation)).catch(()=>{});
}),{threshold:.12});
document.querySelectorAll('.reveal').forEach(el=>revealObserver.observe(el));
function motion(){document.body.classList.toggle('motion-reduced',reduced.matches);if(reduced.matches){animations.forEach(a=>a.cancel());sections.forEach(s=>s.style.removeProperty('--parallax'));}}
reduced.addEventListener('change',motion);motion();

// Content and calls to action are available immediately; the hero handles its own short reveal.
document.body.classList.add('brand-ready');
