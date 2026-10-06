"use client";

import { useState } from "react";
import { useToast } from "@/components/Toast";

export default function DownloadPdfButton({
  bookId,
  title,
  slug,
}: {
  bookId: string;
  title: string;
  slug: string;
}) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    if (loading) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/books/${bookId}/pdf-url`);
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast(body.error || "Could not prepare the download.", "error");
        return;
      }
      const url = body.url as string | undefined;
      if (!url) {
        toast("Could not prepare the download.", "error");
        return;
      }
      const a = document.createElement("a");
      a.href = url;
      a.download = `${slug}.pdf`;
      a.rel = "noopener";
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch {
      toast("Network error. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      aria-label={`Download ${title} as PDF`}
      className="btn-outline px-4 py-2 text-xs disabled:cursor-wait disabled:opacity-60"
    >
      {loading ? "Preparing…" : "Download PDF"}
    </button>
  );
}
