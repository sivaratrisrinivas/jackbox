# Implementation Plan: Jackbox V1 - Prospect Demo Generator

## Overview
Build a single Next.js application that lets a founder enter a prospect URL and one-sentence pain point, routes that input to one of three curated Firecrawl demo templates, and returns a previewable demo package with rationale, credit estimate, provenance, and ZIP export. The plan favors fixture-first development so the product can be demoed reliably before live crawling is fully wired.

## Architecture Decisions
- **Single Next.js app, no database in V1.** Keep state request-scoped and export-oriented so we avoid auth, persistence, and background job complexity.
- **Use a normalized `DemoPackage` manifest as the system contract.** Routing, generation, preview rendering, and ZIP export should all read/write the same structured object.
- **Keep Firecrawl behind an adapter boundary.** The generator pipeline should accept either a live Firecrawl adapter or a fixture adapter so tests and demos stay deterministic.
- **Use route handlers for orchestration and export.** This keeps the generation flow callable from the UI and testable outside React components.
- **One template per run, chosen deterministically.** V1 should explain why a single template was chosen rather than trying to blend multiple demo modes.
- **Template files are curated assets, not free-form AI output.** AI may fill placeholders and summarize content, but it does not invent arbitrary app structures.

## Dependency Graph
```text
Project scaffold + scripts
    |
    +--> Core schemas + manifest contract + fixture loader
             |
             +--> Routing + estimate engine + crawl target planner
             |        |
             |        +--> Generation orchestration route
             |                  |
             |                  +--> Shared preview renderer
             |                  |        |
             |                  |        +--> Docs Intelligence template
             |                  |        +--> Change Monitor template
             |                  |        +--> Account Research template
             |                  |
             |                  +--> ZIP export route
             |
             +--> Firecrawl live adapter + fallback handling
                        |
                        +--> E2E seeded demos + docs
```

## Task List

### Phase 1: Foundation

## Task 1: Bootstrap the Next.js app shell

**Description:** Create the base application and toolchain so the repo can run, build, lint, and typecheck before any Jackbox-specific logic lands.

**Acceptance criteria:**
- [x] `npm install`, `npm run dev`, `npm run build`, `npm run lint`, and `npm run typecheck` are defined in `package.json`.
- [x] A minimal App Router shell renders a placeholder Jackbox screen.
- [x] TypeScript and Tailwind are configured for the chosen stack in the spec.

**Verification:**
- [x] Build succeeds: `npm run build`
- [x] Lint succeeds: `npm run lint`
- [x] Manual check: the root route renders a visible Jackbox placeholder screen

**Dependencies:** None

**Files likely touched:**
- `package.json`
- `tsconfig.json`
- `next.config.ts`
- `app/layout.tsx`
- `app/page.tsx`

**Estimated scope:** Medium

## Task 2: Define core contracts and fixture loading

**Description:** Create the shared type and validation layer for prospect input, routed template choice, normalized demo packages, and fixture payloads so the rest of the app has a stable contract.

**Acceptance criteria:**
- [x] Zod schemas exist for prospect input, template IDs, routed plans, and the `DemoPackage` manifest.
- [x] Fixture files can be loaded and validated through a single adapter-friendly interface.
- [x] Unit tests cover schema validation and fixture parsing failure cases.

**Verification:**
- [x] Tests pass: `npm run test:run -- tests/unit/contracts.test.ts`
- [x] Typecheck succeeds: `npm run typecheck`
- [x] Manual check: an invalid fixture fails with a readable error

**Dependencies:** Task 1

**Files likely touched:**
- `lib/validation/prospect.ts`
- `lib/generation/demo-package.ts`
- `lib/firecrawl/fixtures.ts`
- `docs/fixtures/README.md`
- `tests/unit/contracts.test.ts`

**Estimated scope:** Medium

## Task 3: Build the intake form and stubbed result shell

**Description:** Implement the founder-facing landing experience with URL and pain-point inputs, client validation, loading states, and a stubbed success panel so the core UI flow exists before real generation logic.

**Acceptance criteria:**
- [x] The landing screen contains a single clear form for company URL and pain point.
- [x] Invalid input is blocked with inline validation messages.
- [x] A stubbed submit path shows loading, success, and error states in the results area.

