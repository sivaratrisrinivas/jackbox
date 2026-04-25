import type { DemoPackage } from "@/lib/generation/demo-package";

const TEMPLATE_NAMES: Record<DemoPackage["templateId"], string> = {
  "docs-intelligence": "Docs Intelligence",
  "change-monitor": "Change Monitor",
  "account-research": "Account Research",
};

export function buildReadme(demoPackage: DemoPackage) {
  const fileList = demoPackage.files
    .map((file) => `- \`${file.path}\` - ${file.description}`)
    .join("\n");
  const provenanceList = demoPackage.provenance
    .map((source) => `- [${source.label}](${source.url})`)
    .join("\n");

  return `# ${demoPackage.summary.headline}

Template: ${TEMPLATE_NAMES[demoPackage.templateId]}

## Why This Matters

${demoPackage.summary.whyThisMatters}

## Architecture

${demoPackage.summary.architectureNote}

## Routing Rationale

${demoPackage.routedPlan.reason}

## Firecrawl Credit Estimate

Estimated credits: ${demoPackage.creditEstimate.totalCredits}

${demoPackage.creditEstimate.rationale}

## Included Files

${fileList}

## Provenance

${provenanceList}
`;
}
