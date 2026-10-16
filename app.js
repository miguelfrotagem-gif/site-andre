'use strict';
document.documentElement.classList.add('js');
const messages = {
  geral: 'Olá, GJ Ar Condicionado! Gostaria de conversar sobre seus serviços.',
  orcamento: 'Olá, GJ Ar Condicionado! Gostaria de um orçamento para um serviço de ar-condicionado.',
  instalacao: 'Olá, GJ! Gostaria de saber mais e pedir um orçamento para instalação de ar-condicionado.',
  agendamento: 'Olá, GJ Ar Condicionado! Gostaria de agendar uma avaliação, higienização ou manutenção do meu ar-condicionado. Podemos consultar a disponibilidade?',
  manutencao: 'Olá, GJ! Gostaria de saber mais sobre higienização e manutenção de ar-condicionado.',
  encomendas: 'Olá, GJ! Preciso de uma encomenda urgente entre Brasília e Goiânia. Gostaria de consultar disponibilidade e valores.'
};
const whatsappURL = message => `https://wa.me/556193995799?text=${encodeURIComponent(message)}`;
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
  sections.forEach(id => { if (document.getElementById(id).getBoundingClientRect().top <= 170) current = id; });
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
if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver(entries => entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add('visible'); observer.unobserve(entry.target); } }), { threshold: .08 });
  document.querySelectorAll('.reveal').forEach(element => observer.observe(element));
} else document.querySelectorAll('.reveal').forEach(element => element.classList.add('visible'));
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
if (brandIntro && !motionPreference.matches && !introSeen) {
  const brandMark = document.querySelector('header .brand-logo');
  const box = brandMark.getBoundingClientRect();
  brandIntro.style.setProperty('--logo-dx', `${box.left + box.width / 2 - innerWidth / 2}px`);
  brandIntro.style.setProperty('--logo-dy', `${box.top + box.height / 2 - innerHeight / 2}px`);
  brandIntro.style.setProperty('--logo-scale', String(box.width / Math.min(240, innerWidth * .55)));
  brandIntro.hidden = false;
  try { sessionStorage.setItem('gj-intro-seen', '1'); } catch {}
  introTimer = setTimeout(finishIntro, 2900);
}
brandIntro?.querySelector('.intro-skip').addEventListener('click', finishIntro);
document.addEventListener('keydown', event => { if (event.key === 'Escape' || event.key === 'Tab') finishIntro(); });
motionPreference.addEventListener('change', event => { if (event.matches) finishIntro(); });
addEventListener('resize', finishIntro);
