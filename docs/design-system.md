# Design system — Apoio na Rede

A referência visual foi adaptada ao contexto de acessibilidade urbana: fundo escuro, superfícies grafite, destaque verde-turquesa da logo, busca arredondada, cartões de categorias e navegação inferior no celular. Textos, locais e ações pertencem ao app; a ilustração da abertura é vetorial e decorativa.

## Tokens

Definidos em `src/styles/design-system.css`:

| Token | Valor | Uso |
| --- | --- | --- |
| `--ds-background` | `#101111` | Fundo da aplicação |
| `--ds-surface` | `#1b1c1c` | Cartões e painéis |
| `--ds-raised` | `#242525` | Controles e superfícies elevadas |
| `--ds-border` | `#363737` | Bordas discretas |
| `--ds-text` | `#f5f3ed` | Texto principal |
| `--ds-muted` | `#b5b6b2` | Texto de apoio |
| `--ds-accent` | `#16bea8` | Ações, seleção e destaques |
| `--ds-accent-ink` | `#022f30` | Texto sobre verde-turquesa da logo |
| `--ds-radius` | `20px` | Cartões principais |

Tipografia: Manrope. Tamanhos de texto em rem permitem respeitar a escala de fonte existente. Lexend continua disponível no modo de leitura facilitada. Classes antigas de superfície são traduzidas pelo tema para preservar formulários, painéis e detalhes já existentes.

## Componentes

### Descoberta centrada nos estabelecimentos

O catálogo mostra um cartão por resultado, com foto e duas ações: “Como chegar” abre o Google Maps e “Acessibilidade” expande os recursos dentro do cartão. Selecionar uma sugestão concentra a lista no resultado escolhido, sem repetir destaques ou painéis. Os estabelecimentos cadastrados aparecem antes dos resultados externos. Atendimento em Libras integra o resumo; ausência de informação continua como “Não verificado”.

Os cartões usam a foto cadastrada ou a primeira foto retornada pelo Google Places, com os créditos dos autores. Fotos ausentes ou indisponíveis mostram “Foto não disponível”. Endereços sem um estabelecimento identificado não recebem fotos de outros locais.

### Imagens externas

Atualização: o catálogo usa imagens estáticas da Street View Static API. `StreetViewCatalog` ordena candidatos pela distância da localização e exibe até cinco sugestões iniciais cuja imagem foi carregada com sucesso. Consultas sem cobertura não geram cartões vazios. A busca mantém os filtros e também verifica a imagem antes de exibir cada cartão. Sem localização autorizada, a referência é o centro de Cataguases; a área atendida continua sendo Cataguases.

A chave precisa autorizar a **Street View Static API**, com a API ativada e faturamento configurado no projeto Google Cloud. Na consulta real desta implementação, o Google respondeu `REQUEST_DENIED`: API não ativada. A ativação é necessária para as imagens reais aparecerem. Não é possível garantir cinco imagens onde não há cobertura; imagens externas também não garantem fachada exata ou atual.

`PlaceExterior` exibe somente fotos estáticas, priorizando a foto cadastrada ou recebida na busca. Na ausência ou falha da imagem, consulta os detalhes do Google Places pelo identificador do estabelecimento e preserva os créditos dos autores. Se uma foto falhar, tenta a próxima; falhas de consulta oferecem nova tentativa. Não há Street View nos cartões. As imagens do Google e seus endereços não são persistidos em armazenamento local.

O Google não classifica essas fotos como fachada. Para garantir uma foto da frente, o cadastro deve usar uma foto própria revisada do estabelecimento. O carregamento das fotos e os créditos são verificados com serviços simulados em `tests/browser-exterior.mjs`.

“Como chegar” abre o Google Maps em uma nova aba, com coordenadas e identificador do local quando disponível. O catálogo exibe somente cartões sugeridos ou buscados, sem mapa interno nem alternância de visualização.

- `Navbar`: “Catálogo” no desktop e no celular direciona aos cartões. A barra inferior mantém Início, Buscar, Catálogo, Cadastrar e Ajustes.
- `ExplorerHero`: apresentação com mapa vetorial decorativo, sem downloads de imagens ou chamadas de API adicionais.
- `ExploreCategories`: faixa de orientação e nove categorias com ícones, seleção e botão para limpar a categoria.
- `PlaceDiscoveryCards`: locais reais já carregados pelo serviço atual, sem avaliações, fotos ou informações de acessibilidade inventadas.
- Busca: campo arredondado, filtro expansível e entrada por voz. Sugestões e teclado preservados.

## Responsividade e acessibilidade

- Desktop a partir de 1024px: cabeçalho horizontal, abertura em duas colunas, nove categorias e quatro cartões por linha.
- Tablet: navegação inferior, categorias em grade e dois cartões por linha.
- Celular até 600px: abertura compacta, categorias com rolagem horizontal e cartões de resultado empilhados.
- A barra inferior respeita `safe-area-inset-bottom`; os controles flutuantes ficam acima dela. VLibras não sobrepõe painéis abertos.
- Link para pular ao conteúdo, foco visível, rótulos, estado de seleção e alvos de navegação preservados.
- Alto contraste e amarelo/preto têm precedência sobre o tema. Redução de movimento e estímulos permanece disponível.

Para conferir: abra o site em desktop e celular, alterne filtros e categorias, selecione um local e teste cadastro, preferências, fonte ampliada e modos de contraste.
