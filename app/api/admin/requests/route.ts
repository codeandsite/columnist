import { guardAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

const VALID_STATUS = ["all", "pending", "approved", "rejected"] as const;

export async function GET(request: Request) {
  const g = await guardAdmin();
  if (!g.ok) return g.response;

  const params = new URL(request.url).searchParams;
  const status = params.get("status") ?? "all";
  const q = params.get("q")?.trim().toLowerCase() ?? "";

  if (!(VALID_STATUS as readonly string[]).includes(status)) {
    return Response.json({ error: "Invalid status filter." }, { status: 400 });
  }

  const supabase = createAdminClient();

  let query = supabase
    .from("purchase_requests")
    .select(
      "id, status, requested_at, approved_at, profile:profiles!purchase_requests_user_id_fkey(full_name, email), book:books!purchase_requests_book_id_fkey(id, title, price, cover_path)"
    )
    .order("requested_at", { ascending: false });

  if (status !== "all") {
    query = query.eq("status", status);
  }

  const { data, error } = await query;
  if (error) return Response.json({ error: error.message }, { status: 500 });

  let requests = (data ?? []) as any[];
  if (q) {
    requests = requests.filter((r) => {
      const name = (r.profile?.full_name ?? "").toLowerCase();
      const email = (r.profile?.email ?? "").toLowerCase();
      const title = (r.book?.title ?? "").toLowerCase();
      return name.includes(q) || email.includes(q) || title.includes(q);
    });
  }

  return Response.json({ requests });
}
