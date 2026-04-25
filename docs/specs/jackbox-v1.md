# Spec: Jackbox V1 - Prospect Demo Generator

## Assumptions I'm Making
1. This is a desktop-first web application for founder-led sales, not a native app.
2. V1 optimizes for the most impressive live demo, not for multi-user collaboration or production deployment.
3. The implementation will use a single Next.js + TypeScript codebase with App Router.
4. V1 only uses public prospect data: website, docs, pricing, blog, help center, and jobs pages.
5. The system starts with exactly three curated demo templates and a deterministic use-case router.
6. The primary artifact is a previewable mini demo web app, with supporting README, architecture notes, and ZIP export.
7. Firecrawl access will be available at implementation time, but local development and tests must work with fixtures and mocks.
8. "Done" for V1 means founder-safe demo generation in minutes, not production-grade codegen for customer delivery.

## Objective
Build Jackbox as a founder-facing tool that turns a prospect URL and a one-sentence pain statement into a tailored Firecrawl demo package quickly enough to use before or during a sales call.

The user is a founder doing founder-led sales who needs a concrete, prospect-specific demo without spending days building a custom proof of concept. The core value is speed-to-relevance: instead of showing generic Firecrawl capabilities, Jackbox shows the prospect's own public data, wrapped in a focused demo experience that maps to their likely workflow.

## Recommended Product Shape
Jackbox is not a general "solution engineer in a box" for V1. It is a **Prospect Demo Generator** with a narrow workflow:

1. User enters a company URL and one sentence describing the buyer's pain.
2. Jackbox crawls the prospect's public surface with Firecrawl.
3. A router chooses one of three curated demo templates.
4. Jackbox fills that template with prospect-specific data and copy.
5. The UI shows a preview, the reasoning behind the chosen template, a rough Firecrawl credit estimate, and a ZIP export.

## Demo Templates
V1 ships with exactly three templates:

1. **Docs Intelligence**
   - Best for: docs-heavy products, support, onboarding, internal knowledge use cases.
   - Output: a mini app that answers questions from crawled docs with source citations.

2. **Change Monitor**
   - Best for: competitor tracking, pricing intelligence, release monitoring, market research.
   - Output: a dashboard showing tracked pages, extracted changes, and alert-style summaries.

3. **Account Research Brief**
   - Best for: sales research, lead enrichment, account planning, prospect qualification.
   - Output: a compact research workspace built from product pages, pricing, jobs, and docs.

The router must choose one template only. V1 does not compose multiple templates into one experience.

## Tech Stack
- Next.js 15.x
- React 19.x
- TypeScript 5.x
- Tailwind CSS 4.x
- Zod 3.x for input validation and structured outputs
- Firecrawl SDK for crawl/search extraction
- Vitest 2.x for unit and integration tests
- Playwright 1.x for end-to-end verification

## Commands
Setup: `npm install`
Dev: `npm run dev`
Build: `npm run build`
Lint: `npm run lint`
Typecheck: `npm run typecheck`
Unit + integration tests: `npm run test`
E2E tests: `npm run test:e2e`

## Project Structure
```text
app/                    -> Next.js App Router pages, layouts, server actions, API routes
components/             -> Reusable UI components for forms, previews, status, and exports
lib/
  firecrawl/            -> Firecrawl client wrappers, fixtures, normalization helpers
  router/               -> Use-case classification and routing logic
  generation/           -> Template filling, package assembly, README generation
  estimates/            -> Rough credit and crawl scope estimation
  validation/           -> Zod schemas and input/output guards
templates/
  docs-intelligence/    -> Curated template source for docs demo generation
  change-monitor/       -> Curated template source for monitoring demo generation
  account-research/     -> Curated template source for research demo generation
tests/
  unit/                 -> Small logic tests for routing, estimation, and validation
  integration/          -> End-to-end orchestration tests with mocked Firecrawl responses
e2e/                    -> Browser-level happy-path tests for the Jackbox UI
docs/
  specs/                -> Product and technical specifications
  fixtures/             -> Recorded crawl payloads and prospect examples for demos/tests
```

