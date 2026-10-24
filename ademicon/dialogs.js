// These flows intentionally keep all answers in memory and never submit them.
const CATEGORIES = ['Veículos', 'Imóveis', 'Serviços', 'Outros bens móveis', 'Ainda não sei'];
export const PLANNING_TEXT_LIMIT = 1000;
const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const normalize = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const categoryName = value => CATEGORIES.find(item => normalize(item) === normalize(value)) || ({veiculos:'Veículos',imoveis:'Imóveis',servicos:'Serviços',outros:'Outros bens móveis'}[normalize(value)]) || 'Ainda não sei';
const options = (values, selected) => values.map(value => `<option${value === selected ? ' selected' : ''}>${escape(value)}</option>`).join('');
let active = null;
function shell(title, content, {wide = false} = {}) {
  // Native close events are queued; discard a just-closed instance before reopening.
  if (active && !active.dialog.open) {
    const previousFocus = active.previousFocus;
    active.dialog.remove();
    active = null;
    document.body.classList.remove('ademicon-dialog-open');
    if (previousFocus?.isConnected) previousFocus.focus({preventScroll:true});
  }
  if (!active) {
    const previousFocus = document.activeElement;
    const dialog = document.createElement('dialog');
    dialog.className = 'ademicon-dialog';
    dialog.setAttribute('aria-labelledby', 'ademicon-dialog-title');
    document.body.append(dialog);
    active = {dialog, previousFocus};
    dialog.addEventListener('click', event => {
      if (event.target === dialog) {
        const rect = dialog.getBoundingClientRect();
        if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
      }
    });
    dialog.addEventListener('close', () => {
      const isCurrent = active?.dialog === dialog;
      const returnFocus = isCurrent ? active.previousFocus : null;
      dialog.querySelectorAll('iframe').forEach(frame => frame.remove());
      dialog.replaceChildren();
      dialog.remove();
      if (isCurrent) {
        active = null;
        document.body.classList.remove('ademicon-dialog-open');
      }
      if (returnFocus?.isConnected) returnFocus.focus({preventScroll:true});
    }, {once:true});
    document.body.classList.add('ademicon-dialog-open');
  }
  const dialog = active.dialog;
  dialog.classList.toggle('ademicon-dialog--wide', wide);
  dialog.innerHTML = `<div class="ad-dialog-shell"><header class="ad-dialog-header"><span class="ad-preview-label">Prévia demonstrativa</span><button type="button" class="ad-dialog-close" aria-label="Fechar">×</button><h2 id="ademicon-dialog-title" tabindex="-1">${escape(title)}</h2></header><div class="ad-dialog-content">${content}</div></div>`;
  dialog.querySelector('.ad-dialog-close').addEventListener('click', () => dialog.close());
  if (!dialog.open) dialog.showModal();
  dialog.scrollTop = 0;
  dialog.querySelector('h2').focus({preventScroll:true});
  return dialog;
}
const safeExternal = value => {
  try { const url = new URL(value); return url.protocol === 'https:' ? url.href : null; } catch { return null; }
};
const external = (label, url) => `<a class="ad-text-link" href="${escape(url)}" target="_blank" rel="noopener noreferrer">${escape(label)} <span aria-hidden="true">↗</span></a>`;
const regulations = () => `<div class="ad-regulations"><h3>Regulamentos oficiais</h3>${external('Imóveis','https://www.ademicon.com.br/api/media/file/REGULAMENTO-IMOVEIS.pdf')}${external('Veículos','https://www.ademicon.com.br/api/media/file/REGULAMENTO-VEICULOS.pdf')}${external('Serviços','https://www.ademicon.com.br/api/media/file/REGULAMENTO-SERVICO.pdf')}</div>`;

