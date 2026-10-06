import { guardAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

type Kind = "cover" | "epub" | "pdf";

const KINDS: Record<
  Kind,
  {
    bucket: string;
    column: "cover_path" | "epub_path" | "pdf_path";
    exts: string[];
    mimes: string[];
    maxMB: number;
    path: (bookId: string, ext: string) => string;
  }
> = {
  cover: {
    bucket: "book-covers",
    column: "cover_path",
    exts: ["jpg", "jpeg", "png", "webp"],
    mimes: ["image/jpeg", "image/jpg", "image/png", "image/webp"],
    maxMB: 8,
    path: (bookId, ext) => `covers/${bookId}.${ext}`,
  },
  epub: {
    bucket: "book-epubs",
    column: "epub_path",
    exts: ["epub"],
    mimes: ["application/epub+zip", "application/x-epub+zip", "application/octet-stream", ""],
    maxMB: 100,
    path: (bookId) => `epubs/${bookId}.epub`,
  },
  pdf: {
    bucket: "book-pdfs",
    column: "pdf_path",
    exts: ["pdf"],
    mimes: ["application/pdf", "application/octet-stream", ""],
    maxMB: 100,
    path: (bookId) => `pdfs/${bookId}.pdf`,
  },
};

function extOf(name: string): string {
  const parts = name.toLowerCase().split(".");
  return parts.length > 1 ? parts[parts.length - 1] : "";
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const g = await guardAdmin();
  if (!g.ok) return g.response;

  const supabase = createAdminClient();

  const { data: book, error: bookError } = await supabase
    .from("books")
    .select("id")
    .eq("id", params.id)
    .single();
  if (bookError || !book) return Response.json({ error: "Book not found." }, { status: 404 });

  const form = await request.formData();
  const kindRaw = form.get("kind");
  const file = form.get("file");

  const kind = (typeof kindRaw === "string" ? kindRaw : "") as Kind;
  const cfg = KINDS[kind];
  if (!cfg) return Response.json({ error: "Invalid kind. Use cover, epub or pdf." }, { status: 400 });
  if (!(file instanceof File)) return Response.json({ error: "No file provided." }, { status: 400 });

  if (file.size > cfg.maxMB * 1024 * 1024) {
    return Response.json(
      { error: `File is too large. Maximum ${cfg.maxMB} MB for ${kind}.` },
      { status: 400 }
    );
  }

  const ext = extOf(file.name);
  if (!cfg.exts.includes(ext)) {
    return Response.json(
      { error: `Invalid file type. ${kind} must be ${cfg.exts.map((e) => `.${e}`).join(", ")}.` },
      { status: 400 }
    );
  }
  if (file.type && !cfg.mimes.includes(file.type)) {
    return Response.json({ error: `Invalid file MIME type (${file.type}).` }, { status: 400 });
  }

  const storagePath = cfg.path(params.id, ext);
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: upError } = await supabase.storage
    .from(cfg.bucket)
    .upload(storagePath, buffer, {
      upsert: true,
      contentType: file.type || undefined,
    });
  if (upError) return Response.json({ error: upError.message }, { status: 500 });

  const { error: dbError } = await supabase
    .from("books")
    .update({ [cfg.column]: storagePath })
    .eq("id", params.id);
  if (dbError) return Response.json({ error: dbError.message }, { status: 500 });

  // Public URL only for covers. EPUB/PDF live in private buckets — never public.
  const url =
    kind === "cover"
      ? supabase.storage.from(cfg.bucket).getPublicUrl(storagePath).data.publicUrl
      : null;

  return Response.json({ path: storagePath, url });
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const g = await guardAdmin();
  if (!g.ok) return g.response;

  const kind = new URL(request.url).searchParams.get("kind") as Kind | null;
  const cfg = kind ? KINDS[kind] : undefined;
  if (!cfg) return Response.json({ error: "Invalid kind. Use ?kind=cover|epub|pdf." }, { status: 400 });

  const supabase = createAdminClient();

  const { data: book, error: bookError } = await supabase
    .from("books")
    .select(`id, ${cfg.column}`)
    .eq("id", params.id)
    .single();
  if (bookError || !book) return Response.json({ error: "Book not found." }, { status: 404 });

  const path = (book as Record<string, string | null>)[cfg.column];
  if (path) {
    const { error: rmError } = await supabase.storage.from(cfg.bucket).remove([path]);
    if (rmError) return Response.json({ error: rmError.message }, { status: 500 });
  }

  const { error: dbError } = await supabase
    .from("books")
    .update({ [cfg.column]: null })
    .eq("id", params.id);
  if (dbError) return Response.json({ error: dbError.message }, { status: 500 });

  return Response.json({ ok: true });
}
