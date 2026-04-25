import { createElement } from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { ResultShell } from "@/components/result-shell";
import { loadFixtureProspectData } from "@/lib/firecrawl/fixtures";
import { generateDemoPackage } from "@/lib/generation/generate-demo-package";

afterEach(() => {
  cleanup();
});

describe("Account Research template slice", () => {
  it("generates concise account signals and exportable files from a research fixture", async () => {
    const input = {
      companyUrl: "https://northstar.example.com",
      painPoint:
        "Sales needs a sharper account research brief before qualification calls.",
    };
    const demoPackage = await generateDemoPackage(input, {
      loadProspectData: () => loadFixtureProspectData("account-research"),
    });

    expect(demoPackage.templateId).toBe("account-research");
    expect(demoPackage.preview).toMatchObject({
      fixtureId: "account-research",
      sourcePageCount: 5,
      primarySourceTitle: "Pricing",
      teamWhyItMatters: expect.stringContaining("Pricing"),
    });
    expect(demoPackage.files).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: "account-research/README.md",
          mediaType: "text/markdown",
          content: expect.stringContaining("Northstar Labs Account Research Brief"),
        }),
        expect.objectContaining({
          path: "account-research/brief.json",
          mediaType: "application/json",
          content: expect.stringContaining("https://northstar.example.com/jobs/account-executive"),
        }),
      ]),
    );

    render(createElement(ResultShell, { status: "success", result: demoPackage }));

    expect(screen.getByText(/Read the account/i)).toBeTruthy();
    expect(screen.getByText(/Why your team cares/i)).toBeTruthy();
    expect(screen.getByText(/Signal panels/i)).toBeTruthy();
    expect(screen.getByText(/Signal ledger/i)).toBeTruthy();
    expect(screen.getByText(/Call opener/i)).toBeTruthy();
    expect(screen.getByText(/Discovery prep/i)).toBeTruthy();
    expect(screen.getByText("account-research/README.md")).toBeTruthy();
    expect(screen.getByText("account-research/brief.json")).toBeTruthy();
  });
});
