'use strict';
document.documentElement.classList.add('js');
const contactNumber = window.GJ_CONFIG.whatsapp;
const contactDigits = contactNumber.replace(/\D/g, '');
document.querySelectorAll('[data-contact-phone]').forEach(element => { element.textContent = contactNumber; });
const messages = {
  geral: 'Olá, GJ Ar Condicionado! Gostaria de conversar sobre seus serviços.',
  orcamento: 'Olá, GJ Ar Condicionado! Gostaria de um orçamento para um serviço de ar-condicionado.',
  instalacao: 'Olá, GJ! Gostaria de saber mais e pedir um orçamento para instalação de ar-condicionado.',
  agendamento: 'Olá, GJ Ar Condicionado! Gostaria de agendar uma avaliação, higienização ou manutenção do meu ar-condicionado. Podemos consultar a disponibilidade?',
  manutencao: 'Olá, GJ! Gostaria de consultar as opções de manutenção do meu ar-condicionado.',
  higienizacao: 'Olá, GJ! Gostaria de solicitar higienização do meu ar-condicionado e consultar disponibilidade e valores.',
  encomendas: 'Olá, GJ! Preciso de uma encomenda urgente entre Brasília e Goiânia. Gostaria de consultar disponibilidade e valores.'
};
const whatsappURL = message => `https://wa.me/${contactDigits}?text=${encodeURIComponent(message)}`;
document.querySelectorAll('[data-wa]').forEach(link => {
  link.href = whatsappURL(messages[link.dataset.wa]);
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
});
const toggle = document.querySelector('.menu-toggle');
const nav = document.querySelector('#navigation');
function closeMenu() { toggle.setAttribute('aria-expanded', 'false'); toggle.setAttribute('aria-label', 'Abrir menu'); nav.classList.remove('open'); }
toggle.addEventListener('click', () => { const open = toggle.getAttribute('aria-expanded') !== 'true'; toggle.setAttribute('aria-expanded', String(open)); toggle.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu'); nav.classList.toggle('open', open); });
nav.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
document.addEventListener('keydown', event => { if (event.key === 'Escape' && nav.classList.contains('open')) { closeMenu(); toggle.focus(); } });
document.addEventListener('click', event => { if (!event.target.closest('header')) closeMenu(); });
matchMedia('(min-width: 761px)').addEventListener('change', closeMenu);
const header = document.querySelector('header');
let scheduled = false;
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
function updateScroll() {
  header.classList.toggle('scrolled', scrollY > 15);
  const sections = ['inicio', 'servicos', 'manutencao', 'empresa', 'contato'];
  let current = 'inicio';
  sections.forEach(id => { if (document.getElementById(id).getBoundingClientRect().top <= header.offsetHeight + 24) current = id; });
  nav.querySelectorAll('a[href^="#"]').forEach(link => { const active = link.hash === `#${current}`; link.classList.toggle('active', active); if (active) link.setAttribute('aria-current', 'location'); else link.removeAttribute('aria-current'); });
  const photo = document.querySelector('.company-photo img');
  if (photo) {
    const bounds = photo.parentElement.getBoundingClientRect();
    if (!reducedMotion.matches && bounds.bottom > 0 && bounds.top < innerHeight) photo.style.transform = `scale(1.025) translateY(${Math.max(-6, Math.min(6, (bounds.top - innerHeight / 2) * .012))}px)`;
    else photo.style.transform = '';
  }
  scheduled = false;
}
addEventListener('scroll', () => { if (!scheduled) { requestAnimationFrame(updateScroll); scheduled = true; } }, {passive:true});
updateScroll();
// O conteúdo é visível por padrão; a animação é apenas uma melhoria opcional.
if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver(entries => entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    const element = entry.target;
    element.classList.add('visible');
    if (!reducedMotion.matches && element.animate && !element.contains(document.activeElement)) {
      const animation = element.animate([{opacity:.35, transform:'translateY(10px)'}, {opacity:1, transform:'translateY(0)'}], {duration:550, easing:'cubic-bezier(.2,.7,.3,1)'});
      const stop = () => animation.cancel();
      element.addEventListener('focusin', stop, {once:true});
      animation.finished.catch(() => {}).finally(() => element.removeEventListener('focusin', stop));
    }
    observer.unobserve(element);
  }), { threshold: .08 });
  document.querySelectorAll('.reveal').forEach(element => observer.observe(element));
}
reducedMotion.addEventListener('change', event => {
  if (event.matches) document.querySelectorAll('.reveal').forEach(element => element.getAnimations().forEach(animation => animation.cancel()));
});
document.querySelector('#year').textContent = new Date().getFullYear();

// Abertura decorativa: uma vez por sessão, sem bloquear a navegação.
const brandIntro = document.querySelector('#brand-intro');
const motionPreference = matchMedia('(prefers-reduced-motion: reduce)');
let introTimer;
function finishIntro() {
  if (!brandIntro || brandIntro.hidden) return;
  const hadFocus = brandIntro.contains(document.activeElement);
  brandIntro.hidden = true;
  clearTimeout(introTimer);
  if (hadFocus) document.querySelector('header .brand').focus();
}
let introSeen = false;
try { introSeen = sessionStorage.getItem('gj-intro-seen') === '1'; } catch {}
function updateIntroDestination() {
  if (!brandIntro) return;
  const brandMark = document.querySelector('header .brand-logo');
  const box = brandMark.getBoundingClientRect();
  brandIntro.style.setProperty('--logo-dx', `${box.left + box.width / 2 - innerWidth / 2}px`);
  brandIntro.style.setProperty('--logo-dy', `${box.top + box.height / 2 - innerHeight / 2}px`);
  brandIntro.style.setProperty('--logo-scale', String(box.width / Math.min(240, innerWidth * .55)));
}
if (brandIntro && !motionPreference.matches && !introSeen) {
  updateIntroDestination();
  brandIntro.hidden = false;
  try { sessionStorage.setItem('gj-intro-seen', '1'); } catch {}
  introTimer = setTimeout(finishIntro, 2900);
}
brandIntro?.querySelector('.intro-skip').addEventListener('click', finishIntro);
document.addEventListener('keydown', event => { if (event.key === 'Escape' || event.key === 'Tab') finishIntro(); });
motionPreference.addEventListener('change', event => { if (event.matches) finishIntro(); });
addEventListener('resize', () => { if (brandIntro && !brandIntro.hidden) updateIntroDestination(); });
