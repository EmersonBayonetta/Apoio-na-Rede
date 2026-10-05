# Compatibilidade com Minhas Necessidades Validation

**Date**: 2026-10-05 (rodada 2)
**Spec**: `.specs/features/needs-compatibility/spec.md`
**Diff range**: `96c0595..b867fc3` (9 commits: `1dd6cb8`, `5eb77cb`, `bb49e2e`, `cc7de8a`, `20c3611`, `399221e`, `bd7ce90`, `88d7f70`, `b867fc3`)
**Verifier**: subagente independente (autor ≠ verificador)

**Verdict**: PASS
**Result**: PASS

Resumo: o commit `b867fc3` fechou as duas lacunas de cobertura da rodada 1. Os mutantes B14 e B15 agora morrem. As duas novas mutações também morrem, e as duas de regressão continuam morrendo. As lacunas de COMP-10 (popup do mapa) e COMP-12 (nota nos cards) foram resolvidas com linhas de premissa na spec, que considero razoáveis. B13 continua sobrevivendo, mas agora é uma exceção registrada na spec (`spec.md:39`), e a leitura do código confirma a ligação.

---

## Rodada 2

### O que mudou em `b867fc3`

- `src/views/ExplorerView.tsx:784`: a nota "Comparação com as informações cadastradas. Não é uma certificação de acessibilidade." aparece uma vez acima da lista quando há requisitos marcados.
- `tests/browser-needs.mjs`: novos testes de COMP-04 (`BN:50-60`), COMP-12 na lista (`BN:107-111`) e COMP-20 pelo formulário de cadastro (`BN:126-139`).
- `spec.md:38-40`: premissas para grupos vazios (COMP-10), popup do mapa (COMP-10) e nota nos cards (COMP-12).
- `spec.md:1`: título corrigido.

### Gate (árvore real, só leitura, HEAD `b867fc3`)

| Comando | Resultado |
| ------- | --------- |
| `npx tsc -b` | exit 0 |
| `npm run lint` | exit 0. Os mesmos 2 avisos `only-export-components` de antes (`AccessibilityContext.tsx:233`, `DisabilityBadge.tsx:13`). Nenhum aviso novo |
| `npm test` | 46 passaram, 0 falharam, 0 pulados |
| `node tests/browser-needs.mjs` (CDP 9223, preview 4176) | passou |
| `node tests/browser-community.mjs` | passou |

`browser-regressions.mjs` não foi pedido nesta rodada. Na rodada 1 ele já falhava no mesmo passo antes da feature, e o arquivo não mudou.

### Sensor (worktree em `b867fc3`)

Montagem: `git worktree add --detach` na pasta de rascunho, `node_modules` ligado por junction, build com `vite build --outDir <rascunho>/dist-mut`, preview próprio na porta 4178 e cópia de `tests/browser-needs.mjs` com a porta trocada de 4176 para 4178. Um mutante por vez, aplicado por troca exata de texto (o script para se o trecho não aparece exatamente uma vez). O arquivo é restaurado do backup depois de cada um. Antes dos mutantes, a linha de base passou na porta 4178.

| # | Arquivo | Mutação | Resultado |
| - | ------- | ------- | --------- |
| B14 (reexecução) | `AccessibilityContext.tsx:57` | `parseRequirementProfile(...)` trocado por `JSON.parse` cru, dentro de try/catch que devolve `{}` | ✅ Morto (`BN:55`, caso `{"rampa":"sempre",...}`) |
| B15 (reexecução) | `MerchantRegisterWizard.tsx:98` | `tipo: item.tipo` trocado por `tipo: 'mobilidade'` | ✅ Morto (`BN:137`) |
| N1 (nova) | `ExplorerView.tsx:784` | Nota acima da lista removida (`false &&`) | ✅ Morto (`BN:110`) |
| N2a (nova) | `MerchantRegisterWizard.tsx:150` | Remove `recurso` do critério gravado | ✅ Morto (`BN:138`) |
| N2b (nova) | `MerchantRegisterWizard.tsx:148` | Remove `tipo_deficiencia` do critério gravado | ✅ Morto (`BN:137`) |
| B9 (regressão) | `RequirementsMatch.tsx:16` | Nota da página do local encurtada | ✅ Morto (`BN:88`) |
| B3 (regressão) | `ExplorerView.tsx:181` | Filtro de indispensáveis invertido | ✅ Morto (`BN:123`) |
| B13 (exceção) | `AccessibilitySummary.tsx:20` | Remove `RequirementsMatch` do popup | Sobreviveu, como esperado. Aceito pela premissa `spec.md:39` |

