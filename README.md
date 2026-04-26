# Jackbox

Jackbox is a founder-facing prospect demo generator. You give it a company URL
and a one-sentence pain point, and it turns that into a tailored Firecrawl demo
package with a routed template, rationale, provenance, and exportable artifacts.

## Current Status

The repo is now through Task 12. A founder can submit a prospect brief, receive
a tailored demo package, preview the selected template, and download a ZIP file
with the README, template files, and metadata that match the preview. Jackbox can
use live Firecrawl data when credentials are present, and it can fall back to
fixtures so demos, integration tests, and browser e2e tests stay reliable.

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
- Task 11: implement ZIP export and package assembly
- Task 12: add seeded E2E demos, README guidance, and final polish

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
- ZIP export from the result screen, including a plain README, structured metadata, and the curated files for the chosen template
- Unit and integration coverage for contract validation, fixture parsing, routing, credit estimates, route orchestration, the intake form flow, the demo preview renderer, the live adapter, and the Docs Intelligence, Change Monitor, and Account Research slices

## ZIP Export: What, Why, and How

### What

When a preview finishes, the result screen shows a `Download ZIP` button. That
ZIP contains:

- `README.md`: a short explanation of the generated demo
- `metadata/demo-package.json`: the full structured package behind the preview
- Template files such as `docs-intelligence/README.md`,
  `change-monitor/monitor.json`, or `account-research/brief.json`

The export uses the package that Jackbox already generated. It does not invent a
new app or create files outside the curated template list.

### Why

The preview is useful during a sales call, but founders also need something they
can inspect, share, and keep. The ZIP gives them that handoff without making the
generated demo sound more complete than it is. It keeps the sources, routing
reason, credit estimate, and template files together in one portable archive.

### How

Run the app, generate a preview, then click `Download ZIP` in the result panel.

```bash
npm run dev
```

For a repeatable local demo, use fixture mode:

```bash
export JACKBOX_FIRECRAWL_MODE=fixture
npm run dev
```

To test the export route directly:

```bash
npm run test:run -- tests/integration/export-route.test.ts tests/integration/demo-preview.test.tsx
```

## Commands

```bash
npm install
npm run dev
npm run build
npm run lint
npm run typecheck
npm run test
npm run test:e2e
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

## Seeded Demo Walkthroughs

Fixture mode gives three repeatable founder demos. Start the app in WSL:

```bash
export JACKBOX_FIRECRAWL_MODE=fixture
npm run dev
```

Then use one of these inputs:

| Template | Company URL | Pain point |
| --- | --- | --- |
| Docs Intelligence | `https://acme.example.com` | `Support teams cannot answer product questions from the latest docs fast enough.` |
| Change Monitor | `https://signalforge.example.com` | `Product marketing needs to track competitor pricing and release page changes before weekly planning.` |
| Account Research Brief | `https://northstar.example.com` | `Sales needs a sharper account research brief before qualification calls.` |

The same scenarios are recorded in `docs/fixtures/seeded-scenarios.json` so
browser tests and live walkthroughs stay aligned.

## E2E Verification

The Playwright happy path covers submit -> routed result -> preview -> export
availability in fixture mode:

```bash
npm run test:e2e
```

The script pins temp and browser cache paths to `/tmp` for WSL. If the Chromium
runtime is missing, install it once from WSL:

```bash
TMPDIR=/tmp TMP=/tmp TEMP=/tmp PLAYWRIGHT_BROWSERS_PATH=/tmp/ms-playwright npx playwright install chromium
```

For a targeted verification run:

```bash
npm run test:run -- tests/integration/export-route.test.ts tests/integration/demo-preview.test.tsx
npm run test:run -- tests/integration/docs-intelligence.test.ts tests/integration/demo-preview.test.tsx
npm run test:run -- tests/integration/change-monitor.test.ts
npm run test:run -- tests/integration/account-research.test.ts
npm run test:run -- tests/integration/firecrawl-adapter.test.ts
npm run test:e2e
```

## Verification

The current Task 12 slice passes:

- `npm run build`
- `npm run lint`
- `npm run typecheck`
- `npm run test:run`
- `npm run test:e2e`

## Repository Notes

- Fixture files live under `docs/fixtures/`
- Shared validation and manifest contracts live under `lib/`
- The current UI calls `/api/generate` and renders the returned `DemoPackage` directly in the result shell
- Shared preview components live under `components/demo-preview.tsx`, `components/result-summary.tsx`, and `components/source-provenance.tsx`
- The Account Research preview adds a dedicated motion-rich research surface at `components/account-research-preview.tsx`
- The Firecrawl adapter lives under `lib/firecrawl/` and exposes both live and fixture-backed loading paths
- ZIP export lives under `app/api/export/route.ts`, `lib/generation/build-export.ts`, and `components/export-button.tsx`
- Seeded e2e coverage lives under `e2e/` with Playwright config in `playwright.config.ts`
