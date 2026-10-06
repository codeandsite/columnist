import { guardAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { slugify } from "@/lib/utils";

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const g = await guardAdmin();
  if (!g.ok) return g.response;

  const supabase = createAdminClient();
  const body = await request.json();

  const patch: Record<string, unknown> = {};
  if (body.name !== undefined) {
    const name = (body.name as string).trim();
    if (!name) return Response.json({ error: "Name cannot be empty." }, { status: 400 });
    patch.name = name;
  }
  if (body.slug !== undefined) {
    const slug = ((body.slug as string).trim() || slugify((body.name as string) ?? "")) || "";
    if (!slug) return Response.json({ error: "Slug cannot be empty." }, { status: 400 });
    const { data: clash } = await supabase
      .from("categories")
      .select("id")
      .eq("slug", slug)
      .neq("id", params.id)
      .maybeSingle();
    if (clash) {
      return Response.json({ error: "A category with this slug already exists." }, { status: 409 });
    }
    patch.slug = slug;
  }
  if (body.description !== undefined) {
    patch.description = (body.description as string)?.trim() || null;
  }
  if (body.image_url !== undefined) {
    patch.image_url = (body.image_url as string)?.trim() || null;
  }

  if (Object.keys(patch).length === 0) {
    return Response.json({ error: "Nothing to update." }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("categories")
    .update(patch)
    .eq("id", params.id)
    .select("*")
    .single();
  if (error) return Response.json({ error: error.message }, { status: 500 });
  if (!data) return Response.json({ error: "Category not found." }, { status: 404 });

  const { count } = await supabase
    .from("book_categories")
    .select("book_id", { count: "exact", head: true })
    .eq("category_id", params.id);

  return Response.json({ category: { ...data, book_count: count ?? 0 } });
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const g = await guardAdmin();
  if (!g.ok) return g.response;

  const supabase = createAdminClient();

  const { count, error: countError } = await supabase
    .from("book_categories")
    .select("book_id", { count: "exact", head: true })
    .eq("category_id", params.id);
  if (countError) return Response.json({ error: countError.message }, { status: 500 });
  if ((count ?? 0) > 0) {
    return Response.json(
      {
        error: `Category has ${count} linked book${count === 1 ? "" : "s"}. Remove the books from this category first.`,
      },
      { status: 400 }
    );
  }

  const { error } = await supabase.from("categories").delete().eq("id", params.id);
  if (error) return Response.json({ error: error.message }, { status: 500 });

  return Response.json({ ok: true });
}
