# Apoio na Rede

**Saiba se um lugar é acessível para você antes de sair.**

O Apoio na Rede reúne os recursos de acessibilidade dos locais de Cataguases (MG): rampas, banheiros adaptados, atendimento em Libras, áreas de descanso e outros. Ele compara esses recursos com o que cada pessoa precisa e mostra como chegar a pé. As informações são colaborativas e indicam claramente o que foi confirmado, o que não existe e o que ainda não foi verificado.

## Como funciona

1. **Diga do que você precisa.** Em "Minhas necessidades", marque cada recurso como "Indispensável", "Desejável" ou "Não preciso". Não é preciso informar diagnóstico, e a escolha fica salva só no seu navegador.
2. **Encontre o local.** Busque por nome, endereço ou categoria. Cada card mostra quantos dos seus requisitos o local atende, e um filtro opcional oculta locais que não atendem um requisito indispensável.
3. **Veja como chegar.** Na página do local, "Calcular rota a pé" mostra distância e tempo a partir da sua localização. "Abrir no Google Maps" abre o trajeto a pé.

## Recursos

- **Explorar:** busca de locais e endereços, categorias, compatibilidade com suas necessidades e página de cada local com recursos, fotos, avaliações e rota a pé.
- **Rotas acessíveis:** relatos da comunidade sobre trechos da cidade (rampas, piso tátil, semáforo sonoro), sempre marcados como relato até serem conferidos.
- **Profissionais:** catálogo de profissionais que atendem pessoas com deficiência, com filtro por necessidade atendida.
- **Cadastrar:** formulário público de locais, disponível no menu e no rodapé. Cada envio fica pendente até revisão do titular por link do Supabase. Veja o [fluxo atual de cadastro](docs/cadastro-revisao-supabase.md).
- **Avaliar:** comentários sem login ou confirmação de e-mail, limitados a uma avaliação por local e identificador do navegador. Veja [regras e limites](docs/avaliacoes-sem-email.md).
- **Acessibilidade da interface:** alto contraste, fonte para dislexia, texto ampliado, menos estímulos, leitura em voz alta, VLibras, busca por voz e navegação completa por teclado.

Limites atuais, ditos com clareza na interface:
- A rota a pé vem do OpenStreetMap e não verifica calçadas, rampas ou obstáculos.
- A compatibilidade compara as informações cadastradas e não é certificação de acessibilidade.
- Sem Supabase, cadastros e relatos ficam neste navegador. Com Supabase, locais aprovados e relatos moderados são compartilhados. Requisitos pessoais continuam apenas no navegador.

## Executar

Requisitos: Node 22.18 ou superior.

```bash
npm install
npm run dev
```

### Google Maps (opcional)

Sem chave, o app funciona com busca de endereços (ViaCEP, Photon e OpenStreetMap) e com os cadastros locais. Os locais próximos do Google e as vistas aéreas pedem uma chave.

