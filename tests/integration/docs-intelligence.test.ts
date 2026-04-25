import { createElement } from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { ResultShell } from "@/components/result-shell";
import { loadFixtureProspectData } from "@/lib/firecrawl/fixtures";
import { generateDemoPackage } from "@/lib/generation/generate-demo-package";

afterEach(() => {
  cleanup();
});

describe("Docs Intelligence template slice", () => {
  it("generates source-linked answers and exportable files from a docs fixture", async () => {
    const input = {
      companyUrl: "https://acme.example.com",
      painPoint:
        "Support teams cannot answer product questions from the latest docs fast enough.",
    };
    const demoPackage = await generateDemoPackage(input, {
      loadProspectData: () => loadFixtureProspectData("docs-intelligence"),
    });

    render(createElement(ResultShell, { status: "success", result: demoPackage }));

    expect(demoPackage.templateId).toBe("docs-intelligence");
    expect(demoPackage.preview).toMatchObject({
      fixtureId: "docs-intelligence",
      sourcePageCount: 3,
      primarySourceTitle: "Getting Started",
    });
    expect(demoPackage.files).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: "docs-intelligence/README.md",
          mediaType: "text/markdown",
          content: expect.stringContaining("Acme Cloud Docs Intelligence"),
        }),
        expect.objectContaining({
          path: "docs-intelligence/answers.json",
          mediaType: "application/json",
          content: expect.stringContaining("https://acme.example.com/docs/getting-started"),
        }),
      ]),
    );
    expect(screen.getByText(/How can Acme Cloud answer this support workflow/i)).toBeTruthy();
    expect(screen.getByText(/Every generated answer keeps the source URL/i)).toBeTruthy();
    expect(screen.getAllByText("Getting Started").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Answer Workflows").length).toBeGreaterThan(0);
    expect(screen.getByText("docs-intelligence/README.md")).toBeTruthy();
    expect(screen.getByText("docs-intelligence/answers.json")).toBeTruthy();
  });
});
