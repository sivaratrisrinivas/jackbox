import { describe, expect, it } from "vitest";
import { estimateCredits } from "@/lib/estimates/estimate-credits";

describe("estimateCredits", () => {
  it("returns a readable credit breakdown for UI display", () => {
    const estimate = estimateCredits({
      templateId: "docs-intelligence",
      reason:
        "Your brief points to a docs and support workflow, so a citation-backed answer demo fits.",
      crawlTargets: [
        "https://acme.example.com/",
        "https://acme.example.com/docs/getting-started",
        "https://acme.example.com/pricing",
      ],
    });

    expect(estimate.totalCredits).toBe(8);
    expect(estimate.rationale).toMatch(/credible answers/i);
    expect(estimate.breakdown).toEqual([
      {
        label: "Crawl 3 bounded public targets",
        credits: 4,
      },
      {
        label: "Extract template-ready signals",
        credits: 3,
      },
      {
        label: "Package preview metadata",
        credits: 1,
      },
    ]);
  });
});

