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
      primarySourceTitle: "Answer Workflows",
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
          content: expect.stringContaining("https://acme.example.com/docs/answers"),
        }),
      ]),
    );
    expect(screen.getByRole("heading", { name: /Acme Cloud demo room is ready/i })).toBeTruthy();
    expect(screen.getByText(/Docs Intelligence/i)).toBeTruthy();
    expect(
      screen.getByText(/Citation-backed answers from the prospect's own docs/i),
    ).toBeTruthy();
    expect(screen.getByText(/Sources/i)).toBeTruthy();
    expect(screen.getAllByText("Answer Workflows").length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: /Download demo package/i })).toBeTruthy();
  });
});
