import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { DemoPackageSchema } from "@/lib/generation/demo-package";
import { createFixtureLoader, loadFixtureProspectData } from "@/lib/firecrawl/fixtures";
import { ProspectInputSchema, RoutedDemoPlanSchema } from "@/lib/validation/prospect";

const tempDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(
    tempDirectories.splice(0).map((directory) =>
      rm(directory, { recursive: true, force: true }),
    ),
  );
});

describe("prospect contracts", () => {
  it("accepts valid founder input", () => {
    const result = ProspectInputSchema.safeParse({
      companyUrl: "https://acme.example.com",
      painPoint: "Support teams cannot search the latest docs fast enough.",
    });

    expect(result.success).toBe(true);
  });

  it("rejects invalid routed plans", () => {
    const result = RoutedDemoPlanSchema.safeParse({
      templateId: "docs-intelligence",
      reason: "",
      crawlTargets: [],
    });

    expect(result.success).toBe(false);
  });
});

describe("demo package manifest", () => {
  it("validates a normalized demo package", () => {
    const result = DemoPackageSchema.safeParse({
      id: "demo_acme_docs",
      templateId: "docs-intelligence",
      createdAt: "2026-04-25T00:00:00.000Z",
      input: {
        companyUrl: "https://acme.example.com",
        painPoint: "Support teams cannot search the latest docs fast enough.",
      },
      routedPlan: {
        templateId: "docs-intelligence",
        reason: "The prospect has a substantial public documentation surface.",
        crawlTargets: [
          "https://acme.example.com/docs",
          "https://acme.example.com/pricing",
        ],
      },
      summary: {
        headline: "Docs answers with citation-aware previews",
        whyThisMatters: "This keeps support and onboarding answers grounded in current docs.",
        architectureNote: "Fixture-backed docs content fills a curated Q and A preview.",
      },
      preview: {
        heroQuestion: "How do we launch our first workspace?",
      },
      provenance: [
        {
          label: "Getting Started",
          url: "https://acme.example.com/docs/getting-started",
        },
      ],
      creditEstimate: {
        totalCredits: 6,
        rationale: "Two high-value pages plus summary extraction overhead.",
        breakdown: [
          {
            label: "Docs crawl",
            credits: 4,
          },
          {
            label: "Summary generation",
            credits: 2,
          },
        ],
      },
      files: [
        {
          path: "README.md",
          description: "Generated package overview.",
        },
      ],
    });

    expect(result.success).toBe(true);
  });
});

describe("fixture loading", () => {
  it("loads a valid fixture through the adapter interface", async () => {
    const fixtureDirectory = await mkdtemp(path.join(os.tmpdir(), "jackbox-fixtures-"));
    tempDirectories.push(fixtureDirectory);

    await writeFile(
      path.join(fixtureDirectory, "valid.json"),
      JSON.stringify({
        fixtureId: "valid",
        company: {
          name: "Acme Cloud",
          website: "https://acme.example.com",
        },
        pages: [
          {
            url: "https://acme.example.com/docs",
            title: "Docs",
            markdown: "# Docs",
          },
        ],
      }),
      "utf8",
    );

    const loader = createFixtureLoader(fixtureDirectory);
    const fixture = await loader.loadFixtureProspectData("valid");

    expect(fixture.company.name).toBe("Acme Cloud");
    expect(fixture.pages).toHaveLength(1);
  });

  it("raises a readable error for invalid fixtures", async () => {
    const fixtureDirectory = await mkdtemp(path.join(os.tmpdir(), "jackbox-fixtures-"));
    tempDirectories.push(fixtureDirectory);

    await writeFile(
      path.join(fixtureDirectory, "invalid.json"),
      JSON.stringify({
        fixtureId: "invalid",
        company: {
          name: "Broken Co",
          website: "not-a-url",
        },
        pages: [],
      }),
      "utf8",
    );

    await expect(loadFixtureProspectData("invalid", fixtureDirectory)).rejects.toThrow(
      /failed validation/i,
    );
  });
});
