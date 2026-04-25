import type { CreditEstimate } from "@/lib/generation/demo-package";
import type { RoutedDemoPlan } from "@/lib/validation/prospect";

const TEMPLATE_EXTRACTION_CREDITS: Record<RoutedDemoPlan["templateId"], number> = {
  "docs-intelligence": 3,
  "change-monitor": 4,
  "account-research": 3,
};

const TEMPLATE_RATIONALE: Record<RoutedDemoPlan["templateId"], string> = {
  "docs-intelligence":
    "Docs demos need enough crawl coverage for credible answers plus a small extraction pass for citations.",
  "change-monitor":
    "Monitor demos spend a little more on comparing page surfaces and shaping alert-ready summaries.",
  "account-research":
    "Research demos keep the crawl broad but shallow, then spend a small pass on account signals.",
};

function estimateCrawlCredits(targets: string[]) {
  return targets.reduce((total, target) => {
    const pathname = new URL(target).pathname.toLowerCase();

    if (pathname.includes("docs") || pathname.includes("help")) {
      return total + 2;
    }

    return total + 1;
  }, 0);
}

export function estimateCredits(plan: RoutedDemoPlan): CreditEstimate {
  const crawlCredits = estimateCrawlCredits(plan.crawlTargets);
  const extractionCredits = TEMPLATE_EXTRACTION_CREDITS[plan.templateId];
  const packagingCredits = 1;

  return {
    totalCredits: crawlCredits + extractionCredits + packagingCredits,
    rationale: TEMPLATE_RATIONALE[plan.templateId],
    breakdown: [
      {
        label: `Crawl ${plan.crawlTargets.length} bounded public target${
          plan.crawlTargets.length === 1 ? "" : "s"
        }`,
        credits: crawlCredits,
      },
      {
        label: "Extract template-ready signals",
        credits: extractionCredits,
      },
      {
        label: "Package preview metadata",
        credits: packagingCredits,
      },
    ],
  };
}
