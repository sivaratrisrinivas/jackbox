import { describe, expect, it } from "vitest";
import { extractRankedEvidence } from "@/lib/generation/evidence";
import { buildSolutionEngineerBrief } from "@/lib/generation/solution-engineer-brief";
import type { ProspectFixture } from "@/lib/firecrawl/fixtures";

const fixture: ProspectFixture = {
  fixtureId: "stripe-docs",
  company: {
    name: "Stripe",
    website: "https://docs.stripe.com",
  },
  pages: [
    {
      title: "Stripe Documentation",
      url: "https://docs.stripe.com/",
      pageType: "home",
      markdown: ["hCaptcha", "Sign up", "Explore our guides and examples to integrate Stripe."].join(
        "\n",
      ),
    },
    {
      title: "Checkout API",
      url: "https://docs.stripe.com/api/checkout/sessions",
      pageType: "docs",
      markdown: [
        "Create a Checkout Session to start a hosted payment flow for one-time payments or subscriptions.",
        "The line_items parameter defines what the customer is purchasing.",
        "Use webhooks to listen for checkout.session.completed before fulfilling the order.",
      ].join("\n"),
    },
    {
      title: "Billing guide",
      url: "https://docs.stripe.com/billing",
      pageType: "docs",
      markdown:
        "Stripe Billing lets teams create subscriptions, invoices, metered usage, and customer portal workflows.",
    },
  ],
  notes: [],
};

describe("ranked evidence extraction", () => {
  it("rejects boilerplate and ranks technical source evidence", () => {
    const evidence = extractRankedEvidence({
      input: {
        companyUrl: "https://docs.stripe.com",
        painPoint:
          "Support and solutions teams need citation-backed answers for Stripe integration questions.",
      },
      fixture,
      templateId: "docs-intelligence",
    });

    expect(evidence.map((item) => item.text)).not.toContain("hCaptcha");
    expect(evidence[0].text).toMatch(/Checkout Session|webhooks|parameter|Billing/i);
    expect(evidence[0].score).toBeGreaterThan(8);
  });

  it("builds the SE brief from useful evidence instead of page boilerplate", () => {
    const brief = buildSolutionEngineerBrief({
      input: {
        companyUrl: "https://docs.stripe.com",
        painPoint:
          "Support and solutions teams need citation-backed answers for Stripe integration questions.",
      },
      fixture,
      routedPlan: {
        templateId: "docs-intelligence",
        reason: "Docs workflow",
        crawlTargets: ["https://docs.stripe.com/"],
      },
    });

    expect(brief.publicSurfaces[0].signal).not.toMatch(/hcaptcha|sign up/i);
    expect(brief.inferredWorkflows[0].supportingEvidence).toMatch(
      /Checkout|webhooks|parameter|Billing/i,
    );
  });
});
