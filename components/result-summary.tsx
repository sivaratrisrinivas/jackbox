import type { DemoPackage } from "@/lib/generation/demo-package";
import { getDemoStory } from "@/lib/generation/demo-story";
import { getSolutionEngineerBrief } from "@/lib/generation/solution-engineer-brief";

const TEMPLATE_NAMES: Record<DemoPackage["templateId"], string> = {
  "docs-intelligence": "Docs Intelligence",
  "change-monitor": "Change Monitor",
  "account-research": "Account Research",
};

function getPreviewString(demoPackage: DemoPackage, key: string) {
  const value = demoPackage.preview[key];

  return typeof value === "string" ? value : null;
}

function getCompanyName(demoPackage: DemoPackage) {
  if (typeof demoPackage.preview.companyName === "string") {
    return demoPackage.preview.companyName;
  }

  const host = new URL(demoPackage.input.companyUrl).hostname.replace(/^www\./, "");
  const [name] = host.split(".");

  return name.replace(/[-_]/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export interface ResultSummaryProps {
  demoPackage: DemoPackage;
}

export function ResultSummary({ demoPackage }: ResultSummaryProps) {
  const companyName = getCompanyName(demoPackage);
  const dataSource = getPreviewString(demoPackage, "dataSource");
  const sourceCount = demoPackage.provenance.length;
  const primarySource = demoPackage.provenance[0];
  const sourceLabel = dataSource === "live" ? "Live sources" : "Saved sources";
  const story = getDemoStory(demoPackage.preview.story);
  const solutionBrief = getSolutionEngineerBrief(demoPackage.preview.solutionBrief);
  const workflow = solutionBrief?.inferredWorkflows[0];
  const recommendedDemo = solutionBrief?.recommendedDemo;

  return (
    <div className="border-b border-[#171a1c]/10 pb-8">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-[#202326]/54">
        <span className="font-semibold text-[#171a1c]">
          {TEMPLATE_NAMES[demoPackage.templateId]}
        </span>
        <span aria-hidden="true">/</span>
        <span>
          {sourceLabel}
        </span>
        <span aria-hidden="true">/</span>
        <span>
          {sourceCount} sources
        </span>
      </div>

      <h2 className="mt-5 max-w-4xl text-4xl font-semibold leading-tight text-[#171a1c] text-balance sm:text-5xl">
        {companyName} demo room is ready.
      </h2>

      <p className="mt-4 max-w-3xl text-base leading-8 text-[#202326]/64 text-pretty">
        {demoPackage.summary.headline}
      </p>

      {recommendedDemo ? (
        <div className="mt-8 rounded-2xl border border-[#171a1c]/10 bg-white p-5 sm:p-6">
          <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
            <div>
              <p className="text-sm font-semibold text-[#315bff]">Recommended mini-POC</p>
              <h3 className="mt-3 text-2xl font-semibold leading-tight text-[#171a1c] text-balance">
                {recommendedDemo.title}
              </h3>
              <p className="mt-4 text-base leading-8 text-[#202326]/66 text-pretty">
                {recommendedDemo.miniAppConcept}
              </p>
            </div>
            <dl className="grid content-start gap-4">
              {[
                ["Workflow", workflow?.workflowName ?? demoPackage.summary.headline],
                [
                  "Team",
                  workflow?.buyerTeam ??
                    solutionBrief?.targetUsers.join(", ") ??
                    "Sales engineering",
                ],
                ["Why Firecrawl", recommendedDemo.firecrawlValue],
              ].map(([label, copy]) => (
                <div key={label}>
                  <dt className="text-sm font-semibold text-[#202326]/45">
                    {label}
                  </dt>
                  <dd className="mt-1 text-sm leading-6 text-[#202326]/72">{copy}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      ) : story ? (
        <div className="mt-8 rounded-2xl border border-[#171a1c]/10 bg-white p-5">
          <p className="text-sm font-semibold text-[#315bff]">Sales story</p>
          <ol className="mt-4 grid gap-4">
            {[
              ["Outcome", demoPackage.summary.headline],
              ["Pain", story.buyerProblem],
              ["Move", story.firecrawlMove],
              ["Proof", story.proofPoint],
              ["Talk track", story.talkTrack],
              ["Next step", story.nextStep],
            ].map(([label, copy]) => (
              <li key={label} className="grid gap-2 sm:grid-cols-[7rem_1fr]">
                <span className="text-sm text-[#202326]/42">{label}</span>
                <span className="text-sm leading-7 text-[#202326]/70">{copy}</span>
              </li>
            ))}
          </ol>
        </div>
      ) : (
        <div className="mt-8 rounded-2xl border border-[#171a1c]/10 bg-white p-5">
          <p className="text-sm text-[#202326]/42">Preview</p>
          <p className="mt-2 text-base leading-7 text-[#202326]/70">
            {demoPackage.summary.headline}
          </p>
        </div>
      )}

      <div className="mt-5 flex flex-wrap gap-2 text-sm text-[#202326]/48">
        <span>Primary: {primarySource?.label ?? "Public website"}</span>
        <span aria-hidden="true">/</span>
        <span>{demoPackage.creditEstimate.totalCredits} credits estimated</span>
      </div>
    </div>
  );
}
