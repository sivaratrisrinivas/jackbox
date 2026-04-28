import {
  createFirecrawlClient,
  type FirecrawlClient,
} from "@/lib/firecrawl/client";
import {
  createFixtureLoader,
  type ProspectFixture,
  type ProspectFixtureLoader,
} from "@/lib/firecrawl/fixtures";
import { loadPublicPagesWithFetch } from "@/lib/firecrawl/direct-fetch";
import {
  getFirecrawlApiKey,
  resolveFirecrawlMode,
  type FirecrawlMode,
} from "@/lib/firecrawl/mode";
import { createPipelineLogger } from "@/lib/observability/pipeline-log";
import { routeProspect } from "@/lib/router/route-prospect";
import type { ProspectInput } from "@/lib/validation/prospect";

export interface ProspectDataLoader {
  loadProspectData(input: ProspectInput): Promise<ProspectFixture>;
}

function shouldUseDirectFetchFallback() {
  return process.env.NODE_ENV !== "test";
}

const FIXTURE_BY_HOST: Record<string, string> = {
  "acme.example.com": "acme-docs",
  "signalforge.example.com": "change-monitor",
  "northstar.example.com": "account-research",
};

function fixtureIdForInput(input: ProspectInput) {
  const host = new URL(input.companyUrl).hostname.replace(/^www\./, "");

  if (FIXTURE_BY_HOST[host]) {
    return FIXTURE_BY_HOST[host];
  }

  const templateId = routeProspect(input).templateId;

  return templateId;
}

function withDataSourceMetadata(
  fixture: ProspectFixture,
  metadata: Pick<ProspectFixture, "dataSource" | "fallbackReason">,
) {
  return {
    ...fixture,
    ...metadata,
  };
}

function mergeProspectFixtures(
  primary: ProspectFixture,
  secondary: ProspectFixture | null,
): ProspectFixture {
  if (!secondary) {
    return primary;
  }

  const secondaryByUrl = new Map(secondary.pages.map((page) => [page.url, page]));
  const mergedPrimaryPages = primary.pages.map((page) => {
    const supplement = secondaryByUrl.get(page.url);

    if (!supplement) {
      return page;
    }

    const existingLines = new Set(
      page.markdown
        .split("\n")
        .map((line) => line.trim().toLowerCase())
        .filter(Boolean),
    );
    const supplementalLines = supplement.markdown
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 2 && !existingLines.has(line.toLowerCase()))
      .slice(0, 35);

    if (supplementalLines.length === 0) {
      return page;
    }

    return {
      ...page,
      markdown: `${page.markdown}\n${supplementalLines.join("\n")}`.slice(0, 16_000),
    };
  });
  const seen = new Set(primary.pages.map((page) => page.url));
  const extraPages = secondary.pages.filter((page) => !seen.has(page.url));

  if (extraPages.length === 0) {
    return {
      ...primary,
      pages: mergedPrimaryPages,
      notes: [
        ...primary.notes,
        ...secondary.notes,
        "Firecrawl crawl results were enriched with direct public fetch text for matching pages.",
      ],
    };
  }

  return {
    ...primary,
    pages: [...mergedPrimaryPages, ...extraPages],
    notes: [
      ...primary.notes,
      ...secondary.notes,
      "Firecrawl crawl results were enriched with direct public fetch results.",
    ],
  };
}

