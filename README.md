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
