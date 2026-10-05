# Compatibilidade com Minhas Necessidades Validation

**Date**: 2026-10-05
**Spec**: `.specs/features/needs-compatibility/spec.md`
**Diff range**: `96c0595..88d7f70` (8 commits de código e docs: `1dd6cb8`, `5eb77cb`, `bb49e2e`, `cc7de8a`, `20c3611`, `399221e`, `bd7ce90`, `88d7f70`)
**Verifier**: subagente independente (autor ≠ verificador)

**Verdict**: FAIL
**Result**: FAIL

Motivo em uma linha: a lógica e as telas testáveis estão corretas e bem cobertas, mas 3 mutantes sobreviveram. Dois deles (COMP-20 no cadastro e COMP-04 na leitura do valor guardado) são falhas de cobertura que dá para testar offline. Pela regra do `validate.md`, mutante sobrevivente vira tarefa de correção antes de marcar a feature como pronta.

---

## Task Completion

| Task | Status | Notes |
| ---- | ------ | ----- |
| T1 | ✅ Done | Wizard e mapa de ícones também mudaram (desvio registrado). |
| T2 | ✅ Done | - |
| T3 | ✅ Done | Novo botão "Ajustes" no cabeçalho desktop (desvio registrado). |
| T4 | ⚠️ Done sem teste próprio | O popup do mapa não roda offline. O bloco só é testado na página do local (T5). |
| T5 | ✅ Done | - |
| T6 | ✅ Done | Endereço buscado não ganha selo (desvio registrado). |
| T7 | ✅ Done | - |

---

## Spec-Anchored Acceptance Criteria

Arquivos: `NC` = `tests/needs-compatibility.test.mjs`, `SR` = `tests/sensory-resources.test.mjs`, `BN` = `tests/browser-needs.mjs`.

