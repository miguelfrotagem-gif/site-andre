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
 const current=sections.find(s=>{const r=s.getBoundingClientRect();return r.top<=line&&r.bottom>line}) || sections[0];
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

// One scroll listener, one scheduled frame; native scrolling stays untouched.
const story = document.querySelector('.protection-story');
if (story) {
 const desktopStory = matchMedia('(min-width: 1024px) and (prefers-reduced-motion: no-preference)');
 const moments = [...story.querySelectorAll('.story-moment')];
 const steps = [...story.querySelectorAll('[data-story-step]')];
 let storyFrame = 0;
 let displayedProgress = null;
 let previousTime = 0;
 const smooth = (a,b,p) => {const t=Math.max(0,Math.min(1,(p-a)/(b-a)));return t*t*(3-2*t);};
 function drawStory(time) {
  storyFrame = 0;
  if (!desktopStory.matches) return;
  const r = story.getBoundingClientRect();
  const target = Math.max(0,Math.min(1,-r.top / Math.max(1,r.height-innerHeight)));
  const elapsed = previousTime ? Math.min(64,time-previousTime) : 16;
  previousTime = time;
  if(displayedProgress===null || r.bottom<=0 || r.top>=innerHeight) displayedProgress=target;
  displayedProgress += (target-displayedProgress)*(1-Math.exp(-elapsed/65));
  if(Math.abs(target-displayedProgress)<.0001)displayedProgress=target;
  const progress = displayedProgress;
  const first = smooth(.18,.45,progress), second = smooth(.55,.82,progress);
  const opacity = [1-first, first-second, second];
  const active = opacity.indexOf(Math.max(...opacity));
  story.style.setProperty('--story-progress',progress);
  moments.forEach((moment,i) => {
   moment.classList.toggle('is-visible',opacity[i]>.001);
   moment.style.setProperty('--moment-opacity',opacity[i]);
   moment.style.setProperty('--image-opacity',i===0?1:i===1?first:second);
   moment.style.setProperty('--copy-opacity',smooth(.5,.9,opacity[i]));
   moment.style.setProperty('--moment-offset',`${(1-opacity[i])*14}px`);
   moment.style.setProperty('--moment-scale',1+Math.abs(progress-i/2)*.012);
   moment.inert = i!==active;
   moment.setAttribute('aria-hidden',String(i!==active));
  });
  steps.forEach((step,i)=>i===active?step.setAttribute('aria-current','step'):step.removeAttribute('aria-current'));
  if(progress!==target) scheduleStory();
 }
 function scheduleStory() {if(!storyFrame)storyFrame=requestAnimationFrame(drawStory);}
 function configureStory() {
  displayedProgress=null;previousTime=0;
  story.classList.toggle('story-enhanced',desktopStory.matches);
  if(!desktopStory.matches) moments.forEach(moment=>{
   moment.inert=false;moment.removeAttribute('aria-hidden');moment.classList.remove('is-visible');
   for(const name of ['--moment-opacity','--image-opacity','--copy-opacity','--moment-offset','--moment-scale'])moment.style.removeProperty(name);
  });
  scheduleStory();
 }
 function scrollStory(){if(desktopStory.matches)scheduleStory();}
 addEventListener('scroll',scrollStory,{passive:true});
 addEventListener('resize',scheduleStory);
 desktopStory.addEventListener('change',configureStory);
 steps.forEach((step,i)=>step.addEventListener('click',()=>{
  const top=story.getBoundingClientRect().top+scrollY;
  scrollTo({top:top+(story.offsetHeight-innerHeight)*(i/2),behavior:'smooth'});
 }));
 addEventListener('pagehide',()=>{
  removeEventListener('scroll',scrollStory);removeEventListener('resize',scheduleStory);
  desktopStory.removeEventListener('change',configureStory);cancelAnimationFrame(storyFrame);
 });
 // Restore listeners when a page returns from the browser back/forward cache.
 addEventListener('pageshow',event=>{if(event.persisted){addEventListener('scroll',scrollStory,{passive:true});addEventListener('resize',scheduleStory);desktopStory.addEventListener('change',configureStory);configureStory();}});
 configureStory();
}

