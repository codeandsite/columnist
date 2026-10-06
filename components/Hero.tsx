"use client";

import Link from "next/link";
import { CrestMark } from "@/components/BookCover";

const SPINES = [
  { label: "HISTORY", width: "w-56 sm:w-64" },
  { label: "PHILOSOPHY", width: "w-64 sm:w-72" },
  { label: "SELF IMPROVEMENT", width: "w-52 sm:w-60" },
  { label: "SCIENCE", width: "w-60 sm:w-72" },
  { label: "LITERATURE", width: "w-56 sm:w-64" },
];

/**
 * Cinematic hero — pure-CSS editorial composition.
 * Left: headline + copy + CTAs. Right: burgundy radial backdrop, drifting
 * tablet mockup, stacked book spines, pillar silhouette and fabric drape.
 */
export default function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 pb-20 pt-14 sm:pt-20 lg:grid-cols-2 lg:items-center lg:gap-6 lg:pb-28 lg:pt-24">
        {/* ── Copy ── */}
        <div className="animate-fade-up">
          <p className="label-eyebrow">Explore · Read · Grow</p>
          <h1 className="mt-7 font-serif text-5xl leading-[1.04] text-cream sm:text-6xl xl:text-7xl">
            Great Books
            <br />
            <span className="italic text-gold">Build Greater Minds</span>
          </h1>
          <p className="mt-7 max-w-xl font-sans text-base leading-relaxed text-sand sm:text-lg">
            Columnist brings you carefully curated eBooks for thinkers, dreamers,
            learners, and curious minds.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Link href="/books" className="btn-crimson">
              Browse Books <span aria-hidden="true">→</span>
            </Link>
            <Link href="/categories" className="btn-outline">
              Explore Categories
            </Link>
          </div>
        </div>

        {/* ── Editorial composition ── */}
        <div
          className="relative mx-auto h-[480px] w-full max-w-[540px] origin-top scale-[0.86] sm:h-[560px] sm:scale-100 lg:h-[620px]"
          aria-hidden="true"
        >
          {/* Burgundy radial backdrop, slow pan */}
          <div className="absolute inset-0 overflow-hidden">
            <div
              className="absolute -inset-x-10 -inset-y-10 animate-slow-pan"
              style={{
                background:
                  "radial-gradient(ellipse 85% 72% at 42% 36%, #571318 0%, #2a0e13 48%, #0b0506 100%)",
              }}
            />
          </div>

          {/* Fabric drape — skewed dark-red gradient panel */}
          <div
            className="absolute -left-8 top-0 h-full w-44 -skew-x-12"
            style={{
              background:
                "linear-gradient(100deg, rgba(142,27,33,0.42) 0%, rgba(142,27,33,0.12) 45%, transparent 75%)",
            }}
          />
          <div
            className="absolute -left-2 top-0 h-full w-16 -skew-x-12"
            style={{
              background:
                "linear-gradient(100deg, rgba(179,35,42,0.30) 0%, transparent 80%)",
            }}
          />

          {/* Column / pillar silhouette on the right edge */}
          <div
            className="absolute inset-y-0 right-0 w-24 sm:w-28"
            style={{
              background:
                "linear-gradient(90deg, transparent 0%, rgba(0,0,0,0.62) 100%), repeating-linear-gradient(90deg, rgba(201,162,75,0.12) 0px, rgba(201,162,75,0.12) 2px, transparent 2px, transparent 13px)",
            }}
          />
          <div
            className="absolute inset-y-0 right-0 w-6"
            style={{
              background:
                "linear-gradient(90deg, transparent, rgba(201,162,75,0.14))",
            }}
          />

          {/* Tablet mockup — gently drifting */}
          <div className="absolute left-[54%] top-1/2 w-[44%] max-w-[235px] -translate-x-1/2 -translate-y-1/2">
            <div className="animate-drift">
              <div className="rounded-[1.9rem] border border-cream/10 bg-[#080404] p-2.5 shadow-book">
                <div
                  className="relative flex aspect-[3/4.3] flex-col items-center justify-center overflow-hidden rounded-[1.25rem] border border-gold/30"
                  style={{
                    background:
                      "linear-gradient(165deg, #421016 0%, #230b0f 55%, #14070a 100%)",
                  }}
                >
                  {/* screen glare */}
                  <div
                    className="pointer-events-none absolute inset-0"
                    style={{
                      background:
                        "linear-gradient(115deg, rgba(255,255,255,0.10) 0%, transparent 38%)",
                    }}
                  />
                  <CrestMark className="h-12 w-12 text-gold" />
                  <p
                    className="mt-4 font-sans text-[11px] font-semibold uppercase text-cream"
                    style={{ letterSpacing: "0.44em", textIndent: "0.44em" }}
                  >
                    Columnist
                  </p>
                  <div className="mt-4 h-px w-16 bg-gold/60" />
                  <p className="mt-4 px-8 text-center font-serif text-[13px] italic leading-relaxed text-sand">
                    Ebooks for a wiser you
                  </p>
                  {/* thin gold frame */}
                  <div className="pointer-events-none absolute inset-3 border border-gold/25" />
                </div>
              </div>
            </div>
          </div>

          {/* Stack of book spines */}
          <div className="absolute bottom-6 left-4 flex flex-col gap-2.5 sm:bottom-10 sm:left-8">
            {SPINES.map((spine) => (
              <div
                key={spine.label}
                className={`flex h-10 items-center justify-between border-y border-gold/40 bg-[#130709] px-4 shadow-book sm:h-11 ${spine.width}`}
              >
                <span
                  className="font-serif text-[10px] uppercase text-gold sm:text-[11px]"
                  style={{ letterSpacing: "0.26em" }}
                >
                  {spine.label}
                </span>
                <span className="h-4 w-px bg-gold/30" aria-hidden="true" />
              </div>
            ))}
          </div>

          {/* faint baseline rule */}
          <div className="absolute inset-x-8 bottom-0 h-px bg-gold/20 sm:inset-x-12" />
        </div>
      </div>
    </section>
  );
}
