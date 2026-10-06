import { guardAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const g = await guardAdmin();
  if (!g.ok) return g.response;

  const supabase = createAdminClient();
  const { data, error } = await supabase.from("site_settings").select("key, value");
  if (error) return Response.json({ error: error.message }, { status: 500 });

  const settings: Record<string, string> = {};
  for (const row of (data ?? []) as { key: string; value: string }[]) {
    settings[row.key] = row.value;
  }

  return Response.json({ settings });
}

export async function POST(request: Request) {
  const g = await guardAdmin();
  if (!g.ok) return g.response;

  const body = await request.json();
  const settings = body.settings as Record<string, unknown> | undefined;
  if (!settings || typeof settings !== "object") {
    return Response.json({ error: "Body must be { settings: { key: value } }." }, { status: 400 });
  }

  const rows = Object.entries(settings)
    .filter(([key, value]) => key.trim() !== "" && typeof value === "string")
    .map(([key, value]) => ({ key: key.trim(), value: value as string }));

  if (rows.length === 0) return Response.json({ ok: true });

  const supabase = createAdminClient();
  const { error } = await supabase.from("site_settings").upsert(rows, { onConflict: "key" });
  if (error) return Response.json({ error: error.message }, { status: 500 });

  return Response.json({ ok: true });
}