export function openSimulator({category = '', product = '', mode = 'Parcela desejada', amount = ''} = {}) {
  const dialog = shell('Seu próximo objetivo começa aqui', `<p class="ad-dialog-intro">Escolha seu objetivo e organize sua intenção de investimento.</p><form class="ad-flow-form" id="ad-simulation-form"><label>Categoria<select name="category">${options(CATEGORIES, categoryName(category))}</select></label><label>Objetivo ou produto<input name="product" value="${escape(product)}" autocomplete="off" placeholder="Conte o que você deseja realizar"></label><fieldset class="ad-mode"><legend>Quero informar</legend><label><input type="radio" name="mode" value="Parcela desejada"${mode !== 'Crédito pretendido' ? ' checked' : ''}> Parcela</label><label><input type="radio" name="mode" value="Crédito pretendido"${mode === 'Crédito pretendido' ? ' checked' : ''}> Crédito</label></fieldset><label><span id="ad-amount-label">${escape(mode === 'Crédito pretendido' ? mode : 'Parcela desejada')} (R$)</span><input type="number" name="amount" value="${escape(amount)}" min="0.01" step="0.01" inputmode="decimal" placeholder="Ainda não sei" aria-describedby="ad-simulation-note"></label><p class="ad-form-note" id="ad-simulation-note">Valor declarado por você. Esta demonstração não calcula parcelas, taxas, crédito equivalente ou prazo de contemplação.</p><div class="ad-actions"><button class="ad-primary" type="submit">Organizar meu objetivo <span aria-hidden="true">→</span></button></div></form>`);
  const form = dialog.querySelector('form');
  form.addEventListener('change', () => {
    dialog.querySelector('#ad-amount-label').textContent = `${form.elements.mode.value} (R$)`;
  });
  form.addEventListener('submit', event => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const data = Object.fromEntries(new FormData(form));
    const amount = data.amount ? Number(data.amount).toLocaleString('pt-BR',{style:'currency',currency:'BRL'}) : 'Ainda não sei';
    const summary = shell('Seu objetivo, do seu jeito', `<p class="ad-dialog-intro">Uma organização da sua intenção, sem cotação comercial.</p><dl class="ad-review"><div><dt>Categoria</dt><dd>${escape(data.category)}</dd></div><div><dt>Objetivo</dt><dd>${escape(data.product || 'Ainda não sei')}</dd></div><div><dt>${escape(data.mode)}</dt><dd>${escape(amount)}</dd></div></dl><p class="ad-form-note">Nenhuma condição comercial foi calculada. Não há garantia de aprovação ou data de contemplação.</p><div class="ad-actions"><button type="button" class="ad-secondary" data-action="edit">Editar objetivo</button><button type="button" class="ad-primary" data-action="plan">Avançar para o planejamento →</button></div>`);
    summary.querySelector('[data-action="edit"]').addEventListener('click', () => openSimulator(data));
    summary.querySelector('[data-action="plan"]').addEventListener('click', () => openPlanning({category:data.category, product:data.product, ...(data.mode === 'Parcela desejada' ? {installment: data.amount} : {value: data.amount})}));
  });
}

export function openPlanning({category = '', product = '', value = '', installment = '', textLimit = PLANNING_TEXT_LIMIT} = {}) {
  const limit = Number.isInteger(textLimit) && textLimit > 0 ? textLimit : PLANNING_TEXT_LIMIT;
  let answers = {category:categoryName(category), product:String(product), value:String(value), installment:String(installment), term:'Ainda não sei', notes:'', name:'', phone:'', email:'', preference:'Telefone'};
  const stepNames = ['Seu objetivo', 'Contato', 'Revisão'];
  function draw(step) {
    const progress = `<ol class="ad-step-list" aria-label="Etapas do planejamento">${stepNames.map((name,index) => `<li${index === step ? ' aria-current="step"' : ''}><span>${index+1}</span>${name}</li>`).join('')}</ol>`;
    let body;
    if (step === 0) body = `<label>Categoria<select name="category">${options(CATEGORIES, answers.category)}</select></label><label>Seu objetivo<input name="product" value="${escape(answers.product)}" placeholder="Ainda não sei" autocomplete="off"></label><div class="ad-field-row"><label>Valor aproximado pretendido<input name="value" value="${escape(answers.value)}" placeholder="Ainda não sei" inputmode="decimal"></label><label>Parcela confortável<input name="installment" value="${escape(answers.installment)}" placeholder="Ainda não sei" inputmode="decimal"></label></div><label>Quando gostaria de realizar seu objetivo?<input name="term" value="${escape(answers.term)}" placeholder="Ainda não sei"></label><label>O que mais gostaria de nos contar?<textarea name="notes" rows="3" aria-describedby="ad-character-count">${escape(answers.notes)}</textarea></label><p class="ad-character-count" id="ad-character-count" aria-live="polite">${Array.from(answers.notes).length} / ${limit} caracteres</p><p class="ad-form-note">Informe apenas sua intenção. Você pode responder “Ainda não sei”. Valores e prazos não representam oferta comercial.</p>`;
    else if (step === 1) body = `<label>Nome<input name="name" value="${escape(answers.name)}" required autocomplete="off"></label><label>Telefone / WhatsApp<input name="phone" value="${escape(answers.phone)}" type="tel" required autocomplete="off" inputmode="tel"></label><label>E-mail <span class="ad-optional">(opcional)</span><input name="email" value="${escape(answers.email)}" type="email" autocomplete="off"></label><label>Preferência de contato<select name="preference">${options(['Telefone','WhatsApp','E-mail'], answers.preference)}</select></label><p class="ad-form-note">Use dados de teste. Nenhum contato será realizado nesta demonstração.</p>`;
    else body = `<p class="ad-form-note">Confira suas respostas. Seus dados serão descartados ao fechar esta demonstração.</p><dl class="ad-review">${[['Categoria','category'],['Objetivo','product'],['Valor aproximado','value'],['Parcela confortável','installment'],['Prazo desejado','term'],['Mais sobre seu objetivo','notes'],['Nome','name'],['Telefone / WhatsApp','phone'],['E-mail','email'],['Preferência de contato','preference']].map(([title,key])=>`<div><dt>${escape(title)}</dt><dd>${escape(answers[key] || (key === 'email' ? 'Não informado' : 'Ainda não sei'))}</dd></div>`).join('')}</dl><div class="ad-edit-links"><button type="button" data-edit="0">Editar objetivo</button><button type="button" data-edit="1">Editar contato</button></div>`;
    const dialog = shell('Vamos planejar sua conquista?', `${progress}<p class="ad-demo-note">Demonstração: use dados de teste. Nenhuma informação será enviada.</p><form class="ad-flow-form" id="ad-planning-form">${body}<div class="ad-actions">${step ? '<button type="button" class="ad-secondary" data-back>Voltar</button>' : ''}<button type="submit" class="ad-primary">${step === 2 ? 'Concluir demonstração' : 'Continuar →'}</button></div></form>`);
    const form = dialog.querySelector('form');
    const capture = () => { answers = {...answers,...Object.fromEntries(new FormData(form))}; };
    const notes = form.elements.notes;
    if (notes) notes.addEventListener('input', () => {
      const characters = Array.from(notes.value);
      if (characters.length > limit) notes.value = characters.slice(0,limit).join('');
      dialog.querySelector('#ad-character-count').textContent = `${Array.from(notes.value).length} / ${limit} caracteres`;
    });
    form.querySelector('[data-back]')?.addEventListener('click', () => { capture(); draw(step-1); });
    form.querySelectorAll('[data-edit]').forEach(button => button.addEventListener('click', () => draw(Number(button.dataset.edit))));
    form.addEventListener('submit', event => {
      event.preventDefault();
      if (!form.reportValidity()) return;
      capture();
      if (step < 2) { draw(step+1); return; }
      answers = null;
      const done = shell('Demonstração concluída.', `<div class="ad-completion-mark" aria-hidden="true">✓</div><p class="ad-completion" role="status">Demonstração concluída. Nenhum dado foi enviado.</p><p class="ad-form-note">Obrigado por conhecer esta prévia de planejamento.</p><div class="ad-actions"><button class="ad-primary" type="button" data-finish>Fechar demonstração</button></div>`);
      done.querySelector('[data-finish]').addEventListener('click', () => done.close());
    });
  }
  draw(0);
}

