import type { DemoFile } from "@/lib/generation/demo-package";
import type { ProspectInput } from "@/lib/validation/prospect";
import type { AccountResearchPreview } from "./template";

export function buildAccountResearchFiles(
  input: ProspectInput,
  preview: AccountResearchPreview,
): DemoFile[] {
  const signalLines = preview.signals
    .map(
      (signal) =>
        `## ${signal.label}\n\nSource: [${signal.sourceLabel}](${signal.sourceUrl})\n\nEvidence: ${signal.evidence}\n\nInsight: ${signal.insight}`,
    )
    .join("\n\n");

  return [
    {
      path: "account-research/README.md",
      description: "Compact account brief with source-backed signals for a founder-led sales call.",
      mediaType: "text/markdown",
      content: `# ${preview.companyName} Account Research Brief\n\nBuyer pain: ${input.painPoint}\n\n## Executive summary\n\n${preview.executiveSummary}\n\n## Why this matters to your team\n\n${preview.teamWhyItMatters}\n\n## Discovery angles\n\n${preview.discoveryAngles
        .map((angle) => `- ${angle}`)
        .join("\n")}\n\n${signalLines}\n`,
    },
    {
      path: "account-research/brief.json",
      description: "Structured account signals, discovery angles, and source-backed brief metadata.",
      mediaType: "application/json",
      content: JSON.stringify(
        {
          companyName: preview.companyName,
          painPoint: preview.painPoint,
          executiveSummary: preview.executiveSummary,
          teamWhyItMatters: preview.teamWhyItMatters,
          discoveryAngles: preview.discoveryAngles,
          signals: preview.signals,
        },
        null,
        2,
      ),
    },
  ];
}
