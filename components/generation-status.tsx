import type { ReactNode } from "react";
import type { GenerationStatusType } from "@/components/result-shell";

const STATUS_COPY: Record<
  GenerationStatusType,
  {
    eyebrow: string;
    title: string;
    description: string;
    accent: string;
    marker: ReactNode;
  }
> = {
  idle: {
    eyebrow: "Founder Intake",
    title: "Waiting for a prospect brief",
    description:
      "Drop in a public company URL and the buyer pain you want the demo to answer. The preview will choose a template, crawl scope, and credit estimate.",
    accent: "from-white/14 via-white/6 to-transparent",
    marker: <span className="h-2.5 w-2.5 rounded-full bg-white/80" />,
  },
  loading: {
    eyebrow: "Generation In Progress",
    title: "Routing the founder brief",
    description:
      "The server route is validating the brief, loading fixture-backed prospect data, and shaping the package manifest.",
    accent: "from-sky-400/30 via-sky-300/10 to-transparent",
    marker: (
      <span className="inline-flex h-2.5 w-2.5 animate-pulse rounded-full bg-sky-300" />
    ),
  },
  success: {
    eyebrow: "Package Manifest",
    title: "Demo package ready",
    description:
      "The intake is validated and the result area now reflects a normalized DemoPackage response.",
    accent: "from-emerald-400/30 via-emerald-300/10 to-transparent",
    marker: <span className="h-2.5 w-2.5 rounded-full bg-emerald-300" />,
  },
  error: {
    eyebrow: "Fallback State",
    title: "The route returned a structured error",
    description:
      "This state keeps request failures readable while the orchestration route stays strict about invalid input.",
    accent: "from-rose-400/30 via-rose-300/10 to-transparent",
    marker: <span className="h-2.5 w-2.5 rounded-full bg-rose-300" />,
  },
};

export interface GenerationStatusProps {
  status: GenerationStatusType;
}

export function GenerationStatus({ status }: GenerationStatusProps) {
  const copy = STATUS_COPY[status];

  return (
    <div className={`rounded-[1.75rem] border border-white/10 bg-gradient-to-br ${copy.accent} p-6`}>
      <div className="flex items-center gap-3 text-[0.72rem] font-medium uppercase tracking-[0.24em] text-white/55">
        {copy.marker}
        <span>{copy.eyebrow}</span>
      </div>
      <div className="mt-6 space-y-3">
        <h3 className="text-2xl font-semibold tracking-tight text-white">{copy.title}</h3>
        <p className="max-w-xl text-sm leading-7 text-zinc-300">{copy.description}</p>
      </div>
    </div>
  );
}
