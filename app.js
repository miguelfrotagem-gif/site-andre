const config=window.HENSEC_CONFIG||{messages:{}};
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const mobileLayout=matchMedia('(max-width: 767px), (max-width: 1023px) and (max-height: 500px)');
const nav=document.querySelector('#navigation');
const toggle=document.querySelector('.menu-toggle');
const sections=[...document.querySelectorAll('main > section')];
const links=[...nav.querySelectorAll('a')];
const number=String(config.whatsappNumber||'').replace(/\D/g,'');
const floatingContact=document.querySelector('.floating-contact');
if(/^[1-9]\d{9,14}$/.test(number)&&floatingContact){floatingContact.href=`https://wa.me/${number}?text=${encodeURIComponent(config.messages.geral||'Olá! Gostaria de conversar com a Henseg.')}`;floatingContact.target='_blank';floatingContact.rel='noopener noreferrer';floatingContact.setAttribute('aria-label','Conversar com a Henseg pelo WhatsApp');}
toggle.addEventListener('click',()=>{
 const open=toggle.getAttribute('aria-expanded')!=='true';
 toggle.setAttribute('aria-expanded',String(open));nav.classList.toggle('open',open);
});
function closeMenu(){toggle.setAttribute('aria-expanded','false');nav.classList.remove('open');}
links.forEach(link=>link.addEventListener('click',closeMenu));
document.addEventListener('keydown',event=>{if(event.key==='Escape' && nav.classList.contains('open')){closeMenu();toggle.focus();}});
document.addEventListener('click',event=>{if(!event.target.closest('.site-header'))closeMenu();});
// A single writer selects the menu from the visible page, not the URL hash.
const siteHeader=document.querySelector('.site-header');
const menuHashes=new Set(links.map(link=>link.hash));
let frame=0, pendingNavigation=null, navigationDeadline=0, activeHash='';
function sectionHash(section){
 const group=!mobileLayout.matches&&section.dataset.desktopNav;
 const hash=`#${group || section.dataset.navSection || section.id}`;
 return menuHashes.has(hash)?hash:null;
}
function markSection(section){
 const hash=sectionHash(section);
 const state=`${mobileLayout.matches}:${hash}`;
 if(!hash||state===activeHash)return;
 activeHash=state;
 links.forEach(link=>{const visibleGroup=mobileLayout.matches===link.classList.contains('mobile-nav');link.hash===hash&&visibleGroup?link.setAttribute('aria-current','location'):link.removeAttribute('aria-current')});
}
function clearNavigationIntent(){
 pendingNavigation=null;clearTimeout(navigationDeadline);syncSection();
}
function syncSection(){if(!frame)frame=requestAnimationFrame(updateSection);}
function updateSection(){
 frame=0;
 const viewportBottom=innerHeight;
 const viewportTop=Math.min(viewportBottom-1,Math.max(0,siteHeader.getBoundingClientRect().bottom+12));
 const measured=sections.filter(section=>section.getClientRects().length).map(section=>({section,rect:section.getBoundingClientRect()}));
 let current=null,largestVisible=0;
 for(const {section,rect} of measured){
  const visible=Math.max(0,Math.min(viewportBottom,rect.bottom)-Math.max(viewportTop,rect.top));
  if(visible>largestVisible){current=section;largestVisible=visible;}
 }
 if(!current)current=measured.filter(({rect})=>rect.top<=viewportTop).at(-1)?.section || sections[0];
 // The footer belongs to the final contact section, including on short screens.
 if(scrollY+innerHeight>=document.documentElement.scrollHeight-2)current=measured.at(-1)?.section;
 if(pendingNavigation){
  const rect=pendingNavigation.target.getBoundingClientRect();
  const margin=parseFloat(getComputedStyle(pendingNavigation.target).scrollMarginTop)||0;
  if(Math.abs(rect.top-margin)<3){pendingNavigation=null;clearTimeout(navigationDeadline);}
  else current=pendingNavigation.section;
 }
 markSection(current);
 if(!reduced.matches)for(const {section,rect} of measured){
  if(rect.bottom>0&&rect.top<innerHeight)section.style.setProperty('--parallax',`${Math.max(-20,Math.min(20,-rect.top*.025))}px`);
 }
}
// Keep the clicked destination selected during native smooth scrolling. Manual
// interaction releases it immediately, so an interrupted jump cannot leave stale state.
document.addEventListener('click',event=>{
 if(event.defaultPrevented||event.button>0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
 const link=event.target.closest('a[href^="#"]');
 if(!link)return;
 const target=document.getElementById(link.hash.slice(1));
 const section=target?.closest('main > section');
 if(!target||!section||!sectionHash(section))return;
 clearTimeout(navigationDeadline);
 pendingNavigation={target,section,startedAt:performance.now()};
 markSection(section);
 navigationDeadline=setTimeout(clearNavigationIntent,1800);
 syncSection();
});
for(const event of ['wheel','touchstart','pointerdown'])addEventListener(event,()=>{if(pendingNavigation)clearNavigationIntent();},{passive:true});
addEventListener('keydown',event=>{if(pendingNavigation&&['ArrowUp','ArrowDown','PageUp','PageDown','Home','End',' ','Escape','Tab'].includes(event.key))clearNavigationIntent();});
addEventListener('scroll',syncSection,{passive:true});
addEventListener('scrollend',()=>{if(pendingNavigation&&performance.now()-pendingNavigation.startedAt>100)clearNavigationIntent();else syncSection();});
addEventListener('resize',clearNavigationIntent);mobileLayout.addEventListener('change',clearNavigationIntent);
addEventListener('hashchange',syncSection);addEventListener('popstate',syncSection);
addEventListener('pageshow',event=>event.persisted?clearNavigationIntent():syncSection());
document.addEventListener('load',syncSection,true);
new ResizeObserver(syncSection).observe(document.querySelector('main'));
const sectionSizes=new ResizeObserver(syncSection);sections.forEach(section=>sectionSizes.observe(section));sectionSizes.observe(siteHeader);
const sectionObserver=new IntersectionObserver(syncSection,{threshold:[0,.25,.5,.75,1]});sections.forEach(section=>sectionObserver.observe(section));
document.fonts.ready.then(syncSection);syncSection();
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