| AC | Resultado exigido pela spec | `file:line` + asserção | Resultado |
| -- | --------------------------- | ---------------------- | --------- |
| COMP-01 | 12 recursos, níveis "Indispensável", "Desejável", "Não preciso", padrão "Não preciso", na seção "Meus requisitos" do modal "Ajustes" | `BN:42` `assert.equal(Object.keys(defaults).length, 12)`; `BN:43` todos `=== 'Não preciso'`; `BN:44` rótulos `=== 'Indispensável\|Desejável\|Não preciso'` em todo fieldset; seção localizada por `section[aria-labelledby="requirements-title"]` dentro do diálogo aberto pelo botão "Ajustes" (`BN:38`) | ✅ PASS |
| COMP-02 | Guarda em `apoio_requirements_v1` e restaura ao recarregar | `BN:52` `assert.deepEqual(JSON.parse(localStorage.getItem('apoio_requirements_v1')), { banheiro_pcd: 'indispensavel', area_descanso: 'desejavel' })`; `BN:55-57` após reload: "Indispensável", "Desejável" e 10 "Não preciso" | ✅ PASS |
| COMP-03 | "Limpar requisitos" volta tudo para "Não preciso" | `BN:61` todos `=== 'Não preciso'` após o clique; `BN:63` armazenamento `{}` após salvar; `BN:65` mantido após reload | ✅ PASS |
| COMP-04 | Valor inválido, recurso ou nível desconhecido → "Não preciso" | `NC:9-11` `null`, `'{broken'`, `'["rampa"]'` → `{}`; `NC:12` descarta `teleporte`, `'sempre'`, `'nao_preciso'` e mantém só `{ rampa, banheiro_pcd }` | ⚠️ PASS na unidade; a ligação no contexto (`src/context/AccessibilityContext.tsx:57`) não é testada (mutante B14 sobreviveu) |
| COMP-05 | Nenhum pedido de tipo de deficiência ou diagnóstico na seção | `BN:45` todos os inputs são `radio` com `name` `requirement-*`; `BN:46` nenhum `[role="checkbox"]` na seção | ✅ PASS (asserção negativa um pouco fraca: não procura texto de tipo de deficiência; a leitura do código em `UserPreferencesModal.tsx:172-204` confirma que a seção só tem os 12 recursos) |
| COMP-06 | Classificação atendido/não atendido/sem informação via `resourceState` | `NC:16-18` `atendidos=['rampa']`, `naoAtendidos=['elevador']`, `semInformacao=['banheiro_pcd']`; `BN:70-72` grupos na página do local | ✅ PASS |
| COMP-07 | Texto exato "Atende X de N requisitos" | `NC:24` `=== 'Atende 4 de 5 requisitos'`; `NC:46` `'Atende 0 de 2 requisitos'`; `BN:69` `'Atende 4 de 5 requisitos'`; `BN:77` `'Atende 0 de 5 requisitos'` | ✅ PASS |
| COMP-08 | Sem informação nunca conta como atendido nem como não atendido | `NC:28` `[0, 0, 2]`; `NC:29` `indispensaveisNaoAtendidos` `[]`; `BN:71-72` banheiro em "Sem informação" e grupo "Não atendidos" ausente | ✅ PASS |
| COMP-09 | Destaque exato "Requisito indispensável não atendido: [rótulo]" | `NC:38` `['Banheiro PCD']` (só o indispensável); `BN:78` existe `p` com `textContent === 'Requisito indispensável não atendido: Rampa'`; `BN:73` ausente quando não há falha | ✅ PASS |
| COMP-10 | Grupos "Atendidos", "Não atendidos", "Sem informação" no popup do mapa **e** no painel do local | Página do local: `BN:70-72`, `BN:79` (`h4` com os três títulos). Popup do mapa: só leitura de código (`AccessibilitySummary.tsx:20`, `GoogleMap.tsx:172`) | ⚠️ Parcial: o popup não tem evidência executável (mutante B13 sobreviveu). Grupos vazios não são exibidos (`RequirementsMatch.tsx:12`); a spec não diz se grupo vazio deve aparecer |
| COMP-11 | Sem requisitos, nenhuma compatibilidade | `NC:41` `compareRequirements(..., {}) === null`; `BN:83` bloco ausente na página; `BN:92` nenhum selo nos cards | ✅ PASS |
| COMP-12 | Nota exata "Comparação com as informações cadastradas. Não é uma certificação de acessibilidade." quando a compatibilidade é exibida | `BN:74` `textContent.includes('Comparação com as informações cadastradas. Não é uma certificação de acessibilidade.') === true` na página do local | ⚠️ Spec-precision gap: o selo do card também exibe compatibilidade ("Atende X de N requisitos") e não mostra a nota (`PlaceResultCard.tsx:22-25`). A spec não diz se o selo conta |
| COMP-13 | Selo "Atende X de N requisitos" no card de local cadastrado | `BN:90` `'Café Acessível': 'Atende 4 de 5 requisitos'` | ✅ PASS |
| COMP-14 | Selo com "Indispensável não atendido" | `BN:90` `'Bar Degrau': 'Atende 0 de 5 requisitos· Indispensável não atendido'` | ✅ PASS |
| COMP-15 | Card sem local cadastrado → "Sem informações para seus requisitos" | `BN:90` `'Escola Municipal': 'Sem informações para seus requisitos'` (OSM simulado) | ✅ PASS |
| COMP-16 | Filtro "Ocultar locais com requisito indispensável não atendido" aparece com indispensável, desligado por padrão | `BN:94` localiza o `label` pelo texto exato; `BN:96` ausente sem requisitos; `BN:100` `checked === false` | ✅ PASS |
| COMP-17 | Filtro ligado oculta locais com indispensável não atendido | `BN:103` lista vira `['Café Acessível', 'Escola Municipal']` (sai "Bar Degrau"); `BN:105` volta ao desligar; `NC:50-54` `hasUnmetEssential` | ✅ PASS |
| COMP-18 | Filtro ligado mantém locais com indispensável só sem informação | `BN:103` mantém "Café Acessível" (banheiro indispensável = `null`) e "Escola Municipal" (sem cadastro); `NC:52-53` `false` para `[]` e `undefined` | ✅ PASS |
| COMP-19 | 3 recursos sensoriais com os rótulos exatos e estados Sim/Não/Não verificado | `SR:13` rótulos exatos; `SR:14` 12 recursos; `SR:18-20` `'sim'`, `'nao'`, `'desconhecido'` | ✅ PASS |
| COMP-20 | No cadastro, os 3 recursos ficam com tipo `intelectual` | `SR:28` `registrationCriteriaTemplates` devolve `{ tipo: 'intelectual', criterio }` para cada um | ⚠️ PASS só no helper; o uso no cadastro (`MerchantRegisterWizard.tsx:97-98`, gravado em `tipo_deficiencia` na linha 148) não é testado (mutante B15 sobreviveu) |

