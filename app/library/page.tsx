import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { guardUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { coverUrl } from "@/lib/storage";
import { formatDate } from "@/lib/utils";
import BookCover from "@/components/BookCover";
import EmptyState from "@/components/Skeletons";
import Reveal from "@/components/Reveal";
import DownloadPdfButton from "@/components/DownloadPdfButton";

export const dynamic = "force-dynamic";

interface ProgressMap {
  [bookId: string]: { progress: number; last_opened: string };
}

export default async function LibraryPage() {
  const g = await guardUser();
  if (!g.ok) redirect("/login?next=/library");
  const supabase = createClient();

  const { data: accessRows } = await supabase
    .from("book_access")
    .select("book_id, granted_at, book:books(id,title,slug,author,cover_path,pdf_path)")
    .eq("user_id", g.userId)
    .order("granted_at", { ascending: false });

  const { data: progressRows } = await supabase
    .from("reading_progress")
    .select("book_id, progress, last_opened")
    .eq("user_id", g.userId);

  const progressByBook: ProgressMap = {};
  for (const p of progressRows ?? []) {
    progressByBook[p.book_id] = { progress: p.progress ?? 0, last_opened: p.last_opened };
  }

  const items = (accessRows ?? [])
    .map((row) => {
      const book = (Array.isArray(row.book) ? row.book[0] : row.book) as {
        id: string;
        title: string;
        slug: string;
        author: string | null;
        cover_path: string | null;
        pdf_path: string | null;
      } | null;
      return book ? { ...book, progress: progressByBook[book.id] ?? null } : null;
    })
    .filter((b): b is NonNullable<typeof b> => b !== null);

  return (
    <div className="mx-auto max-w-6xl px-5 py-12 sm:px-8">
      <Reveal>
        <p className="label-eyebrow">Your collection</p>
        <h1 className="mt-3 font-serif text-4xl text-cream sm:text-5xl">My Library</h1>
        <p className="mt-3 font-sans text-sm text-clay">
          Your collection of ideas, stories and knowledge.
        </p>
      </Reveal>

      {items.length === 0 ? (
        <div className="card-dark mt-10">
          <EmptyState
            title="Your library is empty."
            message="Books you get access to will appear here."
            action={
              <Link href="/books" className="btn-crimson">
                Browse Books
              </Link>
            }
          />
        </div>
      ) : (
        <div className="mt-10 grid grid-cols-2 gap-5 sm:gap-6 lg:grid-cols-4">
          {items.map((book, i) => {
            const img = coverUrl(book.cover_path);
            const pct = book.progress
              ? Math.min(100, Math.max(0, Math.round(book.progress.progress)))
              : 0;
            return (
              <Reveal key={book.id} delay={Math.min(i, 7) * 60}>
                <div className="card-dark flex h-full flex-col overflow-hidden">
                  <div className="relative aspect-[2/3] overflow-hidden">
                    {img ? (
                      <Image
                        src={img}
                        alt={`Cover of ${book.title}`}
                        fill
                        sizes="(max-width: 640px) 50vw, 25vw"
                        className="object-cover"
                      />
                    ) : (
                      <BookCover title={book.title} author={book.author} compact className="h-full w-full" />
                    )}
                    <Link
                      href={`/read/${book.id}`}
                      aria-label={`Read ${book.title}`}
                      className="absolute inset-0 bg-ink/0 transition-colors hover:bg-ink/30"
                    />
                  </div>
                  <div className="flex flex-1 flex-col p-4">
                    <h3 className="line-clamp-2 font-serif text-base leading-snug text-cream">
                      <Link href={`/read/${book.id}`} className="hover:text-gold">
                        {book.title}
                      </Link>
                    </h3>
                    {book.author && (
                      <p className="mt-1 truncate font-sans text-[11px] uppercase tracking-[0.18em] text-clay">
                        {book.author}
                      </p>
                    )}
                    <div className="mt-3 flex items-center gap-2">
                      <div
                        className="h-1 flex-1 bg-cream/10"
                        role="progressbar"
                        aria-valuenow={pct}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label={`Reading progress for ${book.title}`}
                      >
                        <div className="h-1 bg-gold" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="font-sans text-xs text-sand">{pct}%</span>
                    </div>
                    {book.progress && (
                      <p className="mt-1.5 font-sans text-[11px] text-clay">
                        Last opened {formatDate(book.progress.last_opened)}
                      </p>
                    )}
                    <div className="mt-4 flex flex-col gap-2">
                      <Link href={`/read/${book.id}`} className="btn-crimson px-4 py-2 text-center text-xs">
                        Read Now
                      </Link>
                      {book.pdf_path && (
                        <DownloadPdfButton bookId={book.id} title={book.title} slug={book.slug} />
                      )}
                    </div>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      )}
    </div>
  );
}
