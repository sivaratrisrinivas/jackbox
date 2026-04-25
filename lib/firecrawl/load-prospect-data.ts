import {
  createFirecrawlClient,
  type FirecrawlClient,
} from "@/lib/firecrawl/client";
import {
  createFixtureLoader,
  type ProspectFixture,
  type ProspectFixtureLoader,
} from "@/lib/firecrawl/fixtures";
import {
  getFirecrawlApiKey,
  resolveFirecrawlMode,
  type FirecrawlMode,
} from "@/lib/firecrawl/mode";
import { routeProspect } from "@/lib/router/route-prospect";
import type { ProspectInput } from "@/lib/validation/prospect";

export interface ProspectDataLoader {
  loadProspectData(input: ProspectInput): Promise<ProspectFixture>;
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

  return {
    async loadProspectData(input) {
      const resolvedMode = resolveFirecrawlMode({
        requestedMode: options.requestedMode,
        apiKey,
      });

      if (resolvedMode.effectiveMode === "fixture") {
        const fixture = await fixtureLoader.loadFixtureProspectData(fixtureIdForInput(input));

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

      try {
        const initialPlan = routeProspect(input);

        return await liveClient.loadProspectData({
          companyUrl: input.companyUrl,
          crawlTargets: initialPlan.crawlTargets,
        });
      } catch (error) {
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
