# Por baixo da superfície

Experiência integrada entre Serviços e Projetos em `#por-baixo`. O cabeçalho permanece com cinco itens; a seção usa `data-nav-section="servicos"` para manter o contexto da navegação.

## Composição

A fotografia limpa existente (`assets/fs/projeto-estrutura.webp`, 1034×572) conserva sua proporção. O solo é um SVG com camadas orgânicas, texturas vetoriais discretas e uma coluna conceitual de perfuração alinhada à máquina. O dourado é um guia editorial: não há profundidades, categorias de solo, aquíferos, dados de obras ou garantia de água.

A lente de Detalhes mostra um recorte da própria fotografia em resolução suficiente para sua área de exibição; a imagem é vinculada somente ao explorar esse estado. O ativo fotográfico é reaproveitado e o restante usa HTML, SVG, CSS e JavaScript sem dependências. Os estilos estão limitados a `.surface-experience`; o enquadramento da hero não foi alterado.

## Interação

- Estrutura: conjunto do caminhão e perfuratriz, guia sobre a máquina e legenda “Conheça a estrutura que acompanha o trabalho em campo.”.
- Operação: região de contato e percurso vertical representativo, destaque no solo e legenda “Veja uma representação do percurso da perfuração.”.
- Detalhes: região do equipamento, aproximação local e legenda “Observe os detalhes que fazem parte de cada etapa.”.

Os marcadores e tabs sincronizam `aria-pressed`, `aria-selected`, foco e painel. Setas, Home e End operam os tabs. A cena e a área explicativa reservam suas dimensões para não saltar ao trocar de estado. O CTA dourado reutiliza a configuração de WhatsApp e usa Contato como fallback quando não houver número válido.

## Movimento

Título e foto aparecem suavemente quando entram na área útil. O corte e seu guia revelam-se quando a região do solo chega à tela, observando a altura real do cabeçalho. Um contêiner estável é observado: a animação de recorte não altera a própria medição de visibilidade. A sequência termina em aproximadamente 0,9s, não repete ao retornar, termina ao sair da área visível e cede imediatamente à seleção manual. Não há scroll hijacking, pinning ou loops decorativos. Transições de estado duram aproximadamente 300–400ms.

Com movimento reduzido, a cena aparece completa e as seleções continuam funcionais. Sem JavaScript, a ilustração e os três conceitos permanecem disponíveis em texto, sem prometer interação não executada.

## Verificações

A suíte específica percorreu 320×740, 360×800, 390×844, 430×932, 768×1024, 844×390, 1366×768, 1672×941, 1900×650 e 1920×1080. Foram verificados os três focos visuais, guia dourado, marcadores, painel único, dimensões constantes, toque emulado, teclado, CTA, navegação, cabeçalho, interrupção e conclusão da introdução, retorno sem repetição, saída da área visível, redimensionamento e fallback sem scripts. Resultado: 489 verificações passaram, sem exceções do navegador ou assets locais com falha.

A regressão do restante do site passou em 644 verificações, incluindo a hero em janela baixa, menu modal e WhatsApp. A inspeção foi feita no Chromium, com emulação de telas e toque; não equivale a teste físico em todos os dispositivos ou auditoria completa de leitor de tela.

A indicação “Representação ilustrativa.” pertence somente à nova experiência e atende ao pedido atual. A cena apresenta um conceito, sem simular avaliação técnica do terreno do visitante.
