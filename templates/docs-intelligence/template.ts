import type { ProspectFixture } from "@/lib/firecrawl/fixtures";
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

function firstMeaningfulLine(markdown: string) {
  return (
    markdown
      .split("\n")
      .map((line) => line.replace(/^#+\s*/, "").trim())
      .find((line) => line.length > 0) ?? "Source page content is available for review."
  );
}

function citationForPage(page: ProspectFixture["pages"][number]) {
  return {
    label: page.title,
    url: page.url,
    excerpt: firstMeaningfulLine(page.markdown),
  };
}

export function buildDocsIntelligencePreview(
  input: ProspectInput,
  fixture: ProspectFixture,
): DocsIntelligencePreview {
  const docsPages = fixture.pages.filter((page) => page.pageType === "docs");
  const rankedPages = docsPages.length > 0 ? docsPages : fixture.pages;
  const primaryPage = rankedPages[0];
  const secondaryPage = rankedPages[1] ?? fixture.pages.find((page) => page !== primaryPage);
  const primaryCitation = citationForPage(primaryPage);
  const citations = secondaryPage
    ? [primaryCitation, citationForPage(secondaryPage)]
    : [primaryCitation];

  return {
    companyName: fixture.company.name,
    fixtureId: fixture.fixtureId,
    sourcePageCount: fixture.pages.length,
    primarySourceTitle: primaryPage.title,
    painPoint: input.painPoint,
    suggestedQuestions: [
      `How should a support teammate answer "${input.painPoint}"?`,
      `Which ${fixture.company.name} docs should be cited first?`,
      "What source-backed next step should the buyer see?",
    ],
    answers: [
      {
        question: `How can ${fixture.company.name} answer this support workflow?`,
        answer: `${fixture.company.name} can start with ${primaryPage.title}, then cite the exact public page that explains the workflow instead of asking support teammates to summarize docs manually.`,
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
