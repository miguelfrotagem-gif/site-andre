# HENSEG — segurança eletrônica e controle de acesso

Aplicação estática, sem dependências npm, backend, coleta biométrica ou scripts de publicidade/análise. A página da HENSEG está em **`hensec.html`**. A raiz `index.html` contém o projeto Ademicon de uma atualização remota e foi preservada, assim como seus assets, código e testes.

## Desenvolvimento e validação

```sh
cd /workspace/site-andre
npm run dev
```

Acesse `/hensec.html`. Para usar a raiz local como HENSEG, inicie com `SITE=hensec npm run dev`. Use o checkout existente; tarefas na nuvem já são isoladas, sem necessidade de worktree.

```sh
npm run lint
npm run build
npm run test:hensec
npm test
```

Os testes usam Chromium CDP na porta 9222 e o servidor local na porta 3000. Inicie Chromium, se necessário:

```sh
chromium --headless --no-sandbox --disable-gpu --remote-debugging-address=127.0.0.1 --remote-debugging-port=9222 --user-data-dir=/tmp/hensec-chrome about:blank
```

`npm run test:hensec` executa a suíte HENSEG, com `TEST_URL=http://127.0.0.1:3000/hensec.html` por padrão. `npm test` preserva a suíte Ademicon. Para verificar o build, inicie `SERVE_DIST=1 PORT=3001 npm start` e use `TEST_URL=http://127.0.0.1:3001/hensec.html npm run test:hensec`.

## Conteúdo e comportamento

A hero apresenta “A segurança evoluiu. O seu acesso também.”, com reconhecimento facial, biometria e controle de acesso. A Intelbras foi informada pelo usuário como marca do portfólio. A entrada é curta e integrada: conteúdo e CTAs não aguardam uma abertura em tela inteira.

A seção Tecnologias mantém quatro etapas principais com os materiais do ZIP: controle facial, alarmes, biometria e câmeras. A foto sticky acompanha o texto ativo por crossfade reversível no desktop. Tablet, celular, telas baixas e movimento reduzido mostram cada foto junto ao conteúdo. Interfonia e fechadura têm blocos complementares e suas próprias imagens. Os textos e as mensagens de WhatsApp são centralizados em `technologyReferences` e `messages` no `config.js`, com fallback sem JavaScript no HTML.

Todas as áreas que continham equipamentos fictícios foram atualizadas: hero, soluções e fundos, tecnologias, ambientes, sobre, contato, galeria, miniaturas e versões mobile. As composições de fundo anteriores foram retiradas por completo quando incluíam equipamentos incorporados. O inventário ativo e as identificações estão em `docs/henseg-substituicao-fotos-reais.md` e `docs/henseg-media-audit.json`.

A galeria tem seis fontes fornecidas, navegação nativa por gesto, contador, miniaturas e ampliação com Escape/retorno de foco. Cada arquivo é exibido inteiro, sem filtros e sem superar suas dimensões nativas, inclusive no modal. As abas residencial e empresarial continuam com materiais e mensagens diferentes. FAQ, cabeçalho e botão verde do WhatsApp foram preservados.

## Dados confirmados e imagens pendentes

- Marca: HENSEG, com a logomarca enviada pelo usuário.
- WhatsApp: **+55 11 94554-9849**, normalizado como `5511945549849` em `config.js`.
- CNPJ informado pelo usuário: **61.285.070/0001-28**. Os dígitos verificadores foram conferidos; não foi feita consulta cadastral externa.
- Equipamentos Intelbras: marca informada pelo usuário; modelos de referência fornecidos no briefing, sujeitos à confirmação comercial e de ficha técnica.
- A razão social completa não foi fornecida. Não foi inventada identificação cadastral, certificação ou condição de atendimento.

As seis imagens atuais foram selecionadas e fornecidas pelo usuário no ZIP. Não foram geradas, buscadas na internet ou retocadas nesta atualização. A procedência fotográfica de todos os materiais não foi verificada: não são apresentadas como instalações comprovadas de clientes. Os hashes e dimensões originais estão em `docs/henseg-provided-products.json`.

O controlador biométrico está identificado na própria imagem como **SS 3430 MF BIO**. Terminal facial, central Sistema 8000, câmera, componentes do kit e fechadura ficam identificados por categoria até a confirmação dos códigos. A fechadura foi autorizada pelo usuário para apresentação, mas não é identificada como Intelbras/IFR 7000+. A câmera não recebe alegações de IA, microfone ou reconhecimento facial sem uma ficha técnica confirmada.

Os endereços Grupo Extrema e Verisure enviados pelo usuário retornaram bloqueio HTTP 403 no ambiente, inclusive após verificar a permissão de rede. O briefing fornecido guiou a implementação; não se afirma que as páginas dos concorrentes foram inspecionadas.

## Privacidade e cookies

`privacidade.html` e `cookies.html` descrevem os recursos efetivos da HENSEG. Não há cookies definidos pelo código, análise, publicidade, embeds externos automáticos, formulários ou transmissão de dados biométricos. Fotos de reconhecimento facial não solicitam acesso à câmera do visitante.

`site-extras.js` mantém somente `henseg_privacy_v1` no `localStorage` depois da confirmação. O registro contém versão, confirmação, data e expiração de até 180 dias; não é enviado a um servidor. Não há categorias opcionais fictícias. O site funciona sem confirmar. Preferências reabrem no rodapé e nas políticas; apagar a escolha remove a chave e faz o aviso reaparecer. A implementação trata armazenamento bloqueado, expiração e retorno por bfcache. O aviso fica separado do WhatsApp e não é uma barreira de navegação.

WhatsApp e GitHub são descritos como serviços externos, com seus links oficiais de privacidade. Mensagens só são enviadas por decisão do usuário no WhatsApp. O texto técnico não é uma certificação automática de conformidade jurídica; a revisão da empresa continua recomendada, sem inventar razão social ou processos internos.

## Build, exportação e publicação

O build preserva Ademicon em `dist/index.html` e coloca HENSEG em `dist/hensec.html`, com as duas políticas, scripts e imagens locais. As páginas recebem URLs de CSS/JS com hash de conteúdo. O servidor continua compatível com ambas as aplicações.

`npm run export -- /tmp/henseg-export/HENSEG.html` gera uma versão com assets incorporados e as duas políticas ao lado, com links de retorno corretos. Distribua os três HTMLs juntos. O ZIP do build mantém a aplicação completa.

O repositório usa a branch `gh-pages` para publicação nativa. As regras existentes impedem deploy direto pela `main`. O código fica em `main`; o conteúdo compilado é enviado para `gh-pages` sem remover o outro projeto ou um eventual CNAME. Endereço HENSEG: `https://miguelfrotagem-gif.github.io/site-andre/hensec.html`.

## Cobertura dos testes

A suíte verifica 320–1920 px, incluindo 360, 390, 430, 768, 1280 e 1440, desktop com pouca altura, ausência de overflow/cortes, navegação e WhatsApp oficiais. Testa progressão e troca de fotos reversíveis, área sticky segura, seis identificações/mensagens, apenas materiais do ZIP nas imagens de equipamentos, limites nativos de resolução e ausência de filtros, fluxo com movimento reduzido, abas pelo teclado, mensagens contextuais, seleção e gesto de galeria, Escape e foco, FAQ por Enter, persistência/apagamento/expiração das preferências, páginas legais e ausência de pedidos externos automáticos. Capturas ficam em `/tmp/hensec-checks`.
