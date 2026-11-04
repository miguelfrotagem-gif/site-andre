# Correção estrutural do enquadramento

## Diagnóstico reproduzido antes da edição

A área útil foi medida com `window.innerWidth` e `window.innerHeight`, sem usar a resolução do monitor. A reprodução verificou o topo com `scrollY=0`, uma rolagem de 320px e o retorno pelo link Início.

Em 1900×650, a regra `font-size:5.28vw` produzia um título de 100,32px; `padding-top:clamp(190px,13vw,320px)` e a proporção `1672/941` mantinham a hero com 1060,88px. No topo, o título começava abaixo do cabeçalho, mas título, ações e valores não cabiam na primeira tela. Após rolar 320px, o título passava atrás do menu fixo, como na captura enviada. O retorno por Início já levava a `scrollY=0`.

Havia também transbordamento real em 1366×768: a próxima seção começava em 760,33px, enquanto a faixa inferior terminava em 767,59px. A proporção preferida da hero não garantia a contenção de todos os descendentes e suas margens. Não foi encontrado `overflow:hidden` na hero; esconder overflow não resolveria a causa.

## Regras corrigidas

- Reserva global em `main`, calculada a partir do topo e da altura medida do único cabeçalho fixo, mais folga compartilhada com as âncoras.
- Cabeçalho desktop limitado também pela altura da janela, incluindo logo, links e CTA.
- Hero sem `aspect-ratio` ou altura fixa. Grid com conteúdo e faixa de valores em linhas normais, mantendo a próxima seção depois de todo o conteúdo.
- Remoção do padding superior dependente apenas de `vw` e das margens negativas usadas para deslocar a faixa inferior.
- Título, parágrafo, controles e espaçamentos com mínimos legíveis e limites dependentes de `svh` e `vw`.
- Foto limpa preservada, usando `object-fit:contain` no desktop, alinhada à direita. A máscara atua apenas na borda decorativa escura; não substitui ou corta cabine, rodas e área da máquina.
- Ordem mobile explícita no Grid: título/descrição/ações, foto e valores. As margens negativas da foto da hero foram substituídas por largura natural e gutters no conteúdo.
- Âncoras, menu modal, WhatsApp verde e galerias preservados.

## Medidas após a correção

Valores arredondados, em CSS px, com `scrollY=0`:

| Área útil | Cabeçalho: final | Título: início | Valores: final | Próxima seção: início |
| --- | ---: | ---: | ---: | ---: |
| 1900×650 | 84 | 153 | 630 | 650 |
| 1366×768 | 98 | 176 | 745 | 768 |
| 1920×1080 | 123 | 221 | 1048 | 1080 |

As mesmas posições foram verificadas após selecionar Início. Conteúdo passando atrás do cabeçalho durante uma rolagem manual continua sendo comportamento normal de uma navegação fixa.

## Verificação executada

Lint, build e 578 verificações funcionais sobre `dist/` passaram em 12 dimensões: 320×740, 360×800, 390×844, 430×932, 768×1024, 844×390, 1900×650, 1900×500, 1366×768, 1440×900, 1672×941 e 1920×1080.

A janela 1900×500 verifica especificamente o crescimento natural quando o conjunto não cabe. O teste também cobre âncoras, histórico, ausência de scroll horizontal, menu modal em cada seção, foco, Escape, clique fora, restauração da rolagem, cliques rápidos, redimensionamento, fotografias, WhatsApp, texto ampliado, movimento reduzido e fallback sem JavaScript. Os testes não registraram exceções de JavaScript ou assets locais com erro.

Capturas de entrega e medidas detalhadas ficam em `/workspace/fs-enquadramento/`; o relatório da suíte fica em `/tmp/fs-mobile-checks/report.json`. A revisão foi realizada em Chromium no ambiente de desenvolvimento, sem alegação de testes físicos em todos os dispositivos.
