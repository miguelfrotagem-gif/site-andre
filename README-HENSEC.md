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

A seção Tecnologias é uma composição editorial **sem imagens**, intitulada “Tecnologia que transforma a sua segurança.”. A coluna de título e navegação permanece sticky temporariamente no desktop. As quatro etapas principais são reconhecimento facial e biometria, alarmes sem fio, biometria digital e câmeras com IA. O scroll nativo atualiza a etapa ativa e uma linha de progresso; cada indicador também é uma âncora acessível. Videoporteiros e fechaduras aparecem em dois blocos complementares. No celular, o fluxo é vertical e não há sticky prolongado. Movimento reduzido remove os deslocamentos e mantém todo o conteúdo legível. Em desktops muito baixos, a coluna deixa de ser fixa para evitar cortes.

Nenhuma imagem foi gerada, pesquisada, baixada ou adicionada a esta atualização. Não há imagens, fundos fotográficos, slots vazios ou avisos de foto futura na seção Tecnologias. As imagens das outras seções permanecem como estavam. Os IDs e artigos semânticos permitem inserir fotografias fornecidas pelo responsável depois, sem reservar espaços vazios agora.

As seis referências, textos, benefícios e CTAs são centralizados em `config.js`, em `technologyReferences`; os textos também constam no HTML como fallback sem JavaScript. Se o portfólio for alterado, sincronize esse fallback. Os seis registros têm `confirmed:false`: a marca Intelbras foi informada pela empresa, mas os modelos específicos e suas configurações ainda são referências a confirmar. A VIP 3240 IA G2 não é apresentada como solução de reconhecimento facial. As mensagens de WhatsApp são específicas por solução e não afirmam disponibilidade, preço ou prazo.

Referências fornecidas no briefing:

- SS 3542 MF W — reconhecimento facial e biometria.
- AMT 8000 PRO — alarmes sem fio.
- SS 3420 MF BIO — biometria digital.
- VIP 3240 IA G2 — videomonitoramento com IA.
- XPE 3200 PLUS IP — videoporteiro.
- IFR 7000+ — fechadura inteligente.

A galeria tem quatro fontes de imagem distintas, miniaturas, setas, contador, gesto horizontal nativo e ampliação em diálogo com Escape e retorno de foco. As abas de ambientes alteram fotografia, texto e mensagem do WhatsApp entre residências e empresas/comércios. FAQ usa `details/summary`, teclado nativo e uma resposta por vez. Menu móvel, estado ativo e cabeçalho depois da rolagem são preservados.

## Dados confirmados e imagens pendentes

- Marca: HENSEG, com a logomarca enviada pelo usuário.
- WhatsApp: **+55 11 94554-9849**, normalizado como `5511945549849` em `config.js`.
- CNPJ informado pelo usuário: **61.285.070/0001-28**. Os dígitos verificadores foram conferidos; não foi feita consulta cadastral externa.
- Equipamentos Intelbras: marca informada pelo usuário; modelos de referência fornecidos no briefing, sujeitos à confirmação comercial e de ficha técnica.
- A razão social completa não foi fornecida. Não foi inventada identificação cadastral, certificação ou condição de atendimento.

As fotos atuais são ilustrações/conceitos, identificados na interface. Não representam instalações comprovadas ou modelos comerciais Intelbras específicos. Para substituir os visuais conceituais, fornecer fotos dos terminais faciais e leitores biométricos realmente comercializados, seus modelos, sensores em detalhe e instalações reais autorizadas para divulgação. Nenhuma foto de concorrente foi publicada.

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

A suíte verifica 320–1920 px, incluindo 360, 390, 430, 768, 1280 e 1440, desktop com pouca altura, ausência de overflow/cortes, navegação e WhatsApp oficiais. Testa progressão reversível, título sticky e área segura, seis referências/mensagens, ausência de mídias e slots vazios na seção Tecnologias, fluxo com movimento reduzido, abas pelo teclado, mensagens contextuais, seleção e gesto de galeria, Escape e foco, FAQ por Enter, persistência/apagamento/expiração das preferências, páginas legais e ausência de pedidos externos automáticos. Capturas ficam em `/tmp/hensec-checks`.
