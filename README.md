# FS Perfuração

Site estático em português, sem dependências npm ou backend. Node.js 24 executa o servidor, build e testes. A entrada principal preserva Início, Sobre nós, Serviços, Projetos e Contato com rodapé integrado. Entre Serviços e Projetos, a experiência interativa “Por baixo da superfície” acrescenta um corte ilustrativo do terreno.

## Executar e verificar

```sh
cd /workspace/site-andre
npm run dev
```

A porta padrão é 3000, configurável por `PORT`. Use o checkout existente; tarefas de nuvem já são isoladas e não precisam de worktree.

```sh
npm run lint
npm run build
```

O build prepara `dist/`, incluindo os projetos preservados, sem publicar. Para conferir a distribuição em outro processo:

```sh
SERVE_DIST=1 PORT=3001 npm start
```

Inicie Chromium em um processo separado para os testes funcionais:

```sh
chromium --headless --no-sandbox --disable-gpu \
  --remote-debugging-address=127.0.0.1 --remote-debugging-port=9222 \
  --user-data-dir=/tmp/fs-chrome about:blank
npm test
```

`TEST_URL` e `CDP_URL` permitem outros endereços. A suíte FS verifica doze dimensões, incluindo mobile horizontal, cabeçalho fixo em todas as seções, âncoras, scrollspy, menu modal, foco contido, retorno do foco, clique fora, bloqueio e restauração da rolagem, cliques rápidos, mudança para desktop, galeria e destinos de WhatsApp. Também verifica fontes, imagens, ausência de overflow, ampliação de texto, movimento reduzido e fallback sem JavaScript. Capturas e relatório ficam em `/tmp/fs-mobile-checks/`.

## Validação realizada

Lint e build concluídos. A regressão do site integrado passou em **644 verificações FS** nas dimensões 320×740, 360×800, 390×844, 430×932, 768×1024, 844×390 (horizontal), 1900×650, 1900×500, 1366×768, 1440×900, 1672×941 e 1920×1080. A suíte abre o menu em cada uma das cinco seções em todas as dimensões compactas. Foram exercitados teclado, foco, Escape, X, clique fora, posição preservada, scroll interno do painel horizontal, último CTA, cliques rápidos e limpeza ao mudar para desktop. A ampliação de conteúdo foi simulada duplicando os tamanhos de títulos e parágrafos por CSS; não equivale a teste em todos os navegadores ou leitor de tela.

A correção de enquadramento mede também o topo real (`scrollY=0`), retorno pelo link Início, limites completos da faixa de valores antes de Sobre, composição desktop na primeira tela e redimensionamento sem recarregar. A hero usa Grid em fluxo normal, reserva global da altura do cabeçalho e limites de fonte que consideram largura e altura. Em 1900×500, cresce naturalmente; em 1900×650, 1366×768, 1440×900, 1672×941 e 1920×1080, a composição completa cabe na primeira tela. Diagnóstico e medidas em [docs/fs-enquadramento.md](docs/fs-enquadramento.md).

As capturas desktop foram conferidas com as referências existentes; o mobile foi revisado segundo o briefing escrito, porque os arquivos mobile citados não estão no ZIP enviado. Os relatórios não registraram exceções de JavaScript ou falhas de assets locais. Os projetos Ademicon e HENSEC não foram alterados nesta atualização; a suíte Ademicon havia passado anteriormente em 116 verificações.

## Por baixo da superfície

Nova experiência entre Serviços e Projetos, sem item adicional no cabeçalho. O scrollspy mantém Serviços ativo durante a exploração. A fotografia já existente se integra a um corte de solo em SVG, sem biblioteca 3D, novos ativos fotográficos ou animação contínua.

Estrutura, Operação e Detalhes possuem marcadores de 48px, controles por teclado com setas/Home/End, indicação do estado ativo e um único painel de explicação. Cada estado altera também o destaque e a linha dourada da cena; Detalhes inclui um recorte ampliado da mesma imagem. A introdução acontece uma vez, acompanha a visibilidade real do corte e cede imediatamente a qualquer escolha. Há reduced motion e fallback textual sem JavaScript.

Execute `npm run test:surface` para a suíte específica (489 verificações em dez dimensões). `npm test` executa a regressão FS e a suíte da experiência. Capturas e relatório específicos ficam em `/tmp/fs-surface-checks/`. Veja [docs/fs-superficie.md](docs/fs-superficie.md) para os estados, acessibilidade e limites da representação.