1. Acrescente `VITE_GOOGLE_MAPS_API_KEY` ao `.env.local`, preservando as variáveis existentes. Para demonstrar sem custo, use uma [Maps Demo Key](https://developers.google.com/maps/documentation/javascript/demo-key).
2. Em produção, habilite Maps JavaScript API e Places API (New), crie um Map ID do tipo JavaScript (`VITE_GOOGLE_MAPS_MAP_ID`) e restrinja a chave por referenciador HTTP. Variáveis `VITE_` ficam visíveis no navegador.
3. No deploy, configure as variáveis antes de `npm run build`.

### Supabase (opcional)

O projeto utilizado é `supabase-green-school` (`pwzqivjkpiqsizuebjlt`). Configure `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` no `.env.local` e na Vercel antes do build. Nunca use chaves secretas ou `service_role` no frontend. O arquivo local está ignorado pelo Git; o deploy precisa receber suas próprias variáveis.

O build também aceita as variáveis públicas da integração Vercel: `SUPABASE_URL`/`NEXT_PUBLIC_SUPABASE_URL` e `SUPABASE_PUBLISHABLE_KEY`/`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (ou as variantes `ANON_KEY`). Nenhuma chave secreta é utilizada. Um deploy Vercel Production sem configuração completa do banco é interrompido.

Em um banco novo, execute nesta ordem:

1. `supabase_schema.sql`
2. `database/place_accessibility.sql`
3. `database/contributions.sql`
4. `database/contribution_hardening.sql`
5. `database/public_accessibility.sql`
6. `database/contribution_indexes.sql`
7. `database/community_directory.sql`
8. `database/administrator_bootstrap.sql`
9. `database/administrator_access.sql`
10. `database/administrator_requests.sql`
11. `database/registration_email_review.sql`
12. `database/directory_email_review.sql`
13. `database/registration_shared_limits.sql`

O RPC `get_place_accessibility` recebe `{ "requested_place_id": "IDENTIFICADOR_DO_GOOGLE" }`, respeita RLS e retorna apenas campos públicos. Os cadastros do responsável são gravados junto com os critérios em uma transação. Nenhum dado de demonstração é inserido no banco remoto. A carga opcional pesquisada está em `database/public_catalog_cataguases.sql` e depende do titular já autorizado.

### Cadastro, revisão e catálogo público

O cadastro de locais, trechos e profissionais é público e fica pendente até aprovação do titular autorizado. O servidor solicita um link de autenticação do Supabase para abrir a revisão de um cadastro, sem painel de gestão e sem Resend. A lista privada de autorização é conferida em cada leitura e decisão. O envio padrão do Supabase tem limites; cadastro salvo não garante entrega do aviso. Veja [configuração e limites](docs/cadastro-revisao-supabase.md).

O catálogo online contém dados reais pesquisados: nove locais, três profissionais e cinco ligações entre endereços públicos. As fontes aparecem nos registros e estão documentadas no [catálogo real de Cataguases](docs/catalogo-real-cataguases.md). Recursos não confirmados ficam sem informação; publicação não certifica acessibilidade. Não são importadas avaliações externas. As avaliações do site mantêm notas, comentários, filtros, envio e denúncia, com resumo e distribuição de estrelas. A galeria de fotos da página do local foi removida.

Cada pessoa pode enviar um relato por local, incluindo locais encontrados no Google/OSM. A identidade é normalizada no banco quando existe cadastro vinculado. O relato permanece único mesmo se recusado. Há limites de 10 relatos e 3 cadastros por usuário em 24 horas. Fotos de relatos são privadas (até 3 JPG/PNG/WebP de 5 MB), ficam na pasta do autor e só podem ser lidas pelo autor, administrador ou após aprovação. As URLs de visualização expiram em 5 minutos. O bucket limita cada conta a 30 uploads por per?odo de 24 horas; fotos vinculadas a relatos não podem ser apagadas pelo cliente.

### Demonstração

Sem variáveis Supabase, o modo local funciona automaticamente. Para demonstrar mesmo com `.env.local` configurado, use `npm run dev:demo` ou `npm run build:demo` seguido de `npm run preview`. Nesse modo, o aviso deixa claro que a moderação é uma simulação e não exige login. A regra de um relato por local vale por navegador; limpar o armazenamento remove essa identidade. Os dados locais não são enviados automaticamente ao Supabase.

## Testes

```bash
npm test          # testes unitários
npm run lint
npm run build
```

Os testes de navegador (`tests/browser-*.mjs`) rodam contra um Chrome com depuração remota e o `vite preview`. As portas estão no topo de cada arquivo: `browser-regressions.mjs` usa CDP 9222 e preview 4173; os demais usam CDP 9223 e preview 4176. Eles bloqueiam serviços externos e simulam localização e rotas quando precisam.

Use `npm run build:demo` antes desses testes isolados. `tests/browser-contributions.mjs` cobre envio único, fotos, persistência, moderação e selo do responsável. `tests/browser-supabase-auth.mjs` usa build normal em preview 4177 e CDP 9224, simula respostas Auth e verifica o bloqueio de visitantes/usuários comuns e a exigência de login do responsável. `tests/supabase-security.sql` testa cadastro, duplicação, campos protegidos, respostas inválidas, cotas e RLS dentro de uma transação com `ROLLBACK`. Execute-o pelo SQL Editor/MCP em ambiente controlado. `node scripts/verify-supabase.mjs` verifica a API real com a chave pública sem imprimi-la. A entrega real do e-mail e Google Maps real exigem configurações externas e não são simulados por esses testes.

`tests/browser-public-catalog.mjs` cobre o catálogo atual: layout em 320/390/1440 px, falha e recuperação do Google, detalhes de locais externos, cálculo a pé, falha do serviço de rotas e alternativa no Google Maps. Ele substitui os antigos testes `discovery`, `exterior`, `hybrid-catalog` e `street-catalog`, que esperavam mapas e panoramas embutidos removidos da interface. Endereços, categorias e cobertura por atividade continuam com testes próprios. Execute os testes que compartilham o mesmo Chrome em sequência e conclua todos antes de trocar o build de demonstração pelo normal.

## Organização

Componentes em `src/components/` (`accessibility`, `establishments`, `explore`, `layout`, `maps`), telas em `src/views/`, regras puras em `src/utils/`, serviços em `src/services/`. Veja a [estrutura do projeto](docs/estrutura-projeto.md), o [design system](docs/design-system.md) e os detalhes da [consulta de acessibilidade](docs/acessibilidade-locais.md). As especificações das features estão em `.specs/features/`.
