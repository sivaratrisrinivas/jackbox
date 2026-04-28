"use client";

import { useMemo, useState } from "react";
import type { DemoPackage } from "@/lib/generation/demo-package";
import { getDemoStory } from "@/lib/generation/demo-story";
import { getSolutionEngineerBrief } from "@/lib/generation/solution-engineer-brief";

interface DemoRoomProps {
  demoPackage: DemoPackage;
}

function getCompanyName(demoPackage: DemoPackage) {
  if (typeof demoPackage.preview.companyName === "string") {
    return demoPackage.preview.companyName;
  }

  const host = new URL(demoPackage.input.companyUrl).hostname.replace(/^www\./, "");
  const [name] = host.split(".");
  return name.replace(/[-_]/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function buildRoomText(demoPackage: DemoPackage) {
  const companyName = getCompanyName(demoPackage);
  const story = getDemoStory(demoPackage.preview.story);
  const brief = getSolutionEngineerBrief(demoPackage.preview.solutionBrief);
  const workflow = brief?.inferredWorkflows[0];
  const demo = brief?.recommendedDemo;
  const evidence = brief?.publicSurfaces.slice(0, 3) ?? demoPackage.provenance.slice(0, 3);
  const evidenceLines = evidence.map((item, index) => {
    const label = item.label;
    const text = "signal" in item ? item.signal : item.excerpt ?? item.url;
    return `${index + 1}. ${label}: ${text}`;
  });

  return [
    `${companyName} Firecrawl demo room`,
    "",
    `Buyer pain: ${demoPackage.input.painPoint}`,
    `Recommended POC: ${demo?.title ?? demoPackage.summary.headline}`,
    `Workflow: ${workflow?.workflowName ?? demoPackage.summary.headline}`,
    "",
    "60-second opener:",
    story?.talkTrack ??
      `${companyName} can use Firecrawl to turn public pages into a source-backed workflow for this buyer pain.`,
    "",
    "Proof to show:",
    ...evidenceLines,
    "",
    "Next step:",
    demo?.pocNextStep ?? story?.nextStep ?? "Pick the two highest-value public pages and run a live source-backed POC.",
  ].join("\n");
}

export function DemoRoom({ demoPackage }: DemoRoomProps) {
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">("idle");
  const [downloadState, setDownloadState] = useState<"idle" | "loading" | "failed">("idle");
  const companyName = getCompanyName(demoPackage);
  const brief = getSolutionEngineerBrief(demoPackage.preview.solutionBrief);
  const story = getDemoStory(demoPackage.preview.story);
  const workflow = brief?.inferredWorkflows[0];
  const demo = brief?.recommendedDemo;
  const roomText = useMemo(() => buildRoomText(demoPackage), [demoPackage]);
  const evidence = brief?.publicSurfaces.slice(0, 3) ?? [];

  async function copyRoom() {
    try {
      await navigator.clipboard.writeText(roomText);
      setCopyState("copied");
      setTimeout(() => setCopyState("idle"), 1800);
    } catch {
      setCopyState("failed");
    }
  }

  async function downloadPackage() {
    setDownloadState("loading");

    try {
      const response = await fetch("/api/export", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify(demoPackage),
      });

      if (!response.ok) {
        throw new Error("Export failed.");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${demoPackage.id}.zip`;
      link.click();
      URL.revokeObjectURL(url);
      setDownloadState("idle");
    } catch {
      setDownloadState("failed");
    }
  }

  return (
    <section className="demo-room mt-8 rounded-2xl border border-[#171a1c]/10 bg-[#171a1c] p-5 text-[#f7f5ef] sm:p-6">
      <div className="grid gap-8 lg:grid-cols-[0.82fr_1.18fr]">
        <div>
          <h3 className="max-w-md text-2xl font-semibold leading-tight text-balance">
            Run the {companyName} POC.
          </h3>
          <div className="mt-6 grid gap-3">
            <button
              type="button"
              onClick={copyRoom}
              className="min-h-11 rounded-xl bg-[#f7f5ef] px-5 text-sm font-semibold text-[#111315] transition-transform duration-200 active:scale-[0.98]"
            >
              {copyState === "copied"
                ? "Copied call script"
                : copyState === "failed"
                  ? "Copy failed"
                  : "Copy call script"}
            </button>
            <button
              type="button"
              onClick={downloadPackage}
              disabled={downloadState === "loading"}
              className="min-h-11 rounded-xl border border-white/14 px-5 text-sm font-semibold text-white/82 transition-[transform,background-color,border-color] duration-200 hover:border-white/28 hover:bg-white/8 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {downloadState === "loading"
                ? "Preparing package"
                : downloadState === "failed"
                  ? "Download failed"
                  : "Download demo package"}
            </button>
          </div>
        </div>

        <div>
          <div className="grid gap-6">
            <div>
              <p className="text-sm font-semibold text-white/45">Opener</p>
              <p className="mt-3 text-base leading-8 text-white/78 text-pretty">
                {story?.talkTrack ??
                  `${companyName} can turn public pages into a source-backed Firecrawl POC for this buyer pain.`}
              </p>
            </div>

            <dl className="grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-sm font-semibold text-white/45">
                  Workflow
                </dt>
                <dd className="mt-2 text-sm leading-6 text-white/76">
                  {workflow?.workflowName ?? demoPackage.summary.headline}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-semibold text-white/45">
                  Mini-POC
                </dt>
                <dd className="mt-2 text-sm leading-6 text-white/76">
                  {demo?.title ?? demoPackage.summary.headline}
                </dd>
              </div>
            </dl>

            {demo ? (
              <div>
                <p className="text-sm font-semibold text-white/45">Call path</p>
                <ol className="mt-3 grid gap-2">
                  {demo.demoScript.slice(0, 3).map((step, index) => (
                    <li
                      key={`${step}-${index}`}
                      className="grid grid-cols-[1.75rem_1fr] gap-3 text-sm leading-7 text-white/76"
                    >
                      <span className="tabular-nums text-white/34">{index + 1}</span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            ) : null}

            {evidence.length > 0 ? (
              <div>
                <p className="text-sm font-semibold text-white/45">Source proof</p>
                <div className="mt-3 grid gap-2">
                  {evidence.map((item, index) => (
                    <a
                      key={`${item.url}-${index}`}
                      href={item.url}
                      className="rounded-xl bg-white/[0.055] p-3 text-sm leading-6 text-white/72 transition-[background-color,transform] duration-200 hover:bg-white/[0.085] active:scale-[0.98]"
                    >
                      <span className="font-semibold text-white/90">{item.label}</span>
                      <span className="ml-2 text-white/34">{item.type}</span>
                      <span className="mt-1 block">{item.signal}</span>
                    </a>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
