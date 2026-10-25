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
    const target = opener && opener.getClientRects().length && !opener.closest('[hidden]') ? opener : [...document.querySelectorAll('.mobile-footer [data-open-privacy],.footer-bottom [data-open-privacy],.policy-footer [data-open-privacy]')].find(el=>el.getClientRects().length);
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

  const technology = document.querySelector('.technology-text');
  if (technology) {
    // The supplied model references stay editable in config.js; HTML remains a no-JS fallback.
    const references = window.HENSEC_CONFIG?.technologyReferences || [];
    const articles = [...technology.querySelectorAll('[data-technology-reference]')];
    references.forEach(item => {
      const article = articles.find(element => element.dataset.technologyReference === item.id);
      if (!article) return;
      article.querySelector('[data-reference-model]').textContent = item.identification || item.model || item.category;
      article.querySelector('.technology-reference > span').textContent = item.model ? `Identificação visível${item.brand ? ' · '+item.brand : ''}` : item.brand ? `${item.brand} · Modelo a confirmar` : item.id==='videoporteiro' ? 'Conjunto apresentado' : 'Modelo a confirmar';
      article.querySelector('.technology-description').textContent = item.description;
      article.querySelector('.technology-label').textContent = item.category;
      const heading = article.querySelector('h3');
      const split = item.highlight ? item.title.indexOf(item.highlight) : -1;
      if (split >= 0) {
        const emphasis = document.createElement('em');emphasis.textContent = item.highlight;
        heading.replaceChildren(document.createTextNode(item.title.slice(0,split)),emphasis,document.createTextNode(item.title.slice(split+item.highlight.length)));
      } else heading.textContent = item.title;
      const list = article.querySelector('.technology-benefits');
      list.replaceChildren(...item.features.map(text => {const li=document.createElement('li');li.textContent=text;return li;}));
      const button = article.querySelector('[data-whatsapp]');
      const arrow = document.createElement('span');arrow.setAttribute('aria-hidden','true');arrow.textContent='↗';
      button.replaceChildren(document.createTextNode(item.cta+' '),arrow);
      button.dataset.whatsapp = item.messageKey;
      const config = window.HENSEC_CONFIG;
      const number = String(config.whatsappNumber || '').replace(/\D/g,'');
      if (/^[1-9]\d{9,14}$/.test(number))button.href=`https://wa.me/${number}?text=${encodeURIComponent(config.messages[item.messageKey] || config.messages.geral)}`;
    });
    const steps = [...technology.querySelectorAll('[data-technology-step]')];
    const indicators = [...technology.querySelectorAll('[data-technology-go]')];
    const productFrames = [...technology.querySelectorAll('[data-provided-tech-image]')];
    const desktop = matchMedia('(min-width:1024px)');
    let frame = 0;
    function draw() {
      frame=0;
      const rects=steps.map(step=>step.getBoundingClientRect());
      const centers=rects.map(rect=>rect.top+rect.height/2);
      const line=innerHeight*.5;
      let position=0;
      if(line>=centers.at(-1))position=steps.length-1;
      else for(let i=0;i<centers.length-1;i++)if(line>=centers[i]&&line<centers[i+1]){position=i+(line-centers[i])/(centers[i+1]-centers[i]);break;}
      const active=Math.min(steps.length-1,Math.round(position));
      indicators.forEach((element,i)=>i===active?element.setAttribute('aria-current','step'):element.removeAttribute('aria-current'));
      steps.forEach((element,i)=>element.classList.toggle('technology-active',i===active));
      const base=Math.floor(position), fraction=Math.max(0,Math.min(1,((position-base)-.2)/.6));
      const blend=fraction*fraction*(3-2*fraction);
      productFrames.forEach((element,i)=>{element.style.opacity=String(i===base?1:i===base+1?blend:0);element.style.zIndex=String(i);element.setAttribute('aria-hidden',String(i!==active));});
      const progress=Math.max(0,Math.min(1,(line-rects[0].top)/Math.max(1,rects.at(-1).bottom-rects[0].top)));
      technology.style.setProperty('--tech-progress',progress);
    }
    function schedule(){if(!frame)frame=requestAnimationFrame(draw);}
    function configure(){technology.classList.toggle('technology-enhanced',desktop.matches&&!media.matches);schedule();}
    addEventListener('scroll',schedule,{passive:true});addEventListener('resize',configure);
    desktop.addEventListener('change',configure);media.addEventListener('change',configure);
    configure();
    addEventListener('pagehide',()=>{cancelAnimationFrame(frame);frame=0;});
    addEventListener('pageshow',configure);
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
      zoom.style.setProperty('--photo-width',`${image.naturalWidth||image.width}px`);
      zoom.style.setProperty('--photo-height',`${image.naturalHeight||image.height}px`);
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
