import { guardAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const g = await guardAdmin();
  if (!g.ok) return g.response;

  const q = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  const supabase = createAdminClient();

  let query = supabase
    .from("profiles")
    .select("id, full_name, email, membership, role, created_at")
    .order("created_at", { ascending: false });

  if (q) {
    query = query.or(`full_name.ilike.%${q}%,email.ilike.%${q}%`);
  }

  const [{ data: users, error }, accessRes] = await Promise.all([
    query,
    supabase.from("book_access").select("user_id"),
  ]);
  if (error) return Response.json({ error: error.message }, { status: 500 });

  const counts = new Map<string, number>();
  for (const row of (accessRes.data ?? []) as { user_id: string }[]) {
    counts.set(row.user_id, (counts.get(row.user_id) ?? 0) + 1);
  }

  return Response.json({
    users: (users ?? []).map((u: any) => ({
      ...u,
      book_count: counts.get(u.id) ?? 0,
    })),
  });
}
