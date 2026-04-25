import {
  createFixtureLoader,
  type ProspectFixture,
  type ProspectFixtureLoader,
} from "@/lib/firecrawl/fixtures";
import type { ProspectInput } from "@/lib/validation/prospect";

export interface ProspectDataLoader {
  loadProspectData(input: ProspectInput): Promise<ProspectFixture>;
}

const FIXTURE_BY_HOST: Record<string, string> = {
  "acme.example.com": "acme-docs",
};

function fixtureIdForInput(input: ProspectInput) {
  const host = new URL(input.companyUrl).hostname.replace(/^www\./, "");

  return FIXTURE_BY_HOST[host] ?? "acme-docs";
}

export function createProspectDataLoader(
  fixtureLoader: ProspectFixtureLoader = createFixtureLoader(),
): ProspectDataLoader {
  return {
    loadProspectData(input) {
      return fixtureLoader.loadFixtureProspectData(fixtureIdForInput(input));
    },
  };
}
