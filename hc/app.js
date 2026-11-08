import {CONTACT_ENDPOINT, GOOGLE_REVIEWS_URL, WHATSAPP_PHONE, MAP_URL} from './config.js?v=136e0aa85a43';
const $ = selector => document.querySelector(selector);
const header = $('#header'), nav = $('#navigation'), toggle = $('.menu-toggle');
const sections = [...document.querySelectorAll('main>section[id]')];
const mobile = matchMedia('(max-width:800px)');
let previousFocus, oldScroll = 0;
function menu(open, restore = true) {
  toggle.setAttribute('aria-expanded', String(open));
  nav.classList.toggle('is-open', open);
  document.body.classList.toggle('menu-open', open);
  for (const el of [$('#conteudo'), $('footer')]) el.inert = open || document.documentElement.classList.contains('intro-active');
  $('.brand').inert = open;
  if (open) { previousFocus = document.activeElement; oldScroll = scrollY; nav.querySelector('a[aria-current]')?.focus({preventScroll:true}); }
  else if (restore && previousFocus) { previousFocus.focus({preventScroll:true}); scrollTo({top:oldScroll,behavior:'instant'}); }
}
toggle.addEventListener('click', () => menu(toggle.getAttribute('aria-expanded') !== 'true'));
nav.addEventListener('click', event => { if (event.target.closest('a') && toggle.getAttribute('aria-expanded') === 'true') menu(false, false); });
document.addEventListener('keydown', event => {
  if (toggle.getAttribute('aria-expanded') !== 'true') return;
  if (event.key === 'Escape') { event.preventDefault(); menu(false); }
  if (event.key === 'Tab') {
    const stops = [toggle, ...nav.querySelectorAll('a')];
    const index = stops.indexOf(document.activeElement);
    if (event.shiftKey && index === 0) { event.preventDefault(); stops.at(-1).focus(); }
    else if (!event.shiftKey && index === stops.length - 1) { event.preventDefault(); stops[0].focus(); }
  }
});
document.addEventListener('pointerdown', event => { if(toggle.getAttribute('aria-expanded') === 'true' && !header.contains(event.target)) menu(false); });
mobile.addEventListener('change', () => menu(false, false));
new ResizeObserver(() => document.documentElement.style.setProperty('--header-height', `${header.getBoundingClientRect().height}px`)).observe(header);
let scheduled = false;
function updateSection() {
  scheduled = false;
  const edge = header.getBoundingClientRect().height + Math.min(innerHeight * .25, 180);
  let current = sections[0];
  for (const section of sections) if (section.getBoundingClientRect().top <= edge) current = section;
  if (innerHeight + scrollY >= document.documentElement.scrollHeight - 10) current = sections.at(-1);
  for (const a of nav.querySelectorAll('a')) {
    if (a.hash === `#${current.id}`) a.setAttribute('aria-current','page'); else a.removeAttribute('aria-current');
  }
}
addEventListener('scroll', () => { if (!scheduled) { scheduled = true; requestAnimationFrame(updateSection); } }, {passive:true});
addEventListener('resize', updateSection); updateSection();
const observer = new IntersectionObserver(entries => { for (const entry of entries) if (entry.isIntersecting) { entry.target.classList.add('is-visible'); observer.unobserve(entry.target); } }, {threshold:.06});
for(const el of document.querySelectorAll('.reveal')) observer.observe(el);
document.documentElement.classList.add('js');
for(const link of document.querySelectorAll('[data-service]')) link.addEventListener('click', () => { $('#service').value = link.dataset.service; });
function httpsUrl(value) { try { const url = new URL(value); return url.protocol === 'https:' && !url.username && !url.password ? url.href : ''; } catch { return ''; } }
$('#map-link').href = MAP_URL;
const reviews = httpsUrl(GOOGLE_REVIEWS_URL);
if (reviews) { $('#reviews-link').href = reviews; $('#reviews-link').hidden = false; $('#reviews-pending').hidden = true; }
if (/^\d{10,15}$/.test(WHATSAPP_PHONE)) {
  const link = $('#specialist-link'); link.href = `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent('Olá! Gostaria de conhecer as soluções da Jhefinho Security.')}`;
  link.target = '_blank'; link.rel = 'noopener noreferrer'; $('.specialist p').textContent = 'Converse com a equipe pelo WhatsApp.';
}
const form = $('#contact-form'), status = $('#form-status'), label = $('#submit-label'), dialog = $('#review-dialog');
let endpoint = '';
try { if (CONTACT_ENDPOINT) { const url = new URL(CONTACT_ENDPOINT, location.href); if (url.origin === location.origin || url.protocol === 'https:') endpoint = url.href; } } catch { /* Unconfigured endpoints remain unavailable. */ }
if (endpoint) {
  label.textContent = 'Solicitar atendimento';
  $('#form-notice').textContent = 'Preencha os campos para solicitar atendimento à Jhefinho Security.';
  $('.form-privacy').textContent = 'Seus dados serão enviados para responder a esta solicitação. Não inclua informações sensíveis na mensagem.';
}
const phone = $('#phone');
function validatePhone() {
  const digits = phone.value.replace(/\D/g,'').replace(/^55(?=\d{10,11}$)/,'');
  const valid = digits.length === 10 || digits.length === 11;
  phone.setCustomValidity(valid || !phone.value ? '' : 'Informe DDD e telefone com 10 ou 11 dígitos.');
  $('#phone-error').textContent = phone.validationMessage && phone.value ? 'Informe DDD e telefone com 10 ou 11 dígitos.' : '';
  phone.setAttribute('aria-invalid', String(!valid && !!phone.value));
}
phone.addEventListener('input', validatePhone);
$('#name').addEventListener('input', event => event.target.setCustomValidity(event.target.value.trim().length >= 3 ? '' : 'Informe seu nome completo.'));
$('#message').addEventListener('input', event => event.target.setCustomValidity(event.target.value.trim().length >= 10 ? '' : 'Descreva sua necessidade em pelo menos 10 caracteres.'));
form.addEventListener('submit', async event => {
  event.preventDefault(); validatePhone();
  for (const selector of ['#name','#message']) document.querySelector(selector).dispatchEvent(new Event('input'));
  if (!form.reportValidity()) return;
  const data = Object.fromEntries(new FormData(form));
  for (const key of Object.keys(data)) data[key] = data[key].trim();
  status.textContent = '';
  if (!endpoint) {
    const labels = {name:'Nome completo',phone:'Telefone',email:'E-mail',service:'Serviço de interesse',message:'Mensagem'};
    const list = $('#review-data'); list.replaceChildren();
    for (const [key,value] of Object.entries(data)) { const dt=document.createElement('dt'), dd=document.createElement('dd'); dt.textContent=labels[key]; dd.textContent=value; list.append(dt,dd); }
    dialog.showModal(); return;
  }
  const button = form.querySelector('[type=submit]'); button.disabled = true; form.setAttribute('aria-busy','true'); label.textContent = 'Enviando…';
  try {
    const response = await fetch(endpoint, {method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json'},body:JSON.stringify(data),signal:AbortSignal.timeout(15000),credentials:'omit',redirect:'error'});
    if (!response.ok) throw Error('Não foi possível enviar.');
    const result = await response.json();
    if (result.success !== true) throw Error('O servidor não confirmou o recebimento.');
    status.textContent = 'Solicitação enviada. Obrigado por entrar em contato com a Jhefinho Security.'; form.reset();
  } catch { status.textContent = 'Não foi possível confirmar o envio. Seus dados continuam no formulário. Tente novamente mais tarde.'; }
  finally { button.disabled = false; form.removeAttribute('aria-busy'); label.textContent = 'Solicitar atendimento'; }
});
for (const close of [$('.dialog-close'), $('#back-to-form')]) close.addEventListener('click', () => dialog.close());
dialog.addEventListener('click', event => { if (event.target === dialog) { const rect=dialog.getBoundingClientRect(); if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom) dialog.close(); } });
dialog.addEventListener('close', () => form.querySelector('[type=submit]').focus({preventScroll:true}));

// A abertura é um diálogo temporário; o site segue disponível sem JavaScript.
const intro = $('#brand-intro');
const motionPreference = matchMedia('(prefers-reduced-motion:reduce)');
if (intro && !motionPreference.matches && !location.hash) {
  const background = [$('.skip'), header, $('#conteudo'), $('footer')];
  const states = background.map(element => element.inert);
  let finished = false, closing = false, timer;
  const release = () => {
    if (finished) return;
    finished = true;
    const focusWasInside = intro.contains(document.activeElement);
    intro.hidden = true;
    document.documentElement.classList.remove('intro-active');
    background.forEach((element, index) => { element.inert = states[index]; });
    document.removeEventListener('keydown', introKeys);
    motionPreference.removeEventListener('change', motionChange);
    if (focusWasInside) $('.brand').focus({preventScroll:true});
  };
  const dismiss = (immediate = false) => {
    clearTimeout(timer);
    if (immediate) { release(); return; }
    if (closing || finished) return;
    closing = true;
    intro.classList.add('is-leaving');
    // Retém a modalidade até o fim da transição.
    setTimeout(release, 460);
  };
  const introKeys = event => {
    if (event.key === 'Escape') { event.preventDefault(); dismiss(); }
    if (event.key === 'Tab') { event.preventDefault(); intro.querySelector('button').focus(); }
  };
  const motionChange = () => { if (motionPreference.matches) dismiss(true); };
  intro.hidden = false;
  document.documentElement.classList.add('intro-active');
  background.forEach(element => { element.inert = true; });
  intro.focus({preventScroll:true});
  intro.querySelector('button').addEventListener('click', () => dismiss());
  document.addEventListener('keydown', introKeys);
  motionPreference.addEventListener('change', motionChange);
  timer = setTimeout(() => dismiss(), 3900);
  intro.querySelector('img').decode().catch(() => dismiss(true));
}
