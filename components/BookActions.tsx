"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useToast } from "@/components/Toast";

type AccessKind = "loading" | "visitor" | "access" | "pending" | "open";

interface BookActionsProps {
  bookId: string;
  slug: string;
}

/**
 * Access CTA for the book detail page.
 * Contract with /api/requests (built separately):
 *   GET  /api/requests?book_id={id} → { request: { status } | null, hasAccess: boolean } (401 when logged out)
 *   POST /api/requests { book_id }   → 2xx on created, 409 when already requested
 */
export default function BookActions({ bookId, slug }: BookActionsProps) {
  const { toast } = useToast();
  const [kind, setKind] = useState<AccessKind>("loading");
  const [rejected, setRejected] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/requests?book_id=${encodeURIComponent(bookId)}`, {
          credentials: "same-origin",
        });
        if (cancelled) return;
        if (res.status === 401) {
          setKind("visitor");
          return;
        }
        if (!res.ok) {
          setKind("open");
          return;
        }
        const data = (await res.json()) as {
          hasAccess?: boolean;
          request?: { status?: string } | null;
        };
        if (data.hasAccess) {
          setKind("access");
        } else if (data.request?.status === "pending") {
          setKind("pending");
        } else {
          setRejected(data.request?.status === "rejected");
          setKind("open");
        }
      } catch {
        if (!cancelled) setKind("open");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [bookId]);

  const requestAccess = async () => {
    setBusy(true);
    try {
      const res = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ book_id: bookId }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (res.ok) {
        setKind("pending");
        setRejected(false);
        toast(
          "Your request has been received. Access will be activated after payment verification.",
          "success"
        );
      } else {
        toast(data.error ?? "Something went wrong. Please try again.", "error");
      }
    } catch {
      toast("Something went wrong. Please try again.", "error");
    } finally {
      setBusy(false);
    }
  };

  if (kind === "loading") {
    return (
      <button type="button" disabled className="btn-crimson w-full sm:w-auto">
        Checking access…
      </button>
    );
  }

  if (kind === "visitor") {
    return (
      <Link href={`/login?next=/books/${slug}`} className="btn-crimson w-full sm:w-auto">
        Login to Get Access
      </Link>
    );
  }

  if (kind === "access") {
    return (
      <Link href={`/read/${bookId}`} className="btn-crimson w-full sm:w-auto">
        Read Now <span aria-hidden="true">→</span>
      </Link>
    );
  }

  if (kind === "pending") {
    return (
      <button type="button" disabled className="btn-outline w-full sm:w-auto">
        Request Pending
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={requestAccess}
      disabled={busy}
      className="btn-crimson w-full sm:w-auto"
    >
      {busy ? "Sending request…" : rejected ? "Request Again" : "Get This Book"}
    </button>
  );
}
