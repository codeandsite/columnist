import Image from "next/image";
import { guardAdmin } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatDate, formatDateTime, formatPKR, initials } from "@/lib/utils";
import { avatarUrl } from "@/lib/storage";
import { coverUrl } from "@/lib/storage";
import StatusBadge, { MembershipBadge } from "@/components/admin/StatusBadge";
import MembershipToggle from "@/components/admin/MembershipToggle";
import EmptyState from "@/components/Skeletons";
import type { Book, BookAccess, Profile, PurchaseRequest, ReadingProgress } from "@/lib/types";

export default async function UserDetailPage({ params }: { params: { id: string } }) {
  const g = await guardAdmin();
  if (!g.ok) redirect("/");

  const supabase = createAdminClient();

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", params.id).single();
  if (!profile) redirect("/admin/users");

  const p = profile as Profile;

  const [accessRes, requestsRes, progressRes] = await Promise.all([
    supabase
      .from("book_access")
      .select("*, book:books!book_access_book_id_fkey(*)")
      .eq("user_id", params.id)
      .order("granted_at", { ascending: false }),
    supabase
      .from("purchase_requests")
      .select("*, book:books!purchase_requests_book_id_fkey(*)")
      .eq("user_id", params.id)
      .order("requested_at", { ascending: false }),
    supabase
      .from("reading_progress")
      .select("*, book:books!reading_progress_book_id_fkey(*)")
      .eq("user_id", params.id)
      .order("last_opened", { ascending: false }),
  ]);

  const library = ((accessRes.data ?? []) as BookAccess[]).map((a) => ({
    ...a,
    book: (a as any).book as Book | null,
  }));
  const requests = ((requestsRes.data ?? []) as PurchaseRequest[]).map((r) => ({
    ...r,
    book: (r as any).book as Book | null,
  }));
  const progress = ((progressRes.data ?? []) as ReadingProgress[]).map((x) => ({
    ...x,
    book: (x as any).book as Book | null,
  }));

  const avatar = avatarUrl(p.avatar_url);

  const stats = [
    { label: "Books in Library", value: library.length },
    { label: "Purchase Requests", value: requests.length },
    { label: "Books Started", value: progress.length },
  ];

  return (
    <div>
      <p className="label-eyebrow">
        <Link href="/admin/users" className="hover:text-gold">Users</Link>
        <span className="mx-2 text-clay">/</span> Detail
      </p>

      {/* Header */}
      <div className="card-dark mt-8 flex flex-wrap items-center gap-6 p-6 lg:p-8">
        {avatar ? (
          <Image src={avatar} alt={p.full_name ?? "User"} width={80} height={80} className="h-20 w-20 rounded-full border border-gold/40 object-cover" />
        ) : (
          <span className="flex h-20 w-20 items-center justify-center rounded-full border border-gold/40 bg-wine font-serif text-3xl text-gold">
            {initials(p.full_name)}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <h1 className="truncate font-serif text-3xl text-cream">{p.full_name ?? "Unnamed User"}</h1>
          <p className="mt-1 font-sans text-sm text-clay">{p.email ?? "—"}</p>
          <div className="mt-3 flex items-center gap-3">
            <MembershipBadge membership={p.membership} />
            <span className="font-sans text-xs text-clay">Joined {formatDate(p.created_at)}</span>
          </div>
        </div>
        <MembershipToggle userId={p.id} userName={p.full_name} current={p.membership} />
      </div>

      {/* Stats */}
      <div className="mt-6 grid grid-cols-3 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="card-dark p-6">
            <p className="label-eyebrow">{s.label}</p>
            <p className="mt-3 font-serif text-4xl text-cream">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Library */}
      <section className="mt-10">
        <h2 className="font-serif text-2xl text-cream">Library Access</h2>
        <div className="rule-gold mt-3" />
        <div className="mt-6">
          {library.length === 0 ? (
            <EmptyState title="No books granted" message="This user has no library access yet." />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {library.map((a) => (
                <div key={a.id} className="card-dark flex items-center gap-4 p-4">
                  <div className="relative aspect-[2/3] w-12 shrink-0">
                    {a.book?.cover_path ? (
                      <Image src={coverUrl(a.book.cover_path) ?? ""} alt="" fill sizes="48px" className="object-cover" />
                    ) : (
                      <div className="flex aspect-[2/3] w-12 items-center justify-center bg-wine font-serif text-lg text-gold">
                        {initials(a.book?.title)}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-sans text-sm font-medium text-cream">{a.book?.title ?? "Deleted book"}</p>
                    <p className="mt-1 font-sans text-xs text-clay">Granted {formatDate(a.granted_at)}</p>
                    <p className="font-sans text-xs text-clay">{formatPKR(a.book?.price)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Request history */}
      <section className="mt-10">
        <h2 className="font-serif text-2xl text-cream">Request History</h2>
        <div className="rule-gold mt-3" />
        <div className="mt-6">
          {requests.length === 0 ? (
            <EmptyState title="No requests" message="This user has never requested a book." />
          ) : (
            <div className="overflow-x-auto border border-cream/10 bg-coal">
              <table className="table-dark w-full min-w-[640px]">
                <thead>
                  <tr>
                    <th>Book</th>
                    <th>Status</th>
                    <th>Requested</th>
                    <th>Approved</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((r) => (
                    <tr key={r.id}>
                      <td className="text-cream">{r.book?.title ?? "Deleted book"}</td>
                      <td><StatusBadge status={r.status} /></td>
                      <td className="whitespace-nowrap text-clay">{formatDateTime(r.requested_at)}</td>
                      <td className="whitespace-nowrap text-clay">{formatDateTime(r.approved_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {/* Reading progress */}
      <section className="mt-10">
        <h2 className="font-serif text-2xl text-cream">Reading Progress</h2>
        <div className="rule-gold mt-3" />
        <div className="mt-6">
          {progress.length === 0 ? (
            <EmptyState title="Nothing started" message="This user has not opened any book yet." />
          ) : (
            <div className="space-y-4">
              {progress.map((x) => {
                const pct = Math.min(100, Math.max(0, Number(x.progress ?? 0)));
                return (
                  <div key={x.id} className="card-dark p-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="font-sans text-sm font-medium text-cream">{x.book?.title ?? "Deleted book"}</p>
                      <p className="font-sans text-xs text-sand">
                        {pct >= 100 ? "Completed" : `${Math.round(pct)}%`} · last opened {formatDateTime(x.last_opened)}
                      </p>
                    </div>
                    <div className="mt-3 h-1.5 w-full bg-cream/10">
                      <div className="h-1.5 bg-gold transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
