import { guardUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * GET /api/books/[id]/pdf-url — mint a time-limited signed URL for the
 * book's PDF download. Verified server-side against book_access.
 */
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const g = await guardUser();
  if (!g.ok) return g.response;
  const admin = createAdminClient();

  const { data: access } = await admin
    .from("book_access")
    .select("id")
    .eq("user_id", g.userId)
    .eq("book_id", params.id)
    .maybeSingle();
  if (!access && g.profile?.role !== "admin") {
    return Response.json({ error: "You don't have access to this book." }, { status: 403 });
  }

  const { data: book } = await admin
    .from("books")
    .select("id,slug,pdf_path")
    .eq("id", params.id)
    .maybeSingle();
  if (!book) {
    return Response.json({ error: "Book not found." }, { status: 404 });
  }
  if (!book.pdf_path) {
    return Response.json({ error: "This book has no downloadable file yet." }, { status: 404 });
  }

  const { data, error } = await admin.storage
    .from("book-pdfs")
    .createSignedUrl(book.pdf_path, 3600);
  if (error || !data?.signedUrl) {
    return Response.json(
      { error: "Could not prepare the download. Please try again." },
      { status: 500 }
    );
  }
  return Response.json({ url: data.signedUrl, filename: `${book.slug}.pdf` });
}
