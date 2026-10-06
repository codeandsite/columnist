"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/Toast";
import SearchOverlay from "@/components/SearchOverlay";
import { CrestMark } from "@/components/BookCover";
import { classNames } from "@/lib/utils";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/books", label: "Books" },
  { href: "/categories", label: "Categories" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

interface SessionInfo {
  email: string | null;
  isAdmin: boolean;
  name: string | null;
}

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();
  const [session, setSession] = useState<SessionInfo | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    const load = async () => {
      const { data } = await supabase.auth.getSession();
      const user = data.session?.user;
      if (!user) {
        setSession(null);
        return;
      }
      const { data: profile } = await supabase
        .from("profiles")
        .select("role, full_name")
        .eq("id", user.id)
        .single();
      setSession({
        email: user.email ?? null,
        isAdmin: (profile as any)?.role === "admin",
        name: (profile as any)?.full_name ?? null,
      });
    };
    load();
    const { data: sub } = supabase.auth.onAuthStateChange(() => load());
    return () => sub.subscription.unsubscribe();
  }, []);

  // Don't render the marketing header inside the reader or admin shell
  if (pathname?.startsWith("/read/") || pathname?.startsWith("/admin")) return null;

  const logout = async () => {
    await createClient().auth.signOut();
    setSession(null);
    setAccountOpen(false);
    toast("Signed out.", "info");
    router.push("/");
    router.refresh();
  };

  const accountLinks = session
    ? [
        { href: "/library", label: "My Library" },
        { href: "/dashboard", label: "Dashboard" },
        { href: "/profile", label: "Profile" },
        ...(session.isAdmin ? [{ href: "/admin", label: "Admin Panel" }] : []),
      ]
    : [];

  return (
    <>
      <header className="sticky top-0 z-[60] border-b border-gold/15 bg-ink/90 backdrop-blur-md">
        <div className="mx-auto flex h-[76px] max-w-7xl items-center justify-between gap-6 px-5 lg:px-8">
          {/* Brand */}
          <Link href="/" className="flex shrink-0 items-center gap-3" aria-label="Columnist home">
            <CrestMark className="h-11 w-11 text-gold" />
            <span className="leading-none">
              <span className="block font-serif text-[22px] font-semibold tracking-[0.22em] text-cream">
                COLUMNIST
              </span>
              <span className="mt-1.5 block font-sans text-[8.5px] font-medium uppercase text-sand" style={{ letterSpacing: "0.34em" }}>
                Ebooks for a wiser you
              </span>
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-9 lg:flex" aria-label="Primary">
            {NAV.map((item) => {
              const active = item.href === "/" ? pathname === "/" : pathname?.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={classNames(
                    "relative font-sans text-[13.5px] tracking-wide transition-colors",
                    active ? "text-cream" : "text-sand/80 hover:text-cream"
                  )}
                >
                  {item.label}
                  {active && <span className="absolute -bottom-2 left-0 h-px w-full bg-ember" />}
                </Link>
              );
            })}
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => setSearchOpen(true)}
              className="flex h-10 w-10 items-center justify-center text-sand transition-colors hover:text-gold"
              aria-label="Search books"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6">
                <circle cx="11" cy="11" r="7" />
                <path d="M20 20l-3.5-3.5" />
              </svg>
            </button>

            <Link
              href={session ? "/library" : "/login"}
              className="hidden h-10 w-10 items-center justify-center text-sand transition-colors hover:text-gold sm:flex"
              aria-label="My library"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V4H6.5A2.5 2.5 0 0 0 4 6.5v13Z" />
                <path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5" />
              </svg>
            </Link>

            {session ? (
              <div className="relative">
                <button
                  onClick={() => setAccountOpen((v) => !v)}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-gold/40 bg-wine/60 font-serif text-sm text-gold"
                  aria-label="Account menu"
                  aria-expanded={accountOpen}
                >
                  {(session.name ?? session.email ?? "C").trim().charAt(0).toUpperCase()}
                </button>
                {accountOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setAccountOpen(false)} />
                    <div className="absolute right-0 z-50 mt-3 w-56 animate-fade-up border border-cream/15 bg-coal py-2 shadow-book">
                      <p className="truncate px-5 pb-2 pt-3 font-sans text-xs text-clay">{session.email}</p>
                      {accountLinks.map((l) => (
                        <Link
                          key={l.href}
                          href={l.href}
                          onClick={() => setAccountOpen(false)}
                          className="block px-5 py-2.5 font-sans text-sm text-cream transition-colors hover:bg-wine/50 hover:text-gold"
                        >
                          {l.label}
                        </Link>
                      ))}
                      <div className="my-2 border-t border-cream/10" />
                      <button
                        onClick={logout}
                        className="block w-full px-5 py-2.5 text-left font-sans text-sm text-ember transition-colors hover:bg-wine/50 hover:text-cream"
                      >
                        Logout
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="hidden items-center gap-5 sm:flex">
                <Link href="/login" className="font-sans text-[13.5px] text-sand transition-colors hover:text-cream">
                  Login
                </Link>
                <Link
                  href="/register"
                  className="border border-gold/50 px-5 py-2.5 font-sans text-[12px] font-medium uppercase tracking-[0.18em] text-gold transition-colors hover:bg-gold hover:text-ink"
                >
                  Register
                </Link>
              </div>
            )}

            {/* Mobile hamburger */}
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="flex h-10 w-10 items-center justify-center text-cream lg:hidden"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
            >
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.6">
                {menuOpen ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <nav className="border-t border-cream/10 bg-ink px-6 py-4 lg:hidden" aria-label="Mobile">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className={classNames(
                  "block border-b border-cream/[0.07] py-3.5 font-serif text-lg last:border-0",
                  pathname === item.href ? "text-gold" : "text-cream"
                )}
              >
                {item.label}
              </Link>
            ))}
            {!session ? (
              <div className="flex gap-3 py-4">
                <Link href="/login" onClick={() => setMenuOpen(false)} className="btn-outline flex-1 px-4 py-3 text-xs">
                  Login
                </Link>
                <Link href="/register" onClick={() => setMenuOpen(false)} className="btn-crimson flex-1 px-4 py-3 text-xs">
                  Register
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 py-4">
                {accountLinks.map((l) => (
                  <Link
                    key={l.href}
                    href={l.href}
                    onClick={() => setMenuOpen(false)}
                    className="border border-cream/15 px-4 py-3 text-center font-sans text-xs uppercase tracking-[0.18em] text-cream"
                  >
                    {l.label}
                  </Link>
                ))}
                <button onClick={logout} className="border border-ember/60 px-4 py-3 font-sans text-xs uppercase tracking-[0.18em] text-ember">
                  Logout
                </button>
              </div>
            )}
          </nav>
        )}
      </header>
      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
