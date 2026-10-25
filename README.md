# Inovar — Energia Solar

A logomarca enviada pelo usuário aparece inteira no cabeçalho e no rodapé em `assets/solar/inovar-logo.webp`, mantendo o fundo azul e sem duplicar a palavra Inovar ao lado. `config.logoUrl` aponta para o mesmo arquivo. A exportação incorpora também as referências de imagens da configuração, preservando a logo no HTML independente.

Site estático em HTML, CSS e JavaScript, sem dependências npm. Node.js 24 e Chromium já estão disponíveis no ambiente.

```sh
cd /workspace/site-andre
npm run dev
npm run lint
npm run build
```

Servidor na porta 3000 (`PORT` configurável), build em `dist/`. Para servir o build: `SERVE_DIST=1 PORT=3001 npm start`. Não há backend, formulário de contato ou envio automático de mensagens. O build inclui `.nojekyll` e versões por conteúdo nas URLs de CSS/JavaScript para evitar cache de uma publicação anterior.

## Composição desktop e mobile

O site mantém os componentes existentes e as seis seções na ordem original. Cada seção contém uma única composição: cenário limpo e conteúdo HTML real. Não existem visualizadores de referências, hotspots transparentes, cabeçalhos duplicados ou modais de demonstração na página pública. Os originais permanecem em `referencias/solar/` e `referencias/solar-mobile/` como documentação.

Todas as seções externas ocupam 100% da largura, sem limite máximo, margens ou padding lateral. No fluxo natural, fotografias alcançam as duas bordas, sem moldura, cantos arredondados ou distorção. O estado inicial mantém a fotografia completa. A única exceção de aproximação/recorte é a câmera de Soluções, acionada por escolha explícita do visitante. `picture` seleciona a cena desktop a partir de 1024 px e a composição mobile abaixo disso. A altura das fotos respeita suas dimensões intrínsecas; o conteúdo pode aumentar a seção quando precisa de espaço. No modo desktop de uma tela, a foto inteira é limitada à área disponível, centralizada e integrada ao fundo fotográfico discreto por transições graduais apenas nas bordas do cenário. Isso remove o limite retangular quando as proporções diferem; não duplica fotografias, não desfoca o fundo e não afeta textos ou controles. As outras fotografias não recebem zoom automático ou de interação. Somente textos e controles recebem margens e largura máxima. O CSS foi consolidado em regras de base e breakpoints, substituindo as camadas anteriores de sobrescrita.

As cenas desktop sem interface estão em `assets/solar/desktop/`, derivadas das referências preservando o enquadramento. A hero mantém sua fotografia limpa existente e o contato reutiliza o cenário de projetos. As cenas mobile existentes foram mantidas. A hero mantém a copy aprovada, com título mais próximo do telhado e relevo discreto. Como os ativos aprovados não incluem um recorte separado do telhado, foi preservada a alternativa de tipografia limpa, sem máscara grosseira ou texto sobre os painéis. Menus, textos e botões incorporados aos screenshots não são apresentados como parte da interface.

As áreas de apoio que ultrapassam a fotografia principal usam `assets/solar/panels-dusk-background.webp`: uma imagem decorativa de painéis solares com reflexos de entardecer, criada para este acabamento e exportada em WebP (aproximadamente 120 KB). Ela não contém interface, texto ou pessoas. No desktop, a camada é discreta nas bordas livres; no celular, a borda inferior do cenário se dissolve sobre ela antes dos controles. Contato e rodapé revelam uma única fotografia compartilhada no fundo do `body`, evitando uma emenda ou reinício da imagem entre o contato e os links finais. O rodapé é mais compacto, sem as duas linhas de divisão anteriores, com links e aviso de imagens ilustrativas preservados. Somente esse fundo decorativo admite recorte; os cenários principais continuam com suas proporções e enquadramentos próprios.

A seção de contato exibe somente o cenário, o texto, o botão de WhatsApp e o telefone da Inovar, sem retrato ou identificação de pessoa. A coluna direita fica livre para o cenário no desktop; no celular, o CTA segue o título sem uma linha vazia reservada para a foto. Os arquivos antigos de retrato permanecem no projeto como documentação, mas não são referenciados pela página ou incorporados ao HTML exportado. O contato continua sem formulário. A fonte Manrope é local, com licença em `assets/automotiva/OFL-Manrope.txt`.

## Seções completas e movimento

