import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import BookCover from "@/components/BookCover";
import BookCard from "@/components/BookCard";
import BookActions from "@/components/BookActions";
import Reveal from "@/components/Reveal";
import { createClient } from "@/lib/supabase/server";
import { coverUrl } from "@/lib/storage";
import { formatPKR } from "@/lib/utils";
import type { Book } from "@/lib/types";

const BOOK_SELECT = "*, book_categories(category:categories(id,name,slug))";
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://columnist.site";

async function getBook(slug: string): Promise<Book | null> {
  const supabase = createClient();
  const { data } = await supabase
    .from("books")
    .select(BOOK_SELECT)
    .eq("slug", slug)
    .eq("published", true)
    .maybeSingle();
  return (data as Book | null) ?? null;
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const book = await getBook(params.slug);
  if (!book) return { title: "Book not found" };
  const url = coverUrl(book.cover_path);
  const canonical = `${siteUrl}/books/${book.slug}`;
  return {
    title: `${book.title} · Columnist`,
    description: book.short_description ?? book.title,
    alternates: { canonical },
    openGraph: {
      type: "book",
      title: book.title,
      description: book.short_description ?? undefined,
      url: canonical,
      ...(url ? { images: [{ url }] } : {}),
    },
  };
}

export default async function BookDetailPage({ params }: { params: { slug: string } }) {
  const book = await getBook(params.slug);
  if (!book) notFound();

  const url = coverUrl(book.cover_path);
  const category = book.book_categories?.[0]?.category ?? null;
  const paragraphs = (book.description ?? "")
    .split(/\r?\n\r?\n|\r?\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  // Related: other published books sharing the first category
  let related: Book[] = [];
  if (category) {
    const supabase = createClient();
    const { data } = await supabase
      .from("books")
      .select(BOOK_SELECT)
      .eq("published", true)
      .neq("id", book.id)
      .order("created_at", { ascending: false })
      .limit(12);
    const pool = (data ?? []) as Book[];
    related = pool
      .filter((b) => b.book_categories?.some((bc) => bc.category?.id === category.id))
      .slice(0, 4);
    if (related.length < 4) {
      const extra = pool
        .filter((b) => !related.some((r) => r.id === b.id))
        .slice(0, 4 - related.length);
      related = [...related, ...extra];
    }
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Book",
    name: book.title,
    author: { "@type": "Person", name: book.author },
    description: book.short_description ?? book.title,
    bookFormat: "EBook",
    url: `${siteUrl}/books/${book.slug}`,
    ...(url ? { image: url } : {}),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="mx-auto max-w-7xl px-6 py-14 sm:py-20">
        <Reveal>
          <div className="grid gap-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16">
            {/* Cover */}
            <div className="mx-auto w-full max-w-sm lg:mx-0">
              <div className="overflow-hidden shadow-book">
                {url ? (
                  <Image
                    src={url}
                    alt={`Cover of ${book.title}`}
                    width={600}
                    height={900}
                    className="aspect-[2/3] w-full object-cover"
                    priority
                  />
                ) : (
                  <BookCover
                    title={book.title}
                    author={book.author}
                    category={category?.name}
                  />
                )}
              </div>
            </div>

            {/* Details */}
            <div>
              {category && (
                <Link
                  href={`/categories/${category.slug}`}
                  className="label-eyebrow !text-gold transition-colors hover:text-cream"
                >
                  {category.name}
                </Link>
              )}
              <h1 className="mt-4 font-serif text-4xl leading-tight text-cream sm:text-5xl">
                {book.title}
              </h1>
              <p className="mt-4 font-sans text-sm uppercase tracking-[0.24em] text-sand">
                By {book.author}
              </p>

              <div className="rule-gold mt-7" />

              {book.short_description && (
                <p className="mt-7 font-serif text-xl italic leading-relaxed text-sand">
                  {book.short_description}
                </p>
              )}
              <div className="mt-6 space-y-5">
                {paragraphs.map((p, i) => (
                  <p key={i} className="font-sans text-[15px] leading-relaxed text-cream/80">
                    {p}
                  </p>
                ))}
              </div>

              <p className="mt-9 font-serif text-4xl text-gold">{formatPKR(book.price)}</p>

              <div className="mt-7">
                <BookActions bookId={book.id} slug={book.slug} />
              </div>

              <p className="mt-6 max-w-md font-sans text-xs leading-relaxed text-clay">
                Requests are verified manually. Once your payment is confirmed,
                the book appears in your library for online reading and PDF
                download.
              </p>
            </div>
          </div>
        </Reveal>

        {related.length > 0 && (
          <Reveal className="mt-24">
            <section aria-label="You may also like">
              <div className="mb-8">
                <h2 className="font-serif text-3xl text-cream">You may also like</h2>
                <div className="mt-4 h-[3px] w-16 bg-crimson" />
              </div>
              <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-4">
                {related.map((b) => (
                  <BookCard key={b.id} book={b} />
                ))}
              </div>
            </section>
          </Reveal>
        )}
      </div>
    </>
  );
}
