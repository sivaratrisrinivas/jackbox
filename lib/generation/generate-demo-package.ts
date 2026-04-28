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
import { buildDemoStory } from "@/lib/generation/demo-story";
import { extractRankedEvidence, fallbackEvidence } from "@/lib/generation/evidence";
import { buildSolutionEngineerBrief } from "@/lib/generation/solution-engineer-brief";
import { generateAccountResearchTemplate } from "@/lib/generation/templates/account-research";
import { generateChangeMonitorTemplate } from "@/lib/generation/templates/change-monitor";
import { generateDocsIntelligenceTemplate } from "@/lib/generation/templates/docs-intelligence";
import {
  createOptionalDemoStoryEnhancer,
  createOptionalSolutionBriefEnhancer,
} from "@/lib/llm/demo-story-enhancer";
import { createPipelineLogger } from "@/lib/observability/pipeline-log";
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

function buildProvenance(
  input: ProspectInput,
  fixture: ProspectFixture,
  routedPlan: ReturnType<typeof routeProspect>,
): DemoSource[] {
  const evidence = extractRankedEvidence({
    input,
    fixture,
    templateId: routedPlan.templateId,
  });
  const usefulEvidence = evidence.length > 0 ? evidence : fallbackEvidence(fixture);

  return usefulEvidence.map((item) => ({
    label: item.label,
    url: item.url,
    excerpt: item.text,
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
    dataSource: fixture.dataSource ?? "fixture",
    fallbackReason: fixture.fallbackReason,
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
  const logger = createPipelineLogger("package");
  const parsedInput = ProspectInputSchema.parse(input);
  logger.step("input:parsed", {
    host: new URL(parsedInput.companyUrl).hostname,
  });
  logger.step("data:load:start");
  const fixture = await dataLoader.loadProspectData(parsedInput);
  logger.step("data:load:complete", {
    fixtureId: fixture.fixtureId,
    pages: fixture.pages.length,
    dataSource: fixture.dataSource ?? "unknown",
  });
  const routedPlan = routeProspect(parsedInput, fixture);
  logger.step("route:complete", {
    templateId: routedPlan.templateId,
    crawlTargets: routedPlan.crawlTargets.length,
  });
  const creditEstimate = estimateCredits(routedPlan);
  logger.step("credits:estimated", {
    totalCredits: creditEstimate.totalCredits,
  });
  const companyName = fixture.company.name || humanizeHost(parsedInput.companyUrl);
  const now = new Date().toISOString();
  const baseSolutionBrief = buildSolutionEngineerBrief({
    input: parsedInput,
    fixture,
    routedPlan,
  });
  logger.step("solution-brief:deterministic", {
    surfaces: baseSolutionBrief.publicSurfaces.length,
    workflow: baseSolutionBrief.inferredWorkflows[0]?.workflowName,
  });
  const solutionBriefEnhancer = createOptionalSolutionBriefEnhancer();
  logger.step("solution-brief:llm", {
    enabled: Boolean(solutionBriefEnhancer),
  });
  const solutionBrief = solutionBriefEnhancer
    ? await solutionBriefEnhancer(baseSolutionBrief)
    : baseSolutionBrief;
  logger.step("solution-brief:complete", {
    enhanced: solutionBrief !== baseSolutionBrief,
    miniApp: solutionBrief.recommendedDemo.title,
  });
  const baseStory = buildDemoStory({
    input: parsedInput,
    fixture,
    routedPlan,
    solutionBrief,
  });
  logger.step("story:deterministic", {
    evidenceCount: baseStory.evidence.length,
  });
  const storyEnhancer = createOptionalDemoStoryEnhancer();
  logger.step("story:llm", {
    enabled: Boolean(storyEnhancer),
  });
  const story = storyEnhancer ? await storyEnhancer(baseStory) : baseStory;
  logger.step("story:complete", {
    enhanced: story !== baseStory,
  });
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
  logger.step("template:built", {
    files: templateResult.files.length,
  });

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
    preview: {
      ...templateResult.preview,
      solutionBrief,
      story,
      dataSource: fixture.dataSource ?? "fixture",
      fallbackReason: fixture.fallbackReason,
    },
    provenance: buildProvenance(parsedInput, fixture, routedPlan),
    creditEstimate,
    files: templateResult.files,
  });
}
