"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useToast } from "@/components/Toast";
import ConfirmDialog from "@/components/ConfirmDialog";
import { MembershipBadge } from "@/components/admin/StatusBadge";
import EmptyState, { TableSkeleton } from "@/components/Skeletons";
import { formatDate, debounce, initials } from "@/lib/utils";

interface UserRow {
  id: string;
  full_name: string | null;
  email: string | null;
  membership: "free" | "pro";
  role: string;
  created_at: string;
  book_count: number;
}

export default function AdminUsersPage() {
  const { toast } = useToast();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [confirmTarget, setConfirmTarget] = useState<UserRow | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async (q: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/users${q ? `?q=${encodeURIComponent(q)}` : ""}`);
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Failed to load users.");
      setUsers(body.users ?? []);
    } catch (e: any) {
      toast(e?.message || "Failed to load users.", "error");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const debouncedLoad = useRef(debounce((q: string) => load(q), 350));
  useEffect(() => {
    load("");
  }, [load]);

  function onSearch(v: string) {
    setQuery(v);
    debouncedLoad.current(v.trim());
  }

  async function applyMembership() {
    if (!confirmTarget) return;
    const target = confirmTarget.membership === "pro" ? "free" : "pro";
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/users/${confirmTarget.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ membership: target }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Update failed.");
      setUsers((u) => u.map((x) => (x.id === confirmTarget.id ? { ...x, membership: target } : x)));
      toast(
        target === "pro"
          ? `${confirmTarget.full_name ?? "User"} upgraded to PRO.`
          : `PRO removed for ${confirmTarget.full_name ?? "user"}.`,
        "success"
      );
      setConfirmTarget(null);
    } catch (e: any) {
      toast(e?.message || "Update failed.", "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="label-eyebrow">Members</p>
          <h1 className="mt-3 font-serif text-4xl text-cream">Users</h1>
        </div>
      </div>
      <div className="rule-gold mt-5" />

      <div className="mt-8 max-w-md">
        <input
          value={query}
          onChange={(e) => onSearch(e.target.value)}
          placeholder="Search by name or email…"
          className="input-dark"
          aria-label="Search users"
        />
      </div>

      <div className="mt-6">
        {loading ? (
          <TableSkeleton rows={6} cols={6} />
        ) : users.length === 0 ? (
          <EmptyState
            title="No users found"
            message={query ? "Nothing matches your search." : "No users have signed up yet."}
          />
        ) : (
          <div className="overflow-x-auto border border-cream/10 bg-coal">
            <table className="table-dark w-full min-w-[820px]">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Plan</th>
                  <th>Role</th>
                  <th>Joined</th>
                  <th>Books</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center border border-gold/40 bg-wine font-serif text-sm text-gold">
                          {initials(u.full_name)}
                        </span>
                        <Link href={`/admin/users/${u.id}`} className="font-medium text-cream hover:text-gold">
                          {u.full_name ?? "—"}
                        </Link>
                      </div>
                    </td>
                    <td className="text-clay">{u.email ?? "—"}</td>
                    <td><MembershipBadge membership={u.membership} /></td>
                    <td className="text-clay">{u.role}</td>
                    <td className="whitespace-nowrap text-clay">{formatDate(u.created_at)}</td>
                    <td>
                      <span className="inline-flex min-w-[2rem] items-center justify-center border border-gold/40 px-2 py-0.5 font-sans text-xs text-gold">
                        {u.book_count}
                      </span>
                    </td>
                    <td>
                      <div className="flex justify-end gap-3">
                        <Link
                          href={`/admin/users/${u.id}`}
                          className="font-sans text-xs uppercase tracking-[0.18em] text-gold hover:text-cream"
                        >
                          View
                        </Link>
                        <button
                          type="button"
                          onClick={() => setConfirmTarget(u)}
                          className="font-sans text-xs uppercase tracking-[0.18em] text-sand hover:text-cream"
                        >
                          {u.membership === "pro" ? "Remove PRO" : "Upgrade to PRO"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!confirmTarget}
        title={confirmTarget?.membership === "pro" ? "Remove PRO" : "Upgrade to PRO"}
        message={
          confirmTarget?.membership === "pro"
            ? `Revert ${confirmTarget.full_name ?? "this user"} to the free plan?`
            : `Grant PRO membership to ${confirmTarget?.full_name ?? "this user"}?`
        }
        confirmLabel={confirmTarget?.membership === "pro" ? "Remove PRO" : "Upgrade"}
        cancelLabel="Cancel"
        danger={confirmTarget?.membership === "pro"}
        busy={busy}
        onConfirm={applyMembership}
        onCancel={() => !busy && setConfirmTarget(null)}
      />
    </div>
  );
}