// Branded opening: a single logo moves from the center into its real header slot.
const brandImage = document.querySelector('.brand-logo');
if (brandImage && !reduced.matches) {
 const intro = document.createElement('div');
 intro.className = 'brand-intro';
 intro.setAttribute('role','dialog');intro.setAttribute('aria-modal','true');
 intro.setAttribute('aria-label','Apresentação Henseg — Monitoramento 24hs');
 intro.innerHTML = `<div class="intro-backdrop"></div><div class="intro-center"><img src="${brandImage.getAttribute('src')}" alt="Henseg — Monitoramento 24hs" width="1374" height="1145"><span class="intro-line" aria-hidden="true"><i></i></span><p>Monitoramento 24 horas<br><span>para sua segurança.</span></p></div><button class="intro-skip" type="button">Pular introdução <span aria-hidden="true">→</span></button>`;
 const background=[...document.body.children].filter(el=>el instanceof HTMLElement&&!['SCRIPT','STYLE'].includes(el.tagName));
 const previousInert=background.map(el=>el.inert);
 background.forEach(el=>{el.inert=true;});
 document.body.classList.add('intro-running');document.body.append(intro);
 const skip=intro.querySelector('button'), logo=intro.querySelector('img');
 const introAnimations=[];
 let done=false,deadline;
 const animate=(element,keyframes,options)=>{
  const animation=element.animate(keyframes,options);introAnimations.push(animation);return animation;
 };
 function finishIntro(){
  if(done)return;done=true;clearTimeout(deadline);
  const restoreFocus=intro.contains(document.activeElement);
  introAnimations.forEach(animation=>animation.cancel());intro.remove();
  document.body.classList.remove('intro-running');document.body.classList.add('brand-ready');
  background.forEach((el,i)=>{el.inert=previousInert[i];});
  reduced.removeEventListener('change',reduceIntro);removeEventListener('resize',finishIntro);
  if(restoreFocus){const content=document.querySelector('#conteudo');content.setAttribute('tabindex','-1');content.focus({preventScroll:true});}
 }
 function reduceIntro(){if(reduced.matches)finishIntro();}
 skip.addEventListener('click',finishIntro);
 intro.addEventListener('keydown',event=>{
  if(event.key==='Escape')finishIntro();
  if(event.key==='Tab'){event.preventDefault();skip.focus();}
 });
 reduced.addEventListener('change',reduceIntro);addEventListener('resize',finishIntro,{once:true});
 addEventListener('pagehide',finishIntro,{once:true});skip.focus({preventScroll:true});
 deadline=setTimeout(finishIntro,5000);
 Promise.race([brandImage.decode().catch(()=>{}),new Promise(resolve=>setTimeout(resolve,600))]).then(()=>{
  if(done)return;
  const source=logo.getBoundingClientRect(), target=brandImage.getBoundingClientRect();
  Object.assign(logo.style,{position:'fixed',left:`${source.left}px`,top:`${source.top}px`,width:`${source.width}px`,height:`${source.height}px`,maxHeight:'none',margin:'0',transformOrigin:'top left'});
  const easing='cubic-bezier(.22,.65,.3,1)';
  animate(logo,[{opacity:.12},{opacity:1}],{duration:900,fill:'both',easing});
  animate(intro.querySelector('.intro-line i'),[{transform:'scaleX(0)'},{transform:'scaleX(1)'}],{duration:800,delay:600,fill:'both',easing});
  animate(intro.querySelector('.intro-center p'),[{opacity:0,transform:'translateY(10px)'},{opacity:1,transform:'translateY(0)'}],{duration:800,delay:1050,fill:'both',easing});
  animate(intro.querySelector('.intro-center p'),[{opacity:1},{opacity:0}],{duration:600,delay:2200,fill:'forwards'});
  animate(intro.querySelector('.intro-line'),[{opacity:1},{opacity:0}],{duration:600,delay:2200,fill:'forwards'});
  animate(intro.querySelector('.intro-skip'),[{opacity:1},{opacity:0}],{duration:600,delay:2600,fill:'forwards'});
  animate(intro.querySelector('.intro-backdrop'),[{opacity:1},{opacity:0}],{duration:1600,delay:2200,fill:'both',easing});
  animate(document.querySelector('.site-header'),[{opacity:0},{opacity:1}],{duration:1600,delay:2200,fill:'both',easing});
  animate(document.querySelector('.brand-wordmark'),[{opacity:0},{opacity:1}],{duration:500,delay:3300,fill:'both',easing});
  document.querySelectorAll('.hero .reveal').forEach((element,i)=>animate(element,[{opacity:0,transform:'translateY(16px)'},{opacity:1,transform:'translateY(0)'}],{duration:1100,delay:2200+i*90,fill:'both',easing}));
  const flight=animate(logo,[{transform:'translate(0,0) scale(1,1)'},{transform:`translate(${target.left-source.left}px,${target.top-source.top}px) scale(${target.width/source.width},${target.height/source.height})`}],{duration:1600,delay:2200,fill:'both',easing});
  flight.finished.then(finishIntro).catch(()=>{});
 });
} else { document.body.classList.add('brand-ready'); }
