import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";

/**
 * Server-side auth guards for API routes and server components.
 *
 * Usage in a route handler:
 *   const g = await guardUser();          // or guardAdmin()
 *   if (!g.ok) return g.response;
 *   // g.userId, g.email, g.profile are now typed non-null
 *
 * Usage in a server component:
 *   const g = await guardAdmin();
 *   if (!g.ok) redirect("/login");
 */
export interface GuardSuccess {
  ok: true;
  userId: string;
  email: string | null;
  profile: Profile | null;
}

export interface GuardFailure {
  ok: false;
  response: Response;
}

export type Guard = GuardSuccess | GuardFailure;

async function baseGuard(): Promise<
  | { userId: string; email: string | null; profile: Profile | null }
  | null
> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();
  return {
    userId: user.id,
    email: user.email ?? null,
    profile: (profile as Profile | null) ?? null,
  };
}

export async function guardUser(): Promise<Guard> {
  const base = await baseGuard();
  if (!base) {
    return {
      ok: false,
      response: Response.json({ error: "Authentication required." }, { status: 401 }),
    };
  }
  return { ok: true, ...base };
}

export async function guardAdmin(): Promise<Guard> {
  const g = await guardUser();
  if (!g.ok) return g;
  if (g.profile?.role !== "admin") {
    return {
      ok: false,
      response: Response.json({ error: "Admin access required." }, { status: 403 }),
    };
  }
  return g;
}
