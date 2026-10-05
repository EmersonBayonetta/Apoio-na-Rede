# Prontidão para Apresentação: Validação

**Data**: 2026-10-05
**Spec**: `.specs/features/presentation-readiness/spec.md` (PRES-01..PRES-27 e 2 casos de borda)
**Diff range**: `31e6acb..1193cd1` (14 commits)
**Verifier**: subagente independente (autor ≠ verificador), rodada 2

**Verdict**: PASS
**Result**: PASS

Os 27 critérios têm evidência e o resultado bate com a spec. Todo o gate passa. O mutante que sobrevivia na rodada 1 (arredondamento) agora morre, e os três mutantes de regressão continuam mortos. Sobra uma lacuna menor, fora do texto do critério: sem as regras de espaço que foram removidas, o botão flutuante volta a cobrir a última linha de texto do rodapé (ver "Rodada 2", item PRES-12). Ela não bloqueia, mas vale corrigir antes da apresentação.

---

## Tarefas

| Tarefa | Status | Notas |
| ------ | ------ | ----- |
| T1–T4 | ✅ Feitas | Unidade |
| T5–T10 | ✅ Feitas | Navegador |
| T13 | ✅ Feita | Adicionada no Execute (PRES-27) |
| T11 | ✅ Feita | Desvio registrado: o aviso de armazenamento em `src/App.tsx:25` (corrida com o efeito do Navbar) |
| T12 | ✅ Feita | README revisado abaixo |
| Correções da rodada 1 | ✅ Feitas | Commit `1193cd1` (seção "Verifier round 1 fixes" em `tasks.md`) |

Desvio fora do escopo, mas registrado e testado: o rótulo da categoria na página do local (`src/views/EstablishmentDetailView.tsx:148`, testado em `tests/browser-presentation.mjs:123`).

---

## Critérios de aceitação (spec-anchored)

`bp` = `tests/browser-presentation.mjs`, `ut` = `tests/presentation.test.mjs`, `br` = `tests/browser-regressions.mjs`, `bn` = `tests/browser-needs.mjs`. Linhas conferidas em `1193cd1`.

