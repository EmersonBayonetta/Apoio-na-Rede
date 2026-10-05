# Integridade do Catálogo Comunitário: validação

**Verdict**: PASS

**Result**: PASS (rodada 2)

**Data**: 2026-10-05
**Spec**: `.specs/features/community-directory-integrity/spec.md`
**Diff range**: `4f68d0e..6ef9a71` (01bba27, 7455706, 131e671, 6ef9a71)
**Verificador**: subagente independente (quem verificou não escreveu o código)

Resumo: a rodada 1 reprovou porque dois mutantes sobreviveram (telefone com 9 dígitos e WhatsApp com 14 dígitos começando com 55). O commit `6ef9a71` só mexe em testes e acrescenta esses dois casos, além de um teste de busca na tela e um teste de cadastro sem telefone e sem WhatsApp. Na rodada 2 os dois mutantes morreram, os 3 mutantes de regressão continuam mortos e o gate passa. As 16 ACs têm evidência com `file:line`.

Observações sobre o processo:
- Não existe `tasks.md` nesta feature, então não há lista de tarefas nem "Gate Check Commands" para conferir. Usei como gate o que o orquestrador pediu.
- O Python não está instalado. Por isso `validate_state.py` e `lessons.py` não rodaram. Li o `validate_state.py` e conferi à mão o que ele exige: uma linha `**Result**:` com só PASS (sem FAIL na mesma linha) e ao menos uma citação no formato `caminho.ext:linha`, como `tests/community-directory.test.mjs:18`. Este relatório atende às duas coisas.
- O incidente de HEAD da rodada 1 está resolvido. No início e no fim desta rodada o repositório real estava em `main`, no commit `6ef9a71`. Nesta rodada não rodei `checkout`, `switch`, `reset` nem `stash` no repositório real. As mutações foram feitas só num worktree separado.

---

## Critérios de aceitação ancorados no spec

Arquivos de teste: `tests/community-directory.test.mjs` (unitário, abaixo `U`) e `tests/browser-community.mjs` (navegador, abaixo `B`). As linhas se referem a `6ef9a71`. As linhas da view se referem a `src/views/CommunityDirectoryView.tsx`, que não mudou entre `131e671` e `6ef9a71`.

