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

export const dynamic = "force-dynamic";

const STATS = [
  { key: "myBooks", label: "My Books" },
  { key: "reading", label: "Reading" },
  { key: "completed", label: "Completed" },
  { key: "pendingRequests", label: "Pending Requests" },
] as const;

export default async function DashboardPage() {
  const g = await guardUser();
  if (!g.ok) redirect("/login?next=/dashboard");
  const supabase = createClient();
  const userId = g.userId;

  const [
    { count: myBooks },
    { count: reading },
    { count: completed },
    { count: pendingRequests },
  ] = await Promise.all([
    supabase.from("book_access").select("*", { count: "exact", head: true }).eq("user_id", userId),
    supabase
      .from("reading_progress")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .gt("progress", 0)
      .lt("progress", 100),
    supabase
      .from("reading_progress")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("progress", 100),
    supabase
      .from("purchase_requests")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("status", "pending"),
  ]);

  const counts: Record<(typeof STATS)[number]["key"], number> = {
    myBooks: myBooks ?? 0,
    reading: reading ?? 0,
    completed: completed ?? 0,
    pendingRequests: pendingRequests ?? 0,
  };

  const { data: recent } = await supabase
    .from("reading_progress")
    .select("book_id, progress, last_opened, book:books(id,title,slug,author,cover_path)")
    .eq("user_id", userId)
    .order("last_opened", { ascending: false })
    .limit(6);

  const firstName = g.profile?.full_name?.trim().split(/\s+/)[0] || "Reader";
  const recentItems = (recent ?? []).filter((r) => r.book);

  return (
    <div className="mx-auto max-w-6xl px-5 py-12 sm:px-8">
      <Reveal>
        <p className="label-eyebrow">Your reading room</p>
        <h1 className="mt-3 font-serif text-4xl text-cream sm:text-5xl">
          Welcome back, {firstName}.
        </h1>
      </Reveal>

      <Reveal delay={80}>
        <div className="mt-10 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {STATS.map((s) => (
            <div key={s.key} className="card-dark px-6 py-7">
              <p className="font-serif text-4xl text-gold">{counts[s.key]}</p>
              <p className="label-eyebrow mt-3">{s.label}</p>
            </div>
          ))}
        </div>
      </Reveal>

      <Reveal delay={140}>
        <div className="mt-14">
          <div className="flex items-baseline justify-between">
            <h2 className="font-serif text-2xl text-cream sm:text-3xl">Recently Opened</h2>
            <Link href="/library" className="font-sans text-xs uppercase tracking-[0.2em] text-sand hover:text-gold">
              View library →
            </Link>
          </div>

          {recentItems.length === 0 ? (
            <div className="card-dark mt-6">
              <EmptyState
                title="No reading activity yet."
                message="Books you open will appear here, with your progress kept exactly where you left off."
                action={
                  <Link href="/books" className="btn-crimson">
                    Browse Books
                  </Link>
                }
              />
            </div>
          ) : (
            <ul className="mt-6 divide-y divide-cream/10 border-y border-cream/10">
              {recentItems.map((r) => {
                const book = (Array.isArray(r.book) ? r.book[0] : r.book) as {
                  id: string;
                  title: string;
                  author: string | null;
                  cover_path: string | null;
                };
                const img = coverUrl(book.cover_path);
                const pct = Math.min(100, Math.max(0, Math.round(r.progress ?? 0)));
                return (
                  <li key={r.book_id} className="flex items-center gap-5 py-5">
                    <div className="relative h-20 w-14 shrink-0 overflow-hidden border border-cream/10">
                      {img ? (
                        <Image src={img} alt={`Cover of ${book.title}`} fill sizes="56px" className="object-cover" />
                      ) : (
                        <BookCover title={book.title} author={book.author} compact className="h-full w-full" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-serif text-lg text-cream">{book.title}</p>
                      {book.author && (
                        <p className="mt-0.5 font-sans text-xs uppercase tracking-[0.18em] text-clay">
                          {book.author}
                        </p>
                      )}
                      <div className="mt-3 flex items-center gap-3">
                        <div className="h-1 w-full max-w-xs bg-cream/10" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={`Reading progress for ${book.title}`}>
                          <div className="h-1 bg-gold" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="font-sans text-xs text-sand">{pct}%</span>
                        <span className="hidden font-sans text-xs text-clay sm:inline">
                          · Opened {formatDate(r.last_opened)}
                        </span>
                      </div>
                    </div>
                    <Link
                      href={`/read/${r.book_id}`}
                      className="btn-outline shrink-0 px-4 py-2 text-xs"
                    >
                      Continue →
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </Reveal>
    </div>
  );
}