| ID | Resultado definido na spec | `file:line` e asserção | Resultado |
| -- | -------------------------- | ---------------------- | --------- |
| PRES-01 | h1 "Saiba se um lugar é acessível para você antes de sair." | `bp:34` `assert.equal(main h1.textContent, 'Saiba se um lugar é acessível para você antes de sair.')` (fonte `src/components/explore/ExplorerHero.tsx:7`) | ✅ |
| PRES-02 | "Como funciona" e 3 passos exatos | `bp:38` `deepEqual([...li strong], ['Diga do que você precisa','Encontre o local','Veja como chegar'])`; `bp:39` título `'Como funciona'` | ✅ |
| PRES-03 | Busca inteira na 1ª tela em 360×780 | `bp:35` `scrollY === 0`; `bp:36` `r.top>=0 && r.bottom<=780-80` | ✅ |
| PRES-04 | "Trace sua rota" em nenhuma tela | `bp:40` `includes('Trace sua rota') === false` (Explorar); grep em `src/` e `README.md`: 0 ocorrências | ✅ ⚠️ o teste cobre só o Explorar; o grep cobre o resto |
| PRES-05 | README começa pela proposta e lista só o que existe | Revisão. `README.md:3` abre com a proposta; `README.md:9` agora usa "Indispensável", "Desejável" e "Não preciso", como a interface | ✅ |
| PRES-06 | Formato "1,2 km · 15 min" | `bp:51` `equal(.walking-summary, '1,2 km · 15 min')`; `ut:22-27` (inclui 61 s, 149 s e 151 s) | ✅ |
| PRES-07 | Aviso exato do OpenStreetMap | `bp:52` `includes('Rota calculada pelo OpenStreetMap. Não verifica calçadas, rampas ou obstáculos.')` | ✅ |
| PRES-08 | `role="alert"` com o motivo; link "Abrir no Google Maps" mantido | `bp:54-58` para negado e falha do serviço: alerta `startsWith(message)`, sem resumo, `mapsLink()==='walking'` | ✅ |
| PRES-09 | Cards e página do local com `travelmode=walking` | `ut:7`; `bp:49`, `bp:58` (página); `bp:64-65` cards: `length > 0` e `every(mode === 'walking')`. Fallback do card também tem `travelmode=walking` (`src/components/explore/PlaceResultCard.tsx:29`) | ✅ (⚠️ da rodada 1 resolvido) |
| PRES-10 | Nome "Filtrar por necessidade atendida" | `bp:121` `equal(select aria-label, 'Filtrar por necessidade atendida')` | ✅ |
| PRES-11 | Alvos ≥ 24×24, 3 telas, 360 e 1280 | `bp:107-117` `deepEqual(smallTargets, [])` em `/`, `?aba=rotas`, `?aba=profissionais` × 360 e 1280 | ✅ |
| PRES-12 | Botão flutuante sem sobrepor botões ou links no fim da página | `bp:109-116` `deepEqual(launcherOverlaps, [])`; sonda própria em 7 tamanhos × 3 telas, 0 controles sobrepostos | ✅ ⚠️ o teste é só guarda (não há CSS para discriminar); o botão cobre texto do rodapé (ver Rodada 2) |
| PRES-13 | 5 destinos com rótulos exatos, celular e desktop | `bp:70` mobile; `bp:74` desktop | ✅ |
| PRES-14 | Ícone diferente por destino | `bp:71` `new Set(svg class).size === 5` | ✅ |
| PRES-15 | Rótulos ≥ 12 px | `bp:72` `every(fontSize >= 12)` | ✅ |
| PRES-16 | URL `?aba=rotas/profissionais/cadastro` | `bp:79` após clique; `ut:39-41` `urlForTab` | ✅ ⚠️ o clique no navegador só cobre rotas |
| PRES-17 | Abrir ou recarregar com `?aba=` abre a tela | `bp:80-82` reload em rotas; `bp:86-87` abrir profissionais e cadastro; `ut:32-34` | ✅ |
| PRES-18 | Voltar retorna à tela anterior | `bp:84-85` `history.back()` → `search===''` e h1 do Explorar | ✅ |
| PRES-19 | Diálogo com link "Opções de exibição e leitura" que abre o painel | `bp:97-100`; o painel agora tem o mesmo título (`AccessibilityToolbar.tsx:106`) | ✅ |
| PRES-20 | Painel com link "Minhas necessidades" que abre o diálogo | `bp:101-103` | ✅ |
| PRES-21 | "Ainda não há trechos compartilhados." e "Compartilhar um trecho" | `bp:127-133` | ✅ |
| PRES-22 | "Ainda não há profissionais cadastrados." e "Cadastrar profissional" | `bp:127-133` (mesmo laço) | ✅ |
| PRES-23 | "Os locais próximos não carregaram." com "Tentar novamente", sem limpar filtros | `bp:140-142` | ✅ |
| PRES-24 | Item "Espaço com baixo ruído…" ausente do cadastro | `bn:134` | ✅ |
| PRES-25 | WhatsApp começando com 0 (após 55) sem link | `ut:14-17` | ✅ |
| PRES-26 | `browser-regressions.mjs` passa | Gate: 24/24 checks, exit 0 | ✅ |
| PRES-27 | Botão "Ver acessibilidade e rota" abre a página do local | `br:42` clique pelo texto exato; `bp:148-151` agora acha o botão pelo texto "Ver acessibilidade e rota" e confere `local==='est-card'`, h1 e seção de rota | ✅ (⚠️ da rodada 1 resolvido) |

**Casos de borda**

- [x] `?aba=` desconhecido abre Explorar: `ut:35`; `bp:86-87`.
- [x] `local` tem prioridade sobre `aba`: `bp:89-90` → h1 'Biblioteca Municipal'.

**Status**: 27/27 critérios com evidência e resultado igual ao da spec. Restam 3 pontos de precisão ⚠️ (PRES-04, PRES-12, PRES-16), nenhum bloqueia.

---

## Revisão do README (PRES-05)

Sem mudança desde a rodada 1, exceto `README.md:9`, que agora usa os nomes da interface ("Indispensável", "Desejável", "Não preciso", conferidos em `UserPreferencesModal.tsx:11-13`). A afirmação "navegação completa por teclado" continua sem teste nesta feature; ela já vinha de antes.

---

## Gate (rodada 2)

Rodado em modo leitura no repositório real (`main` @ `1193cd1`). Conferi que os previews 4173 e 4176 servem o mesmo bundle de `dist/` (`index-BiTRPjod.js`, que contém "Voltar ao Explorar"). Testes de navegador um por vez.

| Comando | Resultado |
| ------- | --------- |
| `npx tsc -b` | exit 0 |
| `npm run lint` | exit 0. Os mesmos 2 avisos `only-export-components` de antes, fora do diff |
| `npm test` | 51 passaram, 0 falharam, 0 pulados |
| `node tests/browser-presentation.mjs` (CDP 9223, 4176) | passou |
| `node tests/browser-needs.mjs` (9223, 4176) | passou |
| `node tests/browser-community.mjs` (9223, 4176) | passou |
| `node tests/browser-regressions.mjs` (9222, 4173) | 24/24 checks, passou |

