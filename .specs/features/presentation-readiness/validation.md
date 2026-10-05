# Prontidão para Apresentação: Validação

**Data**: 2026-10-05
**Spec**: `.specs/features/presentation-readiness/spec.md` (PRES-01..PRES-27 e 2 casos de borda)
**Diff range**: `31e6acb..474f700` (13 commits)
**Verifier**: subagente independente (autor ≠ verificador)

**Verdict**: FAIL
**Result**: FAIL

Os 27 critérios têm evidência e o resultado bate com a spec. Todo o gate passa. O FAIL vem do sensor: um mutante real sobreviveu (o arredondamento de minutos), e o CSS adicionado para o PRES-12 não muda nada que o teste consiga ver. As correções são pequenas (ver "Plano de correção").

---

## Tarefas

| Tarefa | Status | Notas |
| ------ | ------ | ----- |
| T1–T4 | ✅ Feitas | Unidade |
| T5–T10 | ✅ Feitas | Navegador |
| T13 | ✅ Feita | Adicionada no Execute (PRES-27) |
| T11 | ✅ Feita | Desvio registrado: o aviso de armazenamento em `src/App.tsx:25` (corrida com o efeito do Navbar) |
| T12 | ✅ Feita | README revisado abaixo |

Desvio fora do escopo, mas registrado e testado: o rótulo da categoria na página do local (`src/views/EstablishmentDetailView.tsx:148`, testado em `tests/browser-presentation.mjs:121`).

---

## Critérios de aceitação (spec-anchored)

`bp` = `tests/browser-presentation.mjs`, `ut` = `tests/presentation.test.mjs`, `br` = `tests/browser-regressions.mjs`, `bn` = `tests/browser-needs.mjs`.

