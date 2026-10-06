import { guardAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { slugify } from "@/lib/utils";
import type { Book, Category } from "@/lib/types";

/** Shape books with a flattened `categories` array from the join. */
function withCategories(row: any): Book & { categories: Category[] } {
  const cats: Category[] = (row.book_categories ?? [])
    .map((bc: any) => bc.category)
    .filter(Boolean);
  const { book_categories, ...rest } = row;
  return { ...rest, categories: cats };
}

async function uniqueSlug(supabase: ReturnType<typeof createAdminClient>, base: string): Promise<string> {
  let slug = base;
  let n = 2;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { data } = await supabase.from("books").select("id").eq("slug", slug).maybeSingle();
    if (!data) return slug;
    slug = `${base}-${n++}`;
  }
}

export async function GET(request: Request) {
  const g = await guardAdmin();
  if (!g.ok) return g.response;

  const q = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  const supabase = createAdminClient();

  let query = supabase
    .from("books")
    .select(
      "*, book_categories(category:categories!book_categories_category_id_fkey(id, name, slug))"
    )
    .order("updated_at", { ascending: false });

  if (q) {
    query = query.or(`title.ilike.%${q}%,author.ilike.%${q}%`);
  }

  const { data, error } = await query;
  if (error) return Response.json({ error: error.message }, { status: 500 });

  return Response.json({ books: (data ?? []).map(withCategories) });
}

export async function POST(request: Request) {
  const g = await guardAdmin();
  if (!g.ok) return g.response;

  const body = await request.json();
  const title = (body.title as string | undefined)?.trim();
  if (!title) return Response.json({ error: "Title is required." }, { status: 400 });

  const supabase = createAdminClient();

  const slug = await uniqueSlug(supabase, slugify(title) || "book");

  const rawPrice = body.price === undefined || body.price === null || body.price === "" ? 0 : Number(body.price);
  if (Number.isNaN(rawPrice) || rawPrice < 0) {
    return Response.json({ error: "Price must be a non-negative number." }, { status: 400 });
  }

  const { data: book, error } = await supabase
    .from("books")
    .insert({
      title,
      slug,
      author: (body.author as string | undefined)?.trim() || "Unknown",
      short_description: body.short_description?.trim() || null,
      description: body.description?.trim() || null,
      price: rawPrice,
      featured: Boolean(body.featured),
      published: Boolean(body.published),
    })
    .select("*")
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });

  const categoryIds = Array.isArray(body.category_ids)
    ? (body.category_ids as unknown[]).filter((c): c is string => typeof c === "string" && c.length > 0)
    : [];

  let categories: Category[] = [];
  if (categoryIds.length > 0) {
    // Only link categories that actually exist.
    const { data: valid } = await supabase.from("categories").select("id, name, slug").in("id", categoryIds);
    const found = (valid ?? []) as Category[];
    categories = found;
    if (found.length > 0) {
      const rows = found.map((c) => ({ book_id: book.id as string, category_id: c.id }));
      const { error: linkError } = await supabase.from("book_categories").insert(rows);
      if (linkError) return Response.json({ error: linkError.message }, { status: 500 });
    }
  }

  return Response.json({ book: { ...(book as Book), categories } }, { status: 201 });
}
