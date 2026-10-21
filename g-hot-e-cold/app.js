(() => {
  'use strict';
  document.documentElement.classList.add('js-ready');
  const $ = s => document.querySelector(s);
  const config = window.GHC_CONFIG || {};
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const splash = $('#brand-intro');
  let splashTimer;
  function dismissSplash() {
    if (!splash) return;
    splash.hidden = true;
    clearTimeout(splashTimer);
    document.removeEventListener('pointerdown', dismissSplash);
    document.removeEventListener('keydown', dismissSplash);
  }
  if (splash && !reduce.matches && !location.hash && scrollY < 10) {
    $('.intro-brand').innerHTML = $('.site-header .brand').innerHTML;
    splash.querySelectorAll('path').forEach(path => path.setAttribute('pathLength', '1'));
    document.documentElement.classList.add('brand-arrival');
    splash.hidden = false;
    splashTimer = setTimeout(dismissSplash, 1500);
    document.addEventListener('pointerdown', dismissSplash, {once: true});
    document.addEventListener('keydown', dismissSplash, {once: true});
  }
  const motionButton = $('#motion-toggle');
  let paused = false;
  function updateMotion() {
    if (reduce.matches || paused) dismissSplash();
    document.documentElement.classList.toggle('motion', !reduce.matches && !paused);
    document.documentElement.classList.toggle('motion-paused', paused);
    motionButton.textContent = paused ? 'Ativar animações' : 'Pausar animações';
    motionButton.setAttribute('aria-pressed', String(paused));
  }
  motionButton.hidden = false;
  motionButton.addEventListener('click', () => { paused = !paused; updateMotion(); });
  reduce.addEventListener('change', updateMotion); updateMotion();
  const button = $('.menu-toggle'), nav = $('#navigation');
  const mobile = matchMedia('(max-width: 800px)');
  const navLinks = [...nav.querySelectorAll('a')];
  button.hidden = false;
  function menu(open, focus = false) {
    button.setAttribute('aria-expanded', String(open));
    button.innerHTML = `${open ? 'Fechar menu' : 'Abrir menu'} <span aria-hidden="true">${open ? '×' : '☰'}</span>`;
    nav.hidden = mobile.matches && !open;
    if (focus) (open ? navLinks[0] : button).focus();
  }
  button.addEventListener('click', () => menu(button.getAttribute('aria-expanded') !== 'true', true));
  mobile.addEventListener('change', () => menu(false)); menu(false);
  document.addEventListener('keydown', e => {
    if (!mobile.matches || button.getAttribute('aria-expanded') !== 'true') return;
    if (e.key === 'Escape') { e.preventDefault(); menu(false,true); }
    if (e.key === 'Tab') {
      const focusable = [button,...navLinks], first=focusable[0],last=focusable.at(-1);
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
  navLinks.forEach(a => a.addEventListener('click', () => { menu(false); const section = $(a.getAttribute('href')); section.setAttribute('tabindex','-1'); section.focus({preventScroll:true}); }));
  document.addEventListener('click', e => { if (mobile.matches && !e.target.closest('.site-header')) menu(false); });
  if ('IntersectionObserver' in window) {
    const reveal = new IntersectionObserver(entries => entries.forEach(e => { if(e.isIntersecting){ e.target.classList.add('is-visible'); reveal.unobserve(e.target); } }),{threshold:.08});
    document.querySelectorAll('.reveal').forEach(e=>reveal.observe(e));
    const active = new IntersectionObserver(entries => { for(const entry of entries) if(entry.isIntersecting) navLinks.forEach(a=>{if(a.hash===`#${entry.target.id}`) a.setAttribute('aria-current','location');else a.removeAttribute('aria-current');}); },{rootMargin:'-20% 0px -55% 0px'});
    document.querySelectorAll('main>section').forEach(s=>active.observe(s));
  }
  const form=$('#contact-form'),status=$('#form-status');
  let person='';
  const number = key => { const n=String(config[key]||'').replace(/\D/g,'');return /^[1-9]\d{9,14}$/.test(n)?n:''; };
  function destination(){return (person && number(person)) || number('whatsapp');}
  function refreshChannel(){
    $('#channel-note').hidden = !!destination();
    $('#recipient').hidden = !person;
    $('#recipient').textContent = person ? `Sua conversa: ${person==='julio'?'Júlio · Técnico':'Adriano · Engenheiro'}` : '';
  }
  refreshChannel();
  document.querySelectorAll('[data-interest]').forEach(a=>a.addEventListener('click',()=>{ $('#interest').value=a.dataset.interest; person='';refreshChannel(); }));
  document.querySelectorAll('[data-person]').forEach(a=>a.addEventListener('click',()=>{person=a.dataset.person;$('#interest').value='Quero conversar com a equipe';refreshChannel();setTimeout(()=>$('#name').focus({preventScroll:true}),250);}));
  const validators={name:v=>v.trim().length>=2?'':'Informe seu nome com pelo menos 2 caracteres.',phone:v=>/^\+?[\d\s().-]+$/.test(v)&&v.replace(/\D/g,'').length>=10&&v.replace(/\D/g,'').length<=15?'':'Informe um WhatsApp com DDD válido.',interest:v=>v?'':'Escolha o assunto da conversa.',message:v=>v.trim().length>=5?'':'Conte um pouco mais, com pelo menos 5 caracteres.'};
  function validate(id){const field=$(`#${id}`),error=validators[id](field.value);$(`#${id}-error`).textContent=error;field.setAttribute('aria-invalid',String(!!error));return !error;}
  Object.keys(validators).forEach(id=>{const field=$(`#${id}`);field.addEventListener('input',()=>{if(field.getAttribute('aria-invalid')==='true')validate(id);if(!$('#review').hidden){$('#review').hidden=true;status.textContent='Os dados foram alterados. Prepare a mensagem novamente.';}});});
  form.addEventListener('submit',e=>{
    e.preventDefault(); const results=Object.keys(validators).map(id=>[id,validate(id)]);const invalid=results.find(([,ok])=>!ok);
    if(invalid){$(`#${invalid[0]}`).focus();status.textContent='Confira os campos indicados. Seus dados foram mantidos.';return;}
    const message=`Olá, ${person==='julio'?'Júlio':person==='adriano'?'Adriano':'equipe G Hot e Cold'}!\nMeu nome é ${$('#name').value.trim()}.\nWhatsApp: ${$('#phone').value.trim()}\nInteresse: ${$('#interest').value}\n\n${$('#message').value.trim()}`;
    const target=destination();
    if(target){const link=document.createElement('a');link.href=`https://wa.me/${target}?text=${encodeURIComponent(message)}`;link.target='_blank';link.rel='noopener noreferrer';link.click();status.textContent='Abrindo a conversa no WhatsApp. Revise e envie sua mensagem por lá.';}
    else {$('#prepared').value=message;$('#review').hidden=false;status.textContent='Mensagem preparada para revisão. O canal de contato ainda precisa ser confirmado; nada foi enviado.';$('#prepared').focus();}
  });
  $('#copy').addEventListener('click',async()=>{try{await navigator.clipboard.writeText($('#prepared').value);status.textContent='Mensagem copiada. Nenhuma mensagem foi enviada.';}catch{$('#prepared').focus();$('#prepared').select();status.textContent='Selecione e copie a mensagem acima usando o comando de copiar do seu dispositivo.';}});
})();
