(() => {
  'use strict';
  const storageKey = 'henseg_privacy_v1';
  const version = 1;
  const lifetime = 180 * 24 * 60 * 60 * 1000;
  const notice = document.querySelector('#cookie-notice');
  const dialog = document.querySelector('#privacy-dialog');
  const status = document.querySelector('#privacy-save-status');
  if (!notice || !dialog) return;

  function readChoice() {
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return null;
      const choice = JSON.parse(raw);
      if (choice.version === version && choice.acknowledged === true &&
          Number.isFinite(choice.expiresAt) && choice.expiresAt > Date.now()) return choice;
      localStorage.removeItem(storageKey);
    } catch { /* Browser storage can be unavailable; never block navigation. */ }
    return null;
  }
  let acknowledged = Boolean(readChoice());
  let opener = null;
  function syncNotice() {
    notice.hidden = acknowledged || document.body.classList.contains('intro-running') || dialog.open;
    const reset = document.querySelector('[data-reset-privacy]');
    if (reset) reset.disabled = !acknowledged;
  }
  const bodyObserver = new MutationObserver(syncNotice);
  bodyObserver.observe(document.body, {attributes: true, attributeFilter: ['class']});
  function closePreferences() {
    dialog.close();
    syncNotice();
    // The banner disappears after confirming: return focus to a durable control.
    const target = opener && !opener.closest('[hidden]') ? opener : document.querySelector('.footer-bottom [data-open-privacy],.policy-footer [data-open-privacy]');
    target?.focus({preventScroll: true});
  }
  function confirmChoice() {
    acknowledged = true;
    try {
      localStorage.setItem(storageKey, JSON.stringify({version, acknowledged: true, savedAt: Date.now(), expiresAt: Date.now() + lifetime}));
      status.textContent = 'Sua escolha foi salva neste navegador.';
    } catch {
      status.textContent = 'Sua escolha vale para esta visita. Seu navegador não permitiu salvá-la.';
    }
    if (dialog.open) closePreferences();
    syncNotice();
  }
  document.querySelectorAll('[data-open-privacy]').forEach(button => button.addEventListener('click', () => {
    opener = button;
    status.textContent = '';
    dialog.showModal();
    syncNotice();
  }));
  document.querySelectorAll('[data-confirm-privacy]').forEach(button => button.addEventListener('click', confirmChoice));
  document.querySelector('[data-close-privacy]')?.addEventListener('click', closePreferences);
  dialog.addEventListener('cancel', event => {event.preventDefault(); closePreferences();});
  document.querySelector('[data-reset-privacy]')?.addEventListener('click', () => {
    try {
      localStorage.removeItem(storageKey);
      acknowledged = false;
      status.textContent = 'Sua escolha foi apagada. O aviso será exibido novamente ao fechar esta janela.';
    } catch {
      status.textContent = 'Seu navegador não permitiu alterar o armazenamento. Você pode limpar os dados do site nas configurações do navegador.';
    }
    syncNotice();
  });
  addEventListener('storage', event => {
    if (event.key === storageKey || event.key === null) {acknowledged = Boolean(readChoice()); syncNotice();}
  });
  document.querySelectorAll('[data-current-year]').forEach(el => {el.textContent = String(new Date().getFullYear());});
  syncNotice();
  // Observe class changes again when returning via the back/forward cache.
  addEventListener('pagehide', () => bodyObserver.disconnect());
  addEventListener('pageshow', event => {
    if (event.persisted) {
      acknowledged = Boolean(readChoice());
      bodyObserver.observe(document.body, {attributes: true, attributeFilter: ['class']});
      syncNotice();
    }
  });
})();

