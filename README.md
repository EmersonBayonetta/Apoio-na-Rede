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
- **Contribuir:** relatos rápidos na página do local e cadastro do responsável, disponível pelo rodapé. Cada envio passa por moderação.
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

O RPC `get_place_accessibility` recebe `{ "requested_place_id": "IDENTIFICADOR_DO_GOOGLE" }`, respeita RLS e retorna apenas campos públicos. Os cadastros do responsável são gravados junto com os critérios em uma transação. Nenhum dado de demonstração é inserido no banco remoto.

### Login e moderação

Habilite o provedor Email no Supabase Auth. Configure **Site URL** e **Redirect URLs** com o endereço real do site e, para desenvolvimento, `http://localhost:5173/**`. O acesso funciona por link de e-mail ou código; para fornecer o código, inclua `{{ .Token }}` no template de Magic Link. Configure SMTP próprio para envio de e-mails em produção. O fluxo de envio real depende desse serviço e deve ser verificado com uma conta autorizada antes da publicação.

A gestão fica em `/gestao`, sem link no menu ou rodapé, e envia `noindex`. Exige login e uma conta habilitada na lista privada `private.administrator_access`. Somente administradores do banco podem adicionar pessoas da equipe. Confirmação de e-mail, cadastro comum e metadados não concedem esse acesso. Para autorizar uma conta já cadastrada e confirmada, execute pelo SQL Editor com acesso administrativo:

```sql
insert into private.administrator_access(user_id)
select id from auth.users
where id = 'UUID_DA_CONTA' and email_confirmed_at is not null
on conflict(user_id) do update set enabled=true;
```

A interface consulta `is_site_admin`, e RLS e triggers consultam a mesma autorização no banco. Para revogar, defina `enabled=false` na lista privada: tokens antigos não mantêm a permissão nas operações seguintes. Não use `user_metadata` para permissões. Recusas exigem motivo.

A migração de acesso preserva a conta originalmente autorizada e remove o trigger histórico de concessão automática por e-mail. Novas contas da equipe precisam de inclusão explícita pelo administrador do banco. Recriar uma conta com o mesmo e-mail não herda acesso. Não versione os e-mails da equipe nem exponha a lista privada no frontend.

O titular também pode autorizar a equipe pelo fluxo de [solicitação de acesso](docs/admin-access-requests.md): a pessoa confirma seu e-mail e solicita, um aviso é enviado ao titular e somente ele aprova ou recusa no painel. O aviso usa Resend em uma Vercel Function e exige configuração de servidor. O link do aviso não concede acesso automaticamente.

Rotas e profissionais são compartilhados após revisão em `/gestao`. Novos cadastros exigem login, com limite de 10 envios por catálogo em 24 horas. Aprovar um relato de rota não confirma uma auditoria presencial. Os painéis de importação foram retirados das telas públicas.

Categorias e listas online sem cadastros reais exibem [exemplos de apresentação](docs/catalogo-apresentacao.md): nove locais, cinco rotas e seis profissionais. Cada card é identificado como demonstração, com contatos e recursos ilustrativos. Os exemplos não são gravados no banco, não oferecem contatos acionáveis ou navegação e não recebem relatos ou avaliações. Cadastros reais substituem os exemplos da categoria/lista correspondente. O filtro de locais conferidos exclui os exemplos.

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