| ID | Resultado definido na spec | `file:line` e asserção | Resultado |
| -- | -------------------------- | ---------------------- | --------- |
| PRES-01 | h1 "Saiba se um lugar é acessível para você antes de sair." | `bp:34` `assert.equal(main h1.textContent, 'Saiba se um lugar é acessível para você antes de sair.')` (fonte `src/components/explore/ExplorerHero.tsx:7`) | ✅ |
| PRES-02 | "Como funciona" e 3 passos exatos | `bp:38` `deepEqual([...li strong].map(textContent), ['Diga do que você precisa','Encontre o local','Veja como chegar'])`; `bp:39` título `'Como funciona'` | ✅ |
| PRES-03 | Busca inteira na 1ª tela em 360×780 | `bp:35` `scrollY === 0`; `bp:36` `r.top>=0 && r.bottom<=780-80` (mais rígido: desconta a barra inferior) | ✅ |
| PRES-04 | "Trace sua rota" em nenhuma tela | `bp:40` `body.innerText.includes('Trace sua rota') === false` (só no Explorar); grep em `src/` e `README.md`: 0 ocorrências | ✅ ⚠️ o teste cobre só o Explorar; o grep cobre o resto |
| PRES-05 | README começa pela proposta e lista só o que existe | Sem teste (só revisão). `README.md:3` abre com a proposta; nenhuma seção do modelo Vite. Afirmações conferidas em `src/` (ver "Revisão do README") | ✅ |
| PRES-06 | Formato "1,2 km · 15 min" | `bp:51` `equal(.walking-summary.textContent, '1,2 km · 15 min')`; `ut:22-24` | ✅ |
| PRES-07 | Aviso exato do OpenStreetMap | `bp:52` `textContent.includes('Rota calculada pelo OpenStreetMap. Não verifica calçadas, rampas ou obstáculos.')` | ✅ |
| PRES-08 | `role="alert"` com o motivo; link "Abrir no Google Maps" mantido | `bp:54-58` para negado e falha do serviço: `[role="alert"]...startsWith(message)`, sem resumo, `mapsLink()==='walking'` (o link é achado pelo texto "Abrir no Google Maps", `bp:47`) | ✅ |
| PRES-09 | Cards e página do local com `travelmode=walking` | `ut:7` `equal(travelmode,'walking')`; `bp:49`, `bp:58` (página); `bp:63` cards `.every(...)` | ✅ ⚠️ `bp:63` usa `.every` e passaria com lista vazia |
| PRES-10 | Nome "Filtrar por necessidade atendida" | `bp:119` `equal(select aria-label, 'Filtrar por necessidade atendida')` | ✅ |
| PRES-11 | Alvos ≥ 24×24, 3 telas, 360 e 1280 | `bp:105-113` `deepEqual(smallTargets, [])` em `/`, `?aba=rotas`, `?aba=profissionais` × 360 e 1280 | ✅ |
| PRES-12 | Botão flutuante sem sobrepor botões ou links no fim da página | `bp:107-114` `deepEqual(launcherOverlaps, [])` | ✅ ⚠️ o teste não discrimina (mutante M13 sobreviveu; o build anterior à feature também passa) |
| PRES-13 | 5 destinos com rótulos exatos, celular e desktop | `bp:68` `deepEqual(mobile, ['Explorar','Rotas','Profissionais','Cadastrar','Minhas necessidades'])`; `bp:72` desktop com 'Rotas acessíveis' e 'Cadastrar local' | ✅ |
| PRES-14 | Ícone diferente por destino | `bp:69` `new Set(svg class).size === 5` | ✅ |
| PRES-15 | Rótulos ≥ 12 px | `bp:70` `every(fontSize >= 12)` | ✅ |
| PRES-16 | URL `?aba=rotas/profissionais/cadastro` | `bp:77` `location.search === '?aba=rotas'` após clique; `ut:36-38` `urlForTab` para rotas e cadastro | ✅ ⚠️ o clique no navegador só cobre rotas; profissionais e cadastro só na unidade |
| PRES-17 | Abrir ou recarregar com `?aba=` abre a tela | `bp:79-80` reload em rotas; `bp:84-85` abrir profissionais e cadastro; `ut:29-31` | ✅ |
| PRES-18 | Voltar retorna à tela anterior | `bp:81-83` `history.back()` → `search===''` e h1 do Explorar | ✅ |
| PRES-19 | Diálogo "Minhas necessidades" com link "Opções de exibição e leitura" que abre o painel | `bp:95` título; `bp:96-98` clique → diálogo fecha, `#accessibility-menu` aberto | ✅ |
| PRES-20 | Painel com link "Minhas necessidades" que abre o diálogo | `bp:99-101` clique → painel fecha, título 'Minhas necessidades' | ✅ |
| PRES-21 | "Ainda não há trechos compartilhados." e "Compartilhar um trecho" | `bp:125-129` texto exato e o botão (achado pelo texto exato) abre o formulário; `bp:131` com busca volta ao "Nenhum resultado" | ✅ |
| PRES-22 | "Ainda não há profissionais cadastrados." e "Cadastrar profissional" | `bp:125-129` (mesmo laço) | ✅ |
| PRES-23 | "Os locais próximos não carregaram." com "Tentar novamente", sem limpar filtros | `bp:138` h2 exato; `bp:139` `deepEqual(buttons, ['Tentar novamente'])`; `bp:140` sem 'Limpar filtros' | ✅ |
| PRES-24 | Item "Espaço com baixo ruído…" ausente do cadastro | `bn:134` `some(label includes 'Espaço com baixo ruído sonoro') === false` | ✅ |
| PRES-25 | WhatsApp começando com 0 (após 55) sem link | `ut:14-15` `equal(whatsappUrl('0800 770 7722'), null)` e `'55 0800…'`; `ut:16-17` números válidos preservados | ✅ |
| PRES-26 | `browser-regressions.mjs` passa | Gate: 24/24 checks, exit 0 | ✅ |
| PRES-27 | Botão "Ver acessibilidade e rota" abre a página do local | `br:42` `click('Ver acessibilidade e rota')` (texto exato) → `searchParams.has('local')`; `bp:146-149` `local==='est-card'`, h1 e seção de rota | ✅ ⚠️ `bp:146` clica no primeiro botão sem conferir o texto (o texto é coberto em `br:42`) |

**Casos de borda**

- [x] `?aba=` desconhecido abre Explorar: `ut:32` `equal(tabFromUrl('?aba=xyz'),'explorer')`; `bp:84-85` (`xyz` → h1 do Explorar).
- [x] `local` tem prioridade sobre `aba`: `bp:87-88` `/?aba=rotas&local=est-r` → h1 'Biblioteca Municipal'.

**Status**: 27/27 critérios com evidência e resultado igual ao da spec. 5 pontos de precisão ⚠️ (nenhum bloqueia).

---

## Revisão do README (PRES-05)

O README abre com a proposta de valor (`README.md:3`), segue com "Como funciona" e lista recursos. Não restou seção do modelo Vite nem o texto antigo de "Como chegar". Conferi cada recurso em `src/`:

- Níveis Indispensável, Desejável e Não preciso: `UserPreferencesModal.tsx:11-13`. O README diz "não necessário" (`README.md:9`), e a interface diz "Não preciso". Diferença cosmética.
- Filtro "Ocultar locais com requisito indispensável não atendido": `ExplorerView.tsx:787`.
- Rota a pé e "Abrir no Google Maps": `WalkingRoute.tsx`.
- Rotas com "Relato" e "Conferido", e Profissionais com filtro: `CommunityDirectoryView.tsx`.
- Checklist da NBR 9050 com recursos começando em "Não verificado": no assistente, `presente: null` → "Não verificado" (`MerchantRegisterWizard.tsx:99`, `:535`).
- Recursos de acessibilidade da interface: alto contraste, dislexia (`AccessibilityToolbar.tsx`), voz (`speechSynthesis` em `AccessibilityContext.tsx`), VLibras (`App.tsx`), busca por voz (`VoiceSearchButton.tsx`) e menos estímulos (`reduced-sensory`).
- Configuração: ViaCEP e Photon (`ExplorerView.tsx`); `VITE_GOOGLE_MAPS_MAP_ID` (`GoogleMap.tsx`); `VITE_SUPABASE_PUBLISHABLE_KEY` (`lib/supabase.ts`); `get_place_accessibility` e `requested_place_id` (`database/place_accessibility.sql`); `.env.example` e os docs citados existem.
- Portas dos testes de navegador: batem com o topo de cada arquivo.

Uma afirmação não foi conferida: "navegação completa por teclado" (`README.md:19`) é ampla e nenhum teste desta feature a cobre. Ela já vinha de antes.

---

## Gate

Comandos rodados somente em modo leitura sobre o repositório real (`main` @ `474f700`, `dist/` real já construído). Os testes de navegador rodaram um por vez.

| Comando | Resultado |
| ------- | --------- |
| `npx tsc -b` | exit 0 |
| `npm run lint` | exit 0. 2 avisos `only-export-components` em arquivos fora do diff (`AccessibilityContext.tsx`, `DisabilityBadge.tsx`), já existentes |
| `npm test` | 51 passaram, 0 falharam, 0 pulados |
| `node tests/browser-presentation.mjs` (CDP 9223, 4176) | passou |
| `node tests/browser-needs.mjs` (9223, 4176) | passou |
| `node tests/browser-community.mjs` (9223, 4176) | passou |
| `node tests/browser-regressions.mjs` (9222, 4173) | 24/24 checks, passou |

- **Testes de unidade antes**: 46. **Depois**: 51. **Delta**: +5 (`tests/presentation.test.mjs`). Nenhum outro arquivo `*.test.mjs` mudou.
- **Regressão**: saíram 2 checks ("Navegação mobile/desktop abre mapa") porque o mapa e o botão "Lista" não existem mais, o que é justificado pela spec. Entrou "Voltar retorna ao Explorar". "Sem nota fictícia" foi mantido e só mudou de posição.
- `docs/auditoria-desktop-mobile/regressions-fixed.json` foi reescrito pelo teste e depois restaurado a partir de `HEAD` (`git diff --quiet` = 0). O `git status --porcelain` final é igual à linha de base.

---

## Sensor de discriminação

As mutações rodaram uma por vez em um `git worktree` destacado no scratchpad, com junction do `node_modules`. Cada mutação de interface teve build próprio em outDir do scratch e um `vite preview` próprio na porta 4178. Rodei as cópias de `browser-presentation.mjs` (CDP 9223) e `browser-regressions.mjs` (CDP 9222), apontadas para 4178. As linhas de base sem mutação passaram nas duas cópias. Depois encerrei só o meu preview, removi as junctions e os worktrees (`git worktree prune`). Profundidade: ampliada (14 mutações).