**Status**: 16/20 ACs com o resultado exato da spec confirmado em teste. 4 com lacuna: COMP-04 (ligação), COMP-10 (popup), COMP-12 (spec-precision), COMP-20 (ligação).

Cobertas só por leitura de código: COMP-10 no popup do mapa; COMP-04 e COMP-20 nas ligações com contexto e cadastro.

---

## Edge Cases

- [x] Relatos contraditórios → sem informação: `NC:33` `semInformacao === ['rampa']` e `NC:34` `hasUnmetEssential(...) === false`. Mutante U8 morto.
- [x] Todos "Desejável" → sem filtro: `BN:97-98` com `{ rampa: 'desejavel', banheiro_pcd: 'desejavel' }` o filtro não existe. Mutante B6 morto.

---

## Gate Check (árvore real, só leitura)

| Comando | Resultado |
| ------- | --------- |
| `npx tsc -b` | exit 0 |
| `npm run lint` | exit 0; 2 avisos `only-export-components` (`DisabilityBadge.tsx:13`, `AccessibilityContext.tsx:233`). Os dois já existiam em `96c0595` (o segundo estava na linha 221). Nenhum aviso novo |
| `npm test` | 46 passaram, 0 falharam, 0 pulados |
| `node tests/browser-needs.mjs` (CDP 9223, preview 4176) | passou |
| `node tests/browser-community.mjs` | passou |
| `node tests/browser-regressions.mjs` (CDP 9222, preview 4173) | falha em `Missing button: Lista` depois de 10 PASS |

- **Testes antes da feature**: 34 (rodado em worktree de `96c0595`).
- **Testes depois**: 46. **Delta**: +12 (3 em `SR`, 9 em `NC`). Nenhum teste removido ou enfraquecido.
- **browser-regressions é anterior à feature**: o arquivo não mudou no intervalo. Montei `96c0595` em worktree, servi na porta 4179 e rodei uma cópia do teste. Ele falha no mesmo passo (`Missing button: Lista`, linha 39) com os mesmos 10 PASS, idênticos aos de `88d7f70`. Nenhum passo anterior regrediu. O que vem depois desse passo não roda em nenhuma das duas versões, então não tem cobertura.
- **Build do `dist/` real**: não foi refeito. Rodei `browser-needs` também contra um build novo de `88d7f70` (porta 4178) e passou.

---

## Discrimination Sensor

Worktree descartável em `88d7f70`, `node_modules` ligado por junction, um mutante por vez, arquivo restaurado a partir de backup depois de cada um.
Unidade: `node --test tests/needs-compatibility.test.mjs tests/sensory-resources.test.mjs`.
UI: `npx vite build --outDir <scratch>/dist-mut`, preview na porta 4178, cópia de `browser-needs.mjs` apontando para 4178.

