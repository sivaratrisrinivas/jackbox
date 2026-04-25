# Jackbox

Jackbox is a founder-facing prospect demo generator. You give it a company URL
and a one-sentence pain point, and it turns that into a tailored Firecrawl demo
package with a routed template, rationale, provenance, and exportable artifacts.

## Current Status

The repo is now through the fixture-backed generation orchestration slice.

Completed:
- Task 1: bootstrap the Next.js app shell
- Task 2: define core contracts and fixture loading
- Task 3: build the intake form and stubbed result shell
- Task 4: implement routing, crawl target selection, and credit estimates
- Task 5: build the generation orchestration route

Next in sequence:
- Task 6: render the shared preview from `DemoPackage`

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
- Unit coverage for contract validation, fixture parsing, routing, credit estimates, and the intake form flow
- `/api/generate` route that returns a normalized fixture-backed `DemoPackage`
- Structured route errors that the intake UI can render cleanly

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
npm run test:run -- tests/unit/router.test.ts tests/unit/estimate-credits.test.ts tests/unit/prospect-form.test.tsx
```

## Verification

The current Task 5 slice passes:

- `npm run build`
- `npm run lint`
- `npm run typecheck`
- `npm run test:run -- tests/integration/generate-route.test.ts tests/unit/prospect-form.test.tsx`

## Repository Notes

- Fixture files live under `docs/fixtures/`
- Shared validation and manifest contracts live under `lib/`
- The current UI calls `/api/generate` and adapts the returned `DemoPackage` into the existing result shell
- Shared preview rendering from the manifest lands next in Task 6
