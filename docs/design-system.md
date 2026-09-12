# Design system — Apoio na Rede

A referência visual foi adaptada ao contexto de acessibilidade urbana: fundo escuro, superfícies grafite, destaque verde-turquesa da logo, busca arredondada, cartões de categorias e navegação inferior no celular. Textos, locais e ações pertencem ao app; a ilustração da abertura é vetorial e decorativa.

## Tokens

Definidos em `src/design-system.css`:

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

- `Navbar`: navegação superior no desktop; barra inferior com Início, Buscar, Mapa, Cadastrar e Preferências no mobile/tablet. Todas as ações usam os fluxos existentes.
- `ExplorerHero`: apresentação com mapa vetorial decorativo, sem downloads de imagens ou chamadas de API adicionais.
- `ExploreCategories`: faixa de orientação e nove categorias com ícones, seleção e botão para limpar a categoria.
- `PlaceDiscoveryCards`: locais reais já carregados pelo serviço atual, sem avaliações, fotos ou informações de acessibilidade inventadas.
- Busca: campo arredondado, filtro expansível e entrada por voz. Sugestões e teclado preservados.
- Mapa: esquema escuro do Google Maps; controles e balões mantêm a paleta nativa para legibilidade.

## Responsividade e acessibilidade

- Desktop a partir de 1024px: cabeçalho horizontal, abertura em duas colunas, nove categorias e quatro cartões por linha.
- Tablet: navegação inferior, categorias em grade e dois cartões por linha.
- Celular até 600px: abertura compacta, categorias e cartões com rolagem horizontal apenas dentro das respectivas listas, mapa e painel empilhados.
- A barra inferior respeita `safe-area-inset-bottom`; os controles flutuantes ficam acima dela. VLibras não sobrepõe painéis abertos.
- Link para pular ao conteúdo, foco visível, rótulos, estado de seleção e alvos de navegação preservados.
- Alto contraste e amarelo/preto têm precedência sobre o tema. Redução de movimento e estímulos permanece disponível.

Para conferir: abra o site em desktop e celular, alterne filtros e categorias, selecione um local e teste cadastro, preferências, fonte ampliada e modos de contraste.
