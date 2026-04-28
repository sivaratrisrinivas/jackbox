import type { ProspectFixture } from "@/lib/firecrawl/fixtures";
import { extractRankedEvidence, fallbackEvidence } from "@/lib/generation/evidence";
import type { ProspectInput } from "@/lib/validation/prospect";

export interface DocsIntelligenceCitation {
  label: string;
  url: string;
  excerpt: string;
}

export interface DocsIntelligenceAnswer {
  question: string;
  answer: string;
  citations: DocsIntelligenceCitation[];
}

export interface DocsIntelligencePreview {
  companyName: string;
  fixtureId: string;
  sourcePageCount: number;
  primarySourceTitle?: string;
  painPoint: string;
  suggestedQuestions: string[];
  answers: DocsIntelligenceAnswer[];
}

function citationForEvidence(evidence: {
  label: string;
  url: string;
  text: string;
}) {
  return {
    label: evidence.label,
    url: evidence.url,
    excerpt: evidence.text,
  };
}

export function buildDocsIntelligencePreview(
  input: ProspectInput,
  fixture: ProspectFixture,
): DocsIntelligencePreview {
  const evidence = extractRankedEvidence({
    input,
    fixture,
    templateId: "docs-intelligence",
    limit: 3,
  });
  const usefulEvidence = evidence.length > 0 ? evidence : fallbackEvidence(fixture);
  const primaryEvidence = usefulEvidence[0];
  const primaryCitation = citationForEvidence(primaryEvidence);
  const citations = usefulEvidence.slice(0, 2).map(citationForEvidence);

  return {
    companyName: fixture.company.name,
    fixtureId: fixture.fixtureId,
    sourcePageCount: fixture.pages.length,
    primarySourceTitle: primaryEvidence.label,
    painPoint: input.painPoint,
    suggestedQuestions: [
      `How should a support teammate answer "${input.painPoint}"?`,
      `Which ${fixture.company.name} docs should be cited first?`,
      "What source-backed next step should the buyer see?",
    ],
    answers: [
      {
        question: `How can ${fixture.company.name} answer this support workflow?`,
        answer: `${fixture.company.name} can start with ${primaryEvidence.label}, then cite the exact public page that explains the workflow instead of asking support teammates to summarize docs manually.`,
        citations,
      },
      {
        question: "What would make the demo feel credible in a sales call?",
        answer: `Every generated answer keeps the source URL beside the claim, so the preview can show how Firecrawl turns crawled docs into an answer path for "${input.painPoint}".`,
        citations: [primaryCitation],
      },
    ],
  };
}
