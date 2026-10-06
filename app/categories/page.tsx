import type { Metadata } from "next";
import Link from "next/link";
import CategoryCard from "@/components/CategoryCard";
import Reveal from "@/components/Reveal";
import EmptyState from "@/components/Skeletons";
import { getCategoriesWithCounts } from "@/components/categories-with-counts";

export const metadata: Metadata = {
  title: "Browse Categories",
  description:
    "Explore the Columnist library by category — history, philosophy, science, literature and more.",
};

export default async function CategoriesPage() {
  const categories = await getCategoriesWithCounts();

  return (
    <div className="mx-auto max-w-7xl px-6 py-14 sm:py-20">
      <Reveal>
        <p className="label-eyebrow">Find your shelf</p>
        <h1 className="mt-4 font-serif text-4xl text-cream sm:text-5xl">
          Browse Categories
        </h1>
        <p className="mt-4 max-w-xl font-sans text-base leading-relaxed text-sand">
          Every shelf is curated with intent. Choose a discipline and find the
          books that move it forward.
        </p>
      </Reveal>

      {categories.length > 0 ? (
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((cat, i) => (
            <Reveal key={cat.id} delay={Math.min(i * 60, 300)}>
              <CategoryCard category={cat} />
            </Reveal>
          ))}
        </div>
      ) : (
        <div className="mt-12">
          <EmptyState
            title="No categories yet."
            message="Our shelves are being arranged. Please check back soon."
            action={
              <Link href="/books" className="btn-outline">
                Browse all books
              </Link>
            }
          />
        </div>
      )}
    </div>
  );
}
