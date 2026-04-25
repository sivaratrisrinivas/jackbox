import { describe, expect, it } from "vitest";
import type { ProspectFixture } from "@/lib/firecrawl/fixtures";
import { routeProspect } from "@/lib/router/route-prospect";
import { isApprovedCrawlTarget } from "@/lib/router/select-crawl-targets";

const docsFixture: ProspectFixture = {
  fixtureId: "acme-docs",
  company: {
    name: "Acme Cloud",
    website: "https://acme.example.com",
  },
  pages: [
    {
      url: "https://acme.example.com/docs/getting-started",
      title: "Getting Started",
      markdown: "Help center documentation for onboarding workspace admins.",
      pageType: "docs",
    },
    {
      url: "https://acme.example.com/pricing",
      title: "Pricing",
      markdown: "Plans scale by workspace size.",
      pageType: "pricing",
    },
    {
      url: "https://acme.example.com/app/private",
      title: "Private App",
      markdown: "This should never be crawled.",
      pageType: "app",
    },
  ],
  notes: [],
};

describe("routeProspect", () => {
  it("routes docs-heavy seeded fixtures to Docs Intelligence", () => {
    const plan = routeProspect(
      {
        companyUrl: "https://acme.example.com",
        painPoint: "Support teams cannot search the latest docs fast enough.",
      },
      docsFixture,
    );

    expect(plan.templateId).toBe("docs-intelligence");
    expect(plan.reason).toMatch(/citation-backed answer demo/i);
    expect(plan.crawlTargets).toContain("https://acme.example.com/docs/getting-started");
  });

  it("routes monitoring briefs to Change Monitor", () => {
    const plan = routeProspect({
      companyUrl: "https://rival.example.com",
      painPoint:
        "The team needs to monitor competitor pricing, changelog updates, and launch changes.",
    });

    expect(plan.templateId).toBe("change-monitor");
    expect(plan.reason).toMatch(/watching public changes/i);
    expect(plan.crawlTargets).toEqual([
      "https://rival.example.com/",
      "https://rival.example.com/pricing",
      "https://rival.example.com/changelog",
      "https://rival.example.com/blog",
      "https://rival.example.com/releases",
    ]);
  });

  it("routes sales research briefs to Account Research", () => {
    const plan = routeProspect({
      companyUrl: "https://northwind.example.com",
      painPoint:
        "Sales needs a sharper account research brief before qualification calls.",
    });

    expect(plan.templateId).toBe("account-research");
    expect(plan.reason).toMatch(/pre-call brief/i);
    expect(plan.crawlTargets).toContain("https://northwind.example.com/jobs");
  });

  it("keeps crawl targets bounded to approved public areas", () => {
    const plan = routeProspect(
      {
        companyUrl: "https://acme.example.com",
        painPoint: "Support needs documentation answers for onboarding.",
      },
      docsFixture,
    );

    expect(plan.crawlTargets).toHaveLength(3);
    expect(plan.crawlTargets.every((target) => isApprovedCrawlTarget(target, "https://acme.example.com"))).toBe(true);
    expect(plan.crawlTargets).not.toContain("https://acme.example.com/app/private");
  });
});

