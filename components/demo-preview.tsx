import type { DemoPackage } from "@/lib/generation/demo-package";

const TEMPLATE_NAMES: Record<DemoPackage["templateId"], string> = {
  "docs-intelligence": "Docs intelligence",
  "change-monitor": "Change monitor",
  "account-research": "Account research",
};

interface PreviewAnswer {
  question: string;
  answer: string;
  citations: Array<{
    label: string;
    url: string;
  }>;
}

function getPreviewString(demoPackage: DemoPackage, key: string) {
  const value = demoPackage.preview[key];

  return typeof value === "string" ? value : null;
}

function getPreviewNumber(demoPackage: DemoPackage, key: string) {
  const value = demoPackage.preview[key];

  return typeof value === "number" ? value : null;
}

function getDocsAnswers(demoPackage: DemoPackage): PreviewAnswer[] {
  const value = demoPackage.preview.answers;

  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((answer: unknown) => {
    if (
      typeof answer !== "object" ||
      answer === null ||
      !("question" in answer) ||
      !("answer" in answer) ||
      !("citations" in answer) ||
      typeof answer.question !== "string" ||
      typeof answer.answer !== "string" ||
      !Array.isArray(answer.citations)
    ) {
      return [];
    }

    const answerCitations: unknown[] = answer.citations;
    const citations = answerCitations.flatMap((citation: unknown) => {
      if (
        typeof citation !== "object" ||
        citation === null ||
        !("label" in citation) ||
        !("url" in citation) ||
        typeof citation.label !== "string" ||
        typeof citation.url !== "string"
      ) {
        return [];
      }

      return [{ label: citation.label, url: citation.url }];
    });

    return [{ question: answer.question, answer: answer.answer, citations }];
  });
}

export interface DemoPreviewProps {
  demoPackage: DemoPackage;
}

export function DemoPreview({ demoPackage }: DemoPreviewProps) {
  const companyName = getPreviewString(demoPackage, "companyName") ?? "This prospect";
  const primarySourceTitle =
    getPreviewString(demoPackage, "primarySourceTitle") ?? "Primary source";
  const sourcePageCount = getPreviewNumber(demoPackage, "sourcePageCount");
  const docsAnswers = getDocsAnswers(demoPackage);

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

        {docsAnswers.length > 0 ? (
          <div className="mt-5 grid gap-3">
            {docsAnswers.map((answer) => (
              <article
                key={answer.question}
                className="group/answer overflow-hidden rounded-[1.25rem] border border-sky-100/10 bg-sky-200/[0.055] p-4 transition duration-500 hover:border-sky-100/25 hover:bg-sky-200/[0.085]"
              >
                <h5 className="text-base font-semibold tracking-tight text-white">
                  {answer.question}
                </h5>
                <p className="mt-3 text-sm leading-7 text-zinc-200">{answer.answer}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {answer.citations.map((citation) => (
                    <a
                      key={citation.url}
                      href={citation.url}
                      className="rounded-full border border-white/10 bg-black/25 px-3 py-1.5 text-xs text-sky-100 transition duration-500 hover:border-sky-100/35 hover:bg-sky-200/10"
                    >
                      {citation.label}
                    </a>
                  ))}
                </div>
              </article>
            ))}
          </div>
        ) : null}
      </div>
    </article>
  );
}
