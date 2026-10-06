import Link from "next/link";
import type { Category } from "@/lib/types";

/** Simple original line-art icons, cycled across the strip cells. */
function StripIcon({ index }: { index: number }) {
  const common = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.4,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    className: "h-8 w-8 shrink-0 text-gold/80",
    "aria-hidden": true,
  } as const;
  switch (index % 5) {
    case 0: // closed book
      return (
        <svg {...common}>
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V4H6.5A2.5 2.5 0 0 0 4 6.5v13Z" />
          <path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5" />
        </svg>
      );
    case 1: // head / mind
      return (
        <svg {...common}>
          <circle cx="12" cy="9" r="6" />
          <path d="M9.5 9h.01M14.5 9h.01" strokeWidth={2.2} />
          <path d="M8 15.5c1.2 1 2.5 1.5 4 1.5s2.8-.5 4-1.5" />
        </svg>
      );
    case 2: // growth chart
      return (
        <svg {...common}>
          <path d="M4 4v16h16" />
          <path d="M7 15l4-5 3 3 5-7" />
          <path d="M16.5 6H19v2.5" />
        </svg>
      );
    case 3: // atom
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" />
          <ellipse cx="12" cy="12" rx="10" ry="4" />
          <ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(60 12 12)" />
          <ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(120 12 12)" />
        </svg>
      );
    default: // open book
      return (
        <svg {...common}>
          <path d="M12 6.5C10 4.8 7.2 4.5 4 5v13c3.2-.5 6-.2 8 1.5 2-1.7 4.8-2 8-1.5V5c-3.2-.5-6-.2-8 1.5Z" />
          <path d="M12 6.5v13" />
        </svg>
      );
  }
}

interface CategoryStripProps {
  categories: Category[];
}

/** Elegant horizontal strip of the first 5 categories + an editorial quote. */
export default function CategoryStrip({ categories }: CategoryStripProps) {
  const cells = categories.slice(0, 5);
  if (cells.length === 0) return null;

  return (
    <section className="border-y border-gold/15 bg-coal/40">
      <div className="mx-auto flex max-w-7xl items-stretch overflow-x-auto">
        {cells.map((cat, i) => (
          <Link
            key={cat.id}
            href={`/categories/${cat.slug}`}
            className="group flex min-w-[200px] flex-1 items-center gap-4 border-l border-gold/10 px-6 py-7 transition-colors first:border-l-0 hover:bg-wine/40 sm:min-w-0"
          >
            <StripIcon index={i} />
            <span className="flex items-center gap-2">
              <span className="font-sans text-[13px] font-medium uppercase tracking-[0.2em] text-cream transition-colors group-hover:text-gold">
                {cat.name}
              </span>
              <span
                aria-hidden="true"
                className="text-gold transition-transform duration-300 group-hover:translate-x-1"
              >
                →
              </span>
            </span>
          </Link>
        ))}
        <blockquote className="flex min-w-[300px] items-center gap-4 border-l border-gold/10 px-8 py-7 sm:min-w-[340px]">
          <span aria-hidden="true" className="font-serif text-4xl leading-none text-ember">
            ❝
          </span>
          <p className="font-serif text-sm italic leading-relaxed text-sand">
            A good book is a conversation with the best minds of the past.
          </p>
        </blockquote>
      </div>
    </section>
  );
}
