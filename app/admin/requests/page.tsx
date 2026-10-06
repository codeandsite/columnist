"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { useToast } from "@/components/Toast";
import ConfirmDialog from "@/components/ConfirmDialog";
import StatusBadge from "@/components/admin/StatusBadge";
import EmptyState, { TableSkeleton } from "@/components/Skeletons";
import { formatDateTime, formatPKR, debounce, classNames } from "@/lib/utils";
import { coverUrl } from "@/lib/storage";

type StatusFilter = "all" | "pending" | "approved" | "rejected";

interface RequestRow {
  id: string;
  status: string;
  requested_at: string;
  approved_at: string | null;
  profile: { full_name: string | null; email: string | null } | null;
  book: { id: string; title: string; price: number; cover_path: string | null } | null;
}

const TABS: Array<{ value: StatusFilter; label: string }> = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

export default function AdminRequestsPage() {
  const { toast } = useToast();
  const [requests, setRequests] = useState<RequestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<StatusFilter>("all");
  const [query, setQuery] = useState("");
  const [rejectTarget, setRejectTarget] = useState<RequestRow | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async (s: StatusFilter, q: string) => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/admin/requests?status=${s}${q ? `&q=${encodeURIComponent(q)}` : ""}`
      );
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Failed to load requests.");
      setRequests(body.requests ?? []);
    } catch (e: any) {
      toast(e?.message || "Failed to load requests.", "error");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load(status, "");
    setQuery("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const debouncedLoad = useRef(debounce((s: StatusFilter, q: string) => load(s, q), 350));

  function onSearch(v: string) {
    setQuery(v);
    debouncedLoad.current(status, v.trim());
  }

  async function approve(r: RequestRow) {
    setBusyId(r.id);
    try {
      const res = await fetch(`/api/admin/requests/${r.id}/approve`, { method: "POST" });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Approval failed.");
      setRequests((list) => list.filter((x) => x.id !== r.id));
      toast(
        body.warning
          ? body.warning
          : `${r.profile?.full_name ?? r.profile?.email ?? "User"} now has "${r.book?.title ?? "the book"}" in their library.`,
        body.warning ? "info" : "success"
      );
    } catch (e: any) {
      toast(e?.message || "Approval failed.", "error");
    } finally {
      setBusyId(null);
    }
  }

  async function confirmReject() {
    if (!rejectTarget) return;
    setBusyId(rejectTarget.id);
    try {
      const res = await fetch(`/api/admin/requests/${rejectTarget.id}/reject`, { method: "POST" });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Rejection failed.");
      setRequests((list) => list.filter((x) => x.id !== rejectTarget.id));
      toast("Request rejected.", "success");
      setRejectTarget(null);
    } catch (e: any) {
      toast(e?.message || "Rejection failed.", "error");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="label-eyebrow">Sales Desk</p>
          <h1 className="mt-3 font-serif text-4xl text-cream">Purchase Requests</h1>
        </div>
      </div>
      <div className="rule-gold mt-5" />

      <div className="mt-8 flex flex-wrap items-center gap-3">
        {TABS.map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => setStatus(t.value)}
            aria-pressed={status === t.value}
            className={classNames(
              "border px-5 py-2.5 font-sans text-xs uppercase tracking-[0.18em] transition-colors",
              status === t.value
                ? "border-gold bg-gold/15 text-gold"
                : "border-cream/20 text-clay hover:border-cream/40 hover:text-cream"
            )}
          >
            {t.label}
          </button>
        ))}
        <div className="ml-auto w-full max-w-xs sm:w-auto sm:flex-1 sm:min-w-[220px]">
          <input
            value={query}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Search user or book…"
            className="input-dark"
            aria-label="Search requests"
          />
        </div>
      </div>

      <div className="mt-6">
        {loading ? (
          <TableSkeleton rows={6} cols={5} />
        ) : requests.length === 0 ? (
          <EmptyState
            title="No requests"
            message={
              status === "pending"
                ? "The queue is clear — no pending purchase requests."
                : query
                  ? "Nothing matches your search."
                  : "No purchase requests in this state yet."
            }
          />
        ) : (
          <div className="overflow-x-auto border border-cream/10 bg-coal">
            <table className="table-dark w-full min-w-[860px]">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Book</th>
                  <th>Requested</th>
                  <th>Status</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((r) => {
                  const cover = coverUrl(r.book?.cover_path);
                  const busy = busyId === r.id;
                  return (
                    <tr key={r.id}>
                      <td>
                        <p className="font-medium text-cream">{r.profile?.full_name ?? "—"}</p>
                        <p className="mt-0.5 font-sans text-xs text-clay">{r.profile?.email ?? "—"}</p>
                      </td>
                      <td>
                        <div className="flex items-center gap-3">
                          {cover && (
                            <span className="relative block aspect-[2/3] w-8 shrink-0">
                              <Image src={cover} alt="" fill sizes="32px" className="object-cover" />
                            </span>
                          )}
                          <div className="min-w-0">
                            <p className="truncate font-sans text-sm text-cream">{r.book?.title ?? "Deleted book"}</p>
                            <p className="font-sans text-xs text-clay">{formatPKR(r.book?.price)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap text-clay">{formatDateTime(r.requested_at)}</td>
                      <td><StatusBadge status={r.status} /></td>
                      <td>
                        <div className="flex justify-end gap-3">
                          {r.status === "pending" ? (
                            <>
                              <button
                                type="button"
                                onClick={() => approve(r)}
                                disabled={busy}
                                className="btn-crimson px-5 py-2.5 text-[11px] disabled:opacity-50"
                              >
                                {busy ? "…" : "Approve"}
                              </button>
                              <button
                                type="button"
                                onClick={() => setRejectTarget(r)}
                                disabled={busy}
                                className="btn-outline px-5 py-2.5 text-[11px] disabled:opacity-50"
                              >
                                Reject
                              </button>
                            </>
                          ) : (
                            <span className="font-sans text-xs text-clay">—</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!rejectTarget}
        title="Reject this request?"
        message={`${rejectTarget?.profile?.full_name ?? rejectTarget?.profile?.email ?? "This user"} requested "${rejectTarget?.book?.title ?? "a book"}". Rejecting will not grant library access.`}
        confirmLabel="Reject"
        cancelLabel="Keep"
        danger
        busy={busyId !== null}
        onConfirm={confirmReject}
        onCancel={() => busyId === null && setRejectTarget(null)}
      />
    </div>
  );
}
