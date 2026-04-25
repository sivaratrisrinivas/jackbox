import type { ProspectFixture } from "@/lib/firecrawl/fixtures";
import type { TemplateId } from "@/lib/validation/prospect";

const MAX_CRAWL_TARGETS = 5;

const PUBLIC_PATH_PATTERNS = [
  /^\/?$/,
  /^\/docs(?:\/|$)/,
  /^\/documentation(?:\/|$)/,
  /^\/help(?:\/|$)/,
  /^\/support(?:\/|$)/,
  /^\/pricing(?:\/|$)/,
  /^\/blog(?:\/|$)/,
  /^\/resources(?:\/|$)/,
  /^\/changelog(?:\/|$)/,
  /^\/release(?:s)?(?:\/|$)/,
  /^\/jobs(?:\/|$)/,
  /^\/careers(?:\/|$)/,
  /^\/product(?:\/|$)/,
  /^\/customers(?:\/|$)/,
  /^\/security(?:\/|$)/,
];

const TEMPLATE_PATHS: Record<TemplateId, string[]> = {
  "docs-intelligence": ["/docs", "/documentation", "/help", "/support", "/pricing"],
  "change-monitor": ["/pricing", "/changelog", "/blog", "/releases", "/product"],
  "account-research": ["/", "/pricing", "/product", "/customers", "/jobs"],
};

const TEMPLATE_PAGE_TYPES: Record<TemplateId, string[]> = {
  "docs-intelligence": ["docs", "documentation", "help", "support", "pricing"],
  "change-monitor": ["pricing", "changelog", "release", "blog", "product"],
  "account-research": ["home", "pricing", "product", "customers", "jobs", "careers"],
};

function normalizeUrl(url: string) {
  const parsed = new URL(url);
  parsed.hash = "";
  parsed.search = "";
  parsed.pathname = parsed.pathname.replace(/\/+$/, "") || "/";
  return parsed.toString();
}

function getOriginUrl(companyUrl: string) {
  const parsed = new URL(companyUrl);
  return `${parsed.origin}/`;
}

function isApprovedPublicTarget(url: string, companyUrl: string) {
  const target = new URL(url);
  const company = new URL(companyUrl);

  if (target.origin !== company.origin) {
    return false;
  }

  return PUBLIC_PATH_PATTERNS.some((pattern) => pattern.test(target.pathname));
}

function scoreFixturePageForTemplate(
  page: ProspectFixture["pages"][number],
  templateId: TemplateId,
) {
  const path = new URL(page.url).pathname.toLowerCase();
  const pageType = page.pageType?.toLowerCase() ?? "";
  const preferredTypes = TEMPLATE_PAGE_TYPES[templateId];

  if (preferredTypes.some((type) => pageType.includes(type) || path.includes(type))) {
    return 0;
  }

  if (isApprovedPublicTarget(page.url, new URL(page.url).origin)) {
    return 1;
  }

  return 2;
}

function uniqueBounded(urls: string[]) {
  return Array.from(new Set(urls.map(normalizeUrl))).slice(0, MAX_CRAWL_TARGETS);
}

export function selectCrawlTargets({
  companyUrl,
  templateId,
  fixture,
}: {
  companyUrl: string;
  templateId: TemplateId;
  fixture?: ProspectFixture;
}) {
  const originUrl = getOriginUrl(companyUrl);

  if (fixture) {
    const fixtureTargets = fixture.pages
      .filter((page) => isApprovedPublicTarget(page.url, companyUrl))
      .sort(
        (left, right) =>
          scoreFixturePageForTemplate(left, templateId) -
          scoreFixturePageForTemplate(right, templateId),
      )
      .map((page) => page.url);

    const targets = uniqueBounded([originUrl, ...fixtureTargets]);

    if (targets.length > 1) {
      return targets;
    }
  }

  return uniqueBounded([
    originUrl,
    ...TEMPLATE_PATHS[templateId].map((pathname) => new URL(pathname, originUrl).toString()),
  ]);
}

export function isApprovedCrawlTarget(url: string, companyUrl: string) {
  return isApprovedPublicTarget(url, companyUrl);
}