(() => {
  const media = matchMedia('(prefers-reduced-motion: reduce)');
  const header = document.querySelector('.site-header');
  if (header) {
    const measure = () => document.documentElement.style.setProperty('--nav-height', `${Math.ceil(header.getBoundingClientRect().height + parseFloat(getComputedStyle(header).top || '0'))}px`);
    new ResizeObserver(measure).observe(header);
    measure();
    const updateHeader = () => header.classList.toggle('is-scrolled', scrollY > 30);
    addEventListener('scroll', updateHeader, {passive:true}); updateHeader();
  }
  document.querySelectorAll('[data-whatsapp]').forEach(link => {
    const config = window.HENSEC_CONFIG;
    const number = String(config?.whatsappNumber || '').replace(/\D/g, '');
    if (/^[1-9]\d{9,14}$/.test(number)) {
      link.href = `https://wa.me/${number}?text=${encodeURIComponent(config.messages[link.dataset.whatsapp] || config.messages.geral)}`;
      link.target = '_blank'; link.rel = 'noopener noreferrer';
    }
  });

  const technology = document.querySelector('.technology-layout');
  if (technology) {
    const steps = [...technology.querySelectorAll('[data-technology-step]')];
    const frames = [...technology.querySelectorAll('[data-technology-image]')];
    const indicators = [...technology.querySelectorAll('[data-technology-go]')];
    const enabled = matchMedia('(min-width:1024px) and (prefers-reduced-motion:no-preference)');
    let frame = 0;
    function draw() {
      frame = 0;
      if (!enabled.matches) return;
      const centers = steps.map(step => {const r=step.getBoundingClientRect();return r.top+r.height/2;});
      const line = innerHeight * .52;
      let position = 0;
      if (line >= centers.at(-1)) position = steps.length-1;
      else for (let i=0;i<centers.length-1;i++) {
        if (line >= centers[i] && line < centers[i+1]) {position=i+(line-centers[i])/(centers[i+1]-centers[i]);break;}
      }
      const base=Math.floor(position);
      const t=Math.max(0,Math.min(1,((position-base)-.22)/.56));
      const blend=t*t*(3-2*t), active=Math.min(steps.length-1,Math.round(position));
      frames.forEach((element,i) => {
        element.style.opacity=String(i===base?1:i===base+1?blend:0);
        element.style.setProperty('--tech-layer',i);
        element.style.setProperty('--tech-offset',`${(position-i)*-6}px`);
        element.setAttribute('aria-hidden',String(i!==active));
      });
      indicators.forEach((element,i)=>i===active?element.setAttribute('aria-current','step'):element.removeAttribute('aria-current'));
      steps.forEach((element,i)=>element.classList.toggle('technology-active',i===active));
      technology.style.setProperty('--tech-progress',(position+1)/steps.length);
    }
    function schedule(){if(!frame)frame=requestAnimationFrame(draw);}
    addEventListener('scroll',schedule,{passive:true});addEventListener('resize',schedule);
    enabled.addEventListener('change',schedule); schedule();
    addEventListener('pagehide',()=>{cancelAnimationFrame(frame);frame=0;});
    addEventListener('pageshow',schedule);
  }

  const track=document.querySelector('.gallery-track');
  if (track) {
    const slides=[...track.querySelectorAll('[data-gallery-slide]')];
    const thumbnails=[...document.querySelectorAll('[data-gallery-select]')];
    const counter=document.querySelector('.gallery-count');
    const modal=document.querySelector('#gallery-modal');
    const expand=document.querySelector('[data-gallery-expand]');
    let current=0,frame=0;
    function sync(){
      frame=0;current=Math.max(0,Math.min(slides.length-1,Math.round(track.scrollLeft/track.clientWidth)));
      thumbnails.forEach((button,i)=>i===current?button.setAttribute('aria-current','true'):button.removeAttribute('aria-current'));
      counter.textContent=`${String(current+1).padStart(2,'0')} / ${String(slides.length).padStart(2,'0')}`;
      document.querySelector('[data-gallery-prev]').disabled=current===0;
      document.querySelector('[data-gallery-next]').disabled=current===slides.length-1;
    }
    function schedule(){if(!frame)frame=requestAnimationFrame(sync);}
    function go(index){track.scrollTo({left:Math.max(0,Math.min(slides.length-1,index))*track.clientWidth,behavior:media.matches?'instant':'smooth'});}
    thumbnails.forEach((button,i)=>button.addEventListener('click',()=>go(i)));
    document.querySelector('[data-gallery-prev]').addEventListener('click',()=>go(current-1));
    document.querySelector('[data-gallery-next]').addEventListener('click',()=>go(current+1));
    track.addEventListener('keydown',event=>{
      if(event.key==='ArrowRight'){event.preventDefault();go(current+1);}
      if(event.key==='ArrowLeft'){event.preventDefault();go(current-1);}
      if(event.key==='Home'){event.preventDefault();go(0);}
      if(event.key==='End'){event.preventDefault();go(slides.length-1);}
    });
    track.addEventListener('scroll',schedule,{passive:true});
    new ResizeObserver(()=>{track.scrollTo({left:current*track.clientWidth,behavior:'instant'});schedule();}).observe(track);
    function close(){modal.close();expand.focus({preventScroll:true});}
    expand.addEventListener('click',()=>{
      const image=slides[current].querySelector('img'),zoom=modal.querySelector('img');
      zoom.src=image.currentSrc||image.src;zoom.alt=image.alt;
      modal.querySelector('h2').textContent=slides[current].querySelector('strong').textContent;
      modal.querySelector('p').textContent=slides[current].querySelector('figcaption > span').textContent;
      modal.showModal();
    });
    modal.querySelector('[data-gallery-close]').addEventListener('click',close);
    modal.addEventListener('cancel',event=>{event.preventDefault();close();});
    sync();
    addEventListener('pagehide',()=>{cancelAnimationFrame(frame);frame=0;});
  }

  const tabs=[...document.querySelectorAll('[data-application]')];
  function activate(tab,focus=false){
    tabs.forEach(button=>{
      const active=button===tab;
      button.setAttribute('aria-selected',String(active));button.tabIndex=active?0:-1;
      const panel=document.getElementById(button.getAttribute('aria-controls'));
      panel.hidden=!active;
      if(active&&!media.matches)panel.animate([{opacity:.25},{opacity:1}],{duration:350,easing:'ease-out'});
    });
    if(focus)tab.focus();
  }
  tabs.forEach((tab,i)=>{
    tab.addEventListener('click',()=>activate(tab));
    tab.addEventListener('keydown',event=>{
      let index;
      if(event.key==='ArrowRight')index=(i+1)%tabs.length;
      if(event.key==='ArrowLeft')index=(i-1+tabs.length)%tabs.length;
      if(event.key==='Home')index=0;
      if(event.key==='End')index=tabs.length-1;
      if(index!==undefined){event.preventDefault();activate(tabs[index],true);}
    });
  });
})();
