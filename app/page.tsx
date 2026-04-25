const milestones = [
  "Foundation shell with App Router, TypeScript, Tailwind, and lint/typecheck scripts.",
  "Shared contracts for prospect input, routed plans, and the DemoPackage manifest.",
  "Founder intake form, fixture-backed generation flow, and preview rendering.",
];

export default function Home() {
  return (
    <main className="min-h-screen px-6 py-10 text-zinc-50 sm:px-10 lg:px-16">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-6xl flex-col justify-between gap-16">
        <section className="grid gap-10 rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-2xl shadow-sky-950/20 backdrop-blur md:grid-cols-[1.2fr_0.8fr] md:p-12">
          <div className="space-y-6">
            <div className="inline-flex items-center rounded-full border border-sky-400/30 bg-sky-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-sky-200">
              Jackbox V1
            </div>
            <div className="space-y-4">
              <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
                Prospect-specific Firecrawl demos, starting with a clean foundation.
              </h1>
              <p className="max-w-2xl text-base leading-7 text-zinc-300 sm:text-lg">
                This placeholder shell marks the first implementation slice for Jackbox.
                The app is now shaped for an App Router workflow that will grow into
                routing, fixture-backed generation, previews, and export.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <span className="rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm text-zinc-200">
                Next.js App Router
              </span>
              <span className="rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm text-zinc-200">
                TypeScript strict mode
              </span>
              <span className="rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm text-zinc-200">
                Tailwind CSS
              </span>
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-white/10 bg-zinc-950/60 p-6">
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-zinc-400">
              Next implementation sequence
            </p>
            <ol className="mt-5 space-y-4">
              {milestones.map((item, index) => (
                <li key={item} className="flex gap-4 rounded-2xl border border-white/8 bg-white/5 p-4">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sky-400/15 text-sm font-semibold text-sky-200">
                    {index + 1}
                  </span>
                  <p className="text-sm leading-6 text-zinc-300">{item}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {[
            ["Routing", "Choose one curated template with a plain-English rationale."],
            ["Fixtures", "Keep local demos deterministic before live crawling is wired."],
            ["Preview", "Render a founder-safe result package with provenance and estimates."],
          ].map(([title, copy]) => (
            <article
              key={title}
              className="rounded-[1.5rem] border border-white/10 bg-black/20 p-6 backdrop-blur"
            >
              <h2 className="text-lg font-semibold text-zinc-100">{title}</h2>
              <p className="mt-3 text-sm leading-6 text-zinc-400">{copy}</p>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