- **Testes de unidade**: continuam 51. Os 3 casos novos são asserções dentro do teste já existente (`ut:25-27`), não testes novos.
- `docs/auditoria-desktop-mobile/regressions-fixed.json` foi reescrito pelo teste e restaurado a partir de `HEAD` (`git diff --quiet` = 0). O `git status --porcelain` final é igual à linha de base; `HEAD` segue em `1193cd1` no `main`.

---

## Sensor de discriminação

### Rodada 1 (`474f700`), com o estado atual

Método: `git worktree` destacado no scratchpad, junction do `node_modules`, build em outDir do scratch, `vite preview` próprio na porta 4178, cópia de `bp`/`br` apontada para 4178.

| # | Arquivo:linha | Mutação | Rodada 1 | Rodada 2 |
| - | ------------- | ------- | -------- | -------- |
| M1 | `src/utils/directionsUrl.ts:6` | Remove `travelmode=walking` | ✅ Morto | não repetido |
| M2 | `src/utils/communityDirectory.ts:11` | Remove a regra do 0 inicial | ✅ Morto | não repetido |
| M3 | `src/utils/formatDistance.ts:6` | `Math.round` → `Math.ceil` | ❌ Sobreviveu | ✅ **Morto** (`ut:25`: `'1 km · 2 min'` ≠ `'1 km · 1 min'`) |
| M3b | idem | `Math.round` → `Math.floor` | ✅ Morto | não repetido (`ut:27` também o mata) |
| M3c | idem | Sem o mínimo de 1 min | ✅ Morto | não repetido |
| M4 | `src/utils/appTabs.ts:7` | `aba` desconhecida → `'routes'` | ✅ Morto | não repetido |
| M5 | `src/components/explore/ExplorerHero.tsx:7` | Muda o h1 | ✅ Morto | ✅ **Morto** (`bp:34`) |
| M6 | `src/App.tsx:27` | Sem sincronia no `popstate` | ✅ Morto | não repetido |
| M7 | `src/views/CommunityDirectoryView.tsx:92` | Sem `aria-label` no filtro | ✅ Morto | não repetido |
| M8 | `src/App.tsx` (rodapé) | Encolhe o alvo do rodapé | ✅ Morto | não repetido |
| M9 | `src/views/ExplorerView.tsx:845` | Remove `onOpenPlace={onSelectEstablishment}` | ✅ Morto | ✅ **Morto** (`bp:148`: o botão "Ver acessibilidade e rota" não existe) |
| M10 | `src/views/CommunityDirectoryView.tsx:104` | O vazio sempre mostra "Nenhum resultado…" | ✅ Morto | ✅ **Morto** (`bp:129`) |
| M11 | `WalkingRoute.tsx:22-23` | O `catch` engole a falha | ✅ Morto | não repetido |
| M12 | `src/App.tsx:25` | Sem `isTemporary()` no mount | ✅ Morto | não repetido |
| M13 | `design-system.css:282-283` | Remove o espaço do botão flutuante | ❌ Sobreviveu | **Encerrado**: as regras foram removidas em `1193cd1`; não há mais o que mutar |
| M14 | `WalkingRoute.tsx:24` | Localização negada sem alerta | ✅ Morto | não repetido |

Linha de base da cópia de `bp` em 4178, sem mutação: passou. Depois encerrei só o meu preview (4178), removi a junction e o worktree (`git worktree prune`).

**Resultado do sensor (rodada 2)**: 4 mutações rodadas, 4 mortas. Nenhum sobrevivente aberto.

---

## Rodada 2

### Correções da rodada 1, conferidas

| Lacuna da rodada 1 | O que mudou em `1193cd1` | Situação |
| ------------------ | ------------------------ | -------- |
| 1. M3 sobrevive | `ut:25-27` (61 s, 149 s, 151 s) | ✅ Resolvida: M3 morre; 149 s e 151 s também separam `floor` |
| 2. PRES-12 não discrimina | Regras de espaço removidas; o check do navegador fica como guarda | ⚠️ Aceita para o critério, com ressalva (abaixo) |
| 3. CSS órfão do banner | `.banner-art`, `.banner-orbit`, `.banner-pin` e `.discovery-banner > div:first-child` removidos | ✅ Resolvida (grep em `src/`: 0 ocorrências) |
| 4. Asserções fracas | `bp:64` exige pelo menos 1 link; `bp:148` acha o botão pelo texto | ✅ Resolvida (M9 agora morre exatamente nessa linha) |
| 5. Cópia | Painel "Opções de exibição e leitura"; "Voltar ao Explorar"; README com os nomes da interface | ✅ Resolvida (grep abaixo) |
| 6. Fallback sem `travelmode` | `PlaceResultCard.tsx:29` com `&travelmode=walking` | ✅ Resolvida |

