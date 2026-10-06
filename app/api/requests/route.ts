import { guardUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { PurchaseRequest } from "@/lib/types";

const BOOK_JOIN = "id,title,slug,author,cover_path,price";

/** GET /api/requests — own purchase requests, or ?book_id= for single-book status. */
export async function GET(req: Request) {
  const g = await guardUser();
  if (!g.ok) return g.response;
  const supabase = createClient();
  const { searchParams } = new URL(req.url);
  const bookId = searchParams.get("book_id");

  if (bookId) {
    const { data: access } = await supabase
      .from("book_access")
      .select("id")
      .eq("user_id", g.userId)
      .eq("book_id", bookId)
      .maybeSingle();
    const hasAccess = !!access || g.profile?.role === "admin";
    const { data: request } = await supabase
      .from("purchase_requests")
      .select("*")
      .eq("user_id", g.userId)
      .eq("book_id", bookId)
      .order("requested_at", { ascending: false })
      .maybeSingle();
    return Response.json({
      request: (request as PurchaseRequest | null) ?? null,
      hasAccess,
    });
  }

  const { data: requests } = await supabase
    .from("purchase_requests")
    .select(`*, book:books(${BOOK_JOIN})`)
    .eq("user_id", g.userId)
    .order("requested_at", { ascending: false });
  return Response.json({ requests: (requests as PurchaseRequest[]) ?? [] });
}

/** POST /api/requests — request access to a book. Body {book_id}. */
export async function POST(req: Request) {
  const g = await guardUser();
  if (!g.ok) return g.response;
  const supabase = createClient();

  let body: { book_id?: unknown };
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  const bookId = typeof body.book_id === "string" ? body.book_id : null;
  if (!bookId) {
    return Response.json({ error: "book_id is required." }, { status: 400 });
  }

  const { data: book } = await supabase
    .from("books")
    .select("id,published")
    .eq("id", bookId)
    .maybeSingle();
  if (!book || !book.published) {
    return Response.json({ error: "This book is not available." }, { status: 400 });
  }

  const { data: access } = await supabase
    .from("book_access")
    .select("id")
    .eq("user_id", g.userId)
    .eq("book_id", bookId)
    .maybeSingle();
  if (access) {
    return Response.json({ error: "You already have access to this book." }, { status: 409 });
  }

  const { data: pending } = await supabase
    .from("purchase_requests")
    .select("id")
    .eq("user_id", g.userId)
    .eq("book_id", bookId)
    .eq("status", "pending")
    .maybeSingle();
  if (pending) {
    return Response.json(
      { error: "You already have a pending request for this book." },
      { status: 409 }
    );
  }

  const { data: inserted, error } = await supabase
    .from("purchase_requests")
    .insert({ user_id: g.userId, book_id: bookId, status: "pending" })
    .select()
    .single();
  if (error) {
    // Partial unique index race — treat as duplicate pending request.
    if (error.code === "23505") {
      return Response.json(
        { error: "You already have a pending request for this book." },
        { status: 409 }
      );
    }
    return Response.json(
      { error: "Could not submit your request. Please try again." },
      { status: 500 }
    );
  }

  return Response.json(
    {
      request: inserted,
      message:
        "Your request has been received. Access will be activated after payment verification.",
    },
    { status: 201 }
  );
}
