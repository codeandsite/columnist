import { guardAdmin } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatDate, formatDateTime, classNames } from "@/lib/utils";
import StatusBadge, { MembershipBadge } from "@/components/admin/StatusBadge";
import Reveal from "@/components/Reveal";

export default async function AdminDashboard() {
  const g = await guardAdmin();
  if (!g.ok) redirect("/");

  const supabase = createAdminClient();

  const [
    { count: totalBooks },
    { count: totalUsers },
    { count: proUsers },
    { count: totalCategories },
    { count: pendingRequests },
    { count: approvedRequests },
    recentUsersRes,
    recentRequestsRes,
  ] = await Promise.all([
    supabase.from("books").select("id", { count: "exact", head: true }),
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("membership", "pro"),
    supabase.from("categories").select("id", { count: "exact", head: true }),
    supabase.from("purchase_requests").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("purchase_requests").select("id", { count: "exact", head: true }).eq("status", "approved"),
    supabase
      .from("profiles")
      .select("id, full_name, email, membership, created_at")
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("purchase_requests")
      .select(
        "id, status, requested_at, profile:profiles!purchase_requests_user_id_fkey(full_name, email), book:books!purchase_requests_book_id_fkey(title)"
      )
      .order("requested_at", { ascending: false })
      .limit(6),
  ]);

  const stats = [
    { label: "Total Books", value: totalBooks ?? 0, href: "/admin/books", accent: false },
    { label: "Total Users", value: totalUsers ?? 0, href: "/admin/users", accent: false },
    { label: "PRO Users", value: proUsers ?? 0, href: "/admin/users", accent: false },
    { label: "Categories", value: totalCategories ?? 0, href: "/admin/categories", accent: false },
    { label: "Pending Requests", value: pendingRequests ?? 0, href: "/admin/requests", accent: (pendingRequests ?? 0) > 0 },
    { label: "Approved Requests", value: approvedRequests ?? 0, href: "/admin/requests", accent: false },
  ];

  const recentUsers = (recentUsersRes.data ?? []) as any[];
  const recentRequests = (recentRequestsRes.data ?? []) as any[];

  return (
    <div>
      <p className="label-eyebrow">Admin Panel</p>
      <h1 className="mt-3 font-serif text-4xl text-cream">Dashboard</h1>
      <div className="rule-gold mt-5" />

      <Reveal>
        <div className="mt-10 grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
          {stats.map((s) => (
            <Link
              key={s.label}
              href={s.href}
              className={classNames(
                "card-dark block p-6 transition-colors hover:border-gold/40",
                s.accent && "border-ember/60"
              )}
            >
              <p className="label-eyebrow">{s.label}</p>
              <p className={classNames("mt-4 font-serif text-4xl", s.accent ? "text-ember" : "text-cream")}>
                {s.value}
              </p>
            </Link>
          ))}
        </div>
      </Reveal>

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        {/* Recent users */}
        <div className="card-dark p-6">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="font-serif text-2xl text-cream">Recent Users</h2>
            <Link href="/admin/users" className="font-sans text-xs uppercase tracking-[0.18em] text-gold hover:text-cream">
              View all
            </Link>
          </div>
          {recentUsers.length === 0 ? (
            <p className="py-8 text-center font-sans text-sm text-clay">No users yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="table-dark w-full">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Plan</th>
                    <th>Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {recentUsers.map((u) => (
                    <tr key={u.id}>
                      <td>
                        <Link href={`/admin/users/${u.id}`} className="hover:text-gold">
                          {u.full_name ?? "—"}
                        </Link>
                      </td>
                      <td className="text-clay">{u.email ?? "—"}</td>
                      <td><MembershipBadge membership={u.membership} /></td>
                      <td className="text-clay">{formatDate(u.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Recent requests */}
        <div className="card-dark p-6">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="font-serif text-2xl text-cream">Recent Requests</h2>
            <Link href="/admin/requests" className="font-sans text-xs uppercase tracking-[0.18em] text-gold hover:text-cream">
              View all
            </Link>
          </div>
          {recentRequests.length === 0 ? (
            <p className="py-8 text-center font-sans text-sm text-clay">No purchase requests yet.</p>
          ) : (
            <ul className="divide-y divide-cream/10">
              {recentRequests.map((r) => (
                <li key={r.id} className="flex items-center justify-between gap-4 py-4">
                  <div className="min-w-0">
                    <p className="truncate font-sans text-sm text-cream">
                      {r.profile?.full_name ?? r.profile?.email ?? "Unknown user"}
                      <span className="text-clay"> requested </span>
                      {r.book?.title ?? "a book"}
                    </p>
                    <p className="mt-1 font-sans text-xs text-clay">{formatDateTime(r.requested_at)}</p>
                  </div>
                  <StatusBadge status={r.status} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
