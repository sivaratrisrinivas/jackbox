# Jackbox

Jackbox is a founder-facing prospect demo generator. You give it a company URL
and a one-sentence pain point, and it turns that into a tailored Firecrawl demo
package with a routed template, rationale, provenance, and exportable artifacts.

## Current Status

The repo is now through the Account Research template slice. A founder can
submit a fixture-backed prospect brief, receive a normalized package manifest,
and see source-linked docs answers, tracked-page monitoring summaries, or a
compact account research brief with grounded team context, provenance,
architecture notes, credit estimates, and template-specific package files
rendered from the same contract.

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

Next in sequence:
- Task 10: add the Firecrawl live adapter with bounded fallback behavior

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
- Unit and integration coverage for contract validation, fixture parsing, routing, credit estimates, route orchestration, the intake form flow, the demo preview renderer, and the Docs Intelligence, Change Monitor, and Account Research slices

## Commands

```bash
npm install
npm run dev
npm run build
npm run lint
npm run typecheck
npm run test
```

For a targeted verification run:

```bash
npm run test:run -- tests/integration/docs-intelligence.test.ts tests/integration/demo-preview.test.tsx
npm run test:run -- tests/integration/change-monitor.test.ts
npm run test:run -- tests/integration/account-research.test.ts
```

## Verification

The current Task 9 slice passes:

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
- Template-specific vertical slices are complete through Task 9; the next step is the live Firecrawl adapter
