import { afterEach, describe, expect, it, vi } from "vitest";
import { createFirecrawlClient } from "@/lib/firecrawl/client";
import { createProspectDataLoader } from "@/lib/firecrawl/load-prospect-data";
import { generateDemoPackage } from "@/lib/generation/generate-demo-package";

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json",
    },
  });
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("Firecrawl adapter", () => {
  it("polls the live crawl endpoint and normalizes returned pages", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        jsonResponse({
          success: true,
          id: "crawl_123",
        }),
      )
      .mockResolvedValueOnce(
        jsonResponse({
          status: "scraping",
          data: [],
        }),
      )
      .mockResolvedValueOnce(
        jsonResponse({
          status: "completed",
          creditsUsed: 2,
          data: [
            {
              markdown: "# Pricing\n\nSignalForge packages monitoring by tracked page volume.",
              metadata: {
                title: "Pricing",
                sourceURL: "https://signalforge.example.com/pricing",
              },
            },
            {
              markdown: "# Changelog\n\nNew launch alerts are available this week.",
              metadata: {
                title: "Changelog",
                sourceURL: "https://signalforge.example.com/changelog",
              },
            },
          ],
        }),
      );
    const client = createFirecrawlClient({
      apiKey: "fc-test",
      fetch: fetchMock,
      pollIntervalMs: 0,
      timeoutMs: 10,
    });

    const prospect = await client.loadProspectData({
      companyUrl: "https://signalforge.example.com",
      crawlTargets: [
        "https://signalforge.example.com/",
        "https://signalforge.example.com/pricing",
        "https://signalforge.example.com/changelog",
      ],
    });

    expect(prospect.dataSource).toBe("live");
    expect(prospect.fixtureId).toBe("live-signalforge-example-com");
    expect(prospect.pages).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          url: "https://signalforge.example.com/pricing",
          title: "Pricing",
          pageType: "pricing",
        }),
        expect.objectContaining({
          url: "https://signalforge.example.com/changelog",
          title: "Changelog",
          pageType: "changelog",
        }),
      ]),
    );

    const startRequest = fetchMock.mock.calls[0];
    const startBody = JSON.parse(String(startRequest[1]?.body));

    expect(startRequest[0]).toBe("https://api.firecrawl.dev/v2/crawl");
    expect(startBody.limit).toBe(3);
    expect(startBody.includePaths).toEqual(
      expect.arrayContaining(["^/?$", "^/pricing(?:/.*)?$", "^/changelog(?:/.*)?$"]),
    );
  });

  it("falls back to a fixture-backed preview in auto mode when live crawling fails", async () => {
    const demoPackage = await generateDemoPackage(
      {
        companyUrl: "https://acme.example.com",
        painPoint:
          "Support teams cannot answer product questions from the latest docs fast enough.",
      },
      createProspectDataLoader({
        requestedMode: "auto",
        apiKey: "fc-test",
        liveClient: {
          loadProspectData: vi.fn().mockRejectedValue(new Error("Timed out waiting for crawl")),
        },
      }),
    );

    expect(demoPackage.templateId).toBe("docs-intelligence");
    expect(demoPackage.preview).toMatchObject({
      fixtureId: "acme-docs",
      dataSource: "fixture",
      fallbackReason: expect.stringMatching(/timed out waiting for crawl/i),
    });
  });

  it("stays in fixture mode when auto mode has no Firecrawl credentials", async () => {
    const demoPackage = await generateDemoPackage(
      {
        companyUrl: "https://northstar.example.com",
        painPoint: "Sales needs a sharper account research brief before qualification calls.",
      },
      createProspectDataLoader({
        requestedMode: "auto",
        apiKey: null,
      }),
    );

    expect(demoPackage.templateId).toBe("account-research");
    expect(demoPackage.preview).toMatchObject({
      fixtureId: "account-research",
      dataSource: "fixture",
      fallbackReason: expect.stringMatching(/FIRECRAWL_API_KEY is not set/i),
    });
  });

  it("returns a readable error when strict live mode is requested without credentials", async () => {
    const loader = createProspectDataLoader({
      requestedMode: "live",
      apiKey: null,
    });

    await expect(
      loader.loadProspectData({
        companyUrl: "https://acme.example.com",
        painPoint:
          "Support teams cannot answer product questions from the latest docs fast enough.",
      }),
    ).rejects.toThrow(/FIRECRAWL_API_KEY/i);
  });
});
