# Desktop HENSEG — referência atualizada

Referência principal: `HENSEG_REFERENCIA_DESKTOP_ATUALIZADA.pdf`, 11 páginas, fornecido separadamente pelo usuário. O ZIP desktop não pôde ser transferido por ultrapassar 32 MiB; o PDF completo foi transferido e inspecionado. Os produtos e a arquitetura correspondentes já estavam disponíveis nos kits anteriores, portanto não há pendência de imagem para esta implementação.

A página foi reconstruída com as mesmas seções semânticas do mobile, sem duplicar o site ou publicar páginas do PDF como imagens. `desktop.css` organiza hero e produtos com texto à esquerda/fotografia à direita, cinco cards de soluções, fotografia à esquerda no Sobre, quatro etapas em ordem, FAQ em duas colunas e formulário à direita no Contato. O rodapé reúne navegação, privacidade, cookies e identificação real.

A ordem é alarme, câmera, cerca, interfone e facial nos cards, links e seções. O desktop agrupa as seções de produto no item Tecnologias do cabeçalho; o mobile preserva os cinco links comerciais individuais. O mesmo scrollspy é responsável pelo destaque em ambos os formatos. Biometria e fechadura permanecem opcionais depois do facial, com suas fotos originais.

A hero mantém a frase desktop “A segurança evoluiu. O seu acesso também.”; no mobile permanece “Sua proteção também.” O texto desktop contempla as cinco prioridades atuais. Fotos e CTAs são elementos independentes, sem textos duplicados de mockups. O fundo usa apenas o recorte fotográfico limpo do kit anterior; sem interfaces, texto ou dispositivo no teto. No Sobre, a legenda identifica ambientação.

As diferenças intencionais em relação a pequenos detalhes dos mockups preservam os materiais reais: fotos pequenas de alarmes e interfonia não são ampliadas além da resolução original; nenhum código de produto, recurso, avaliação ou instalação foi inferido. A central é apresentada como referência de categoria. O fluxograma explicita 01 → 02 → 03 → 04, sem seta de 02 para 04.

Seções com conteúdo compatível cabem na proporção 1672 × 941. Grades se reorganizam em telas menores e seções/formulários crescem em telas baixas, sem esconder conteúdo. Não há escalonamento global, rolagem interna de produtos, scroll-snap ou carrossel automático. As animações não impedem a leitura e respeitam movimento reduzido.

O formulário compartilhado valida nome, telefone e ambiente, acrescentando a descrição opcional ao texto de WhatsApp no desktop. Campos são preservados, não há simulação de envio nem armazenamento pessoal. O número é lido da configuração existente. FAQ usa details/summary, estado aria-expanded sincronizado e teclado nativo. Cookies usam o gerenciamento já existente.

Validação visual: screenshots da aplicação renderizada comparados às 11 composições do PDF. Validação automatizada: `npm run test:hensec`, `npm run test:mobile`, `npm run test:navigation`, `npm run lint` e `npm run build`. O teste desktop verifica a área segura dos elementos essenciais em 1672 × 941, todos os destinos e dimensões solicitadas, limites das fotos, conteúdo real, formulário, preferências e políticas. As capturas ficam em `/tmp/henseg-desktop-checks`.
