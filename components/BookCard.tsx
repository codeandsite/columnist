import Link from "next/link";
import Image from "next/image";
import BookCover from "@/components/BookCover";
import { coverUrl } from "@/lib/storage";
import { formatPKR } from "@/lib/utils";
import type { Book } from "@/lib/types";

interface BookCardProps {
  book: Book;
  showPrice?: boolean;
}

export default function BookCard({ book, showPrice = true }: BookCardProps) {
  const url = coverUrl(book.cover_path);
  const categoryName = book.book_categories?.[0]?.category?.name ?? null;

  return (
    <Link
      href={`/books/${book.slug}`}
      className="group flex h-full flex-col transition-transform duration-300 hover:-translate-y-1.5"
    >
      <div className="relative overflow-hidden bg-coal transition-shadow duration-300 group-hover:shadow-lift">
        <div className="aspect-[2/3] w-full transition-transform duration-500 group-hover:scale-105">
          {url ? (
            <Image
              src={url}
              alt={`Cover of ${book.title}`}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover"
            />
          ) : (
            <BookCover title={book.title} author={book.author} category={categoryName} />
          )}
        </div>
        {/* Hover overlay */}
        <div className="pointer-events-none absolute inset-0 flex items-end justify-center bg-gradient-to-t from-black/80 via-black/20 to-transparent p-5 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <span className="translate-y-2 border border-gold/60 bg-ink/70 px-6 py-2.5 font-sans text-[11px] font-medium uppercase tracking-[0.22em] text-gold transition-transform duration-300 group-hover:translate-y-0">
            View Book
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col pt-4">
        {categoryName && (
          <p className="label-eyebrow !text-[10px] !text-clay">{categoryName}</p>
        )}
        <h3 className="mt-2 line-clamp-2 font-serif text-lg leading-snug text-cream transition-colors group-hover:text-gold">
          {book.title}
        </h3>
        <p className="mt-1.5 font-sans text-[11px] uppercase tracking-[0.2em] text-sand">
          {book.author}
        </p>
        {showPrice && (
          <p className="mt-auto pt-3 font-serif text-base text-gold">
            {formatPKR(book.price)}
          </p>
        )}
      </div>
    </Link>
  );
}
