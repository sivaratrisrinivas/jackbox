import type { ProspectFixture } from "@/lib/firecrawl/fixtures";
import { selectCrawlTargets } from "@/lib/router/select-crawl-targets";
import {
  ProspectInputSchema,
  RoutedDemoPlanSchema,
  type ProspectInput,
  type TemplateId,
} from "@/lib/validation/prospect";

const TEMPLATE_KEYWORDS: Record<TemplateId, string[]> = {
  "docs-intelligence": [
    "docs",
    "documentation",
    "knowledge",
    "support",
    "onboarding",
    "answers",
    "answer",
    "search",
    "citation",
    "help",
    "faq",
  ],
  "change-monitor": [
    "monitor",
    "tracking",
    "track",
    "change",
    "changes",
    "competitor",
    "pricing intelligence",
    "release",
    "changelog",
    "alert",
    "launch",
  ],
  "account-research": [
    "account",
    "research",
    "sales",
    "lead",
    "prospect",
    "qualification",
    "pricing",
    "jobs",
    "hiring",
    "product",
    "pre-call",
  ],
};

const TEMPLATE_REASONS: Record<TemplateId, string> = {
  "docs-intelligence":
    "Your brief points to a docs and support workflow, so a citation-backed answer demo will make the prospect's own knowledge base feel immediately useful.",
  "change-monitor":
    "Your brief is about watching public changes over time, so a monitor demo can turn pricing, release, and product pages into a concrete alerting workflow.",
  "account-research":
    "Your brief asks for sharper prospect context, so an account research workspace can turn public product, pricing, and hiring signals into a practical pre-call brief.",
};

function collectRoutingText(input: ProspectInput, fixture?: ProspectFixture) {
  const fixtureText =
    fixture?.pages
      .map((page) => `${page.pageType ?? ""} ${page.title} ${page.markdown.slice(0, 500)}`)
      .join(" ") ?? "";

  return `${input.companyUrl} ${input.painPoint} ${fixtureText}`.toLowerCase();
}

function scoreTemplate(text: string, templateId: TemplateId) {
  return TEMPLATE_KEYWORDS[templateId].reduce((score, keyword) => {
    const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const matches = text.match(new RegExp(`\\b${escaped}\\b`, "g"));
    return score + (matches?.length ?? 0);
  }, 0);
}

function chooseTemplate(input: ProspectInput, fixture?: ProspectFixture): TemplateId {
  const text = collectRoutingText(input, fixture);
  const ranked = ProspectTemplateOrder.map((templateId) => ({
    templateId,
    score: scoreTemplate(text, templateId),
  })).sort((left, right) => right.score - left.score);

  if (ranked[0].score > 0) {
    return ranked[0].templateId;
  }

  return "account-research";
}

const ProspectTemplateOrder: TemplateId[] = [
  "docs-intelligence",
  "change-monitor",
  "account-research",
];

export function routeProspect(input: ProspectInput, fixture?: ProspectFixture) {
  const parsedInput = ProspectInputSchema.parse(input);
  const templateId = chooseTemplate(parsedInput, fixture);

  return RoutedDemoPlanSchema.parse({
    templateId,
    reason: TEMPLATE_REASONS[templateId],
    crawlTargets: selectCrawlTargets({
      companyUrl: parsedInput.companyUrl,
      templateId,
      fixture,
    }),
  });
}

