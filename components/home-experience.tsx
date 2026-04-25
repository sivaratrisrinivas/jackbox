"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ProspectForm } from "@/components/prospect-form";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const bentoCards = [
  {
    title: "One brief",
    copy: "URL and pain point stay in one founder-readable workbench so the story starts from the real prospect instead of a generic product tour.",
    accentImage: "https://picsum.photos/seed/jackbox-grid-brief/900/900",
    className: "md:col-span-4",
    mediaClassName:
      "absolute inset-y-0 right-0 w-1/3 bg-cover bg-center opacity-55 mix-blend-luminosity",
  },
  {
    title: "Guardrails",
    copy: "Inline validation keeps the brief usable before it ever touches generation, which makes the next server slices easier to trust.",
    className: "md:col-span-2",
  },
  {
    title: "Results",
    copy: "The result panel is no longer a blank promise. It now has routing, crawl targets, estimates, and recovery states prepared for real orchestration data.",
    className: "md:col-span-2",
  },
  {
    title: "Fixtures",
    copy: "This flow stays deterministic and founder-safe while the preview exposes template routing, crawl planning, and estimates.",
    className: "md:col-span-2",
  },
  {
    title: "Preview",
    copy: "The landing experience now has a visible handoff, so later template work lands into a real surface instead of a placeholder shell.",
    className: "md:col-span-2",
  },
];

const marqueeItems = [
  "Public docs",
  "Pricing surfaces",
  "Release notes",
  "Change logs",
  "Help centers",
  "Product marketing",
  "Security pages",
  "Support portals",
];

const accordionSlices = [
  {
    title: "Docs intelligence",
    copy: "Pull a noisy docs surface into a tighter answer path with citation-ready structure.",
    image: "https://picsum.photos/seed/jackbox-accordion-docs/960/1200",
  },
  {
    title: "Change monitor",
    copy: "Turn public pages into a founder-readable pulse on launches, messaging shifts, and updates.",
    image: "https://picsum.photos/seed/jackbox-accordion-monitor/960/1200",
  },
  {
    title: "Account research",
    copy: "Shape pricing, product, and hiring signals into a compact pre-call brief that feels specific.",
    image: "https://picsum.photos/seed/jackbox-accordion-research/960/1200",
  },
];

const handoffCards = [
  {
    label: "Capture",
    title: "Capture the prospect context once",
    copy: "A single brief keeps the conversation tight and makes the next pipeline stages deterministic instead of improvisational.",
    image: "https://picsum.photos/seed/flow-capture/500/500",
  },
  {
    label: "Validate",
    title: "Validate before the async jump",
    copy: "Bad input stops at the edge with inline feedback rather than leaking confusion into routing, estimates, and preview rendering.",
    image: "https://picsum.photos/seed/flow-validate/500/500",
  },
  {
    label: "Hand off",
    title: "Hand off into a visible result shell",
    copy: "The success surface gives routing, provenance, and export metadata a stable place to land when Task 4 and beyond arrive.",
    image: "https://picsum.photos/seed/flow-handoff/500/500",
  },
];