| AC | Resultado definido no spec | `file:line` + asserção | Resultado |
| -- | -------------------------- | ---------------------- | --------- |
| COMM-01 | nome/especialidade/cidade/estado só com espaços → "Preencha nome, especialidade, cidade e estado." | U:9-10, laço pelos 4 campos com `'   '`: `assert.throws(..., { message: 'Preencha nome, especialidade, cidade e estado.' })` | ✅ |
| COMM-02 | UF inválida depois de maiúsculas → "Informe uma UF válida." | U:14 `estado: 'zz'` → `{ message: 'Informe uma UF válida.' }`; U:15 `' mg '` → `'MG'`; B:27-28 `assert.equal(await alertText(),'Informe uma UF válida.')` | ✅ |
| COMM-03 | telefone fora de 10/11 dígitos e fora de 0800+7 → "Informe um telefone com DDD." | `tests/community-directory.test.mjs:18-19` rejeita `'3422-1234'` (8), **`'98765-4321'` (9, novo)**, `'123'` e `'(32) 3422-12345-6'` (12) com a mensagem exata; U:21-22 aceita 10, 11 e `'0800 770 7722'` | ✅ (lacuna 1 da rodada 1 fechada: os dois limites de fora, 9 e 12, estão testados) |
| COMM-04 | WhatsApp fora de 10–11 e fora de 12–13 com prefixo 55 → "Informe um WhatsApp com DDD." | `tests/community-directory.test.mjs:26-27` rejeita 9 dígitos, 13 sem 55, 12 com prefixo 1 e **`'+55 32 98765-43210'` (14 com 55, novo)**, com a mensagem exata; U:29 aceita `'+55 (32) 98765-4321'` | ✅ (lacuna 2 da rodada 1 fechada) |
| COMM-05 | válido → textos aparados e UF maiúscula | U:32-33 `assert.deepEqual(saved, { nome: 'Ana', ..., estado: 'MG', endereco: 'Rua A, 1', telefone: '0800 770 7722', ... })`; B:33 `'Cataguases – MG'` | ✅ |
| COMM-06 | rejeitado → mensagem em `role="alert"` e nada é adicionado à lista | B:28 alerta com `'Informe uma UF válida.'`; B:29 `Boolean(article('Ana Teste')) === false`. View: `return` no catch em `src/views/CommunityDirectoryView.tsx:57`, alerta em :86 | ✅ |
| COMM-07 | 10/11 dígitos → `https://wa.me/55` + dígitos | U:36 `'https://wa.me/5532987654321'` (11); U:37 `'https://wa.me/553234221234'` (10); U:38 `(55) 99999-8888` → `'https://wa.me/5555999998888'`; B:39 href `'https://wa.me/5532987654321'` | ✅ |
| COMM-08 | já com 55 e 12/13 dígitos → `https://wa.me/` + dígitos, sem outro 55 | U:39 `'+55 32 98765-4321'` → `'https://wa.me/5532987654321'`; U:40 `'55 32 3422-1234'` → `'https://wa.me/553234221234'` | ✅ |
| COMM-09 | sem WhatsApp válido → sem botão | `tests/community-directory.test.mjs:43` `whatsappUrl(value) === null` para `''`, `undefined`, `'   '`, 9 dígitos, `+1...` e **14 com 55 (novo)**; B:34 sem `a[href^="https://wa.me"]` no card com 0800; B:43 nenhum link no card sem contatos. View :102 | ✅ |
| COMM-10 | WhatsApp vem só do campo WhatsApp | B:35 `whatsapp === ''` no `localStorage` com telefone preenchido; B:38-39 o WhatsApp vem do campo próprio. View :54 `data.get('whatsapp')`, campo em :82 | ✅ |
| COMM-11 | partida/destino/cidade/condições só com espaços → "Preencha partida, destino, cidade e condições observadas." | U:46-47, laço pelos 4 campos com `'  '`; B:50-51 destino `'   '` → `alertText()` com a mensagem exata | ✅ |
| COMM-12 | válido → textos aparados e título "partida → destino" aparado | U:51-56 `assert.deepEqual(saved, { titulo: 'Praça Rui Barbosa → Estação', ... })` | ✅ |
| COMM-13 | rejeitado → `role="alert"` e a lista não muda | B:51 alerta com o texto exato; B:52 `document.querySelectorAll('main article').length === routesBefore`. View :41 `return` no catch | ✅ |
| COMM-14 | profissional encontrado apesar de acento, caixa ou espaços repetidos | U:64 `'  FISIOTERAPIA   sao '` → `[physio]`; U:65 `'clinica'` → `[physio]`; **`tests/browser-community.mjs:44-45` (novo)**: digita `'CLINICA   sao'` no campo de busca e a lista na tela fica exatamente `['Clínica São José']`. View :30 usa `filterProfessionals` | ✅ (lacuna 3 da rodada 1 fechada para profissionais) |
| COMM-15 | trecho encontrado apesar de acento, caixa ou espaços repetidos | U:68 `'estacao  FERROVIARIA'` → `[station]`; U:69 `'sao joao'` → `[station]`. View :31 usa `filterRoutes` | ✅ (na tela só a busca de profissionais é testada; veja a lacuna restante 1) |
| COMM-16 | com filtro de necessidade, só quem atende essa necessidade | U:72 `''` + `'auditiva'` → `[dentist]`; U:73 `'fisioterapia'` + `'auditiva'` → `[]` | ✅ |

**Status**: 16/16 ACs com evidência e valor igual ao do spec. Nenhum resultado do spec é impreciso.

## Casos de borda

