"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { classNames } from "@/lib/utils";
import { CrestMark } from "@/components/BookCover";

const LINKS = [
  { href: "/admin", label: "Dashboard", icon: "M3 12l9-9 9 9M5 10v10h5v-6h4v6h5V10" },
  { href: "/admin/books", label: "Books", icon: "M4 19.5A2.5 2.5 0 0 1 6.5 17H20V4H6.5A2.5 2.5 0 0 0 4 6.5v13ZM4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5" },
  { href: "/admin/categories", label: "Categories", icon: "M4 6h16M4 12h16M4 18h10" },
  { href: "/admin/users", label: "Users", icon: "M16 19v-1a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v1M9.5 10a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM21 19v-1a4 4 0 0 0-3-3.87M15.5 3.13a3.5 3.5 0 0 1 0 6.74" },
  { href: "/admin/requests", label: "Purchase Requests", icon: "M9 12l2 2 4-4M7 3h10a1 1 0 0 1 1 1v16l-3-2-2 2-2-2-2 2-2-2-3 2V4a1 1 0 0 1 1-1Z" },
  { href: "/admin/analytics", label: "Reading Analytics", icon: "M3 3v16a2 2 0 0 0 2 2h16M7 14l4-4 3 3 5-6" },
  { href: "/admin/settings", label: "Settings", icon: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.01a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h.01a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.01a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" },
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(href + "/");
}

export default function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  async function logout() {
    setSigningOut(true);
    try {
      await createClient().auth.signOut();
    } finally {
      router.push("/");
      router.refresh();
    }
  }

  const nav = (
    <nav className="flex h-full flex-col" aria-label="Admin">
      <Link href="/admin" className="flex items-center gap-3 px-6 pb-8 pt-7" onClick={() => setOpen(false)}>
        <CrestMark className="h-9 w-9 text-gold" />
        <span className="font-sans text-sm font-semibold uppercase tracking-[0.32em] text-cream">
          Columnist
        </span>
      </Link>

      <div className="flex-1 space-y-1 px-3">
        {LINKS.map((l) => {
          const active = isActive(pathname, l.href);
          return (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className={classNames(
                "flex items-center gap-3 px-3 py-3 font-sans text-sm transition-colors",
                active
                  ? "border-l-2 border-gold bg-wine/60 text-cream"
                  : "border-l-2 border-transparent text-clay hover:bg-cream/5 hover:text-cream"
              )}
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d={l.icon} strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {l.label}
            </Link>
          );
        })}
      </div>

      <div className="space-y-1 border-t border-gold/15 px-3 py-4">
        <Link
          href="/"
          onClick={() => setOpen(false)}
          className="flex items-center gap-3 border-l-2 border-transparent px-3 py-3 font-sans text-sm text-clay transition-colors hover:text-gold"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M3 12l9-9 9 9M5 10v10h5v-6h4v6h5V10" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Back to Website
        </Link>
        <button
          type="button"
          onClick={logout}
          disabled={signingOut}
          className="flex w-full items-center gap-3 border-l-2 border-transparent px-3 py-3 font-sans text-sm text-clay transition-colors hover:text-ember disabled:opacity-50"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {signingOut ? "Signing out…" : "Logout"}
        </button>
      </div>
    </nav>
  );

  return (
    <>
      {/* Mobile top bar */}
      <div className="sticky top-0 z-40 flex items-center justify-between border-b border-gold/15 bg-coal px-5 py-4 lg:hidden">
        <Link href="/admin" className="flex items-center gap-2.5">
          <CrestMark className="h-7 w-7 text-gold" />
          <span className="font-sans text-xs font-semibold uppercase tracking-[0.32em] text-cream">
            Columnist · Admin
          </span>
        </Link>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Close menu" : "Open menu"}
          className="flex h-10 w-10 items-center justify-center border border-cream/20 text-cream"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6">
            {open ? (
              <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
            ) : (
              <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
            )}
          </svg>
        </button>
      </div>

      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 border-r border-gold/15 bg-coal lg:block">
        {nav}
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/70" onClick={() => setOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-72 animate-fade-up border-r border-gold/15 bg-coal">
            {nav}
          </aside>
        </div>
      )}
    </>
  );
}
