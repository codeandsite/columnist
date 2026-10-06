"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { CrestMark } from "@/components/BookCover";
import { ReaderSkeleton } from "@/components/Skeletons";
import { debounce, classNames } from "@/lib/utils";

type ReaderTheme = "light" | "dark" | "sepia";

interface TocItem {
  label: string;
  href: string;
}

const THEME_STYLES: Record<ReaderTheme, Record<string, Record<string, string>>> = {
  light: { body: { background: "#f6f1e5", color: "#241d12" } },
  dark: { body: { background: "#131009", color: "#e8dfc9" } },
  sepia: { body: { background: "#ecdcba", color: "#3a2d18" } },
};

const THEME_LABELS: Record<ReaderTheme, string> = {
  light: "Light",
  dark: "Dark",
  sepia: "Sepia",
};

const THEMES: ReaderTheme[] = ["light", "dark", "sepia"];
const FONT_MIN = 14;
const FONT_MAX = 28;
const FONT_DEFAULT = 18;

export default function Reader({
  bookId,
  title,
  author,
  savedCfi,
  savedProgress,
}: {
  bookId: string;
  title: string;
  author: string;
  savedCfi: string | null;
  savedProgress: number;
}) {
  const viewerRef = useRef<HTMLDivElement>(null);
  const renditionRef = useRef<any>(null);
  const bookRef = useRef<any>(null);
  const cancelledRef = useRef(false);

  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState("Something went wrong while opening the book.");
  const [toc, setToc] = useState<TocItem[]>([]);
  const [progress, setProgress] = useState(savedProgress);
  const [theme, setTheme] = useState<ReaderTheme>("dark");
  const [fontSize, setFontSize] = useState(FONT_DEFAULT);
  const [wide, setWide] = useState(false);
  const [tocOpen, setTocOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Debounced progress persistence — stable across renders.
  const saveProgressRef = useRef(
    debounce((cfi: string, pct: number) => {
      fetch("/api/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ book_id: bookId, location: cfi, progress: pct }),
      }).catch(() => {
        /* progress saving is best-effort; never interrupt reading */
      });
    }, 1500)
  );

  const percentFromLocation = useCallback((rendition: any, book: any): { cfi: string | null; pct: number } => {
    try {
      const loc = rendition.currentLocation();
      const cfi = loc?.start?.cfi as string | undefined;
      if (!cfi) return { cfi: null, pct: 0 };
      const locations = book.locations;
      const count =
        typeof locations?.length === "function" ? locations.length() : (locations?.length ?? 0);
      if (count > 0) {
        return { cfi, pct: Math.round(locations.percentageFromCfi(cfi) * 100) };
      }
      // Spine fallback when locations weren't generated.
      const idx = typeof loc?.start?.index === "number" ? loc.start.index : 0;
      const total = book.spine?.items?.length ?? 1;
      return { cfi, pct: Math.round(((idx + 1) / Math.max(total, 1)) * 100) };
    } catch {
      return { cfi: null, pct: 0 };
    }
  }, []);

  useEffect(() => {
    cancelledRef.current = false;
    let rendition: any = null;
    let book: any = null;

    async function init() {
      try {
        const res = await fetch(`/api/books/${bookId}/epub-url`);
        const body = await res.json().catch(() => ({}));
        if (cancelledRef.current) return;
        if (!res.ok) {
          setErrorMessage(
            res.status === 403
              ? "You don't have access to this book."
              : body.error || "Could not open this book for reading."
          );
          setStatus("error");
          return;
        }
        const url = body.url as string | undefined;
        if (!url) {
          setErrorMessage("Could not open this book for reading.");
          setStatus("error");
          return;
        }

        const mod: any = await import("epubjs");
        const ePub = mod?.default ?? mod;
        if (cancelledRef.current) return;

        book = ePub(url);
        bookRef.current = book;
        rendition = book.renderTo(viewerRef.current, {
          width: "100%",
          height: "100%",
          flow: "paginated",
          allowScriptedContent: false,
        });
        renditionRef.current = rendition;

        for (const name of THEMES) {
          rendition.themes.register(name, THEME_STYLES[name]);
        }
        rendition.themes.select("dark");
        rendition.themes.fontSize(`${FONT_DEFAULT}px`);

        rendition.on("relocated", () => {
          const { cfi, pct } = percentFromLocation(rendition, book);
          if (!cancelledRef.current) {
            if (pct > 0) setProgress(pct);
            if (cfi) saveProgressRef.current(cfi, pct);
          }
          if (!cancelledRef.current) setStatus("ready");
        });

        await book.ready;
        if (cancelledRef.current) return;
        try {
          await book.locations.generate(1200);
        } catch {
          /* spine fallback keeps reading working */
        }
        try {
          const nav = await book.loaded.navigation;
          const items = (nav?.toc ?? []) as TocItem[];
          if (!cancelledRef.current) setToc(items.filter((t) => t?.href && t?.label));
        } catch {
          /* no TOC — reader still works */
        }

        await rendition.display(savedCfi && savedCfi.length > 0 ? savedCfi : undefined);
        if (!cancelledRef.current) setStatus("ready");
      } catch {
        if (!cancelledRef.current) {
          setErrorMessage("Could not open this book for reading.");
          setStatus("error");
        }
      }
    }

    init();

    const onFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFullscreenChange);

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") renditionRef.current?.next();
      else if (e.key === "ArrowLeft") renditionRef.current?.prev();
    };
    window.addEventListener("keydown", onKey);

    return () => {
      cancelledRef.current = true;
      document.removeEventListener("fullscreenchange", onFullscreenChange);
      window.removeEventListener("keydown", onKey);
      try {
        renditionRef.current?.destroy();
        bookRef.current?.destroy();
      } catch {
        /* already torn down */
      }
      renditionRef.current = null;
      bookRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookId]);

  // Apply theme / font size / width changes to the live rendition.
  useEffect(() => {
    const rendition = renditionRef.current;
    if (!rendition) return;
    try {
      rendition.themes.select(theme);
      rendition.themes.fontSize(`${fontSize}px`);
      rendition.resize();
    } catch {
      /* ignore reflow errors */
    }
  }, [theme, fontSize, wide]);

  function toggleFullscreen() {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    } else {
      document.documentElement.requestFullscreen().catch(() => {});
    }
  }

  function goTo(href: string) {
    try {
      renditionRef.current?.display(href);
      setTocOpen(false);
    } catch {
      /* ignore navigation errors */
    }
  }

  if (status === "error") {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center px-6 text-center">
        <CrestMark className="h-12 w-12 text-gold/70" />
        <h1 className="mt-6 font-serif text-3xl text-cream">{errorMessage}</h1>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button type="button" onClick={() => window.location.reload()} className="btn-crimson px-6 py-2.5 text-sm">
            Try again
          </button>
          <Link href="/library" className="btn-outline px-6 py-2.5 text-sm">
            Back to Library
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={classNames("flex h-[100dvh] flex-col", `reader-theme-${theme}`)}>
      {/* Top bar */}
      <header className="z-20 flex h-16 shrink-0 items-center gap-3 border-b border-gold/15 bg-coal/95 px-4 sm:px-6">
        <button
          type="button"
          onClick={() => setTocOpen(true)}
          aria-label="Open table of contents"
          className="rounded-full border border-cream/20 p-2 text-sand transition-colors hover:border-gold/60 hover:text-gold"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6">
            <path d="M4 6h16M4 12h16M4 18h10" />
          </svg>
        </button>
        <CrestMark className="hidden h-8 w-8 shrink-0 text-gold sm:block" />
        <div className="min-w-0 flex-1">
          <p className="truncate font-serif text-base text-cream sm:text-lg">{title}</p>
          {author && (
            <p className="truncate font-sans text-[10px] uppercase tracking-[0.22em] text-clay">{author}</p>
          )}
        </div>
        <span className="hidden shrink-0 font-sans text-xs text-sand sm:inline" aria-label="Reading progress">
          {progress}%
        </span>

        {/* Settings */}
        <div className="relative shrink-0">
          <button
            type="button"
            onClick={() => setSettingsOpen((v) => !v)}
            aria-label="Reader settings"
            aria-expanded={settingsOpen}
            className={classNames(
              "rounded-full border p-2 transition-colors",
              settingsOpen ? "border-gold/70 text-gold" : "border-cream/20 text-sand hover:border-gold/60 hover:text-gold"
            )}
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6">
              <circle cx="12" cy="12" r="3.2" />
              <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1 1.55V21a2 2 0 1 1-4 0v-.09a1.7 1.7 0 0 0-1.1-1.55 1.7 1.7 0 0 0-1.88.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.7 1.7 0 0 0 .34-1.87 1.7 1.7 0 0 0-1.55-1H3a2 2 0 1 1 0-4h.09a1.7 1.7 0 0 0 1.55-1.1 1.7 1.7 0 0 0-.34-1.88l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.7 1.7 0 0 0 1.87.34h.01a1.7 1.7 0 0 0 1-1.55V3a2 2 0 1 1 4 0v.09a1.7 1.7 0 0 0 1 1.55h.01a1.7 1.7 0 0 0 1.88-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.7 1.7 0 0 0-.34 1.87v.01a1.7 1.7 0 0 0 1.55 1H21a2 2 0 1 1 0 4h-.09a1.7 1.7 0 0 0-1.51 1Z" />
            </svg>
          </button>
          {settingsOpen && (
            <div className="absolute right-0 top-12 w-64 border border-gold/20 bg-coal p-5 shadow-book" role="dialog" aria-label="Reader settings">
              <p className="label-eyebrow">Text size</p>
              <div className="mt-3 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setFontSize((s) => Math.max(FONT_MIN, s - 2))}
                  aria-label="Decrease text size"
                  className="rounded-full border border-cream/20 px-3 py-1 font-serif text-lg text-cream hover:border-gold/60"
                >
                  A−
                </button>
                <span className="font-sans text-sm text-sand">{fontSize}px</span>
                <button
                  type="button"
                  onClick={() => setFontSize((s) => Math.min(FONT_MAX, s + 2))}
                  aria-label="Increase text size"
                  className="rounded-full border border-cream/20 px-3 py-1 font-serif text-lg text-cream hover:border-gold/60"
                >
                  A+
                </button>
              </div>
              <p className="label-eyebrow mt-6">Theme</p>
              <div className="mt-3 grid grid-cols-3 gap-2">
                {THEMES.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTheme(t)}
                    aria-pressed={theme === t}
                    className={classNames(
                      "border px-2 py-2 font-sans text-xs",
                      theme === t ? "border-gold text-gold" : "border-cream/20 text-sand hover:border-gold/50"
                    )}
                  >
                    {THEME_LABELS[t]}
                  </button>
                ))}
              </div>
              <p className="label-eyebrow mt-6">Page width</p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setWide(false)}
                  aria-pressed={!wide}
                  className={classNames(
                    "border px-2 py-2 font-sans text-xs",
                    !wide ? "border-gold text-gold" : "border-cream/20 text-sand hover:border-gold/50"
                  )}
                >
                  Narrow
                </button>
                <button
                  type="button"
                  onClick={() => setWide(true)}
                  aria-pressed={wide}
                  className={classNames(
                    "border px-2 py-2 font-sans text-xs",
                    wide ? "border-gold text-gold" : "border-cream/20 text-sand hover:border-gold/50"
                  )}
                >
                  Wide
                </button>
              </div>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={toggleFullscreen}
          aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
          className="shrink-0 rounded-full border border-cream/20 p-2 text-sand transition-colors hover:border-gold/60 hover:text-gold"
        >
          {isFullscreen ? (
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M8 3v5H3M16 3v5h5M8 21v-5H3M16 21v-5h5" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M3 8V3h5M16 3h5v5M21 16v5h-5M8 21H3v-5" />
            </svg>
          )}
        </button>

        <Link
          href="/library"
          className="btn-outline hidden shrink-0 px-4 py-2 text-xs sm:inline-block"
        >
          Exit Reader
        </Link>
        <Link
          href="/library"
          aria-label="Exit reader"
          className="shrink-0 rounded-full border border-cream/20 p-2 text-sand transition-colors hover:border-gold/60 hover:text-gold sm:hidden"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </Link>
      </header>

      {/* TOC drawer */}
      {tocOpen && (
        <div className="fixed inset-0 z-40" role="dialog" aria-label="Table of contents">
          <button
            type="button"
            aria-label="Close table of contents"
            onClick={() => setTocOpen(false)}
            className="absolute inset-0 bg-ink/70"
          />
          <aside className="absolute inset-y-0 left-0 flex w-[min(85vw,340px)] flex-col border-r border-gold/20 bg-coal">
            <div className="flex items-center justify-between border-b border-gold/15 px-5 py-4">
              <p className="label-eyebrow">Contents</p>
              <button
                type="button"
                onClick={() => setTocOpen(false)}
                aria-label="Close table of contents"
                className="p-1 text-sand hover:text-gold"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6">
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-4">
              {toc.length === 0 ? (
                <p className="font-sans text-sm text-clay">No chapter list available for this book.</p>
              ) : (
                <ul className="space-y-1">
                  {toc.map((item, i) => (
                    <li key={`${item.href}-${i}`}>
                      <button
                        type="button"
                        onClick={() => goTo(item.href)}
                        className="w-full truncate px-2 py-2 text-left font-sans text-sm text-cream/90 hover:bg-wine/60 hover:text-gold"
                      >
                        {item.label}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </aside>
        </div>
      )}

      {/* Reading area */}
      <div className="relative flex-1 overflow-hidden">
        {status === "loading" && (
          <div className="absolute inset-0 z-10">
            <ReaderSkeleton />
          </div>
        )}
        <div className={classNames("mx-auto h-full", wide ? "max-w-4xl" : "max-w-2xl")}>
          <div ref={viewerRef} className="h-full w-full" aria-label="Book content" />
        </div>

        {/* Prev / next edge buttons */}
        <button
          type="button"
          onClick={() => renditionRef.current?.prev()}
          aria-label="Previous page"
          className="absolute left-3 top-1/2 z-10 hidden -translate-y-1/2 rounded-full border border-cream/25 bg-ink/70 p-3 text-cream/90 backdrop-blur transition-colors hover:border-gold/70 hover:text-gold sm:block"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6">
            <path d="M15 5l-7 7 7 7" />
          </svg>
        </button>
        <button
          type="button"
          onClick={() => renditionRef.current?.next()}
          aria-label="Next page"
          className="absolute right-3 top-1/2 z-10 hidden -translate-y-1/2 rounded-full border border-cream/25 bg-ink/70 p-3 text-cream/90 backdrop-blur transition-colors hover:border-gold/70 hover:text-gold sm:block"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6">
            <path d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Bottom progress strip */}
      <footer className="flex h-10 shrink-0 items-center gap-3 border-t border-gold/15 bg-coal/95 px-4 sm:px-6">
        <div
          className="h-1 flex-1 bg-cream/10"
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Reading progress"
        >
          <div className="h-1 bg-gold transition-[width] duration-300" style={{ width: `${progress}%` }} />
        </div>
        <span className="font-sans text-xs text-sand">{progress}%</span>
      </footer>
    </div>
  );
}
