import type { ProspectFixture } from "@/lib/firecrawl/fixtures";
import {
  extractRankedEvidence,
  fallbackEvidence,
  type RankedEvidence,
} from "@/lib/generation/evidence";
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
  evidenceItem: RankedEvidence,
  evidence: string,
  painPoint: string,
) {
  if (evidenceItem.pageType === "pricing") {
    return `"${evidence}" suggests a rollout that can start lean and expand with coverage, which gives the seller a credible ROI path for "${painPoint}".`;
  }

  if (evidenceItem.pageType === "product") {
    return `"${evidence}" makes the right story a shared account workspace, not a generic crawl demo, so the preview feels tailored to how the buyer already works.`;
  }

  if (evidenceItem.pageType === "customers") {
    return `"${evidence}" shows the prospect already values faster pre-call research, which sharpens the discovery angle for the brief.`;
  }

  if (evidenceItem.pageType === "jobs" || evidenceItem.pageType === "careers") {
    return `"${evidence}" signals more complex buying cycles ahead, so keeping account context fresh becomes more valuable to the revenue team.`;
  }

  return `"${evidence}" gives the team a source-backed way to talk about "${painPoint}" without guessing at internal priorities.`;
}

export function buildAccountResearchPreview(
  input: ProspectInput,
  fixture: ProspectFixture,
): AccountResearchPreview {
  const evidence = extractRankedEvidence({
    input,
    fixture,
    templateId: "account-research",
    limit: 8,
  });
  const usefulEvidence = evidence.length > 0 ? evidence : fallbackEvidence(fixture);
  const seenUrls = new Set<string>();
  const signals = usefulEvidence
    .filter((item) => {
      if (seenUrls.has(item.url)) {
        return false;
      }

      seenUrls.add(item.url);
      return true;
    })
    .slice(0, 4)
    .map((item) => ({
      label: signalLabel(item.pageType),
      sourceLabel: item.label,
      sourceUrl: item.url,
      evidence: item.text,
      insight: insightForPage(item, item.text, input.painPoint),
    }));

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
