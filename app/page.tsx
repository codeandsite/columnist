import Hero from "@/components/Hero";
import CategoryStrip from "@/components/CategoryStrip";
import FeaturedCarousel from "@/components/FeaturedCarousel";
import BookCard from "@/components/BookCard";
import CategoryCard from "@/components/CategoryCard";
import Reveal from "@/components/Reveal";
import { getCategoriesWithCounts } from "@/components/categories-with-counts";
import { createClient } from "@/lib/supabase/server";
import type { Book } from "@/lib/types";
import Link from "next/link";

const BOOK_SELECT =
  "*, book_categories(category:categories(id,name,slug))";

const WHY = [
  {
    eyebrow: "Curated",
    text: "Thoughtfully selected books.",
  },
  {
    eyebrow: "Accessible",
    text: "Your library wherever you go.",
  },
  {
    eyebrow: "Meaningful",
    text: "Ideas worth remembering.",
  },
];

export default async function HomePage() {
  const supabase = createClient();

  const [featuredRes, arrivalsRes, categories] = await Promise.all([
    supabase
      .from("books")
      .select(BOOK_SELECT)
      .eq("published", true)
      .eq("featured", true)
      .order("created_at", { ascending: false })
      .limit(10),
    supabase
      .from("books")
      .select(BOOK_SELECT)
      .eq("published", true)
      .order("created_at", { ascending: false })
      .limit(8),
    getCategoriesWithCounts(),
  ]);

  const featured = (featuredRes.data ?? []) as Book[];
  const arrivals = (arrivalsRes.data ?? []) as Book[];

  return (
    <>
      <Hero />

      <CategoryStrip categories={categories.slice(0, 6)} />

      <div className="mx-auto max-w-7xl space-y-24 px-6 py-20 sm:py-24">
        <Reveal>
          <FeaturedCarousel books={featured} title="Featured Books" />
        </Reveal>

        {arrivals.length > 0 && (
          <Reveal>
            <section aria-label="Recently added">
              <div className="mb-8">
                <p className="label-eyebrow">Fresh on the shelves</p>
                <h2 className="mt-3 font-serif text-3xl text-cream sm:text-4xl">
                  Recently Added
                </h2>
                <div className="mt-4 h-[3px] w-16 bg-crimson" />
              </div>
              <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
                {arrivals.map((book) => (
                  <BookCard key={book.id} book={book} />
                ))}
              </div>
            </section>
          </Reveal>
        )}

        {categories.length > 0 && (
          <Reveal>
            <section aria-label="Explore categories">
              <div className="mb-8 flex items-end justify-between gap-6">
                <div>
                  <p className="label-eyebrow">Find your shelf</p>
                  <h2 className="mt-3 font-serif text-3xl text-cream sm:text-4xl">
                    Explore Categories
                  </h2>
                  <div className="mt-4 h-[3px] w-16 bg-crimson" />
                </div>
                <Link
                  href="/categories"
                  className="shrink-0 font-sans text-xs font-medium uppercase tracking-[0.22em] text-sand transition-colors hover:text-gold"
                >
                  View All <span aria-hidden="true">→</span>
                </Link>
              </div>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {categories.map((cat) => (
                  <CategoryCard key={cat.id} category={cat} />
                ))}
              </div>
            </section>
          </Reveal>
        )}

        <Reveal>
          <section aria-label="Why Columnist" className="border-y border-gold/15 py-16">
            <p className="label-eyebrow text-center">Why Columnist</p>
            <h2 className="mt-4 text-center font-serif text-3xl text-cream sm:text-4xl">
              More Than Books.
            </h2>
            <p className="mx-auto mt-6 max-w-2xl text-center font-sans text-base leading-relaxed text-sand">
              Ideas shape the way we see the world. Columnist makes meaningful
              books, knowledge and perspectives easier to discover and read.
            </p>
            <div className="mt-12 grid gap-10 sm:grid-cols-3">
              {WHY.map((item) => (
                <div key={item.eyebrow} className="text-center">
                  <p className="label-eyebrow !text-gold">{item.eyebrow}</p>
                  <p className="mt-4 font-serif text-lg italic text-cream">{item.text}</p>
                </div>
              ))}
            </div>
          </section>
        </Reveal>

        <Reveal>
          <section aria-label="Editorial quote" className="py-8 text-center">
            <span aria-hidden="true" className="font-serif text-6xl leading-none text-ember">
              ❝
            </span>
            <blockquote className="mx-auto mt-2 max-w-3xl font-serif text-2xl italic leading-relaxed text-cream sm:text-3xl">
              A good book is a conversation with the best minds of the past.
            </blockquote>
          </section>
        </Reveal>

        <Reveal>
          <section
            aria-label="Begin your library"
            className="card-dark px-8 py-16 text-center sm:py-20"
          >
            <p className="label-eyebrow">Your next chapter</p>
            <h2 className="mt-4 font-serif text-3xl text-cream sm:text-5xl">
              Begin your library.
            </h2>
            <p className="mx-auto mt-5 max-w-xl font-sans text-sm leading-relaxed text-sand">
              Request the books that speak to you — once verified, they are
              yours to read online or download, wherever you go.
            </p>
            <Link href="/books" className="btn-crimson mt-9">
              Browse Books <span aria-hidden="true">→</span>
            </Link>
          </section>
        </Reveal>
      </div>
    </>
  );
}
