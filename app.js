'use strict';
document.documentElement.classList.add('js');
const messages = {
  geral: 'Olá, GJ Ar Condicionado! Gostaria de conversar sobre seus serviços.',
  orcamento: 'Olá, GJ Ar Condicionado! Gostaria de um orçamento para um serviço de ar-condicionado.',
  instalacao: 'Olá, GJ! Gostaria de saber mais e pedir um orçamento para instalação de ar-condicionado.',
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
  const sections = ['inicio', 'servicos', 'empresa', 'contato'];
  let current = 'inicio';
  sections.forEach(id => { if (document.getElementById(id).getBoundingClientRect().top <= 170) current = id; });
  nav.querySelectorAll('a[href^="#"]').forEach(link => { const active = link.hash === `#${current}`; link.classList.toggle('active', active); if (active) link.setAttribute('aria-current', 'location'); else link.removeAttribute('aria-current'); });
  const photo = document.querySelector('.about-image img');
  const bounds = photo.parentElement.getBoundingClientRect();
  if (!reducedMotion.matches && bounds.bottom > 0 && bounds.top < innerHeight) photo.style.transform = `scale(1.045) translateY(${Math.max(-9, Math.min(9, (bounds.top - innerHeight / 2) * .02))}px)`;
  else photo.style.transform = '';
  scheduled = false;
}
addEventListener('scroll', () => { if (!scheduled) { requestAnimationFrame(updateScroll); scheduled = true; } }, {passive:true});
updateScroll();
if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver(entries => entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add('visible'); observer.unobserve(entry.target); } }), { threshold: .08 });
  document.querySelectorAll('.reveal').forEach(element => observer.observe(element));
} else document.querySelectorAll('.reveal').forEach(element => element.classList.add('visible'));
const form = document.querySelector('#quote-form');
const phone = document.querySelector('#phone');
const nameInput = document.querySelector('#name');
phone.addEventListener('input', () => phone.setCustomValidity(''));
nameInput.addEventListener('input', () => nameInput.setCustomValidity(''));
form.addEventListener('submit', event => {
  event.preventDefault();
  const name = nameInput.value.trim();
  let digits = phone.value.replace(/\D/g, '');
  if (digits.startsWith('55') && digits.length > 11) digits = digits.slice(2);
  if (name.length < 2) { nameInput.setCustomValidity('Informe seu nome com pelo menos dois caracteres.'); nameInput.reportValidity(); return; }
  if (!/^[1-9]{2}(?:[2-5]\d{7}|9\d{8})$/.test(digits)) { phone.setCustomValidity('Informe um telefone válido com DDD, como (61) 99999-9999.'); phone.reportValidity(); return; }
  if (!form.reportValidity()) return;
  const service = document.querySelector('#service').value;
  const category = service.startsWith('Encomendas') ? 'consultar uma encomenda urgente entre Brasília e Goiânia' : 'solicitar um orçamento de ar-condicionado';
  const message = `Olá, GJ Ar Condicionado! Gostaria de ${category}.\n\nNome: ${name}\nTelefone: ${phone.value.trim()}\nServiço desejado: ${service}`;
  window.open(whatsappURL(message), '_blank', 'noopener,noreferrer');
  document.querySelector('#form-status').textContent = 'Mensagem preparada. Se o WhatsApp não abriu, use o link abaixo para continuar.';
  let fallback = document.querySelector('#whatsapp-fallback');
  if (!fallback) { fallback = document.createElement('a'); fallback.id = 'whatsapp-fallback'; fallback.className = 'text-link'; fallback.textContent = 'Abrir minha mensagem no WhatsApp ↗'; fallback.target = '_blank'; fallback.rel = 'noopener noreferrer'; form.append(fallback); }
  fallback.href = whatsappURL(message);
});
document.querySelector('#year').textContent = new Date().getFullYear();
