"use client";

import { Suspense, useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function EyeIcon({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      aria-hidden="true"
    >
      {open ? (
        <>
          <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
          <circle cx="12" cy="12" r="3" />
        </>
      ) : (
        <>
          <path d="M3 3l18 18" />
          <path d="M10.6 5.1A10.9 10.9 0 0 1 12 5c6.5 0 10 7 10 7a17.6 17.6 0 0 1-3.2 4.1M6.6 6.6A17.2 17.2 0 0 0 2 12s3.5 7 10 7c1.5 0 2.9-.3 4.1-.9" />
        </>
      )}
    </svg>
  );
}

function friendlyError(message: string): string {
  if (/invalid login credentials/i.test(message))
    return "Incorrect email or password. Please try again.";
  if (/email not confirmed/i.test(message))
    return "Please confirm your email address before signing in.";
  return message || "Something went wrong. Please try again.";
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next");
  const safeNext = next && next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) router.replace("/dashboard");
    });
  }, [router]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(friendlyError(error.message));
      setBusy(false);
      return;
    }
    router.replace(safeNext);
    router.refresh();
  };

  return (
    <div className="card-dark w-full p-8 sm:p-10">
      <p className="label-eyebrow">Columnist</p>
      <h1 className="mt-4 font-serif text-3xl text-cream">Welcome back.</h1>
      <p className="mt-3 font-sans text-sm leading-relaxed text-sand">
        Sign in to open your library.
      </p>

      <form onSubmit={submit} className="mt-8 space-y-5">
        <div>
          <label htmlFor="login-email" className="label-eyebrow mb-3 block">
            Email
          </label>
          <input
            id="login-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="input-dark"
            autoComplete="email"
          />
        </div>
        <div>
          <label htmlFor="login-password" className="label-eyebrow mb-3 block">
            Password
          </label>
          <div className="relative">
            <input
              id="login-password"
              type={showPassword ? "text" : "password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Your password"
              className="input-dark pr-12"
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-clay transition-colors hover:text-gold"
            >
              <EyeIcon open={showPassword} />
            </button>
          </div>
        </div>

        {error && (
          <p role="alert" className="border border-ember/60 bg-ember/10 px-4 py-3 font-sans text-sm text-cream">
            {error}
          </p>
        )}

        <button type="submit" disabled={busy} className="btn-crimson w-full">
          {busy ? "Signing in…" : "Sign In"}
        </button>
      </form>

      <div className="mt-7 flex items-center justify-between font-sans text-sm">
        <Link href="/forgot-password" className="text-sand transition-colors hover:text-gold">
          Forgot password?
        </Link>
        <Link href="/register" className="text-sand transition-colors hover:text-gold">
          Create an account
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-md items-center px-6 py-16">
      <Suspense
        fallback={
          <div className="card-dark w-full animate-pulse p-10">
            <div className="h-6 w-40 bg-cream/10" />
            <div className="mt-6 h-10 w-full bg-cream/10" />
          </div>
        }
      >
        <LoginForm />
      </Suspense>
    </div>
  );
}
