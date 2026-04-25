"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { z } from "zod";
import { GenerationStatus } from "@/components/generation-status";
import {
  ResultShell,
  type GenerationStatusType,
  type StubGenerationResult,
} from "@/components/result-shell";
import {
  ProspectInputSchema,
  type ProspectInput,
} from "@/lib/validation/prospect";

type FieldErrors = Partial<Record<keyof ProspectInput, string>>;

const INITIAL_VALUES: ProspectInput = {
  companyUrl: "",
  painPoint: "",
};

const STUB_DELAY_MS = 900;

function getFieldErrors(error: z.ZodError<ProspectInput>): FieldErrors {
  const flattened = error.flatten().fieldErrors;

  return {
    companyUrl: flattened.companyUrl?.[0],
    painPoint: flattened.painPoint?.[0],
  };
}

function humanizeHost(companyUrl: string) {
  try {
    const host = new URL(companyUrl).hostname.replace(/^www\./, "");
    const [name] = host.split(".");
    return name.replace(/[-_]/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
  } catch {
    return "This prospect";
  }
}

function buildStubResult(input: ProspectInput): StubGenerationResult {
  const companyName = humanizeHost(input.companyUrl);

  return {
    companyName,
    companyUrl: input.companyUrl,
    painPoint: input.painPoint,
    summary:
      "The intake is now converting a founder brief into a structured handoff. The next slice will replace this stub with real template routing, bounded crawl targets, and a credit estimate.",
    nextMove:
      "Task 4 will turn this brief into a deterministic template choice and a plain-English explanation for why it fits.",
    outputArtifacts: [
      `${companyName} brief captured with URL and buyer pain in one place.`,
      "Result shell prepared for template rationale, provenance, and export metadata.",
      "Page-level experience now has a visible landing flow instead of a placeholder shell.",
    ],
  };
}

export function ProspectForm() {
  const companyUrlId = useId();
  const painPointId = useId();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [values, setValues] = useState(INITIAL_VALUES);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [status, setStatus] = useState<GenerationStatusType>("idle");
  const [result, setResult] = useState<StubGenerationResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const headerTone = useMemo(() => {
    if (status === "loading") {
      return "Working";
    }

    if (status === "success") {
      return "Validated";
    }

    if (status === "error") {
      return "Fallback";
    }

    return "Ready";
  }, [status]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  function updateField(field: keyof ProspectInput, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({
      ...current,
      [field]: undefined,
    }));
  }

  function clearPendingSubmission() {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nativeEvent = event.nativeEvent as SubmitEvent;
    const submitter = nativeEvent.submitter;
    const submissionIntent =
      submitter instanceof HTMLButtonElement && submitter.value === "error"
        ? "error"
        : "success";

    const parsed = ProspectInputSchema.safeParse(values);
    if (!parsed.success) {
      setErrors(getFieldErrors(parsed.error));
      return;
    }

    clearPendingSubmission();
    setErrors({});
    setErrorMessage(null);
    setResult(null);
    setStatus("loading");

    timeoutRef.current = setTimeout(() => {
      if (submissionIntent === "error") {
        setStatus("error");
        setErrorMessage(
          "The stub intentionally paused here so we can verify the fallback copy before the real orchestration route exists.",
        );
        return;
      }

      setResult(buildStubResult(parsed.data));
      setStatus("success");
    }, STUB_DELAY_MS);
  }

  return (
    <div
      id="intake"
      className="grid gap-6 xl:grid-cols-[0.94fr_1.06fr]"
      data-status={status}
    >
      <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-6 shadow-[0_20px_90px_rgba(10,20,40,0.35)] backdrop-blur md:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.22em] text-white/55">
              {headerTone}
            </p>
            <h2 className="mt-4 max-w-xl text-3xl font-semibold tracking-tight text-white">
              Shape one focused prospect brief instead of a generic demo pitch.
            </h2>
          </div>
          <div
            className="hidden h-16 w-28 rounded-full border border-white/10 bg-cover bg-center grayscale md:block"
            style={{
              backgroundImage:
                "url(https://picsum.photos/seed/jackbox-pill/360/160)",
            }}
          />
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit} noValidate>
          <div className="space-y-3">
            <label
              className="text-sm font-medium tracking-[0.08em] text-zinc-200"
              htmlFor={companyUrlId}
            >
              Company URL
            </label>
            <input
              id={companyUrlId}
              name="companyUrl"
              type="url"
              value={values.companyUrl}
              onChange={(event) => updateField("companyUrl", event.target.value)}
              placeholder="https://acme.com"
              className="w-full rounded-[1.3rem] border border-white/10 bg-black/35 px-5 py-4 text-base text-white outline-none transition focus:border-sky-300/60 focus:bg-black/45"
              aria-invalid={errors.companyUrl ? "true" : "false"}
              aria-describedby={errors.companyUrl ? `${companyUrlId}-error` : undefined}
            />
            {errors.companyUrl ? (
              <p id={`${companyUrlId}-error`} className="text-sm leading-6 text-rose-200">
                {errors.companyUrl}
              </p>
            ) : null}
          </div>

          <div className="space-y-3">
            <label
              className="text-sm font-medium tracking-[0.08em] text-zinc-200"
              htmlFor={painPointId}
            >
              Buyer pain point
            </label>
            <textarea
              id={painPointId}
              name="painPoint"
              value={values.painPoint}
              onChange={(event) => updateField("painPoint", event.target.value)}
              placeholder="Support teams cannot answer product questions from the latest docs during onboarding."
              rows={5}
              className="w-full rounded-[1.3rem] border border-white/10 bg-black/35 px-5 py-4 text-base leading-7 text-white outline-none transition focus:border-sky-300/60 focus:bg-black/45"
              aria-invalid={errors.painPoint ? "true" : "false"}
              aria-describedby={errors.painPoint ? `${painPointId}-error` : undefined}
            />
            {errors.painPoint ? (
              <p id={`${painPointId}-error`} className="text-sm leading-6 text-rose-200">
                {errors.painPoint}
              </p>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              value="success"
              disabled={status === "loading"}
              className="inline-flex min-h-13 items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-zinc-950 transition-transform duration-500 hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-70"
            >
              Generate stub preview
            </button>
            <button
              type="submit"
              value="error"
              disabled={status === "loading"}
              className="inline-flex min-h-13 items-center justify-center rounded-full border border-white/12 bg-white/6 px-6 py-3 text-sm font-semibold text-white transition hover:border-white/30 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-70"
            >
              Preview fallback state
            </button>
          </div>
        </form>
      </div>

      <div className="space-y-6">
        <GenerationStatus status={status} />
        <ResultShell status={status} result={result} errorMessage={errorMessage} />
      </div>
    </div>
  );
}
