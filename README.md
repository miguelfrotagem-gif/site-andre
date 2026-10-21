# G Hot e Cold

Site institucional em HTML, CSS e JavaScript nativos. Sem dependências npm, backend, chamadas externas para renderização ou coleta automática de dados do formulário.

## Desenvolvimento

Requer Node.js 24. Em `/workspace/site-andre`:

```sh
npm run dev
npm run lint
npm run build
```

O servidor usa a porta 3000, configurável por `PORT`. `npm start` é equivalente. O build fica em `dist/`; para validar: `SERVE_DIST=1 PORT=3001 npm start`. Estes comandos não publicam o site.

## Contatos confirmados

Preencha `config.js` somente com dados confirmados. `whatsapp` é o canal geral; `julio` e `gil` são destinos específicos. Use números internacionais, incluindo DDI e DDD. Campos vazios mantêm a revisão e cópia da mensagem, com aviso de canal indisponível. Um contato específico ausente usa o geral quando disponível. Nenhuma mensagem é enviada automaticamente: o WhatsApp abre com o texto preparado para o visitante revisar e enviar.

`email` e `formEndpoint` são reservas documentadas, sem integração ativa. Não basta preenchê-los para ativar envio; um futuro serviço requer implementação e validação de contrato, erros e segurança. Não coloque tokens ou credenciais neste arquivo público. Telefones confirmados no cartão: Júlio — (11) 97780-4318; Gil — (11) 91303-9943. O canal geral usa o número do Júlio. E-mail e endpoint não estão integrados.

O formulário valida nome, telefone, assunto e mensagem, preserva os valores em caso de erro e não usa localStorage. Sem JavaScript, conteúdo e navegação permanecem disponíveis; a preparação interativa requer JavaScript.

## Referência e imagens

Quatro seções seguem as páginas aprovadas do PDF fornecido: Início, Soluções, Nossa equipe e Contato. As cenas limpas foram preparadas por edição de imagem a partir das referências; são aproximações fotográficas da composição, não evidência de instalações, produtos disponíveis ou retratos dos profissionais. Texto, links e formulário são HTML real. A marca foi redesenhada em SVG a partir da referência, com aproximação do símbolo.

Imagens em `assets/ghc/` são WebP, sem zoom, parallax de fotografia ou ampliação no hover. `object-fit: contain` preserva o enquadramento; em telas estreitas as fotografias das seções são reorganizadas abaixo do conteúdo. Manrope é servida localmente; licença em `assets/automotiva/OFL-Manrope.txt`. Os assets antigos foram preservados, mas não são carregados na página nova.

## Verificação

Inicie o servidor e, em outro terminal deste ambiente isolado:

```sh
chromium --headless --no-sandbox --disable-gpu --remote-debugging-address=127.0.0.1 --remote-debugging-port=9222 --user-data-dir=/tmp/ghc-chrome --blink-settings=primaryHoverType=2,availableHoverTypes=2,primaryPointerType=4,availablePointerTypes=4 about:blank
npm test
```

A suíte usa o WebSocket nativo do Node 24 e o protocolo DevTools. Verifica oito viewports, ausência de overflow, carregamento das imagens, contain, ausência de escala, menu e Escape, seleção de interesse/profissional, validação e preservação dos dados, revisão honesta, geração de URL do WhatsApp sem acesso externo, movimento reduzido e conteúdo sem JavaScript. Capturas em `/tmp/ghc-checks/`, substituível por `SCREENSHOT_DIR`; `TEST_URL` configura o destino. Inspecione as imagens além dos checks automáticos. Não substitui teste com leitor de tela ou aparelho físico.

## Exportação

```sh
npm run export -- /tmp/G-Hot-e-Cold.html
```

Produz HTML independente com fonte, estilos, scripts e imagens incorporados.

## Publicação da G Hot e Cold

Código-fonte na branch `g-hot-e-cold`. O site é publicado em `https://miguelfrotagem-gif.github.io/site-andre/g-hot-e-cold/`, em uma subpasta da branch `gh-pages`. A raiz dessa branch contém outro projeto e deve ser preservada. Não substitua a raiz do Pages nem a branch `main` ao atualizar este site.

Antes de publicar, execute lint, build e a suíte de navegador. Copie para `g-hot-e-cold/` o HTML, CSS, scripts, `assets/ghc/`, a fonte Manrope e sua licença. Use versões de conteúdo nas URLs do CSS e dos scripts para evitar cache antigo.

A abertura e superfícies usam grafite neutro; o azul-gelo continua como destaque da marca, com fotografias sem filtros de cor e contato com opacidade integral para preservar a iluminação âmbar.

## SEO e Google Search Console

SEO local para ar-condicionado e refrigeração em São Paulo, com conteúdo visível dos serviços confirmados, canonical, compartilhamento social, dados estruturados e sitemap. Execute `npm run check:seo`. A configuração de propriedade, verificação e envio do sitemap está documentada em [SEARCH-CONSOLE.md](SEARCH-CONSOLE.md). A verificação ainda depende da tag pública da conta Google do responsável; nenhuma posição nas buscas é garantida.
