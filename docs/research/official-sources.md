# Official Sources for Jackbox V1

This document collects the official docs we need before implementation so the starter, UI patterns, validation, testing, and Firecrawl integration are grounded in current source material instead of memory.

## Scope

These are the official sources needed for the current plan and Task 1 through Task 12 in [`docs/specs/jackbox-v1.md`](../specs/jackbox-v1.md) and [`docs/plans/jackbox-v1-implementation-plan.md`](../plans/jackbox-v1-implementation-plan.md).

If the architecture changes later, we should add the new official sources here before changing code.

## Verified Sources

### Next.js

1. **App Router installation**
   - URL: https://nextjs.org/docs/app/getting-started/installation
   - Why it matters:
     - Confirms the recommended starter path is `create-next-app`.
     - Confirms the default setup includes TypeScript, Tailwind CSS, ESLint, App Router, and Turbopack.
     - Confirms the minimum Node.js version is 20.9 and WSL is supported.

2. **`create-next-app` CLI**
   - URL: https://nextjs.org/docs/app/api-reference/cli/create-next-app
   - Why it matters:
     - Confirms CLI flags and defaults for `--typescript`, `--tailwind`, `--eslint`, `--app`, `--yes`, and `--disable-git`.
     - This is the authoritative source for how we should scaffold the starter once networked install is approved.

3. **App Router layouts and pages**
   - URL: https://nextjs.org/docs/app/getting-started/layouts-and-pages
   - Why it matters:
     - Confirms App Router file conventions.
     - Confirms the root layout is required and must contain `<html>` and `<body>`.

4. **Route Handlers**
   - URL: https://nextjs.org/docs/app/getting-started/route-handlers
   - Why it matters:
     - Confirms `route.ts` is the right API surface for `/api/generate` and `/api/export`.
     - Confirms a `route.ts` cannot exist at the same route segment level as `page.tsx`.

5. **Forms with Server Actions**
   - URL: https://nextjs.org/docs/app/guides/forms
   - Why it matters:
     - Confirms current Next guidance for forms, pending states, client/server validation, and `useActionState`.
     - Also explicitly points to Zod for server-side validation examples.

6. **Vitest with Next.js**
   - URL: https://nextjs.org/docs/app/guides/testing/vitest
   - Why it matters:
     - Confirms the current manual setup for Vitest in a Next.js app.
     - Confirms an important limitation: Vitest does not support `async` Server Components well, so E2E should cover those flows.

7. **Playwright with Next.js**
   - URL: https://nextjs.org/docs/app/guides/testing/playwright
   - Why it matters:
     - Confirms the recommended integration path for E2E in a Next app.
     - Gives the expected starter shape for Playwright config and example tests.

### Tailwind CSS

8. **Tailwind with Next.js**
   - URL: https://tailwindcss.com/docs/installation/framework-guides/nextjs
   - Why it matters:
     - Confirms the current Tailwind + Next integration path.
     - Confirms use of `@tailwindcss/postcss` and `@import "tailwindcss";` in `app/globals.css`.

### React

9. **`useActionState`**
   - URL: https://react.dev/reference/react/useActionState
   - Why it matters:
     - Confirms current React behavior for form actions and pending state.
     - Confirms `dispatchAction` must be called from an Action or inside `startTransition`.

### Zod

10. **Zod intro**
    - URL: https://zod.dev/
    - Why it matters:
      - Confirms Zod 4 is the current stable line.
      - Confirms installation and strict TypeScript expectations.

11. **Zod basics**
    - URL: https://zod.dev/basics
    - Why it matters:
      - Confirms `.parse`, `.parseAsync`, and `.safeParse` usage.
      - We will use this for request validation and manifest parsing.

12. **Zod error formatting**
    - URL: https://zod.dev/error-formatting
    - Why it matters:
      - Confirms the recommended utilities for turning validation errors into UI-friendly output.

### Firecrawl

13. **Firecrawl API v2 introduction**
    - URL: https://docs.firecrawl.dev/api-reference/v2-introduction
    - Why it matters:
      - Confirms base URL, auth header shape, and core endpoints.
      - Confirms common response codes for adapter error handling.

14. **Firecrawl crawl**
    - URL: https://docs.firecrawl.dev/features/crawl
    - Why it matters:
      - Confirms crawl behavior, `POST /v2/crawl`, polling model, credit model, and `scrapeOptions`.
      - Important product constraint: each page consumes 1 credit and the default `limit` is 10,000 pages, so Jackbox must set a much lower explicit limit.

15. **Firecrawl Node SDK**
    - URL: https://docs.firecrawl.dev/sdks/node
    - Why it matters:
      - Confirms the official Node SDK package, initialization shape, `FIRECRAWL_API_KEY`, and the current `scrape` / `crawl` methods.
      - Confirms the SDK handles pagination, retries, and async polling.

### Playwright Core

16. **Playwright installation**
    - URL: https://playwright.dev/docs/intro
    - Why it matters:
      - Confirms the official install path for Playwright itself.
      - Confirms system requirements and the expected generated files.

## Decisions Grounded by These Sources

1. **Scaffold from official Next defaults**
   - We should scaffold from `create-next-app` rather than hand-writing a package baseline.
   - This keeps the dependency set current and aligned with official defaults.

2. **Use App Router**
   - The app will use `app/page.tsx`, `app/layout.tsx`, and route handlers in `app/api/**/route.ts`.

3. **Use route handlers for generation/export APIs**
   - `POST /api/generate` and `GET` or `POST /api/export` should live in route handlers, not Pages Router API routes.

4. **Use Tailwind via the current PostCSS plugin path**
   - Tailwind setup should follow the `@tailwindcss/postcss` path and `@import "tailwindcss";`.

5. **Use Zod for server validation**
   - Request payloads, Firecrawl responses we normalize, and the `DemoPackage` manifest should all be validated with Zod.

6. **Prefer Vitest for unit/integration logic, Playwright for end-to-end**
   - Since Next notes a limitation with `async` Server Components in Vitest, we should keep core logic testable in Vitest and use Playwright for the full founder flow.

7. **Bound Firecrawl crawl cost explicitly**
   - Jackbox should never rely on the default crawl limit.
   - We should always send an explicit low `limit` and constrained `scrapeOptions`.

8. **Keep Firecrawl behind an adapter**
   - The official Node SDK is the right live path, but the app still needs fixture-backed local mode for deterministic demos and tests.

## Current Unknowns Still Waiting on Install

- The exact dependency versions that `create-next-app` will pin in `package.json`.
- The exact lint config file shape generated by the current starter.
- The exact Tailwind/PostCSS starter files generated by the current starter.

Those are not internet-doc gaps anymore; they are install-time details that will be resolved once the WSL-side scaffold/install is approved.
