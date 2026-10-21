# Google Search Console — G Hot e Cold

Endereço principal: https://arcondicionadoegeladeira1.vercel.app/

O responsável forneceu o arquivo público de verificação do Google. Ele foi incluído no projeto e na lista de arquivos copiados para `dist/`. A confirmação da propriedade ainda precisa ser feita pelo responsável no Search Console. Não há sessão da conta Google nem acesso à gestão de deployments da Vercel disponíveis nesta conversa.

## Publicar na Vercel

O código está no GitHub, branch `g-hot-e-cold` do repositório `miguelfrotagem-gif/site-andre`. Na Vercel, o projeto desse domínio deve usar essa branch como Production Branch e este diretório como raiz. `vercel.json` define o build `npm run build` e a pasta de saída `dist`.

Depois do push, aguarde um deployment de produção com status Ready. Se não houver deploy automático, confira a integração Git e a Production Branch e publique o commit mais recente da branch `g-hot-e-cold`. Não altere o outro site da branch `main`.

## Verificar a propriedade

1. Abra https://arcondicionadoegeladeira1.vercel.app/google0fb09980fc195192.html
2. A página deve retornar status 200 e mostrar exatamente `google-site-verification: google0fb09980fc195192.html`.
3. Volte à janela de verificação do Google, que deve mostrar a propriedade `https://arcondicionadoegeladeira1.vercel.app/`, e clique em **Verificar**.
4. Mantenha esse arquivo nas publicações futuras, inclusive depois da verificação bem-sucedida.

Se o endereço do arquivo mostrar 404, outra página ou proteção por login, a Vercel ainda não está servindo o novo build publicamente. Corrija a publicação antes de tentar verificar novamente. Um push no GitHub não confirma, por si só, que a Vercel publicou o site.

## Sitemap e indexação

Depois de verificar a propriedade, em **Sitemaps**, envie:

```
https://arcondicionadoegeladeira1.vercel.app/sitemap.xml
```

Em **Inspeção de URL**, inspecione `https://arcondicionadoegeladeira1.vercel.app/`, execute o teste ao vivo e solicite indexação. Canonical, compartilhamento e dados estruturados usam o mesmo endereço. `robots.txt` é publicado na raiz da Vercel e aponta para o sitemap.

O rastreamento e o posicionamento dependem do Google. Verificação e envio do sitemap não garantem indexação imediata ou primeira posição.

## Conteúdo e validação

Os serviços e bairros são confirmados pelo usuário. Não foram criados horários, avaliações, preços ou certificações. O endereço completo não foi acrescentado ao schema porque há divergência entre o CEP inicial e o cartão; são usadas apenas cidade, estado e país confirmados.

```sh
npm run check:seo
npm run build
SEO_ROOT=dist npm run check:seo
```

Preserve o site existente na raiz da branch `gh-pages` ao atualizar o espelho da G Hot e Cold. O arquivo nessa subpasta do GitHub Pages não verifica a propriedade da Vercel; a verificação precisa acessar o arquivo no domínio exato informado acima.
