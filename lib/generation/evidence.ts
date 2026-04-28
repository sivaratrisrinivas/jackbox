import type { ProspectFixture } from "@/lib/firecrawl/fixtures";
import { createPipelineLogger } from "@/lib/observability/pipeline-log";
import type { ProspectInput, TemplateId } from "@/lib/validation/prospect";

export interface RankedEvidence {
  label: string;
  url: string;
  pageType: string;
  text: string;
  score: number;
  reasons: string[];
}

const BAD_SIGNAL_PATTERNS = [
  /\bhcaptcha\b/i,
  /\bcaptcha\b/i,
  /\bcookie\b/i,
  /\bprivacy policy\b/i,
  /\bterms of (service|use)\b/i,
  /\blog ?in\b/i,
  /\bsign ?up\b/i,
  /\bget started\b/i,
  /\bcontact sales\b/i,
  /\bcontact support\b/i,
  /\bneed help\b/i,
  /\bdiscord\b/i,
  /\bchat with\b/i,
  /\ball rights reserved\b/i,
  /\bskip to content\b/i,
  /\baccept all\b/i,
  /\bnavbar\b/i,
  /\bfooter\b/i,
  /\bhome\s+product\s+pricing\s+docs\b/i,
  /\bexplore our (guides|resources|solutions)\b/i,
];

const GOOD_SIGNAL_PATTERNS = [
  /\bapi\b/i,
  /\bsdk\b/i,
  /\bwebhook\b/i,
  /\bintegration\b/i,
  /\bparameter\b/i,
  /\bauthentication\b/i,
  /\berror\b/i,
  /\bguide\b/i,
  /\bexample\b/i,
  /\bpricing\b/i,
  /\bplan\b/i,
  /\bchangelog\b/i,
  /\brelease\b/i,
  /\bmonitor\b/i,
  /\bcustomer\b/i,
  /\bcase study\b/i,
  /\bhiring\b/i,
  /\bworkflow\b/i,
  /\bautomation\b/i,
  /\bdashboard\b/i,
];

const TEMPLATE_PAGE_TYPE_WEIGHTS: Record<TemplateId, Record<string, number>> = {
  "docs-intelligence": {
    docs: 8,
    documentation: 8,
    support: 6,
    help: 6,
    pricing: 2,
    product: 2,
  },
  "change-monitor": {
    pricing: 8,
    changelog: 8,
    release: 8,
    blog: 4,
    product: 5,
  },
  "account-research": {
    product: 7,
    pricing: 7,
    customers: 7,
    jobs: 5,
    careers: 5,
    home: 3,
  },
};

function normalizeLine(line: string) {
  return line
    .replace(/^#+\s*/, "")
    .replace(/!\[[^\]]*]\([^)]*\)/g, " ")
    .replace(/\[([^\]]+)]\([^)]*\)/g, "$1")
    .replace(/https?:\/\/\S+/g, " ")
    .replace(/\\+/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function segmentLine(line: string) {
  const normalized = normalizeLine(line);

  if (normalized.length <= 320) {
    return [normalized];
  }

  const sentences = normalized
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 0);
  const segments = [];
  let current = "";

  for (const sentence of sentences) {
    if ((current ? `${current} ${sentence}` : sentence).length <= 280) {
      current = current ? `${current} ${sentence}` : sentence;
      continue;
    }

    if (current.length > 0) {
      segments.push(current);
    }

    current = sentence.length <= 280 ? sentence : sentence.slice(0, 280).trim();
  }

  if (current.length > 0) {
    segments.push(current);
  }

  return segments.length > 0 ? segments : [normalized.slice(0, 280).trim()];
}

function inferPageTypeFromUrl(url: string, fallback: string) {
  const pathname = new URL(url).pathname.toLowerCase();
  const text = `${pathname} ${fallback}`.toLowerCase();

  if (text.includes("docs") || text.includes("documentation") || text.includes("api")) {
    return "docs";
  }

  if (text.includes("help") || text.includes("support")) {
    return "support";
  }

  if (text.includes("pricing") || text.includes("plans")) {
    return "pricing";
  }

  if (text.includes("changelog") || text.includes("release")) {
    return "changelog";
  }

  if (text.includes("customers") || text.includes("case-stud")) {
    return "customers";
  }

  if (text.includes("jobs") || text.includes("careers")) {
    return "jobs";
  }

  if (text.includes("blog")) {
    return "blog";
  }

  if (text.includes("product") || text.includes("platform")) {
    return "product";
  }

  return fallback;
}

function tokenize(value: string) {
  return Array.from(
    new Set(
      value
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, " ")
        .split(/\s+/)
        .filter((token) => token.length > 3),
    ),
  );
}

function isBadSignal(line: string) {
  const normalized = normalizeLine(line);

  if (normalized.length < 24 || normalized.length > 320) {
    return true;
  }

  if (normalized.length > 220 && !/[.!?:;]/.test(normalized)) {
    return true;
  }

  if (/^[-*]\s*$/.test(normalized) || normalized.split(" ").length < 4) {
    return true;
  }

  return BAD_SIGNAL_PATTERNS.some((pattern) => pattern.test(normalized));
}

