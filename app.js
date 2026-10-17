'use strict';
document.documentElement.classList.add('js');
const toggle = document.querySelector('.menu-toggle');
const navigation = document.getElementById('navigation');
function closeMenu(returnFocus = false) {
  toggle.setAttribute('aria-expanded', 'false');
  navigation.classList.remove('is-open');
  if (returnFocus) toggle.focus();
}
toggle.addEventListener('click', () => {
  const open = toggle.getAttribute('aria-expanded') !== 'true';
  toggle.setAttribute('aria-expanded', String(open));
  navigation.classList.toggle('is-open', open);
  if (open) playMotion(navigation, [{opacity:.3, transform:'translateY(-8px)'},{opacity:1, transform:'translateY(0)'}], {duration:220}, 'mobile-menu');
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') closeMenu(true);
});
document.addEventListener('click', event => {
  if (!event.target.closest('.site-header')) closeMenu();
});
navigation.querySelectorAll('a').forEach(link => link.addEventListener('click', () => closeMenu()));
matchMedia('(min-width:701px)').addEventListener('change', () => closeMenu());

const rawPhone = window.AUTO_CONFIG?.whatsapp || '';
const phone = rawPhone.replace(/\D/g, '');
const configured = /^\d{10,15}$/.test(phone);
const whatsapp = document.querySelector('[data-whatsapp]');
const contactStatus = document.getElementById('contact-status');
const selectedService = document.getElementById('selected-service');
function whatsappUrl(service) {
  return `https://wa.me/${phone}?text=${encodeURIComponent(`Olá! Gostaria de saber mais sobre ${service.toLowerCase()} para meu carro.`)}`;
}
if (configured) {
  whatsapp.href = whatsappUrl('os serviços de estética automotiva');
  whatsapp.target = '_blank';
  whatsapp.rel = 'noopener noreferrer';
  contactStatus.textContent = `WhatsApp: ${rawPhone}`;
  document.querySelectorAll('[data-contact]').forEach(link => {
    link.href = whatsappUrl(link.dataset.contact);
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
  });
}
document.querySelectorAll('[data-service]').forEach(link => link.addEventListener('click', () => {
  const service = link.dataset.service;
  selectedService.hidden = false;
  selectedService.textContent = `Seu interesse: ${service}.`;
  if (configured) whatsapp.href = whatsappUrl(service);
}));

if ('IntersectionObserver' in window) {
  const links = [...navigation.querySelectorAll('a:not(.header-cta)')];
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      links.forEach(link => {
        if (link.hash === `#${entry.target.id}`) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      });
    }
  }, { rootMargin: '-15% 0px -65% 0px', threshold: 0 });
  document.querySelectorAll('#inicio, #servicos, #sobre, #contato').forEach(section => observer.observe(section));
}

// Progressive enhancement: content stays visible if motion is unavailable.
const motionPreference = matchMedia('(prefers-reduced-motion: reduce)');
const desktopPointer = matchMedia('(min-width:901px) and (hover:hover) and (pointer:fine)');
const narrowScreen = matchMedia('(max-width:700px)');
const motionControl = document.querySelector('[data-motion-toggle]');
const activeAnimations = new Set();
let manuallyPaused = false;
let heroVisible = false;
let aboutVisible = false;
let frame = 0;
let pointerX = 0;
let pointerY = 0;
const hero = document.querySelector('.first-fold');
const heroPhoto = document.querySelector('.hero-media img');
const about = document.querySelector('.about');
const aboutPhoto = document.querySelector('.about-photo img');
const supportsMotion = typeof Element.prototype.animate === 'function';
const canMove = () => supportsMotion && !motionPreference.matches && !manuallyPaused;

