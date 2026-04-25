export type GenerationStatusType = "idle" | "loading" | "success" | "error";

export interface StubGenerationResult {
  companyName: string;
  companyUrl: string;
  painPoint: string;
  summary: string;
  nextMove: string;
  outputArtifacts: string[];
}

export interface ResultShellProps {
  status: GenerationStatusType;
  result?: StubGenerationResult | null;
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
            "Holding space for template rationale and crawl planning.",
            "Staging the result area for success or recovery copy.",
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
          We could not shape the stubbed preview.
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
        className="rounded-[2rem] border border-white/12 bg-black/35 p-6 shadow-[0_20px_80px_rgba(8,15,30,0.45)] backdrop-blur"
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.24em] text-emerald-200/80">
              Stubbed handoff
            </p>
            <h3 className="mt-4 max-w-2xl text-3xl font-semibold tracking-tight text-white">
              {result.companyName} is ready for a tailored Firecrawl walkthrough.
            </h3>
          </div>
          <div className="rounded-full border border-white/12 bg-white/6 px-4 py-2 text-sm text-zinc-200">
            Validated input
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <article className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-white/45">
              Prospect URL
            </p>
            <p className="mt-3 text-sm leading-7 text-zinc-200">{result.companyUrl}</p>
          </article>
          <article className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-white/45">
              Buyer pain
            </p>
            <p className="mt-3 text-sm leading-7 text-zinc-200">{result.painPoint}</p>
          </article>
        </div>

        <article className="mt-4 rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-white/45">
            Summary
          </p>
          <p className="mt-3 text-sm leading-7 text-zinc-200">{result.summary}</p>
        </article>

        <div className="mt-8 grid gap-4 md:grid-cols-[1.1fr_0.9fr]">
          <article className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-white/45">
              Prepared output
            </p>
            <ul className="mt-4 space-y-3">
              {result.outputArtifacts.map((artifact) => (
                <li
                  key={artifact}
                  className="rounded-[1.2rem] border border-white/8 bg-black/30 px-4 py-3 text-sm leading-6 text-zinc-200"
                >
                  {artifact}
                </li>
              ))}
            </ul>
          </article>
          <article className="rounded-[1.5rem] border border-emerald-300/15 bg-emerald-400/10 p-5">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-emerald-100/70">
              Next move
            </p>
            <p className="mt-3 text-sm leading-7 text-zinc-100">{result.nextMove}</p>
          </article>
        </div>
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
            For Task 3, the panel is intentionally stubbed. The point is to make the
            founder flow readable before the router, crawl targets, and package manifest
            are actually generated.
          </p>
        </article>
      </div>
    </section>
  );
}
