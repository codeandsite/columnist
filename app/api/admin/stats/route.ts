import { guardAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const g = await guardAdmin();
  if (!g.ok) return g.response;

  const supabase = createAdminClient();

  const [
    { count: totalBooks },
    { count: totalUsers },
    { count: proUsers },
    { count: totalCategories },
    { count: pendingRequests },
    { count: approvedRequests },
    recentUsersRes,
    recentRequestsRes,
  ] = await Promise.all([
    supabase.from("books").select("id", { count: "exact", head: true }),
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("membership", "pro"),
    supabase.from("categories").select("id", { count: "exact", head: true }),
    supabase.from("purchase_requests").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("purchase_requests").select("id", { count: "exact", head: true }).eq("status", "approved"),
    supabase
      .from("profiles")
      .select("id, full_name, email, membership, created_at")
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("purchase_requests")
      .select(
        "id, status, requested_at, profile:profiles!purchase_requests_user_id_fkey(full_name, email), book:books!purchase_requests_book_id_fkey(title)"
      )
      .order("requested_at", { ascending: false })
      .limit(6),
  ]);

  return Response.json({
    totalBooks: totalBooks ?? 0,
    totalUsers: totalUsers ?? 0,
    proUsers: proUsers ?? 0,
    totalCategories: totalCategories ?? 0,
    pendingRequests: pendingRequests ?? 0,
    approvedRequests: approvedRequests ?? 0,
    recentUsers: recentUsersRes.data ?? [],
    recentRequests: recentRequestsRes.data ?? [],
  });
}
