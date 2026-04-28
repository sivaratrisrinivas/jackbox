import type { DemoPackage } from "@/lib/generation/demo-package";

export interface SourceProvenanceProps {
  demoPackage: DemoPackage;
}

export function SourceProvenance({ demoPackage }: SourceProvenanceProps) {
  return (
    <article className="rounded-[1.8rem] border border-white/10 bg-white/[0.045] p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-white/45">
            Provenance
          </p>
          <h4 className="mt-3 text-2xl font-semibold tracking-tight text-white">
            Source links stay separate from generated copy.
          </h4>
        </div>
        <span className="rounded-full border border-white/10 bg-black/25 px-3 py-1.5 text-sm text-zinc-200">
          {demoPackage.provenance.length} sources
        </span>
      </div>

      <div className="mt-5 space-y-3">
        {demoPackage.provenance.map((source, index) => (
          <a
            key={`${source.url}-${index}`}
            href={source.url}
            className="group block rounded-[1.25rem] border border-white/8 bg-black/25 p-4 transition duration-500 hover:border-sky-200/35 hover:bg-sky-200/8"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="font-medium text-white">{source.label}</p>
              <p className="break-all text-xs text-sky-100/70">{source.url}</p>
            </div>
            {source.excerpt ? (
              <p className="mt-3 text-sm leading-7 text-zinc-300">{source.excerpt}</p>
            ) : null}
          </a>
        ))}
      </div>
    </article>
  );
}
