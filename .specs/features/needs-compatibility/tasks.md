# Compatibilidade com Minhas Necessidades Tasks

## Execution Protocol (MANDATORY -- do not skip)

Implement these tasks with the `tlc-spec-driven` skill: **activate it by name and follow its Execute flow and Critical Rules.** Do not search for skill files by filesystem path. The skill is the source of truth for the full flow (per-task cycle, sub-agent delegation, adequacy review, Verifier, discrimination sensor).

**If the skill cannot be activated, STOP and tell the user - do not proceed without it.**

---

**Design**: inline (no `design.md`; decisions in `context.md` and below)
**Status**: In Progress

### Design notes

- The 3 sensory resources go into `ACCESSIBILITY_RESOURCES`. Each resource gets a `tipo: DisabilityType`, so the registration form stops labeling extras as `mobilidade`.
- The pure logic lives in `src/utils/needsCompatibility.ts`: profile parsing, comparison, label, essential-miss check. It reuses `resourceState`.
- The profile state lives in `AccessibilityContext`, next to `accessibilityPreferences`, with the same `browserStorage` pattern. Key: `apoio_requirements_v1`.
- One `RequirementsMatch` component renders the comparison. It is used in the map popup (`AccessibilitySummary`) and on the place page (`EstablishmentDetailView`). `PlaceAccessibilityPanel` is not used by any screen, so the spec's "painel do local" is the place page.
- Cards that show only a searched address (no place) get no badge.

---

## Test Coverage Matrix

> Generated from codebase and spec. Guidelines found: none (no `AGENTS.md`/`CONTRIBUTING.md`; README only lists `npm test`, `npm run lint`, `npm run build`). Strong defaults applied.

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| ---------- | ------------------ | -------------------- | ---------------- | ----------- |
| Data / utils (pure logic) | unit | All branches; 1:1 to spec ACs; every listed edge case | `tests/*.test.mjs` | `npm test` |
| Context / components / views | e2e (browser over CDP) | Every AC the UI owns: happy path + listed edge cases | `tests/browser-*.mjs` | `node tests/browser-needs.mjs` |

## Gate Check Commands

> Generated from `package.json` and the existing browser tests. The browser gate needs headless Chrome on CDP `:9223` and `vite preview --port 4176` serving a fresh build.

| Gate Level | When to Use | Command |
| ---------- | ----------- | ------- |
| Quick | After tasks with unit tests only | `npm test` |
| Full | After tasks with browser tests | `npm test && npx vite build && node tests/browser-needs.mjs` |
| Build | After phase completion | `npx tsc -b && npm run lint && npm test && npx vite build` |

---

## Execution Plan

### Phase 1: Domain

```
T1 → T2
```

### Phase 2: Interface

```
T3 → T4 → T5 → T6 → T7
```

---

## Task Breakdown

### T1: Add sensory resources and resource types

**What**: Add `area_descanso`, `iluminacao_ajustavel` and `horario_tranquilo` to `ACCESSIBILITY_RESOURCES`. Add a `tipo` to every resource, `intelectual` for the 3 new ones. Export `registrationCriteriaTemplates()`, which builds the form list the wizard builds inline today.
**Where**: `src/data/accessibilityResources.ts` (+ wizard call site in `src/views/MerchantRegisterWizard.tsx`, icons in `src/components/accessibility/AccessibilityIcons.tsx`)
**Depends on**: None
**Reuses**: `resourceState`, `DEFAULT_CRITERIA_TEMPLATES`
**Requirement**: COMP-19, COMP-20

**Tools**: MCP: NONE · Skill: NONE

**Done when**:

- [x] `resourceState` returns `sim`/`nao`/`desconhecido` for each new id
- [x] `registrationCriteriaTemplates()` includes the 3 new resources with `tipo: 'intelectual'`
- [x] Gate passes: `npm test`

**Tests**: unit
**Gate**: quick
**Commit**: `feat(accessibility): add sensory resources with resource types`
**Status**: ✅ Done. 37 tests pass (+3). Deviation: the wizard and the icon map had to change too; the icon map is typed by resource id.