A partir de **1100 × 760 px**, cada seção tem altura mínima igual à viewport visível menos a altura real do cabeçalho. O limite de 760 px foi escolhido após medir o conteúdo de Soluções; telas mais baixas usam altura natural. `ResizeObserver` atualiza `--header-height` quando fontes, tamanho do texto ou configuração alteram o cabeçalho. O valor só é descontado uma vez.

O desktop ajusta títulos também pela altura disponível e reduz espaços verticais, com menu entre 14–16 px, descrições principais entre 16–18 px, informações secundárias a partir de 14 px e títulos de seção entre 44–60 px quando há espaço. Os botões têm aproximadamente 54–56 px e largura proporcional ao texto no desktop; no celular mantêm largura útil completa. As quatro etapas e as três soluções permanecem visíveis. O FAQ apresenta título/CTA à esquerda e busca/perguntas à direita, com uma resposta aberta por vez. Respostas excepcionalmente longas, texto ampliado e conteúdo sem JavaScript podem aumentar a seção: não existem altura máxima, corte de texto, scroll interno ou scroll snap obrigatório. O cabeçalho pode quebrar em linhas com texto ampliado. O cenário do contato mantém proporção e enquadramento.

As entradas são executadas uma única vez por elemento via IntersectionObserver e Web Animations: cabeçalho em 400 ms, textos em 560 ms com até 14 px de deslocamento e etapas/opções com intervalo de 70 ms. Fotografias e retrato usam apenas opacidade. CTAs têm atrasos curtos; a seta desloca no máximo 2 px. Rolagem e cliques continuam livres. Não há estado CSS que esconda o conteúdo aguardando JavaScript. Movimento reduzido interrompe entradas, remove deslocamentos e desativa rolagem suave, inclusive quando a preferência muda com a página aberta.

## Menu ativo e câmera de Soluções

O scrollspy usa uma linha a 25% da área útil abaixo da altura real do cabeçalho. A seção atravessada por essa linha recebe o único `aria-current="location"`. Scroll, redimensionamento, mudança de altura das seções/cabeçalho, fontes e histórico atualizam o cálculo por requestAnimationFrame; não existe seleção por porcentagem de interseção nem um segundo observador escrevendo no menu. O clique destaca o destino imediatamente durante a rolagem suave. A prioridade temporária termina ao alcançar o destino, ao terminar a rolagem, na primeira intervenção por roda/toque/teclado/ponteiro ou, no máximo, em 1,4 s.

`solutionScene` em `config.js` centraliza centro de interesse, região a preservar, limite de zoom e ponto de apresentação de cada alvo. Os valores são normalizados em relação ao arquivo original: desktop **1672×941**, mobile **934×1684**. Na imagem desktop, a casa ocupa a frente à direita, a empresa fica no centro e o campo/painéis com silos ficam ao fundo à direita; na mobile, a empresa aparece à esquerda e os outros dois alvos têm posições verticais próprias. A região de cada objeto limita escala e deslocamento para permanecer visível. A translação também é limitada à cobertura da janela, evitando bordas vazias.

A primeira visita mostra a visão geral, sem opção marcada ou zoom. Apenas a imagem dentro de `.solution-scene` se transforma; textos, controles, cabeçalho e demais seções permanecem imóveis. A janela mantém suas dimensões. A reserva de altura do resumo considera as quatro mensagens no tamanho de texto atual para evitar deslocar o CTA. “Ver visão geral” restaura a foto e limpa a seleção, sem trocar de seção. Sem seleção, o CTA usa a mensagem geral; com seleção, mantém as mensagens de casa, empresa e campo.

A câmera usa uma transição CSS de 780 ms, que parte do enquadramento corrente quando o visitante troca de opção, inclusive em cliques rápidos. Não cria fila de animações, não faz zoom na entrada/rolagem e não usa rotação. ResizeObserver, carregamento do ativo e fontes recalculam o alvo após redimensionamento. Movimento reduzido aplica o enquadramento imediatamente, inclusive se a preferência mudar durante uma transição. No mobile, um clique/toque real pode alinhar a cena na área visível quando ela ficou acima da tela; a rolagem continua nativa e o foco permanece no controle, sem mover o teclado para a foto.

## Configuração e pendências