function lineSpecificityScore(line: string) {
  let score = 0;

  for (const pattern of GOOD_SIGNAL_PATTERNS) {
    if (pattern.test(line)) {
      score += 4;
    }
  }

  if (/\b[A-Z][a-zA-Z]+(?: API| SDK| Connect| Billing| Checkout| Docs)\b/.test(line)) {
    score += 3;
  }

  if (/\b\d+[\w%.-]*\b/.test(line)) {
    score += 2;
  }

  if (line.includes(":") || line.includes("-")) {
    score += 1;
  }

  return score;
}

function sourceContextScore({
  line,
  title,
  url,
}: {
  line: string;
  title: string;
  url: string;
}) {
  const context = `${title} ${url}`.toLowerCase();
  let score = 0;

  if (context.includes("/docs") || context.includes("/api")) {
    score += 2;
  }

  if (context.includes("pricing") || context.includes("changelog")) {
    score += 2;
  }

  if (line.length > 80 && line.length < 240) {
    score += 1;
  }

  return score;
}

function painOverlapScore(line: string, painTokens: string[]) {
  const lower = line.toLowerCase();

  return painTokens.reduce(
    (score, token) => score + (lower.includes(token) ? 2 : 0),
    0,
  );
}

function lineReasons(line: string, pageType: string, templateId: TemplateId) {
  const reasons = [];

  if (TEMPLATE_PAGE_TYPE_WEIGHTS[templateId][pageType]) {
    reasons.push(`${pageType} page fits ${templateId}`);
  }

  if (GOOD_SIGNAL_PATTERNS.some((pattern) => pattern.test(line))) {
    reasons.push("specific product or workflow signal");
  }

  if (/\bapi|sdk|webhook|integration|parameter\b/i.test(line)) {
    reasons.push("technical implementation signal");
  }

  return reasons;
}

function diversifyEvidence(candidates: RankedEvidence[], limit: number) {
  const selected: RankedEvidence[] = [];
  const seenKeys = new Set<string>();
  const seenTypes = new Set<string>();
  const seenUrls = new Set<string>();

  function addCandidate(candidate: RankedEvidence) {
    const key = `${candidate.url}:${candidate.text.toLowerCase()}`;

    if (seenKeys.has(key) || selected.length >= limit) {
      return;
    }

    selected.push(candidate);
    seenKeys.add(key);
    seenTypes.add(candidate.pageType);
    seenUrls.add(candidate.url);
  }

  for (const candidate of candidates) {
    if (!seenTypes.has(candidate.pageType) && !seenUrls.has(candidate.url)) {
      addCandidate(candidate);
    }
  }

  for (const candidate of candidates) {
    if (!seenUrls.has(candidate.url)) {
      addCandidate(candidate);
    }
  }

  for (const candidate of candidates) {
    addCandidate(candidate);
  }

  return selected;
}

export function extractRankedEvidence({
  input,
  fixture,
  templateId,
  limit = 8,
}: {
  input: ProspectInput;
  fixture: ProspectFixture;
  templateId: TemplateId;
  limit?: number;
}): RankedEvidence[] {
  const logger = createPipelineLogger("evidence");
  const painTokens = tokenize(input.painPoint);
  const candidates: RankedEvidence[] = [];
  let lineCount = 0;
  let rejectedCount = 0;

  for (const page of fixture.pages) {
    const pageType = inferPageTypeFromUrl(page.url, page.pageType ?? "page");
    const pageWeight = TEMPLATE_PAGE_TYPE_WEIGHTS[templateId][pageType] ?? 0;
    const lines = page.markdown
      .split("\n")
      .flatMap(segmentLine)
      .map(normalizeLine)
      .filter(Boolean);

    for (const line of lines) {
      lineCount += 1;

      if (isBadSignal(line)) {
        rejectedCount += 1;
        continue;
      }

      const specificity = lineSpecificityScore(line);
      const painOverlap = painOverlapScore(line, painTokens);
      const context = sourceContextScore({
        line,
        title: page.title,
        url: page.url,
      });
      const score = pageWeight + specificity + painOverlap + context;

      if (score < 6 || (pageWeight === 0 && specificity < 8 && painOverlap === 0)) {
        rejectedCount += 1;
        continue;
      }

      candidates.push({
        label: page.title,
        url: page.url,
        pageType,
        text: line,
        score,
        reasons: lineReasons(line, pageType, templateId),
      });
    }
  }

  const seen = new Set<string>();

  const deduped = candidates
    .sort((left, right) => right.score - left.score)
    .filter((candidate) => {
      const key = `${candidate.url}:${candidate.text.toLowerCase()}`;

      if (seen.has(key)) {
        return false;
      }

      seen.add(key);
      return true;
    });
  const ranked =
    templateId === "docs-intelligence"
      ? deduped.slice(0, limit)
      : diversifyEvidence(deduped, limit);

  logger.step("ranked", {
    pages: fixture.pages.length,
    lines: lineCount,
    rejected: rejectedCount,
    candidates: candidates.length,
    selected: ranked.length,
    topScore: ranked[0]?.score ?? 0,
    topType: ranked[0]?.pageType ?? "none",
  });

  return ranked;
}

export function fallbackEvidence(fixture: ProspectFixture): RankedEvidence[] {
  return fixture.pages.slice(0, 3).flatMap((page) => {
    const text = page.markdown
      .split("\n")
      .map(normalizeLine)
      .find((line) => !isBadSignal(line));

    return text
      ? [
          {
            label: page.title,
            url: page.url,
            pageType: page.pageType ?? "page",
            text,
            score: 1,
            reasons: ["fallback source text"],
          },
        ]
      : [];
  });
}
