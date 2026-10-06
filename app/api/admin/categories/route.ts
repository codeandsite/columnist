import { guardAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { slugify } from "@/lib/utils";

export async function GET() {
  const g = await guardAdmin();
  if (!g.ok) return g.response;

  const supabase = createAdminClient();

  const [{ data: categories, error }, linksRes] = await Promise.all([
    supabase.from("categories").select("*").order("name", { ascending: true }),
    supabase.from("book_categories").select("category_id"),
  ]);
  if (error) return Response.json({ error: error.message }, { status: 500 });

  const counts = new Map<string, number>();
  for (const row of (linksRes.data ?? []) as { category_id: string }[]) {
    counts.set(row.category_id, (counts.get(row.category_id) ?? 0) + 1);
  }

  return Response.json({
    categories: (categories ?? []).map((c: any) => ({
      ...c,
      book_count: counts.get(c.id) ?? 0,
    })),
  });
}

export async function POST(request: Request) {
  const g = await guardAdmin();
  if (!g.ok) return g.response;

  const body = await request.json();
  const name = (body.name as string | undefined)?.trim();
  if (!name) return Response.json({ error: "Name is required." }, { status: 400 });

  const slug = ((body.slug as string | undefined)?.trim() || slugify(name)) || "category";
  if (!slug) return Response.json({ error: "Could not derive a slug." }, { status: 400 });

  const supabase = createAdminClient();

  const { data: existing } = await supabase.from("categories").select("id").eq("slug", slug).maybeSingle();
  if (existing) {
    return Response.json({ error: "A category with this slug already exists." }, { status: 409 });
  }

  const { data, error } = await supabase
    .from("categories")
    .insert({
      name,
      slug,
      description: body.description?.trim() || null,
      image_url: body.image_url?.trim() || null,
    })
    .select("*")
    .single();
  if (error) return Response.json({ error: error.message }, { status: 500 });

  return Response.json({ category: { ...data, book_count: 0 } }, { status: 201 });
}
