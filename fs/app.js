import {getBudgetUrl} from './config.js?v=900f68ec7c6f';

document.documentElement.classList.add('js');
// Remove legacy notices if an older HTML response is paired with the latest script.
document.querySelectorAll('p.illustrative').forEach(note => note.remove());
const budgetUrl = getBudgetUrl();
document.querySelectorAll('[data-budget]').forEach(link => {link.href = budgetUrl;});
const whatsapp = document.querySelector('[data-whatsapp]');
if (budgetUrl !== '#contato') {
  whatsapp.href = budgetUrl;
  whatsapp.rel = 'noopener noreferrer';
  for (const attribute of ['aria-disabled', 'role', 'tabindex', 'aria-describedby']) whatsapp.removeAttribute(attribute);
  document.querySelector('#whatsapp-note').hidden = true;
} else {
  whatsapp.addEventListener('click', event => event.preventDefault());
  whatsapp.addEventListener('keydown', event => {if (['Enter', ' '].includes(event.key)) event.preventDefault();});
}

const root = document.documentElement;
const layer = document.querySelector('.header-layer');
const header = document.querySelector('.site-header');
const toggle = document.querySelector('.menu-toggle');
const panel = document.querySelector('#menu-panel');
const nav = document.querySelector('#navigation');
const backdrop = document.querySelector('.menu-backdrop');
const mobile = matchMedia('(max-width: 1100px)');
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const sections = [...document.querySelectorAll('main > section')];
const navLinks = [...nav.querySelectorAll('a')];
const background = [document.querySelector('main'), document.querySelector('.skip-link'), document.querySelector('.lightbox')];
let state = 'closed';
let exitTimer;
let savedScroll;
let previousInert = [];
let closeWaiters = [];
let scrollFrame;

function setState(next) {
  state = next;
  layer.dataset.menuState = next;
  const expanded = next === 'open';
  toggle.setAttribute('aria-expanded', String(expanded));
  toggle.setAttribute('aria-label', expanded ? 'Fechar menu' : 'Abrir menu');
}
function settleClose(completed) {
  closeWaiters.splice(0).forEach(resolve => resolve(completed));
}
function lockBackground() {
  if (savedScroll) return;
  window.scrollTo({top:scrollY, left:scrollX, behavior:'instant'});
  savedScroll = {x:scrollX, y:scrollY};
  root.style.setProperty('--scrollbar-gap', `${innerWidth - root.clientWidth}px`);
  document.body.style.top = `-${savedScroll.y}px`;
  document.body.dataset.menuLocked = '';
  previousInert = background.map(element => [element, element.inert]);
  previousInert.forEach(([element]) => {element.inert = true;});
}
function unlockBackground() {
  if (!savedScroll) return;
  const position = savedScroll;
  savedScroll = undefined;
  delete document.body.dataset.menuLocked;
  document.body.style.removeProperty('top');
  root.style.removeProperty('--scrollbar-gap');
  previousInert.forEach(([element, wasInert]) => {element.inert = wasInert;});
  previousInert = [];
  window.scrollTo({left:position.x, top:position.y, behavior:'instant'});
}
function finishClose(returnFocus) {
  clearTimeout(exitTimer);
  setState('closed');
  panel.hidden = mobile.matches;
  backdrop.hidden = true;
  for (const attribute of ['role', 'aria-modal', 'aria-label']) layer.removeAttribute(attribute);
  unlockBackground();
  if (returnFocus && mobile.matches) toggle.focus({preventScroll:true});
  settleClose(true);
  scrollspy();
}
function closeMenu({returnFocus = true, immediate = false} = {}) {
  if (state === 'closed') return Promise.resolve(true);
  const result = new Promise(resolve => closeWaiters.push(resolve));
  clearTimeout(exitTimer);
  setState('closing');
  if (immediate || reduced.matches) finishClose(returnFocus);
  else exitTimer = setTimeout(() => finishClose(returnFocus), 210);
  return result;
}
function openMenu() {
  if (!mobile.matches || state === 'open') return;
  clearTimeout(exitTimer);
  settleClose(false);
  lockBackground();
  layer.setAttribute('role', 'dialog');
  layer.setAttribute('aria-modal', 'true');
  layer.setAttribute('aria-label', 'Menu FS Perfuração');
  panel.hidden = false;
  backdrop.hidden = false;
  // Commit the initial CSS state, including when reversing a closing transition.
  panel.getBoundingClientRect();
  setState('open');
  nav.querySelector('a').focus({preventScroll:true});
}
toggle.addEventListener('click', () => {if (state === 'open') closeMenu(); else openMenu();});
backdrop.addEventListener('click', () => closeMenu());
function focusableMenuItems() {
  return [...layer.querySelectorAll('a[href],button:not([disabled]),[tabindex="0"]')].filter(element => element.getClientRects().length && getComputedStyle(element).visibility !== 'hidden');
}
document.addEventListener('keydown', event => {
  if (state === 'closed') return;
  if (event.key === 'Escape') {event.preventDefault();closeMenu();return;}
  if (event.key !== 'Tab') return;
  const items = focusableMenuItems();
  const first = items[0], last = items.at(-1);
  if (event.shiftKey && document.activeElement === first) {event.preventDefault();last.focus();}
  else if (!event.shiftKey && document.activeElement === last) {event.preventDefault();first.focus();}
});
document.addEventListener('focusin', event => {
  if (state !== 'closed' && !layer.contains(event.target)) nav.querySelector('a').focus({preventScroll:true});
});
function syncLayout() {
  const hadMenuFocus = state !== 'closed' && layer.contains(document.activeElement);
  if (!mobile.matches) {
    finishClose(false);
    panel.hidden = false;
    if (hadMenuFocus) (nav.querySelector('[aria-current]') || navLinks[0]).focus({preventScroll:true});
  } else if (state === 'closed') panel.hidden = true;
}
mobile.addEventListener('change', syncLayout);
reduced.addEventListener('change', () => {if (state === 'closing' && reduced.matches) finishClose(true);});
syncLayout();