| # | Arquivo | Mutação | Resultado |
| - | ------- | ------- | --------- |
| U1 | `src/utils/needsCompatibility.ts:40` | `desconhecido` conta como atendido | ✅ Morto (4 falhas) |
| U2 | `src/utils/needsCompatibility.ts:43` | Remove o filtro `level === 'indispensavel'` | ✅ Morto (2) |
| U3 | `src/utils/needsCompatibility.ts:23` | Parser aceita qualquer nível em texto | ✅ Morto (1) |
| U4 | `src/data/accessibilityResources.ts:13-15` | Recursos sensoriais com `tipo: 'mobilidade'` | ✅ Morto (1) |
| U5 | `src/utils/needsCompatibility.ts:37` | `desconhecido` conta como não atendido | ✅ Morto (4) |
| U6 | `src/utils/needsCompatibility.ts:48` | Rótulo usa `total - naoAtendidos` | ✅ Morto (2) |
| U7 | `src/utils/needsCompatibility.ts:35` | Perfil vazio não devolve `null` | ✅ Morto (1) |
| U8 | `src/data/accessibilityResources.ts:24` | Relatos contraditórios viram `sim` | ✅ Morto (1) |
| B1 | `PlaceResultCard.tsx:24` | "Indispensável não atendido" → "Indispensável pendente" | ✅ Morto (`BN:90`) |
| B2 | `PlaceResultCard.tsx:23` | Card sem cadastro mostra "Atende 0 de N" | ✅ Morto (`BN:90`) |
| B3 | `ExplorerView.tsx:181` | Filtro invertido | ✅ Morto (`BN:103`) |
| B4 | `ExplorerView.tsx:181` | Filtro também oculta locais sem cadastro | ✅ Morto (`BN:103`) |
| B5 | `ExplorerView.tsx:130` | Filtro ligado por padrão | ✅ Morto (`BN:90`) |
| B6 | `ExplorerView.tsx:129` | Filtro aparece com qualquer requisito | ✅ Morto (`BN:98`) |
| B7 | `AccessibilityContext.tsx:8` | Chave `apoio_requirements_v2` | ✅ Morto (`BN:52`) |
| B8 | `AccessibilityContext.tsx:104` | Não grava no armazenamento | ✅ Morto (`BN:52`) |
| B9 | `RequirementsMatch.tsx:16` | Nota encurtada | ✅ Morto (`BN:74`) |
| B10 | `RequirementsMatch.tsx:11` | Texto do destaque trocado | ✅ Morto (`BN:79`) |
| B11 | `UserPreferencesModal.tsx:200` | "Limpar requisitos" não faz nada | ✅ Morto (`BN:61`) |
| B12 | `UserPreferencesModal.tsx:186` | Padrão "Desejável" | ✅ Morto (`BN:43`) |
| B13 | `AccessibilitySummary.tsx:20` | Remove `RequirementsMatch` do popup do mapa | ❌ Sobreviveu |
| B14 | `AccessibilityContext.tsx:57` | Contexto usa `JSON.parse` cru em vez de `parseRequirementProfile` | ❌ Sobreviveu |
| B15 | `MerchantRegisterWizard.tsx:98` | Cadastro grava `tipo: 'mobilidade'` para todos | ❌ Sobreviveu |

**Sensor depth**: ampliado (23 mutações, 8 de unidade e 15 de UI).
**Result**: 20/23 mortos, 3 sobreviveram → FAIL.

Isolamento: `git status --porcelain` da árvore real ficou igual ao do início. HEAD continua em `main` / `88d7f70`. Worktrees removidos e `git worktree prune` executado. Só os previews que iniciei (4178 e 4179) foram encerrados. 4173, 4176, 9222 e 9223 continuam no ar.

---

## Code Quality

| Princípio | Status |
| --------- | ------ |
| Código mínimo | ✅ `needsCompatibility.ts` com 53 linhas e 4 funções puras; um único componente `RequirementsMatch` |
| Mudanças cirúrgicas | ✅ Cada arquivo mudado tem relação com a feature. Wizard, ícones e botão "Ajustes" no desktop estão justificados em `tasks.md` |
| Sem scope creep | ✅ Mapa não filtrado e ordem preservada, como diz a spec |
| Segue os padrões | ✅ `browserStorage` igual às preferências; testes no estilo dos já existentes (`node:test`, CDP) |
| Resultado exato da spec | ⚠️ COMP-12 no card (ver lacuna 3) |
| Cobertura por camada | ⚠️ Domínio 1:1 com os ACs; e2e sem cobrir cadastro, popup e leitura de valor inválido |
| Todo teste mapeia para AC, edge case ou Done-when | ✅ |
| Diretrizes documentadas | nenhuma (sem `AGENTS.md`/`CONTRIBUTING.md`); padrões fortes aplicados |

Fora do código, um defeito em docs: a linha 1 de `spec.md` está corrompida. O título começa com 20 cópias de `Implementing |` (`Implementing |Implementing |...# Compatibilidade com Minhas Necessidades Specification`). O problema apareceu em `5eb77cb` (6 cópias) e cresceu a cada commit até `88d7f70`. Provavelmente um `sed` de atualização da tabela de rastreabilidade pegou a linha 1. Não corrigi porque está fora do que me foi permitido editar.

---

## Scripts determinísticos

O Python não está instalado, então `validate_state.py` e `lessons.py` não rodaram. Conferi lendo: este relatório existe, tem `**Verdict**` preenchido (FAIL) e tem várias citações `file:line`. Pelo critério do script, ele sairia com código diferente de zero por causa do FAIL, o que está correto. Lições a registrar quando houver Python, com base nos sobreviventes:

