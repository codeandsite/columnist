"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/Toast";

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

export default function RegisterPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
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
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName.trim() } },
    });
    if (error) {
      setError(
        /already registered|already exists/i.test(error.message)
          ? "This email is already registered. Try signing in instead."
          : error.message || "Something went wrong. Please try again."
      );
      setBusy(false);
      return;
    }
    toast("Account created. Please sign in.", "success");
    router.push("/login");
  };

  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-md items-center px-6 py-16">
      <div className="card-dark w-full p-8 sm:p-10">
        <p className="label-eyebrow">Columnist</p>
        <h1 className="mt-4 font-serif text-3xl text-cream">Join the library.</h1>
        <p className="mt-3 font-sans text-sm leading-relaxed text-sand">
          Create an account to request books and build your collection.
        </p>

        <form onSubmit={submit} className="mt-8 space-y-5">
          <div>
            <label htmlFor="reg-name" className="label-eyebrow mb-3 block">
              Full name
            </label>
            <input
              id="reg-name"
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your full name"
              className="input-dark"
              autoComplete="name"
            />
          </div>
          <div>
            <label htmlFor="reg-email" className="label-eyebrow mb-3 block">
              Email
            </label>
            <input
              id="reg-email"
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
            <label htmlFor="reg-password" className="label-eyebrow mb-3 block">
              Password
            </label>
            <div className="relative">
              <input
                id="reg-password"
                type={showPassword ? "text" : "password"}
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="input-dark pr-12"
                autoComplete="new-password"
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
          <div>
            <label htmlFor="reg-confirm" className="label-eyebrow mb-3 block">
              Confirm password
            </label>
            <div className="relative">
              <input
                id="reg-confirm"
                type={showConfirm ? "text" : "password"}
                required
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Repeat your password"
                className="input-dark pr-12"
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowConfirm((v) => !v)}
                aria-label={showConfirm ? "Hide password" : "Show password"}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-clay transition-colors hover:text-gold"
              >
                <EyeIcon open={showConfirm} />
              </button>
            </div>
          </div>

          {error && (
            <p role="alert" className="border border-ember/60 bg-ember/10 px-4 py-3 font-sans text-sm text-cream">
              {error}
            </p>
          )}

          <button type="submit" disabled={busy} className="btn-crimson w-full">
            {busy ? "Creating account…" : "Create Account"}
          </button>
        </form>

        <p className="mt-7 text-center font-sans text-sm text-sand">
          Already have an account?{" "}
          <Link href="/login" className="text-gold transition-colors hover:text-cream">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