**Result**: 7/7 mortos entre os mutantes cobráveis. B13 é uma exceção registrada.

**B13 conferido pela leitura do código**:
- `src/components/accessibility/AccessibilitySummary.tsx:4` importa `RequirementsMatch`. A linha 12 recebe `requirements`, e a linha 20 renderiza `<RequirementsMatch criteria={criteria} requirements={requirements} />`.
- `src/components/maps/GoogleMap.tsx:46` lê `requirements` de `useAccessibility()`. A linha 172 passa `requirements={requirements}` para `AccessibilitySummary` no popup de cada estabelecimento. A linha 198 inclui `requirements` nas dependências do efeito, então o popup é refeito quando o perfil muda.
- O componente do popup é o mesmo `RequirementsMatch` testado na página do local (`BN:83-94`). O comentário em `RequirementsMatch.tsx:4` explica por que o perfil chega como prop: o popup é renderizado com `renderToString`, fora do provider.

**Isolamento**: HEAD continua em `main` / `b867fc3`. `git status --porcelain` da árvore real ficou igual ao do início (só os 5 itens não rastreados que já existiam). Antes de remover o worktree, desfiz a junction de `node_modules` com `rmdir`, e o `node_modules` real continuou intacto. Depois rodei `git worktree remove` e `git worktree prune`. A pasta `dist-mut` foi apagada. Só encerrei o preview que eu mesmo abri na porta 4178, pelo PID que estava nessa porta. 4173, 4176, 9222 e 9223 continuam no ar. O `dist/` real não foi refeito.

### Premissas da spec (COMP-10 e COMP-12)

- **COMP-10, popup do mapa** (`spec.md:39`): razoável. O Google Maps não carrega offline, e o popup usa o mesmo componente que é testado na página do local. A ligação é curta e foi conferida acima. O risco que sobra é alguém tirar a linha `AccessibilitySummary.tsx:20` sem perceber, já que nenhum teste pegaria isso (B13).
- **COMP-10, grupos vazios** (`spec.md:38`): razoável. O EARS pede que os requisitos apareçam agrupados, não que todo título apareça. Isso bate com `RequirementsMatch.tsx:12` (`groups.filter(([, items]) => items.length)`) e com `BN:86` (o grupo "Não atendidos" fica ausente quando não há itens).
- **COMP-12, nota nos cards** (`spec.md:40`): razoável. Com requisitos marcados, a lista mostra a compatibilidade nos selos e a nota uma vez acima deles (`ExplorerView.tsx:784`). A página do local mostra a nota dentro do bloco (`RequirementsMatch.tsx:16`). Assim, toda superfície que exibe compatibilidade tem a nota. A ressalva é que o texto do EARS em `spec.md:76` não foi reescrito, então quem ler só o critério não vê a premissa. Ela aparece logo acima, na tabela de premissas.

---

## Spec-Anchored Acceptance Criteria

Arquivos: `NC` = `tests/needs-compatibility.test.mjs`, `SR` = `tests/sensory-resources.test.mjs`, `BN` = `tests/browser-needs.mjs`. As linhas de `BN` são as de `b867fc3`.

