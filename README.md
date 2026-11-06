# HC Sistemas de Segurança

Site estático em português, reconstruído em HTML, CSS e JavaScript a partir das cinco referências do kit `HC_KIT_COMPLETO_COM_5_IMAGENS.zip`. Node.js 24 executa o servidor, o build e os testes. Não há dependências npm nem instalação de pacotes.

```sh
cd /workspace/site-andre
npm run dev
```

A HC ocupa `index.html` e também está disponível em `hc.html`. A porta padrão é 3000, configurável por `PORT`. Use o checkout existente: cada tarefa de nuvem já é isolada; não é necessário criar worktree.

```sh
npm run lint
npm run build
```

O build prepara `dist/`, sem publicar. Versiona CSS, JavaScript e a importação da configuração da HC para atualizar caches. Para servir a distribuição:

```sh
SERVE_DIST=1 PORT=3001 npm start
```

## Testes funcionais

Inicie Chromium em um processo separado:

```sh
chromium --headless --no-sandbox --disable-gpu \
  --remote-debugging-address=127.0.0.1 --remote-debugging-port=9222 \
  --user-data-dir=/tmp/hc-chrome about:blank
npm test
```

`npm test` e `npm run test:hc` executam a suíte HC. `HC_PAGE=index.html` testa a entrada principal; `TEST_URL=http://127.0.0.1:3001 HC_PAGE=index.html npm test` testa a distribuição. `CDP_URL` permite selecionar outro Chromium. A suíte usa CDP nativo, sem Playwright ou bibliotecas extras.

A matriz inclui 360, 375, 390, 430, 768, 1024, 1366, 1440 e 1920px, com alturas adicionais de 500, 568 e 600px. Verifica enquadramento, scrollspy nas cinco seções, menu por teclado, foco contido, Escape, seleção de serviço, validação do formulário, revisão sem envio, estados de integração, fallback sem JavaScript, movimento e ausência de erros locais. Relatório e capturas: `/tmp/hc-checks/`.

Os testes de integração interceptam requisições no navegador e fornecem respostas de teste. Não enviam mensagens reais e não validam um backend de produção.

## Contato e avaliações

Configure apenas valores públicos em `hc/config.js`:

- `CONTACT_ENDPOINT`: URL do backend de contato, vazia por padrão. Recebe POST JSON com `name`, `phone`, `email`, `service` e `message`. Deve responder HTTP 2xx e JSON `{"success":true}` somente após aceitar a solicitação. HTTPS é obrigatório para destinos externos. Requisições têm timeout de 15 segundos; falhas preservam os campos. O servidor precisa implementar validação, proteção contra abuso, limites, tratamento dos dados e CORS quando necessário. Não coloque chaves ou credenciais no JavaScript do site.
- `GOOGLE_REVIEWS_URL`: perfil correto e confirmado das avaliações, vazio por padrão. Sem URL, o site explica a indisponibilidade e não inventa um link de avaliações.
- `WHATSAPP_PHONE`: número confirmado em dígitos, com código do país, vazio por padrão. Sem número, os CTAs levam ao formulário.
- `MAP_URL`: busca do endereço fornecido no Google Maps. O mapa desenhado na página é uma representação ilustrativa, identificada como tal; não afirma coordenadas verificadas.

Sem backend, o formulário valida e abre uma revisão local, explicitamente sem envio ou persistência. Dados não são gravados em cookies, armazenamento local ou URLs. Os estados reais de envio só são habilitados quando um endpoint válido é configurado.

A nota 4,8 e as 36 avaliações foram informadas no briefing e aparecem como pendentes de confirmação. Não foram adicionados nomes, fotografias ou depoimentos fictícios. Os três cards aguardam conteúdo real autorizado. Confirme nota, quantidade e perfil antes da publicação definitiva.

## Referências e decisões visuais

Hero com câmera à direita e título à esquerda; soluções com quatro fotografias; sobre com técnico e diferenciais; avaliações com resumo e três cards; contato com formulário, endereço e área de mapa. No mobile, a fotografia da hero passa para um bloco próprio, preservando a câmera e áreas de toque confortáveis. Menu sticky único, scrollspy, foco por teclado e redução de movimento.

As imagens de referência não são seções rasterizadas: textos, logomarca tipográfica, controles, ícones e cards são elementos reais. As fotografias foram reconstruídas a partir das referências com edição assistida, removendo os elementos de interface gravados. Essa reconstrução altera detalhes fotográficos e não é uma cópia pixel a pixel. Cenas e equipamentos são ilustrativos, e o técnico não é apresentado como funcionário real. Os arquivos finais estão em `assets/hc/`; consulte `docs/hc-assets.json` para procedência e hashes. Montserrat e Manrope reutilizam fontes locais do projeto. A logomarca tipográfica aproxima a referência; um arquivo vetorial oficial poderá substituí-la quando fornecido.

A revisão local não equivale a medição de Core Web Vitals em produção nem a teste em todos os navegadores ou leitores de tela.

## Projetos preservados

- FS Perfuração: `fs-perfuracao.html`, código e assets originais preservados. Documentação anterior em `docs/README-FS.md` (seus links relativos continuam descritos a partir da raiz original). Para usar sua suíte sem alterar os testes: `SITE=fs PORT=3002 npm start` e, em outro processo, `TEST_URL=http://127.0.0.1:3002 npm run test:fs:all`.
- Ademicon: `ademicon.html`; `README-ADEMICON.md`. Para servir na raiz de um processo separado: `SITE=ademicon PORT=3003 npm start`.
- HENSEC: `hensec.html`; `README-HENSEC.md`. Para servir na raiz de outro processo: `SITE=hensec PORT=3004 npm start`.

O build inclui esses três projetos e seus recursos. Nenhuma publicação no GitHub Pages faz parte desta implementação. Para atualizar a distribuição publicada, preserve os demais projetos, `.nojekyll` e eventual `CNAME`; publicação requer autorização explícita.
