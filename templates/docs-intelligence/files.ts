import type { DemoFile } from "@/lib/generation/demo-package";
import type { ProspectInput } from "@/lib/validation/prospect";
import type { DocsIntelligencePreview } from "./template";

export function buildDocsIntelligenceFiles(
  input: ProspectInput,
  preview: DocsIntelligencePreview,
): DemoFile[] {
  const answerLines = preview.answers
    .map((answer) => {
      const citations = answer.citations
        .map((citation) => `- [${citation.label}](${citation.url})`)
        .join("\n");

      return `## ${answer.question}\n\n${answer.answer}\n\n${citations}`;
    })
    .join("\n\n");

  return [
    {
      path: "docs-intelligence/README.md",
      description: "Source-linked answer preview written for a founder-led demo call.",
      mediaType: "text/markdown",
      content: `# ${preview.companyName} Docs Intelligence\n\nBuyer pain: ${input.painPoint}\n\n${answerLines}\n`,
    },
    {
      path: "docs-intelligence/answers.json",
      description: "Structured questions, answers, and citation URLs for export.",
      mediaType: "application/json",
      content: JSON.stringify(
        {
          companyName: preview.companyName,
          painPoint: preview.painPoint,
          answers: preview.answers,
        },
        null,
        2,
      ),
    },
  ];
}