function playMotion(element, keyframes, options = {}, name = 'reveal') {
  if (!element || !canMove() || document.hidden) return;
  // WAAPI composes over the visible resting state, never requiring hidden CSS.
  const animation = element.animate(keyframes, {
    duration:560, easing:'cubic-bezier(.22,1,.36,1)', fill:'backwards', ...options
  });
  animation.id = name;
  activeAnimations.add(animation);
  animation.finished.then(() => activeAnimations.delete(animation), () => activeAnimations.delete(animation));
  return animation;
}
function enter(element, {x=0, y=22, delay=0, duration=560, name='reveal'} = {}) {
  const distance = narrowScreen.matches ? .6 : 1;
  return playMotion(element, [
    {opacity:0, transform:`translate3d(${x*distance}px,${y*distance}px,0)`},
    {opacity:1, transform:'translate3d(0,0,0)'}
  ], {delay,duration}, name);
}

// Every hero action remains present; all entrance effects finish by 940ms.
playMotion(document.querySelector('.site-header'), [{opacity:.25},{opacity:1}], {duration:350}, 'hero-header');
enter(document.querySelector('.hero-copy .eyebrow'), {y:18,delay:30,duration:420,name:'hero-eyebrow'});
enter(document.querySelector('h1'), {y:22,delay:70,duration:580,name:'hero-title'});
enter(document.querySelector('.hero-subtitle'), {y:18,delay:170,duration:540,name:'hero-subtitle'});
enter(document.querySelector('.hero-actions'), {y:18,delay:270,duration:520,name:'hero-actions'});
enter(heroPhoto, {y:14,delay:340,duration:600,name:'hero-photo'});

if ('IntersectionObserver' in window) {
  const revealActions = new WeakMap();
  const reveal = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      reveal.unobserve(entry.target);
      entry.target.dataset.revealed = 'true';
      revealActions.get(entry.target)?.();
    }
  }, {threshold:.12,rootMargin:'0px 0px -24px 0px'});
  function once(element, action) {
    if (!element) return;
    revealActions.set(element, action);
    reveal.observe(element);
  }
  function heading(selector) {
    const group = document.querySelector(selector);
    once(group, () => {
      enter(group.querySelector('.eyebrow'), {y:18,duration:480});
      enter(group.querySelector('h2'), {delay:80,duration:620});
    });
  }
  heading('.section-heading');
  document.querySelectorAll('.service-card').forEach((card,index) => {
    once(card, () => enter(card, {y:26,delay:narrowScreen.matches ? 0 : index*100,duration:620,name:`service-card-${index}`}));
  });
  once(document.querySelector('.about-photo'), () => enter(document.querySelector('.about-photo'), {x:-22,y:0,duration:680,name:'about-photo'}));
  once(document.querySelector('.about-copy'), () => {
    const copy = document.querySelector('.about-copy');
    enter(copy.querySelector('.eyebrow'), {x:18,y:0,duration:480});
    enter(copy.querySelector('h2'), {x:22,y:0,delay:80,duration:620});
    enter(copy.querySelector('.body-large'), {x:18,y:0,delay:160,duration:600});
    copy.querySelectorAll('.care-values li').forEach((item,index) => enter(item, {y:16,delay:240+index*90,duration:450,name:`care-icon-${index}`}));
  });
  heading('.process-heading');
  once(document.querySelector('.process-steps'), () => {
    const steps = document.querySelector('.process-steps');
    // Separate rows on mobile follow the same 01 → 04 timing.
    if (canMove()) steps.classList.add('steps-animated');
    steps.querySelectorAll('li').forEach((step,index) => {
      step.style.setProperty('--step-delay',`${index*160}ms`);
      enter(step.querySelector('.step-number'), {y:18,delay:index*160,duration:450,name:`process-number-${index}`});
      enter(step.querySelector('h3'), {y:18,delay:60+index*160,duration:450,name:`process-label-${index}`});
      enter(step.querySelector('p'), {y:16,delay:100+index*160,duration:450,name:`process-description-${index}`});
    });
    playMotion(document.querySelector('.process-light'), [
      {opacity:0,transform:'translate3d(-16px,8px,0)'},
      {opacity:.2,offset:.45,transform:'translate3d(0,0,0)'},
      {opacity:0,transform:'translate3d(16px,-8px,0)'}
    ], {duration:1200,easing:'ease-in-out'}, 'process-reflection');
  });
  once(document.querySelector('.contact-photo'), () => enter(document.querySelector('.contact-photo'), {y:14,duration:680,name:'contact-photo'}));
  once(document.querySelector('.contact-copy'), () => {
    const copy = document.querySelector('.contact-copy');
    enter(copy.querySelector('.eyebrow'), {y:18,duration:480});
    enter(copy.querySelector('h2'), {delay:80,duration:600});
    enter(copy.querySelector('.body-large'), {delay:160,duration:560});
    enter(copy.querySelector('.contact-button'), {y:18,delay:240,duration:520,name:'contact-action'});
  });
  const visibility = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (entry.target===hero) heroVisible=entry.isIntersecting;
      if (entry.target===about) aboutVisible=entry.isIntersecting;
    }
    updateMotionState();
    requestMotionFrame();
  }, {threshold:0});
  visibility.observe(hero);
  visibility.observe(about);
}

