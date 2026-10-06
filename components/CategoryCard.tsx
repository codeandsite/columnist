import Link from "next/link";
import type { CategoryWithCount } from "@/components/categories-with-counts";

export default function CategoryCard({ category }: { category: CategoryWithCount }) {
  return (
    <Link
      href={`/categories/${category.slug}`}
      className="card-dark group flex h-full flex-col p-7 transition-all duration-300 hover:-translate-y-1.5 hover:border-gold/40 hover:shadow-lift"
    >
      <div className="rule-gold mb-5 transition-all duration-300 group-hover:w-24" />
      <h3 className="font-serif text-2xl text-cream transition-colors group-hover:text-gold">
        {category.name}
      </h3>
      {category.description && (
        <p className="mt-3 line-clamp-2 font-sans text-sm leading-relaxed text-clay">
          {category.description}
        </p>
      )}
      <div className="mt-auto flex items-center justify-between pt-6">
        <span className="font-sans text-[11px] uppercase tracking-[0.24em] text-sand">
          {category.bookCount} {category.bookCount === 1 ? "book" : "books"}
        </span>
        <span
          aria-hidden="true"
          className="text-gold transition-transform duration-300 group-hover:translate-x-1.5"
        >
          →
        </span>
      </div>
    </Link>
  );
}
