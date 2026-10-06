"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/Toast";
import BookCover from "@/components/BookCover";
import type { Book } from "@/lib/types";

export default function SearchOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { toast } = useToast();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Book[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (open) {
      setQuery("");
      setResults([]);
      setTimeout(() => inputRef.current?.focus(), 60);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    if (!query.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    timer.current = setTimeout(async () => {
      try {
        const supabase = createClient();
        const q = `%${query.trim()}%`;
        const { data, error } = await supabase
          .from("books")
          .select("id, title, slug, author, short_description, price, cover_path, book_categories(category:categories(name))")
          .eq("published", true)
          .or(`title.ilike.${q},author.ilike.${q},short_description.ilike.${q},description.ilike.${q}`)
          .limit(8);
        if (error) throw error;
        setResults((data ?? []) as unknown as Book[]);
      } catch {
        toast("Search failed. Please try again.", "error");
      } finally {
        setLoading(false);
      }
    }, 280);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [query, toast]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80]" role="dialog" aria-modal="true" aria-label="Search books">
      <div className="absolute inset-0 bg-ink/95 backdrop-blur-md" onClick={onClose} />
      <div className="relative mx-auto mt-24 w-[min(92vw,720px)] animate-fade-up px-2">
        <div className="border border-cream/15 bg-coal shadow-book">
          <div className="flex items-center gap-4 border-b border-cream/10 px-6 py-5">
            <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0 text-gold" fill="none" stroke="currentColor" strokeWidth="1.6">
              <circle cx="11" cy="11" r="7" />
              <path d="M20 20l-3.5-3.5" />
            </svg>
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search books, authors, topics..."
              className="w-full bg-transparent font-serif text-xl text-cream placeholder:text-clay focus:outline-none"
              aria-label="Search books, authors, topics"
            />
            <button onClick={onClose} className="shrink-0 font-sans text-xs uppercase tracking-[0.2em] text-clay hover:text-cream" aria-label="Close search">
              Esc
            </button>
          </div>
          <div className="max-h-[55vh] overflow-y-auto">
            {loading && (
              <p className="px-6 py-8 font-sans text-sm text-clay">Searching the library…</p>
            )}
            {!loading && query.trim() && results.length === 0 && (
              <div className="px-6 py-12 text-center">
                <p className="font-serif text-xl text-cream">No books found.</p>
                <p className="mt-2 font-sans text-sm text-clay">
                  Try a different title, author or topic.
                </p>
              </div>
            )}
            {!loading &&
              results.map((b) => {
                const cat = b.book_categories?.[0]?.category?.name;
                return (
                  <Link
                    key={b.id}
                    href={`/books/${b.slug}`}
                    onClick={onClose}
                    className="flex items-center gap-5 border-b border-cream/[0.07] px-6 py-4 transition-colors last:border-0 hover:bg-wine/40"
                  >
                    <div className="w-12 shrink-0">
                      <BookCover title={b.title} author={b.author} compact />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-serif text-lg text-cream">{b.title}</p>
                      <p className="mt-0.5 font-sans text-xs uppercase tracking-[0.2em] text-clay">
                        {b.author}{cat ? ` · ${cat}` : ""}
                      </p>
                    </div>
                    <span className="ml-auto shrink-0 font-sans text-sm text-gold">→</span>
                  </Link>
                );
              })}
          </div>
        </div>
      </div>
    </div>
  );
}