export function HomeExperience() {
  const rootRef = useRef<HTMLElement | null>(null);
  const marqueeRef = useRef<HTMLDivElement | null>(null);
  const flowSectionRef = useRef<HTMLElement | null>(null);
  const flowIntroRef = useRef<HTMLDivElement | null>(null);
  const accordionRef = useRef<HTMLDivElement | null>(null);

  useGSAP(
    () => {
      const marqueeTrack = marqueeRef.current;

      if (marqueeTrack) {
        gsap.to(marqueeTrack, {
          xPercent: -50,
          duration: 28,
          ease: "none",
          repeat: -1,
        });
      }

      gsap.fromTo(
        [
          ".hero-kicker",
          ".hero-title",
          ".hero-copy",
          ".hero-actions",
          ".hero-media-primary",
          ".hero-media-secondary",
        ],
        {
          y: 48,
          opacity: 0,
        },
        {
          y: 0,
          opacity: 1,
          duration: 1.05,
          stagger: 0.08,
          ease: "power3.out",
        },
      );

      gsap.fromTo(
        ".accordion-panel",
        {
          y: 44,
          opacity: 0,
        },
        {
          y: 0,
          opacity: 1,
          duration: 0.9,
          stagger: 0.12,
          ease: "power3.out",
          scrollTrigger: {
            trigger: accordionRef.current,
            start: "top 78%",
          },
        },
      );

      const media = gsap.matchMedia();

      media.add("(min-width: 1024px)", () => {
        if (flowSectionRef.current && flowIntroRef.current) {
          ScrollTrigger.create({
            trigger: flowSectionRef.current,
            start: "top top+=112",
            end: "bottom bottom-=80",
            pin: flowIntroRef.current,
            pinSpacing: false,
            invalidateOnRefresh: true,
          });
        }

        const cards = gsap.utils.toArray<HTMLElement>(".flow-card");

        cards.forEach((card, index) => {
          const image = card.querySelector<HTMLElement>(".flow-card-image");

          gsap.fromTo(
            card,
            {
              y: 160,
              opacity: 0.28,
              scale: 0.92,
            },
            {
              y: -index * 34,
              opacity: 1,
              scale: 1 - index * 0.025,
              ease: "none",
              scrollTrigger: {
                trigger: card,
                start: "top bottom-=80",
                end: "top center+=24",
                scrub: true,
              },
            },
          );

          if (image) {
            gsap.fromTo(
              image,
              {
                scale: 0.82,
                opacity: 0.38,
                filter: "grayscale(100%) brightness(0.82)",
              },
              {
                scale: 1,
                opacity: 0.96,
                filter: "grayscale(0%) brightness(1)",
                ease: "none",
                scrollTrigger: {
                  trigger: card,
                  start: "top bottom-=64",
                  end: "bottom center",
                  scrub: true,
                },
              },
            );
          }
        });
      });

      return () => {
        media.revert();
      };
    },
    { scope: rootRef },
  );

  return (
    <main
      ref={rootRef}
      className="w-full max-w-full overflow-x-hidden px-6 py-6 text-zinc-50 sm:px-10 lg:px-14"
    >
      <div className="mx-auto max-w-[96rem]">
        <nav className="sticky top-5 z-20 mb-12 flex items-center justify-between rounded-full border border-white/10 bg-black/35 px-4 py-3 backdrop-blur md:px-6">
          <div className="flex items-center gap-3">
            <div className="h-3 w-3 rounded-full bg-sky-300" />
            <span className="text-sm font-medium tracking-[0.18em] text-zinc-100">
              Jackbox
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm text-zinc-300">
            <a
              href="#intake"
              className="rounded-full border border-white/10 px-4 py-2 transition hover:border-white/30 hover:bg-white/8"
            >
              Start brief
            </a>
            <a
              href="#handoff"
              className="rounded-full bg-white px-4 py-2 font-medium text-zinc-950 transition hover:bg-zinc-100"
            >
              View motion
            </a>
          </div>
        </nav>

        <section className="relative overflow-hidden rounded-[2.8rem] border border-white/10 bg-black/40 px-6 py-16 shadow-[0_40px_120px_rgba(7,12,28,0.45)] backdrop-blur md:px-10 md:py-24 lg:px-14 lg:py-28">
          <div
            className="absolute inset-0 opacity-60"
            style={{
              backgroundImage:
                "radial-gradient(circle at 10% 15%, rgba(56,189,248,0.24), transparent 24%), radial-gradient(circle at 82% 18%, rgba(244,114,182,0.14), transparent 26%), linear-gradient(135deg, rgba(255,255,255,0.04), transparent 58%)",
            }}
          />
          <div className="relative grid gap-12 lg:grid-cols-[1.08fr_0.92fr] lg:items-end">
            <div className="max-w-6xl">
              <p className="hero-kicker text-sm font-medium uppercase tracking-[0.28em] text-white/55">
                Founder-led sales demo generator
              </p>
              <h1 className="hero-title mt-8 max-w-6xl text-[clamp(3.25rem,8vw,6.1rem)] font-semibold leading-[0.94] tracking-tight text-white">
                Turn one buyer pain into a
                <span
                  className="mx-4 inline-block h-[0.9em] w-28 rounded-full border border-white/15 align-[-0.12em] grayscale md:w-40"
                  style={{
                    backgroundImage:
                      "url(https://picsum.photos/seed/firecrawl-editorial/640/240)",
                    backgroundPosition: "center",
                    backgroundSize: "cover",
                  }}
                />
                prospect-specific Firecrawl story.
              </h1>
              <p className="hero-copy mt-8 max-w-3xl text-base leading-8 text-zinc-300 md:text-lg">
                Jackbox now has the intake surface founders actually need: one brief,
                visible guardrails, routed template logic, and a result shell that feels
                like a real product path.
              </p>
              <div className="hero-actions mt-10 flex flex-wrap items-center gap-3">
                <a
                  href="#intake"
                  className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-zinc-950 transition-transform duration-500 hover:scale-[1.01]"
                >
                  Build the brief
                </a>
                <a
                  href="#handoff"
                  className="rounded-full border border-white/15 px-6 py-3 text-sm font-semibold text-white transition hover:border-white/30 hover:bg-white/8"
                >
                  See the handoff
                </a>
              </div>
            </div>

            <div className="relative min-h-[24rem] lg:min-h-[31rem]">
              <div
                className="hero-media-primary absolute right-0 top-0 h-[20rem] w-full overflow-hidden rounded-[2rem] border border-white/10 bg-cover bg-center opacity-90 contrast-125 lg:h-[28rem] lg:w-[84%]"
                style={{
                  backgroundImage:
                    "url(https://picsum.photos/seed/jackbox-hero-primary/1200/1600)",
                }}
              />
              <div
                className="hero-media-secondary absolute bottom-0 left-0 flex h-36 w-[72%] items-end rounded-[1.8rem] border border-white/10 bg-cover bg-center p-6 mix-blend-luminosity lg:h-44"
                style={{
                  backgroundImage:
                    "linear-gradient(180deg, rgba(4,7,18,0.05), rgba(4,7,18,0.8)), url(https://picsum.photos/seed/jackbox-hero-secondary/1200/900)",
                }}
              >
                <p className="max-w-sm text-sm leading-7 text-zinc-100/85">
                  Public docs, pricing, and product surfaces already read like raw material
                  for a tailored story. The motion layer now makes that feel intentional.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-24 md:py-32 lg:py-40">
          <div className="overflow-hidden rounded-full border border-white/10 bg-white/[0.05] py-4 backdrop-blur">
            <div ref={marqueeRef} className="flex w-max whitespace-nowrap">
              {[0, 1].map((copyIndex) => (
                <div key={copyIndex} className="flex items-center gap-4 pr-4">
                  {marqueeItems.map((item) => (
                    <div
                      key={`${copyIndex}-${item}`}
                      className="rounded-full border border-white/10 bg-black/25 px-5 py-2 text-sm tracking-[0.2em] text-zinc-200 uppercase"
                    >
                      {item}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-24 md:py-32 lg:py-40">
          <ProspectForm />
        </section>

        <section className="py-24 md:py-32 lg:py-40">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-6 md:grid-flow-dense">
            {bentoCards.map((card) => (
              <article
                key={card.title}
                className={`group relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.05] p-7 transition-transform duration-700 ease-out hover:scale-[1.01] ${card.className}`}
              >
                {card.accentImage ? (
                  <div
                    className={card.mediaClassName}
                    style={{
                      backgroundImage: `url(${card.accentImage})`,
                    }}
                  />
                ) : null}
                <div className="relative max-w-xl">
                  <p className="text-sm font-medium uppercase tracking-[0.24em] text-white/45">
                    {card.title}
                  </p>
                  <h2 className="mt-5 text-3xl font-semibold tracking-tight text-white">
                    {card.title === "One brief"
                      ? "The landing surface is centered on the founder conversation."
                      : card.title}
                  </h2>
                  <p className="mt-4 text-sm leading-7 text-zinc-300">{card.copy}</p>
                </div>
              </article>
            ))}
          </div>

          <div ref={accordionRef} className="mt-10 flex flex-col gap-4 lg:flex-row">
            {accordionSlices.map((slice) => (
              <article
                key={slice.title}
                className="accordion-panel group flex min-h-[28rem] flex-col justify-end overflow-hidden rounded-[2.2rem] border border-white/10 bg-black/35 p-6 transition-[flex,transform] duration-700 ease-out hover:scale-[1.01] lg:min-h-[34rem] lg:flex-1 lg:hover:flex-[1.35]"
                style={{
                  backgroundImage: `linear-gradient(180deg, rgba(4,7,18,0.08), rgba(4,7,18,0.88)), url(${slice.image})`,
                  backgroundPosition: "center",
                  backgroundSize: "cover",
                }}
              >
                <div className="max-w-sm rounded-[1.7rem] border border-white/10 bg-black/30 p-5 backdrop-blur">
                  <h3 className="text-2xl font-semibold tracking-tight text-white">
                    {slice.title}
                  </h3>
                  <p className="mt-4 text-sm leading-7 text-zinc-200">{slice.copy}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section
          id="handoff"
          ref={flowSectionRef}
          className="grid gap-6 py-24 md:py-32 lg:grid-cols-[0.7fr_1.3fr] lg:py-40"
        >
          <div ref={flowIntroRef} className="self-start">
            <p className="text-sm font-medium uppercase tracking-[0.24em] text-white/45">
              Handoff motion
            </p>
            <h2 className="mt-5 max-w-md text-4xl font-semibold tracking-tight text-white">
              The intake now moves like a real product surface while routing becomes
              visible.
            </h2>
            <p className="mt-5 max-w-md text-sm leading-7 text-zinc-300">
              This chapter is powered by real ScrollTrigger pinning and stacked card
              motion, which gives later generation and preview work a more credible stage.
            </p>
          </div>

          <div className="space-y-[-3.5rem] pt-10 lg:pt-20">
            {handoffCards.map((card) => (
              <article
                key={card.title}
                className="flow-card group relative overflow-hidden rounded-[2.2rem] border border-white/10 bg-black/40 p-7 shadow-[0_30px_80px_rgba(6,12,28,0.32)]"
              >
                <div className="flex items-start justify-between gap-5">
                  <div className="max-w-2xl">
                    <p className="text-sm font-medium uppercase tracking-[0.24em] text-white/45">
                      {card.label}
                    </p>
                    <h3 className="mt-5 text-2xl font-semibold tracking-tight text-white">
                      {card.title}
                    </h3>
                    <p className="mt-4 text-sm leading-7 text-zinc-300">{card.copy}</p>
                  </div>
                  <div
                    className="flow-card-image h-28 w-28 shrink-0 rounded-[1.7rem] border border-white/10 bg-cover bg-center opacity-85 transition-transform duration-700 ease-out group-hover:scale-105"
                    style={{
                      backgroundImage: `url(${card.image})`,
                    }}
                  />
                </div>
              </article>
            ))}
          </div>
        </section>

        <footer className="pb-10 pt-16 md:pb-16">
          <div className="rounded-[2.5rem] border border-white/10 bg-white/[0.05] px-6 py-12 text-center shadow-[0_30px_80px_rgba(6,12,28,0.35)] backdrop-blur md:px-10 md:py-16">
            <p className="text-sm font-medium uppercase tracking-[0.28em] text-white/45">
              Next slice
            </p>
            <h2 className="mx-auto mt-5 max-w-4xl text-4xl font-semibold tracking-tight text-white">
              Routing logic, crawl target selection, and credit estimates now have a
              credible motion system to land inside.
            </h2>
            <div className="mt-8 flex justify-center">
              <a
                href="#intake"
                className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-zinc-950 transition-transform duration-500 hover:scale-[1.01]"
              >
                Return to the brief
              </a>
            </div>
          </div>
        </footer>
      </div>
    </main>
  );
}