## Code Style
Prefer typed, explicit orchestration over clever agent loops. Template generation should stay deterministic and inspectable.

```ts
import { z } from "zod";

const ProspectInput = z.object({
  companyUrl: z.string().url(),
  painPoint: z.string().min(10).max(240),
});

type TemplateId = "docs-intelligence" | "change-monitor" | "account-research";

export interface RoutedDemoPlan {
  templateId: TemplateId;
  reason: string;
  crawlTargets: string[];
}

export function routeProspect(input: z.infer<typeof ProspectInput>): RoutedDemoPlan {
  // Keep routing deterministic so the output is debuggable and founder-safe.
  return {
    templateId: "account-research",
    reason: "Pricing, jobs, and product pages suggest a research-led sales motion.",
    crawlTargets: [input.companyUrl],
  };
}
```

Key conventions:
- TypeScript everywhere; no untyped `any` in core orchestration paths.
- Server-side logic lives under `lib/` or route handlers, not inside UI components.
- Templates are edited as source assets, not generated ad hoc at runtime.
- External API calls must be wrapped so fixtures can replace live data in tests.
- Generated copy should be concise, specific, and traceable to crawled inputs.

## Testing Strategy
- **Unit tests:** routing heuristics, URL normalization, crawl-target selection, credit estimation, and template variable filling.
- **Integration tests:** full input-to-output orchestration using recorded Firecrawl fixtures for at least one example per template.
- **Golden output checks:** generated README and metadata summaries compared against stable snapshots where useful.
- **E2E tests:** one founder happy path: enter URL + pain point, see routed template, preview rendered, export available.
- **Coverage expectation:** test the routing and generation core heavily; UI chrome can stay lighter if the logic is already covered.
- **Non-goal for tests:** no brittle tests against live third-party pages or live Firecrawl billing behavior.

## Boundaries
- **Always:**
  - Validate URL and pain-point input before any crawl begins.
  - Show which template was chosen and why.
  - Keep template generation bounded to curated files and structured placeholders.
  - Preserve provenance for generated insights by linking them back to crawled pages.
  - Support fixture-driven local development for repeatable demos.

- **Ask first:**
  - Adding authentication or multi-user state.
  - Adding a fourth template or changing the core template set.
  - Introducing background jobs, queues, or persistent databases.
  - Deploy automation, cloud storage, or one-click publish flows.
  - Any dependency that materially changes bundle size or hosting model.

- **Never:**
  - Crawl authenticated pages or private customer content in V1.
  - Present generated code as production-ready customer deliverables.
  - Let the model invent entirely new app structures outside the curated templates.
  - Build a template marketplace, full CRM, or general autonomous SE agent in V1.
  - Store prospect crawl data indefinitely by default.

## Success Criteria
- A founder can submit a company URL and one-sentence pain point from a single landing screen.
- Jackbox selects one of the three templates and explains the choice in plain English.
- Jackbox produces a previewable mini demo app package using the prospect's public data and language.
- The result also includes:
  - a short architecture explanation,
  - a rough Firecrawl credit estimate,
  - a short "why this matters to your team" note,
  - and a ZIP export of the generated package.
- On three seeded prospect examples, one per template, the system returns a coherent result in under 10 minutes.
- A founder can go from new prospect URL to founder-safe tailored demo in under 30 minutes, including review time.
- V1 can be demoed reliably using fixtures if live crawling is slow or unavailable.

## Out of Scope
- Production deployment of generated demos
- OAuth, org accounts, or role-based permissions
- Full repo scaffolding for arbitrary frameworks
- Marketplace/community template browsing
- Background refresh or scheduled monitoring
- Human-in-the-loop editing environments beyond simple copy review

## Open Questions
- Should ZIP export include runnable code only, or also a rendered static preview artifact?
- How opinionated should the visual design of generated demos be across the three templates?
- What is the minimum crawl depth/page budget that still produces convincing results for a live demo?
- Should the Account Research Brief template be framed as a research workspace or a sales intelligence dashboard?
