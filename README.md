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

Todas as seções externas ocupam 100% da largura, sem limite máximo, margens ou padding lateral. Fotografias alcançam as duas bordas, sem moldura, cantos arredondados, recorte, zoom ou distorção. `picture` seleciona a cena desktop a partir de 1024 px e a composição mobile abaixo disso. A altura das fotos respeita suas dimensões intrínsecas; o conteúdo pode aumentar a seção quando precisa de espaço. Somente textos e controles recebem margens e largura máxima. O CSS foi consolidado em regras de base e breakpoints, substituindo as camadas anteriores de sobrescrita.

As cenas desktop sem interface estão em `assets/solar/desktop/`, derivadas das referências preservando o enquadramento. A hero mantém sua fotografia limpa existente e o contato reutiliza o cenário de projetos. As cenas mobile existentes foram mantidas. Menus, textos e botões incorporados aos screenshots não são apresentados como parte da interface.

O retrato de Eude permanece no mesmo SVG sem perdas, com pixels idênticos ao original e máscara apenas na silhueta. Cabeça, braços, relógio e uniforme foram preservados. Nome e CTA continuam como HTML; no celular ficam abaixo do retrato. O contato não possui formulário. A fonte Manrope é local, com licença em `assets/automotiva/OFL-Manrope.txt`.

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

A suíte cobre 320–2560 px, tablet até 1023, desktop a partir de 1024, landscape baixo e reflow equivalente a 200%. Verifica enquadramento de cada ativo, ausência de overflow e colisões, áreas de toque, posição do retrato/CTA, menu por teclado, proposta, mensagens dos três perfis, FAQ e busca nas respostas sem acentos, foco ao filtrar, altura variável sem cortes, mudança dinâmica de movimento reduzido, projeto único e funcionamento sem JavaScript. A suíte verifica que existem exatamente seis cenários, um cabeçalho e um FAQ, sem visualizadores públicos; cada cena deve tocar as duas bordas e usar o ativo apropriado para a largura. Testa normalização e mensagens de WhatsApp com configuração exclusiva de teste, sem navegar externamente.

Capturas integrais das seis seções e capturas de viewport em 390, 768, 1366 e 1920 px ficam em `/tmp/solar-checks/`. `SCREENSHOT_DIR` substitui esse diretório; `TEST_URL` permite usar o servidor de build. A revisão não substitui testes com leitor de tela e dispositivos físicos. A entrada usa opacidade e deslocamento curto, sem alterar escala; etapas têm defasagem de 70 ms. A preferência de movimento reduzido desativa os efeitos.

HTML independente:

```sh
npm run export -- /tmp/Energia-Solar.html
```

A exportação inclui CSS, JavaScript, fontes, cenas mobile/desktop e retrato sem perdas. Depois de `npm run export` (saída padrão `dist/Energia-Solar.html`), use `EXPORT_URL=http://127.0.0.1:3001/Energia-Solar.html npm test` com o servidor de build ativo para testar também a interatividade do HTML único. Nenhum desses comandos publica o site ou cria uma URL pública.