| # | Arquivo:linha | Mutação | Teste | Resultado |
| - | ------------- | ------- | ----- | --------- |
| M1 | `src/utils/directionsUrl.ts:6` | Remove `travelmode=walking` | `npm test` (1 falha) | ✅ Morto |
| M2 | `src/utils/communityDirectory.ts:11` | Remove a regra do 0 inicial (`return full`) | `npm test` (1 falha) | ✅ Morto |
| M3 | `src/utils/formatDistance.ts:6` | `Math.round` → `Math.ceil` | `npm test` (0 falhas) | ❌ **Sobreviveu** |
| M3b | idem | `Math.round` → `Math.floor` | `npm test` | ✅ Morto |
| M3c | idem | Sem o mínimo de 1 min | `npm test` | ✅ Morto |
| M4 | `src/utils/appTabs.ts:7` | `aba` desconhecida → `'routes'` | `npm test` (1 falha) | ✅ Morto |
| M5 | `src/components/explore/ExplorerHero.tsx:7` | Muda o h1 | bp | ✅ Morto |
| M6 | `src/App.tsx:27` | Para de sincronizar a aba no `popstate` | bp:83 (Voltar ficou em Rotas) | ✅ Morto |
| M7 | `src/views/CommunityDirectoryView.tsx:92` | Remove o `aria-label` do filtro | bp:119 | ✅ Morto |
| M8 | `src/App.tsx` (rodapé, `min-h-6`) | Encolhe o alvo do rodapé | bp:113 (`'Cadastre seu Estabelecimento 158x16'`) | ✅ Morto |
| M9 | `src/views/ExplorerView.tsx:845` | Remove `onOpenPlace={onSelectEstablishment}` | bp:146 (botão ausente) | ✅ Morto |
| M10 | `src/views/CommunityDirectoryView.tsx:104` | O vazio sempre mostra "Nenhum resultado para essa busca." | bp:127 | ✅ Morto |
| M11 | `src/components/establishments/WalkingRoute.tsx:22-23` | O `catch` engole a falha do serviço (sem alerta) | bp:56 | ✅ Morto |
| M12 | `src/App.tsx:25` | Remove a checagem `isTemporary()` no mount | cópia de `br`: "Falha de armazenamento não derruba aplicação" | ✅ Morto |
| M13 | `src/styles/design-system.css:282` (e `:283` junto) | Remove o espaço reservado para o botão flutuante | bp | ❌ **Sobreviveu** |
| M14 | `src/components/establishments/WalkingRoute.tsx:24` | Localização negada sem alerta | bp:56 | ✅ Morto |

**Resultado do sensor**: 14 mutações, 12 mortas, 2 sobreviveram.

- **M3**: os casos de `ut:22-24` (900 s, 290 s, 10 s) dão o mesmo resultado com `round` e `ceil`. Um caso como `formatWalkingSummary(1000, 61)` (round = 1 min, ceil = 2 min) discriminaria.
- **M13**: rodei uma sonda extra em 7 tamanhos de tela (320 a 1440) × 4 telas, contando também `input`, `select` e `textarea`. Ela não acha sobreposição nem sem as regras de `design-system.css:282-283`, nem no build anterior à feature (`31e6acb`). Ou as regras não têm efeito (CSS morto), ou a sobreposição vista na auditoria acontece em um estado que o teste não reproduz (meio da rolagem, outro tamanho, painel aberto).

---

## Qualidade do código

| Princípio | Status |
| --------- | ------ |
| Código mínimo | ⚠️ CSS do PRES-12 (`design-system.css:282-283`) sem efeito observável; CSS da arte antiga do banner ficou órfão (`design-system.css:92-94`, `:169`, `:246-247`: `.banner-art`, `.banner-orbit`, `.banner-pin`, `.discovery-banner > div:first-child`) |
| Mudanças cirúrgicas | ✅ Cada arquivo tocado tem razão no spec ou em desvio registrado |
| Sem escopo extra | ✅ O rótulo da categoria e o aviso de armazenamento estão registrados como desvios e testados |
| Segue os padrões | ✅ Eventos de janela para os links cruzados, utilitários puros em `src/utils/` |
| Asserções iguais ao resultado da spec | ✅ Textos exatos; ver os ⚠️ da tabela |
| Cobertura por camada | ✅ Utils 1:1 com os ACs; e2e cobre caminho feliz, erro (negado e falha) e bordas |
| Todo teste mapeia para AC, borda ou Done-when | ✅ (`bp:121` = desvio de categoria do T9) |
| Diretrizes do projeto | nenhuma documentada; usei padrões fortes |

Outras observações:

- `updateLocalUrl` **não** está morto: ainda é usado por `handleSelectEstablishment` (`src/App.tsx:38`, `:49`). Ele grava `local` e mantém `aba`, o que bate com a prioridade de `local`. Há uma leve duplicação com `urlForTab`. Não encontrei imports mortos: `tsc` passa, e o `noUnusedLocals` está desligado, então conferi à mão os imports trocados (`EstablishmentDetailView`, `ExploreCategories`, `Navbar`).
- `src/components/explore/PlaceResultCard.tsx:29`: a URL de fallback (`…/maps/dir/?api=1&destination=nome`) não tem `travelmode=walking`. Hoje ela é inalcançável, porque toda entrada do catálogo tem `place` ou `establishment` (`ExplorerView.tsx:177`). Mesmo assim, é uma exceção latente ao PRES-09.
- A cópia nova está em português consistente. Sobram dois nomes antigos que destoam: o painel flutuante se chama "Ajustes de Acessibilidade" (`AccessibilityToolbar.tsx:106`), enquanto o link que leva até ele diz "Opções de exibição e leitura"; e a página do local diz "Voltar ao Catálogo" (`EstablishmentDetailView.tsx:112`), embora "Catálogo" tenha saído da navegação.

---

## Lacunas, em ordem de prioridade

1. **Mutante M3 sobrevive (arredondamento de minutos)**: PRES-06 / T3 "minute rounding", em `tests/presentation.test.mjs:22-24`. O teste não distingue `round` de `ceil`.
2. **PRES-12 não discrimina**: `tests/browser-presentation.mjs:107-114` passa com e sem `design-system.css:282-283` e também no build anterior à feature. Assim, o CSS adicionado não tem prova de efeito.
3. **CSS órfão da arte antiga do banner**: `design-system.css:92-94`, `:169`, `:246-247`.
4. **Asserções que passariam vazias ou sem conferir o texto**: `bp:63` (`.every` sobre os cards) e `bp:146` (primeiro botão do card, sem conferir o texto).
5. **Cópia**: "Ajustes de Acessibilidade" e "Voltar ao Catálogo" destoam dos novos nomes; o README diz "não necessário", e a interface diz "Não preciso".
6. **Fallback sem `travelmode`** em `PlaceResultCard.tsx:29` (inalcançável hoje).

## Plano de correção

### Correção 1: discriminar o arredondamento (Maior)
- **Tarefa**: em `tests/presentation.test.mjs`, adicionar `assert.equal(formatWalkingSummary(1000, 61), '1 km · 1 min')` e um caso de meio minuto, como `formatWalkingSummary(500, 450)` → `'500 m · 8 min'`.
- **Pronto quando**: o mutante `Math.ceil` mata e `npm test` passa.

### Correção 2: PRES-12 com prova ou sem código morto (Menor)
- **Tarefa**: reproduzir a sobreposição que a auditoria achou (tamanho de tela e estado exatos) e fazer `launcherOverlaps` cobrir esse estado. Se ela não se reproduzir, remover `design-system.css:282-283`.
- **Pronto quando**: remover as regras faz `bp` falhar, ou as regras deixam de existir e `bp` continua passando.

### Correção 3: limpeza (Cosmético)
- Remover o CSS órfão de `.banner-art`, `.banner-orbit`, `.banner-pin` e `.discovery-banner > div:first-child`.
- Em `bp:63`, conferir antes que existe pelo menos 1 link. Em `bp:146`, achar o botão pelo texto "Ver acessibilidade e rota".
- Alinhar a cópia: o título do painel passa a ser "Opções de exibição e leitura", "Voltar ao Catálogo" vira "Voltar ao Explorar" e o README passa a dizer "não preciso".
- Opcional: usar `directionsUrl` também no fallback de `PlaceResultCard.tsx:29`, ou remover o fallback.

---

## Rastreabilidade

Os status ficam em `Implementing` até a próxima verificação, porque o veredito é FAIL. Todos os 27 critérios têm evidência; o bloqueio vem do sensor.

## Verificações determinísticas

O Python não está instalado. `validate_state.py` e `lessons.py` não rodaram, então conferi as regras lendo os scripts. O relatório tem uma única linha de veredito (no topo), com um único valor, e cita evidências `file:line`. Com o veredito atual, o script retornaria 1, como esperado.

Lições sugeridas para `.specs/LESSONS.md` (não gravei: está fora do que o Verifier pode escrever):
- Teste de arredondamento precisa de um caso em que `round`, `ceil` e `floor` deem resultados diferentes.
- Antes de corrigir um defeito de layout, reproduza-o em um teste que falhe no build antigo; senão a correção fica sem prova e pode virar CSS morto.
