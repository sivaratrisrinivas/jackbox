# Jackbox

Jackbox is a founder-facing prospect demo generator. You give it a company URL
and a one-sentence pain point, and it turns that into a tailored Firecrawl demo
package with a routed template, rationale, provenance, and exportable artifacts.

## Current Status

The repo is now bootstrapped and ready for the next product slice.

Completed:
- Task 1: bootstrap the Next.js app shell
- Task 2: define core contracts and fixture loading

Next in sequence:
- Task 3: build the intake form and stubbed result shell
- Task 4: implement routing, crawl target selection, and credit estimates
- Task 5: build the generation orchestration route
- Task 6: render the shared preview from `DemoPackage`

## Stack

- Next.js 15
- React 19
- TypeScript 5
- Tailwind CSS 4
- Zod 4
- Vitest 2

## What Landed

- App Router scaffold with a placeholder Jackbox landing screen
- Tailwind, TypeScript, ESLint, and PostCSS config
- Shared schemas for prospect input, routed plans, and the `DemoPackage` manifest
- Fixture adapter and sample fixture data for deterministic local development
- Unit coverage for contract validation and fixture parsing

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
npm run test:run -- tests/unit/contracts.test.ts
```

## Verification

The current foundation passes:

- `npm run build`
- `npm run lint`
- `npm run typecheck`
- `npm run test:run -- tests/unit/contracts.test.ts`

## Repository Notes

- Fixture files live under `docs/fixtures/`
- Shared validation and manifest contracts live under `lib/`
- The current UI is intentionally a foundation slice, not the final product experience
