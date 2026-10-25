# Ademicon — prévia demonstrativa

Prévia navegável baseada nas 18 composições aprovadas fornecidas em dois PDFs. Sem dependências npm, backend, cadastro, analytics ou envio de dados. Node.js 24 e Chromium são os únicos pré-requisitos.

## Executar

```sh
cd /workspace/site-andre
npm run dev
```

O servidor usa a porta 3000 (`PORT` altera a porta). O endereço raiz abre a prévia Ademicon. Use o checkout existente: tarefas de nuvem já são isoladas, sem necessidade de worktree.

```sh
npm run lint
npm run build
SERVE_DIST=1 PORT=3001 npm start
```

O build copia a aplicação e os assets para `dist/`; não é uma publicação. Rotas por hash funcionam também em hospedagem estática e sobrevivem à recarga.

## O que está navegável

- Doze cenas principais: Início, Sobre, Consórcios, Como funciona, Diferenciais, Histórias, Comparação, Blog, Dúvidas, Planejamento, Contato e Rodapé.
- Catálogo no mesmo painel: Veículos; Imóveis, páginas 1 e 2; Serviços, páginas 1 e 2; Outros bens móveis. Exemplo direto: `#consorcios/imoveis/2`. Voltar/avançar do navegador preserva o estado da URL. O menu também permite retornar à visão geral.
- CTAs dos produtos abrem planejamento com o produto selecionado. Os campos da hero abrem um simulador demonstrativo, sem cálculo de condições comerciais.
- Planejamento em três etapas, com voltar, editar, revisão e confirmação: “Demonstração concluída. Nenhum dado foi enviado.” As respostas existem somente na memória do diálogo, são descartadas ao fechar e não entram no endereço nem no armazenamento do navegador. Use dados de teste. Limite de texto inicial: 1.000 caracteres Unicode, configurável por `textLimit` em `openPlanning`.
- Vídeos só são incorporados após clique, sem autoplay e com alternativa “Abrir no YouTube”. Os três relatos fornecidos também estão disponíveis pelas setas e pelo painel de histórias; não foram inventados relatos extras.
- Filtros de blog e FAQ abrem painéis contendo apenas os conteúdos existentes. Artigos, EXAME, rota, área do cliente, privacidade e regulamentos usam os destinos exatos de `LINKS_CONTEUDOS.json`.
- Dropdown e diálogos operam por teclado, fecham com Escape e devolvem foco. Há foco visível, conteúdo semântico, entrada breve da marca real e preferência de movimento reduzido.

## Referências e fidelidade

Os ZIPs, PNGs mestres e o manifesto original mencionados nos pedidos não foram anexados. Os dois PDFs recebidos contêm nove imagens cada. Foram extraídas sem renderização ou redimensionamento para `assets/aprovadas/`, em 1672 × 941. `MANIFESTO_EXTRAIDO.json` registra origem, dimensões e SHA-256 dos arquivos extraídos; **não substitui um manifesto de aprovação original**.

Os derivados de cena em `assets/ademicon/` são WebP lossless, conferidos pixel a pixel contra os PNGs. A proporção desktop é exatamente 1672/941, sem `cover`, zoom ou lacunas entre cenas. O conteúdo tem altura natural pela largura; em outros formatos de viewport pode aparecer parte da próxima cena. Os PNGs são o fallback. A hero tem prioridade e as demais imagens carregam progressivamente.

O desktop é a referência aprovada. As únicas correções localizadas nas composições são o estado ativo real da navegação (com os ícones e textos rasterizados originais) e a opção de retornar à visão geral do catálogo. A marca da entrada também é um recorte fiel. Nenhum mestre foi editado.

Mobile até 760 px é uma **adaptação complementar**, com texto e controles HTML legíveis e recortes fotográficos das referências. Não é uma arte mobile aprovada. As capas de histórias continuam identificadas como ilustrativas; consultor e sala não são apresentados como comprovação do interior do endereço.

## Verificar no navegador

Com o servidor ativo, abra Chromium em outra sessão:

```sh
chromium --headless --no-sandbox --disable-gpu \
  --remote-debugging-address=127.0.0.1 --remote-debugging-port=9222 \
  --user-data-dir=/tmp/hensec-chrome about:blank
npm test
```

A suíte usa CDP sem bibliotecas adicionais. Verifica as três dimensões desktop (1672×941, 1440×900, 1366×768), mobile (390×844 e 320×700), proporções, hotspots, 18 estados, categorias, histórico, recarga, diálogos, formulário completo, filtros, links, foco, ausência de transmissão e armazenamento de respostas. Capturas e relatório ficam em `/tmp/ademicon-checks`. O valor `TEST_URL` permite apontar para o servidor do build.

Os 13 destinos externos foram tentados com verificação TLS normal. O proxy do ambiente respondeu `403 Forbidden` ao túnel para todos eles, antes de alcançar os sites. Portanto, os endereços e comportamentos locais foram conferidos, mas a disponibilidade do conteúdo e a incorporação de vídeos **não puderam ser validadas nesta rede**. Nenhuma política de acesso foi alterada. Os domínios dos destinos são `www.youtube.com`, `www.youtube-nocookie.com` (player), `www.ademicon.com.br`, `exame.com` e `www.google.com`.

## Projeto anterior preservado

O site HENSEC permanece em `hensec.html`, com `styles.css`, `app.js`, `config.js`, assets e testes originais. Sua documentação está em `README-HENSEC.md`. Para servir a versão anterior na raiz e executar sua suíte:

```sh
SITE=hensec PORT=3002 npm start
TEST_URL=http://127.0.0.1:3002 npm run test:hensec
```

`npm run export` continua produzindo o HTML independente **HENSEC**, usando `hensec.html`. A prévia Ademicon é distribuída pela pasta `dist/` completa.

## Fora desta etapa

Não há CRM, scoring, cálculo comercial, promessa de contemplação, WhatsApp da unidade, contas conectadas, coleta real de leads ou envio de formulário. Esses recursos precisam de definições e integrações futuras. A publicação estática não habilita nenhuma integração.

## GitHub Pages

A publicação usa a branch `gh-pages`, na raiz. A prévia Ademicon fica em https://miguelfrotagem-gif.github.io/site-andre/ e o HENSEC preservado em https://miguelfrotagem-gif.github.io/site-andre/hensec.html . O código-fonte fica em `main`. Publicar requer autorização explícita; `npm run build` apenas prepara `dist/`. Ao atualizar `gh-pages`, preserve os outros projetos existentes na branch, `.nojekyll` e um eventual `CNAME`.

### Paleta HENSEG

`palette.css` centraliza o tema claro: branco acinzentado (#f1f2f3), superfícies cinza, texto grafite e ações em preto. A folha é carregada após os estilos de layout no site e nas políticas, incluída no build com versão de cache e incorporada na exportação. Equipamentos preservam suas fotos originais; o botão flutuante do WhatsApp permanece verde. A fotografia do contato usa apresentação em tons de cinza com véu claro para manter a leitura.
