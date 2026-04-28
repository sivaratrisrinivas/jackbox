import type { ProspectFixture } from "@/lib/firecrawl/fixtures";
import { extractRankedEvidence, fallbackEvidence } from "@/lib/generation/evidence";
import type { ProspectInput } from "@/lib/validation/prospect";

export interface ChangeMonitorItem {
  pageTitle: string;
  url: string;
  currentState: string;
  detectedChange: string;
  monitoringValue: string;
}

export interface ChangeMonitorPreview {
  companyName: string;
  fixtureId: string;
  sourcePageCount: number;
  primarySourceTitle?: string;
  painPoint: string;
  trackedPages: ChangeMonitorItem[];
  alertSummaries: string[];
}

function changeCopyForPageType(pageType: string) {

  if (pageType === "pricing") {
    return "Pricing copy and plan packaging are captured as the highest-signal commercial surface.";
  }

  if (pageType === "changelog" || pageType === "release") {
    return "Release language is ready to become an alert when product messaging shifts.";
  }

  if (pageType === "blog") {
    return "Launch narrative and market-facing claims can be compared against future posts.";
  }

  if (pageType === "product") {
    return "Product positioning is tracked so workflow changes are visible before a sales call.";
  }

  return "This public source is available as a bounded monitoring target.";
}

export function buildChangeMonitorPreview(
  input: ProspectInput,
  fixture: ProspectFixture,
): ChangeMonitorPreview {
  const evidence = extractRankedEvidence({
    input,
    fixture,
    templateId: "change-monitor",
    limit: 8,
  });
  const usefulEvidence = evidence.length > 0 ? evidence : fallbackEvidence(fixture);
  const seenUrls = new Set<string>();
  const trackedPages = usefulEvidence
    .filter((item) => {
      if (seenUrls.has(item.url)) {
        return false;
      }

      seenUrls.add(item.url);
      return true;
    })
    .slice(0, 4)
    .map((item) => ({
      pageTitle: item.label,
      url: item.url,
      currentState: item.text,
      detectedChange: changeCopyForPageType(item.pageType),
      monitoringValue: `${fixture.company.name} can turn this page into an alert stream for "${input.painPoint}".`,
    }));

  const primaryPage = trackedPages[0];

  return {
    companyName: fixture.company.name,
    fixtureId: fixture.fixtureId,
    sourcePageCount: fixture.pages.length,
    primarySourceTitle: primaryPage?.pageTitle,
    painPoint: input.painPoint,
    trackedPages,
    alertSummaries: trackedPages.slice(0, 3).map((page) => `${page.pageTitle}: ${page.detectedChange}`),
  };
}