---

### T2: Compatibility logic

**What**: Create `parseRequirementProfile`, `compareRequirements`, `compatibilityLabel` and `hasUnmetEssential`.
**Where**: `src/utils/needsCompatibility.ts`
**Depends on**: T1
**Reuses**: `resourceState`, `ACCESSIBILITY_RESOURCES`
**Requirement**: COMP-04, COMP-06, COMP-07, COMP-08, COMP-09, COMP-11, COMP-17, COMP-18

**Tools**: MCP: NONE · Skill: NONE

**Done when**:

- [ ] Invalid JSON, unknown ids and unknown levels parse to "Não preciso"
- [ ] Each requirement is classified from `resourceState`, and `desconhecido` is never counted as met or unmet
- [ ] The label is exactly "Atende X de N requisitos"
- [ ] The unmet essential list holds labels; an empty profile gives no comparison
- [ ] `hasUnmetEssential` is true only for an essential with `nao`; it is false for unknown or for places without criteria
- [ ] Edge case: conflicting reports count as no information
- [ ] Gate passes: `npm test`

**Tests**: unit
**Gate**: quick
**Commit**: `feat(compatibility): compare places with requirement profile`

---

### T3: Requirement profile state and editor

**What**: Add `requirements` and `setRequirements` to `AccessibilityContext`, persisted in `apoio_requirements_v1`. Add the "Meus requisitos" section to the "Ajustes" modal, with a radio group per resource and a "Limpar requisitos" button. Create `tests/browser-needs.mjs` with the first checks.
**Where**: `src/context/AccessibilityContext.tsx`, `src/components/accessibility/UserPreferencesModal.tsx`, `tests/browser-needs.mjs`
**Depends on**: T2
**Reuses**: `parseRequirementProfile`, `browserStorage`, the modal's existing save flow
**Requirement**: COMP-01, COMP-02, COMP-03, COMP-05

**Tools**: MCP: NONE · Skill: NONE

**Done when**:

- [ ] The section lists 12 resources, each with 3 levels, and "Não preciso" checked by default
- [ ] Save, then reload: the levels are kept
- [ ] "Limpar requisitos" resets every level to "Não preciso"
- [ ] The section asks for no disability type
- [ ] Gate passes (full)

**Tests**: e2e
**Gate**: full
**Commit**: `feat(compatibility): let users set their requirements`

> Context and modal are one task because the context alone has no UI to test it through.

---

### T4: Requirements match block

**What**: Create `RequirementsMatch`, which shows the label, the 3 groups, the unmet essential warning and the certification note. Render nothing when the profile is empty. Use it in `AccessibilitySummary` (map popup).
**Where**: `src/components/accessibility/RequirementsMatch.tsx` (+ one line in `AccessibilitySummary.tsx`)
**Depends on**: T3
**Reuses**: `compareRequirements`, `compatibilityLabel`
**Requirement**: COMP-09, COMP-10, COMP-11, COMP-12

**Tools**: MCP: NONE · Skill: NONE

**Done when**:

- [ ] Covered by browser checks in T5 (the map popup needs Google Maps, which is blocked in tests)
- [ ] Gate passes: build gate

**Tests**: e2e (merged forward into T5: the first screen where the block can run offline)
**Gate**: build
**Commit**: `feat(compatibility): show requirement match in place summary`

---

### T5: Match on the place page

**What**: Render `RequirementsMatch` on `EstablishmentDetailView` above the checklist. Add browser checks that open `?local=<id>` with a seeded establishment.
**Where**: `src/views/EstablishmentDetailView.tsx`, `tests/browser-needs.mjs`
**Depends on**: T4
**Reuses**: `RequirementsMatch`
**Requirement**: COMP-06, COMP-07, COMP-09, COMP-10, COMP-11, COMP-12

**Tools**: MCP: NONE · Skill: NONE

**Done when**:

