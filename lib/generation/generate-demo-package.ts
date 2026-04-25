import { estimateCredits } from "@/lib/estimates/estimate-credits";
import type { ProspectFixture } from "@/lib/firecrawl/fixtures";
import {
  createProspectDataLoader,
  type ProspectDataLoader,
} from "@/lib/firecrawl/load-prospect-data";
import {
  DemoPackageSchema,
  type DemoPackage,
  type DemoFile,
  type DemoSource,
} from "@/lib/generation/demo-package";
import { generateAccountResearchTemplate } from "@/lib/generation/templates/account-research";
import { generateChangeMonitorTemplate } from "@/lib/generation/templates/change-monitor";
import { generateDocsIntelligenceTemplate } from "@/lib/generation/templates/docs-intelligence";
import { routeProspect } from "@/lib/router/route-prospect";
import { ProspectInputSchema, type ProspectInput } from "@/lib/validation/prospect";

const TEMPLATE_HEADLINES: Record<DemoPackage["templateId"], string> = {
  "docs-intelligence": "Citation-backed answers from the prospect's own docs",
  "change-monitor": "A focused monitor for public product and pricing changes",
  "account-research": "A pre-call workspace built from public account signals",
};

const TEMPLATE_ARCHITECTURE_NOTES: Record<DemoPackage["templateId"], string> = {
  "docs-intelligence":
    "The route bounds crawl targets to public docs-adjacent pages, extracts answer-ready snippets, and keeps every preview claim tied to source URLs.",
  "change-monitor":
    "The route scopes public pricing, release, and product pages so a later monitor can compare snapshots without crawling private surfaces.",
  "account-research":
    "The route gathers public company, product, pricing, and hiring pages into a compact research package for sales discovery.",
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function humanizeHost(companyUrl: string) {
  const host = new URL(companyUrl).hostname.replace(/^www\./, "");
  const [name] = host.split(".");

  return name
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function buildProvenance(fixture: ProspectFixture): DemoSource[] {
  return fixture.pages.map((page) => ({
    label: page.title,
    url: page.url,
    excerpt: page.markdown.split("\n").find((line) => line.trim().length > 0),
  }));
}

function buildFallbackPreview(
  input: ProspectInput,
  fixture: ProspectFixture,
  companyName: string,
) {
  return {
    companyName,
    fixtureId: fixture.fixtureId,
    sourcePageCount: fixture.pages.length,
    primarySourceTitle: fixture.pages[0]?.title,
    painPoint: input.painPoint,
  };
}

function buildFallbackFiles(): DemoFile[] {
  return [
    {
      path: "README.md",
      description: "Founder-facing package overview with routing rationale and source notes.",
      mediaType: "text/markdown",
    },
    {
      path: "manifest.json",
      description: "Structured DemoPackage metadata for preview rendering and export.",
      mediaType: "application/json",
    },
  ];
}

export async function generateDemoPackage(
  input: ProspectInput,
  dataLoader: ProspectDataLoader = createProspectDataLoader(),
): Promise<DemoPackage> {
  const parsedInput = ProspectInputSchema.parse(input);
  const fixture = await dataLoader.loadProspectData(parsedInput);
  const routedPlan = routeProspect(parsedInput, fixture);
  const creditEstimate = estimateCredits(routedPlan);
  const companyName = fixture.company.name || humanizeHost(parsedInput.companyUrl);
  const now = new Date().toISOString();
  const templateResult =
    routedPlan.templateId === "docs-intelligence"
      ? generateDocsIntelligenceTemplate(parsedInput, fixture)
      : routedPlan.templateId === "change-monitor"
        ? generateChangeMonitorTemplate(parsedInput, fixture)
        : routedPlan.templateId === "account-research"
          ? generateAccountResearchTemplate(parsedInput, fixture)
        : {
            preview: buildFallbackPreview(parsedInput, fixture, companyName),
            files: buildFallbackFiles(),
          };

  return DemoPackageSchema.parse({
    id: `demo_${slugify(companyName)}_${routedPlan.templateId}`,
    templateId: routedPlan.templateId,
    createdAt: now,
    input: parsedInput,
    routedPlan,
    summary: {
      headline: TEMPLATE_HEADLINES[routedPlan.templateId],
      whyThisMatters: `${companyName} can see a tailored Firecrawl path from "${parsedInput.painPoint}" to a bounded, source-backed demo package.`,
      architectureNote: TEMPLATE_ARCHITECTURE_NOTES[routedPlan.templateId],
    },
    preview: templateResult.preview,
    provenance: buildProvenance(fixture),
    creditEstimate,
    files: templateResult.files,
  });
}
