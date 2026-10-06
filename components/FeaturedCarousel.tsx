"use client";

import { useRef } from "react";
import Link from "next/link";
import BookCard from "@/components/BookCard";
import type { Book } from "@/lib/types";

interface FeaturedCarouselProps {
  books: Book[];
  title?: string;
}

export default function FeaturedCarousel({ books, title = "Featured Books" }: FeaturedCarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null);

  if (books.length === 0) return null;

  const nudge = (dir: 1 | -1) => {
    trackRef.current?.scrollBy({ left: dir * 560, behavior: "smooth" });
  };

  return (
    <section aria-label={title}>
      <div className="mb-8 flex items-end justify-between gap-6">
        <div>
          <h2 className="font-serif text-3xl text-cream sm:text-4xl">{title}</h2>
          <div className="mt-4 h-[3px] w-16 bg-crimson" />
        </div>
        <Link
          href="/books"
          className="shrink-0 font-sans text-xs font-medium uppercase tracking-[0.22em] text-sand transition-colors hover:text-gold"
        >
          View All <span aria-hidden="true">→</span>
        </Link>
      </div>

      <div className="relative">
        <div
          ref={trackRef}
          className="flex snap-x snap-mandatory gap-6 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {books.map((book) => (
            <div key={book.id} className="w-40 shrink-0 snap-start sm:w-48 lg:w-52">
              <BookCard book={book} />
            </div>
          ))}
        </div>

        <div className="mt-6 hidden justify-end gap-3 sm:flex">
          <button
            type="button"
            onClick={() => nudge(-1)}
            aria-label="Scroll carousel left"
            className="flex h-11 w-11 items-center justify-center rounded-full border border-cream/20 text-cream transition-colors hover:border-gold/70 hover:text-gold"
          >
            ←
          </button>
          <button
            type="button"
            onClick={() => nudge(1)}
            aria-label="Scroll carousel right"
            className="flex h-11 w-11 items-center justify-center rounded-full border border-cream/20 text-cream transition-colors hover:border-gold/70 hover:text-gold"
          >
            →
          </button>
        </div>
      </div>
    </section>
  );
}
