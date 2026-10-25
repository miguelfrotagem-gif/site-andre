(() => {
 'use strict';
 const mobile=matchMedia('(max-width: 767px), (max-width: 1023px) and (max-height: 500px)');
 const header=document.querySelector('.site-header');
 const menu=header.querySelector('#navigation');
 const toggle=header.querySelector('.menu-toggle');
 const floating=document.querySelector('.floating-contact');
 const notice=document.querySelector('#cookie-notice');
 const number=String(window.HENSEC_CONFIG?.whatsappNumber||'').replace(/\D/g,'');
 const explore=document.querySelector('[data-hero-explore]');
 function responsiveLinks(){explore.hash=mobile.matches?'solucoes':'tecnologias';syncFloating();}
 mobile.addEventListener('change',responsiveLinks);
 // Close the menu before its destination receives focus; Escape is handled in app.js.
 menu.addEventListener('click',event=>{
  const link=event.target.closest('.mobile-nav');if(!link)return;
  const target=document.querySelector(link.hash);
  if(target){target.tabIndex=-1;target.focus({preventScroll:true});}
 });
 // A keyboard user can cycle through the open mobile menu without entering hidden content.
 header.addEventListener('keydown',event=>{
  if(!mobile.matches||!menu.classList.contains('open')||event.key!=='Tab')return;
  const items=[toggle,...menu.querySelectorAll('.mobile-nav')];
  const i=items.indexOf(document.activeElement);
  if(event.shiftKey&&i===0){event.preventDefault();items.at(-1).focus();}
  else if(!event.shiftKey&&i===items.length-1){event.preventDefault();toggle.focus();}
 });
 const contactMessages={geral:'Olá! Gostaria de uma solução de segurança para o meu espaço.',projeto:'Olá! Gostaria de planejar a segurança do meu espaço com a Henseg.'};
 if(/^[1-9]\d{9,14}$/.test(number))document.querySelectorAll('[data-contact-link]').forEach(link=>{link.href=`https://wa.me/${number}?text=${encodeURIComponent(contactMessages[link.dataset.contactLink])}`;});
 document.querySelectorAll('.m-faq-item,.m-complementary').forEach(item=>{const sync=()=>item.querySelector('summary').setAttribute('aria-expanded',String(item.open));item.addEventListener('toggle',sync);sync();});
 // Keep WhatsApp visible while scrolling; only move it above the privacy notice.
 let floatingFrame=0;
 function syncFloating(){if(!floatingFrame)floatingFrame=requestAnimationFrame(()=>{
  floatingFrame=0;
  floating.removeAttribute('data-mobile-obscured');
  if(notice.hidden){floating.style.removeProperty('bottom');return;}
  const offset=Math.ceil(innerHeight-notice.getBoundingClientRect().top+12);
  floating.style.bottom=`${Math.max(12,Math.min(offset,innerHeight-floating.offsetHeight-12))}px`;
 });}
 addEventListener('resize',syncFloating);
 new MutationObserver(syncFloating).observe(notice,{attributes:true,attributeFilter:['hidden']});
 new ResizeObserver(syncFloating).observe(notice);
 responsiveLinks();
})();
