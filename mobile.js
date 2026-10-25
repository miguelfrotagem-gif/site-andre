(() => {
 'use strict';
 const mobile=matchMedia('(max-width: 767px), (max-width: 1023px) and (max-height: 500px)');
 const header=document.querySelector('.site-header');
 const brand=header.querySelector('.brand');
 const headerContact=header.querySelector('.header-cta');
 const menu=header.querySelector('#navigation');
 const toggle=header.querySelector('.menu-toggle');
 const floating=document.querySelector('.floating-contact');
 const notice=document.querySelector('#cookie-notice');
 const form=document.querySelector('#mobile-contact-form');
 const number=String(window.HENSEC_CONFIG?.whatsappNumber||'').replace(/\D/g,'');
 const desktopHashes={inicio:'inicio',solucoes:'solucoes',alarmes:'tecnologia-alarmes',cameras:'tecnologia-cameras',facial:'tecnologia-facial',cerca:'solucoes',interfone:'tecnologias',sobre:'sobre',etapas:'sobre',duvidas:'duvidas',contato:'contato'};
 function responsiveLinks(){
  brand.hash=mobile.matches?'mobile-inicio':'inicio';
  headerContact.hash=mobile.matches?'mobile-contato':'contato';
  if(!mobile.matches){toggle.setAttribute('aria-expanded','false');menu.classList.remove('open');}
 }
 responsiveLinks();mobile.addEventListener('change',()=>{responsiveLinks();syncFloating();});
 // Direct links and browser history keep working across both compositions.
 function resolveHiddenAnchor(){
  const id=decodeURIComponent(location.hash.slice(1));
  const target=document.getElementById(id);
  if(!target||target.getClientRects().length)return;
  const match=mobile.matches?Object.entries(desktopHashes).find(([,desktop])=>desktop===id)?.[0]:desktopHashes[id.replace(/^mobile-/,'')];
  const replacement=match&&document.getElementById(mobile.matches?`mobile-${match}`:match);
  if(replacement){replacement.scrollIntoView({behavior:'instant'});history.replaceState(null,'',`#${replacement.id}`);}
 }
 addEventListener('hashchange',resolveHiddenAnchor);addEventListener('pageshow',resolveHiddenAnchor);
 mobile.addEventListener('change',resolveHiddenAnchor);
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
 const phone=form.elements.telefone,name=form.elements.nome;
 phone.addEventListener('input',()=>phone.setCustomValidity(''));
 name.addEventListener('input',()=>name.setCustomValidity(''));
 form.addEventListener('submit',event=>{
  event.preventDefault();
  name.setCustomValidity(name.value.trim()?'':'Informe seu nome.');
  const digits=phone.value.replace(/\D/g,'').replace(/^55(?=\d{10,11}$)/,'');
  phone.setCustomValidity(/^[1-9]\d{9,10}$/.test(digits)?'':'Informe um WhatsApp válido com DDD.');
  if(!form.reportValidity())return;
  if(!/^[1-9]\d{9,14}$/.test(number)){document.querySelector('#m-form-status').textContent='Não foi possível abrir o contato. Tente novamente em breve.';return;}
  const message=`Olá! Meu nome é ${name.value.trim()}. Gostaria de conversar sobre um projeto de segurança para ${form.elements.ambiente.value.toLowerCase()}. Meu WhatsApp com DDD: ${phone.value.trim()}.`;
  window.open(`https://wa.me/${number}?text=${encodeURIComponent(message)}`,'_blank','noopener,noreferrer');
  document.querySelector('#m-form-status').textContent='Continue no WhatsApp para revisar e enviar sua mensagem. Seus campos continuam preenchidos aqui.';
 });
 // Never cover a field, button, footer, open menu or privacy control with the bubble.
 let floatingFrame=0;
 function syncFloating(){if(!floatingFrame)floatingFrame=requestAnimationFrame(()=>{
  floatingFrame=0;
  if(!mobile.matches){floating.removeAttribute('data-mobile-obscured');return;}
  const r=floating.getBoundingClientRect();
  const overlaps=[...document.querySelectorAll('.mobile-section .m-button,.m-contact-form,.mobile-footer,.m-solution-link,.m-faq-item summary')].some(el=>{
   const b=el.getBoundingClientRect();return b.width&&b.top<r.bottom+8&&b.bottom>r.top-8&&b.left<r.right+8&&b.right>r.left-8;
  });
  floating.toggleAttribute('data-mobile-obscured',overlaps||!notice.hidden||menu.classList.contains('open')||document.querySelector('#privacy-dialog').open);
 });}
 addEventListener('scroll',syncFloating,{passive:true});addEventListener('resize',syncFloating);
 new MutationObserver(syncFloating).observe(notice,{attributes:true,attributeFilter:['hidden']});
 new MutationObserver(syncFloating).observe(menu,{attributes:true,attributeFilter:['class']});
 new MutationObserver(syncFloating).observe(document.querySelector('#privacy-dialog'),{attributes:true,attributeFilter:['open']});
 const layoutObserver=new ResizeObserver(syncFloating);
 [form,document.querySelector('main'),document.querySelector('.mobile-footer')].forEach(el=>layoutObserver.observe(el));syncFloating();
})();
