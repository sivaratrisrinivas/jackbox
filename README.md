# Jackbox

Jackbox turns a company URL and one sentence about a buyer's problem into a
tailored demo package. It helps a founder show a prospect something specific to
their own public website instead of giving a generic product walkthrough.

## What It Does

Jackbox asks for two things:

- a company website
- the problem you want to solve for that company

It then creates a demo preview with:

- the demo type Jackbox chose
- a short reason for that choice
- a preview built from saved or live website data
- links back to the source pages used
- a rough Firecrawl credit estimate
- a ZIP download with the demo notes and files

Jackbox currently supports three demo types:

- **Docs Intelligence:** answers questions using a company's public docs
- **Change Monitor:** tracks public pages such as pricing, releases, and product pages
- **Account Research Brief:** creates a short pre-call research brief for sales conversations

## Why It Exists

Founder-led sales works best when the demo feels personal. Building a custom demo
for every prospect takes too long, and a generic demo can feel disconnected from
the buyer's actual problem.

Jackbox gives the founder a faster middle path:

- use the prospect's public website as the starting point
- choose one focused demo type
- show why that demo type fits the buyer's problem
- keep the sources visible so the result is easy to trust
- export the result so it can be shared after the call

The goal is not to create production-ready customer software. The goal is to make
a focused, credible demo package that is useful during a sales conversation.

## How It Works

1. You enter a company URL and a buyer pain point.
2. Jackbox checks that the input is usable.
3. Jackbox loads public website data.
4. It picks one of the three demo types.
5. It builds a preview and explains the choice.
6. You can download a ZIP with the generated README, data, and template files.

For local demos and tests, Jackbox can use saved fixture data. This means you can
show the full flow without needing a live Firecrawl key.

## How To Run It

Install dependencies:

```bash
npm install
```

Start the app:

```bash
npm run dev
```

Open the local URL shown by Next.js, usually:

```text
http://localhost:3000
```

## How To Run A Saved Demo

Saved demos are the easiest way to try Jackbox. They use example company URLs and
saved website data, so the result is repeatable.

Start the app in fixture mode:

```bash
export JACKBOX_FIRECRAWL_MODE=fixture
npm run dev
```

Then use one of these inputs:

| Demo type | Company URL | Pain point |
| --- | --- | --- |
| Docs Intelligence | `https://acme.example.com` | `Support teams cannot answer product questions from the latest docs fast enough.` |
| Change Monitor | `https://signalforge.example.com` | `Product marketing needs to track competitor pricing and release page changes before weekly planning.` |
| Account Research Brief | `https://northstar.example.com` | `Sales needs a sharper account research brief before qualification calls.` |

These same saved demos live in
`docs/fixtures/seeded-scenarios.json`.

## How To Use Live Firecrawl Data

Fixture mode is best for repeatable demos. Live mode is for trying real company
websites.

Set your Firecrawl key and start the app in live mode:

```bash
export FIRECRAWL_API_KEY=your_key_here
export JACKBOX_FIRECRAWL_MODE=live
npm run dev
```

Jackbox also supports an automatic mode:

```bash
export JACKBOX_FIRECRAWL_MODE=auto
npm run dev
```

In automatic mode, Jackbox uses live Firecrawl data when a key is available. If
there is no key, it uses saved fixture data instead.

## ZIP Export: What, Why, And How

### What

After Jackbox creates a preview, the result screen shows a `Download ZIP` button.
The ZIP contains:

- `README.md`: a plain-English summary of the generated demo
- `metadata/demo-package.json`: the structured data behind the preview
- template files for the chosen demo type

### Why

The preview helps during the call. The ZIP gives you something to keep, inspect,
and share afterward. It keeps the sources, reasoning, estimate, and generated
files together in one place.

### How

Run Jackbox, generate a preview, then click `Download ZIP`.

To test the export route directly:

```bash
npm run test:run -- tests/integration/export-route.test.ts tests/integration/demo-preview.test.tsx
```

## Browser Test: What, Why, And How

### What

The browser test opens Jackbox, fills in the form, generates a demo preview, and
checks that the ZIP download button is visible.

### Why

This catches problems that smaller tests can miss, such as the form failing to
reach the server or the result screen failing to appear.

### How

Run the browser test from WSL:

```bash
npm run test:e2e
```

If the browser runtime is missing, install it once from WSL:

```bash
TMPDIR=/tmp TMP=/tmp TEMP=/tmp PLAYWRIGHT_BROWSERS_PATH=/tmp/ms-playwright npx playwright install chromium
```

## Common Commands

```bash
npm run dev
npm run build
npm run lint
npm run typecheck
npm run test:run
npm run test:e2e
```

## Current Status

Task 12 is complete. The app can:

- generate all three saved demo types
- use fixture mode or live Firecrawl mode
- show a preview with sources and a credit estimate
- export the generated package as a ZIP
- run unit, integration, and browser tests

Verified commands:

- `npm run build`
- `npm run lint`
- `npm run typecheck`
- `npm run test:run`
- `npm run test:e2e`

## Where Things Live

- `app/`: app routes and API routes
- `components/`: form, preview, result, and export UI
- `lib/`: validation, routing, Firecrawl loading, estimates, and package building
- `templates/`: files used for each demo type
- `docs/fixtures/`: saved demo data
- `e2e/`: browser test
