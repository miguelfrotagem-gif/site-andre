# Google Search Console — G Hot e Cold

O SEO e o sitemap podem ser publicados sem acessar uma conta Google. A criação e verificação da propriedade ainda dependem da conta do responsável. Não há conta do Search Console conectada a esta conversa. Nenhuma propriedade foi verificada nem sitemap enviado por esta tarefa.

## Propriedade correta

No https://search.google.com/search-console adicione uma propriedade **Prefixo do URL** exatamente com:

```
https://miguelfrotagem-gif.github.io/site-andre/g-hot-e-cold/
```

Não use o tipo Domínio para `github.io`: o DNS desse domínio é administrado pelo GitHub. O prefixo acima separa este site dos outros projetos da mesma conta.

## Verificação

Escolha **Tag HTML** e copie a tag pública fornecida pelo Google, por exemplo uma tag cujo nome é `google-site-verification`. Envie somente essa tag nesta conversa. Ela será inserida no `<head>` do HTML-fonte e publicada no mesmo endereço. Não envie senha, código de login, cookies ou credenciais Google. Não há código fictício ou placeholder publicado.

Depois que a tag estiver visível no site público, volte ao Search Console e clique em **Verificar**. Mantenha a tag publicada nas próximas atualizações.

## Sitemap e inspeção

Depois de verificar a propriedade, em **Sitemaps** envie:

```
https://miguelfrotagem-gif.github.io/site-andre/g-hot-e-cold/sitemap.xml
```

Em **Inspeção de URL**, inspecione a URL canônica acima, execute o teste ao vivo e solicite indexação. O sitemap contém somente a página real; âncoras como `#contato` não são páginas separadas.

O rastreamento e o posicionamento dependem do Google. Verificar uma propriedade, enviar sitemap e solicitar indexação não garantem indexação imediata nem primeira posição. Acompanhe as consultas e páginas em Desempenho e a cobertura em Indexação.

## Decisões de SEO

- Título e descrição destacam ar-condicionado em São Paulo; conteúdo visível apresenta os serviços confirmados no cartão e os bairros fornecidos.
- URL canônica única, metadados de compartilhamento e dados estruturados `HVACBusiness`, `WebSite` e `WebPage`.
- Telefones e regiões nos dados estruturados correspondem ao conteúdo visível. Não foram criados horários, avaliações, preços, certificações ou promessas de atendimento.
- Não foi acrescentado endereço completo ao schema: o CEP do cartão diverge do CEP fornecido anteriormente. Localidade e estado confirmados são suficientes para a descrição geográfica, mas não garantem elegibilidade a resultados enriquecidos de empresa local.
- Neste GitHub Pages de projeto não controlamos o `/robots.txt` da raiz do domínio `miguelfrotagem-gif.github.io`. Um robots.txt em subpasta não controla o rastreamento. Usamos meta robots e envio direto do sitemap. O rastreamento real deve ser conferido no teste ao vivo do Search Console.
- Não foram criadas páginas repetidas por bairro nem palavras-chave ocultas.

## Validar antes de publicar

```sh
npm run check:seo
npm run build
SEO_ROOT=dist npm run check:seo
```

O build deve copiar `sitemap.xml`. Na publicação, preservar o restante da branch `gh-pages` e copiar o sitemap para a subpasta `g-hot-e-cold/`. Caso seja adicionada a tag de verificação, executar novamente as validações e publicar o HTML com a tag intacta.
