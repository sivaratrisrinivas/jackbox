import { z } from "zod";
import type { DemoPackage } from "../generation/demo-package";
import { getDemoStory } from "../generation/demo-story";
import { getSolutionEngineerBrief } from "../generation/solution-engineer-brief";

export const DemoVideoSourceSchema = z.object({
  label: z.string(),
  url: z.string(),
});

export const DemoVideoPropsSchema = z.object({
  companyName: z.string(),
  templateName: z.string(),
  painPoint: z.string(),
  headline: z.string(),
  routeReason: z.string(),
  whyThisMatters: z.string(),
  firecrawlMove: z.string(),
  proofPoint: z.string(),
  talkTrack: z.string(),
  nextStep: z.string(),
  miniAppConcept: z.string(),
  buyerTeam: z.string(),
  architecture: z.array(z.string()),
  pocStep: z.string(),
  creditCount: z.number(),
  sourceCount: z.number(),
  sourceMode: z.string(),
  sources: z.array(DemoVideoSourceSchema),
});

export type DemoVideoProps = z.infer<typeof DemoVideoPropsSchema>;

const TEMPLATE_NAMES: Record<DemoPackage["templateId"], string> = {
  "docs-intelligence": "Docs Intelligence",
  "change-monitor": "Change Monitor",
  "account-research": "Account Research",
};

function getCompanyName(demoPackage: DemoPackage) {
  if (typeof demoPackage.preview.companyName === "string") {
    return demoPackage.preview.companyName;
  }

  const host = new URL(demoPackage.input.companyUrl).hostname.replace(/^www\./, "");
  const [name] = host.split(".");

  return name.replace(/[-_]/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getSourceMode(demoPackage: DemoPackage) {
  return demoPackage.preview.dataSource === "live" ? "Live crawl" : "Saved demo data";
}

export function buildDemoVideoProps(demoPackage: DemoPackage): DemoVideoProps {
  const story = getDemoStory(demoPackage.preview.story);
  const solutionBrief = getSolutionEngineerBrief(demoPackage.preview.solutionBrief);
  const recommendedDemo = solutionBrief?.recommendedDemo;
  const workflow = solutionBrief?.inferredWorkflows[0];

  return {
    companyName: getCompanyName(demoPackage),
    templateName: TEMPLATE_NAMES[demoPackage.templateId],
    painPoint: story?.buyerProblem ?? demoPackage.input.painPoint,
    headline: recommendedDemo?.title ?? demoPackage.summary.headline,
    routeReason: demoPackage.routedPlan.reason,
    whyThisMatters: demoPackage.summary.whyThisMatters,
    firecrawlMove:
      story?.firecrawlMove ??
      "Crawl public pages, extract useful context, and keep the workflow grounded in source URLs.",
    proofPoint:
      story?.proofPoint ??
      demoPackage.provenance[0]?.excerpt ??
      "The preview stays tied to public source material.",
    talkTrack:
      story?.talkTrack ??
      `We used public pages from ${getCompanyName(demoPackage)} to make the demo specific and verifiable.`,
    nextStep:
      story?.nextStep ?? "Run the same workflow live against the buyer's exact question.",
    miniAppConcept:
      recommendedDemo?.miniAppConcept ??
      "A small source-backed demo app that turns public web data into a workflow the buyer can inspect.",
    buyerTeam: workflow?.buyerTeam ?? "Sales engineering",
    architecture: recommendedDemo?.architecture.slice(0, 4) ?? [
      "Capture the prospect URL and buyer pain",
      "Crawl bounded public pages with Firecrawl",
      "Extract useful source-backed evidence",
      "Render a simple demo workflow",
    ],
    pocStep:
      recommendedDemo?.pocNextStep ??
      "Run the same workflow against one real buyer question.",
    creditCount: demoPackage.creditEstimate.totalCredits,
    sourceCount: demoPackage.provenance.length,
    sourceMode: getSourceMode(demoPackage),
    sources: demoPackage.provenance.slice(0, 3).map((source) => ({
      label: source.label,
      url: source.url,
    })),
  };
}
