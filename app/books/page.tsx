import type { Metadata } from "next";
import Link from "next/link";
import BookCard from "@/components/BookCard";
import Pagination from "@/components/Pagination";
import EmptyState from "@/components/Skeletons";
import { getCategoriesWithCounts } from "@/components/categories-with-counts";
import { createClient } from "@/lib/supabase/server";
import type { Book } from "@/lib/types";

export const metadata: Metadata = {
  title: "Explore Books",
  description:
    "Discover stories, ideas and knowledge worth carrying with you. Browse the Columnist library.",
};

const PAGE_SIZE = 12;

const SORTS = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "az", label: "Title A–Z" },
  { value: "za", label: "Title Z–A" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
];

interface Filters {
  q: string;
  categorySlug: string;
  author: string;
  maxPrice: number | null;
  featured: boolean;
  sort: string;
  page: number;
}

type SearchParams = { [key: string]: string | string[] | undefined };

function parseFilters(sp: SearchParams): Filters {
  const first = (v: string | string[] | undefined) =>
    Array.isArray(v) ? v[0] ?? "" : v ?? "";
  const rawMax = first(sp.maxPrice);
  const rawPage = parseInt(first(sp.page), 10);
  const sort = first(sp.sort);
  return {
    q: first(sp.q).trim(),
    categorySlug: first(sp.category).trim(),
    author: first(sp.author).trim(),
    maxPrice: rawMax !== "" && !Number.isNaN(Number(rawMax)) ? Number(rawMax) : null,
    featured: first(sp.featured) === "1" || first(sp.featured) === "true",
    sort: SORTS.some((s) => s.value === sort) ? sort : "newest",
    page: Number.isNaN(rawPage) || rawPage < 1 ? 1 : rawPage,
  };
}

