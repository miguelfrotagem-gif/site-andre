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

As seis seções mantêm a ordem: início, soluções, como funciona, projetos, dúvidas e contato. O cabeçalho global usa menu compacto até 1023 px, com navegação por teclado, Escape, retorno de foco e CTA de proposta. O menu é uma expansão não modal: a página continua rolável e não há bloqueio de scroll ou foco aprisionado.

A versão mobile é **interface em camadas**, com fotografias limpas, títulos selecionáveis e controles HTML reais. As cenas foram preparadas por edição de imagem a partir das referências mobile e conferidas visualmente. Não são recortes da foto desktop. As fotografias são exibidas inteiras e sem zoom; em telas compactas a seção cresce para preservar leitura e enquadramento. No tablet, blocos limitam a largura em 680 px. A hero usa `picture` para escolher a composição própria do dispositivo; imagens têm dimensões explícitas e as inferiores usam carregamento lazy.

O retrato de Eude utiliza os **pixels do PNG original**, sem geração de rosto, alteração de pele ou braços. Uma máscara SVG com cópia WebP sem perdas (pixels conferidos como idênticos ao PNG) contorna a silhueta, preservando cabelo, rosto, uniforme, relógio e braços cruzados. O retrato também tem carregamento lazy. O fundo fotográfico é separado. Nome, identificação e WhatsApp ficam abaixo do retrato no celular. A fonte Manrope é local; licença em `assets/automotiva/OFL-Manrope.txt`.

O desktop conserva sua apresentação: hero com cena limpa e texto HTML e demais artes integrais expansíveis, com controles HTML associados e conteúdo nativo separado. As palavras e pessoas embutidas nessas artes continuam estáticas. As referências de desktop não são a interface mobile e não aparecem no fluxo do celular.

Os PNGs originais estão preservados em `referencias/solar/` (desktop) e `referencias/solar-mobile/` (mobile). As referências mobile têm dimensões próprias: 934×1684, 934×1683, 933×1686, 934×1683, 934×1684 e 934×1685. Os derivados limpos têm, respectivamente, 934×1685, 934×1684, 933×1686, 935×1683 e 934×1685; os atributos do HTML usam essas dimensões reais. Ativos anteriores permanecem no repositório.

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

A suíte cobre 320–2560 px, tablet até 1023, desktop a partir de 1024, landscape baixo e reflow equivalente a 200%. Verifica enquadramento de cada ativo, ausência de overflow e colisões, áreas de toque, posição do retrato/CTA, menu por teclado, proposta, mensagens dos três perfis, FAQ e busca nas respostas sem acentos, foco ao filtrar, altura variável sem cortes, mudança dinâmica de movimento reduzido, projeto único, modal desktop e funcionamento sem JavaScript. Testa normalização e mensagens de WhatsApp com configuração exclusiva de teste, sem navegar externamente.

Capturas integrais das seis seções em 320, 390, 768 e 1440 px ficam em `/tmp/solar-checks/`. `SCREENSHOT_DIR` substitui esse diretório; `TEST_URL` permite usar o servidor de build. Em uma verificação local com latência artificial de 180 ms e vazão de 300 kB/s, o layout shift acumulado foi 0,0007; isso não é uma medição de produção. A revisão não substitui testes com leitor de tela e dispositivos físicos. A entrada usa opacidade e deslocamento curto, sem alterar escala; etapas têm defasagem de 70 ms. A preferência de movimento reduzido desativa os efeitos.

HTML independente:

```sh
npm run export -- /tmp/Energia-Solar.html
```

A exportação inclui CSS, JavaScript, fontes, cenas mobile/desktop e retrato sem perdas. Depois de `npm run export` (saída padrão `dist/Energia-Solar.html`), use `EXPORT_URL=http://127.0.0.1:3001/Energia-Solar.html npm test` com o servidor de build ativo para testar também a interatividade do HTML único. Nenhum desses comandos publica o site ou cria uma URL pública.
