"use client";

import { useId, useState } from "react";
import { z } from "zod";
import { ResultShell, type GenerationStatusType } from "@/components/result-shell";
import {
  DemoPackageSchema,
  type DemoPackage,
} from "@/lib/generation/demo-package";
import {
  ProspectInputSchema,
  type ProspectInput,
} from "@/lib/validation/prospect";

type FieldErrors = Partial<Record<keyof ProspectInput, string>>;

interface ProspectFormProps {
  onResult?: (result: DemoPackage) => void;
}

const INITIAL_VALUES: ProspectInput = {
  companyUrl: "",
  painPoint: "",
};

const CLIENT_GENERATION_TIMEOUT_MS = 60_000;

function getFieldErrors(error: z.ZodError<ProspectInput>): FieldErrors {
  const flattened = error.flatten().fieldErrors;

  return {
    companyUrl: flattened.companyUrl?.[0],
    painPoint: flattened.painPoint?.[0],
  };
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

  return "The preview could not be generated.";
}

export function ProspectForm({ onResult }: ProspectFormProps = {}) {
  const companyUrlId = useId();
  const painPointId = useId();

  const [values, setValues] = useState(INITIAL_VALUES);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [status, setStatus] = useState<GenerationStatusType>("idle");
  const [result, setResult] = useState<DemoPackage | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function updateField(field: keyof ProspectInput, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({
      ...current,
      [field]: undefined,
    }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const parsed = ProspectInputSchema.safeParse(values);
    if (!parsed.success) {
      setErrors(getFieldErrors(parsed.error));
      return;
    }

    setErrors({});
    setErrorMessage(null);
    setResult(null);
    setStatus("loading");
    console.info("[jackbox:client:generate] start", {
      host: new URL(parsed.data.companyUrl).hostname,
      painLength: parsed.data.painPoint.length,
    });

    try {
      const signal =
        typeof AbortSignal !== "undefined" && "timeout" in AbortSignal
          ? AbortSignal.timeout(CLIENT_GENERATION_TIMEOUT_MS)
          : undefined;
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify(parsed.data),
        signal,
      });
      const payload: unknown = await response.json();

      if (!response.ok) {
        setStatus("error");
        setErrorMessage(getRouteErrorMessage(payload));
        console.error("[jackbox:client:generate] failed", {
          status: response.status,
          message: getRouteErrorMessage(payload),
        });
        return;
      }

      const demoPackage = DemoPackageSchema.parse(payload);
      setResult(demoPackage);
      setStatus("success");
      onResult?.(demoPackage);
      console.info("[jackbox:client:generate] complete", {
        templateId: demoPackage.templateId,
        dataSource: demoPackage.preview.dataSource,
        sources: demoPackage.provenance.length,
      });
    } catch (error) {
      setStatus("error");
      setErrorMessage(
        error instanceof DOMException && error.name === "TimeoutError"
          ? "The generation request took too long. Try again, or use fixture mode while testing locally."
          : error instanceof Error
            ? error.message
            : "The preview could not be reached.",
      );
      console.error("[jackbox:client:generate] exception", error);
    }
  }

  if (status === "success" && result && !onResult) {
    return (
      <ResultShell
        status={status}
        result={result}
        onReset={() => {
          setResult(null);
          setStatus("idle");
        }}
      />
    );
  }

  return (
    <section
      id="intake"
      className="rounded-2xl border border-[#171a1c]/10 bg-white p-4 shadow-[0_18px_45px_rgba(24,31,36,0.08)] sm:p-5"
      data-status={status}
    >
      <form className="space-y-4" onSubmit={handleSubmit} noValidate>
        <div>
          <label
            className="text-sm font-semibold text-[#202326]/70"
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
            placeholder="https://linear.app/docs"
            className="mt-2 min-h-12 w-full rounded-xl border border-[#171a1c]/12 bg-[#fafaf8] px-4 text-base text-[#171a1c] outline-none transition-[border-color,background-color,box-shadow] duration-200 placeholder:text-[#202326]/30 focus:border-[#315bff]/60 focus:bg-white focus:shadow-[0_0_0_4px_rgba(49,91,255,0.10)]"
            aria-invalid={errors.companyUrl ? "true" : "false"}
            aria-describedby={errors.companyUrl ? `${companyUrlId}-error` : undefined}
          />
          {errors.companyUrl ? (
            <p id={`${companyUrlId}-error`} className="mt-2 text-sm text-[#b64418]">
              {errors.companyUrl}
            </p>
          ) : null}
        </div>

        <div>
          <label
            className="text-sm font-semibold text-[#202326]/70"
            htmlFor={painPointId}
          >
            Buyer pain
          </label>
          <textarea
            id={painPointId}
            name="painPoint"
            value={values.painPoint}
            onChange={(event) => updateField("painPoint", event.target.value)}
            placeholder="Support needs fast answers from public docs."
            rows={4}
            className="mt-2 w-full resize-none rounded-xl border border-[#171a1c]/12 bg-[#fafaf8] px-4 py-3 text-base leading-7 text-[#171a1c] outline-none transition-[border-color,background-color,box-shadow] duration-200 placeholder:text-[#202326]/30 focus:border-[#315bff]/60 focus:bg-white focus:shadow-[0_0_0_4px_rgba(49,91,255,0.10)]"
            aria-invalid={errors.painPoint ? "true" : "false"}
            aria-describedby={errors.painPoint ? `${painPointId}-error` : undefined}
          />
          {errors.painPoint ? (
            <p id={`${painPointId}-error`} className="mt-2 text-sm text-[#b64418]">
              {errors.painPoint}
            </p>
          ) : null}
        </div>

        {status === "error" ? (
          <p className="rounded-2xl bg-[#fff0ea] px-4 py-3 text-sm leading-6 text-[#7b2d15]">
            {errorMessage}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={status === "loading"}
          className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-[#171a1c] px-5 text-base font-semibold text-white transition-[transform,background-color,opacity] duration-200 hover:bg-[#315bff] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
        >
          <span>{status === "loading" ? "Building demo room" : "Generate demo room"}</span>
        </button>
      </form>
    </section>
  );
}
