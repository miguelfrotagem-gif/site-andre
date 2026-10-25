(() => {
 'use strict';
 const motion=matchMedia('(prefers-reduced-motion: reduce)');
 if(motion.matches||(location.hash&&location.hash!=='#inicio'))return;
 const entry=document.createElement('div');
 entry.className='henseg-entry';
 entry.setAttribute('role','dialog');entry.setAttribute('aria-modal','true');entry.setAttribute('aria-label','Bem-vindo à Henseg');
 entry.innerHTML='<div class="entry-identity"><img src="assets/hensec/logo-oficial.png" width="691" height="724" alt="Logomarca Henseg"><p class="entry-name">HENSEG</p><span class="entry-rule" aria-hidden="true"></span><p class="entry-signature">Sua segurança sua paz</p></div><button class="entry-skip" type="button">Pular abertura <span aria-hidden="true">→</span></button>';
 const previousFocus=document.activeElement;
 const regions=[...document.querySelectorAll('.site-header,main,.mobile-footer,.floating-contact')].map(el=>({el,inert:el.inert}));
 let ended=false,leaving=false,exitTimer,fallback;
 function finish(){
  if(ended)return;ended=true;
  clearTimeout(exitTimer);clearTimeout(fallback);clearTimeout(hold);
  const restoreFocus=entry.contains(document.activeElement);
  document.dispatchEvent(new Event('henseg:entry-reveal'));
  entry.remove();document.body.classList.remove('intro-running');
  regions.forEach(({el,inert})=>el.inert=inert);
  if(restoreFocus)(previousFocus?.isConnected&&previousFocus!==document.body?previousFocus:document.querySelector('.brand')).focus({preventScroll:true});
  document.removeEventListener('keydown',keyboard);
 }
 function leave(){if(ended||leaving)return;leaving=true;entry.classList.add('is-leaving');document.dispatchEvent(new Event('henseg:entry-reveal'));exitTimer=setTimeout(finish,700);}
 function keyboard(event){if(event.key==='Escape'){event.preventDefault();finish();}else if(event.key==='Tab'){event.preventDefault();entry.querySelector('button').focus();}}
 document.body.append(entry);document.body.classList.add('intro-running');regions.forEach(({el})=>el.inert=true);
 entry.querySelector('button').addEventListener('click',finish);
 entry.addEventListener('wheel',event=>event.preventDefault(),{passive:false});
 document.addEventListener('keydown',keyboard);
 const hold=setTimeout(leave,3600);
 fallback=setTimeout(finish,5200);
 motion.addEventListener('change',()=>{if(motion.matches)finish();});
 addEventListener('pagehide',finish,{once:true});
})();