| AC | Resultado exigido pela spec | `file:line` + asserção | Resultado |
| -- | --------------------------- | ---------------------- | --------- |
| COMP-01 | 12 recursos, níveis "Indispensável", "Desejável", "Não preciso", padrão "Não preciso", na seção "Meus requisitos" do modal "Ajustes" | `BN:44` 12 recursos; `BN:45` todos `=== 'Não preciso'`; `BN:46` rótulos `'Indispensável\|Desejável\|Não preciso'`; seção aberta pelo botão "Ajustes" (`BN:42`) | ✅ PASS |
| COMP-02 | Guarda em `apoio_requirements_v1` e restaura ao recarregar | `BN:62-71` grava `{ banheiro_pcd: 'indispensavel', area_descanso: 'desejavel' }` e restaura depois do reload | ✅ PASS |
| COMP-03 | "Limpar requisitos" volta tudo para "Não preciso" | `BN:73-79`: todos "Não preciso", armazenamento `{}`, mantido depois do reload | ✅ PASS |
| COMP-04 | Valor inválido, recurso ou nível desconhecido → "Não preciso" | `NC:9-12` no parser. No contexto: `BN:52` grava `'{broken'`, `'["rampa"]'` e `{ rampa: 'sempre', teleporte: 'indispensavel', elevador: 'desejavel' }`, recarrega e abre "Ajustes"; `BN:55` "Rampa" `=== 'Não preciso'`; `BN:56` 12 (ou 11) "Não preciso"; `BN:57` "Elevador" válido continua `'Desejável'`. A leitura passa por `parseRequirementProfile` em `AccessibilityContext.tsx:57` | ✅ PASS (B14 morto) |
| COMP-05 | Nenhum pedido de tipo de deficiência ou diagnóstico | `BN:47` só inputs `radio` `requirement-*`; `BN:48` nenhum `[role="checkbox"]`; leitura de `UserPreferencesModal.tsx` | ✅ PASS |
| COMP-06 | Classificação atendido/não atendido/sem informação | `NC:16-18`; `BN:84-86` | ✅ PASS |
| COMP-07 | Texto exato "Atende X de N requisitos" | `NC:24`, `NC:46`; `BN:83` `'Atende 4 de 5 requisitos'`; `BN:92` `'Atende 0 de 5 requisitos'` | ✅ PASS |
| COMP-08 | Sem informação nunca conta como atendido nem como não atendido | `NC:28-29`; `BN:85-86` | ✅ PASS |
| COMP-09 | "Requisito indispensável não atendido: [rótulo]" | `NC:38`; `BN:93` texto exato com "Rampa"; `BN:87` ausente quando não há falha | ✅ PASS |
| COMP-10 | Grupos "Atendidos", "Não atendidos", "Sem informação" no popup do mapa e no painel do local | Painel: `BN:84-86`, `BN:94`. Popup: leitura de código (`AccessibilitySummary.tsx:20`, `GoogleMap.tsx:46,172,198`), conforme a premissa `spec.md:39`. Grupos vazios ocultos (`RequirementsMatch.tsx:12`, premissa `spec.md:38`, `BN:86`) | ✅ PASS com exceção registrada (popup sem teste executável) |
| COMP-11 | Sem requisitos, nenhuma compatibilidade | `NC:41`; bloco ausente na página; `BN:106` nenhum selo; `BN:108` nenhuma nota na lista | ✅ PASS |
| COMP-12 | Nota exata quando a compatibilidade é exibida | Página do local: `BN:88` contém o texto exato. Lista: `BN:110` `.requirements-note` `textContent === note` (`BN:20`, texto exato); `BN:108` ausente sem requisitos. Fonte: `ExplorerView.tsx:784`, premissa `spec.md:40` | ✅ PASS (N1 e B9 mortos) |
| COMP-13 | Selo "Atende X de N requisitos" | `BN:104` `'Café Acessível': 'Atende 4 de 5 requisitos'` | ✅ PASS |
| COMP-14 | Selo com "Indispensável não atendido" | `BN:104` `'Bar Degrau': 'Atende 0 de 5 requisitos· Indispensável não atendido'` | ✅ PASS |
| COMP-15 | Card sem cadastro → "Sem informações para seus requisitos" | `BN:104` `'Escola Municipal'` | ✅ PASS |
| COMP-16 | Filtro aparece com indispensável, desligado por padrão | `BN:114`; `BN:116` e `BN:118` ausente; `BN:120` `checked === false` | ✅ PASS |
| COMP-17 | Filtro ligado oculta indispensável não atendido | `BN:123` sai "Bar Degrau"; `BN:125` volta; `NC:50-54` | ✅ PASS (B3 morto) |
| COMP-18 | Filtro mantém indispensável só sem informação | `BN:123` mantém "Café Acessível" e "Escola Municipal"; `NC:52-53` | ✅ PASS |
| COMP-19 | 3 recursos sensoriais, rótulos exatos, Sim/Não/Não verificado | `SR:13-14`, `SR:18-20` | ✅ PASS |
| COMP-20 | No cadastro, os 3 recursos ficam com tipo `intelectual` | `SR:28` no helper, para os 3. No formulário: `BN:126-135` preenche o wizard e marca "Área de descanso..." = Sim; `BN:137` `tipo_deficiencia === 'intelectual'`; `BN:138` `recurso === 'area_descanso'`; `BN:139` `presente === true` | ✅ PASS (B15, N2a e N2b mortos). Ressalva menor: o teste de navegador confere só 1 dos 3 recursos. Os outros 2 passam pelo mesmo caminho (`MerchantRegisterWizard.tsx:97-98`) e estão cobertos por `SR:28` |

