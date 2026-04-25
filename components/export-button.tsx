"use client";

import { useState } from "react";
import type { DemoPackage } from "@/lib/generation/demo-package";

interface ExportButtonProps {
  demoPackage: DemoPackage;
}

function getDownloadName(response: Response, demoPackage: DemoPackage) {
  const disposition = response.headers.get("content-disposition");
  const match = disposition?.match(/filename="([^"]+)"/);

  return match?.[1] ?? `jackbox-${demoPackage.templateId}.zip`;
}

export function ExportButton({ demoPackage }: ExportButtonProps) {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">(
    "idle",
  );

  async function handleExport() {
    setStatus("loading");

    try {
      const response = await fetch("/api/export", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify(demoPackage),
      });

      if (!response.ok) {
        throw new Error("The export route could not build this archive.");
      }

      const blob = await response.blob();
      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = downloadUrl;
      link.download = getDownloadName(response, demoPackage);
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(downloadUrl);
      setStatus("success");
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="rounded-[1.8rem] border border-emerald-200/15 bg-emerald-300/10 p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-emerald-100/70">
            Export package
          </p>
          <p className="mt-3 max-w-xl text-sm leading-7 text-zinc-100">
            Download the curated README, template files, and structured metadata that
            match this preview.
          </p>
        </div>
        <button
          type="button"
          onClick={handleExport}
          disabled={status === "loading"}
          className="inline-flex min-h-12 shrink-0 items-center justify-center rounded-full bg-white px-5 py-3 text-sm font-semibold text-zinc-950 transition-transform duration-500 hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {status === "loading" ? "Building ZIP" : "Download ZIP"}
        </button>
      </div>

      {status === "success" ? (
        <p className="mt-4 text-sm leading-6 text-emerald-50/80">
          ZIP export is ready.
        </p>
      ) : null}

      {status === "error" ? (
        <p className="mt-4 text-sm leading-6 text-rose-100">
          The export could not be prepared. Try generating the preview again.
        </p>
      ) : null}
    </div>
  );
}
