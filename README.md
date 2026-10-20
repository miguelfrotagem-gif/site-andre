# Energia Solar

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

Todas as seções externas ocupam 100% da largura, sem limite máximo, margens ou padding lateral. No fluxo natural, fotografias alcançam as duas bordas, sem moldura, cantos arredondados, recorte, zoom ou distorção. `picture` seleciona a cena desktop a partir de 1024 px e a composição mobile abaixo disso. A altura das fotos respeita suas dimensões intrínsecas; o conteúdo pode aumentar a seção quando precisa de espaço. No modo desktop de uma tela, a foto inteira é limitada à área disponível, centralizada e acompanhada pelo fundo azul da seção quando as proporções diferem. Não há ampliação além das dimensões originais. Somente textos e controles recebem margens e largura máxima. O CSS foi consolidado em regras de base e breakpoints, substituindo as camadas anteriores de sobrescrita.

As cenas desktop sem interface estão em `assets/solar/desktop/`, derivadas das referências preservando o enquadramento. A hero mantém sua fotografia limpa existente e o contato reutiliza o cenário de projetos. As cenas mobile existentes foram mantidas. Menus, textos e botões incorporados aos screenshots não são apresentados como parte da interface.

O retrato de Eude permanece no mesmo SVG sem perdas, com pixels idênticos ao original e máscara apenas na silhueta. Cabeça, braços, relógio e uniforme foram preservados. Nome e CTA continuam como HTML; no celular ficam abaixo do retrato. O contato não possui formulário. A fonte Manrope é local, com licença em `assets/automotiva/OFL-Manrope.txt`.

## Seções completas e movimento

A partir de **1100 × 760 px**, cada seção tem altura mínima igual à viewport visível menos a altura real do cabeçalho. O limite de 760 px foi escolhido após medir o conteúdo de Soluções; telas mais baixas usam altura natural. `ResizeObserver` atualiza `--header-height` quando fontes, tamanho do texto ou configuração alteram o cabeçalho. O valor só é descontado uma vez.

O desktop ajusta títulos também pela altura disponível e reduz espaços verticais, mantendo o corpo em 16 px e botões de pelo menos 56 px no tamanho padrão. As quatro etapas e as três soluções permanecem visíveis. O FAQ apresenta título/CTA à esquerda e busca/perguntas à direita, com uma resposta aberta por vez. Respostas excepcionalmente longas, texto ampliado e conteúdo sem JavaScript podem aumentar a seção: não existem altura máxima, corte de texto, scroll interno ou scroll snap obrigatório. O cabeçalho pode quebrar em linhas com texto ampliado. O retrato mantém proporção e enquadramento.

As entradas são executadas uma única vez por elemento via IntersectionObserver e Web Animations: cabeçalho em 400 ms, textos em 560 ms com até 14 px de deslocamento e etapas/opções com intervalo de 70 ms. Fotografias e retrato usam apenas opacidade. CTAs têm atrasos curtos; a seta desloca no máximo 2 px. Rolagem e cliques continuam livres. Não há estado CSS que esconda o conteúdo aguardando JavaScript. Movimento reduzido interrompe entradas, remove deslocamentos e desativa rolagem suave, inclusive quando a preferência muda com a página aberta.

## Configuração e pendências

Em `config.js`: marca provisória, logotipo, nome do proprietário, `whatsappNumber`, mensagens por origem e alegação de economia. O número continua vazio: o botão informa a pendência, sem abrir número fictício ou mostrar sucesso. Com o número oficial, use dígitos com código do país; os links são normalizados e usam `encodeURIComponent`. Mensagens variam entre hero, casa, empresa, campo, projeto e contato.

A promessa de 90% está desativada (`savingsClaim.validated: false`). O título utiliza “Menos gastos na sua conta de luz.”. Só habilitar o percentual depois de validação comercial; a ressalva de variação por consumo e projeto muda junto. Antes de publicar, confirmar marca/logotipo, WhatsApp e respostas da FAQ com a empresa.

Há apenas uma cena de projeto conceitual, com “Imagens ilustrativas”, contagem 01 / 01 e setas desativadas. As abas selecionam o perfil de solução; não simulam outras fotos ou instalações entregues. Não existe carrossel fictício.

## Validação

Com o servidor ativo, inicie Chromium em outra sessão, somente neste ambiente isolado:

```sh
chromium --headless --no-sandbox --disable-gpu --remote-debugging-address=127.0.0.1 --remote-debugging-port=9222 --user-data-dir=/tmp/auto-chrome --blink-settings=primaryHoverType=2,availableHoverTypes=2,primaryPointerType=4,availablePointerTypes=4 about:blank
npm test
```

A suíte cobre 320–2560 px, tablet até 1023, desktop a partir de 1024, landscape baixo e reflow equivalente a 200%. Verifica enquadramento de cada ativo, ausência de overflow e colisões, áreas de toque, posição do retrato/CTA, menu por teclado, proposta, mensagens dos três perfis, FAQ e busca nas respostas sem acentos, foco ao filtrar, altura variável sem cortes, mudança dinâmica de movimento reduzido, projeto único e funcionamento sem JavaScript. A suíte verifica que existem exatamente seis cenários, um cabeçalho e um FAQ, sem visualizadores públicos; cada cena usa o ativo apropriado. No fluxo natural, as fotos tocam as bordas; no desktop compatível, ficam centralizadas, inteiras e dentro da área disponível. Mede todos os elementos das seis seções, `scrollHeight`/`clientHeight`, alinhamento das âncoras com o cabeçalho e cada uma das cinco respostas do FAQ. Também injeta uma resposta longa e amplia o texto em 200% para conferir crescimento sem corte. Testa normalização e mensagens de WhatsApp com configuração exclusiva de teste, sem navegar externamente.

Capturas integrais e de viewport das seis seções em 360×800, 390×844, 768×1024, 1366×768, 1440×900 e 1920×1080, além de 1280×480 e reflow em 720×450 (equivalente a 1440×900 com zoom de 200%), ficam em `/tmp/solar-checks/`. Há também capturas de Soluções/FAQ com texto ampliado em 200%. `SCREENSHOT_DIR` substitui esse diretório; `TEST_URL` permite usar o servidor de build. A revisão não substitui testes com leitor de tela e dispositivos físicos. As verificações de movimento incluem entrada única, deslocamento máximo, fotos somente por opacidade e preferência reduzida dinâmica.

HTML independente:

```sh
npm run export -- /tmp/Energia-Solar.html
```

A exportação inclui CSS, JavaScript, fontes, cenas mobile/desktop e retrato sem perdas. Depois de `npm run export` (saída padrão `dist/Energia-Solar.html`), use `EXPORT_URL=http://127.0.0.1:3001/Energia-Solar.html npm test` com o servidor de build ativo para testar também a interatividade do HTML único. Nenhum desses comandos publica o site ou cria uma URL pública.
