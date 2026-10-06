import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import BookCard from "@/components/BookCard";
import Reveal from "@/components/Reveal";
import EmptyState from "@/components/Skeletons";
import { createClient } from "@/lib/supabase/server";
import type { Book, Category } from "@/lib/types";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://columnist.site";

async function getCategory(slug: string): Promise<Category | null> {
  const supabase = createClient();
  const { data } = await supabase
    .from("categories")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  return (data as Category | null) ?? null;
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const category = await getCategory(params.slug);
  if (!category) return { title: "Category not found" };
  return {
    title: `${category.name} · Columnist`,
    description: category.description ?? `Books in ${category.name} on Columnist.`,
    alternates: { canonical: `${siteUrl}/categories/${category.slug}` },
  };
}

export default async function CategoryDetailPage({ params }: { params: { slug: string } }) {
  const category = await getCategory(params.slug);
  if (!category) notFound();

  const supabase = createClient();
  const { data, count } = await supabase
    .from("books")
    .select("*, book_categories!inner(category:categories(id,name,slug))", {
      count: "exact",
    })
    .eq("published", true)
    .eq("book_categories.category_id", category.id)
    .order("created_at", { ascending: false });

  const books = (data ?? []) as Book[];
  const total = count ?? books.length;

  return (
    <div className="mx-auto max-w-7xl px-6 py-14 sm:py-20">
      <Reveal>
        <p className="label-eyebrow">Category</p>
        <h1 className="mt-4 font-serif text-4xl text-cream sm:text-5xl">
          {category.name}
        </h1>
        {category.description && (
          <p className="mt-4 max-w-2xl font-sans text-base leading-relaxed text-sand">
            {category.description}
          </p>
        )}
        <p className="mt-5 font-sans text-xs uppercase tracking-[0.24em] text-clay">
          {total} {total === 1 ? "book" : "books"}
        </p>
      </Reveal>

      {books.length > 0 ? (
        <div className="mt-12 grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
          {books.map((book) => (
            <BookCard key={book.id} book={book} />
          ))}
        </div>
      ) : (
        <div className="mt-12">
          <EmptyState
            title="No books on this shelf yet."
            message={`We are still curating ${category.name}. Check back soon.`}
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
