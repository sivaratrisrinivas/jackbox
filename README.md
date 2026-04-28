# Jackbox

Jackbox turns a prospect URL and one buyer pain point into a source-backed demo
room for founder-led sales. The first screen collects the input. The second
screen gives the output: the recommended mini-POC, the talk track, source proof,
and a downloadable demo package.

## What It Does

Jackbox helps a founder prepare a prospect-specific Firecrawl demo without
building a one-off app by hand for every sales call.

The product accepts:

1. A public company URL.
2. A short description of the buyer pain.

It returns:

1. A routed demo type.
2. A reason the demo type fits the input.
3. A source-backed mini-POC concept.
4. A call-ready opener and demo path.
5. Source evidence from public pages.
6. A Firecrawl credit estimate.
7. A downloadable demo package.

Jackbox currently routes to three demo types:

1. **Docs Intelligence**: answers questions from public docs with citations.
2. **Change Monitor**: tracks public pages such as pricing, releases, and product pages.
3. **Account Research Brief**: summarizes public account signals before sales calls.

## Why It Exists

Generic demos are easy to run but hard for a prospect to care about. Fully
custom demos are persuasive but slow to prepare.

Jackbox sits between those two extremes:

1. It starts from the prospect's real public website.
2. It keeps the founder focused on one buyer pain.
3. It chooses a demo path instead of asking the user to configure one.
4. It keeps source links visible so generated copy is easy to trust.
5. It packages the result so the sales team can reuse it after the call.

The goal is not production customer software. The goal is a credible, specific,
call-ready artifact that makes a Firecrawl sales conversation sharper.

## How The Product Works

1. Open the app.
2. Enter the prospect URL and buyer pain on the input screen.
3. Submit the form.
4. Jackbox validates the URL and pain point.
5. Jackbox builds a crawl plan from the URL, pain point, and available fixture or live data.
6. Jackbox loads prospect data.
7. Jackbox ranks useful source evidence.
8. Jackbox routes the prospect to Docs Intelligence, Change Monitor, or Account Research.
9. Jackbox builds a deterministic solution engineer brief and sales story.
10. If Gemini is enabled, Jackbox may improve the story and brief while keeping the same grounded facts.
11. Jackbox renders the output screen.
12. The user can copy the call script or download the demo package.

## Architecture At A Glance

Jackbox is a single Next.js App Router application. It has no database and no
auth in V1. State is request-scoped: the browser submits an input, the server
returns a typed `DemoPackage`, and the browser renders or exports that package.

The main flow is:

```text
components/prospect-form.tsx
  -> POST /api/generate
    -> ProspectInputSchema
    -> createProspectDataLoader()
      -> fixture loader, Firecrawl client, or direct fetch fallback
    -> routeProspect()
    -> estimateCredits()
    -> extractRankedEvidence()
    -> buildSolutionEngineerBrief()
    -> buildDemoStory()
    -> optional Gemini enhancement
    -> selected template builder
    -> DemoPackageSchema
  -> components/result-shell.tsx
    -> ResultSummary
    -> DemoRoom
      -> POST /api/export
```

The video path is separate:

```text
DemoPackage
  -> POST /api/video
    -> buildDemoVideoProps()
    -> Remotion bundle + ProspectDemo composition
    -> video/mp4 response
```

## Core Contract: DemoPackage

`DemoPackage` is the main contract between routing, generation, UI, export, and
video. It is defined in `lib/generation/demo-package.ts` and validated with Zod.

Every generated package contains:

1. `id`: stable generated package id.
2. `templateId`: one of `docs-intelligence`, `change-monitor`, or `account-research`.
3. `createdAt`: ISO timestamp.
4. `input`: the validated company URL and buyer pain.
5. `routedPlan`: selected template, explanation, and crawl targets.
6. `summary`: headline, "why this matters", and architecture note.
7. `preview`: template-specific payload plus story and solution brief.
8. `provenance`: source labels, URLs, and excerpts.
9. `creditEstimate`: rough crawl, extraction, and packaging estimate.
10. `files`: exportable template files.

When adding a new surface, prefer reading from `DemoPackage` rather than
recomputing generation state in the UI.

## Server Routes

