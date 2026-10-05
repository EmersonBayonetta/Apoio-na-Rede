# Apoio na Rede

**Saiba se um lugar é acessível para você antes de sair.**

O Apoio na Rede reúne os recursos de acessibilidade dos locais de Cataguases (MG): rampas, banheiros adaptados, atendimento em Libras, áreas de descanso e outros. Ele compara esses recursos com o que cada pessoa precisa e mostra como chegar a pé. As informações são colaborativas e indicam claramente o que foi confirmado, o que não existe e o que ainda não foi verificado.

## Como funciona

1. **Diga do que você precisa.** Em "Minhas necessidades", marque cada recurso como indispensável, desejável ou não necessário. Não é preciso informar diagnóstico, e a escolha fica salva só no seu navegador.
2. **Encontre o local.** Busque por nome, endereço ou categoria. Cada card mostra quantos dos seus requisitos o local atende, e um filtro opcional oculta locais que não atendem um requisito indispensável.
3. **Veja como chegar.** Na página do local, "Calcular rota a pé" mostra distância e tempo a partir da sua localização. "Abrir no Google Maps" abre o trajeto a pé.

## Recursos

- **Explorar:** busca de locais e endereços, categorias, compatibilidade com suas necessidades e página de cada local com recursos, fotos, avaliações e rota a pé.
- **Rotas acessíveis:** relatos da comunidade sobre trechos da cidade (rampas, piso tátil, semáforo sonoro), sempre marcados como relato até serem conferidos.
- **Profissionais:** catálogo de profissionais que atendem pessoas com deficiência, com filtro por necessidade atendida.
- **Cadastrar local:** formulário em etapas com o checklist de recursos baseado na NBR 9050; cada recurso começa como "Não verificado".
- **Acessibilidade da interface:** alto contraste, fonte para dislexia, texto ampliado, menos estímulos, leitura em voz alta, VLibras, busca por voz e navegação completa por teclado.

Limites atuais, ditos com clareza na interface:
- A rota a pé vem do OpenStreetMap e não verifica calçadas, rampas ou obstáculos.
- A compatibilidade compara as informações cadastradas e não é certificação de acessibilidade.
- Cadastros, relatos e preferências ficam no navegador de quem usa. Publicação compartilhada e moderação ainda dependem de backend.

## Executar

Requisitos: Node 22.18 ou superior.

```bash
npm install
npm run dev
```

### Google Maps (opcional)

Sem chave, o app funciona com busca de endereços (ViaCEP, Photon e OpenStreetMap) e com os cadastros locais. Os locais próximos do Google e as vistas aéreas pedem uma chave.

1. Copie `.env.example` para `.env.local` e preencha `VITE_GOOGLE_MAPS_API_KEY`. Para demonstrar sem custo, use uma [Maps Demo Key](https://developers.google.com/maps/documentation/javascript/demo-key).
2. Em produção, habilite Maps JavaScript API e Places API (New), crie um Map ID do tipo JavaScript (`VITE_GOOGLE_MAPS_MAP_ID`) e restrinja a chave por referenciador HTTP. Variáveis `VITE_` ficam visíveis no navegador.
3. No deploy, configure as variáveis antes de `npm run build`.

### Supabase (opcional)

Sem Supabase, o app usa o armazenamento do navegador. Para consultar um banco remoto, execute `supabase_schema.sql` e depois `database/place_accessibility.sql`, e configure `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY`. O endpoint `POST /rest/v1/rpc/get_place_accessibility` recebe `{ "requested_place_id": "IDENTIFICADOR_DO_GOOGLE" }`, respeita RLS e retorna `encontrado`, `verificado` e `local`. Não use chaves secretas ou `service_role` no frontend.

## Testes

```bash
npm test          # testes unitários
npm run lint
npm run build
```

Os testes de navegador (`tests/browser-*.mjs`) rodam contra um Chrome com depuração remota e o `vite preview`. As portas estão no topo de cada arquivo: `browser-regressions.mjs` usa CDP 9222 e preview 4173; os demais usam CDP 9223 e preview 4176. Eles bloqueiam serviços externos e simulam localização e rotas quando precisam.

## Organização

Componentes em `src/components/` (`accessibility`, `establishments`, `explore`, `layout`, `maps`), telas em `src/views/`, regras puras em `src/utils/`, serviços em `src/services/`. Veja a [estrutura do projeto](docs/estrutura-projeto.md), o [design system](docs/design-system.md) e os detalhes da [consulta de acessibilidade](docs/acessibilidade-locais.md). As especificações das features estão em `.specs/features/`.