function requestMotionFrame() {
  if (frame || !canMove() || document.hidden || !desktopPointer.matches) return;
  if (!heroVisible && !aboutVisible) return;
  frame = requestAnimationFrame(() => {
    frame = 0;
    if (!canMove() || document.hidden || !desktopPointer.matches) return;
    if (heroVisible) {
      heroPhoto.style.setProperty('--pointer-x',`${pointerX.toFixed(2)}px`);
      heroPhoto.style.setProperty('--pointer-y',`${pointerY.toFixed(2)}px`);
    }
    if (aboutVisible) {
      const bounds=about.getBoundingClientRect();
      const progress=Math.max(0,Math.min(1,(innerHeight-bounds.top)/(innerHeight+bounds.height)));
      aboutPhoto.style.setProperty('--photo-drift',`${((progress-.5)*12).toFixed(2)}px`);
    }
  });
}
hero.addEventListener('pointermove', event => {
  if (!desktopPointer.matches || !canMove() || !heroVisible) return;
  pointerX=(event.clientX/innerWidth-.5)*8;
  pointerY=(event.clientY/innerHeight-.5)*4;
  requestMotionFrame();
}, {passive:true});
hero.addEventListener('pointerleave', () => {pointerX=0;pointerY=0;requestMotionFrame();}, {passive:true});
window.addEventListener('scroll',requestMotionFrame,{passive:true});
window.addEventListener('resize',requestMotionFrame,{passive:true});

function updateMotionState() {
  const enabled=canMove();
  document.documentElement.classList.toggle('motion-active',enabled);
  document.documentElement.classList.toggle('motion-paused',!enabled);
  hero.classList.toggle('light-running',enabled && heroVisible && !document.hidden);
  motionControl.hidden=!supportsMotion || motionPreference.matches;
  motionControl.setAttribute('aria-pressed',String(manuallyPaused));
  motionControl.textContent=manuallyPaused ? 'Ativar animações' : 'Pausar animações';
  if (!enabled) {
    for (const animation of activeAnimations) animation.cancel();
    activeAnimations.clear();
    if (frame) cancelAnimationFrame(frame);
    frame=0;
  }
  if (!enabled || !desktopPointer.matches || !heroVisible) {
    pointerX=0;pointerY=0;
    heroPhoto.style.removeProperty('--pointer-x');
    heroPhoto.style.removeProperty('--pointer-y');
  }
  if (!enabled || !desktopPointer.matches) aboutPhoto.style.removeProperty('--photo-drift');
}
motionControl.addEventListener('click', () => {
  manuallyPaused=!manuallyPaused;
  updateMotionState();
  requestMotionFrame();
});
motionPreference.addEventListener('change',updateMotionState);
desktopPointer.addEventListener('change',() => {updateMotionState();requestMotionFrame();});
document.addEventListener('visibilitychange',() => {
  for (const animation of activeAnimations) {
    if (document.hidden) animation.pause();
    else if (canMove()) animation.play();
  }
  updateMotionState();
  requestMotionFrame();
});
updateMotionState();
