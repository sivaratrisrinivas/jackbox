import { describe, expect, it } from "vitest";
import { POST } from "@/app/api/generate/route";
import { DemoPackageSchema } from "@/lib/generation/demo-package";

function jsonRequest(body: unknown) {
  return new Request("http://localhost/api/generate", {
    method: "POST",
    body: JSON.stringify(body),
    headers: {
      "content-type": "application/json",
    },
  });
}

describe("POST /api/generate", () => {
  it("returns a normalized fixture-backed demo package for valid input", async () => {
    const response = await POST(
      jsonRequest({
        companyUrl: "https://acme.example.com",
        painPoint:
          "Support teams cannot answer product questions from the latest docs fast enough.",
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(DemoPackageSchema.safeParse(body).success).toBe(true);
    expect(body.templateId).toBe("docs-intelligence");
    expect(body.preview.fixtureId).toBe("acme-docs");
    expect(body.provenance).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: "Getting Started",
          url: "https://acme.example.com/docs/getting-started",
        }),
      ]),
    );
  });

  it("returns structured errors for invalid founder input", async () => {
    const response = await POST(
      jsonRequest({
        companyUrl: "not a url",
        painPoint: "Too short",
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(422);
    expect(body).toMatchObject({
      code: "validation_error",
      message: "Request validation failed.",
    });
    expect(body.fieldErrors.companyUrl[0]).toMatch(/valid public company URL/i);
    expect(body.fieldErrors.painPoint[0]).toMatch(/at least 10 characters/i);
  });

  it("returns a readable error for invalid JSON", async () => {
    const response = await POST(
      new Request("http://localhost/api/generate", {
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
