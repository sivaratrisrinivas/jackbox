import type { ProspectFixture } from "@/lib/firecrawl/fixtures";
import { extractRankedEvidence, fallbackEvidence } from "@/lib/generation/evidence";
import type { SolutionEngineerBrief } from "@/lib/generation/solution-engineer-brief";
import type { ProspectInput, RoutedDemoPlan } from "@/lib/validation/prospect";

export interface DemoStoryEvidence {
  label: string;
  url: string;
  text: string;
}

export interface DemoStory {
  title: string;
  buyerProblem: string;
  firecrawlMove: string;
  proofPoint: string;
  talkTrack: string;
  nextStep: string;
  evidence: DemoStoryEvidence[];
  llmReadyPrompt: string;
}

const TEMPLATE_MOVES: Record<RoutedDemoPlan["templateId"], string> = {
  "docs-intelligence":
    "Crawl the public docs, extract answer-ready sections, and keep every answer tied to a source URL.",
  "change-monitor":
    "Crawl high-signal public pages, normalize the current state, and turn future page changes into buyer-relevant alerts.",
  "account-research":
    "Crawl product, pricing, customer, and hiring pages, then turn the public signals into a pre-call account brief.",
};

const TEMPLATE_NEXT_STEPS: Record<RoutedDemoPlan["templateId"], string> = {
  "docs-intelligence":
    "Ask for one real support question and run it against the live docs during the call.",
  "change-monitor":
    "Pick two public pages the buyer cares about and show how a weekly change digest would look.",
  "account-research":
    "Use the strongest public signal as the opener, then qualify whether the team wants this brief refreshed automatically.",
};

function truncate(value: string, maxLength: number) {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength - 1).trim()}...`;
}

export function buildDemoStory({
  input,
  fixture,
  routedPlan,
  solutionBrief,
}: {
  input: ProspectInput;
  fixture: ProspectFixture;
  routedPlan: RoutedDemoPlan;
  solutionBrief?: SolutionEngineerBrief;
}): DemoStory {
  const recommendedDemo = solutionBrief?.recommendedDemo;
  const workflow = solutionBrief?.inferredWorkflows[0];
  const rankedEvidence = extractRankedEvidence({
    input,
    fixture,
    templateId: routedPlan.templateId,
    limit: 3,
  });
  const usefulEvidence = rankedEvidence.length > 0 ? rankedEvidence : fallbackEvidence(fixture);
  const evidence = usefulEvidence.map((item) => ({
    label: item.label,
    url: item.url,
    text: truncate(item.text, 180),
  }));
  const primaryEvidence = evidence[0];
  const companyName = fixture.company.name;
  const proofPoint = primaryEvidence
    ? `${primaryEvidence.label}: ${primaryEvidence.text}`
    : "Public pages are available, but the crawl did not return a strong evidence line.";

  return {
    title: recommendedDemo?.title ?? `${companyName}: a Firecrawl story for the sales call`,
    buyerProblem: input.painPoint,
    firecrawlMove: recommendedDemo?.firecrawlValue ?? TEMPLATE_MOVES[routedPlan.templateId],
    proofPoint: workflow?.supportingEvidence ?? proofPoint,
    talkTrack: `We started with ${companyName}'s public web presence, pulled out the pieces that matter for "${input.painPoint}", and packaged them into a demo your buyer can verify source by source.`,
    nextStep: recommendedDemo?.pocNextStep ?? TEMPLATE_NEXT_STEPS[routedPlan.templateId],
    evidence,
    llmReadyPrompt: [
      `Company: ${companyName}`,
      `Buyer pain: ${input.painPoint}`,
      `Recommended demo: ${routedPlan.templateId}`,
      `Routing reason: ${routedPlan.reason}`,
      "Evidence:",
      ...evidence.map((item) => `- ${item.label} (${item.url}): ${item.text}`),
      "Rewrite this as a concise 60-second sales demo story. Keep claims grounded in the evidence.",
    ].join("\n"),
  };
}

export function getDemoStory(value: unknown): DemoStory | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const candidate = value as Partial<DemoStory>;

  if (
    typeof candidate.title !== "string" ||
    typeof candidate.buyerProblem !== "string" ||
    typeof candidate.firecrawlMove !== "string" ||
    typeof candidate.proofPoint !== "string" ||
    typeof candidate.talkTrack !== "string" ||
    typeof candidate.nextStep !== "string" ||
    !Array.isArray(candidate.evidence)
  ) {
    return null;
  }

  return {
    title: candidate.title,
    buyerProblem: candidate.buyerProblem,
    firecrawlMove: candidate.firecrawlMove,
    proofPoint: candidate.proofPoint,
    talkTrack: candidate.talkTrack,
    nextStep: candidate.nextStep,
    evidence: candidate.evidence.flatMap((item) => {
      if (
        item &&
        typeof item === "object" &&
        "label" in item &&
        "url" in item &&
        "text" in item &&
        typeof item.label === "string" &&
        typeof item.url === "string" &&
        typeof item.text === "string"
      ) {
        return [{ label: item.label, url: item.url, text: item.text }];
      }

      return [];
    }),
    llmReadyPrompt:
      typeof candidate.llmReadyPrompt === "string" ? candidate.llmReadyPrompt : "",
  };
}
