import type { DemoPackage } from "@/lib/generation/demo-package";

const TEMPLATE_NAMES: Record<DemoPackage["templateId"], string> = {
  "docs-intelligence": "Docs intelligence",
  "change-monitor": "Change monitor",
  "account-research": "Account research",
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
  const fallbackReason = getPreviewString(demoPackage, "fallbackReason");
  const sourceLabel = dataSource === "live" ? "Live crawl" : "Fixture preview";
  const sourceClassName =
    dataSource === "live"
      ? "border-sky-200/20 bg-sky-300/12 text-sky-50"
      : "border-amber-200/20 bg-amber-300/12 text-amber-50";

  return (
    <div className="rounded-[1.8rem] border border-white/10 bg-white/[0.055] p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.22em] text-emerald-100/70">
            Routed handoff
          </p>
          <h3 className="mt-4 max-w-2xl text-3xl font-semibold tracking-tight text-white">
            {companyName} is ready for a tailored Firecrawl walkthrough.
          </h3>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="rounded-full border border-emerald-200/20 bg-emerald-300/10 px-4 py-2 text-sm font-medium text-emerald-50">
            {TEMPLATE_NAMES[demoPackage.templateId]}
          </div>
          <div
            className={`rounded-full border px-4 py-2 text-sm font-medium ${sourceClassName}`}
          >
            {sourceLabel}
          </div>
        </div>
      </div>

      <div className="mt-7 grid gap-4 md:grid-cols-2">
        <article className="rounded-[1.3rem] border border-white/10 bg-black/25 p-4">
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-white/45">
            Prospect URL
          </p>
          <p className="mt-3 break-words text-sm leading-7 text-zinc-200">
            {demoPackage.input.companyUrl}
          </p>
        </article>
        <article className="rounded-[1.3rem] border border-white/10 bg-black/25 p-4">
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-white/45">
            Buyer pain
          </p>
          <p className="mt-3 text-sm leading-7 text-zinc-200">
            {demoPackage.input.painPoint}
          </p>
        </article>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.08fr_0.92fr]">
        <article className="rounded-[1.3rem] border border-white/10 bg-black/25 p-4">
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-white/45">
            Routing rationale
          </p>
          <p className="mt-3 text-sm leading-7 text-zinc-200">
            {demoPackage.routedPlan.reason}
          </p>
        </article>
        <article className="rounded-[1.3rem] border border-emerald-200/15 bg-emerald-400/10 p-4">
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-emerald-100/70">
            Credit estimate
          </p>
          <div className="mt-3 flex items-end gap-3">
            <p className="text-5xl font-semibold tracking-tight text-white">
              {demoPackage.creditEstimate.totalCredits}
            </p>
            <p className="pb-2 text-sm text-emerald-50/70">credits</p>
          </div>
          <p className="mt-3 text-sm leading-7 text-zinc-100">
            {demoPackage.creditEstimate.rationale}
          </p>
        </article>
      </div>

      {fallbackReason ? (
        <article className="mt-4 rounded-[1.3rem] border border-amber-200/15 bg-amber-300/8 p-4">
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-amber-100/75">
            Source handoff
          </p>
          <p className="mt-3 text-sm leading-7 text-zinc-100">{fallbackReason}</p>
        </article>
      ) : null}
    </div>
  );
}