function setActive(id) {
  navLinks.forEach(link => {
    if (link.hash === `#${id}`) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  });
}
function scrollspy() {
  if (savedScroll) return;
  cancelAnimationFrame(scrollFrame);
  scrollFrame = requestAnimationFrame(() => {
    if (savedScroll) return;
    const atBottom = innerHeight + scrollY >= root.scrollHeight - 3;
    const probe = header.getBoundingClientRect().bottom + 40;
    const section = atBottom ? sections.at(-1) : [...sections].reverse().find(item => item.getBoundingClientRect().top <= probe) || sections[0];
    setActive(section.id);
  });
}
addEventListener('scroll', scrollspy, {passive:true});
addEventListener('resize', scrollspy);
if ('ResizeObserver' in window) {
  new ResizeObserver(() => {
    root.style.setProperty('--header-measured', `${Math.ceil(header.getBoundingClientRect().height)}px`);
    scrollspy();
  }).observe(header);
}
scrollspy();

function navigateTo(section, hash) {
  if (location.hash !== hash) history.pushState(null, '', hash);
  section.focus({preventScroll:true});
  section.scrollIntoView({behavior:reduced.matches ? 'instant' : 'smooth', block:'start'});
}
layer.querySelectorAll('a[href^="#"]').forEach(link => link.addEventListener('click', async event => {
  const section = sections.find(item => `#${item.id}` === link.hash);
  if (!section) return;
  event.preventDefault();
  if (state !== 'closed') {
    const completed = await closeMenu({returnFocus:false});
    if (!completed) return;
  }
  navigateTo(section, link.hash);
}));
// Native history and deep links retain their anchor behavior and CSS header offset.
addEventListener('hashchange', scrollspy);
addEventListener('popstate', scrollspy);

const box = document.querySelector('.lightbox');
let origin;
document.querySelectorAll('.gallery-open').forEach(button => button.addEventListener('click', () => {
  origin = button;
  const image = button.querySelector('img');
  const full = box.querySelector('img');
  full.src = button.dataset.image;
  full.alt = image.alt;
  full.width = image.naturalWidth;
  full.height = image.naturalHeight;
  box.querySelector('#lightbox-title').textContent = button.closest('figure').querySelector('figcaption').textContent;
  box.showModal();
}));
box.querySelector('.lightbox-close').addEventListener('click', () => box.close());
box.addEventListener('keydown', event => {if (event.key === 'Escape') {event.preventDefault();box.close();}});
box.addEventListener('click', event => {
  if (event.target !== box) return;
  const r = box.getBoundingClientRect();
  if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) box.close();
});
box.addEventListener('close', () => origin?.focus({preventScroll:true}));

// Visibility is the CSS default: observation failure never hides the content.
if ('IntersectionObserver' in window && !reduced.matches) {
  const observer = new IntersectionObserver(entries => entries.forEach(entry => {
    if (entry.isIntersecting) {entry.target.classList.add('revealed');observer.unobserve(entry.target);}
  }), {threshold:.08});
  document.querySelectorAll('.reveal').forEach(element => observer.observe(element));
}
