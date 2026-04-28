"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ProspectForm } from "@/components/prospect-form";
import { ResultShell } from "@/components/result-shell";
import type { DemoPackage } from "@/lib/generation/demo-package";

gsap.registerPlugin(useGSAP);

export function HomeExperience() {
  const rootRef = useRef<HTMLElement | null>(null);
  const [result, setResult] = useState<DemoPackage | null>(null);

  useGSAP(
    () => {
      gsap.fromTo(
        [".brand-mark", ".workbench-copy", ".workbench-panel"],
        { y: 28, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.9,
          stagger: 0.08,
          ease: "power3.out",
        },
      );
    },
    { scope: rootRef },
  );

  if (result) {
    return (
      <main
        ref={rootRef}
        className="min-h-screen w-full max-w-full overflow-x-hidden bg-[#f7f7f4] px-5 py-5 text-[#171a1c] sm:px-8"
      >
        <div className="relative mx-auto flex min-h-[calc(100vh-2.5rem)] max-w-6xl flex-col">
          <nav className="brand-mark flex items-center justify-between py-3">
            <Link
              href="/"
              className="text-sm font-semibold text-[#171a1c]"
              aria-label="Jackbox home"
            >
              Jackbox
            </Link>
            <button
              type="button"
              onClick={() => setResult(null)}
              className="min-h-10 rounded-full px-3 text-sm font-semibold text-[#202326]/58 transition-colors duration-200 hover:text-[#202326]"
            >
              New input
            </button>
          </nav>

          <section className="workbench-panel flex flex-1 items-start justify-center py-6 lg:py-10">
            <div className="w-full">
              <ResultShell status="success" result={result} />
            </div>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main
      ref={rootRef}
      className="min-h-screen w-full max-w-full overflow-x-hidden bg-[#f7f7f4] px-5 py-5 text-[#171a1c] sm:px-8"
    >
      <div className="relative mx-auto flex min-h-[calc(100vh-2.5rem)] max-w-5xl flex-col">
        <nav className="brand-mark flex items-center justify-between py-3">
          <Link
            href="/"
            className="text-sm font-semibold text-[#171a1c]"
            aria-label="Jackbox home"
          >
            Jackbox
          </Link>
        </nav>

        <section className="flex flex-1 items-center justify-center py-8 lg:py-12">
          <div className="workbench-panel grid w-full items-start gap-10 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="workbench-copy pt-2">
              <h1 className="text-4xl font-semibold leading-tight text-[#171a1c] text-balance sm:text-5xl">
                Build a prospect demo room.
              </h1>
              <p className="mt-5 max-w-md text-base leading-8 text-[#202326]/62 text-pretty">
                Enter a public URL and the buyer pain. Jackbox returns a source-backed
                output screen for the next sales call.
              </p>
            </div>
            <ProspectForm onResult={setResult} />
          </div>
        </section>
      </div>
    </main>
  );
}