Em `config.js`: marca Inovar, logotipo, `whatsappNumber`, mensagens por origem e alegação de economia. O WhatsApp informado pelo usuário é **(86) 98846-4618**, configurado com DDI como `5586988464618`. O telefone também aparece no contato com link para ligação. O CTA principal prepara a conversa no WhatsApp; a escolha de contexto mantém o mesmo destino e altera somente a mensagem. A apresentação inicial não mostra aviso de configuração nem a mensagem preparada para o atendimento. Ao clicar no CTA sem número, surge apenas “O WhatsApp ainda não está disponível. Tente novamente em breve.” em uma região de status com foco acessível; não há navegação externa ou falso sucesso. A escolha de um novo contexto limpa esse aviso. A mensagem contextual existe somente na configuração/estado e no link quando há número válido. Com o número oficial, use dígitos com código do país; os links são normalizados e usam `encodeURIComponent`. Mensagens variam entre hero, casa, empresa, campo, projeto e contato.

A promessa de 90% está desativada (`savingsClaim.validated: false`). O título utiliza “Menos gastos na sua conta de luz.”. Só habilitar o percentual depois de validação comercial; a ressalva de variação por consumo e projeto muda junto. A marca e o WhatsApp foram informados pelo usuário; logotipo e respostas da FAQ continuam configuráveis.

Há apenas uma cena de projeto conceitual, com “Imagens ilustrativas” discreto e legível. A contagem e as setas inativas foram removidas. O grande painel opaco foi substituído por texto e um gradiente radial localizado e transparente nas extremidades, preservando a arquitetura. As abas selecionam o perfil de solução; não simulam outras fotos ou instalações entregues. Não existe carrossel fictício.

## Validação

Com o servidor ativo, inicie Chromium em outra sessão, somente neste ambiente isolado:

```sh
chromium --headless --no-sandbox --disable-gpu --remote-debugging-address=127.0.0.1 --remote-debugging-port=9222 --user-data-dir=/tmp/auto-chrome --blink-settings=primaryHoverType=2,availableHoverTypes=2,primaryPointerType=4,availablePointerTypes=4 about:blank
npm test
```

A suíte cobre 320–2560 px, tablet até 1023, desktop a partir de 1024, landscape baixo e reflow equivalente a 200%. Verifica enquadramento de cada ativo, transição nas bordas do cenário, tamanhos mínimos de leitura, ausência de overflow e colisões, áreas de toque, contato inicial limpo e aviso acessível somente após o clique, menu por teclado, proposta, mensagens dos três perfis, FAQ e busca nas respostas sem acentos, foco ao filtrar, altura variável sem cortes, mudança dinâmica de movimento reduzido, projeto único e funcionamento sem JavaScript. A suíte verifica que existem exatamente seis cenários, um cabeçalho e um FAQ, sem visualizadores públicos; cada cena usa o ativo apropriado. No fluxo natural, as fotos tocam as bordas; no desktop compatível, ficam centralizadas, inteiras e dentro da área disponível. Mede todos os elementos das seis seções, `scrollHeight`/`clientHeight`, alinhamento das âncoras com o cabeçalho e cada uma das cinco respostas do FAQ. Também injeta uma resposta longa e amplia o texto em 200% para conferir crescimento sem corte. Testa normalização e mensagens de WhatsApp com configuração exclusiva de teste, sem navegar externamente.

Capturas integrais e de viewport das seis seções em 360×800, 390×844, 768×1024, 1366×768, 1440×900 e 1920×1080, além de 1280×480 e reflow em 720×450 (equivalente a 1440×900 com zoom de 200%), ficam em `/tmp/solar-checks/`. Há também capturas de Soluções/FAQ com texto ampliado em 200%. `SCREENSHOT_DIR` substitui esse diretório; `TEST_URL` permite usar o servidor de build. A revisão não substitui testes com leitor de tela e dispositivos físicos. As verificações de entrada incluem execução única, deslocamento máximo, fotos somente por opacidade e preferência reduzida dinâmica. A câmera de Soluções tem sua suíte específica em `scripts/interactions.mjs`, executada junto com `npm test`: descida/subida, limites da linha de leitura, clique, roda/toque, enquadramentos/ROI, cobertura sem vazio, ausência de salto, teclado, visão geral, troca rápida e redimensionamento. As capturas `camera-*.png` mostram as três seleções em 1100×760, 1366×768, 1440×900, 1920×1080, 360×800, 390×844, 768×1024 e 1280×480.

HTML independente:

```sh
npm run export -- /tmp/Inovar.html
```

A exportação inclui CSS, JavaScript, fontes e cenas mobile/desktop. Depois de `npm run export` (saída padrão `dist/Inovar.html`), use `EXPORT_URL=http://127.0.0.1:3001/Inovar.html npm test` com o servidor de build ativo para testar também a interatividade do HTML único. Nenhum desses comandos publica o site ou cria uma URL pública.
