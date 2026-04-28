import { GoogleGenAI } from "@google/genai";
import type { DemoStory } from "@/lib/generation/demo-story";
import type {
  RecommendedDemo,
  SolutionEngineerBrief,
} from "@/lib/generation/solution-engineer-brief";
import { createPipelineLogger } from "@/lib/observability/pipeline-log";

export interface DemoStoryEnhancerOptions {
  apiKey?: string;
  model?: string;
  enabled?: boolean;
  timeoutMs?: number;
}

interface StoryEnhancement {
  title?: unknown;
  buyerProblem?: unknown;
  firecrawlMove?: unknown;
  proofPoint?: unknown;
  talkTrack?: unknown;
  nextStep?: unknown;
}

function readString(value: unknown) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function extractJsonObject(value: string) {
  const trimmed = value.trim();

  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    return trimmed;
  }

  const match = trimmed.match(/\{[\s\S]*\}/);

  return match?.[0] ?? null;
}

export function applyStoryEnhancement(
  fallback: DemoStory,
  enhancement: StoryEnhancement,
): DemoStory {
  return {
    ...fallback,
    title: readString(enhancement.title) ?? fallback.title,
    buyerProblem: readString(enhancement.buyerProblem) ?? fallback.buyerProblem,
    firecrawlMove: readString(enhancement.firecrawlMove) ?? fallback.firecrawlMove,
    proofPoint: readString(enhancement.proofPoint) ?? fallback.proofPoint,
    talkTrack: readString(enhancement.talkTrack) ?? fallback.talkTrack,
    nextStep: readString(enhancement.nextStep) ?? fallback.nextStep,
  };
}

export function parseGeminiStoryResponse(
  text: string,
  fallback: DemoStory,
): DemoStory {
  const jsonObject = extractJsonObject(text);

  if (!jsonObject) {
    return fallback;
  }

  try {
    return applyStoryEnhancement(fallback, JSON.parse(jsonObject) as StoryEnhancement);
  } catch {
    return fallback;
  }
}

function shouldEnableGemini(optionsEnabled?: boolean) {
  if (optionsEnabled !== undefined) {
    return optionsEnabled;
  }

  return process.env.NODE_ENV !== "test";
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, label: string) {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => {
        reject(new Error(`${label} timed out after ${timeoutMs}ms.`));
      }, timeoutMs);
    }),
  ]);
}

export function createOptionalDemoStoryEnhancer({
  apiKey = process.env.GEMINI_API_KEY,
  model = process.env.GEMINI_MODEL ?? "gemini-3-flash-preview",
  enabled,
  timeoutMs = Number(process.env.GEMINI_TIMEOUT_MS ?? 8_000),
}: DemoStoryEnhancerOptions = {}) {
  const logger = createPipelineLogger("gemini");

  if (!apiKey || !shouldEnableGemini(enabled)) {
    logger.step("enhancer:disabled", {
      hasApiKey: Boolean(apiKey),
      enabled: shouldEnableGemini(enabled),
    });
    return null;
  }

  const ai = new GoogleGenAI({ apiKey });
  logger.step("enhancer:enabled", {
    model,
  });

  return async function enhanceDemoStory(story: DemoStory): Promise<DemoStory> {
    try {
      logger.step("generate:start", {
        evidenceCount: story.evidence.length,
      });
      const response = await withTimeout(
        ai.models.generateContent({
          model,
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: [
                    "Rewrite this Firecrawl sales demo story as grounded JSON.",
                    "Keep the same facts and source-backed evidence. Do not invent claims.",
                    "Return only JSON with these string fields: title, buyerProblem, firecrawlMove, proofPoint, talkTrack, nextStep.",
                    "",
                    story.llmReadyPrompt,
                  ].join("\n"),
                },
              ],
            },
          ],
          config: {
            responseMimeType: "application/json",
            temperature: 0.35,
          },
        }),
        timeoutMs,
        "Gemini story generation",
      );

      const enhancedStory = parseGeminiStoryResponse(response.text ?? "", story);
      logger.step("generate:complete", {
        changed: enhancedStory !== story,
      });

      return enhancedStory;
    } catch (error) {
      logger.error("generate", error);
      return story;
    }
  };
}

