import type { ProspectFixture } from "@/lib/firecrawl/fixtures";
const DEFAULT_FIRECRAWL_BASE_URL = "https://api.firecrawl.dev/v2";
const DEFAULT_POLL_INTERVAL_MS = 1_500;
const DEFAULT_TIMEOUT_MS = 45_000;

interface FirecrawlStartCrawlResponse {
  success?: boolean;
  id?: string;
  error?: string;
}

interface FirecrawlDocument {
  markdown?: string;
  metadata?: {
    title?: string;
    sourceURL?: string;
    url?: string;
    statusCode?: number;
    error?: string;
  };
}

interface FirecrawlCrawlStatusResponse {
  status?: string;
  creditsUsed?: number;
  data?: FirecrawlDocument[];
  next?: string | null;
}

export interface FirecrawlClient {
  loadProspectData(input: {
    companyUrl: string;
    crawlTargets: string[];
  }): Promise<ProspectFixture>;
}

export interface CreateFirecrawlClientOptions {
  apiKey: string;
  baseUrl?: string;
  fetch?: typeof fetch;
  pollIntervalMs?: number;
  timeoutMs?: number;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function humanizeHost(companyUrl: string) {
  const host = new URL(companyUrl).hostname.replace(/^www\./, "");
  const [name] = host.split(".");

  return name.replace(/[-_]/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function humanizePath(pathname: string) {
  if (pathname === "/") {
    return "Home";
  }

  const [lastSegment] = pathname
    .split("/")
    .filter(Boolean)
    .slice(-1);

  return (lastSegment ?? "Page")
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function inferPageType(url: string) {
  const pathname = new URL(url).pathname.toLowerCase();

  if (pathname === "/") {
    return "home";
  }

  if (pathname.includes("/docs") || pathname.includes("/documentation")) {
    return "docs";
  }

  if (pathname.includes("/help") || pathname.includes("/support")) {
    return "support";
  }

  if (pathname.includes("/pricing")) {
    return "pricing";
  }

  if (pathname.includes("/changelog") || pathname.includes("/release")) {
    return "changelog";
  }

  if (pathname.includes("/blog")) {
    return "blog";
  }

  if (pathname.includes("/customers")) {
    return "customers";
  }

  if (pathname.includes("/jobs") || pathname.includes("/careers")) {
    return "jobs";
  }

  if (pathname.includes("/product")) {
    return "product";
  }

  return pathname.split("/").filter(Boolean)[0] ?? "page";
}

function buildIncludePathPatterns(companyUrl: string, crawlTargets: string[]) {
  const company = new URL(companyUrl);

  return Array.from(
    new Set(
      crawlTargets
        .map((target) => new URL(target))
        .filter((target) => target.origin === company.origin)
        .map((target) => {
          const pathname = target.pathname.replace(/\/+$/, "") || "/";

          if (pathname === "/") {
            return "^/?$";
          }

          const escaped = pathname.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
          return `^${escaped}(?:/.*)?$`;
        }),
    ),
  );
}

async function sleep(durationMs: number) {
  await new Promise((resolve) => {
    setTimeout(resolve, durationMs);
  });
}

async function parseResponsePayload(response: Response) {
  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    return response.json();
  }

  return response.text();
}

function getResponseErrorMessage(payload: unknown) {
  if (!payload) {
    return "No response body was returned.";
  }

  if (typeof payload === "string") {
    return payload;
  }

  if (
    typeof payload === "object" &&
    payload !== null &&
    "error" in payload &&
    typeof payload.error === "string"
  ) {
    return payload.error;
  }

  if (
    typeof payload === "object" &&
    payload !== null &&
    "message" in payload &&
    typeof payload.message === "string"
  ) {
    return payload.message;
  }

  return JSON.stringify(payload);
}

async function requestFirecrawl<T>(
  fetchImpl: typeof fetch,
  input: string,
  init: RequestInit,
  description: string,
) {
  const response = await fetchImpl(input, init);
  const payload = await parseResponsePayload(response);

  if (!response.ok) {
    throw new Error(
      `${description} failed with ${response.status}: ${getResponseErrorMessage(payload)}`,
    );
  }

  return payload as T;
}

function collectDocuments(status: FirecrawlCrawlStatusResponse) {
  return status.data ?? [];
}

function normalizeLiveDocuments(
  companyUrl: string,
  documents: FirecrawlDocument[],
  creditsUsed?: number,
): ProspectFixture {
  const pages = documents.flatMap((document) => {
    const url = document.metadata?.sourceURL ?? document.metadata?.url;
    const markdown = document.markdown?.trim();

    if (!url || !markdown) {
      return [];
    }

    const parsedUrl = new URL(url);

    return [
      {
        url: parsedUrl.toString(),
        title: document.metadata?.title?.trim() || humanizePath(parsedUrl.pathname),
        markdown,
        pageType: inferPageType(parsedUrl.toString()),
      },
    ];
  });

  if (pages.length === 0) {
    throw new Error("Firecrawl completed, but no markdown pages were returned for the bounded crawl.");
  }

  return {
    fixtureId: `live-${slugify(new URL(companyUrl).hostname)}`,
    company: {
      name: humanizeHost(companyUrl),
      website: companyUrl,
    },
    pages,
    notes: [
      `Live Firecrawl crawl completed with ${pages.length} public pages.`,
      creditsUsed === undefined ? "Credits used were not returned." : `Credits used: ${creditsUsed}.`,
    ],
    dataSource: "live",
  };
}

export function createFirecrawlClient({
  apiKey,
  baseUrl = DEFAULT_FIRECRAWL_BASE_URL,
  fetch: fetchImpl = globalThis.fetch,
  pollIntervalMs = DEFAULT_POLL_INTERVAL_MS,
  timeoutMs = DEFAULT_TIMEOUT_MS,
}: CreateFirecrawlClientOptions): FirecrawlClient {
  if (!apiKey) {
    throw new Error("Firecrawl client requires an API key.");
  }

  if (!fetchImpl) {
    throw new Error("Global fetch is not available in this runtime.");
  }

  return {
    async loadProspectData({ companyUrl, crawlTargets }) {
      const includePaths = buildIncludePathPatterns(companyUrl, crawlTargets);
      const company = new URL(companyUrl);
      const originUrl = `${company.origin}/`;
      const startPayload = await requestFirecrawl<FirecrawlStartCrawlResponse>(
        fetchImpl,
        `${baseUrl}/crawl`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            url: originUrl,
            includePaths,
            limit: Math.max(crawlTargets.length, 1),
            allowExternalLinks: false,
            allowSubdomains: false,
            crawlEntireDomain: false,
            scrapeOptions: {
              formats: ["markdown"],
              onlyMainContent: true,
              blockAds: true,
              timeout: timeoutMs,
            },
          }),
        },
        "Firecrawl crawl start",
      );

      if (!startPayload.id) {
        throw new Error("Firecrawl crawl start did not return a crawl id.");
      }

      const deadline = Date.now() + timeoutMs;
      let statusPayload: FirecrawlCrawlStatusResponse | null = null;

      while (Date.now() <= deadline) {
        statusPayload = await requestFirecrawl<FirecrawlCrawlStatusResponse>(
          fetchImpl,
          `${baseUrl}/crawl/${startPayload.id}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${apiKey}`,
            },
          },
          "Firecrawl crawl status",
        );

        if (statusPayload.status === "completed") {
          const documents = [...collectDocuments(statusPayload)];
          let nextUrl = statusPayload.next;

          while (nextUrl) {
            const nextPayload = await requestFirecrawl<FirecrawlCrawlStatusResponse>(
              fetchImpl,
              new URL(nextUrl, baseUrl).toString(),
              {
                method: "GET",
                headers: {
                  Authorization: `Bearer ${apiKey}`,
                },
              },
              "Firecrawl crawl pagination",
            );

            documents.push(...collectDocuments(nextPayload));
            nextUrl = nextPayload.next;
          }

          return normalizeLiveDocuments(
            companyUrl,
            documents,
            statusPayload.creditsUsed,
          );
        }

        if (statusPayload.status === "failed") {
          throw new Error("Firecrawl reported a failed crawl for the bounded prospect load.");
        }

        await sleep(pollIntervalMs);
      }

      throw new Error(
        `Firecrawl crawl timed out after ${timeoutMs}ms while waiting for bounded prospect pages.`,
      );
    },
  };
}
