"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CrestMark } from "@/components/BookCover";

const EXPLORE = [
  { href: "/books", label: "Books" },
  { href: "/categories", label: "Categories" },
  { href: "/books?featured=1", label: "Featured" },
  { href: "/books?sort=newest", label: "New Arrivals" },
];
const COMPANY = [
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];
const LEGAL = [
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms & Conditions" },
];

export default function Footer() {
  const pathname = usePathname();
  if (pathname?.startsWith("/read/") || pathname?.startsWith("/admin")) return null;

  return (
    <footer className="border-t border-gold/15 bg-[#080304]">
      <div className="mx-auto grid max-w-7xl gap-12 px-5 py-16 md:grid-cols-[1.4fr_1fr_1fr_1fr] lg:px-8">
        <div>
          <div className="flex items-center gap-3">
            <CrestMark className="h-10 w-10 text-gold" />
            <span className="leading-none">
              <span className="block font-serif text-xl font-semibold tracking-[0.22em] text-cream">COLUMNIST</span>
              <span className="mt-1.5 block font-sans text-[8px] font-medium uppercase text-sand" style={{ letterSpacing: "0.34em" }}>
                Ebooks for a wiser you
              </span>
            </span>
          </div>
          <p className="mt-6 max-w-xs font-sans text-sm leading-relaxed text-clay">
            A premium digital library of carefully curated eBooks — for thinkers,
            dreamers, learners and curious minds.
          </p>
        </div>
        <nav aria-label="Explore">
          <p className="label-eyebrow">Explore</p>
          <ul className="mt-5 space-y-3">
            {EXPLORE.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="font-sans text-sm text-sand/90 transition-colors hover:text-gold">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <nav aria-label="Company">
          <p className="label-eyebrow">Company</p>
          <ul className="mt-5 space-y-3">
            {COMPANY.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="font-sans text-sm text-sand/90 transition-colors hover:text-gold">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <nav aria-label="Legal">
          <p className="label-eyebrow">Legal</p>
          <ul className="mt-5 space-y-3">
            {LEGAL.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="font-sans text-sm text-sand/90 transition-colors hover:text-gold">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      <div className="border-t border-cream/[0.07]">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-5 py-6 sm:flex-row lg:px-8">
          <p className="font-sans text-xs text-clay">
            © {new Date().getFullYear()} Columnist. All rights reserved.
          </p>
          <p className="font-sans text-[10px] uppercase tracking-[0.3em] text-clay/70">
            Explore · Read · Grow
          </p>
        </div>
      </div>
    </footer>
  );
}