### Texto antigo

`grep -rn` em `src/`, `tests/` e `README.md` por "Ajustes de Acessibilidade", "Voltar ao Catálogo" e "não necessário": 0 ocorrências. "Trace sua rota" em `src/` e `README.md`: 0 ocorrências. O teste de regressão também foi atualizado (`br:58` clica em "Voltar ao Explorar") e passa.

### PRES-12: julgamento

**O critério está cumprido.** Fiz uma sonda própria (separada do teste) que rola até o fim, espera 600 ms, confere que `scrollY` chegou ao máximo e mede a interseção do botão com `a`, `button`, `input`, `select`, `textarea`, `[role=button]` e `[tabindex]`. Rodei em 320×640, 360×780, 390×844, 768×1024, 1024×768, 1280×900 e 1440×900, nas três telas (`/`, `?aba=rotas`, `?aba=profissionais`). Resultado: 0 controles sobrepostos em todos os 21 casos. O controle mais próximo fica a 27 px no celular e a 127 px em 1280. Como não sobrou CSS para esse requisito, não há mutante possível; um check que só serve de guarda é aceitável aqui.

**Ressalva (lacuna menor).** A justificativa em `tasks.md:205` diz que as duas regras "não tinham efeito". Isso não é verdade. A sonda também mede texto, e mostra:

- Em `1193cd1`, nos 6 casos (360 e 1280 × três telas), o botão cobre a linha "Informações comunitárias sujeitas a atualização." do rodapé (`src/App.tsx:169`). Em 1280 aparece só "Informações comu…"; o resto fica embaixo do botão, e não dá para rolar mais.
- Com as duas regras de volta (mesmo build, mesma origem 4178, mesmo estado), o botão não cobre texto em nenhum dos 6 casos.

Ou seja, as regras afastavam o botão do conteúdo, só que o conteúdo coberto é texto, não um controle. O critério fala de "botão ou link", então ele passa. Mas o problema que a spec cita na introdução ("um botão flutuante que cobre o conteúdo", `spec.md:5`) volta a aparecer, e isso é visível numa apresentação.

---

## Qualidade do código

| Princípio | Status |
| --------- | ------ |
| Código mínimo | ✅ CSS órfão removido |
| Mudanças cirúrgicas | ✅ |
| Sem escopo extra | ✅ |
| Segue os padrões | ✅ |
| Asserções iguais ao resultado da spec | ✅ |
| Cobertura por camada | ✅ |
| Todo teste mapeia para AC, borda ou Done-when | ✅ |
| Diretrizes do projeto | nenhuma documentada; usei padrões fortes |

Observação nova: o botão de voltar da página do local mostra "Voltar ao Explorar", mas o nome acessível é `aria-label="Voltar para a lista e mapa de estabelecimentos"` (`src/views/EstablishmentDetailView.tsx:109`). O nome não contém o texto visível (WCAG 2.5.3, "Label in Name"), e o mapa já não existe. O `aria-label` já era assim antes desta feature.

---

## Lacunas restantes, em ordem de prioridade

1. **Botão flutuante cobre texto do rodapé** (Menor, não bloqueia). Volte a reservar espaço no fim da página (por exemplo, recolocar `footer.bg-blue-950 { padding-bottom: 104px; }` e o `padding-bottom` do `body` abaixo de 1024 px). Se quiser prova, estenda `launcherOverlaps` para medir texto também. Assim a regra passa a ter um teste que discrimina. Corrija também a frase de `tasks.md:205`.
2. **`aria-label` do botão de voltar** diferente do texto visível (`EstablishmentDetailView.tsx:109`). A correção é remover o `aria-label` ou trocá-lo por "Voltar ao Explorar".
3. Pontos de precisão sem mudança: PRES-04 (o teste só olha o Explorar), PRES-16 (o clique só cobre rotas).

---

## Rastreabilidade

Veredito PASS: os 27 critérios passam de `Implementing` para `Verified` em `spec.md`.

## Verificações determinísticas

O Python não está instalado, então `validate_state.py` não rodou. Conferi lendo o script (`_verdict`, `.claude/skills/tlc-spec-driven/scripts/validate_state.py:52-71`). Ele só olha a linha do resultado em negrito (no topo) e títulos de validação; aqui essa linha tem um único valor, e o relatório cita evidência `file:line`. O script retornaria 0.

Lições sugeridas para `.specs/LESSONS.md` (não gravei, fora do que o Verifier pode escrever):
- Antes de dizer que um CSS "não tem efeito", meça o que ele protege (texto também, não só controles), com o mesmo build e a mesma origem.
- Teste de arredondamento precisa de um caso em que `round`, `ceil` e `floor` deem resultados diferentes.
