import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { ResultShell } from "@/components/result-shell";
import { generateDemoPackage } from "@/lib/generation/generate-demo-package";

afterEach(() => {
  cleanup();
});

describe("DemoPackage preview rendering", () => {
  it("renders the summary, template preview, provenance, and package files", async () => {
    const demoPackage = await generateDemoPackage({
      companyUrl: "https://acme.example.com",
      painPoint:
        "Support teams cannot answer product questions from the latest docs fast enough.",
    });

    render(<ResultShell status="success" result={demoPackage} />);

    expect(
      screen.getByText(/Acme Cloud is ready for a tailored Firecrawl walkthrough/i),
    ).toBeTruthy();
    expect(screen.getAllByText(/Docs intelligence/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Fixture preview/i)).toBeTruthy();
    expect(
      screen.getByText(/Citation-backed answers from the prospect's own docs/i),
    ).toBeTruthy();
    expect(screen.getByText(/Source links stay separate from generated copy/i)).toBeTruthy();
    expect(screen.getAllByText("Getting Started").length).toBeGreaterThan(0);
    expect(screen.getByText(/How can Acme Cloud answer this support workflow/i)).toBeTruthy();
    expect(screen.getByText("docs-intelligence/README.md")).toBeTruthy();
    expect(screen.getByText("docs-intelligence/answers.json")).toBeTruthy();
  });
});