| Route | Method | Input | Output | Purpose |
| --- | --- | --- | --- | --- |
| `/api/generate` | `POST` | `ProspectInput` | `DemoPackage` JSON | Validates founder input and runs the full generation pipeline. |
| `/api/export` | `POST` | `DemoPackage` | ZIP binary | Builds `README.md`, metadata, and template files into a downloadable archive. |
| `/api/video` | `POST` | `DemoPackage` | MP4 binary | Renders the Remotion `ProspectDemo` composition from the generated package. |

All routes return structured JSON errors for invalid JSON and validation
failures. `/api/generate` also has a server timeout controlled by
`JACKBOX_GENERATION_TIMEOUT_MS`.

## Data Loading Step By Step

Jackbox can run in fixture, live, or automatic mode.

### Fixture Mode

1. Jackbox maps seeded hosts to saved fixture files.
2. It loads the matching file from `docs/fixtures/`.
3. It uses that saved data to generate a deterministic demo room.

Fixture mode is best for local demos, tests, and repeatable screenshots.

### Live Mode

1. Jackbox builds a bounded list of same-origin public crawl targets.
2. It calls Firecrawl through the adapter in `lib/firecrawl/client.ts`.
3. It normalizes the returned pages into the same shape as fixtures.
4. It enriches sparse Firecrawl output with direct public fetches when possible.
5. If live crawling fails in automatic mode, it falls back to fixtures.

Live mode is best for real prospect research when `FIRECRAWL_API_KEY` is
available.

### Direct Fetch Enrichment

If Firecrawl returns sparse data or fails in a recoverable path, Jackbox can fetch
the same public targets directly. The direct fetch path:

1. Requests same-origin HTML, plain text, or Markdown pages.
2. Extracts titles, descriptions, headings, lists, and paragraphs.
3. Removes scripts, styles, SVGs, and duplicate lines.
4. Merges useful lines back into the prospect fixture shape.

This keeps the output useful when a live crawl is thin.

## Routing And Evidence Step By Step

Routing is deterministic and lives in `lib/router/route-prospect.ts`.

1. Jackbox combines the URL, buyer pain, and any loaded fixture text.
2. It scores the text against keyword sets for each template.
3. It picks the highest-scoring template.
4. If nothing matches, it defaults to Account Research.
5. It chooses up to five same-origin crawl targets with `selectCrawlTargets()`.

Evidence ranking lives in `lib/generation/evidence.ts`.

1. Pages are split into normalized lines and sentence-sized segments.
2. Low-value signals such as cookie banners, nav text, login prompts, and footer copy are rejected.
3. Remaining lines are scored for template fit, specificity, source context, and pain-point overlap.
4. Results are deduped and diversified across page types and URLs.
5. Fallback evidence uses the first meaningful source lines when ranking is sparse.

## Template Generation Step By Step

Template orchestration lives in `lib/generation/templates/`. The curated template
source lives in `templates/`.

1. Docs Intelligence builds source-linked questions and answers from docs-like evidence.
2. Change Monitor builds tracked page summaries and alert-ready monitoring copy.
3. Account Research builds executive summary, discovery angles, and account signals.

Each template returns:

1. A template-specific `preview` object.
2. Exportable `files` with paths, descriptions, media types, and content.

The templates are curated assets. The LLM can improve wording in the story and
solution brief, but it does not invent arbitrary app structures.

## Output Screen Step By Step

After generation, the input screen is replaced by a dedicated output screen.

The output screen shows:

1. The selected template.
2. Whether the sources are live or saved.
3. The number of sources used.
4. The recommended mini-POC.
5. The workflow and buyer team.
6. The opener for a live sales call.
7. The call path.
8. The strongest source proof.
9. Actions to copy the call script or download the demo package.

The UI is intentionally quiet: the input and output are on separate screens, and
decorative elements were removed so the sales artifact is the center of gravity.

## Demo Package Step By Step

When the user clicks `Download demo package`, Jackbox:

1. Sends the generated demo package to `/api/export`.
2. Builds a ZIP in memory.
3. Adds a generated `README.md`.
4. Adds `metadata/demo-package.json`.
5. Adds template files for the selected demo type.
6. Downloads the ZIP in the browser.

The package keeps the generated story, provenance, estimates, and files together
so the result can be inspected or shared after the call.

## Video Route

The project also includes Remotion wiring for demo video generation. The video
route and Remotion files live in:

1. `app/api/video/`
2. `remotion/`
3. `lib/video/`

This is separate from the main two-screen product flow. The demo room remains the
primary sales artifact.

## Environment Variables

| Variable | Default | Used by | Purpose |
| --- | --- | --- | --- |
| `JACKBOX_FIRECRAWL_MODE` | `auto` | `lib/firecrawl/mode.ts` | Chooses `auto`, `fixture`, or `live` data loading. |
| `FIRECRAWL_API_KEY` | unset | `lib/firecrawl/client.ts` | Enables live Firecrawl crawling. |
| `FIRECRAWL_CRAWL_TIMEOUT_MS` | `20000` | Firecrawl client | Bounds live crawl polling. |
| `JACKBOX_GENERATION_TIMEOUT_MS` | `55000` | `/api/generate` | Bounds the full generation route. |
| `GEMINI_API_KEY` | unset | `lib/llm/demo-story-enhancer.ts` | Enables optional Gemini enhancement outside tests. |
| `GEMINI_MODEL` | `gemini-3-flash-preview` | Gemini enhancer | Selects the Gemini model. |
| `GEMINI_TIMEOUT_MS` | `8000` | Gemini enhancer | Bounds each Gemini enhancement call. |
| `JACKBOX_PIPELINE_LOGS` | enabled outside tests | `lib/observability/pipeline-log.ts` | Set to `0` to silence pipeline logs. |

Playwright clears `GEMINI_API_KEY` for its web server so e2e tests stay
deterministic.

## Run The App Locally

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Open the URL printed by Next.js. It is usually:

```text
http://localhost:3000
```

## Run A Saved Demo

Saved demos are the fastest way to test the product because they do not require
external API keys.

Start the app in fixture mode:

```bash
export JACKBOX_FIRECRAWL_MODE=fixture
npm run dev
```

Use one of these inputs:

| Demo type | Company URL | Pain point |
| --- | --- | --- |
| Docs Intelligence | `https://acme.example.com` | `Support teams cannot answer product questions from the latest docs fast enough.` |
| Change Monitor | `https://signalforge.example.com` | `Product marketing needs to track competitor pricing and release page changes before weekly planning.` |
| Account Research Brief | `https://northstar.example.com` | `Sales needs a sharper account research brief before qualification calls.` |

The seeded scenarios are also listed in
`docs/fixtures/seeded-scenarios.json`.

## Run With Live Firecrawl

Set a Firecrawl key and force live mode:

```bash
export FIRECRAWL_API_KEY=your_key_here
export JACKBOX_FIRECRAWL_MODE=live
npm run dev
```

Or use automatic mode:

```bash
export JACKBOX_FIRECRAWL_MODE=auto
npm run dev
```

Automatic mode uses live Firecrawl data when a key is present. Without a key, it
uses fixtures.

## Optional Gemini Enhancement

Jackbox can run without Gemini. The deterministic story and solution engineer
brief are built locally.

If `GEMINI_API_KEY` is present outside test mode, Jackbox attempts to enhance the
brief and sales story:

```bash
export GEMINI_API_KEY=your_key_here
npm run dev
```

The enhancer is bounded by a timeout and falls back to deterministic output if it
cannot produce valid grounded JSON.

## Test It In WSL

Run the main checks:

```bash
npm run lint
npm run typecheck
npm run test:run
npm run test:e2e
```

The e2e test starts Next.js on port `3100` in fixture mode. It also clears
`GEMINI_API_KEY` for the web server so the browser flow stays deterministic.

If Playwright browsers are missing in WSL, install Chromium into the same path
used by the test script:

```bash
TMPDIR=/tmp TMP=/tmp TEMP=/tmp PLAYWRIGHT_BROWSERS_PATH=/tmp/ms-playwright npx playwright install chromium
```

Then rerun:

```bash
npm run test:e2e
```

## Common Commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Starts the Next.js development server. |
| `npm run build` | Builds the app for production. |
| `npm run lint` | Runs ESLint across app, components, lib, Remotion, tests, and config files. |
| `npm run typecheck` | Runs TypeScript without emitting files. |
| `npm run test:run` | Runs the Vitest unit and integration suite once. |
| `npm run test:e2e` | Runs the Playwright browser flow in fixture mode. |

