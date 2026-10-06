import { guardUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";

/** GET /api/profile — the current user's profile. */
export async function GET() {
  const g = await guardUser();
  if (!g.ok) return g.response;
  return Response.json({ profile: g.profile });
}

/** PATCH /api/profile — update name / avatar. Body {full_name?, avatar_url?}. */
export async function PATCH(req: Request) {
  const g = await guardUser();
  if (!g.ok) return g.response;
  const supabase = createClient();

  let body: { full_name?: unknown; avatar_url?: unknown };
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const updates: { full_name?: string; avatar_url?: string | null; updated_at: string } = {
    updated_at: new Date().toISOString(),
  };

  if (body.full_name !== undefined) {
    const name = typeof body.full_name === "string" ? body.full_name.trim() : "";
    if (!name) {
      return Response.json({ error: "Name cannot be empty." }, { status: 400 });
    }
    updates.full_name = name;
  }

  if (body.avatar_url !== undefined) {
    if (body.avatar_url !== null && typeof body.avatar_url !== "string") {
      return Response.json({ error: "Invalid avatar." }, { status: 400 });
    }
    updates.avatar_url = (body.avatar_url as string | null) || null;
  }

  // Updated through the user-scoped server client: RLS lets the user update
  // their own row but blocks role / membership changes.
  const { data, error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", g.userId)
    .select()
    .single();
  if (error) {
    return Response.json({ error: "Could not update your profile. Please try again." }, { status: 500 });
  }
  return Response.json({ profile: data as Profile });
}

/** PUT /api/profile — change password. Body {newPassword}. */
export async function PUT(req: Request) {
  const g = await guardUser();
  if (!g.ok) return g.response;
  const supabase = createClient();

  let body: { newPassword?: unknown };
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  const newPassword = typeof body.newPassword === "string" ? body.newPassword : "";
  if (newPassword.length < 6) {
    return Response.json(
      { error: "Password must be at least 6 characters long." },
      { status: 400 }
    );
  }

  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) {
    return Response.json({ error: error.message || "Could not update your password." }, { status: 400 });
  }
  return Response.json({ ok: true });
}
