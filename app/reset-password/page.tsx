"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/Toast";

export default function ResetPasswordPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setError(null);
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }
    setBusy(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setError(
        /session|link|expired|invalid/i.test(error.message)
          ? "This reset link is invalid or has expired. Please request a new one."
          : error.message || "Something went wrong. Please try again."
      );
      setBusy(false);
      return;
    }
    toast("Password updated. Please sign in.", "success");
    router.push("/login");
  };

  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-md items-center px-6 py-16">
      <div className="card-dark w-full p-8 sm:p-10">
        <p className="label-eyebrow">Columnist</p>
        <h1 className="mt-4 font-serif text-3xl text-cream">Choose a new password.</h1>

        <form onSubmit={submit} className="mt-8 space-y-5">
          <div>
            <label htmlFor="rp-password" className="label-eyebrow mb-3 block">
              New password
            </label>
            <input
              id="rp-password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              className="input-dark"
              autoComplete="new-password"
            />
          </div>
          <div>
            <label htmlFor="rp-confirm" className="label-eyebrow mb-3 block">
              Confirm password
            </label>
            <input
              id="rp-confirm"
              type="password"
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Repeat your new password"
              className="input-dark"
              autoComplete="new-password"
            />
          </div>
          {error && (
            <p role="alert" className="border border-ember/60 bg-ember/10 px-4 py-3 font-sans text-sm text-cream">
              {error}
            </p>
          )}
          <button type="submit" disabled={busy} className="btn-crimson w-full">
            {busy ? "Updating…" : "Update Password"}
          </button>
        </form>

        <p className="mt-7 text-center font-sans text-sm text-sand">
          <Link href="/forgot-password" className="text-gold transition-colors hover:text-cream">
            Request a new reset link
          </Link>
        </p>
      </div>
    </div>
  );
}