function mergeRecommendedDemo(
  fallback: RecommendedDemo,
  enhancement: Partial<RecommendedDemo>,
): RecommendedDemo {
  return {
    ...fallback,
    title: readString(enhancement.title) ?? fallback.title,
    whyThisTemplate: readString(enhancement.whyThisTemplate) ?? fallback.whyThisTemplate,
    firecrawlValue: readString(enhancement.firecrawlValue) ?? fallback.firecrawlValue,
    miniAppConcept: readString(enhancement.miniAppConcept) ?? fallback.miniAppConcept,
    sampleDataToExtract:
      Array.isArray(enhancement.sampleDataToExtract) &&
      enhancement.sampleDataToExtract.every((item) => typeof item === "string")
        ? enhancement.sampleDataToExtract
        : fallback.sampleDataToExtract,
    architecture:
      Array.isArray(enhancement.architecture) &&
      enhancement.architecture.every((item) => typeof item === "string")
        ? enhancement.architecture
        : fallback.architecture,
    demoScript:
      Array.isArray(enhancement.demoScript) &&
      enhancement.demoScript.every((item) => typeof item === "string")
        ? enhancement.demoScript
        : fallback.demoScript,
    pocNextStep: readString(enhancement.pocNextStep) ?? fallback.pocNextStep,
  };
}

export function parseGeminiBriefResponse(
  text: string,
  fallback: SolutionEngineerBrief,
): SolutionEngineerBrief {
  const jsonObject = extractJsonObject(text);

  if (!jsonObject) {
    return fallback;
  }

  try {
    const parsed = JSON.parse(jsonObject) as Partial<SolutionEngineerBrief>;

    return {
      ...fallback,
      productCategory: readString(parsed.productCategory) ?? fallback.productCategory,
      targetUsers:
        Array.isArray(parsed.targetUsers) &&
        parsed.targetUsers.every((item) => typeof item === "string")
          ? parsed.targetUsers
          : fallback.targetUsers,
      recommendedDemo: mergeRecommendedDemo(
        fallback.recommendedDemo,
        (parsed.recommendedDemo ?? {}) as Partial<RecommendedDemo>,
      ),
    };
  } catch {
    return fallback;
  }
}

export function createOptionalSolutionBriefEnhancer({
  apiKey = process.env.GEMINI_API_KEY,
  model = process.env.GEMINI_MODEL ?? "gemini-3-flash-preview",
  enabled,
  timeoutMs = Number(process.env.GEMINI_TIMEOUT_MS ?? 8_000),
}: DemoStoryEnhancerOptions = {}) {
  const logger = createPipelineLogger("gemini-brief");

  if (!apiKey || !shouldEnableGemini(enabled)) {
    logger.step("enhancer:disabled", {
      hasApiKey: Boolean(apiKey),
      enabled: shouldEnableGemini(enabled),
    });
    return null;
  }

  const ai = new GoogleGenAI({ apiKey });
  logger.step("enhancer:enabled", {
    model,
  });

  return async function enhanceSolutionBrief(
    brief: SolutionEngineerBrief,
  ): Promise<SolutionEngineerBrief> {
    try {
      logger.step("generate:start", {
        surfaces: brief.publicSurfaces.length,
        workflows: brief.inferredWorkflows.length,
      });
      const response = await withTimeout(
        ai.models.generateContent({
          model,
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: [
                    "You are a Firecrawl solution engineer.",
                    "Improve this Solution Engineer Brief so it sells a concrete mini-POC, not a generic crawler pitch.",
                    "The publicSurfaces list has already been filtered and ranked; use those signals only.",
                    "Do not use captcha, cookie, nav, login, footer, or generic landing-page copy as proof.",
                    "Keep every claim grounded in the provided public surfaces and workflow evidence.",
                    "Return only JSON. You may rewrite productCategory, targetUsers, and recommendedDemo.",
                    "recommendedDemo must include: title, whyThisTemplate, firecrawlValue, miniAppConcept, sampleDataToExtract, architecture, demoScript, pocNextStep.",
                    "",
                    JSON.stringify(brief),
                  ].join("\n"),
                },
              ],
            },
          ],
          config: {
            responseMimeType: "application/json",
            temperature: 0.25,
          },
        }),
        timeoutMs,
        "Gemini brief generation",
      );
      const enhancedBrief = parseGeminiBriefResponse(response.text ?? "", brief);

      logger.step("generate:complete", {
        changed: enhancedBrief !== brief,
      });

      return enhancedBrief;
    } catch (error) {
      logger.error("generate", error);
      return brief;
    }
  };
}
