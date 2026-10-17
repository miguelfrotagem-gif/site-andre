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

if (!matchMedia('(prefers-reduced-motion: reduce)').matches && 'IntersectionObserver' in window && Element.prototype.animate) {
  const reveal = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.animate([{ transform: 'translateY(12px)' }, { transform: 'translateY(0)' }], { duration: 450, easing: 'ease-out' });
      reveal.unobserve(entry.target);
    });
  }, { threshold: .12 });
  document.querySelectorAll('.service-card, .about-copy, .process-heading, .contact-copy').forEach(element => reveal.observe(element));
}
