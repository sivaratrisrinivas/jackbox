import type { ProspectFixture } from "@/lib/firecrawl/fixtures";
import {
  extractRankedEvidence,
  fallbackEvidence,
  type RankedEvidence,
} from "@/lib/generation/evidence";
import type { ProspectInput, RoutedDemoPlan } from "@/lib/validation/prospect";

export interface PublicSurface {
  label: string;
  url: string;
  type: string;
  signal: string;
}

export interface InferredWorkflow {
  workflowName: string;
  buyerTeam: string;
  pain: string;
  firecrawlUseCase: string;
  supportingEvidence: string;
  sourceUrl: string;
  confidence: "low" | "medium" | "high";
}

export interface RecommendedDemo {
  templateId: RoutedDemoPlan["templateId"];
  title: string;
  whyThisTemplate: string;
  firecrawlValue: string;
  miniAppConcept: string;
  sampleDataToExtract: string[];
  architecture: string[];
  demoScript: string[];
  pocNextStep: string;
}

export interface SolutionEngineerBrief {
  companyName: string;
  domain: string;
  productCategory: string;
  targetUsers: string[];
  publicSurfaces: PublicSurface[];
  inferredWorkflows: InferredWorkflow[];
  recommendedDemo: RecommendedDemo;
}

const TEMPLATE_USE_CASES: Record<RoutedDemoPlan["templateId"], string> = {
  "docs-intelligence": "Docs ingestion for AI support and solution workflows",
  "change-monitor": "Change monitoring for GTM, product, and competitive intelligence",
  "account-research": "Lead enrichment and account research from public web data",
};