## WhatsApp

O número confirmado pelo usuário é **+55 98 8831-0153**, centralizado como `559888310153` em `fs/config.js`. Todos os CTAs de orçamento e a ação “Falar no WhatsApp” usam esse destino, com a mensagem codificada por `encodeURIComponent`. O número foi mantido exatamente como fornecido, sem adicionar dígitos. O link foi verificado; a existência da conta e o atendimento no WhatsApp não são simulados nem confirmados pelo teste local.

O build versiona a importação de `fs/config.js` para evitar que uma configuração anterior fique em cache no GitHub Pages. Se o campo ficar vazio ou inválido, os CTAs voltam a `#contato` e a ação externa fica indisponível com aviso. Não há envio automático, formulário ou captura de dados.

## Referências e mídia

O novo `FS_PERFURACAO mobhile.zip` contém as mesmas cinco imagens desktop e o mesmo PDF do kit anterior. Não contém `referencias/mobile`, `referencias/desktop`, PDF mobile ou `06-menu-aberto-mobile.jpg`; por isso, a composição mobile e o painel seguem as especificações escritas, sem alegação de reprodução dessa imagem ausente.

Base: `FS_PERFURACAO.zip`, PDF `fs-perfuracao-leve.pdf` (cinco páginas) e as cinco imagens desktop 1672 × 941. Textos, botões, ícones, cabeçalho, bordas e legendas são elementos HTML/SVG/CSS. Nenhuma seção é renderizada como screenshot.

As áreas fotográficas foram limpas com edição de imagem para retirar a interface gravada e depois extraídas em WebP. A limpeza recompõe as regiões removidas e pode introduzir pequenas diferenças visuais; não se trata de reprodução fotográfica pixel a pixel. Os objetos e as composições de referência orientam o enquadramento. A imagem de Contato usa somente a região fotográfica anterior ao rodapé original. As variantes mobile retiram espaço vazio lateral e preservam os sujeitos da cena. `docs/fs-assets.json` registra origens, recortes e hashes dos assets finais.

A marca original foi preservada em `assets/fs/logo-original.png`. O fundo cinza conectado às bordas foi removido para transparência sem redesenhar o brasão; a versão de exibição é `logo.webp`. A fonte Manrope local é usada no mobile e nos textos; os títulos desktop mantêm Montserrat local, com licença em `assets/fs/OFL-Montserrat.txt`.

As cenas e pessoas são ilustrativas. A pedido do usuário, os avisos visíveis “Imagens ilustrativas” foram removidos; as legendas apenas identificam o conteúdo, sem alegar obras reais. Não foram adicionados depoimentos, obras reais, métricas, endereço ou serviços além dos três fornecidos. O único cabeçalho global permanece fixo até o rodapé. Sua altura alimenta os offsets de âncoras e a altura máxima do painel. O menu compacto entra até 1100px e usa navegação modal com fundo inerte, bloqueio da rolagem e transições reversíveis; em telas baixas o painel rola internamente. Sem JavaScript, a navegação permanece visível em fluxo normal e todo o conteúdo continua acessível.

## Projetos anteriores preservados

- Ademicon: `ademicon.html`, código em `ademicon/`, documentação em `README-ADEMICON.md`.
- HENSEC: `hensec.html`, documentação em `README-HENSEC.md`.

Para usar a suíte original Ademicon com seus caminhos por hash, execute outro servidor com `SITE=ademicon PORT=3002 npm start` e rode `TEST_URL=http://127.0.0.1:3002 npm run test:ademicon` com Chromium ativo. Os scripts HENSEC existentes continuam disponíveis.

## Publicação no GitHub Pages

Endereço principal: https://miguelfrotagem-gif.github.io/site-andre/ . A FS Perfuração ocupa a raiz; os projetos anteriores ficam em `ademicon.html` e `hensec.html`. O código-fonte é mantido em `main` e a distribuição estática em `gh-pages`.

Para atualizar, gere `dist/` e aplique os arquivos do build sobre a branch `gh-pages` atual, preservando os diretórios dos demais projetos, `.nojekyll` e eventual `CNAME`. Não apague o conteúdo existente da branch. Publicar exige autorização do usuário.
