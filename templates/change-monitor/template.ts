import type { ProspectFixture } from "@/lib/firecrawl/fixtures";
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

const MONITORABLE_PAGE_TYPES = new Set(["pricing", "changelog", "release", "blog", "product"]);

function firstMeaningfulLine(markdown: string) {
  return (
    markdown
      .split("\n")
      .map((line) => line.replace(/^#+\s*/, "").trim())
      .find((line) => line.length > 0) ?? "Public page content is available for monitoring."
  );
}

function chooseMonitorPages(fixture: ProspectFixture) {
  const preferredPages = fixture.pages.filter((page) =>
    MONITORABLE_PAGE_TYPES.has(page.pageType ?? ""),
  );

  return (preferredPages.length > 0 ? preferredPages : fixture.pages).slice(0, 4);
}

function changeCopyForPage(page: ProspectFixture["pages"][number]) {
  const pageType = page.pageType ?? "page";

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
  const trackedPages = chooseMonitorPages(fixture).map((page) => ({
    pageTitle: page.title,
    url: page.url,
    currentState: firstMeaningfulLine(page.markdown),
    detectedChange: changeCopyForPage(page),
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
