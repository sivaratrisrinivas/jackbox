"use client";

import { useMemo, useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(useGSAP);

  if (typeof window.matchMedia === "function") {
    gsap.registerPlugin(ScrollTrigger);
  }
}

export interface AccountResearchSignalView {
  label: string;
  sourceLabel: string;
  sourceUrl: string;
  evidence: string;
  insight: string;
}

export interface AccountResearchPreviewProps {
  executiveSummary: string;
  teamWhyItMatters: string;
  discoveryAngles: string[];
  signals: AccountResearchSignalView[];
}

function imageUrl(seed: string) {
  return `https://picsum.photos/seed/${encodeURIComponent(seed)}/960/1200`;
}

export function AccountResearchPreview({
  executiveSummary,
  teamWhyItMatters,
  discoveryAngles,
  signals,
}: AccountResearchPreviewProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const noteRef = useRef<HTMLParagraphElement | null>(null);
  const marqueeRef = useRef<HTMLDivElement | null>(null);
  const repeatedAngles = useMemo(
    () => [...discoveryAngles, ...discoveryAngles],
    [discoveryAngles],
  );
  const leadSignal = signals[0];

  useGSAP(
    () => {
      if (
        typeof window === "undefined" ||
        typeof window.matchMedia !== "function" ||
        !rootRef.current
      ) {
        return;
      }

      const marqueeTrack = marqueeRef.current;

      if (marqueeTrack) {
        gsap.to(marqueeTrack, {
          xPercent: -50,
          duration: 24,
          ease: "none",
          repeat: -1,
        });
      }

      gsap.fromTo(
        ".research-reveal",
        {
          y: 42,
          opacity: 0,
        },
        {
          y: 0,
          opacity: 1,
          duration: 0.9,
          stagger: 0.08,
          ease: "power3.out",
          scrollTrigger: {
            trigger: rootRef.current,
            start: "top 80%",
          },
        },
      );

      gsap.utils.toArray<HTMLElement>(".research-accordion-image").forEach((image) => {
        gsap.fromTo(
          image,
          {
            scale: 0.82,
            opacity: 0.38,
            filter: "grayscale(100%) brightness(0.78)",
          },
          {
            scale: 1,
            opacity: 0.96,
            filter: "grayscale(0%) brightness(1)",
            ease: "none",
            scrollTrigger: {
              trigger: image,
              start: "top bottom-=80",
              end: "bottom center",
              scrub: true,
            },
          },
        );
      });

      const noteWords = noteRef.current?.querySelectorAll<HTMLElement>(".research-word");

      if (noteWords?.length) {
        gsap.to(noteWords, {
          opacity: 1,
          stagger: 0.025,
          ease: "none",
          scrollTrigger: {
            trigger: noteRef.current,
            start: "top 84%",
            end: "bottom 56%",
            scrub: true,
          },
        });
      }
    },
    { scope: rootRef },
  );

  return (
    <section ref={rootRef} className="mt-6">
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-6 lg:grid-flow-dense">
        <article className="research-reveal relative overflow-hidden rounded-[1.35rem] border border-white/10 bg-white/[0.05] p-5 lg:col-span-4">
          <div
            className="absolute inset-0 opacity-70"
            style={{
              backgroundImage:
                "radial-gradient(circle at 12% 18%, rgba(56,189,248,0.18), transparent 24%), radial-gradient(circle at 78% 24%, rgba(244,114,182,0.12), transparent 26%), linear-gradient(135deg, rgba(255,255,255,0.04), transparent 58%)",
            }}
          />
          <div className="relative">
            <p className="text-sm font-medium tracking-[0.18em] text-white/45">
              Account brief
            </p>
            <h5 className="mt-4 max-w-5xl text-[clamp(2.1rem,4vw,3.25rem)] font-semibold leading-[1.02] tracking-tight text-white">
              Read the account
              <span
                className="mx-3 inline-block h-10 w-24 rounded-full border border-white/15 align-[-0.16em] grayscale"
                style={{
                  backgroundImage:
                    "url(https://picsum.photos/seed/jackbox-account-inline/640/240)",
                  backgroundPosition: "center",
                  backgroundSize: "cover",
                }}
              />
              before the call.
            </h5>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-zinc-200">
              {executiveSummary}
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {signals.map((signal) => (
                <a
                  key={signal.sourceUrl}
                  href={signal.sourceUrl}
                  className="rounded-full border border-white/10 bg-black/25 px-3 py-1.5 text-xs text-zinc-100 transition hover:border-white/25 hover:bg-white/8"
                >
                  {signal.sourceLabel}
                </a>
              ))}
            </div>
          </div>
        </article>

        <article className="research-reveal overflow-hidden rounded-[1.35rem] border border-white/10 bg-black/25 p-5 lg:col-span-2">
          <p className="text-sm font-medium tracking-[0.18em] text-white/45">
            Why your team cares
          </p>
          <p ref={noteRef} className="mt-4 text-sm leading-8 text-zinc-100">
            {teamWhyItMatters.split(" ").map((word, index) => (
              <span
                key={`${word}-${index}`}
                className="research-word inline-block pr-[0.3em] opacity-[0.18]"
              >
                {word}
              </span>
            ))}
          </p>
        </article>

        <article className="research-reveal overflow-hidden rounded-[1.35rem] border border-white/10 bg-black/25 p-5 lg:col-span-3">
          <p className="text-sm font-medium tracking-[0.18em] text-white/45">
            Signal panels
          </p>
          <div className="mt-4 flex flex-col gap-3 lg:min-h-[22rem] lg:flex-row">
            {signals.map((signal) => (
              <a
                key={signal.sourceUrl}
                href={signal.sourceUrl}
                className="group relative flex-1 overflow-hidden rounded-[1.2rem] border border-white/10 transition-[flex-grow] duration-700 ease-out hover:flex-[1.3]"
              >
                <div
                  className="research-accordion-image absolute inset-0 bg-cover bg-center transition-transform duration-700 ease-out group-hover:scale-105"
                  style={{
                    backgroundImage: `linear-gradient(180deg, rgba(4,7,18,0.08), rgba(4,7,18,0.86)), url(${imageUrl(signal.sourceLabel)})`,
                  }}
                />
                <div className="relative flex h-full min-h-44 flex-col justify-end p-4">
                  <p className="text-[0.7rem] font-medium uppercase tracking-[0.2em] text-white/55">
                    {signal.label}
                  </p>
                  <h6 className="mt-3 text-lg font-semibold tracking-tight text-white">
                    {signal.sourceLabel}
                  </h6>
                  <p className="mt-2 text-sm leading-6 text-zinc-200">{signal.evidence}</p>
                </div>
              </a>
            ))}
          </div>
        </article>

        <article className="research-reveal rounded-[1.35rem] border border-white/10 bg-white/[0.045] p-5 lg:col-span-3">
          <p className="text-sm font-medium tracking-[0.18em] text-white/45">
            Signal ledger
          </p>
          <div className="mt-4 space-y-3">
            {signals.map((signal) => (
              <div
                key={signal.sourceUrl}
                className="rounded-[1.1rem] border border-white/8 bg-black/25 p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-white">{signal.label}</p>
                  <a href={signal.sourceUrl} className="text-xs text-sky-100/75 hover:text-sky-50">
                    {signal.sourceLabel}
                  </a>
                </div>
                <p className="mt-3 text-sm leading-7 text-zinc-200">{signal.insight}</p>
              </div>
            ))}
          </div>
        </article>

        <article className="research-reveal rounded-[1.35rem] border border-white/10 bg-black/25 p-5 lg:col-span-2">
          <p className="text-sm font-medium tracking-[0.18em] text-white/45">
            Call opener
          </p>
          <p className="mt-4 text-sm leading-7 text-zinc-200">
            {leadSignal?.insight ??
              "Open with the highest-signal public page so the conversation starts grounded."}
          </p>
          {leadSignal ? (
            <a
              href={leadSignal.sourceUrl}
              className="mt-4 inline-flex rounded-full border border-white/10 bg-white/8 px-3 py-1.5 text-xs text-white transition hover:border-white/25 hover:bg-white/12"
            >
              {leadSignal.sourceLabel}
            </a>
          ) : null}
        </article>

        <article className="research-reveal rounded-[1.35rem] border border-white/10 bg-black/25 p-5 lg:col-span-2">
          <p className="text-sm font-medium tracking-[0.18em] text-white/45">
            Source posture
          </p>
          <p className="mt-4 text-sm leading-7 text-zinc-200">
            Pricing, product, customer proof, and hiring context stay visible beside the
            summary, so the brief remains inspectable instead of turning into generic
            sales copy.
          </p>
          <div className="mt-5 flex -space-x-3">
            {signals.map((signal) => (
              <div
                key={signal.sourceUrl}
                className="h-11 w-11 rounded-full border border-white/15 bg-cover bg-center"
                style={{ backgroundImage: `url(${imageUrl(`avatar-${signal.sourceLabel}`)})` }}
              />
            ))}
          </div>
        </article>

        <article className="research-reveal overflow-hidden rounded-[1.35rem] border border-white/10 bg-black/25 p-5 lg:col-span-2">
          <p className="text-sm font-medium tracking-[0.18em] text-white/45">
            Discovery prep
          </p>
          <div className="relative mt-4 overflow-hidden">
            <div ref={marqueeRef} className="flex w-max gap-2">
              {repeatedAngles.map((angle, index) => (
                <div
                  key={`${angle}-${index}`}
                  className="whitespace-nowrap rounded-full border border-white/10 bg-white/8 px-4 py-2 text-xs text-zinc-100"
                >
                  {angle}
                </div>
              ))}
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}