**Status**: 20/20 ACs com evidência. 19 por teste executável. COMP-10 no popup é verificado por leitura de código, como exceção registrada na spec.

---

## Edge Cases

- [x] Relatos contraditórios → sem informação: `NC:33-34`. U8 morto na rodada 1.
- [x] Todos "Desejável" → sem filtro: `BN:117-118`. B6 morto na rodada 1.
- [x] Valor guardado corrompido (`'{broken'`, array, nível desconhecido): `BN:52-57`. B14 morto.

---

## Histórico da rodada 1 (diff `96c0595..88d7f70`)

- Gate: tsc ok, lint sem avisos novos, 46/46 unitários, `browser-needs` e `browser-community` passaram. `browser-regressions` falhava em `Missing button: Lista` no mesmo passo de `96c0595`, ou seja, já falhava antes da feature.
- Testes: 34 antes da feature, 46 depois (+12). Nenhum removido ou enfraquecido.
- Sensor: 23 mutações (U1-U8 de unidade, B1-B15 de UI). 20 mortas. B13, B14 e B15 sobreviveram → FAIL.
- Fix plans da rodada 1 e como ficaram:
  1. COMP-20 no cadastro → resolvido (`BN:126-139`, B15 morto).
  2. COMP-04 no contexto → resolvido (`BN:50-60`, B14 morto).
  3. COMP-12 nos cards → resolvido com nota acima da lista (`ExplorerView.tsx:784`, `BN:107-111`, premissa `spec.md:40`).
  4. COMP-10 no popup → resolvido como exceção registrada (`spec.md:38-39`).
  5. Título corrompido de `spec.md` → corrigido (`spec.md:1`).

---

## Code Quality

| Princípio | Status |
| --------- | ------ |
| Código mínimo | ✅ A correção de produção tem uma linha (`ExplorerView.tsx:784`) |
| Mudanças cirúrgicas | ✅ `b867fc3` só mexe em `ExplorerView.tsx`, `browser-needs.mjs`, `spec.md` e `validation.md` |
| Resultado exato da spec | ✅ A nota da lista usa o texto exato e o teste compara com igualdade (`BN:110`) |
| Cobertura por camada | ✅ Domínio 1:1 com os ACs. O e2e agora cobre a leitura do perfil guardado e o cadastro. Fica de fora só o popup, por exceção registrada |
| Testes ligados a AC | ✅ Cada bloco novo tem um comentário com o ID do AC |

Observações menores, que não bloqueiam:
- `BN:128` navega para `http://127.0.0.1:4176/` com a porta fixa no meio do teste. Isso segue o padrão do arquivo (`BN:27`, `BN:37`), mas é mais um ponto a trocar quando a porta mudar.
- O comentário em `BN:107` diz que a nota "acompanha os selos". O teste confere a nota na lista, não em cada card, o que bate com a premissa.

---

## Scripts determinísticos

O Python não está instalado, então `validate_state.py` e `lessons.py` não rodaram. Conferi lendo: este relatório existe, tem `**Verdict**: PASS` e `**Result**: PASS` e cita `file:line` para cada AC. Pelo critério do script, ele deveria sair com código 0. Lições a registrar quando houver Python:

1. Testar a ligação de um helper puro na tela que o usa, não só o helper (B14 e B15 só morreram depois do teste de ponta a ponta).
2. Quando um AC cita mais de uma superfície e uma delas não roda no ambiente de teste, registrar a exceção na tabela de premissas da spec e conferir a ligação lendo o código (B13).

---

## Requirement Traceability Update

Veredito PASS: COMP-01 a COMP-20 passam de `Implementing` para `Verified` em `spec.md`. O item "Done when" da linha 162 da spec não foi alterado, porque está fora do que me foi permitido editar.

---

## Summary

**Overall**: ✅ Ready

**Spec-anchored check**: 20/20 ACs com evidência. COMP-10 no popup é verificado por leitura de código, como exceção registrada.
**Sensor (rodada 2)**: 7/7 mortos (B14, B15, N1, N2a, N2b, B9, B3). B13 sobrevive como exceção aceita.
**Gate**: tsc ok, lint sem avisos novos, 46/46 unitários, `browser-needs` e `browser-community` passam.

**Lacunas que ficam (não bloqueiam)**: o popup do mapa não tem teste executável. O texto do EARS de COMP-12 não cita a premissa da lista. O teste de navegador de COMP-20 confere 1 dos 3 recursos sensoriais.