**Verification:**
- [x] Build succeeds: `npm run build`
- [x] Tests pass: `npm run test:run -- tests/unit/prospect-form.test.tsx`
- [x] Manual check: submitting valid input transitions through loading into a visible result shell

**Dependencies:** Task 2

**Files likely touched:**
- `app/page.tsx`
- `components/prospect-form.tsx`
- `components/generation-status.tsx`
- `components/result-shell.tsx`
- `tests/unit/prospect-form.test.tsx`

**Estimated scope:** Medium

### Checkpoint: After Phase 1
- [x] The repo installs and builds cleanly
- [x] The founder intake flow is visible and usable with stubbed output
- [x] Core contracts exist, so later work can build against stable types
- [ ] Review with human before wiring real generation logic

### Phase 2: Core Pipeline

## Task 4: Implement routing, crawl target selection, and credit estimates

**Description:** Build deterministic logic that maps a prospect plus pain point to one of the three templates, a bounded list of crawl targets, and a rough credit estimate that can be shown in the UI.

**Acceptance criteria:**
- [ ] Seeded fixtures produce the expected template choice and explanation.
- [ ] Crawl targets are bounded to the approved public site areas from the spec.
- [ ] Credit estimates return a readable breakdown suitable for UI display.

**Verification:**
- [ ] Tests pass: `npm run test -- --runInBand tests/unit/router.test.ts tests/unit/estimate-credits.test.ts`
- [ ] Typecheck succeeds: `npm run typecheck`
- [ ] Manual check: the router explanation is understandable to a founder without internal jargon

**Dependencies:** Task 2

**Files likely touched:**
- `lib/router/route-prospect.ts`
- `lib/router/select-crawl-targets.ts`
- `lib/estimates/estimate-credits.ts`
- `tests/unit/router.test.ts`
- `tests/unit/estimate-credits.test.ts`

**Estimated scope:** Medium

## Task 5: Build the generation orchestration route around the `DemoPackage` contract

**Description:** Create the server-side orchestration path that validates input, loads prospect data through the adapter interface, runs routing, and returns a normalized `DemoPackage` response for the UI.

**Acceptance criteria:**
- [ ] A generation route accepts valid input and returns a typed response shaped as `DemoPackage`.
- [ ] The route uses fixture-backed prospect data so the flow works without live Firecrawl access.
- [ ] Invalid requests return structured errors the UI can render cleanly.

**Verification:**
- [ ] Tests pass: `npm run test -- --runInBand tests/integration/generate-route.test.ts`
- [ ] Build succeeds: `npm run build`
- [ ] Manual check: the intake UI can call the route and receive a typed stub package

**Dependencies:** Tasks 2, 3, 4

**Files likely touched:**
- `app/api/generate/route.ts`
- `lib/generation/generate-demo-package.ts`
- `lib/firecrawl/load-prospect-data.ts`
- `lib/validation/errors.ts`
- `tests/integration/generate-route.test.ts`

**Estimated scope:** Medium

## Task 6: Render a shared preview and result summary from `DemoPackage`

**Description:** Build the UI components that render the routed template preview, "why this matters" note, architecture summary, provenance list, and credit estimate from the normalized manifest.

**Acceptance criteria:**
- [ ] The result view renders summary metadata consistently across templates.
- [ ] Provenance links and architecture notes are visible and distinct from generated marketing copy.
- [ ] The preview container can swap template-specific content without changing the page-level layout.

**Verification:**
- [ ] Build succeeds: `npm run build`
- [ ] Tests pass: `npm run test -- --runInBand tests/integration/demo-preview.test.tsx`
- [ ] Manual check: a returned `DemoPackage` renders a coherent result screen end to end

**Dependencies:** Tasks 3, 5

**Files likely touched:**
- `components/demo-preview.tsx`
- `components/result-summary.tsx`
- `components/source-provenance.tsx`
- `app/page.tsx`
- `tests/integration/demo-preview.test.tsx`

**Estimated scope:** Medium

### Checkpoint: After Phase 2
- [ ] A founder can submit input and receive a structured result from fixtures
- [ ] Routing, estimates, and result rendering all work through the shared manifest
- [ ] The system is ready for template-specific vertical slices

