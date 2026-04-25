"use client";

import { useId, useMemo, useState } from "react";
import { z } from "zod";
import { GenerationStatus } from "@/components/generation-status";
import {
  ResultShell,
  type GenerationStatusType,
  type StubGenerationResult,
} from "@/components/result-shell";
import {
  DemoPackageSchema,
  type DemoPackage,
} from "@/lib/generation/demo-package";
import {
  ProspectInputSchema,
  type ProspectInput,
} from "@/lib/validation/prospect";

type FieldErrors = Partial<Record<keyof ProspectInput, string>>;

const INITIAL_VALUES: ProspectInput = {
  companyUrl: "",
  painPoint: "",
};

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

function getRouteErrorMessage(payload: unknown) {
  if (
    payload &&
    typeof payload === "object" &&
    "message" in payload &&
    typeof payload.message === "string"
  ) {
    return payload.message;
  }

  return "The generation route returned an error the preview could not read.";
}

function demoPackageToResult(demoPackage: DemoPackage): StubGenerationResult {
  const companyName =
    typeof demoPackage.preview.companyName === "string"
      ? demoPackage.preview.companyName
      : humanizeHost(demoPackage.input.companyUrl);

  return {
    companyName,
    companyUrl: demoPackage.input.companyUrl,
    painPoint: demoPackage.input.painPoint,
    routedPlan: demoPackage.routedPlan,
    creditEstimate: demoPackage.creditEstimate,
    summary: demoPackage.summary.whyThisMatters,
    nextMove: demoPackage.summary.architectureNote,
    outputArtifacts: [
      `${companyName} generated package ${demoPackage.id}.`,
      `${demoPackage.provenance.length} fixture-backed source pages preserved as provenance.`,
      `${demoPackage.files.length} package files prepared for the export slice.`,
    ],
  };
}

export function ProspectForm() {
  const companyUrlId = useId();
  const painPointId = useId();

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

  function updateField(field: keyof ProspectInput, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({
      ...current,
      [field]: undefined,
    }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
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

    setErrors({});
    setErrorMessage(null);
    setResult(null);
    setStatus("loading");

    const requestPayload =
      submissionIntent === "error"
        ? {
            companyUrl: "not-a-url",
            painPoint: "short",
          }
        : parsed.data;

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify(requestPayload),
      });
      const payload: unknown = await response.json();

      if (!response.ok) {
        setStatus("error");
        setErrorMessage(getRouteErrorMessage(payload));
        return;
      }

      const demoPackage = DemoPackageSchema.parse(payload);
      setResult(demoPackageToResult(demoPackage));
      setStatus("success");
    } catch (error) {
      setStatus("error");
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "The generation route could not be reached.",
      );
    }
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
              Generate routed preview
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