## Test Map

| Area | Tests |
| --- | --- |
| Contracts and validation | `tests/unit/contracts.test.ts`, `tests/unit/prospect-form.test.tsx` |
| Routing and estimates | `tests/unit/router.test.ts`, `tests/unit/estimate-credits.test.ts` |
| Firecrawl and fallback loading | `tests/integration/firecrawl-adapter.test.ts`, `tests/unit/direct-fetch.test.ts` |
| Evidence ranking | `tests/unit/evidence.test.ts` |
| Gemini parsing/fallback | `tests/unit/demo-story-enhancer.test.ts` |
| Generation route | `tests/integration/generate-route.test.ts` |
| Template slices | `tests/integration/docs-intelligence.test.ts`, `tests/integration/change-monitor.test.ts`, `tests/integration/account-research.test.ts` |
| Export route and preview rendering | `tests/integration/export-route.test.ts`, `tests/integration/demo-preview.test.tsx` |
| Browser happy path | `e2e/founder-flow.spec.ts` |

## Project Map

| Path | Purpose |
| --- | --- |
| `app/` | Next.js pages and API routes. |
| `app/api/generate/` | Generates the demo package from user input. |
| `app/api/export/` | Builds the downloadable ZIP package. |
| `app/api/video/` | Video generation route. |
| `components/` | Input screen, output screen, demo room, and preview UI. |
| `lib/firecrawl/` | Firecrawl adapter, fixture loading, mode resolution, and direct fetch fallback. |
| `lib/generation/` | Demo package, story, evidence, solution brief, export, and template orchestration. |
| `lib/llm/` | Optional Gemini enhancement. |
| `lib/router/` | Template selection and crawl target routing. |
| `templates/` | Generated files for each demo type. |
| `docs/fixtures/` | Saved prospect data and seeded scenarios. |
| `remotion/` | Remotion composition and rendering entry points. |
| `tests/` | Unit and integration tests. |
| `e2e/` | Playwright browser test. |

## How To Extend The Codebase

### Add Or Change A Template

1. Update `TemplateIdSchema` in `lib/validation/prospect.ts` if adding a new template.
2. Add route keywords and routing reasons in `lib/router/route-prospect.ts`.
3. Add crawl target preferences in `lib/router/select-crawl-targets.ts`.
4. Add credit assumptions in `lib/estimates/estimate-credits.ts`.
5. Add template preview and file builders under `templates/<template-id>/`.
6. Add orchestration under `lib/generation/templates/`.
7. Wire it into `generateDemoPackage()`.
8. Add fixture, integration, and browser coverage before relying on it in demos.

### Add A Fixture

1. Create `docs/fixtures/<fixture-id>.json`.
2. Match the JSON shape documented in `docs/fixtures/README.md`.
3. Include only public content that Jackbox is allowed to use.
4. Add the seeded scenario to `docs/fixtures/seeded-scenarios.json` if it should be demoable.
5. Add or update tests that assert the expected template route.

### Add A UI Surface

1. Read from `DemoPackage` instead of calling generation helpers in the component.
2. Keep the input and output screens separate.
3. Keep provenance visible when generated copy makes a claim.
4. Keep export and video routes server-side.

## Operational Boundaries

1. Jackbox only works with public website content in V1.
2. Live crawls are bounded to approved same-origin public paths.
3. Fixture mode is the preferred path for demos and tests.
4. Strict live mode requires `FIRECRAWL_API_KEY`; automatic mode can fall back.
5. Optional Gemini enhancement must stay grounded in ranked public surfaces.
6. Generated demo packages are sales artifacts, not production customer apps.
7. No prospect data is persisted by the app by default.

## Current Status

Jackbox can:

1. Render a quiet input screen and a separate output screen.
2. Generate all three saved demo types.
3. Use fixture mode, live Firecrawl mode, or automatic mode.
4. Enrich sparse live crawls with direct public fetches.
5. Optionally enhance the story and brief with Gemini.
6. Show a source-backed demo room with copy and download actions.
7. Export the generated package as a ZIP.
8. Run unit, integration, and browser tests in WSL.

Recent verification:

1. `npm run lint`
2. `npm run typecheck`
3. `npm run test:run -- tests/unit/prospect-form.test.tsx`
4. `npm run test:e2e`
