import type { DemoFile } from "@/lib/generation/demo-package";
import type { ProspectInput } from "@/lib/validation/prospect";
import type { ChangeMonitorPreview } from "./template";

export function buildChangeMonitorFiles(
  input: ProspectInput,
  preview: ChangeMonitorPreview,
): DemoFile[] {
  const trackedPageLines = preview.trackedPages
    .map(
      (page) =>
        `## ${page.pageTitle}\n\nSource: ${page.url}\n\nCurrent state: ${page.currentState}\n\nDetected change: ${page.detectedChange}\n\nMonitoring value: ${page.monitoringValue}`,
    )
    .join("\n\n");

  return [
    {
      path: "change-monitor/README.md",
      description: "Monitoring dashboard overview with tracked pages and alert summaries.",
      mediaType: "text/markdown",
      content: `# ${preview.companyName} Change Monitor\n\nBuyer pain: ${input.painPoint}\n\n${trackedPageLines}\n`,
    },
    {
      path: "change-monitor/tracked-pages.json",
      description: "Structured tracked pages, current states, and alert-ready summaries.",
      mediaType: "application/json",
      content: JSON.stringify(
        {
          companyName: preview.companyName,
          painPoint: preview.painPoint,
          trackedPages: preview.trackedPages,
          alertSummaries: preview.alertSummaries,
        },
        null,
        2,
      ),
    },
  ];
}
