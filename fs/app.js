import {getBudgetUrl} from './config.js';
document.documentElement.classList.add('js');
document.querySelectorAll('[data-budget]').forEach(link => {link.href = getBudgetUrl(); if (link.href.startsWith('https://wa.me/')) link.rel = 'noopener noreferrer';});
const toggle = document.querySelector('.menu-toggle');
const nav = document.querySelector('#navigation');
const mobile = matchMedia('(max-width: 900px)');
function closeMenu(returnFocus = false) {toggle.setAttribute('aria-expanded', 'false'); if (mobile.matches) nav.hidden = true; if (returnFocus) toggle.focus({preventScroll: true});}
function syncMenu() {toggle.setAttribute('aria-expanded', 'false'); nav.hidden = mobile.matches;}
syncMenu(); mobile.addEventListener('change', syncMenu);
toggle.addEventListener('click', () => {if (toggle.getAttribute('aria-expanded') === 'true') return closeMenu(true); nav.hidden = false; toggle.setAttribute('aria-expanded', 'true'); nav.querySelector('a').focus();});
document.addEventListener('keydown', event => {if (event.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') closeMenu(true);});
document.addEventListener('click', event => {if (!event.target.closest('.site-header') && toggle.getAttribute('aria-expanded') === 'true') closeMenu();});
document.addEventListener('focusin', event => {if (!event.target.closest('.site-header') && toggle.getAttribute('aria-expanded') === 'true') closeMenu();});
const sections = [...document.querySelectorAll('main > section')];
const navLinks = [...nav.querySelectorAll('a')];
function setActive(id) {navLinks.forEach(link => {if (link.hash === `#${id}`) link.setAttribute('aria-current', 'location'); else link.removeAttribute('aria-current');});}
let frame;
function scrollspy() {cancelAnimationFrame(frame); frame = requestAnimationFrame(() => {const atBottom = innerHeight + scrollY >= document.documentElement.scrollHeight - 3; const probe = Math.min(innerHeight * .32, 280); const section = atBottom ? sections.at(-1) : [...sections].reverse().find(s => s.getBoundingClientRect().top <= probe) || sections[0]; setActive(section.id);});}
addEventListener('scroll', scrollspy, {passive: true}); addEventListener('resize', scrollspy); scrollspy();
document.querySelectorAll('a[href^="#"]').forEach(link => link.addEventListener('click', () => {const section = sections.find(s => `#${s.id}` === link.hash); if (!section) return; const fromMenu = nav.contains(link) && mobile.matches; closeMenu(); if (fromMenu) {section.tabIndex = -1; section.focus({preventScroll: true});}}));
const box = document.querySelector('.lightbox'); let origin;
document.querySelectorAll('.gallery-open').forEach(button => button.addEventListener('click', () => {origin = button; const image = button.querySelector('img'); const full = box.querySelector('img'); full.src = button.dataset.image; full.alt = image.alt; full.width = image.width; full.height = image.height; box.querySelector('#lightbox-title').textContent = button.closest('figure').querySelector('figcaption').textContent; box.showModal();}));
box.querySelector('.lightbox-close').addEventListener('click', () => box.close());
box.addEventListener('keydown', event => {if (event.key === 'Escape') {event.preventDefault();box.close();}});
box.addEventListener('click', event => {if (event.target === box) {const r = box.getBoundingClientRect(); if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) box.close();}});
box.addEventListener('close', () => origin?.focus({preventScroll: true}));
// Content is visible by default, even without JavaScript or IntersectionObserver.
if ('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches) {const observer = new IntersectionObserver(entries => entries.forEach(entry => {if (entry.isIntersecting) {entry.target.classList.add('revealed'); observer.unobserve(entry.target);}}), {threshold: .08}); document.querySelectorAll('.reveal').forEach(element => observer.observe(element));}
