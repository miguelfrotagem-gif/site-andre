# NEXA SENSE · Protótipo interativo v0.1

Aplicativo de inteligência operacional para bares e restaurantes. **Ambiente de demonstração · Dados simulados.** Os sites FS, HC, Ademicon e HENSEC na raiz do repositório foram preservados; este aplicativo tem dependências e distribuição próprias.

## Executar

Node.js 24 e npm. Use o checkout existente, sem criar worktree: as tarefas de nuvem já são isoladas.

```sh
cd /workspace/site-andre/nexa-sense
npm ci --cache /tmp/nexa-npm-cache --no-audit --no-fund
npm run dev
```

O Vite usa a porta 5173. O build tem caminhos relativos e navegação por hash, permitindo hospedagem estática em um subdiretório sem regras de reescrita. Fontes Inter e ícones são locais; a aplicação não faz requisições externas para funcionar.

```sh
npm run lint
npm test
npm run build
npm run preview
```

A distribuição é gerada em `nexa-sense/dist/`; a prévia usa a porta 4173. Nenhum desses comandos publica a aplicação. O build da raiz continua destinado aos sites existentes e não incorpora automaticamente este aplicativo.

## Fluxo de demonstração

1. A visão geral inicia no cenário **Fila excessiva**, às 20:43, com 9 pessoas na fila, espera de 14 minutos e 18 mesas ocupadas / 4 pendentes.
2. Analise a ocorrência e confirme a execução demonstrativa da ação. O registro é feito às 20:46, sem mudar os indicadores.
3. Inicie o acompanhamento. Avance 15 minutos simulados.
4. Às 21:01, o cenário A apresenta 2 pessoas na fila, 5 minutos de espera e 21 mesas ocupadas / 1 preparada.
5. Em Resultados, compare as medições e altere o ticket ilustrativo. A fórmula é `clientes adicionais estimados × ticket médio + pedidos adicionais estimados`: `7 × 55 + 101 = R$ 486`.
6. Experimente os cenários **Mesas sem preparação** e **Equipe mal distribuída** no laboratório. A troca exige confirmação e substitui a ocorrência atual, sem misturar seus dados.

As sete telas são Visão geral, Mapa do bar, Alertas, Monitoramento, Resultados, Simulador e Configurações. A navegação mobile oferece Início, Alertas, Simulador e Mais.

## Regras e consistência

- A fila dispara alerta **acima** do limite; a espera acima do limite eleva a prioridade. Preparação dispara alerta a partir do limite, inclusive.
- O cenário C sinaliza distribuição quando existem pessoas aguardando e pelo menos 3 mesas preparadas.
- Alertas de fila e espera são unificados. Uma ação coordenada atende à ocorrência e seus alertas associados.
- O mapa tem 22 mesas. O total é fixo nesta versão, com explicação nas configurações. Ocupação e contagens são derivadas das mesas, sem estados paralelos.
- Ajustes manuais no mapa mudam os indicadores atuais e alertas; não reescrevem medições anteriores. O avanço da simulação aplica o mapa final predefinido.
- A tela de resultados compara medições registradas, preservando o resultado mesmo se o mapa for editado depois.
- Sem acompanhamento concluído, resultados operacionais ficam indisponíveis. A hipótese financeira pode ser explorada antes, identificada como tal.
- Todas as mudanças de estado usam um reducer com transições protegidas e idempotentes. O relógio avança apenas pelos controles, nunca pelo tempo real.
- Configurações, cenário atual e histórico da ocorrência ficam no `localStorage`, chave `nexa-sense:v1`. Dados inválidos ou incompatíveis restauram uma demonstração segura. Se o armazenamento estiver bloqueado, a aplicação continua na sessão e informa que não pôde salvar.
- Limpar histórico remove as atividades, preservando medições e preferências. Reiniciar cenários volta ao cenário A, preservando preferências. Restaurar configurações redefine nome, ticket e limites. Todas essas operações pedem confirmação.

## Arquitetura

React + TypeScript + Vite, React Router, componentes próprios, Lucide e SVG para gráficos. CSS com tokens e breakpoints; não foram adicionadas bibliotecas de componentes ou gráficos redundantes.

- `src/types/`: contratos de estabelecimento, mesas, alertas, eventos, ações, medições, estimativas e estado.
- `src/data/scenarios.ts`: cenários, histórico sintético inicial, recomendações e hipóteses financeiras centralizados; provedor exclusivamente simulado com interface substituível.
- `src/domain/`: simulação, regras de alertas, cálculos e validação da persistência. Funções puras testáveis.
- `src/hooks/useSimulation.tsx`: contexto compartilhado e persistência local.
- `src/components/`: layout, gráfico SVG acessível, controles e diálogos nativos com foco contido, Escape e retorno do foco.
- `src/pages/`: sete telas, detalhes de ocorrência e fallback de rota.
- `src/styles.css`: sistema visual, layout responsivo, foco, safe areas e movimento reduzido.

## Testes de navegador

A suíte usa CDP nativo do Node.js, sem Playwright. Inicie Chromium em um processo separado:

```sh
chromium --headless --no-sandbox --disable-gpu \
  --disable-dev-shm-usage --disable-background-networking \
  --disable-component-update --disable-sync \
  --remote-debugging-address=127.0.0.1 --remote-debugging-port=9223 \
  --user-data-dir=/tmp/nexa-test-chrome about:blank
CDP_URL=http://127.0.0.1:9223 npm run test:browser
```

Para testar o build com `npm run preview` ativo:

```sh
CDP_URL=http://127.0.0.1:9223 TEST_URL=http://127.0.0.1:4173 \
  TEST_OUTPUT=/tmp/nexa-sense-dist-checks npm run test:browser
```

A suíte cria um contexto isolado, usa cliques de mouse reais nos controles, exercita os três cenários, confirmações e cancelamento, finanças, mapa, configurações, persistência, estados vazios e teclado. Percorre as oito telas (incluindo detalhe do alerta) em 360, 375, 390, 430, 768, 1024, 1440 e 1920px. Capturas e relatório JSON ficam em `/tmp/nexa-sense-checks/`, ou no diretório definido por `TEST_OUTPUT`. Execute as suítes sequencialmente no navegador compartilhado.

Os testes de domínio cobrem totais, limites, prioridades, transições fora de ordem, ação duplicada, cenários, reinício, cálculos, preferências e armazenamento inválido.

## Limites do protótipo

Sem câmeras, vídeo, identificação, autenticação, backend, caixa, banco, serviços pagos ou dados de pessoas reais. A estimativa financeira é uma hipótese independente da redução da fila, sem atribuição de vendas ou causalidade. Não representa lucro líquido. As configurações e o histórico são locais ao navegador, não sincronizados entre dispositivos. Auditoria em Chromium não equivale a validação em todos os navegadores ou com leitores de tela. A hospedagem usa o subdiretório `nexa-sense/` da branch `gh-pages`, preservando os outros sites.

## Hospedagem no GitHub Pages

Endereço: https://miguelfrotagem-gif.github.io/site-andre/nexa-sense/

O código-fonte fica em `main`, na pasta `nexa-sense/`. A distribuição compilada fica em `gh-pages`, também sob `nexa-sense/`. Para atualizar, execute o build deste aplicativo e publique somente seu conteúdo nesse subdiretório, preservando todos os demais arquivos da branch, `.nojekyll` e eventual `CNAME`. A navegação por hash permite recarregar qualquer tela.
