import { createAdminClient } from "@/lib/supabase/admin";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** POST /api/contact — public contact form. Body {name, email, subject?, message}. */
export async function POST(req: Request) {
  let body: { name?: unknown; email?: unknown; subject?: unknown; message?: unknown };
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const subject = typeof body.subject === "string" ? body.subject.trim() : "";
  const message = typeof body.message === "string" ? body.message.trim() : "";

  if (!name) {
    return Response.json({ error: "Please tell us your name." }, { status: 400 });
  }
  if (!email) {
    return Response.json({ error: "Please provide your email address." }, { status: 400 });
  }
  if (!EMAIL_RE.test(email)) {
    return Response.json({ error: "That email address doesn't look valid." }, { status: 400 });
  }
  if (!message) {
    return Response.json({ error: "Please write your message." }, { status: 400 });
  }

  const admin = createAdminClient();
  const { error } = await admin.from("contact_submissions").insert({
    name,
    email,
    subject: subject || null,
    message,
  });
  if (error) {
    return Response.json(
      { error: "Could not send your message. Please try again." },
      { status: 500 }
    );
  }
  return Response.json({ ok: true }, { status: 201 });
}
