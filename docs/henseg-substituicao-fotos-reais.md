# Equipamentos — materiais fornecidos no ZIP

## Originais e procedência

Foram recebidos os seis arquivos do pacote `KIT_CODEX_PRODUTOS_SEGURANCA.zip`. As cópias em `assets/hensec/produtos/` são idênticas aos arquivos extraídos: sem retoque, recorte, remoção de fundo, mudança de marca ou geração de imagens. `henseg-provided-products.json` registra as dimensões e o SHA-256 de cada original. O pacote informa que a procedência fotográfica de todos os materiais não foi verificada; o site os identifica como materiais fornecidos, sem afirmar autenticidade fotográfica independente.

A inclusão da fechadura no portfólio foi confirmada pelo usuário após a observação de que ela não deve ser identificada como Intelbras.

## Associação e identificação

| Arquivo | Uso | Identificação publicada |
| --- | --- | --- |
| 01 | Hero, controle de acesso, primeira etapa do scroll e galeria | Controle de acesso facial Intelbras; modelo exato não confirmado. |
| 02 | Solução de alarmes, segunda etapa e galeria | Sistema 8000. Não identificado como AMT 8000 PRO. |
| 03 | Controle de acesso, biometria, ambientes empresariais e galeria | SS 3430 MF BIO, legível no material. A referência antiga SS 3420 MF BIO foi retirada. |
| 04 | Câmeras, quarta etapa, ambiente residencial, sobre e galeria | Câmera Intelbras, modelo não confirmado. Não atribuídos IA, microfone ou recursos noturnos específicos. |
| 05 | Interfonia, contato e galeria | Conjunto com monitores, terminal e acessórios. Não identificado como um modelo único nem XPE 3200 PLUS IP. |
| 06 | Fechaduras e galeria | Fechadura eletrônica; modelo e identificação comercial a confirmar. Não rotulada como Intelbras ou IFR 7000+. |

## Substituições integrais

Hero, soluções, tecnologias, ambientes, sobre, contato e galeria usam os materiais do ZIP. As cenas anteriores com equipamentos incorporados foram substituídas por composições HTML/CSS: nenhum equipamento antigo ficou atrás dos novos. Os nove assets anteriores não são mais referenciados no HTML, CSS ou scripts ativos da HENSEG. Permanecem no histórico/arquivos do projeto, sem carregamento pela página.

A galeria tem seis fontes distintas e miniaturas correspondentes. No desktop, as quatro etapas principais sincronizam a imagem sticky com o texto ativo, com crossfade reversível. Mobile, telas baixas e movimento reduzido apresentam cada material junto ao conteúdo, sem prender uma imagem por várias telas. As fontes são exibidas inteiras com `object-fit: contain`, sem filtros e sem exceder suas dimensões nativas. O modal de ampliação também respeita a resolução original.

`henseg-media-audit.json` registra os recursos efetivamente encontrados no Chromium em 1440×900 e 390×844, com abas residencial e empresarial. Só os seis arquivos fornecidos aparecem como imagens de equipamentos nas seções da página. A logomarca e a identidade HENSEG foram preservadas.

## Pendências

Todas as seis categorias têm material fornecido. Ainda faltam a confirmação dos modelos exatos do terminal facial, da central de alarme, da câmera, dos componentes do kit e da fechadura, além das fichas técnicas para funções específicas.

Para permitir apresentações maiores sem perda de definição, fornecer versões de resolução superior, principalmente do terminal facial (336×667), kit de interfonia (309×339) e fechadura (309×411). A apresentação atual respeita esses limites e não usa upscaling para simular detalhes.