function firstMeaningfulLine(markdown: string) {
  return (
    markdown
      .split("\n")
      .map((line) => line.replace(/^#+\s*/, "").trim())
      .filter((line) => line.length > 0)
      .find((line, index, lines) => index > 0 || lines.length === 1) ??
    "Public source content is available."
  );
}

function truncate(value: string, maxLength: number) {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength - 1).trim()}...`;
}

function buildPublicSurfaces(evidence: RankedEvidence[]): PublicSurface[] {
  return evidence.slice(0, 8).map((item) => ({
    label: item.label,
    url: item.url,
    type: item.pageType,
    signal: truncate(item.text, 180),
  }));
}

function inferProductCategory(fixture: ProspectFixture) {
  const text = fixture.pages
    .slice(0, 4)
    .map((page) => `${page.title} ${page.markdown.slice(0, 700)}`)
    .join(" ")
    .toLowerCase();

  if (text.includes("api") || text.includes("developer")) {
    return "Developer platform";
  }

  if (text.includes("support") || text.includes("help center")) {
    return "Customer support or knowledge product";
  }

  if (text.includes("sales") || text.includes("crm") || text.includes("revenue")) {
    return "Revenue workflow product";
  }

  if (text.includes("analytics") || text.includes("data")) {
    return "Data product";
  }

  return "Software product";
}

function inferTargetUsers(input: ProspectInput, fixture: ProspectFixture) {
  const text = `${input.painPoint} ${fixture.pages
    .map((page) => `${page.title} ${page.markdown.slice(0, 400)}`)
    .join(" ")}`.toLowerCase();
  const users = [];

  if (text.includes("support") || text.includes("docs") || text.includes("help")) {
    users.push("Support");
  }

  if (
    text.includes("sales") ||
    text.includes("account") ||
    text.includes("lead") ||
    text.includes("customer")
  ) {
    users.push("Sales");
  }

  if (
    text.includes("marketing") ||
    text.includes("pricing") ||
    text.includes("launch") ||
    text.includes("changelog")
  ) {
    users.push("Product marketing");
  }

  if (text.includes("developer") || text.includes("api") || text.includes("integration")) {
    users.push("Engineering");
  }

  return users.length > 0 ? Array.from(new Set(users)) : ["Sales engineering"];
}

function workflowForTemplate({
  input,
  fixture,
  routedPlan,
  evidence,
}: {
  input: ProspectInput;
  fixture: ProspectFixture;
  routedPlan: RoutedDemoPlan;
  evidence: RankedEvidence[];
}): InferredWorkflow {
  const bestEvidence = evidence[0];
  const hasHighSignalEvidence = evidence.some((item) => item.score >= 10);
  const supportingEvidence = bestEvidence
    ? `${bestEvidence.label}: ${truncate(bestEvidence.text, 180)}`
    : `${fixture.pages[0].title}: ${truncate(firstMeaningfulLine(fixture.pages[0].markdown), 180)}`;
  const sourceUrl = bestEvidence?.url ?? fixture.pages[0].url;

  if (routedPlan.templateId === "docs-intelligence") {
    return {
      workflowName: "Answer engine over public docs",
      buyerTeam: "Support and solutions engineering",
      pain: input.painPoint,
      firecrawlUseCase: TEMPLATE_USE_CASES[routedPlan.templateId],
      supportingEvidence,
      sourceUrl,
      confidence: hasHighSignalEvidence ? "high" : "medium",
    };
  }

  if (routedPlan.templateId === "change-monitor") {
    return {
      workflowName: "Public web watcher",
      buyerTeam: "Product marketing and sales",
      pain: input.painPoint,
      firecrawlUseCase: TEMPLATE_USE_CASES[routedPlan.templateId],
      supportingEvidence,
      sourceUrl,
      confidence: hasHighSignalEvidence ? "high" : "medium",
    };
  }

  return {
    workflowName: "Pre-call account intelligence brief",
    buyerTeam: "Sales and forward-deployed engineering",
    pain: input.painPoint,
    firecrawlUseCase: TEMPLATE_USE_CASES[routedPlan.templateId],
    supportingEvidence,
    sourceUrl,
    confidence: hasHighSignalEvidence ? "high" : "medium",
  };
}

function recommendedDemoForWorkflow(workflow: InferredWorkflow, routedPlan: RoutedDemoPlan) {
  const templateId = routedPlan.templateId;

  if (templateId === "docs-intelligence") {
    return {
      templateId,
      title: "Source-backed docs answer mini-app",
      whyThisTemplate:
        "The prospect has a public knowledge surface and the buyer pain is about finding trusted answers quickly.",
      firecrawlValue:
        "Firecrawl crawls the docs, converts pages into clean markdown, and preserves source URLs so every generated answer can be verified.",
      miniAppConcept:
        "A tiny support console where a rep asks a question, sees the answer, and opens the exact source page behind the claim.",
      sampleDataToExtract: [
        "Question-ready documentation sections",
        "Source URLs and page titles",
        "Answer snippets with citations",
      ],
      architecture: [
        "Next.js input form captures the prospect brief",
        "Firecrawl crawls bounded docs and help pages",
        "Gemini ranks answer-ready snippets and drafts the response",
        "The mini-app renders answer, citations, and confidence notes",
      ],
      demoScript: [
        `Open with the buyer pain: ${workflow.pain}`,
        `Show the source evidence: ${workflow.supportingEvidence}`,
        "Ask one realistic support question and show the cited answer path",
      ],
      pocNextStep:
        "Bring one real support question and one docs URL; run a live crawl and compare the generated answer against the current manual workflow.",
    };
  }

  if (templateId === "change-monitor") {
    return {
      templateId,
      title: "Public page watcher mini-app",
      whyThisTemplate:
        "The prospect has public commercial or product pages where changes matter to GTM teams.",
      firecrawlValue:
        "Firecrawl repeatedly captures clean page content so the app can diff pricing, launch, and changelog language over time.",
      miniAppConcept:
        "A dashboard that watches selected public pages, summarizes what changed, and turns changes into sales/product-marketing alerts.",
      sampleDataToExtract: [
        "Current pricing or product copy",
        "Release and changelog announcements",
        "Before/after summaries with source links",
      ],
      architecture: [
        "Next.js input form captures target domain and pain",
        "Firecrawl crawls bounded pricing, changelog, and product pages",
        "A scheduled job stores snapshots and compares future crawls",
        "Gemini summarizes the business impact of each change",
      ],
      demoScript: [
        `Open with the buyer pain: ${workflow.pain}`,
        `Show the monitored source: ${workflow.supportingEvidence}`,
        "Show the alert the team would receive when this page changes",
      ],
      pocNextStep:
        "Pick two public pages to monitor for one week and review whether the alerts would change a sales or launch decision.",
    };
  }

  return {
    templateId,
    title: "Account intelligence mini-app",
    whyThisTemplate:
      "The prospect exposes enough public account, product, pricing, or hiring context to build a useful pre-call brief.",
    firecrawlValue:
      "Firecrawl turns scattered public pages into structured account signals that an AE or SE can use before a customer conversation.",
    miniAppConcept:
      "A pre-call workspace that shows public account signals, likely initiatives, discovery angles, and source-backed talk tracks.",
    sampleDataToExtract: [
      "Product positioning and customer proof",
      "Pricing and packaging signals",
      "Hiring or expansion signals",
    ],
    architecture: [
      "Next.js input form captures the prospect domain",
      "Firecrawl crawls product, pricing, customer, and jobs pages",
      "Gemini converts page evidence into discovery angles",
      "The mini-app renders a concise brief with source links",
    ],
    demoScript: [
      `Open with the buyer pain: ${workflow.pain}`,
      `Show the strongest source-backed signal: ${workflow.supportingEvidence}`,
      "Use the generated discovery angle to ask a sharper first question",
    ],
    pocNextStep:
      "Run this brief against three target accounts and compare call prep time and discovery quality against the current process.",
  };
}

export function buildSolutionEngineerBrief({
  input,
  fixture,
  routedPlan,
}: {
  input: ProspectInput;
  fixture: ProspectFixture;
  routedPlan: RoutedDemoPlan;
}): SolutionEngineerBrief {
  const evidence = extractRankedEvidence({
    input,
    fixture,
    templateId: routedPlan.templateId,
  });
  const rankedEvidence = evidence.length > 0 ? evidence : fallbackEvidence(fixture);
  const workflow = workflowForTemplate({
    input,
    fixture,
    routedPlan,
    evidence: rankedEvidence,
  });

  return {
    companyName: fixture.company.name,
    domain: new URL(fixture.company.website).hostname.replace(/^www\./, ""),
    productCategory: inferProductCategory(fixture),
    targetUsers: inferTargetUsers(input, fixture),
    publicSurfaces: buildPublicSurfaces(rankedEvidence),
    inferredWorkflows: [workflow],
    recommendedDemo: recommendedDemoForWorkflow(workflow, routedPlan),
  };
}

function stringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

export function getSolutionEngineerBrief(value: unknown): SolutionEngineerBrief | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const candidate = value as Partial<SolutionEngineerBrief>;
  const demo = candidate.recommendedDemo as Partial<RecommendedDemo> | undefined;

  if (
    typeof candidate.companyName !== "string" ||
    typeof candidate.domain !== "string" ||
    typeof candidate.productCategory !== "string" ||
    !Array.isArray(candidate.targetUsers) ||
    !Array.isArray(candidate.publicSurfaces) ||
    !Array.isArray(candidate.inferredWorkflows) ||
    !demo ||
    typeof demo.title !== "string" ||
    typeof demo.miniAppConcept !== "string"
  ) {
    return null;
  }

  return {
    companyName: candidate.companyName,
    domain: candidate.domain,
    productCategory: candidate.productCategory,
    targetUsers: stringArray(candidate.targetUsers),
    publicSurfaces: candidate.publicSurfaces.flatMap((surface) => {
      if (
        surface &&
        typeof surface === "object" &&
        "label" in surface &&
        "url" in surface &&
        "type" in surface &&
        "signal" in surface &&
        typeof surface.label === "string" &&
        typeof surface.url === "string" &&
        typeof surface.type === "string" &&
        typeof surface.signal === "string"
      ) {
        return [surface];
      }

      return [];
    }),
    inferredWorkflows: candidate.inferredWorkflows.flatMap((workflow) => {
      if (
        workflow &&
        typeof workflow === "object" &&
        "workflowName" in workflow &&
        "buyerTeam" in workflow &&
        "pain" in workflow &&
        "firecrawlUseCase" in workflow &&
        "supportingEvidence" in workflow &&
        "sourceUrl" in workflow &&
        "confidence" in workflow &&
        typeof workflow.workflowName === "string" &&
        typeof workflow.buyerTeam === "string" &&
        typeof workflow.pain === "string" &&
        typeof workflow.firecrawlUseCase === "string" &&
        typeof workflow.supportingEvidence === "string" &&
        typeof workflow.sourceUrl === "string" &&
        (workflow.confidence === "low" ||
          workflow.confidence === "medium" ||
          workflow.confidence === "high")
      ) {
        return [workflow];
      }

      return [];
    }),
    recommendedDemo: {
      templateId: demo.templateId ?? "account-research",
      title: demo.title,
      whyThisTemplate:
        typeof demo.whyThisTemplate === "string" ? demo.whyThisTemplate : "",
      firecrawlValue: typeof demo.firecrawlValue === "string" ? demo.firecrawlValue : "",
      miniAppConcept: demo.miniAppConcept,
      sampleDataToExtract: stringArray(demo.sampleDataToExtract),
      architecture: stringArray(demo.architecture),
      demoScript: stringArray(demo.demoScript),
      pocNextStep: typeof demo.pocNextStep === "string" ? demo.pocNextStep : "",
    },
  };
}