1. Testar a ligação de um helper puro na tela que o usa, não só o helper (B14, B15).
2. Quando um AC cita mais de uma superfície ("popup do mapa e painel do local"), cada uma precisa de evidência própria ou de uma exceção registrada na spec (B13).

---

## Fix Plans (lacunas ordenadas)

### 1. COMP-20 sem teste no cadastro (Major)
- **Causa**: `SR:28` testa só `registrationCriteriaTemplates`. O mutante B15 sobreviveu.
- **Correção**: em `tests/browser-needs.mjs` (ou em `browser-regressions`, mas esse já quebra antes), cadastrar um local pelo wizard marcando "Área de descanso ou espaço tranquilo" = Sim e checar `JSON.parse(localStorage.getItem('acessacidade_criteria'))` → o critério com o `legacy` de `area_descanso` tem `tipo_deficiencia === 'intelectual'`. Isso também cobre o Independent Test da story ("vê-lo como Sim no resumo").
- **Pronto quando**: B15 morto.

### 2. COMP-04 sem teste no contexto (Major)
- **Causa**: o parser só é testado isolado. O mutante B14 sobreviveu.
- **Correção**: em `tests/browser-needs.mjs`, gravar `localStorage.setItem('apoio_requirements_v1', '{"rampa":"indispensavel","teleporte":"indispensavel","elevador":"sempre"}')`, recarregar, abrir "Ajustes" e checar que só "Rampa" está "Indispensável" e os outros 11 estão "Não preciso". Repetir com `'{broken'` e checar que a página carrega e os 12 estão "Não preciso".
- **Pronto quando**: B14 morto.

### 3. COMP-12 no selo do card (Minor, spec-precision)
- **Causa**: o card mostra "Atende X de N requisitos" sem a nota de não certificação.
- **Correção**: decidir com o usuário. Uma opção é mostrar a nota uma vez acima da lista quando houver requisitos (em `ExplorerView.tsx`, junto ao filtro) e testar em `BN`. A outra é mudar COMP-12 para "WHEN o bloco de compatibilidade do local é exibido".

### 4. COMP-10 no popup do mapa (Minor)
- **Causa**: o popup depende do Google Maps, bloqueado nos testes. O mutante B13 sobreviveu.
- **Correção**: registrar na spec, ao lado de COMP-10, que o popup só é verificado por leitura de código. Ou cobrir `AccessibilitySummary` renderizando-o em `PlaceAccessibilityPanel`, ou com um teste de unidade que use `react-dom/server` depois de compilar o TSX. Decidir também se grupos vazios devem aparecer.

### 5. `spec.md` linha 1 corrompida (Cosmetic)
- **Correção**: trocar a linha 1 por `# Compatibilidade com Minhas Necessidades Specification` e corrigir o comando que atualiza a tabela para alterar só as linhas `| COMP-`.

---

## Requirement Traceability Update

Veredito FAIL: os status em `spec.md` ficam como `Implementing`. Quando as lacunas 1 e 2 estiverem corrigidas e a 3 e a 4 decididas, todos podem ir para `Verified`. Os que já têm evidência completa: COMP-01, 02, 03, 05, 06, 07, 08, 09, 11, 13, 14, 15, 16, 17, 18, 19.

---

## Summary

**Overall**: ❌ Not Ready (falta pouco)

**Spec-anchored check**: 16/20 ACs batem com o resultado exato da spec; 4 com lacuna (COMP-04, COMP-10, COMP-12, COMP-20), sendo 1 de spec-precision (COMP-12).
**Sensor**: 20/23 mutantes mortos (B13, B14, B15 sobreviveram).
**Gate**: tsc ok, lint ok sem avisos novos, 46/46 unitários, `browser-needs` e `browser-community` passam. `browser-regressions` falha no mesmo passo de antes da feature.

**O que funciona**: edição e persistência do perfil, comparação e rótulo exato, destaque do indispensável, nota na página do local, selos, filtro e os dois edge cases. Tudo com asserções no valor exato e mutantes mortos.

**Próximos passos**: tarefas de correção 1 e 2 (testes de navegador), decisão sobre 3 e 4, conserto da linha 1 do spec, e depois nova verificação.
