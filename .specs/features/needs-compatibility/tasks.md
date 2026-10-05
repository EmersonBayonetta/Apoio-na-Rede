# Compatibilidade com Minhas Necessidades Tasks

## Execution Protocol (MANDATORY -- do not skip)

Implement these tasks with the `tlc-spec-driven` skill: **activate it by name and follow its Execute flow and Critical Rules.** Do not search for skill files by filesystem path. The skill is the source of truth for the full flow (per-task cycle, sub-agent delegation, adequacy review, Verifier, discrimination sensor).

**If the skill cannot be activated, STOP and tell the user - do not proceed without it.**

---

**Design**: inline (no `design.md`; decisions in `context.md` and below)
**Status**: Done (awaiting Verifier)

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

- [x] Invalid JSON, unknown ids and unknown levels parse to "Não preciso"
- [x] Each requirement is classified from `resourceState`, and `desconhecido` is never counted as met or unmet
- [x] The label is exactly "Atende X de N requisitos"
- [x] The unmet essential list holds labels; an empty profile gives no comparison
- [x] `hasUnmetEssential` is true only for an essential with `nao`; it is false for unknown or for places without criteria
- [x] Edge case: conflicting reports count as no information
- [x] Gate passes: `npm test`

**Tests**: unit
**Gate**: quick
**Commit**: `feat(compatibility): compare places with requirement profile`
**Status**: ✅ Done. 46 tests pass (+9).

---

### T3: Requirement profile state and editor

**What**: Add `requirements` and `setRequirements` to `AccessibilityContext`, persisted in `apoio_requirements_v1`. Add the "Meus requisitos" section to the "Ajustes" modal, with a radio group per resource and a "Limpar requisitos" button. Create `tests/browser-needs.mjs` with the first checks.
**Where**: `src/context/AccessibilityContext.tsx`, `src/components/accessibility/UserPreferencesModal.tsx`, `tests/browser-needs.mjs`
**Depends on**: T2
**Reuses**: `parseRequirementProfile`, `browserStorage`, the modal's existing save flow
**Requirement**: COMP-01, COMP-02, COMP-03, COMP-05

**Tools**: MCP: NONE · Skill: NONE

**Done when**:

- [x] The section lists 12 resources, each with 3 levels, and "Não preciso" checked by default
- [x] Save, then reload: the levels are kept
- [x] "Limpar requisitos" resets every level to "Não preciso"
- [x] The section asks for no disability type
- [x] Gate passes (full)

**Tests**: e2e
**Gate**: full
**Commit**: `feat(compatibility): let users set their requirements`
**Status**: ✅ Done. 46 unit tests + `tests/browser-needs.mjs` pass. Deviation: the "Ajustes" modal only opened from the mobile bar, so the desktop header got an "Ajustes" button (`src/components/layout/Navbar.tsx`).

> Context and modal are one task because the context alone has no UI to test it through.

---

### T4: Requirements match block

**What**: Create `RequirementsMatch`, which shows the label, the 3 groups, the unmet essential warning and the certification note. Render nothing when the profile is empty. Use it in `AccessibilitySummary` (map popup).
**Where**: `src/components/accessibility/RequirementsMatch.tsx` (+ `AccessibilitySummary.tsx`, `src/components/maps/GoogleMap.tsx`)
**Depends on**: T3
**Reuses**: `compareRequirements`, `compatibilityLabel`
**Requirement**: COMP-09, COMP-10, COMP-11, COMP-12

**Tools**: MCP: NONE · Skill: NONE

**Done when**:

- [ ] Covered by browser checks in T5 (the map popup needs Google Maps, which is blocked in tests)
- [x] Gate passes: build gate

**Tests**: e2e (merged forward into T5: the first screen where the block can run offline)
**Gate**: build
**Commit**: `feat(compatibility): show requirement match in place summary`
**Status**: ✅ Done (browser checks land in T5). Deviation: map popups render with `renderToString` outside the provider, so the profile is a prop and `GoogleMap` passes it from the context.

---

### T5: Match on the place page

**What**: Render `RequirementsMatch` on `EstablishmentDetailView` above the checklist. Add browser checks that open `?local=<id>` with a seeded establishment.
**Where**: `src/views/EstablishmentDetailView.tsx`, `tests/browser-needs.mjs`
**Depends on**: T4
**Reuses**: `RequirementsMatch`
**Requirement**: COMP-06, COMP-07, COMP-09, COMP-10, COMP-11, COMP-12

**Tools**: MCP: NONE · Skill: NONE

**Done when**:

- [x] With 5 requirements (4 Sim, 1 unknown), the page shows "Atende 4 de 5 requisitos" and the unknown one under "Sem informação"
- [x] An essential with Não shows "Requisito indispensável não atendido: [label]"
- [x] The certification note is visible
- [x] With an empty profile, there is no block
- [x] Gate passes (full)

**Tests**: e2e
**Gate**: full
**Commit**: `feat(compatibility): show requirement match on place page`
**Status**: ✅ Done. 46 unit tests + `tests/browser-needs.mjs` pass.

---

### T6: Badge on result cards

**What**: Show the badge on `PlaceResultCard`: "Atende X de N requisitos", plus "Indispensável não atendido" when it applies. Show "Sem informações para seus requisitos" for a place that has no record.
**Where**: `src/components/explore/PlaceResultCard.tsx`, `tests/browser-needs.mjs`
**Depends on**: T5
**Reuses**: `compareRequirements`, `compatibilityLabel`
**Requirement**: COMP-13, COMP-14, COMP-15

**Tools**: MCP: NONE · Skill: NONE

**Done when**:

- [x] A seeded registered place shows the badge with the right count
- [x] A place with an unmet essential shows "Indispensável não atendido"
- [x] With an empty profile, there is no badge
- [x] Gate passes (full)

**Tests**: e2e
**Gate**: full
**Commit**: `feat(compatibility): show requirement badge on result cards`
**Status**: ✅ Done. Browser test mocks the OpenStreetMap response for the unregistered place, like `tests/browser-osm-categories.mjs`.

---

### T7: Filter for unmet essentials

**What**: In `ExplorerView`, add the checkbox "Ocultar locais com requisito indispensável não atendido". It is off by default and shown only when an essential exists. It filters `catalogEntries` with `hasUnmetEssential`.
**Where**: `src/views/ExplorerView.tsx`, `tests/browser-needs.mjs`
**Depends on**: T6
**Reuses**: `hasUnmetEssential`
**Requirement**: COMP-16, COMP-17, COMP-18

**Tools**: MCP: NONE · Skill: NONE

**Done when**:

- [x] The checkbox is hidden with no essential and when all requirements are "Desejável"
- [x] Turned on, it hides a place with an essential Não and keeps a place with the essential unknown
- [x] Gate passes (full), then the build gate

**Tests**: e2e
**Gate**: full
**Commit**: `feat(compatibility): filter places with unmet essential requirements`
**Status**: ✅ Done. Build gate passes. Note: `tests/browser-regressions.mjs` already failed before this feature (it clicks a "Lista" button that no longer exists in `src`).

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
