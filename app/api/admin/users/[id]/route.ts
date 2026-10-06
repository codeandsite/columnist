import { guardAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Book, BookAccess, Membership, Profile, PurchaseRequest, ReadingProgress } from "@/lib/types";

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const g = await guardAdmin();
  if (!g.ok) return g.response;

  const supabase = createAdminClient();

  const [{ data: profile, error: profileError }, accessRes, requestsRes, progressRes] =
    await Promise.all([
      supabase.from("profiles").select("*").eq("id", params.id).single(),
      supabase
        .from("book_access")
        .select("*, book:books!book_access_book_id_fkey(*)")
        .eq("user_id", params.id)
        .order("granted_at", { ascending: false }),
      supabase
        .from("purchase_requests")
        .select("*, book:books!purchase_requests_book_id_fkey(*)")
        .eq("user_id", params.id)
        .order("requested_at", { ascending: false }),
      supabase
        .from("reading_progress")
        .select("*, book:books!reading_progress_book_id_fkey(*)")
        .eq("user_id", params.id)
        .order("last_opened", { ascending: false }),
    ]);

  if (profileError || !profile) {
    return Response.json({ error: "User not found." }, { status: 404 });
  }

  return Response.json({
    profile: profile as Profile,
    library: ((accessRes.data ?? []) as BookAccess[]).map((a) => ({
      ...a,
      book: (a as any).book as Book,
    })),
    requests: ((requestsRes.data ?? []) as PurchaseRequest[]).map((r) => ({
      ...r,
      book: (r as any).book as Book,
    })),
    progress: ((progressRes.data ?? []) as ReadingProgress[]).map((p) => ({
      ...p,
      book: (p as any).book as Book,
    })),
  });
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const g = await guardAdmin();
  if (!g.ok) return g.response;

  const body = await request.json();
  const membership = body.membership as Membership | undefined;
  if (membership !== "free" && membership !== "pro") {
    return Response.json({ error: "membership must be 'free' or 'pro'." }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("profiles")
    .update({ membership })
    .eq("id", params.id)
    .select("*")
    .single();
  if (error) return Response.json({ error: error.message }, { status: 500 });
  if (!data) return Response.json({ error: "User not found." }, { status: 404 });

  return Response.json({ profile: data as Profile });
}
