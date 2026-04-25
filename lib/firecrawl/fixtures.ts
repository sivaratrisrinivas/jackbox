import { readFile } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";

export const FixturePageSchema = z.object({
  url: z.string().url("Fixture page URL must be valid."),
  title: z.string().trim().min(1, "Fixture page title is required."),
  markdown: z.string().trim().min(1, "Fixture page markdown is required."),
  pageType: z.string().trim().min(1).optional(),
});

export const ProspectFixtureSchema = z.object({
  fixtureId: z.string().trim().min(1, "Fixture id is required."),
  company: z.object({
    name: z.string().trim().min(1, "Company name is required."),
    website: z.string().url("Company website must be valid."),
  }),
  pages: z
    .array(FixturePageSchema)
    .min(1, "Fixture must include at least one page."),
  notes: z.array(z.string().trim().min(1)).default([]),
  dataSource: z.enum(["fixture", "live"]).optional(),
  fallbackReason: z
    .string()
    .trim()
    .min(1, "Fallback reason must not be empty.")
    .optional(),
});

export type ProspectFixture = z.infer<typeof ProspectFixtureSchema>;

export interface ProspectFixtureLoader {
  loadFixtureProspectData(fixtureId: string): Promise<ProspectFixture>;
}

const DEFAULT_FIXTURE_DIR = path.join(process.cwd(), "docs", "fixtures");

function resolveFixturePath(fixtureId: string, baseDir: string) {
  return path.join(baseDir, `${fixtureId}.json`);
}

function formatFixtureIssues(error: z.ZodError) {
  return error.issues
    .map((issue) => {
      const location = issue.path.length > 0 ? issue.path.join(".") : "root";
      return `${location}: ${issue.message}`;
    })
    .join("; ");
}

export async function loadFixtureProspectData(
  fixtureId: string,
  baseDir = DEFAULT_FIXTURE_DIR,
) {
  const fixturePath = resolveFixturePath(fixtureId, baseDir);

  let rawFixture: string;
  try {
    rawFixture = await readFile(fixturePath, "utf8");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown file read error";
    throw new Error(`Fixture "${fixtureId}" could not be loaded from ${fixturePath}: ${message}`);
  }

  let parsedFixture: unknown;
  try {
    parsedFixture = JSON.parse(rawFixture);
  } catch {
    throw new Error(`Fixture "${fixtureId}" is not valid JSON.`);
  }

  try {
    return ProspectFixtureSchema.parse(parsedFixture);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(
        `Fixture "${fixtureId}" failed validation: ${formatFixtureIssues(error)}`,
      );
    }

    throw error;
  }
}

export function createFixtureLoader(baseDir = DEFAULT_FIXTURE_DIR): ProspectFixtureLoader {
  return {
    loadFixtureProspectData(fixtureId: string) {
      return loadFixtureProspectData(fixtureId, baseDir);
    },
  };
}
