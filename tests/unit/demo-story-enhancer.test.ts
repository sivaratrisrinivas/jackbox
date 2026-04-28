import { describe, expect, it } from "vitest";
import type { DemoStory } from "@/lib/generation/demo-story";
import {
  createOptionalDemoStoryEnhancer,
  parseGeminiStoryResponse,
} from "@/lib/llm/demo-story-enhancer";

const fallbackStory: DemoStory = {
  title: "Acme: a Firecrawl story",
  buyerProblem: "Support needs trusted answers from public docs.",
  firecrawlMove: "Crawl docs and ground answers in citations.",
  proofPoint: "Docs: The setup guide explains onboarding.",
  talkTrack: "We used public docs to build a source-backed story.",
  nextStep: "Run one real support question live.",
  evidence: [
    {
      label: "Docs",
      url: "https://acme.example.com/docs",
      text: "The setup guide explains onboarding.",
    },
  ],
  llmReadyPrompt: "Company: Acme",
};

describe("Gemini story enhancer", () => {
  it("applies grounded JSON fields from a Gemini response", () => {
    const story = parseGeminiStoryResponse(
      JSON.stringify({
        title: "Acme support story",
        buyerProblem: "Support cannot answer onboarding questions quickly.",
        firecrawlMove: "Use Firecrawl to extract the onboarding docs.",
        proofPoint: "Docs: onboarding setup is public.",
        talkTrack: "We turned your docs into a verifiable support workflow.",
        nextStep: "Ask one real onboarding question.",
      }),
      fallbackStory,
    );

    expect(story.title).toBe("Acme support story");
    expect(story.nextStep).toBe("Ask one real onboarding question.");
    expect(story.evidence).toEqual(fallbackStory.evidence);
  });

  it("falls back when Gemini returns non-json text", () => {
    const story = parseGeminiStoryResponse("Here is a story.", fallbackStory);

    expect(story).toBe(fallbackStory);
  });

  it("does not create a live enhancer while tests are running", () => {
    expect(createOptionalDemoStoryEnhancer({ apiKey: "test-key" })).toBeNull();
  });
});
