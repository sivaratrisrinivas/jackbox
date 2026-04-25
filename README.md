# Jackbox

Jackbox is a founder-facing prospect demo generator. You give it a company URL
and a one-sentence pain point, and it turns that into a tailored Firecrawl demo
package with a routed template, rationale, provenance, and exportable artifacts.

## Current Status

The repo is now through Task 10. A founder can submit a prospect brief, receive
a normalized package manifest, and see source-linked docs answers, tracked-page
monitoring summaries, or a compact account research brief with grounded team
context, provenance, architecture notes, credit estimates, and template-specific
package files rendered from the same contract. Jackbox now supports a bounded
live Firecrawl adapter when credentials are present and cleanly falls back to
fixtures when live mode is unavailable or fails.

Completed:
- Task 1: bootstrap the Next.js app shell
- Task 2: define core contracts and fixture loading
- Task 3: build the intake form and stubbed result shell
- Task 4: implement routing, crawl target selection, and credit estimates
- Task 5: build the generation orchestration route
- Task 6: render the shared preview and result summary from `DemoPackage`
- Task 7: implement the Docs Intelligence template slice
- Task 8: implement the Change Monitor template slice
- Task 9: implement the Account Research template slice
- Task 10: add the Firecrawl live adapter with bounded fallback behavior

Next in sequence:
- Task 11: implement ZIP export and package assembly

## Stack

- Next.js 15
- React 19
- GSAP 3
- TypeScript 5
- Tailwind CSS 4
- Zod 4
- Vitest 2

## What Landed

- App Router scaffold with a founder-facing landing experience
- Tailwind, TypeScript, ESLint, and PostCSS config
- GSAP-powered marquee and handoff motion layer for the landing page
- Shared schemas for prospect input, routed plans, and the `DemoPackage` manifest
- Fixture adapter and sample fixture data for deterministic local development
- Client-side prospect intake form with inline validation and routed loading, success, and error states
- Deterministic template routing, bounded crawl target selection, and readable credit estimates
- `/api/generate` route that returns a normalized fixture-backed `DemoPackage`
- Structured route errors that the intake UI can render cleanly
- Shared result rendering for summary metadata, template preview content, provenance links, architecture notes, credit estimates, and package files
- Docs Intelligence generator that returns source-linked answers and exportable README/JSON artifacts
- Change Monitor generator that returns tracked-page summaries, alert-ready monitoring value, and exportable README/JSON artifacts
- Account Research generator that returns concise pricing, product, customer, and hiring signals with a pre-call brief and exportable README/JSON artifacts
- Firecrawl mode resolution with `auto`, `fixture`, and `live` behavior plus a bounded live crawl adapter
- Fixture fallback messaging in the result surface so the active data source is visible to the founder
- Unit and integration coverage for contract validation, fixture parsing, routing, credit estimates, route orchestration, the intake form flow, the demo preview renderer, the live adapter, and the Docs Intelligence, Change Monitor, and Account Research slices

## Commands

```bash
npm install
npm run dev
npm run build
npm run lint
npm run typecheck
npm run test
```

## Firecrawl Modes

Jackbox supports three server-side Firecrawl modes through
`JACKBOX_FIRECRAWL_MODE`:

- `auto` (default): use live Firecrawl when `FIRECRAWL_API_KEY` is present,
  otherwise fall back to fixtures
- `fixture`: always use deterministic fixture data
- `live`: require `FIRECRAWL_API_KEY` and fail clearly if live crawling is not
  available

Example WSL session:

```bash
export JACKBOX_FIRECRAWL_MODE=fixture
npm run dev
```

```bash
export FIRECRAWL_API_KEY=your_key_here
export JACKBOX_FIRECRAWL_MODE=live
npm run dev
```

For a targeted verification run:

```bash
npm run test:run -- tests/integration/docs-intelligence.test.ts tests/integration/demo-preview.test.tsx
npm run test:run -- tests/integration/change-monitor.test.ts
npm run test:run -- tests/integration/account-research.test.ts
npm run test:run -- tests/integration/firecrawl-adapter.test.ts
```

## Verification

The current Task 10 slice passes:

- `npm run build`
- `npm run lint`
- `npm run typecheck`
- `npm run test:run`

## Repository Notes

- Fixture files live under `docs/fixtures/`
- Shared validation and manifest contracts live under `lib/`
- The current UI calls `/api/generate` and renders the returned `DemoPackage` directly in the result shell
- Shared preview components live under `components/demo-preview.tsx`, `components/result-summary.tsx`, and `components/source-provenance.tsx`
- The Account Research preview adds a dedicated motion-rich research surface at `components/account-research-preview.tsx`
- The Firecrawl adapter lives under `lib/firecrawl/` and exposes both live and fixture-backed loading paths
- Template-specific vertical slices and the live adapter are complete through Task 10; the next step is ZIP export