- [ ] With 5 requirements (4 Sim, 1 unknown), the page shows "Atende 4 de 5 requisitos" and the unknown one under "Sem informação"
- [ ] An essential with Não shows "Requisito indispensável não atendido: [label]"
- [ ] The certification note is visible
- [ ] With an empty profile, there is no block
- [ ] Gate passes (full)

**Tests**: e2e
**Gate**: full
**Commit**: `feat(compatibility): show requirement match on place page`

---

### T6: Badge on result cards

**What**: Show the badge on `PlaceResultCard`: "Atende X de N requisitos", plus "Indispensável não atendido" when it applies. Show "Sem informações para seus requisitos" for a place that has no record.
**Where**: `src/components/explore/PlaceResultCard.tsx`, `tests/browser-needs.mjs`
**Depends on**: T5
**Reuses**: `compareRequirements`, `compatibilityLabel`
**Requirement**: COMP-13, COMP-14, COMP-15

**Tools**: MCP: NONE · Skill: NONE

**Done when**:

- [ ] A seeded registered place shows the badge with the right count
- [ ] A place with an unmet essential shows "Indispensável não atendido"
- [ ] With an empty profile, there is no badge
- [ ] Gate passes (full)

**Tests**: e2e
**Gate**: full
**Commit**: `feat(compatibility): show requirement badge on result cards`

---

### T7: Filter for unmet essentials

**What**: In `ExplorerView`, add the checkbox "Ocultar locais com requisito indispensável não atendido". It is off by default and shown only when an essential exists. It filters `catalogEntries` with `hasUnmetEssential`.
**Where**: `src/views/ExplorerView.tsx`, `tests/browser-needs.mjs`
**Depends on**: T6
**Reuses**: `hasUnmetEssential`
**Requirement**: COMP-16, COMP-17, COMP-18

**Tools**: MCP: NONE · Skill: NONE

**Done when**:

- [ ] The checkbox is hidden with no essential and when all requirements are "Desejável"
- [ ] Turned on, it hides a place with an essential Não and keeps a place with the essential unknown
- [ ] Gate passes (full), then the build gate

**Tests**: e2e
**Gate**: full
**Commit**: `feat(compatibility): filter places with unmet essential requirements`

---

## Phase Execution Map

```
Phase 1 → Phase 2

Phase 1:  T1 ──→ T2
Phase 2:  T3 ──→ T4 ──→ T5 ──→ T6 ──→ T7
```

7 tasks, one batch: execution runs inline, without sub-agents. The Verifier runs after T7.

---

## Task Granularity Check

| Task | Scope | Status |
| ---- | ----- | ------ |
| T1 | 1 data file | ✅ Granular |
| T2 | 1 utils file, 4 related functions | ✅ Cohesive |
| T3 | context + modal + test file | ⚠️ 2 source files, kept together so the state is testable |
| T4 | 1 component + 1 line | ✅ Granular |
| T5 | 1 view + test | ✅ Granular |
| T6 | 1 component + test | ✅ Granular |
| T7 | 1 view + test | ✅ Granular |

## Diagram-Definition Cross-Check

| Task | Depends On (body) | Diagram | Status |
| ---- | ----------------- | ------- | ------ |
| T1 | None | start | ✅ |
| T2 | T1 | T1 → T2 | ✅ |
| T3 | T2 | phase 1 → T3 | ✅ |
| T4 | T3 | T3 → T4 | ✅ |
| T5 | T4 | T4 → T5 | ✅ |
| T6 | T5 | T5 → T6 | ✅ |
| T7 | T6 | T6 → T7 | ✅ |

## Test Co-location Validation

| Task | Layer | Matrix Requires | Task Says | Status |
| ---- | ----- | --------------- | --------- | ------ |
| T1 | data | unit | unit | ✅ |
| T2 | utils | unit | unit | ✅ |
| T3 | context + component | e2e | e2e | ✅ |
| T4 | component | e2e | e2e, merged forward into T5 | ✅ (offline-runnable screen only exists in T5) |
| T5 | view | e2e | e2e | ✅ |
| T6 | component | e2e | e2e | ✅ |
| T7 | view | e2e | e2e | ✅ |
