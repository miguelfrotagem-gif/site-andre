# HENSEC — Monitoramento 24hs

Site estático em HTML semântico, CSS responsivo e JavaScript, sem dependências npm. Usa Node.js 24 e Chromium para testes.

## Desenvolvimento

```sh
cd /workspace/site-andre
npm run dev
```

Servidor na porta 3000; `PORT` permite alterar a porta. Use o checkout existente: cada tarefa de nuvem já é isolada, sem necessidade de worktree.

```sh
npm run lint
npm run build
SERVE_DIST=1 PORT=3001 npm start
```

O build em `dist/` inclui assets locais e versões de cache em CSS/JS. `npm run export` gera `dist/HENSEC.html`, independente, com assets incorporados. Não há backend nem envio automático de mensagens.

## Referência e composição

Quatro seções na ordem do PDF `HENSEC_Referencia_Desktop_Cinematografica.pdf`: Início, Soluções, Sobre e Contato. As imagens em `assets/hensec/` foram limpas com edição generativa a partir da referência para remover interface/textos incorporados. São composições ilustrativas, sem representar instalações comprovadas. Os produtos usam regiões da imagem limpa de soluções; todo título, descrição, numeração, navegação e CTA é HTML real. O cabeçalho utiliza a logomarca enviada pelo usuário, preparada com fundo transparente em `assets/hensec/logo-oficial.png`, com o escudo, a câmera e a assinatura completos.

Desktop: seções full-bleed com `min-height:100svh`, fundos `cover`, escala tipográfica fluida e espaçamento adaptado também à altura. Mobile: fluxo natural, cards empilhados e enquadramentos próprios; conteúdo pode exceder a viewport. Não há scroll-snap ou rolagem interna. Navbar fixa, menu móvel com Escape e indicação da seção ativa por IntersectionObserver e medição da posição. Reveal com Web Animations, stagger de 110ms e parallax limitado a 20px. `prefers-reduced-motion` cancela movimentos inclusive ao mudar com a página aberta. Conteúdo permanece visível sem animações e sem JavaScript.

## WhatsApp

Em `config.js`, `HENSEC_CONFIG.whatsappNumber` contém `5511945549849`, o número oficial informado pelo usuário (+55 11 94554-9849). Números sintéticos dos testes não são contatos reais. Mensagens por solução são centralizadas em `messages`. Com número válido, os links usam `https://wa.me/` e mensagem codificada; sem número, o clique exibe aviso acessível sem navegar para um contato inventado. A navegação dos cards direciona ao contato e prepara o assunto escolhido.

## Validação

Com o servidor ativo, inicie Chromium no ambiente isolado:

```sh
chromium --headless --no-sandbox --disable-gpu --remote-debugging-address=127.0.0.1 --remote-debugging-port=9222 --user-data-dir=/tmp/hensec-chrome about:blank
npm test
```

A suíte CDP testa 1920×1080, 1600×900, 1440×900, 1366×768, 1280×720, 768×1024, 390×844 e 320×700. Verifica ordem semântica, viewport desktop, conteúdo seguro, ausência de overflow horizontal, âncoras, menu ativo/móvel, status acessível do contato ausente, URL e mensagens WhatsApp com número sintético injetado apenas no navegador, cancelamento de animações e erros de console. Capturas atuais são salvas em `/tmp/hensec-checks`.

Os scripts `interactions.mjs` e arquivos de imagens anteriores permanecem como histórico da versão solar e não integram a suíte Hensec. O contato oficial já está configurado.

## Cada detalhe, sob proteção

Narrativa **Etapas**, `#etapas`, inserida imediatamente antes de Contato, preservando Hero, Soluções e Sobre. Três momentos: Prevenção, Inteligência e Tranquilidade. Reutiliza a foto de arquitetura existente e adiciona duas imagens ilustrativas locais em `assets/hensec/story-camera.webp` e `story-calm.webp`, produzidas para manter a direção de arte. Não representa instalação comprovada nem monitoramento real.

