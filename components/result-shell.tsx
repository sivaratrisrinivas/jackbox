import { DemoRoom } from "@/components/demo-room";
import { ResultSummary } from "@/components/result-summary";
import type { DemoPackage } from "@/lib/generation/demo-package";

export type GenerationStatusType = "idle" | "loading" | "success" | "error";

export interface ResultShellProps {
  status: GenerationStatusType;
  result?: DemoPackage | null;
  errorMessage?: string | null;
  onReset?: () => void;
}

export function ResultShell({ status, result, errorMessage }: ResultShellProps) {
  if (status === "loading") {
    return (
      <section
        aria-live="polite"
        className="rounded-2xl border border-[#171a1c]/10 bg-white p-6 shadow-[0_18px_45px_rgba(24,31,36,0.08)]"
      >
        <p className="text-sm font-semibold text-[#315bff]">Building demo room</p>
        <p className="mt-3 text-base leading-7 text-[#202326]/62">
          Crawling public surfaces, ranking useful evidence, and preparing a source-backed POC.
        </p>
      </section>
    );
  }

  if (status === "error") {
    return (
      <section
        aria-live="polite"
        className="rounded-2xl border border-[#b64418]/15 bg-[#fff0ea] p-6"
      >
        <p className="text-sm font-semibold text-[#b64418]">Preview failed</p>
        <p className="mt-3 text-base leading-7 text-[#3b2520]">
          {errorMessage ?? "Try a public company URL and a clearer buyer pain point."}
        </p>
      </section>
    );
  }

  if (status === "success" && result) {
    return (
      <section
        aria-live="polite"
        className="w-full"
      >
        <ResultSummary demoPackage={result} />
        <DemoRoom demoPackage={result} />
      </section>
    );
  }

  return null;
}
