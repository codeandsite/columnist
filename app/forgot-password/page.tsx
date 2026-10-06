"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) {
      setError(error.message || "Something went wrong. Please try again.");
      setBusy(false);
      return;
    }
    setSent(true);
  };

  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-md items-center px-6 py-16">
      <div className="card-dark w-full p-8 sm:p-10">
        <p className="label-eyebrow">Columnist</p>
        <h1 className="mt-4 font-serif text-3xl text-cream">Reset password.</h1>

        {sent ? (
          <div className="mt-8">
            <div className="border border-gold/40 bg-gold/[0.07] px-5 py-4">
              <p className="font-sans text-sm leading-relaxed text-cream">
                If an account exists for <span className="text-gold">{email}</span>, a
                password reset link is on its way. Check your inbox and follow the
                link to choose a new password.
              </p>
            </div>
            <Link href="/login" className="btn-outline mt-7 w-full">
              Back to Sign In
            </Link>
          </div>
        ) : (
          <>
            <p className="mt-3 font-sans text-sm leading-relaxed text-sand">
              Enter your account email and we will send you a link to set a new
              password.
            </p>
            <form onSubmit={submit} className="mt-8 space-y-5">
              <div>
                <label htmlFor="fp-email" className="label-eyebrow mb-3 block">
                  Email
                </label>
                <input
                  id="fp-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="input-dark"
                  autoComplete="email"
                />
              </div>
              {error && (
                <p role="alert" className="border border-ember/60 bg-ember/10 px-4 py-3 font-sans text-sm text-cream">
                  {error}
                </p>
              )}
              <button type="submit" disabled={busy} className="btn-crimson w-full">
                {busy ? "Sending…" : "Send Reset Link"}
              </button>
            </form>
            <p className="mt-7 text-center font-sans text-sm text-sand">
              Remembered it?{" "}
              <Link href="/login" className="text-gold transition-colors hover:text-cream">
                Sign in
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