- [x] Busca só com espaços lista tudo, respeitando o filtro de necessidade: U:76-78.
- [x] Telefone e WhatsApp vazios: o cadastro é aceito e não há botões de contato. `tests/browser-community.mjs:41-43` (novo) cadastra "Clínica São José" com `phone:''` e `whatsapp:''`; a expressão de :43 lê o card salvo (daria erro se o card não existisse) e confere `querySelectorAll('a[href^="tel:"], a[href^="https://wa.me"]').length === 0`. No nível unitário, U:31-33 aceita `whatsapp: ''` e U:43 dá `whatsappUrl('') === null`. Lacuna 4 da rodada 1 fechada.

---

## Gate (rodada 2)

Rodado no repositório real em `main` (`6ef9a71`), só leitura:

| Comando | Resultado |
| ------- | --------- |
| `npx tsc -b` | exit 0 |
| `npm run lint` (oxlint) | exit 0, os mesmos 2 avisos `only-export-components` de antes (`AccessibilityContext.tsx:221`, `DisabilityBadge.tsx:13`), fora do diff. Nenhum aviso novo |
| `npm test` | 34 testes, 34 passaram, 0 falharam, 0 pulados |
| `node tests/browser-community.mjs` | exit 0, "community directory browser checks passed" (CDP em :9223, `vite preview` em :4176) |

- O `dist/index.html` é das 07:58:37. A view não mudou desde `131e671` (07:32), e `6ef9a71` só mexe em testes, então o build servido corresponde ao código verificado. Não refiz o build.
- Contagem de testes: 34, igual à rodada 1. Os casos novos entraram dentro de testes que já existiam (U:18, U:26, U:43) e no teste de navegador (B:41-45). Nenhum teste foi removido ou enfraquecido: o diff de `6ef9a71` só acrescenta valores e asserções.

---

## Sensor de discriminação (rodada 2)

Baseline `git status --porcelain` do repositório real: `?? .agents/`, `?? .claude/`, `?? .cursor/`, `?? .specs/features/community-directory-integrity/validation.md`, `?? .windsurf/`, `?? docs/funcionalidades-propostas-validacao.md`. Scratch: `git worktree add --detach <scratchpad>/verify-wt2 6ef9a71`. Cada mutação foi aplicada sozinha em `src/utils/communityDirectory.ts`, conferida com `git diff`, e rodou `node --test tests/community-directory.test.mjs` (13 testes).

| # | Linha | Mutação | Rodada 1 | Rodada 2 |
| - | ----- | ------- | -------- | -------- |
| 3 | `src/utils/communityDirectory.ts:6` | telefone aceita 9 dígitos (`[9, 10, 11]`) | ❌ sobreviveu | ✅ morto (1 falha) |
| 14 | `src/utils/communityDirectory.ts:10` | WhatsApp aceita 14 dígitos com 55 (`[12, 13, 14]`) | ❌ sobreviveu | ✅ morto (2 falhas) |
| 1 | :10 | remove `&& number.startsWith('55')` | ✅ morto | ✅ morto (2) — regressão |
| 5 | :42 | busca sensível a acento (só `toLowerCase`) | ✅ morto | ✅ morto (3) — regressão |
| 13 | :6 | telefone aceita 12 dígitos | ✅ morto | ✅ morto (1) — regressão |

Os outros 10 mutantes da rodada 1 não foram repetidos. O código de produção não mudou desde aquela rodada e nenhum teste foi enfraquecido, então eles continuam mortos.

**Resultado**: 5/5 mortos nesta rodada. Somando com a rodada 1: 15/15.
**View**: não foi mutada, porque isso exigiria refazer o build servido em :4176. Pela leitura, a asserção de `tests/browser-community.mjs:45` mata a volta do filtro antigo, sensível a acento: com ele, `'CLINICA   sao'` não casaria com "Clínica São José" e a lista ficaria vazia. Isso não foi executado.
**Isolamento**: worktree removido com `git worktree remove --force` e `git worktree prune`. `git worktree list` mostra só o repositório real em `main` (`6ef9a71`), e o porcelain ficou igual ao baseline.

---

## Rodada 2

