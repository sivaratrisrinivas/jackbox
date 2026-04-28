import { Composition } from "remotion";
import {
  buildDemoVideoProps,
  DemoVideoPropsSchema,
} from "../lib/video/demo-video-props";
import { ProspectDemoVideo } from "./ProspectDemoVideo";

const defaultVideoProps = buildDemoVideoProps({
  id: "demo_acme_docs-intelligence",
  templateId: "docs-intelligence",
  createdAt: "2026-04-27T00:00:00.000Z",
  input: {
    companyUrl: "https://acme.example.com",
    painPoint:
      "Support teams cannot answer product questions from the latest docs fast enough.",
  },
  routedPlan: {
    templateId: "docs-intelligence",
    reason:
      "The brief points to docs and support, so a citation-backed answer demo is the clearest path.",
    crawlTargets: ["https://acme.example.com/docs"],
  },
  summary: {
    headline: "Citation-backed answers from the prospect's own docs",
    whyThisMatters:
      "Acme can see how Firecrawl turns public docs into an answer-ready workflow.",
    architectureNote:
      "The route gathers public docs pages and keeps every claim tied to source URLs.",
  },
  preview: {
    companyName: "Acme Cloud",
    dataSource: "fixture",
  },
  provenance: [
    {
      label: "Getting Started",
      url: "https://acme.example.com/docs/getting-started",
    },
    {
      label: "Answer Workflows",
      url: "https://acme.example.com/docs/answers",
    },
  ],
  creditEstimate: {
    totalCredits: 10,
    rationale: "Docs demos need enough crawl coverage for credible citations.",
    breakdown: [{ label: "Crawl", credits: 7 }],
  },
  files: [],
});

export function RemotionRoot() {
  return (
    <Composition
      id="ProspectDemo"
      component={ProspectDemoVideo}
      durationInFrames={900}
      fps={30}
      width={1920}
      height={1080}
      schema={DemoVideoPropsSchema}
      defaultProps={defaultVideoProps}
    />
  );
}