export function createProspectDataLoader(
  options: {
    fixtureLoader?: ProspectFixtureLoader;
    liveClient?: FirecrawlClient;
    requestedMode?: FirecrawlMode;
    apiKey?: string | null;
  } = {},
): ProspectDataLoader {
  const fixtureLoader = options.fixtureLoader ?? createFixtureLoader();
  const apiKey = options.apiKey ?? getFirecrawlApiKey();
  const logger = createPipelineLogger("data-loader");

  return {
    async loadProspectData(input) {
      logger.step("mode:resolve:start", {
        host: new URL(input.companyUrl).hostname,
      });
      const resolvedMode = resolveFirecrawlMode({
        requestedMode: options.requestedMode,
        apiKey,
      });
      logger.step("mode:resolved", {
        requestedMode: resolvedMode.requestedMode,
        effectiveMode: resolvedMode.effectiveMode,
        hasApiKey: Boolean(apiKey),
      });

      if (resolvedMode.effectiveMode === "fixture") {
        const fixtureId = fixtureIdForInput(input);
        logger.step("fixture:load:start", {
          fixtureId,
          fallbackReason: resolvedMode.fallbackReason,
        });
        const fixture = await fixtureLoader.loadFixtureProspectData(fixtureId);
        logger.step("fixture:load:complete", {
          pages: fixture.pages.length,
        });

        return withDataSourceMetadata(fixture, {
          dataSource: "fixture",
          fallbackReason: resolvedMode.fallbackReason,
        });
      }

      const liveClient =
        options.liveClient ??
        createFirecrawlClient({
          apiKey: apiKey ?? "",
        });
      const initialPlan = routeProspect(input);
      logger.step("live:plan", {
        templateId: initialPlan.templateId,
        crawlTargets: initialPlan.crawlTargets.length,
      });

      try {
        const liveFixture = await liveClient.loadProspectData({
          companyUrl: input.companyUrl,
          crawlTargets: initialPlan.crawlTargets,
        });
        logger.step("live:crawl:complete", {
          pages: liveFixture.pages.length,
          minimumUsefulPages: Math.min(2, initialPlan.crawlTargets.length),
        });
        const minimumUsefulPages = Math.min(2, initialPlan.crawlTargets.length);
        let enrichedLiveFixture = liveFixture;
        let directFetchFixture: ProspectFixture | null = null;

        if (shouldUseDirectFetchFallback()) {
          logger.step("direct-fetch:start", {
            reason: "live-crawl-enrichment",
          });
          directFetchFixture = await loadPublicPagesWithFetch({
            companyUrl: input.companyUrl,
            urls: initialPlan.crawlTargets,
          });
          logger.step("direct-fetch:complete", {
            pages: directFetchFixture?.pages.length ?? 0,
          });
          enrichedLiveFixture = mergeProspectFixtures(liveFixture, directFetchFixture);
        }

        if (enrichedLiveFixture.pages.length >= minimumUsefulPages) {
          return enrichedLiveFixture;
        }

        if (!directFetchFixture) {
          logger.step("direct-fetch:start", {
            reason: "sparse-live-crawl",
          });
          directFetchFixture = await loadPublicPagesWithFetch({
            companyUrl: input.companyUrl,
            urls: initialPlan.crawlTargets,
          });
          logger.step("direct-fetch:complete", {
            pages: directFetchFixture?.pages.length ?? 0,
          });
        }

        return mergeProspectFixtures(enrichedLiveFixture, directFetchFixture);
      } catch (error) {
        logger.error("live:crawl", error, {
          requestedMode: resolvedMode.requestedMode,
        });
        if (shouldUseDirectFetchFallback()) {
          logger.step("direct-fetch:start", {
            reason: "live-crawl-error",
          });
          const directFetchFixture = await loadPublicPagesWithFetch({
            companyUrl: input.companyUrl,
            urls: initialPlan.crawlTargets,
          });
          logger.step("direct-fetch:complete", {
            pages: directFetchFixture?.pages.length ?? 0,
          });

          if (directFetchFixture) {
            return {
              ...directFetchFixture,
              fallbackReason:
                error instanceof Error
                  ? `Firecrawl failed, so direct public fetch was used: ${error.message}`
                  : "Firecrawl failed, so direct public fetch was used.",
            };
          }
        }

        if (resolvedMode.requestedMode === "live") {
          throw new Error(
            error instanceof Error
              ? `Live Firecrawl mode failed: ${error.message}`
              : "Live Firecrawl mode failed for the requested prospect crawl.",
          );
        }

        const fixture = await fixtureLoader.loadFixtureProspectData(fixtureIdForInput(input));
        const fallbackReason =
          error instanceof Error
            ? `Live Firecrawl fell back to fixture mode: ${error.message}`
            : "Live Firecrawl fell back to fixture mode after an unknown adapter failure.";

        return withDataSourceMetadata(fixture, {
          dataSource: "fixture",
          fallbackReason,
        });
      }
    },
  };
}
