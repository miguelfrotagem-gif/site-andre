# GJ Ar Condicionado

Site responsivo em HTML, CSS e JavaScript nativos. Sem dependências de produção ou instalação de pacotes. Requer Node.js 18+ (validado com Node.js 24).

## Executar

```sh
cd /workspace/site-andre
npm run dev
```

O servidor usa a porta 3000, configurável com `PORT`. `npm start` executa o mesmo servidor.

## Validar e publicar os arquivos

```sh
npm run lint
npm run build
```

O build gera `dist/`, pronto para hospedagem estática. Para conferir o build localmente: `SERVE_DIST=1 PORT=3001 npm start`.

`npm test` executa testes funcionais em um Chromium com depuração remota na porta 9222, com o site já rodando na porta 3000. Preparação em outro terminal:

```sh
chromium --headless --no-sandbox --disable-gpu --remote-debugging-port=9222 --user-data-dir=/tmp/gj-chrome about:blank
```

Use esse comando apenas em um ambiente isolado. `TEST_URL` permite testar outro endereço. A suíte verifica cinco larguras, imagens, âncoras, menu mobile, Escape, ausência do formulário removido, mensagens de WhatsApp e movimento reduzido. Capturas de desktop e celular são gravadas em `/tmp/gj-1440.png` e `/tmp/gj-390.png`.

## Conteúdo e arquivos

- `index.html`: seções e metadados.
- `styles.css`: identidade visual, layouts e animações.
- `app.js`: menu, animações por scroll, navegação e WhatsApp.
- `assets/`: fotografias ilustrativas originais geradas para o site, otimizadas em WebP (aproximadamente 276 KB no total). `servicos.webp` é uma composição de quatro fotos, enquadradas individualmente por CSS; não é uma captura de referência.
- `references/`: quatro capturas e o texto extraídos do ZIP do usuário; não são carregados pelo site.
- `scripts/`: servidor local, build estático e testes de navegador.

Os botões abrem o WhatsApp diretamente com mensagens específicas para cada serviço. O formulário foi removido a pedido do usuário. Não existe backend. Todas as conversas usam `https://wa.me/556193995799`.

## Marca e abertura

O emblema enviado pelo usuário foi preparado como recorte transparente em `assets/logo-gj.webp` para uso no cabeçalho, rodapé e abertura. A abertura dura até 2,9 segundos, permite pular, aparece uma vez por sessão e é desativada com `prefers-reduced-motion`. Não bloqueia a navegação por teclado. O emblema foi isolado com ferramenta de edição de imagem a partir da imagem fornecida.

Os dados da empresa foram mantidos conforme fornecidos, inclusive o número de WhatsApp e o endereço. As fotos são ilustrativas e não apresentam uma equipe ou frota real da GJ.