- **O que mudou**: `6ef9a71` (`test(community): cover phone and whatsapp length bounds and search wiring`), só em `tests/community-directory.test.mjs` (U:18, U:26, U:43) e `tests/browser-community.mjs` (B:41-45). Nenhum código de produção mudou.
- **Lacuna 1 (telefone com 9 dígitos)**: fechada. `'98765-4321'` foi incluído em U:18 e o mutante 3 morreu.
- **Lacuna 2 (WhatsApp com 14 dígitos e 55)**: fechada. `'+55 32 98765-43210'` foi incluído em U:26 e U:43 e o mutante 14 morreu.
- **Lacuna 3 (ligação da busca na view)**: fechada para profissionais (COMM-14) em B:44-45. A busca de trechos (COMM-15) continua testada só no nível unitário.
- **Lacuna 4 (sem telefone e sem WhatsApp → sem botões)**: fechada em B:41-43.
- **Incidente de HEAD**: resolvido. O repositório está em `main`.

---

## Qualidade do código

| Verificação | Status |
| ----------- | ------ |
| Nada além do pedido | ✅ |
| Sem abstração de uso único | ✅ (`validUf` foi extraída de `registrationValidation.ts` e é usada em dois lugares) |
| Mudanças cirúrgicas, nada fora do escopo | ✅ (6 arquivos, todos da feature; `6ef9a71` só acrescenta testes) |
| Segue o padrão do projeto | ✅ (funções puras em `src/utils`, testes `node:test` em `.mjs`, teste de navegador via CDP como os outros `browser-*.mjs`) |
| Asserções iguais ao resultado do spec | ✅ (mensagens, URLs e listas exatas) |
| Domínio 1:1 com as ACs, e UI no navegador cobrindo caminho feliz e erro | ✅ (formulários com erro e sucesso; busca de profissionais e card sem contatos agora na tela) |
| Todo teste mapeia uma AC ou um caso de borda | ✅ |

Observações menores, que não bloqueiam (as mesmas da rodada 1):
- `whatsappUrl(person.whatsapp)` é chamado duas vezes por card (`src/views/CommunityDirectoryView.tsx:102`).
- Profissionais salvos antes da feature em `localStorage` com o WhatsApp copiado de um 0800 (`08007707722`) ainda mostram o botão `wa.me/5508007707722`. O spec não trata dados legados.
- Telefone: o código aceita qualquer número de 11 dígitos, e "0800 + 7" é um caso particular disso. Fica de acordo com o spec.

---

## Lacunas restantes (nenhuma bloqueia)

1. A busca de trechos (COMM-15) não tem teste de navegador. `src/views/CommunityDirectoryView.tsx:31` está correta e coberta no nível unitário (U:68-69). Prioridade: menor.
2. Nenhuma mutação foi executada na view; o argumento da seção do sensor vem da leitura do código. Prioridade: menor.

## Rastreabilidade

| Requisito | Antes | Agora |
| --------- | ----- | ----- |
| COMM-01 a COMM-16 | Implementing | ✅ Verified (atualizado em `spec.md`) |

## Lições (fallback sem `lessons.py`)

- Para regras de tamanho, como "N ou M dígitos", teste os dois limites de fora (N-1 e M+1). Base: os mutantes 3 e 14 só morreram quando 9 e 14 dígitos entraram nos testes.
- Quando a lógica sai da view para funções puras, inclua no navegador ao menos um teste que prove que a view chama essas funções. Base: lacuna 3, fechada em B:44-45.
- Ao verificar, faça toda mutação num worktree separado e nunca troque de branch no repositório real. Base: o incidente de HEAD da rodada 1.

## Resumo

**Geral**: ✅ Pronto.
**Spec-anchored**: 16/16 ACs e os 2 casos de borda com evidência e valor exato do spec.
**Sensor**: 5/5 mortos nesta rodada (os 2 que tinham sobrevivido e 3 de regressão); 15/15 no total.
**Gate**: tsc ok, lint ok (0 avisos novos), 34/34 unitários, navegador ok.