### Phase 3: Template Slices

## Task 7: Implement the Docs Intelligence template slice

**Description:** Add the first full demo generator slice for docs-heavy prospects, producing a question-answering style preview with citations and exportable template files.

**Acceptance criteria:**
- [ ] A docs-oriented fixture produces the Docs Intelligence template with source-linked answers.
- [ ] The returned package contains template-specific preview data and exportable files metadata.
- [ ] Integration tests cover the docs slice end to end from fixture input to rendered package.

**Verification:**
- [ ] Tests pass: `npm run test -- --runInBand tests/integration/docs-intelligence.test.ts`
- [ ] Typecheck succeeds: `npm run typecheck`
- [ ] Manual check: the preview feels like a credible Firecrawl-powered docs demo

**Dependencies:** Tasks 5, 6

**Files likely touched:**
- `templates/docs-intelligence/template.ts`
- `templates/docs-intelligence/files.ts`
- `lib/generation/templates/docs-intelligence.ts`
- `docs/fixtures/docs-intelligence.json`
- `tests/integration/docs-intelligence.test.ts`

**Estimated scope:** Medium

## Task 8: Implement the Change Monitor template slice

**Description:** Add the monitoring-oriented generator slice that turns relevant pages into a change dashboard with tracked pages, change summaries, and alert-style outputs.

**Acceptance criteria:**
- [ ] A monitoring-oriented fixture produces the Change Monitor template with tracked-page summaries.
- [ ] The preview clearly distinguishes current state, detected changes, and suggested monitoring value.
- [ ] Integration tests cover the monitoring slice end to end.

**Verification:**
- [ ] Tests pass: `npm run test -- --runInBand tests/integration/change-monitor.test.ts`
- [ ] Build succeeds: `npm run build`
- [ ] Manual check: the preview reads as monitoring intelligence, not generic research

**Dependencies:** Tasks 5, 6

**Files likely touched:**
- `templates/change-monitor/template.ts`
- `templates/change-monitor/files.ts`
- `lib/generation/templates/change-monitor.ts`
- `docs/fixtures/change-monitor.json`
- `tests/integration/change-monitor.test.ts`

**Estimated scope:** Medium

## Task 9: Implement the Account Research template slice

**Description:** Add the research-oriented generator slice that produces a compact prospect brief from pricing, jobs, docs, and product pages for sales conversations.

**Acceptance criteria:**
- [ ] A research-oriented fixture produces the Account Research template with concise account insights.
- [ ] The preview includes a short "why this matters to your team" note grounded in source data.
- [ ] Integration tests cover the research slice end to end.

**Verification:**
- [ ] Tests pass: `npm run test -- --runInBand tests/integration/account-research.test.ts`
- [ ] Typecheck succeeds: `npm run typecheck`
- [ ] Manual check: the output feels like a tailored pre-sales brief, not a generic summary

**Dependencies:** Tasks 5, 6

**Files likely touched:**
- `templates/account-research/template.ts`
- `templates/account-research/files.ts`
- `lib/generation/templates/account-research.ts`
- `docs/fixtures/account-research.json`
- `tests/integration/account-research.test.ts`

**Estimated scope:** Medium

### Checkpoint: After Phase 3
- [ ] All three templates generate coherent outputs from seeded fixtures
- [ ] The shared UI renders each template without special-case page logic
- [ ] Template choice and preview quality are strong enough for an internal live demo

### Phase 4: Integration and Polish

## Task 10: Add the Firecrawl live adapter with bounded fallback behavior

**Description:** Wire the live Firecrawl client behind the existing adapter interface so Jackbox can use real prospect URLs when credentials are present, while falling back to fixture mode for tests and demos.

**Acceptance criteria:**
- [ ] Live Firecrawl usage is isolated behind a small adapter boundary.
- [ ] Missing credentials, crawl timeouts, or adapter failures fall back to a readable error or fixture mode without crashing the UI.
- [ ] Integration tests mock the live adapter without depending on the network.

**Verification:**
- [ ] Tests pass: `npm run test -- --runInBand tests/integration/firecrawl-adapter.test.ts`
- [ ] Typecheck succeeds: `npm run typecheck`
- [ ] Manual check: toggling fixture/live mode changes data source without changing the user flow