export function openVideo(title, url) {
  const original = safeExternal(url);
  let videoId = '';
  if (original) {
    const parsed = new URL(original);
    if (parsed.hostname === 'www.youtube.com' || parsed.hostname === 'youtube.com') videoId = parsed.searchParams.get('v') || '';
    if (parsed.hostname === 'youtu.be') videoId = parsed.pathname.slice(1);
  }
  const embed = /^[a-zA-Z0-9_-]{11}$/.test(videoId) ? `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=0` : '';
  shell(title || 'Conheça esta história', `<p class="ad-form-note">As capas da prévia são ilustrativas. O vídeo apresenta o conteúdo original.</p>${embed ? `<div class="ad-video-frame"><iframe src="${escape(embed)}" title="${escape(title || 'Vídeo Ademicon')}" allow="encrypted-media; picture-in-picture; fullscreen" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe></div>` : ''}<p class="ad-form-note">Se o vídeo não estiver disponível aqui, abra o conteúdo original no YouTube.</p>${original ? external('Abrir no YouTube', original) : '<p>Link indisponível.</p>'}`,{wide:true});
}

export function openFAQ(question, answer) {
  shell(question || 'Dúvidas sobre consórcio', `<p class="ad-answer">${escape(answer)}</p><p class="ad-form-note">Informação demonstrativa, sujeita às condições do contrato e aos regulamentos oficiais.</p>${regulations()}`);
}

export function openContent(title, items = []) {
  const entries = Array.isArray(items) ? items : [];
  const dialog = shell(title || 'Conteúdos', `<div class="ad-content-list">${entries.map((item,index) => {
    if (typeof item === 'string') return `<p>${escape(item)}</p>`;
    const label = item.title || item.label || 'Saiba mais';
    const url = safeExternal(item.href || item.url);
    return `<article><h3>${escape(label)}</h3>${item.description ? `<p>${escape(item.description)}</p>` : ''}${item.action || item.onClick ? `<button class="ad-secondary" type="button" data-content-action="${index}">Abrir conteúdo</button>` : url ? external('Abrir conteúdo',url) : ''}</article>`;
  }).join('')}</div>`);
  dialog.querySelectorAll('[data-content-action]').forEach(button => button.addEventListener('click', () => {
    const item = entries[Number(button.dataset.contentAction)];
    const callback = item.action || item.onClick;
    if (typeof callback === 'function') callback();
  }));
}
