import { guardAdmin } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";

interface BookStat {
  id: string;
  title: string;
  readers: number;
  started: number;
  avgProgress: number;
  completed: number;
}

export default async function AdminAnalyticsPage() {
  const g = await guardAdmin();
  if (!g.ok) redirect("/");

  const supabase = createAdminClient();

  const [booksRes, accessRes, progressRes] = await Promise.all([
    supabase.from("books").select("id, title").order("title", { ascending: true }),
    supabase.from("book_access").select("book_id"),
    supabase.from("reading_progress").select("book_id, progress"),
  ]);

  const books = ((booksRes.data ?? []) as { id: string; title: string }[]);

  const readersByBook = new Map<string, number>();
  for (const row of (accessRes.data ?? []) as { book_id: string }[]) {
    readersByBook.set(row.book_id, (readersByBook.get(row.book_id) ?? 0) + 1);
  }

  const progressByBook = new Map<string, number[]>();
  for (const row of (progressRes.data ?? []) as { book_id: string; progress: number | string | null }[]) {
    const list = progressByBook.get(row.book_id) ?? [];
    list.push(Number(row.progress ?? 0));
    progressByBook.set(row.book_id, list);
  }

  const stats: BookStat[] = books.map((b) => {
    const progresses = progressByBook.get(b.id) ?? [];
    const started = progresses.length;
    const avgProgress = started > 0 ? progresses.reduce((a, v) => a + v, 0) / started : 0;
    const completed = progresses.filter((v) => v >= 100).length;
    return {
      id: b.id,
      title: b.title,
      readers: readersByBook.get(b.id) ?? 0,
      started,
      avgProgress: Math.round(avgProgress),
      completed,
    };
  });

  const totalReaders = stats.reduce((a, s) => a + s.readers, 0);
  const totalCompleted = stats.reduce((a, s) => a + s.completed, 0);

  return (
    <div>
      <p className="label-eyebrow">Insights</p>
      <h1 className="mt-3 font-serif text-4xl text-cream">Reading Analytics</h1>
      <div className="rule-gold mt-5" />

      <div className="mt-10 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="card-dark p-6">
          <p className="label-eyebrow">Total Readers</p>
          <p className="mt-4 font-serif text-4xl text-cream">{totalReaders}</p>
          <p className="mt-2 font-sans text-xs text-clay">Library access grants across all books</p>
        </div>
        <div className="card-dark p-6">
          <p className="label-eyebrow">Books Completed</p>
          <p className="mt-4 font-serif text-4xl text-cream">{totalCompleted}</p>
          <p className="mt-2 font-sans text-xs text-clay">Reads that reached 100% progress</p>
        </div>
        <div className="card-dark p-6">
          <p className="label-eyebrow">Books Tracked</p>
          <p className="mt-4 font-serif text-4xl text-cream">{stats.length}</p>
          <p className="mt-2 font-sans text-xs text-clay">Books in the catalog</p>
        </div>
        <div className="card-dark p-6">
          <p className="label-eyebrow">Completion Rate</p>
          <p className="mt-4 font-serif text-4xl text-cream">
            {totalReaders > 0 ? Math.round((totalCompleted / totalReaders) * 100) : 0}%
          </p>
          <p className="mt-2 font-sans text-xs text-clay">Completed ÷ readers</p>
        </div>
      </div>

      <div className="mt-10">
        {stats.length === 0 ? (
          <div className="card-dark p-10 text-center">
            <p className="font-serif text-2xl text-cream">No books yet</p>
            <p className="mt-2 font-sans text-sm text-clay">Analytics will appear once books are added.</p>
          </div>
        ) : (
          <div className="overflow-x-auto border border-cream/10 bg-coal">
            <table className="table-dark w-full min-w-[720px]">
              <thead>
                <tr>
                  <th>Book</th>
                  <th>Readers</th>
                  <th>Started</th>
                  <th>Avg Progress</th>
                  <th>Completed</th>
                </tr>
              </thead>
              <tbody>
                {stats.map((s) => (
                  <tr key={s.id}>
                    <td>
                      <Link href={`/admin/books/${s.id}`} className="font-medium text-cream hover:text-gold">
                        {s.title}
                      </Link>
                    </td>
                    <td>
                      <span className="inline-flex min-w-[2rem] items-center justify-center border border-gold/40 px-2 py-0.5 font-sans text-xs text-gold">
                        {s.readers}
                      </span>
                    </td>
                    <td className="text-cream">{s.started}</td>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="h-1.5 w-28 bg-cream/10">
                          <div className="h-1.5 bg-gold" style={{ width: `${Math.min(100, s.avgProgress)}%` }} />
                        </div>
                        <span className="font-sans text-xs text-sand">{s.avgProgress}%</span>
                      </div>
                    </td>
                    <td className="text-cream">{s.completed}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