export default async function BooksPage({ searchParams }: { searchParams: SearchParams }) {
  const supabase = createClient();
  const f = parseFilters(searchParams);

  // Resolve category slug → id (an unknown slug yields an empty result).
  let categoryId: string | null = null;
  if (f.categorySlug) {
    const { data: cat } = await supabase
      .from("categories")
      .select("id")
      .eq("slug", f.categorySlug)
      .maybeSingle();
    categoryId = cat ? (cat as { id: string }).id : "none";
  }

  const joinSelect = categoryId
    ? "book_categories!inner(category:categories(id,name,slug))"
    : "book_categories(category:categories(id,name,slug))";

  /** Shared filter/sort logic for both the count query and the paged query. */
  const filteredQuery = (head: boolean) => {
    let query = supabase
      .from("books")
      .select(head ? `id,${joinSelect}` : `*,${joinSelect}`, {
        count: "exact",
        head,
      })
      .eq("published", true);
    if (categoryId) query = query.eq("book_categories.category_id", categoryId);
    if (f.q) {
      const like = `%${f.q.replace(/[%,_\\]/g, "")}%`;
      query = query.or(
        `title.ilike.${like},author.ilike.${like},short_description.ilike.${like},description.ilike.${like}`
      );
    }
    if (f.author) query = query.eq("author", f.author);
    if (f.maxPrice !== null) query = query.lte("price", f.maxPrice);
    if (f.featured) query = query.eq("featured", true);
    switch (f.sort) {
      case "oldest":
        query = query.order("created_at", { ascending: true });
        break;
      case "az":
        query = query.order("title", { ascending: true });
        break;
      case "za":
        query = query.order("title", { ascending: false });
        break;
      case "price-asc":
        query = query.order("price", { ascending: true });
        break;
      case "price-desc":
        query = query.order("price", { ascending: false });
        break;
      default:
        query = query.order("created_at", { ascending: false });
    }
    return query;
  };

  const [{ count }, authorsRes, categories] = await Promise.all([
    categoryId === "none"
      ? Promise.resolve({ count: 0 as number | null })
      : filteredQuery(true),
    supabase.from("books").select("author").eq("published", true),
    getCategoriesWithCounts(),
  ]);

  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(f.page, totalPages);

  let books: Book[] = [];
  if (categoryId !== "none" && total > 0) {
    const from = (page - 1) * PAGE_SIZE;
    const { data } = await filteredQuery(false).range(from, from + PAGE_SIZE - 1);
    books = (data ?? []) as Book[];
  }

  const authors = Array.from(
    new Set(
      ((authorsRes.data ?? []) as Array<{ author: string | null }>).map(
        (r) => r.author ?? ""
      )
    )
  )
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b));

  const preserved = new URLSearchParams();
  if (f.q) preserved.set("q", f.q);
  if (f.categorySlug) preserved.set("category", f.categorySlug);
  if (f.author) preserved.set("author", f.author);
  if (f.maxPrice !== null) preserved.set("maxPrice", String(f.maxPrice));
  if (f.featured) preserved.set("featured", "1");
  if (f.sort !== "newest") preserved.set("sort", f.sort);
  const makeHref = (p: number) => {
    const params = new URLSearchParams(preserved);
    if (p > 1) params.set("page", String(p));
    const qs = params.toString();
    return qs ? `/books?${qs}` : "/books";
  };

  const filtersForm = (
    <form action="/books" method="get" className="space-y-6">
      <div>
        <label htmlFor="f-q" className="label-eyebrow mb-3 block">
          Search
        </label>
        <input
          id="f-q"
          name="q"
          type="search"
          defaultValue={f.q}
          placeholder="Title, author, keyword…"
          className="input-dark"
        />
      </div>
      <div>
        <label htmlFor="f-cat" className="label-eyebrow mb-3 block">
          Category
        </label>
        <select id="f-cat" name="category" defaultValue={f.categorySlug} className="input-dark">
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="f-author" className="label-eyebrow mb-3 block">
          Author
        </label>
        <select id="f-author" name="author" defaultValue={f.author} className="input-dark">
          <option value="">All authors</option>
          {authors.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="f-price" className="label-eyebrow mb-3 block">
          Max price (PKR)
        </label>
        <input
          id="f-price"
          name="maxPrice"
          type="number"
          min={0}
          defaultValue={f.maxPrice ?? ""}
          placeholder="No limit"
          className="input-dark"
        />
      </div>
      <div>
        <label htmlFor="f-sort" className="label-eyebrow mb-3 block">
          Sort by
        </label>
        <select id="f-sort" name="sort" defaultValue={f.sort} className="input-dark">
          {SORTS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </div>
      <label className="flex cursor-pointer items-center gap-3 font-sans text-sm text-sand">
        <input
          type="checkbox"
          name="featured"
          value="1"
          defaultChecked={f.featured}
          className="h-4 w-4 accent-[#8e1b21]"
        />
        Featured only
      </label>
      <div className="flex gap-3 pt-2">
        <button type="submit" className="btn-crimson flex-1 !px-6 !py-3">
          Apply
        </button>
        <Link href="/books" className="btn-outline !px-6 !py-3">
          Clear
        </Link>
      </div>
    </form>
  );

  return (
    <div className="mx-auto max-w-7xl px-6 py-14 sm:py-20">
      <p className="label-eyebrow">The Library</p>
      <h1 className="mt-4 font-serif text-4xl text-cream sm:text-5xl">Explore Books</h1>
      <p className="mt-4 max-w-xl font-sans text-base leading-relaxed text-sand">
        Discover stories, ideas and knowledge worth carrying with you.
      </p>

      {/* Mobile filters */}
      <details className="card-dark mt-10 lg:hidden">
        <summary className="cursor-pointer px-6 py-4 font-sans text-xs font-medium uppercase tracking-[0.22em] text-cream">
          Filters & search
        </summary>
        <div className="border-t border-cream/10 px-6 py-6">{filtersForm}</div>
      </details>

      <div className="mt-10 flex gap-10 lg:mt-12">
        {/* Desktop sidebar */}
        <aside className="hidden w-64 shrink-0 lg:block">
          <div className="card-dark sticky top-24 p-6">{filtersForm}</div>
        </aside>

        {/* Results */}
        <div className="min-w-0 flex-1">
          <p className="mb-6 font-sans text-xs uppercase tracking-[0.24em] text-clay">
            {total} {total === 1 ? "book" : "books"} found
          </p>
          {books.length > 0 ? (
            <>
              <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3">
                {books.map((book) => (
                  <BookCard key={book.id} book={book} />
                ))}
              </div>
              <Pagination page={page} totalPages={totalPages} makeHref={makeHref} />
            </>
          ) : (
            <EmptyState
              title="No books found."
              message="Try adjusting your search or filters."
              action={
                <Link href="/books" className="btn-outline">
                  Clear filters
                </Link>
              }
            />
          )}
        </div>
      </div>
    </div>
  );
}
