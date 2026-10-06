import { guardAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(_request: Request, { params }: { params: { id: string } }) {
  const g = await guardAdmin();
  if (!g.ok) return g.response;

  const supabase = createAdminClient();

  const { data: req, error: fetchError } = await supabase
    .from("purchase_requests")
    .select("id, user_id, book_id, status")
    .eq("id", params.id)
    .single();
  if (fetchError || !req) {
    return Response.json({ error: "Request not found." }, { status: 404 });
  }
  if (req.status !== "pending") {
    return Response.json({ error: `Request is already ${req.status}.` }, { status: 400 });
  }

  // 1. Approve the request.
  const { error: approveError } = await supabase
    .from("purchase_requests")
    .update({
      status: "approved",
      approved_at: new Date().toISOString(),
      approved_by: g.userId,
    })
    .eq("id", params.id);
  if (approveError) return Response.json({ error: approveError.message }, { status: 500 });

  // 2. Grant library access (one-click: request approved + access granted).
  const { error: accessError } = await supabase.from("book_access").upsert(
    {
      user_id: req.user_id,
      book_id: req.book_id,
      granted_by: g.userId,
      granted_at: new Date().toISOString(),
      status: "active",
    },
    { onConflict: "user_id,book_id" }
  );

  if (accessError) {
    // Approval already succeeded — surface the access failure as a warning.
    return Response.json({
      ok: true,
      warning: `Request approved, but granting library access failed: ${accessError.message}`,
    });
  }

  return Response.json({ ok: true });
}
