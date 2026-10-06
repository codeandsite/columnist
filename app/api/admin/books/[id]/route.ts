import { guardAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Book, Category } from "@/lib/types";

function withCategories(row: any): Book & { categories: Category[] } {
  const cats: Category[] = (row.book_categories ?? [])
    .map((bc: any) => bc.category)
    .filter(Boolean);
  const { book_categories, ...rest } = row;
  return { ...rest, categories: cats };
}

const BOOK_SELECT =
  "*, book_categories(category:categories!book_categories_category_id_fkey(id, name, slug))";

async function getBook(supabase: ReturnType<typeof createAdminClient>, id: string) {
  return supabase.from("books").select(BOOK_SELECT).eq("id", id).single();
}

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const g = await guardAdmin();
  if (!g.ok) return g.response;

  const supabase = createAdminClient();
  const { data, error } = await getBook(supabase, params.id);
  if (error || !data) return Response.json({ error: "Book not found." }, { status: 404 });

  return Response.json({ book: withCategories(data) });
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const g = await guardAdmin();
  if (!g.ok) return g.response;

  const supabase = createAdminClient();
  const body = await request.json();

  const patch: Record<string, unknown> = {};
  for (const key of ["title", "author", "short_description", "description"] as const) {
    if (body[key] !== undefined) {
      const v = body[key];
      if (typeof v === "string" && v.trim() === "") {
        if (key === "title" || key === "author") {
          return Response.json({ error: `${key} cannot be empty.` }, { status: 400 });
        }
        patch[key] = null;
      } else {
        patch[key] = v;
      }
    }
  }
  if (body.price !== undefined && body.price !== null) {
    const n = body.price === "" ? 0 : Number(body.price);
    if (Number.isNaN(n) || n < 0) {
      return Response.json({ error: "Price must be a non-negative number." }, { status: 400 });
    }
    patch.price = n;
  }
  if (body.featured !== undefined) patch.featured = Boolean(body.featured);
  if (body.published !== undefined) patch.published = Boolean(body.published);

  // NOTE: slug stays stable even when the title changes.

  if (Object.keys(patch).length > 0) {
    const { error } = await supabase.from("books").update(patch).eq("id", params.id);
    if (error) return Response.json({ error: error.message }, { status: 500 });
  }

  if (body.category_ids !== undefined) {
    const categoryIds = Array.isArray(body.category_ids)
      ? (body.category_ids as unknown[]).filter((c): c is string => typeof c === "string" && c.length > 0)
      : [];
    const { error: delError } = await supabase.from("book_categories").delete().eq("book_id", params.id);
    if (delError) return Response.json({ error: delError.message }, { status: 500 });
    if (categoryIds.length > 0) {
      const { data: valid } = await supabase.from("categories").select("id").in("id", categoryIds);
      const found = ((valid ?? []) as { id: string }[]).map((c) => c.id);
      if (found.length > 0) {
        const rows = found.map((category_id) => ({ book_id: params.id, category_id }));
        const { error: insError } = await supabase.from("book_categories").insert(rows);
        if (insError) return Response.json({ error: insError.message }, { status: 500 });
      }
    }
  }

  const { data, error } = await getBook(supabase, params.id);
  if (error || !data) return Response.json({ error: "Book not found." }, { status: 404 });

  return Response.json({ book: withCategories(data) });
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const g = await guardAdmin();
  if (!g.ok) return g.response;

  const supabase = createAdminClient();

  const { data: book } = await supabase
    .from("books")
    .select("cover_path, epub_path, pdf_path")
    .eq("id", params.id)
    .single();

  const { error } = await supabase.from("books").delete().eq("id", params.id);
  if (error) return Response.json({ error: error.message }, { status: 500 });

  // Best-effort storage cleanup — never fail the request on storage errors.
  if (book) {
    const targets: Array<[string, string | null]> = [
      ["book-covers", book.cover_path as string | null],
      ["book-epubs", book.epub_path as string | null],
      ["book-pdfs", book.pdf_path as string | null],
    ];
    for (const [bucket, path] of targets) {
      if (!path) continue;
      try {
        await supabase.storage.from(bucket).remove([path]);
      } catch {
        /* ignore */
      }
    }
  }

  return Response.json({ ok: true });
}
