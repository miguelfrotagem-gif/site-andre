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
 // Never cover contact actions, footer, open menu or privacy controls with the bubble.
 let floatingFrame=0;
 function syncFloating(){if(!floatingFrame)floatingFrame=requestAnimationFrame(()=>{
  floatingFrame=0;
  const r=floating.getBoundingClientRect();
  const overlaps=[...document.querySelectorAll('.mobile-section .m-button,.contact-whatsapp-panel,.contact-auxiliary,.contact-signature-pill,.mobile-footer,.instagram-profile-card,.m-solution-link,.m-faq-item summary')].some(el=>{
   const b=el.getBoundingClientRect();return b.width&&b.top<r.bottom+8&&b.bottom>r.top-8&&b.left<r.right+8&&b.right>r.left-8;
  });
  floating.toggleAttribute('data-mobile-obscured',overlaps||!notice.hidden||menu.classList.contains('open')||document.querySelector('#privacy-dialog').open);
 });}
 addEventListener('scroll',syncFloating,{passive:true});addEventListener('resize',syncFloating);
 new MutationObserver(syncFloating).observe(notice,{attributes:true,attributeFilter:['hidden']});
 new MutationObserver(syncFloating).observe(menu,{attributes:true,attributeFilter:['class']});
 new MutationObserver(syncFloating).observe(document.querySelector('#privacy-dialog'),{attributes:true,attributeFilter:['open']});
 const layoutObserver=new ResizeObserver(syncFloating);
 [document.querySelector('main'),document.querySelector('.mobile-footer')].forEach(el=>layoutObserver.observe(el));responsiveLinks();
})();
