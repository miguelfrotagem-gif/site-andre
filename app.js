const config = window.RECGAZ_CONFIG;
for (const element of document.querySelectorAll('[data-product]')) element.textContent = config.product[element.dataset.product];
const dialog = document.querySelector('#contact-notice');
document.querySelectorAll('[data-contact]').forEach(button => button.addEventListener('click', () => {
  if (button.closest('.mobile-nav')) setMenu(false,true);
  const phone = config.whatsapp.replace(/\D/g, '');
  if (!/^\d{10,15}$/.test(phone)) { dialog.showModal(); return; }
  const url = `https://wa.me/${phone}?text=${encodeURIComponent(config.messages[button.dataset.contact])}`;
  window.open(url, '_blank', 'noopener,noreferrer');
}));
dialog.querySelector('.dialog-close').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', e => { if (e.target === dialog) { const r=dialog.getBoundingClientRect(); if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom) dialog.close(); }});
const menuButton=document.querySelector('.menu-toggle'), menu=document.querySelector('.mobile-nav');
function setMenu(open,restore=false){menuButton.setAttribute('aria-expanded',String(open));menuButton.setAttribute('aria-label',open?'Fechar menu':'Abrir menu');menu.classList.toggle('open',open);menu.inert=!open;if(open){setTimeout(()=>{if(menu.classList.contains('open'))menu.querySelector('a').focus();},40);}else if(restore)menuButton.focus();}
menuButton.addEventListener('click',()=>setMenu(menuButton.getAttribute('aria-expanded')!=='true'));
menu.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>setMenu(false,true)));
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&menuButton.getAttribute('aria-expanded')==='true'){setMenu(false,true);}});
document.addEventListener('click',e=>{if(!e.target.closest('.site-header')&&menuButton.getAttribute('aria-expanded')==='true')setMenu(false);});
matchMedia('(min-width:801px)').addEventListener('change',e=>{if(e.matches)setMenu(false);});
const items=[...document.querySelectorAll('.faq-item')];
items.forEach(item=>item.querySelector('.answer').inert=!item.classList.contains('is-open'));
menu.inert=true;
items.forEach(item=>item.querySelector('button').addEventListener('click',()=>{
 const open=!item.classList.contains('is-open');
 items.forEach(other=>{const active=other===item&&open;other.classList.toggle('is-open',active);other.querySelector('button').setAttribute('aria-expanded',String(active));other.querySelector('.answer').inert=!active;});
}));
const reduce=matchMedia('(prefers-reduced-motion:reduce)');
// A abertura é decorativa; não recebe foco nem intercepta cliques.
if (!reduce.matches && !location.hash) {
 const intro=document.createElement('div');
 intro.className='brand-intro';
 intro.setAttribute('aria-hidden','true');
 intro.innerHTML='<div class="intro-mark"><svg><use href="#flame"/></svg><div class="intro-word"><span>recgaz</span></div><span class="intro-caption">O calor dos seus momentos</span></div>';
 document.body.append(intro);
 const dismissIntro=()=>intro.remove();
 intro.addEventListener('animationend',event=>{if(event.target===intro)dismissIntro();});
 setTimeout(dismissIntro,1500);
 addEventListener('keydown',dismissIntro,{once:true});
 reduce.addEventListener('change',event=>{if(event.matches)dismissIntro();},{once:true});
}
document.querySelectorAll('.product-info,.about-heading,.about-body,.contact-grid>.reveal,.section-heading').forEach(group=>{
 [...group.children].forEach((child,index)=>{
  child.classList.add('motion-detail');
  child.style.setProperty('--detail-delay',`${Math.min(index*65,260)}ms`);
 });
});
document.querySelectorAll('.faq-item').forEach((item,index)=>item.style.setProperty('--detail-delay',`${index*65}ms`));

if('IntersectionObserver' in window){
 const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.remove('waiting');observer.unobserve(entry.target);}}),{threshold:.08});
 if(!reduce.matches)document.querySelectorAll('.reveal').forEach(el=>{if(el.getBoundingClientRect().top>innerHeight){el.classList.add('waiting');observer.observe(el);}});
 reduce.addEventListener('change',()=>{if(reduce.matches)document.querySelectorAll('.waiting').forEach(el=>el.classList.remove('waiting'));});
}
const sections=[...document.querySelectorAll('section[id]')], navLinks=[...document.querySelectorAll('.desktop-nav a,.mobile-nav a')];
let scrollPending=false;
function updateNav(){document.querySelector('.site-header').classList.toggle('is-scrolled',scrollY>24);let current='inicio';for(const section of sections){if(section.getBoundingClientRect().top<innerHeight*.4)current=section.id;}navLinks.forEach(link=>{const active=link.hash===`#${current}`;link.classList.toggle('active',active);if(active)link.setAttribute('aria-current','location');else link.removeAttribute('aria-current');});scrollPending=false;}
addEventListener('scroll',()=>{if(!scrollPending){scrollPending=true;requestAnimationFrame(updateNav);}},{passive:true});updateNav();
