import Link from "next/link";
import { classNames } from "@/lib/utils";

export default function Pagination({
  page,
  totalPages,
  makeHref,
}: {
  page: number;
  totalPages: number;
  makeHref: (page: number) => string;
}) {
  if (totalPages <= 1) return null;
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1).filter(
    (p) => p === 1 || p === totalPages || Math.abs(p - page) <= 2
  );
  return (
    <nav className="mt-12 flex items-center justify-center gap-2" aria-label="Pagination">
      {page > 1 && (
        <Link
          href={makeHref(page - 1)}
          className="flex h-11 w-11 items-center justify-center border border-cream/15 text-cream transition-colors hover:border-gold/60 hover:text-gold"
          aria-label="Previous page"
        >
          ←
        </Link>
      )}
      {pages.map((p, i) => (
        <span key={p} className="flex items-center gap-2">
          {i > 0 && pages[i - 1] !== p - 1 && <span className="text-clay">…</span>}
          <Link
            href={makeHref(p)}
            aria-current={p === page ? "page" : undefined}
            className={classNames(
              "flex h-11 w-11 items-center justify-center border font-sans text-sm transition-colors",
              p === page
                ? "border-crimson bg-crimson text-cream"
                : "border-cream/15 text-sand hover:border-gold/60 hover:text-gold"
            )}
          >
            {p}
          </Link>
        </span>
      ))}
      {page < totalPages && (
        <Link
          href={makeHref(page + 1)}
          className="flex h-11 w-11 items-center justify-center border border-cream/15 text-cream transition-colors hover:border-gold/60 hover:text-gold"
          aria-label="Next page"
        >
          →
        </Link>
      )}
    </nav>
  );
}
