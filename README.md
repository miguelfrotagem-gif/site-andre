# Estética Automotiva

Landing page responsiva em HTML, CSS e JavaScript nativos, implementada com a skill **CodeMakers-Design v2.1.0**, instalada em `.agents/skills/codemakers-design`. A skill é local ao projeto e seu `SKILL.md` pode ser consultado nas próximas tarefas. Sem dependências npm, backend ou envio simulado de mensagens.

## Executar e gerar

Requer Node.js 24 (a suíte usa WebSocket nativo). Na pasta `/workspace/site-andre`:

```sh
npm run dev
npm run lint
npm run build
```

Servidor na porta 3000, configurável com `PORT`. `npm start` é equivalente. O build estático fica em `dist/`; para conferir: `SERVE_DIST=1 PORT=3001 npm start`. Nenhuma publicação externa é feita por esses comandos.

## Contato pendente

O responsável informou que ainda não há número de WhatsApp. Preencha `window.AUTO_CONFIG.whatsapp` em `config.js` quando houver um número confirmado, incluindo DDI. O número da antiga empresa de ar-condicionado não é usado nesta página. Enquanto a configuração estiver vazia, os CTAs levam ao contato, que explica a pendência, e “Saiba mais” registra o serviço selecionado. Depois da configuração, os botões abrem o WhatsApp com a mensagem do serviço. O site não envia mensagens automaticamente.

Não foram inventados endereço, telefone, preços, avaliações ou estatísticas.

## Direção e enquadramento

Cinco seções seguem os mockups fornecidos: início, serviços, sobre, processo e contato. As referências originais estão em `referencias/`, sem alterações. São documentos de design; nunca são carregadas como páginas ou botões. A fotografia sem textos original está em `assets/automotiva/hero-carro-sem-texto.png` e foi preservada.

Fotografias de trabalho sem textos foram preparadas com edição de imagem a partir dos mockups, em WebP. São imagens ilustrativas, não evidência de instalações ou equipe reais. A hero usa uma foto panorâmica com o veículo inteiro, `object-fit: contain` e um grid que compartilha a altura disponível com o cabeçalho e a copy. No celular e em telas muito baixas a composição cresce naturalmente, sem bloquear rolagem. O CSS recorta apenas cada painel da fotografia de serviços; não mascara overflow da página.

Manrope é servida localmente; fonte obtida do repositório Google Fonts, com licença em `assets/automotiva/OFL-Manrope.txt`. Sem chamadas externas necessárias para renderizar o site.

## Verificação de navegador

Com o servidor iniciado, abra outro terminal, somente neste ambiente isolado:

```sh
chromium --headless --no-sandbox --disable-gpu --remote-debugging-address=127.0.0.1 --remote-debugging-port=9222 --user-data-dir=/tmp/auto-chrome --blink-settings=primaryHoverType=2,availableHoverTypes=2,primaryPointerType=4,availablePointerTypes=4 about:blank
```

Depois execute:

```sh
npm test
```

A suíte verifica 1920×1080, 1440×900, 1366×768, 1280×720, 1024×768, 768×1024, 390×844 e 360×800. Confere limites reais do cabeçalho, textos, CTAs e foto inteira na primeira tela, proporção da imagem, ausência de overflow, menu por teclado e Escape, foco visível, navegação, seleção dos serviços, contato sem telefone, movimento reduzido e conteúdo sem JavaScript. Inclui 320 px e landscape baixo. O teste de zoom usa reflow equivalente a 200% (720×450 CSS px para uma janela física de 1440×900); não substitui teste manual em todos os navegadores nem teste com leitor de tela.

Capturas da execução ficam em `/tmp/estetica-checks/`. `TEST_URL` e `SCREENSHOT_DIR` permitem substituir URL e diretório. Revisão visual deve abrir as capturas, não apenas gerá-las.

## HTML independente

```sh
npm run export -- /tmp/Estetica-Automotiva.html
```

Incorpora estilos, JavaScript, imagens usadas e fonte em um único HTML. Não inclui os PNGs documentais nem instala dependências. Os assets antigos da GJ foram preservados no repositório, mas não são carregados pelo novo site.

## Movimento e acabamento

A entrada da hero termina em 940 ms: cabeçalho em 350 ms, título, subtítulo e ações escalonados, fotografia com 14 px de deslocamento máximo. A luz ambiente ocupa uma camada separada, com bordas suaves. O carro responde ao mouse em até 4 px na horizontal e 2 px na vertical; no desktop, a foto de Sobre tem 12 px de parallax vertical no total, com margem de segurança. Mobile não usa parallax.

Títulos, descrições, fotos e cards têm revelação única por IntersectionObserver. Os cards usam intervalos de 100 ms no desktop, hover de 5 px e zoom de até 1,03 dentro da área fotográfica; foco por teclado recebe o mesmo destaque. O processo sincroniza linhas, números e descrições em 1.030 ms, com conectores adaptados às duas colunas do celular e um reflexo localizado no capô. Menu, botões e contato têm transições curtas.

O botão “Pausar animações” no rodapé interrompe os efeitos; `prefers-reduced-motion` desativa movimentos e reage também a mudanças durante a sessão. A luz pausa fora da hero e quando a aba fica oculta. O parallax usa requestAnimationFrame somente quando há eventos e a seção está visível. O conteúdo permanece visível se as animações ou o JavaScript falharem. Nenhuma biblioteca foi adicionada e os arquivos de imagem, textos comerciais, ordem das seções e contato foram preservados.

`npm test` inclui observação quadro a quadro da entrada em cinco viewports, limites do parallax, escalonamento dos cards, hover e foco, duração do processo, pausa, preferência dinâmica por movimento reduzido e medição local de layout shift. Os flags `--blink-settings` do Chromium acima emulam mouse/hover no headless, que nesta máquina não os anuncia por padrão. São configuração de teste, sem mudanças na detecção de dispositivos do site. Capturas dos estados de animação ficam em `/tmp/estetica-checks/`. Esses testes locais não medem fluidez em um aparelho físico nem desempenho de produção.