Em desktop com movimento habilitado, a seção ocupa 300svh e mantém uma composição sticky com texto em 34% e fotografia em 66%. O progresso real da rolagem controla crossfade, deslocamento de texto de até 14px, escala fotográfica de até 1,2% e linha fina de progresso. Não há wheel/touch interception, scroll-snap, temporizador ou dependências adicionais. Os controles 01/02/03 permitem acessar os momentos também por teclado; o CTA final aponta para `#solucoes`. O menu tem a entrada Etapas, com indicação ativa durante a narrativa.

Mobile, tablet, JavaScript ausente ou `prefers-reduced-motion:reduce` usam os três momentos em fluxo natural, com texto separado da fotografia. Mudanças de viewport/preferência atualizam o modo e removem inert/aria-hidden das etapas estáticas. Listeners são removidos em pagehide e restaurados ao retornar pelo bfcache.

A suíte tem 248 verificações, incluindo progressão para frente/para trás, crossfade intermediário, sticky, três fontes de imagem distintas, teclado no CTA, fluxo mobile, movimento reduzido, redimensionamento e preservação dos testes das quatro seções existentes. Capturas da narrativa são salvas em `/tmp/hensec-checks/narrativa-*`.


### Fluidez e imagem do contato

As transições de Etapas ocupam faixas mais amplas do scroll, com suavização exponencial curta (65ms), opacidade das imagens independente dos textos e uma base fotográfica opaca para evitar escurecimento no crossfade. O movimento continua reversível e respeita movimento reduzido. A imagem `contato-mensagem.webp` preserva a composição e adiciona apenas a conversa ilustrativa na tela do celular: “Olá! Quero mais segurança para meu imóvel.”. O número oficial de WhatsApp foi configurado posteriormente, conforme a seção Contato oficial atualizado.


### Entrada da marca

A logo substitui o símbolo provisório do cabeçalho. O cabeçalho entra em 1100ms; a logo e o nome HENSEG entram em 2100–2400ms depois da decodificação da imagem com opacidade e deslocamento discreto, sem bloquear a navegação ou exibir uma tela de espera. As dimensões ficam reservadas para evitar deslocamento de layout. `prefers-reduced-motion` desativa a entrada, inclusive quando muda com a página aberta.

## GitHub Pages

O repositório já publica a branch `gh-pages`, na raiz, por meio do Pages nativo. As regras do ambiente `github-pages` permitem essa branch e impedem a publicação direta pela `main`. O código-fonte fica em `main`; após `npm run lint` e `npm run build`, o conteúdo de `dist/` deve ser enviado para `gh-pages`, preservando `.nojekyll` e um eventual CNAME. A aba Actions mostra o resultado de “pages build and deployment”. Endereço: https://miguelfrotagem-gif.github.io/site-andre/ .


## Abertura de entrada

Ao abrir ou recarregar o site, uma introdução em tela inteira apresenta a logomarca em tamanho grande, a frase “Sua paz merece proteção.” e uma linha dourada discreta. A marca entra em 1 segundo, permanece visível e o fundo desaparece suavemente, revelando o site em aproximadamente 3,4 segundos após preparar a imagem. O botão “Pular introdução” e Escape encerram imediatamente; o foco é preservado e o conteúdo abaixo fica inert temporariamente. Há um limite máximo de 4,5 segundos para liberar o conteúdo mesmo se a animação for interrompida. Movimento reduzido ignora a abertura; sem JavaScript não existe overlay. A abertura é repetida em novas visitas completas, sem bloqueio por localStorage.


## Contato oficial atualizado

WhatsApp configurado com o número fornecido pelo usuário: **+55 11 94554-9849** (`5511945549849`). O CTA de contato usa mensagens por solução; o botão flutuante abre diretamente `wa.me` com a mensagem geral. O botão flutuante usa o verde tradicional do WhatsApp, ícone branco, sombra discreta e estados de hover/foco. A disponibilidade do atendimento e o envio da mensagem dependem do WhatsApp; o site apenas prepara a conversa.
