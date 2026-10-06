"use client";

import { classNames } from "@/lib/utils";

/**
 * Typographic book cover — original Columnist artwork rendered in CSS.
 * Used everywhere a book has no uploaded cover image.
 */
const PALETTES = [
  { bg: "from-[#2a0e13] via-[#1c090d] to-[#120609]", accent: "#c9a24b", text: "#f3e9d4" },
  { bg: "from-[#1c090d] via-[#2a0e13] to-[#0e0507]", accent: "#b3232a", text: "#f3e9d4" },
  { bg: "from-[#241016] via-[#170a0d] to-[#0d0405]", accent: "#cdbb97", text: "#f3e9d4" },
  { bg: "from-[#101418] via-[#0d0f13] to-[#08090c]", accent: "#c9a24b", text: "#e9dfc8" },
  { bg: "from-[#1a120a] via-[#120c07] to-[#0b0704]", accent: "#c9a24b", text: "#f3e9d4" },
];

function paletteFor(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return PALETTES[h % PALETTES.length];
}

export function CrestMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={className} aria-hidden="true">
      <circle cx="24" cy="24" r="22" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="24" cy="24" r="18.5" stroke="currentColor" strokeWidth="0.7" opacity="0.6" />
      <path
        d="M30.5 15.5c-1.8-1.2-4-1.9-6.5-1.9s-4.7.7-6.5 1.9l2.6 2.1c1.1-.7 2.4-1.1 3.9-1.1s2.8.4 3.9 1.1l2.6-2.1Z"
        fill="currentColor"
        opacity="0.9"
      />
      <path
        d="M15 20.5c2.7-1.6 5.7-2.4 9-2.4s6.3.8 9 2.4l-1.2 3.2c-2.3-1.3-4.9-2-7.8-2s-5.5.7-7.8 2L15 20.5Z"
        fill="currentColor"
        opacity="0.75"
      />
      <path
        d="M17.5 27.5c1.9-1 4.1-1.5 6.5-1.5s4.6.5 6.5 1.5l-1.6 2.8c-1.4-.7-3-1-4.9-1s-3.5.3-4.9 1l-1.6-2.8Z"
        fill="currentColor"
        opacity="0.6"
      />
      <path d="M24 32.5l-2.2 3.5h4.4L24 32.5Z" fill="currentColor" opacity="0.9" />
    </svg>
  );
}

interface BookCoverProps {
  title: string;
  author?: string | null;
  category?: string | null;
  className?: string;
  compact?: boolean;
}

export default function BookCover({ title, author, category, className, compact }: BookCoverProps) {
  const p = paletteFor(title + (author ?? ""));
  return (
    <div
      className={classNames(
        "relative flex aspect-[2/3] w-full flex-col justify-between overflow-hidden bg-gradient-to-br p-[8%]",
        p.bg,
        className
      )}
      aria-label={`Cover of ${title}`}
      role="img"
    >
      {/* spine light */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-[7%] bg-gradient-to-r from-black/60 via-white/[0.06] to-transparent" />
      {/* inset frame */}
      <div
        className="pointer-events-none absolute inset-[5%] border opacity-70"
        style={{ borderColor: `${p.accent}55` }}
      />
      <div className="relative flex flex-col items-center pt-[6%] text-center">
        <CrestMark className={compact ? "h-7 w-7" : "h-10 w-10"} />
        <span
          className={classNames("mt-2 font-sans font-semibold uppercase", compact ? "text-[7px]" : "text-[9px]")}
          style={{ color: p.accent, letterSpacing: "0.3em" }}
        >
          Columnist
        </span>
      </div>
      <div className="relative px-[4%] text-center">
        {category && (
          <p
            className={classNames("mb-2 font-sans uppercase", compact ? "text-[6px]" : "text-[8px]")}
            style={{ color: `${p.accent}cc`, letterSpacing: "0.34em" }}
          >
            {category}
          </p>
        )}
        <h3
          className={classNames(
            "font-serif font-semibold leading-snug",
            compact ? "text-[11px]" : "text-lg"
          )}
          style={{ color: p.text }}
        >
          {title}
        </h3>
        {author && (
          <p
            className={classNames("mt-2 font-sans uppercase", compact ? "text-[6px]" : "text-[9px]")}
            style={{ color: `${p.text}aa`, letterSpacing: "0.28em" }}
          >
            {author}
          </p>
        )}
      </div>
      <div className="relative flex justify-center pb-[2%]">
        <div className="h-px w-1/3" style={{ background: `${p.accent}88` }} />
      </div>
    </div>
  );
}
