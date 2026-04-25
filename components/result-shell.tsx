import { DemoPreview } from "@/components/demo-preview";
import { ResultSummary } from "@/components/result-summary";
import { SourceProvenance } from "@/components/source-provenance";
import type { DemoPackage } from "@/lib/generation/demo-package";

export type GenerationStatusType = "idle" | "loading" | "success" | "error";

export interface ResultShellProps {
  status: GenerationStatusType;
  result?: DemoPackage | null;
  errorMessage?: string | null;
}

const FALLBACK_ARTIFACTS = [
  "Prospect brief normalized into a single founder-readable summary.",
  "Result panel ready to host routing rationale and preview content.",
  "Async status container prepared for loading and retry states.",
];

export function ResultShell({ status, result, errorMessage }: ResultShellProps) {
  if (status === "loading") {
    return (
      <section
        aria-live="polite"
        className="rounded-[2rem] border border-sky-300/15 bg-sky-400/10 p-6 shadow-[0_20px_80px_rgba(8,15,30,0.45)] backdrop-blur"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.24em] text-sky-100/75">
              Preparing the handoff
            </p>
            <h3 className="mt-4 max-w-2xl text-3xl font-semibold tracking-tight text-white">
              We are shaping the founder brief into a visible result shell.
            </h3>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-full border border-sky-200/20 bg-sky-200/10">
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-sky-100/20 border-t-sky-100" />
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {[
            "Normalizing the prospect URL and pain point.",
            "Scoring the brief against the three curated templates.",
            "Selecting public crawl targets inside the approved site surface.",
            "Estimating crawl, extraction, and packaging credits.",
          ].map((item) => (
            <div
              key={item}
              className="rounded-[1.4rem] border border-sky-100/10 bg-black/20 p-4 text-sm leading-7 text-zinc-200"
            >
              {item}
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (status === "error") {
    return (
      <section
        aria-live="polite"
        className="rounded-[2rem] border border-rose-400/25 bg-rose-500/10 p-6 backdrop-blur"
      >
        <p className="text-sm font-medium uppercase tracking-[0.24em] text-rose-200/80">
          Recovery note
        </p>
        <h3 className="mt-4 text-2xl font-semibold text-white">
          We could not shape the routed preview.
        </h3>
        <p className="mt-3 text-sm leading-7 text-rose-100/80">
          {errorMessage ?? "Try a different brief and we will keep the result shell readable."}
        </p>
      </section>
    );
  }

  if (status === "success" && result) {
    return (
      <section
        aria-live="polite"
        className="space-y-5 rounded-[2rem] border border-white/12 bg-black/35 p-5 shadow-[0_20px_80px_rgba(8,15,30,0.45)] backdrop-blur md:p-6"
      >
        <ResultSummary demoPackage={result} />
        <DemoPreview demoPackage={result} />
        <SourceProvenance demoPackage={result} />

        <article className="rounded-[1.8rem] border border-white/10 bg-white/[0.045] p-5">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-white/45">
            Architecture note
          </p>
          <p className="mt-3 text-sm leading-7 text-zinc-200">
            {result.summary.architectureNote}
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {result.files.map((file) => (
              <div
                key={file.path}
                className="rounded-[1.15rem] border border-white/8 bg-black/25 p-4"
              >
                <p className="font-medium text-white">{file.path}</p>
                <p className="mt-2 text-sm leading-6 text-zinc-300">
                  {file.description}
                </p>
              </div>
            ))}
          </div>
        </article>
      </section>
    );
  }

  return (
    <section
      aria-live="polite"
      className="rounded-[2rem] border border-white/10 bg-black/35 p-6 shadow-[0_20px_80px_rgba(8,15,30,0.45)] backdrop-blur"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.24em] text-white/45">
            Result area
          </p>
          <h3 className="mt-4 max-w-2xl text-3xl font-semibold tracking-tight text-white">
            A clean preview shell is ready to receive the founder brief.
          </h3>
        </div>
          <div
            className="h-24 w-24 rounded-[1.75rem] border border-white/10 bg-cover bg-center opacity-90 contrast-125"
            style={{
              backgroundImage:
                "url(https://picsum.photos/seed/jackbox-brief/320/320)",
          }}
        />
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-[1.1fr_0.9fr]">
        <article className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-white/45">
            What lands in this panel
          </p>
          <ul className="mt-4 space-y-3">
            {FALLBACK_ARTIFACTS.map((artifact) => (
              <li
                key={artifact}
                className="rounded-[1.2rem] border border-white/8 bg-black/30 px-4 py-3 text-sm leading-6 text-zinc-200"
              >
                {artifact}
              </li>
            ))}
          </ul>
        </article>
        <article className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-white/45">
            Outcome
          </p>
          <p className="mt-4 text-sm leading-7 text-zinc-200">
            The panel now previews the same routing, crawl target, and credit estimate
            shape that the server generation route will use in the next slice.
          </p>
        </article>
      </div>
    </section>
  );
}
