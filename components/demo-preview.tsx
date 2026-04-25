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

function getPreviewNumber(demoPackage: DemoPackage, key: string) {
  const value = demoPackage.preview[key];

  return typeof value === "number" ? value : null;
}

export interface DemoPreviewProps {
  demoPackage: DemoPackage;
}

export function DemoPreview({ demoPackage }: DemoPreviewProps) {
  const companyName = getPreviewString(demoPackage, "companyName") ?? "This prospect";
  const primarySourceTitle =
    getPreviewString(demoPackage, "primarySourceTitle") ?? "Primary source";
  const sourcePageCount = getPreviewNumber(demoPackage, "sourcePageCount");

  return (
    <article className="group overflow-hidden rounded-[1.8rem] border border-white/10 bg-black/35">
      <div
        className="min-h-44 bg-cover bg-center opacity-90 contrast-125 transition-transform duration-700 ease-out group-hover:scale-105"
        style={{
          backgroundImage:
            "linear-gradient(180deg, rgba(4,7,18,0.08), rgba(4,7,18,0.88)), url(https://picsum.photos/seed/jackbox-demo-preview/1200/720)",
        }}
      />
      <div className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-white/45">
            Template preview
          </p>
          <span className="rounded-full border border-white/10 bg-white/8 px-3 py-1.5 text-sm text-zinc-100">
            {TEMPLATE_NAMES[demoPackage.templateId]}
          </span>
        </div>

        <h4 className="mt-5 text-2xl font-semibold tracking-tight text-white">
          {demoPackage.summary.headline}
        </h4>
        <p className="mt-4 text-sm leading-7 text-zinc-300">
          {demoPackage.summary.whyThisMatters}
        </p>

        <div className="mt-5 rounded-[1.25rem] border border-white/10 bg-white/[0.045] p-4">
          <p className="text-sm leading-7 text-zinc-200">
            {companyName} starts from <span className="text-white">{primarySourceTitle}</span>
            {sourcePageCount === null
              ? "."
              : ` with ${sourcePageCount} fixture-backed public pages available for the preview.`}
          </p>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {demoPackage.routedPlan.crawlTargets.map((target) => (
            <div
              key={target}
              className="rounded-[1.15rem] border border-white/8 bg-black/25 px-4 py-3 text-sm leading-6 text-zinc-200"
            >
              {target}
            </div>
          ))}
        </div>
      </div>
    </article>
  );
}