**Dependencies:** Tasks 4, 5, 7, 8, 9

**Files likely touched:**
- `lib/firecrawl/client.ts`
- `lib/firecrawl/load-prospect-data.ts`
- `lib/firecrawl/mode.ts`
- `app/api/generate/route.ts`
- `tests/integration/firecrawl-adapter.test.ts`

**Estimated scope:** Medium

## Task 11: Implement ZIP export and package assembly

**Description:** Build the export route that turns a generated `DemoPackage` into a downloadable archive containing README content, template files, and metadata the founder can share or inspect.

**Acceptance criteria:**
- [ ] The result screen exposes a ZIP export action for completed demo packages.
- [ ] The exported archive contains template files, a README, and structured metadata for the chosen template.
- [ ] Export generation uses curated template files only, not arbitrary code synthesis.

**Verification:**
- [ ] Tests pass: `npm run test -- --runInBand tests/integration/export-route.test.ts`
- [ ] Build succeeds: `npm run build`
- [ ] Manual check: downloading a ZIP produces a sensible archive that matches the previewed result

**Dependencies:** Tasks 5, 7, 8, 9

**Files likely touched:**
- `app/api/export/route.ts`
- `lib/generation/build-export.ts`
- `lib/generation/build-readme.ts`
- `components/export-button.tsx`
- `tests/integration/export-route.test.ts`

**Estimated scope:** Medium

## Task 12: Add seeded E2E demos, README guidance, and final polish

**Description:** Lock in a founder-safe demo flow with seeded scenarios, end-to-end verification, and repo documentation so the project is ready for implementation review and live walkthroughs.

**Acceptance criteria:**
- [ ] A Playwright happy-path test covers submit -> routed result -> preview -> export availability.
- [ ] The repo README explains how to run Jackbox in fixture mode and live mode.
- [ ] Seeded example scenarios exist for one prospect per template and are easy to demo repeatedly.

**Verification:**
- [ ] Tests pass: `npm run test:e2e`
- [ ] Build succeeds: `npm run build`
- [ ] Manual check: a teammate can follow the README and run a seeded demo without extra explanation

**Dependencies:** Tasks 10, 11

**Files likely touched:**
- `e2e/founder-flow.spec.ts`
- `README.md`
- `docs/fixtures/docs-intelligence.json`
- `docs/fixtures/change-monitor.json`
- `docs/fixtures/account-research.json`

**Estimated scope:** Medium

### Checkpoint: Complete
- [ ] All success criteria from the spec are covered by implemented tasks
- [ ] The app builds, typechecks, and passes unit, integration, and E2E tests
- [ ] A founder can generate and export three seeded prospect demos reliably
- [ ] The team can review the MVP without hidden scope or undefined contracts

## Parallelization Opportunities
- After **Task 6**, **Tasks 7, 8, and 9** can be implemented in parallel because they share the same `DemoPackage` contract but own separate template files.
- **Task 12** documentation work can begin in parallel with late-stage bug fixing once the route and export contracts stop changing.
- **Tasks 10 and 11** should stay sequential enough to avoid churn in the generation response shape.

## Risks and Mitigations
| Risk | Impact | Mitigation |
|------|--------|------------|
| Live Firecrawl responses vary wildly by site quality | High | Keep a strict adapter boundary, bounded crawl target selection, and fixture-backed seeded demos |
| Template outputs feel too generic to impress on a live call | High | Invest in curated template files, strong source provenance, and concise founder-facing explanation copy |
| ZIP export grows into a free-form scaffolder | Medium | Export only curated template assets plus filled placeholders from the manifest |
| Routing heuristics pick the wrong template too often | Medium | Seed representative fixtures early and keep routing deterministic and debuggable |
| Scope creep toward auth, background jobs, or marketplace ideas | High | Treat the spec boundaries as hard guardrails and defer platform features until after the first internal demo |

## Open Questions
- Recommendation: keep ZIP export to runnable code plus README for V1; defer rendered static preview artifacts unless the first demo round shows a real need.
- Recommendation: frame the Account Research template as a **research workspace** rather than a dashboard so it feels more distinctive from the monitoring template.
- We should decide before implementation whether fixture mode is user-visible in the UI or only a dev/testing switch.
