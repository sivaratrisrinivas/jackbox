import { createElement } from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { ResultShell } from "@/components/result-shell";
import { loadFixtureProspectData } from "@/lib/firecrawl/fixtures";
import { generateDemoPackage } from "@/lib/generation/generate-demo-package";

afterEach(() => {
  cleanup();
});

describe("Change Monitor template slice", () => {
  it("generates tracked-page summaries and exportable files from a monitoring fixture", async () => {
    const input = {
      companyUrl: "https://signalforge.example.com",
      painPoint:
        "Marketing needs alerts when competitor pricing and launch messaging change.",
    };
    const demoPackage = await generateDemoPackage(input, {
      loadProspectData: () => loadFixtureProspectData("change-monitor"),
    });

    render(createElement(ResultShell, { status: "success", result: demoPackage }));

    expect(demoPackage.templateId).toBe("change-monitor");
    expect(demoPackage.preview).toMatchObject({
      fixtureId: "change-monitor",
      sourcePageCount: 4,
      primarySourceTitle: "Pricing",
    });
    expect(demoPackage.files).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: "change-monitor/README.md",
          mediaType: "text/markdown",
          content: expect.stringContaining("SignalForge Change Monitor"),
        }),
        expect.objectContaining({
          path: "change-monitor/tracked-pages.json",
          mediaType: "application/json",
          content: expect.stringContaining("https://signalforge.example.com/changelog"),
        }),
      ]),
    );
    expect(screen.getByText(/Pricing copy and plan packaging/i)).toBeTruthy();
    expect(screen.getByText(/Release language is ready to become an alert/i)).toBeTruthy();
    expect(screen.getAllByText(/Monitoring value/i).length).toBeGreaterThan(0);
    expect(screen.getByText("change-monitor/README.md")).toBeTruthy();
    expect(screen.getByText("change-monitor/tracked-pages.json")).toBeTruthy();
  });
});
