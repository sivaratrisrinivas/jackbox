import { z } from "zod";

export const FirecrawlModeSchema = z.enum(["auto", "fixture", "live"]);

export type FirecrawlMode = z.infer<typeof FirecrawlModeSchema>;

const DEFAULT_FIRECRAWL_MODE: FirecrawlMode = "auto";

export interface ResolvedFirecrawlMode {
  requestedMode: FirecrawlMode;
  effectiveMode: Exclude<FirecrawlMode, "auto">;
  fallbackReason?: string;
}

function parseFirecrawlMode(value: string | null | undefined) {
  if (!value) {
    return DEFAULT_FIRECRAWL_MODE;
  }

  const parsed = FirecrawlModeSchema.safeParse(value.trim().toLowerCase());

  if (!parsed.success) {
    throw new Error(
      `Unsupported JACKBOX_FIRECRAWL_MODE "${value}". Expected auto, fixture, or live.`,
    );
  }

  return parsed.data;
}

export function getRequestedFirecrawlMode(value = process.env.JACKBOX_FIRECRAWL_MODE) {
  return parseFirecrawlMode(value);
}

export function getFirecrawlApiKey(value = process.env.FIRECRAWL_API_KEY) {
  const apiKey = value?.trim();
  return apiKey ? apiKey : null;
}

export function resolveFirecrawlMode({
  requestedMode = getRequestedFirecrawlMode(),
  apiKey = getFirecrawlApiKey(),
}: {
  requestedMode?: FirecrawlMode;
  apiKey?: string | null;
} = {}): ResolvedFirecrawlMode {
  if (requestedMode === "fixture") {
    return {
      requestedMode,
      effectiveMode: "fixture",
    };
  }

  if (!apiKey) {
    if (requestedMode === "live") {
      throw new Error(
        "Live Firecrawl mode requires FIRECRAWL_API_KEY to be set on the server.",
      );
    }

    return {
      requestedMode,
      effectiveMode: "fixture",
      fallbackReason:
        "Live Firecrawl is unavailable because FIRECRAWL_API_KEY is not set, so Jackbox stayed in fixture mode.",
    };
  }

  return {
    requestedMode,
    effectiveMode: "live",
  };
}
