import type { ProspectFixture } from "@/lib/firecrawl/fixtures";
import { createPipelineLogger } from "@/lib/observability/pipeline-log";

export interface DirectFetchOptions {
  companyUrl: string;
  urls: string[];
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
}

interface ExtractedPageText {
  title: string;
  markdown: string;
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

function decodeHtmlEntities(value: string) {
  return value
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function stripHtml(html: string) {
  return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<svg\b[^>]*>[\s\S]*?<\/svg>/gi, " ")
    .replace(/<[^>]+>/g, "\n")
    .replace(/\s+/g, " ")
    .split("\n")
    .map((line) => decodeHtmlEntities(line).trim())
    .filter(Boolean)
    .join("\n");
}

function getMetaDescription(html: string) {
  const match = html.match(
    /<meta\s+[^>]*(?:name|property)=["'](?:description|og:description)["'][^>]*content=["']([^"']+)["'][^>]*>/i,
  );

  return match?.[1] ? decodeHtmlEntities(match[1]).trim() : null;
}

function extractSectionLines(html: string, tagName: string) {
  const pattern = new RegExp(`<${tagName}\\b[^>]*>([\\s\\S]*?)<\\/${tagName}>`, "gi");
  const lines = [];
  let match = pattern.exec(html);

  while (match) {
    const text = stripHtml(match[1] ?? "");

    if (text.length > 0) {
      lines.push(text);
    }

    match = pattern.exec(html);
  }

  return lines;
}

function uniqueLines(lines: string[]) {
  const seen = new Set<string>();

  return lines.filter((line) => {
    const normalized = line.toLowerCase();

    if (seen.has(normalized)) {
      return false;
    }

    seen.add(normalized);
    return true;
  });
}

function htmlToSourceMarkdown(html: string, url: string): ExtractedPageText {
  const title = extractTitle(html, url);
  const description = getMetaDescription(html);
  const headings = ["h1", "h2", "h3"].flatMap((tagName) =>
    extractSectionLines(html, tagName),
  );
  const listItems = extractSectionLines(html, "li");
  const paragraphs = extractSectionLines(html, "p");
  const bodyText = stripHtml(html);
  const lines = uniqueLines([
    title,
    ...(description ? [description] : []),
    ...headings,
    ...listItems,
    ...paragraphs,
    ...bodyText.split("\n"),
  ])
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter((line) => line.length > 2)
    .slice(0, 90);

  return {
    title,
    markdown: lines.join("\n").slice(0, 12_000),
  };
}

function plainTextToSourceMarkdown(text: string, url: string): ExtractedPageText {
  const lines = uniqueLines(
    text
    .split("\n")
    .map((line) => line.trim())
      .filter((line) => line.length > 2),
  ).slice(0, 90);

  return {
    title: humanizePath(new URL(url).pathname),
    markdown: lines.join("\n").slice(0, 12_000),
  };
}

function extractTitle(html: string, url: string) {
  const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.trim();

  if (title) {
    return stripHtml(title).split("\n")[0] ?? humanizePath(new URL(url).pathname);
  }

  return humanizePath(new URL(url).pathname);
}

async function fetchWithTimeout(
  fetchImpl: typeof fetch,
  url: string,
  timeoutMs: number,
) {
  const signal =
    typeof AbortSignal !== "undefined" && "timeout" in AbortSignal
      ? AbortSignal.timeout(timeoutMs)
      : undefined;

  if (signal) {
    return fetchImpl(url, {
      headers: {
        accept: "text/html, text/plain;q=0.9, */*;q=0.8",
        "user-agent": "Jackbox/1.0 (+https://firecrawl.dev)",
      },
      signal,
    });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetchImpl(url, {
      headers: {
        accept: "text/html, text/plain;q=0.9, */*;q=0.8",
        "user-agent": "Jackbox/1.0 (+https://firecrawl.dev)",
      },
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchPublicPage({
  fetchImpl,
  target,
  timeoutMs,
}: {
  fetchImpl: typeof fetch;
  target: URL;
  timeoutMs: number;
}) {
  try {
    const response = await fetchWithTimeout(fetchImpl, target.toString(), timeoutMs);

    if (!response.ok) {
      return null;
    }

    const contentType = response.headers.get("content-type") ?? "";

    if (
      contentType &&
      !contentType.includes("text/html") &&
      !contentType.includes("text/plain") &&
      !contentType.includes("text/markdown")
    ) {
      return null;
    }

    const body = await response.text();
    const extracted = contentType.includes("text/plain")
      ? plainTextToSourceMarkdown(body, target.toString())
      : htmlToSourceMarkdown(body, target.toString());

    if (extracted.markdown.length < 40) {
      return null;
    }

    return {
      url: target.toString(),
      title: extracted.title,
      markdown: extracted.markdown,
      pageType: inferPageType(target.toString()),
    };
  } catch {
    return null;
  }
}

export async function loadPublicPagesWithFetch({
  companyUrl,
  urls,
  fetchImpl = globalThis.fetch,
  timeoutMs = 8_000,
}: DirectFetchOptions): Promise<ProspectFixture | null> {
  const logger = createPipelineLogger("direct-fetch");

  if (!fetchImpl) {
    logger.error("fetch:unavailable", new Error("Global fetch is not available."));
    return null;
  }

  const company = new URL(companyUrl);
  const targets = Array.from(new Set(urls))
    .map((url) => new URL(url))
    .filter((target) => target.origin === company.origin);
  logger.step("fetch:start", {
    host: company.hostname,
    targets: targets.length,
  });
  const pages = (
    await Promise.all(
      targets.map((target) =>
        fetchPublicPage({
          fetchImpl,
          target,
          timeoutMs,
        }),
      ),
    )
  ).filter((page): page is NonNullable<typeof page> => page !== null);
  logger.step("fetch:complete", {
    pages: pages.length,
  });

  if (pages.length === 0) {
    return null;
  }

  return {
    fixtureId: `fetch-${company.hostname.replace(/^www\./, "").replace(/[^a-z0-9]+/gi, "-")}`,
    company: {
      name: humanizeHost(companyUrl),
      website: companyUrl,
    },
    pages,
    notes: [`Direct public fetch added ${pages.length} page(s) after a sparse crawl.`],
    dataSource: "live",
  };
}
