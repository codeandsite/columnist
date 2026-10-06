import { guardAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(_request: Request, { params }: { params: { id: string } }) {
  const g = await guardAdmin();
  if (!g.ok) return g.response;

  const supabase = createAdminClient();

  const { data: req, error: fetchError } = await supabase
    .from("purchase_requests")
    .select("id, status")
    .eq("id", params.id)
    .single();
  if (fetchError || !req) {
    return Response.json({ error: "Request not found." }, { status: 404 });
  }
  if (req.status !== "pending") {
    return Response.json({ error: `Request is already ${req.status}.` }, { status: 400 });
  }

  const { error } = await supabase
    .from("purchase_requests")
    .update({
      status: "rejected",
      rejected_at: new Date().toISOString(),
    })
    .eq("id", params.id);
  if (error) return Response.json({ error: error.message }, { status: 500 });

  return Response.json({ ok: true });
}
