# HENSEG — segurança eletrônica

Aplicação estática, sem dependências npm, backend, coleta biométrica ou scripts de publicidade/análise. Entrada HENSEG: **`hensec.html`**. A raiz `index.html` pertence ao Ademicon e deve ser preservada, assim como os demais projetos publicados.

## Desenvolvimento e validação

```sh
npm run dev
npm run lint
npm run build
npm run test:hensec
npm run test:mobile
npm run test:navigation
```

Acesse `/hensec.html`. Para servir HENSEG na raiz local: `SITE=hensec npm run dev`. O build mantém Ademicon em `dist/index.html`. Para testar o build: `SERVE_DIST=1 PORT=3001 npm start`, usando `TEST_URL=http://127.0.0.1:3001/hensec.html` nos comandos de teste.

As suítes de navegador usam Chromium CDP na porta 9222. Execute-as sequencialmente para preservar foco e renderização:

```sh
chromium --headless --no-sandbox --disable-gpu --remote-debugging-address=127.0.0.1 --remote-debugging-port=9222 --user-data-dir=/tmp/hensec-chrome about:blank
```

`npm test` continua executando a suíte independente do Ademicon.

## Layout compartilhado

Os PDFs desktop atualizado (11 composições) e mobile (12 composições) orientam o layout. Textos, fotos, botões e perguntas são elementos reais. Uma única árvore de seções atende desktop e mobile; somente frases específicas e links de navegação mudam por breakpoint.

Ordem: início, cinco soluções, alarmes, câmeras, cerca elétrica, interfonia, facial, sobre, quatro etapas, dúvidas, contato e rodapé. Biometria digital e fechaduras ficam em um bloco complementar opcional depois da quinta prioridade.

`styles.css` mantém a base e as políticas; `mobile.css` compõe o celular; `desktop.css` adapta os mesmos componentes para as referências desktop. Mobile: até 767 px, incluindo horizontal até 1023 px quando a altura é de até 500 px. As fotos mantêm proporção, `contain` e resolução original. Em telas baixas, as seções crescem naturalmente. Não há scroll obrigatório, sticky de produtos, zoom ou carrossel automático.

`app.js` mantém um único `aria-current=location`, calculado pela maior área visível abaixo do cabeçalho. Os produtos pertencem a Soluções no desktop; o mobile destaca cada categoria. Etapas pertence a Sobre no desktop; dúvidas e rodapé pertencem a Contato. Cliques, interrupção manual, redimensionamento e mudanças de altura mantêm o menu sincronizado. As âncoras são iguais nos dois formatos.

`mobile.js` mantém os comportamentos compartilhados: links de contato, teclado do menu, estado das dúvidas, CTA da hero por breakpoint e prevenção de sobreposição do WhatsApp flutuante. As revelações usam transform/opacity e respeitam movimento reduzido; o conteúdo continua disponível sem animação.

## Conteúdo e origem dos materiais

Marca HENSEG, WhatsApp **+55 11 94554-9849** e CNPJ **61.285.070/0001-28** foram informados pelo usuário. A razão social completa não foi fornecida e não é inventada.

As fotos de alarme, câmera, facial, interfonia, biometria e fechadura vêm do kit de produtos fornecido. O kit mobile fornece a central de cerca e a referência de arquitetura. Somente o trecho fotográfico da arquitetura é usado, sem textos, interface ou equipamento no teto; a legenda o identifica como ambientação, sem alegação de obra ou instalação da HENSEG. Nenhum equipamento foi gerado ou redesenhado.

Identificações: Sistema 8000; câmera Intelbras e terminal facial sem código confirmado; central de cerca como referência de categoria; montagem de interfonia sem promessa de kit comercial único; biometria **SS 3430 MF BIO**; fechadura autorizada no portfólio sem atribuição a Intelbras/IFR 7000+. Não são anunciados recursos técnicos não confirmados.

O manifesto dos seis arquivos originais permanece em `docs/henseg-provided-products.json`. Os documentos de galeria, abas e narrativa da versão anterior são históricos. A implementação atual está descrita em [docs/henseg-desktop.md](docs/henseg-desktop.md) e [docs/henseg-mobile.md](docs/henseg-mobile.md).

## Contato, privacidade e cookies

O contato não tem formulário ou campos de dados pessoais. Segue a nova referência enviada: fundo fotográfico diurno com celular à direita, título “Sua segurança começa aqui.”, card “Vamos conversar?”, CTA “Chamar a Henseg” e links de dúvidas/projeto. Textos e ações são HTML, separados da fotografia limpa, em `contact.css`. Os links abrem o WhatsApp oficial com mensagem inicial, revisada e enviada pelo visitante no aplicativo. Não há envio automático nem armazenamento de dados pessoais.

`site-extras.js` mantém apenas a preferência `henseg_privacy_v1` no armazenamento local após confirmação, com versão e expiração de até 180 dias. Sem cookies próprios, análise, publicidade ou embeds automáticos. Preferências reabrem no rodapé e nas políticas; apagar a escolha remove o registro. Expiração, armazenamento bloqueado e retorno de foco são tratados. `privacidade.html` e `cookies.html` descrevem esses recursos reais.

## Publicação e exportação

`npm run build` inclui CSS/JS com hash de conteúdo e mantém as duas aplicações. `npm run export -- /tmp/henseg-export/HENSEG.html` incorpora os recursos e escreve as duas políticas ao lado; distribua os três HTMLs juntos.

O código fica em `main`; o build HENSEG é publicado em `gh-pages` sem substituir Ademicon, projetos de energia solar, demais diretórios ou um CNAME existente. As regras do ambiente usam publicação nativa pela branch.

Site: `https://miguelfrotagem-gif.github.io/site-andre/hensec.html`.

## Cobertura atual

Desktop: 1672 × 941, 1920 × 1080, 1600 × 900, 1440 × 900, 1366 × 768, 1280 × 720, 1280 × 600 e tablets. Mobile: 320, 360, 375, 390, 414 e 430 px; telas baixas; horizontal 740 × 360 e 844 × 390; texto ampliado. Testes cobrem sequência comercial, proporção/resolução das fotos, ausência de cortes/overflow/sobreposições, menu e foco, FAQ e aria-expanded, complementares, ausência de formulário e links reais de contato, cookies, políticas, ausência de requisições externas automáticas e console limpo. Capturas em `/tmp/henseg-desktop-checks` e `/tmp/henseg-mobile-checks`.
