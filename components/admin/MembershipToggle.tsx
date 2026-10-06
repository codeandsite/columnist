"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/Toast";
import ConfirmDialog from "@/components/ConfirmDialog";
import type { Membership } from "@/lib/types";

export default function MembershipToggle({
  userId,
  userName,
  current,
}: {
  userId: string;
  userName: string | null;
  current: Membership;
}) {
  const { toast } = useToast();
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const target: Membership = current === "pro" ? "free" : "pro";

  async function apply() {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ membership: target }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Update failed.");
      toast(
        target === "pro"
          ? `${userName ?? "User"} upgraded to PRO.`
          : `PRO removed for ${userName ?? "user"}.`,
        "success"
      );
      setConfirmOpen(false);
      router.refresh();
    } catch (e: any) {
      toast(e?.message || "Update failed.", "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setConfirmOpen(true)}
        className="btn-outline px-5 py-2.5 text-[11px]"
      >
        {current === "pro" ? "Remove PRO" : "Upgrade to PRO"}
      </button>
      <ConfirmDialog
        open={confirmOpen}
        title={target === "pro" ? "Upgrade to PRO" : "Remove PRO"}
        message={
          target === "pro"
            ? `Grant PRO membership to ${userName ?? "this user"}? They will get premium member privileges.`
            : `Revert ${userName ?? "this user"} to the free plan?`
        }
        confirmLabel={target === "pro" ? "Upgrade" : "Remove PRO"}
        cancelLabel="Cancel"
        danger={target !== "pro"}
        busy={busy}
        onConfirm={apply}
        onCancel={() => !busy && setConfirmOpen(false)}
      />
    </>
  );
}
