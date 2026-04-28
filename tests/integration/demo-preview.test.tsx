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

    expect(screen.getAllByText(/Docs intelligence/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Saved demo data/i)).toBeTruthy();
    expect(
      screen.getByText(/Citation-backed answers from the prospect's own docs/i),
    ).toBeTruthy();
    expect(screen.getByRole("heading", { name: /Acme Cloud demo room is ready/i })).toBeTruthy();
    expect(screen.getByText(/Sources/i)).toBeTruthy();
    expect(screen.getByRole("button", { name: /Download demo package/i })).toBeTruthy();
  });
});
