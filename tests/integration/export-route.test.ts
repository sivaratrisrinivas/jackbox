import { describe, expect, it } from "vitest";
import { POST } from "@/app/api/export/route";
import { generateDemoPackage } from "@/lib/generation/generate-demo-package";

function jsonRequest(body: unknown) {
  return new Request("http://localhost/api/export", {
    method: "POST",
    body: JSON.stringify(body),
    headers: {
      "content-type": "application/json",
    },
  });
}

async function readZipText(response: Response) {
  const archive = new Uint8Array(await response.arrayBuffer());
  return new TextDecoder().decode(archive);
}

describe("POST /api/export", () => {
  it("returns a downloadable zip containing README, metadata, and curated template files", async () => {
    const demoPackage = await generateDemoPackage({
      companyUrl: "https://acme.example.com",
      painPoint:
        "Support teams cannot answer product questions from the latest docs fast enough.",
    });

    const response = await POST(jsonRequest(demoPackage));
    const archiveText = await readZipText(response);

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("application/zip");
    expect(response.headers.get("content-disposition")).toContain(
      "jackbox-docs-intelligence-acme-example-com.zip",
    );
    expect(archiveText).toContain("README.md");
    expect(archiveText).toContain("metadata/demo-package.json");
    expect(archiveText).toContain("docs-intelligence/README.md");
    expect(archiveText).toContain("docs-intelligence/answers.json");
    expect(archiveText).toContain("Citation-backed answers from the prospect's own docs");
    expect(archiveText).toContain("Getting Started");
  });

  it("returns structured validation errors for invalid package input", async () => {
    const response = await POST(jsonRequest({ templateId: "docs-intelligence" }));
    const body = await response.json();

    expect(response.status).toBe(422);
    expect(body).toMatchObject({
      code: "validation_error",
      message: "Request validation failed.",
    });
  });

  it("returns a readable error for invalid JSON", async () => {
    const response = await POST(
      new Request("http://localhost/api/export", {
        method: "POST",
        body: "{",
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({
      code: "invalid_json",
      message: "Request body must be valid JSON.",
    });
  });
});
