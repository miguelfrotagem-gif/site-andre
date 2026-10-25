# Composição mobile HENSEG

Referência: `KIT_HENSEG_MOBILE_CODEX.zip`, PDF com 12 composições e PNGs de referência de 390 × 844 pontos. As páginas de referência não são publicadas como imagens do site.

`mobile.css` e `mobile.js` complementam o HTML semântico em `hensec.html`. As mesmas seções agora atendem o desktop, conforme o PDF desktop atualizado. O breakpoint mobile é até 767 px, incluindo orientação horizontal até 1023 px quando a altura é de até 500 px. A árvore de seções e o formulário são compartilhados; somente frases e links de navegação específicos mudam por breakpoint. Um único cabeçalho compartilhado e um único botão flutuante são usados.

Ordem: início, lista de soluções, alarmes, câmeras, cerca elétrica, interfonia, facial, sobre, quatro etapas, dúvidas, contato, rodapé. Os cinco links comerciais no menu seguem a mesma ordem. Biometria e fechaduras permanecem complementares.

As quatro fotos já existentes de alarme, câmera, interfonia e facial são idênticas, por SHA-256, às fornecidas neste kit. A central de cerca foi copiada do kit sem alteração. O nome de modelo no arquivo de origem não é anunciado como produto comercializado. Sua legenda a identifica como referência visual de categoria; modelos e configuração dependem de avaliação. A imagem de arquitetura é um recorte da região fotográfica esquerda do mockup fornecido (90, 300, 872, 894), sem interface, textos ou o equipamento no teto. É identificada como ambientação, sem atribuição de instalação à HENSEG. Não foram gerados novos equipamentos.

As fotos de produtos usam `contain`, proporção original e limites de resolução. As seções têm altura natural e não têm rolagem interna ou cenas sticky. Revelações de texto e foto usam o observador existente, com fallback visível e respeito a movimento reduzido.

O formulário compartilhado tem labels, validação nativa e validação de nome/telefone. Prepara nome, telefone e tipo de ambiente (e descrição opcional do desktop, se preenchida) em uma mensagem para `wa.me/5511945549849`, aberta somente após ação do visitante. Não envia automaticamente, não limpa os campos e não salva dados pessoais no armazenamento local. A política de privacidade foi atualizada para descrever esse fluxo. Os únicos dados gravados pelo site continuam sendo a preferência de privacidade, quando confirmada.

O scrollspy agrupa as seções no desktop e identifica as categorias individualmente no mobile; as âncoras canônicas são iguais nos dois formatos. O menu fecha ao selecionar uma seção, transfere o foco sem deslocamento inesperado e suporta Escape e teclado. O botão flutuante se oculta quando coincidir com campos, CTAs, links de solução, dúvidas, rodapé, menu aberto ou aviso de privacidade.

Validação: `npm run test:mobile` cobre 360, 375, 390, 414 e 430 px, altura de 568 px, orientação horizontal em 740 × 360 e 844 × 390, largura extra de 320 px, texto a 150%, menu, foco, FAQ por teclado, todos os destinos, validação de campos e mensagem de WhatsApp, ausência de envio automático e sobreposições. Capturas em `/tmp/henseg-mobile-checks`. `npm run test:hensec` mantém a regressão desktop, galeria, tecnologias, políticas e privacidade. `npm run test:navigation` valida rolagem suave e interrupção no desktop; a suíte mobile cobre os mesmos fluxos na nova composição. Build e exportação incluem os novos recursos, com cache por conteúdo e exportação incorporada.
