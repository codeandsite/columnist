import { guardUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { ReadingProgress } from "@/lib/types";

async function hasAccess(supabase: ReturnType<typeof createClient>, userId: string, bookId: string, role: string | null) {
  if (role === "admin") return true;
  const { data } = await supabase
    .from("book_access")
    .select("id")
    .eq("user_id", userId)
    .eq("book_id", bookId)
    .maybeSingle();
  return !!data;
}

/** GET /api/progress?book_id= — the user's saved reading progress for a book. */
export async function GET(req: Request) {
  const g = await guardUser();
  if (!g.ok) return g.response;
  const supabase = createClient();
  const { searchParams } = new URL(req.url);
  const bookId = searchParams.get("book_id");
  if (!bookId) {
    return Response.json({ error: "book_id is required." }, { status: 400 });
  }

  const { data } = await supabase
    .from("reading_progress")
    .select("*")
    .eq("user_id", g.userId)
    .eq("book_id", bookId)
    .maybeSingle();
  return Response.json({ progress: (data as ReadingProgress | null) ?? null });
}

/** POST /api/progress — save reading position. Body {book_id, location, progress}. */
export async function POST(req: Request) {
  const g = await guardUser();
  if (!g.ok) return g.response;
  const supabase = createClient();

  let body: { book_id?: unknown; location?: unknown; progress?: unknown };
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  const bookId = typeof body.book_id === "string" ? body.book_id : null;
  if (!bookId) {
    return Response.json({ error: "book_id is required." }, { status: 400 });
  }

  const allowed = await hasAccess(supabase, g.userId, bookId, g.profile?.role ?? null);
  if (!allowed) {
    return Response.json({ error: "You don't have access to this book." }, { status: 403 });
  }

  const location = typeof body.location === "string" && body.location.length > 0 ? body.location : null;
  const rawProgress = typeof body.progress === "number" && Number.isFinite(body.progress) ? body.progress : 0;
  const progress = Math.min(100, Math.max(0, Math.round(rawProgress)));

  const now = new Date().toISOString();
  const { error } = await supabase.from("reading_progress").upsert(
    {
      user_id: g.userId,
      book_id: bookId,
      location,
      progress,
      last_opened: now,
      updated_at: now,
    },
    { onConflict: "user_id,book_id" }
  );
  if (error) {
    return Response.json({ error: "Could not save your progress. Please try again." }, { status: 500 });
  }
  return Response.json({ ok: true });
}
