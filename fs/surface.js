const states = {
  estrutura:{step:'01 / Estrutura',title:'A estrutura em campo.',text:'Conheça a estrutura que acompanha o trabalho em campo.'},
  operacao:{step:'02 / Operação',title:'Um olhar sob o terreno.',text:'Veja uma representação do percurso da perfuração.'},
  detalhes:{step:'03 / Detalhes',title:'Atenção em cada etapa.',text:'Observe os detalhes que fazem parte de cada etapa.'}
};

export function initSurface() {
  const section = document.querySelector('.surface-experience');
  if (!section || section.dataset.enhanced) return;
  section.dataset.enhanced = 'true';
  const tabs = [...section.querySelectorAll('[role="tab"]')];
  const hotspots = [...section.querySelectorAll('.surface-hotspot')];
  const panel = section.querySelector('.surface-info');
  const copy = section.querySelector('.surface-info-copy');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let observer;
  let resizeObserver;
  const appeared = new Set();
  let introductionStarted = false;
  let introductionFinished = reduced.matches;

  function finishIntroduction() {
    introductionFinished = true;
    section.dataset.introDone = 'true';
    section.classList.remove('surface-introducing');
    section.querySelector('.surface-heading').classList.remove('surface-heading-appearing');
    section.querySelector('.surface-photo').classList.remove('surface-photo-appearing');
    observer?.disconnect();
    resizeObserver?.disconnect();
  }
  function select(state, {focusTab = false} = {}) {
    if (!Object.hasOwn(states, state)) return;
    // A deliberate choice always takes priority over the automatic introduction.
    finishIntroduction();
    section.dataset.state = state;
    if (state === 'detalhes') {
      const image = section.querySelector('.surface-lens image');
      if (!image.hasAttribute('href')) image.setAttribute('href', image.dataset.lensSource);
    }
    for (const tab of tabs) {
      const active = tab.dataset.surfaceState === state;
      tab.setAttribute('aria-selected', String(active));
      tab.tabIndex = active ? 0 : -1;
      if (active && focusTab) tab.focus({preventScroll:true});
    }
    for (const point of hotspots) point.setAttribute('aria-pressed', String(point.dataset.surfaceState === state));
    panel.setAttribute('aria-labelledby', `surface-tab-${state}`);
    copy.querySelector('.surface-step').textContent = states[state].step;
    copy.querySelector('.surface-info-title').textContent = states[state].title;
    copy.querySelector('.surface-info-text').textContent = states[state].text;
    copy.classList.remove('is-changing');
    if (!reduced.matches) {
      copy.getBoundingClientRect();
      copy.classList.add('is-changing');
    }
  }
  section.querySelectorAll('[data-surface-state]').forEach(control => control.addEventListener('click', () => select(control.dataset.surfaceState)));
  section.querySelector('.surface-tabs').addEventListener('keydown', event => {
    const index = tabs.indexOf(document.activeElement);
    if (index < 0) return;
    let next;
    if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
    if (event.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = tabs.length - 1;
    if (next === undefined) return;
    event.preventDefault();
    select(tabs[next].dataset.surfaceState, {focusTab:true});
  });
  reduced.addEventListener('change', () => {
    if (reduced.matches) {finishIntroduction();copy.classList.remove('is-changing');}
  });
  section.addEventListener('animationend', event => {
    if (event.animationName === 'surfaceMarkers') finishIntroduction();
  });

  function observeIntroduction() {
    if (introductionFinished || !('IntersectionObserver' in window)) {finishIntroduction();return;}
    observer?.disconnect();
    const headerBottom = Math.ceil(document.querySelector('.site-header')?.getBoundingClientRect().bottom || 0);
    observer = new IntersectionObserver(entries => {
      if (introductionFinished) return;
      for (const entry of entries) {
        if (entry.target.classList.contains('surface-heading') || entry.target.classList.contains('surface-photo')) {
          if (entry.isIntersecting && !appeared.has(entry.target)) {
            appeared.add(entry.target);
            entry.target.classList.add(entry.target.classList.contains('surface-heading') ? 'surface-heading-appearing' : 'surface-photo-appearing');
          }
          continue;
        }
        if (entry.isIntersecting && !introductionStarted) {
          introductionStarted = true;
          section.classList.add('surface-introducing');
        } else if (!entry.isIntersecting && introductionStarted) {
          finishIntroduction();
        }
      }
    }, {rootMargin:`-${headerBottom}px 0px -5% 0px`,threshold:.08});
    // The soil reveals only when it is actually visible, even in a short window.
    for (const selector of ['.surface-heading','.surface-photo','.surface-ground']) observer.observe(section.querySelector(selector));
  }
  document.addEventListener('visibilitychange', () => {if (document.hidden && introductionStarted) finishIntroduction();});
  if (reduced.matches) finishIntroduction();
  else {
    observeIntroduction();
    if ('ResizeObserver' in window) {
      resizeObserver = new ResizeObserver(() => {if (!introductionStarted) observeIntroduction();});
      resizeObserver.observe(document.querySelector('.site-header'));
    }
  }
}
