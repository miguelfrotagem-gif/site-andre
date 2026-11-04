# FS Perfuração

Site estático em português, sem dependências npm ou backend. Node.js 24 executa o servidor, build e testes. A entrada principal contém as cinco seções do kit aprovado: Início, Sobre nós, Serviços, Projetos e Contato com rodapé integrado.

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

`TEST_URL` e `CDP_URL` permitem outros endereços. A suíte FS verifica as nove dimensões solicitadas, seções, carregamento de fontes e imagens, ausência de overflow, menu mobile por teclado, scrollspy durante transições e no rodapé, galeria ampliada com Escape e retorno do foco, CTAs sem telefone inventado, movimento reduzido e conteúdo visível sem JavaScript. Capturas e relatório da execução ficam em `/tmp/fs-checks/`.

## Validação realizada

Lint e build concluídos. A rodada final sobre `dist/` passou em **183 verificações FS**, nas dimensões 1672×941, 1920×1080, 1440×900, 1366×768, 768×1024, 360×800, 390×844, 430×932 e 320×800. Capturas foram comparadas visualmente com as referências, com inspeção adicional de menu, fotos ampliadas e composição mobile. O relatório não registrou exceções de JavaScript ou falhas de assets locais. Os pares opacos principais de contraste passaram em 4,5:1; isso não equivale a uma auditoria completa de acessibilidade ou teste de leitor de tela.

A suíte Ademicon preservada passou nas **116 verificações**. As rotas de FS, Ademicon e HENSEC responderam HTTP 200 no build. As suítes específicas HENSEC não foram reexecutadas nesta implementação.

## WhatsApp pendente

Configure **somente o número real confirmado da FS** em `fs/config.js`, no campo `WHATSAPP_PHONE`, com DDI e DDD. O kit não fornece telefone. Os números dos projetos HENSEC e Ademicon não foram reaproveitados por pertencerem a outras empresas. Enquanto vazio ou inválido, todos os CTAs de orçamento levam a `#contato`. Não há simulação de envio, formulário, mapa, CRM ou captura de dados. A mensagem é codificada com `encodeURIComponent`.

## Referências e mídia

Base: `FS_PERFURACAO.zip`, PDF `fs-perfuracao-leve.pdf` (cinco páginas) e as cinco imagens desktop 1672 × 941. Textos, botões, ícones, cabeçalho, bordas e legendas são elementos HTML/SVG/CSS. Nenhuma seção é renderizada como screenshot.

As áreas fotográficas foram limpas com edição de imagem para retirar a interface gravada e depois extraídas em WebP. A limpeza recompõe as regiões removidas e pode introduzir pequenas diferenças visuais; não se trata de reprodução fotográfica pixel a pixel. Os objetos e as composições de referência orientam o enquadramento. A imagem de Contato usa somente a região fotográfica anterior ao rodapé original. As variantes mobile retiram espaço vazio lateral e preservam os sujeitos da cena. `docs/fs-assets.json` registra origens, recortes e hashes dos assets finais.

A marca original foi preservada em `assets/fs/logo-original.png`. O fundo cinza conectado às bordas foi removido para transparência sem redesenhar o brasão; a versão de exibição é `logo.webp`. A fonte Montserrat é servida localmente, com licença em `assets/fs/OFL-Montserrat.txt`.

As cenas e pessoas são ilustrativas; a galeria mantém essa identificação. Não foram adicionados depoimentos, obras reais, métricas, endereço ou serviços além dos três fornecidos. O cabeçalho único aparece na hero e não é fixo, evitando sobreposição dos títulos. O menu mobile funciona com JavaScript; sem JavaScript, seus links ficam visíveis e o conteúdo permanece acessível.

## Projetos anteriores preservados

- Ademicon: `ademicon.html`, código em `ademicon/`, documentação em `README-ADEMICON.md`.
- HENSEC: `hensec.html`, documentação em `README-HENSEC.md`.

Para usar a suíte original Ademicon com seus caminhos por hash, execute outro servidor com `SITE=ademicon PORT=3002 npm start` e rode `TEST_URL=http://127.0.0.1:3002 npm run test:ademicon` com Chromium ativo. Os scripts HENSEC existentes continuam disponíveis.

## Publicação no GitHub Pages

Endereço principal: https://miguelfrotagem-gif.github.io/site-andre/ . A FS Perfuração ocupa a raiz; os projetos anteriores ficam em `ademicon.html` e `hensec.html`. O código-fonte é mantido em `main` e a distribuição estática em `gh-pages`.

Para atualizar, gere `dist/` e aplique os arquivos do build sobre a branch `gh-pages` atual, preservando os diretórios dos demais projetos, `.nojekyll` e eventual `CNAME`. Não apague o conteúdo existente da branch. Publicar exige autorização do usuário.
