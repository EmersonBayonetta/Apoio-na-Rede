# Prontidão para Apresentação Tasks

## Execution Protocol (MANDATORY -- do not skip)

Implement these tasks with the `tlc-spec-driven` skill: **activate it by name and follow its Execute flow and Critical Rules.** Do not search for skill files by filesystem path. The skill is the source of truth for the full flow (per-task cycle, sub-agent delegation, adequacy review, Verifier, discrimination sensor).

**If the skill cannot be activated, STOP and tell the user - do not proceed without it.**

---

**Design**: inline (decisions in the spec's Assumptions table)
**Status**: In Progress

---

## Test Coverage Matrix

> Same as `needs-compatibility`. Guidelines found: none; strong defaults applied.

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| ---------- | ------------------ | -------------------- | ---------------- | ----------- |
| Utils (pure logic) | unit | All branches; 1:1 to spec ACs | `tests/*.test.mjs` | `npm test` |
| Components / views / CSS | e2e (browser over CDP) | Every AC the UI owns: happy path + listed edge cases | `tests/browser-presentation.mjs` | `node tests/browser-presentation.mjs` |
| Docs | none | review only | `README.md` | - |

## Gate Check Commands

| Gate Level | When to Use | Command |
| ---------- | ----------- | ------- |
| Quick | Unit-only tasks | `npm test` |
| Full | Browser tasks | `npm test && npx vite build && node tests/browser-presentation.mjs` |
| Build | Phase end | `npx tsc -b && npm run lint && npm test && npx vite build && node tests/browser-needs.mjs && node tests/browser-community.mjs` |

---

## Execution Plan

### Phase 1: Logic

```
T1 → T2 → T3 → T4
```

### Phase 2: Interface

```
T5 → T6 → T7 → T8 → T9 → T10 → T11 → T12
```

---

## Task Breakdown

### T1: Walking directions link
**What**: `directionsUrl` adds `travelmode=walking`.
**Where**: `src/utils/directionsUrl.ts`
**Depends on**: None · **Requirement**: PRES-09
**Done when**: unit test asserts the parameter, the destination and the place id; quick gate passes.
**Tests**: unit · **Gate**: quick
**Commit**: `fix(routes): open directions in walking mode`
**Status**: ✅ Done. 47 unit tests pass.

### T2: No WhatsApp link for numbers starting with 0
**What**: `whatsappUrl` returns null when the national number starts with 0.
**Where**: `src/utils/communityDirectory.ts`
**Depends on**: T1 · **Requirement**: PRES-25
**Done when**: `'0800 770 7722'` and `'55 0800 770 7722'` give null; valid numbers unchanged; quick gate passes.
**Tests**: unit · **Gate**: quick
**Commit**: `fix(community): skip whatsapp links for toll-free numbers`

### T3: Walking route summary format
**What**: `formatWalkingSummary(meters, seconds)` returns e.g. "1,2 km · 15 min" or "350 m · 5 min".
**Where**: `src/utils/formatDistance.ts`
**Depends on**: T2 · **Reuses**: existing distance formatting · **Requirement**: PRES-06
**Done when**: unit tests for m/km and minute rounding (minimum 1 min); quick gate passes.
**Tests**: unit · **Gate**: quick
**Commit**: `feat(routes): format walking route summary`

### T4: Tab ↔ URL mapping
**What**: `tabFromUrl(search)` and `urlForTab(tab, url)` for `aba=rotas|profissionais|cadastro`; unknown → explorer; `local` keeps priority.
**Where**: `src/utils/appTabs.ts`
**Depends on**: T3 · **Requirement**: PRES-16, PRES-17 (edge cases)
**Done when**: unit tests for each tab, unknown value, and preserving `local`; quick gate passes.
**Tests**: unit · **Gate**: quick
**Commit**: `feat(navigation): map app tabs to the url`

### T5: Value proposition on Explorar
**What**: New h1 and subtitle; "Como funciona" with 3 steps; banner text without "Trace sua rota"; on ≤600 px, hide hero art and compact spacing so the search fits the first screen. Create `tests/browser-presentation.mjs`.
**Where**: `src/components/explore/ExplorerHero.tsx` (+ `ExploreCategories.tsx` text, `src/styles/design-system.css`)
**Depends on**: T4 · **Requirement**: PRES-01, PRES-02, PRES-03, PRES-04
**Done when**: browser checks for h1 text, 3 steps, search input bottom ≤ 780 px at 360×780, and no "Trace sua rota" on Explorar; full gate passes.
**Tests**: e2e · **Gate**: full
**Commit**: `feat(explore): state the value proposition on the first screen`

### T6: Walking route on the place page
**What**: `WalkingRoute` component: "Calcular rota a pé" button → geolocation → `fetchWalkingRoute` → summary + OSM note; errors in `role="alert"`; "Abrir no Google Maps" link always present. Used on `EstablishmentDetailView`.
**Where**: `src/components/establishments/WalkingRoute.tsx` (+ one usage in `EstablishmentDetailView.tsx`)
**Depends on**: T5 · **Reuses**: `fetchWalkingRoute`, `formatWalkingSummary`, `directionsUrl` · **Requirement**: PRES-06, PRES-07, PRES-08, PRES-09
**Done when**: browser checks with geolocation override and mocked routing response show the summary and note; denied geolocation and a failing service each show the alert and keep the link; full gate passes.
**Tests**: e2e · **Gate**: full
**Commit**: `feat(routes): calculate walking route on the place page`

### T7: Five-destination navigation with URL tabs
**What**: Navbar with Explorar, Rotas, Profissionais, Cadastrar, Minhas necessidades; distinct icons; mobile labels ≥ 12 px; App syncs tab with `?aba=` (push on change, read on load and popstate).
**Where**: `src/components/layout/Navbar.tsx`, `src/App.tsx` (+ CSS grid columns)
**Depends on**: T6 · **Reuses**: `tabFromUrl`, `urlForTab` · **Requirement**: PRES-13, PRES-14, PRES-15, PRES-16, PRES-17, PRES-18
**Done when**: browser checks for 5 items on both widths, unique icons, label font size, URL after click, reload on `?aba=rotas`, Back returns to Explorar, unknown `aba` opens Explorar; full gate passes.
**Tests**: e2e · **Gate**: full
**Commit**: `feat(navigation): five destinations with shareable tab links`

> Navbar and App are one task: the URL sync is untestable without the new buttons.

### T8: "Minhas necessidades" and cross links
**What**: Rename the profile dialog; add "Opções de exibição e leitura" in it and "Minhas necessidades" in the accessibility panel, each opening the other.
**Where**: `src/components/accessibility/UserPreferencesModal.tsx`, `src/components/accessibility/AccessibilityToolbar.tsx` (+ open-event wiring)
**Depends on**: T7 · **Requirement**: PRES-19, PRES-20
**Done when**: browser checks that each link opens the other surface; `browser-needs.mjs` updated for the renamed button; full gate passes.
**Tests**: e2e · **Gate**: full
**Commit**: `feat(accessibility): separate needs from display options with cross links`

### T9: Interface accessibility fixes
**What**: Name the professionals filter; raise undersized targets to ≥ 24 px; reserve space so the floating launcher never covers controls.
**Where**: `src/views/CommunityDirectoryView.tsx`, `src/styles/design-system.css` (+ small class changes where targets live)
**Depends on**: T8 · **Requirement**: PRES-10, PRES-11, PRES-12
**Done when**: browser audit finds the filter name, no target < 24 px outside sentences on Explorar/Rotas/Profissionais at 360 and 1280, and no overlap at page end; full gate passes.
**Tests**: e2e · **Gate**: full
**Commit**: `fix(a11y): name filter, enlarge targets and keep launcher off controls`

### T10: Empty states that explain
**What**: Routes and professionals show a "nothing yet" message with the add button when there is no data and no search; Explorar shows "Os locais próximos não carregaram." with retry when Places fails and the list is empty.
**Where**: `src/views/CommunityDirectoryView.tsx`, `src/views/ExplorerView.tsx`
**Depends on**: T9 · **Requirement**: PRES-21, PRES-22, PRES-23
**Done when**: browser checks for each message and button; full gate passes.
**Tests**: e2e · **Gate**: full
**Commit**: `fix(ux): explain empty screens and offer the next step`

### T11: Data cleanup and regression suite
**What**: Remove the overlapping default criterion from the wizard; update `tests/browser-regressions.mjs` to the current UI.
**Where**: `src/views/MerchantRegisterWizard.tsx`, `tests/browser-regressions.mjs`
**Depends on**: T10 · **Requirement**: PRES-24, PRES-26
**Done when**: browser check that the item is absent; `node tests/browser-regressions.mjs` passes; build gate passes.
**Tests**: e2e · **Gate**: build
**Commit**: `fix(register): drop overlapping sensory item and update regression suite`

### T12: README with the value proposition
**What**: Rewrite the top of `README.md`: what the app is for, main features as they exist, how to run and test. Remove the Vite template sections and the outdated "Como chegar" text.
**Where**: `README.md`
**Depends on**: T11 · **Requirement**: PRES-05
**Done when**: README lists only existing features; reviewed by the Verifier.
**Tests**: none · **Gate**: build
**Commit**: `docs: lead the readme with the value proposition`

---

## Phase Execution Map

```
Phase 1:  T1 → T2 → T3 → T4
Phase 2:  T5 → T6 → T7 → T8 → T9 → T10 → T11 → T12
```

12 tasks pack into 2 batches (Phase 1 = 4 tasks, Phase 2 = 8). Sub-agents are offered; inline execution is the alternative.

## Diagram-Definition Cross-Check

| Task | Depends On | Diagram | Status |
| ---- | ---------- | ------- | ------ |
| T1 | None | start | ✅ |
| T2–T4 | previous task | chain | ✅ |
| T5 | T4 | phase 1 → T5 | ✅ |
| T6–T12 | previous task | chain | ✅ |

## Test Co-location Validation

| Task | Layer | Matrix | Task | Status |
| ---- | ----- | ------ | ---- | ------ |
| T1–T4 | utils | unit | unit | ✅ |
| T5–T11 | components/views/CSS | e2e | e2e | ✅ |
| T12 | docs | none | none | ✅ |
