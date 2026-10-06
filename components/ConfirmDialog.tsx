"use client";

import { useEffect } from "react";
import { classNames } from "@/lib/utils";

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  danger = false,
  busy = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onCancel();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative w-full max-w-md animate-fade-up border border-cream/15 bg-coal p-8 shadow-book">
        <h3 className="font-serif text-2xl text-cream">{title}</h3>
        <p className="mt-3 font-sans text-sm leading-relaxed text-clay">{message}</p>
        <div className="mt-8 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="btn-outline px-6 py-3 text-xs disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className={classNames(
              "px-6 py-3 font-sans text-xs font-medium uppercase tracking-[0.18em] text-cream transition-colors disabled:opacity-50",
              danger ? "bg-ember hover:bg-crimson" : "bg-crimson hover:bg-ember"
            )}
          >
            {busy ? "Working…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
