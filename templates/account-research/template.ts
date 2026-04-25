import type { ProspectFixture } from "@/lib/firecrawl/fixtures";
import type { ProspectInput } from "@/lib/validation/prospect";

export interface AccountResearchSignal {
  label: string;
  sourceLabel: string;
  sourceUrl: string;
  evidence: string;
  insight: string;
}

export interface AccountResearchPreview {
  companyName: string;
  fixtureId: string;
  sourcePageCount: number;
  primarySourceTitle?: string;
  painPoint: string;
  executiveSummary: string;
  teamWhyItMatters: string;
  discoveryAngles: string[];
  signals: AccountResearchSignal[];
}

const PREFERRED_PAGE_TYPES = ["pricing", "product", "customers", "jobs", "careers", "home"];

function firstMeaningfulLine(markdown: string) {
  return (
    markdown
      .split("\n")
      .map((line) => line.replace(/^#+\s*/, "").trim())
      .find((line) => line.length > 0) ?? "Public company context is available for review."
  );
}

function uniqueOrderedPages(fixture: ProspectFixture) {
  const prioritizedPages = PREFERRED_PAGE_TYPES.flatMap((pageType) =>
    fixture.pages.find((page) => page.pageType === pageType) ?? [],
  );

  const additionalPages = fixture.pages.filter((page) => !prioritizedPages.includes(page));

  return [...prioritizedPages, ...additionalPages];
}

function signalLabel(pageType?: string) {
  if (pageType === "pricing") {
    return "Pricing model";
  }

  if (pageType === "product") {
    return "Product workflow";
  }

  if (pageType === "customers") {
    return "Customer proof";
  }

  if (pageType === "jobs" || pageType === "careers") {
    return "Hiring signal";
  }

  return "Company context";
}

function insightForPage(
  page: ProspectFixture["pages"][number],
  evidence: string,
  painPoint: string,
) {
  if (page.pageType === "pricing") {
    return `"${evidence}" suggests a rollout that can start lean and expand with coverage, which gives the seller a credible ROI path for "${painPoint}".`;
  }

  if (page.pageType === "product") {
    return `"${evidence}" makes the right story a shared account workspace, not a generic crawl demo, so the preview feels tailored to how the buyer already works.`;
  }

  if (page.pageType === "customers") {
    return `"${evidence}" shows the prospect already values faster pre-call research, which sharpens the discovery angle for the brief.`;
  }

  if (page.pageType === "jobs" || page.pageType === "careers") {
    return `"${evidence}" signals more complex buying cycles ahead, so keeping account context fresh becomes more valuable to the revenue team.`;
  }

  return `"${evidence}" gives the team a source-backed way to talk about "${painPoint}" without guessing at internal priorities.`;
}

export function buildAccountResearchPreview(
  input: ProspectInput,
  fixture: ProspectFixture,
): AccountResearchPreview {
  const signalPages = uniqueOrderedPages(fixture).slice(0, 4);
  const signals = signalPages.map((page) => {
    const evidence = firstMeaningfulLine(page.markdown);

    return {
      label: signalLabel(page.pageType),
      sourceLabel: page.title,
      sourceUrl: page.url,
      evidence,
      insight: insightForPage(page, evidence, input.painPoint),
    };
  });

  const pricingSignal = signals.find((signal) => signal.label === "Pricing model");
  const productSignal = signals.find((signal) => signal.label === "Product workflow");
  const hiringSignal = signals.find((signal) => signal.label === "Hiring signal");

  return {
    companyName: fixture.company.name,
    fixtureId: fixture.fixtureId,
    sourcePageCount: fixture.pages.length,
    primarySourceTitle: signals[0]?.sourceLabel,
    painPoint: input.painPoint,
    executiveSummary: `${fixture.company.name} already frames its offer around tighter account context and revenue-team coordination, so a source-backed pre-call brief is the cleanest way to demo value from public pages.`,
    teamWhyItMatters: `${
      pricingSignal?.sourceLabel ?? "Pricing"
    }, ${productSignal?.sourceLabel ?? "Product"}, and ${
      hiringSignal?.sourceLabel ?? "Careers"
    } all point to a team that needs sharper account context before live conversations. This brief gives your team a concrete opening tied to public evidence instead of a generic feature tour.`,
    discoveryAngles: [
      `Lead with the business case from ${pricingSignal?.sourceLabel ?? "the pricing page"}: ${
        pricingSignal?.evidence ?? "the packaging already points to rollout and expansion questions."
      }`,
      `Use ${productSignal?.sourceLabel ?? "the product page"} to anchor the workflow story: ${
        productSignal?.evidence ??
        "the buyer is already oriented around one shared account view."
      }`,
      `Qualify urgency from ${hiringSignal?.sourceLabel ?? "the careers page"}: ${
        hiringSignal?.evidence ??
        "the team is growing into broader enterprise and multi-stakeholder motion."
      }`,
    ],
    signals,
  };
}
