"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useToast } from "@/components/Toast";
import ConfirmDialog from "@/components/ConfirmDialog";
import BookCover from "@/components/BookCover";
import ToggleSwitch from "@/components/admin/ToggleSwitch";
import EmptyState, { TableSkeleton } from "@/components/Skeletons";
import { formatDate, formatPKR, debounce } from "@/lib/utils";
import { coverUrl } from "@/lib/storage";
import type { Book, Category } from "@/lib/types";

type BookRow = Book & { categories: Category[] };

export default function AdminBooksPage() {
  const { toast } = useToast();
  const [books, setBooks] = useState<BookRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [deleting, setDeleting] = useState<BookRow | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [toggling, setToggling] = useState<string | null>(null);

  const load = useCallback(async (q: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/books${q ? `?q=${encodeURIComponent(q)}` : ""}`);
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Failed to load books.");
      setBooks(body.books ?? []);
    } catch (e: any) {
      toast(e?.message || "Failed to load books.", "error");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const debouncedLoad = useRef(debounce((q: string) => load(q), 350));
  useEffect(() => {
    load("");
  }, [load]);

  function onSearch(v: string) {
    setQuery(v);
    debouncedLoad.current(v.trim());
  }

  async function patchToggle(book: BookRow, field: "featured" | "published", value: boolean) {
    setToggling(`${book.id}:${field}`);
    const prev = books;
    setBooks((b) => b.map((x) => (x.id === book.id ? { ...x, [field]: value } : x)));
    try {
      const res = await fetch(`/api/admin/books/${book.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Update failed.");
      toast(`"${book.title}" ${field === "featured" ? (value ? "marked featured." : "removed from featured.") : value ? "published." : "unpublished."}`, "success");
    } catch (e: any) {
      setBooks(prev);
      toast(e?.message || "Update failed.", "error");
    } finally {
      setToggling(null);
    }
  }

  async function confirmDelete() {
    if (!deleting) return;
    setDeleteBusy(true);
    try {
      const res = await fetch(`/api/admin/books/${deleting.id}`, { method: "DELETE" });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Delete failed.");
      setBooks((b) => b.filter((x) => x.id !== deleting.id));
      toast(`"${deleting.title}" deleted.`, "success");
      setDeleting(null);
    } catch (e: any) {
      toast(e?.message || "Delete failed.", "error");
    } finally {
      setDeleteBusy(false);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="label-eyebrow">Catalog</p>
          <h1 className="mt-3 font-serif text-4xl text-cream">Books</h1>
        </div>
        <Link href="/admin/books/new" className="btn-crimson px-6 py-3 text-xs">
          + New Book
        </Link>
      </div>
      <div className="rule-gold mt-5" />

      <div className="mt-8 max-w-md">
        <input
          value={query}
          onChange={(e) => onSearch(e.target.value)}
          placeholder="Search by title or author…"
          className="input-dark"
          aria-label="Search books"
        />
      </div>

      <div className="mt-6">
        {loading ? (
          <TableSkeleton rows={6} cols={6} />
        ) : books.length === 0 ? (
          <EmptyState
            title="No books found"
            message={query ? "Nothing matches your search. Try a different title or author." : "Your catalog is empty. Add your first book to get started."}
            action={
              !query ? (
                <Link href="/admin/books/new" className="btn-crimson px-6 py-3 text-xs">
                  + New Book
                </Link>
              ) : undefined
            }
          />
        ) : (
          <div className="overflow-x-auto border border-cream/10 bg-coal">
            <table className="table-dark w-full min-w-[900px]">
              <thead>
                <tr>
                  <th>Book</th>
                  <th>Categories</th>
                  <th>Price</th>
                  <th>Featured</th>
                  <th>Published</th>
                  <th>Updated</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {books.map((b) => {
                  const cover = coverUrl(b.cover_path);
                  return (
                    <tr key={b.id}>
                      <td>
                        <div className="flex items-center gap-4">
                          <div className="relative aspect-[2/3] w-10 shrink-0">
                            {cover ? (
                              <Image src={cover} alt="" fill sizes="40px" className="object-cover" />
                            ) : (
                              <BookCover title={b.title} author={b.author} compact className="w-10" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <Link href={`/admin/books/${b.id}`} className="block truncate font-sans font-medium text-cream hover:text-gold">
                              {b.title}
                            </Link>
                            <p className="mt-0.5 truncate font-sans text-xs text-clay">{b.author}</p>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="flex max-w-[220px] flex-wrap gap-1.5">
                          {b.categories.length === 0 ? (
                            <span className="font-sans text-xs text-clay">—</span>
                          ) : (
                            b.categories.map((c) => (
                              <span key={c.id} className="border border-cream/20 px-2 py-0.5 font-sans text-[11px] text-sand">
                                {c.name}
                              </span>
                            ))
                          )}
                        </div>
                      </td>
                      <td className="whitespace-nowrap">{formatPKR(b.price)}</td>
                      <td>
                        <ToggleSwitch
                          checked={b.featured}
                          disabled={toggling === `${b.id}:featured`}
                          onChange={(v) => patchToggle(b, "featured", v)}
                          label={`Featured — ${b.title}`}
                        />
                      </td>
                      <td>
                        <ToggleSwitch
                          checked={b.published}
                          disabled={toggling === `${b.id}:published`}
                          onChange={(v) => patchToggle(b, "published", v)}
                          label={`Published — ${b.title}`}
                        />
                      </td>
                      <td className="whitespace-nowrap text-clay">{formatDate(b.updated_at)}</td>
                      <td>
                        <div className="flex justify-end gap-3">
                          <Link
                            href={`/admin/books/${b.id}`}
                            className="font-sans text-xs uppercase tracking-[0.18em] text-gold hover:text-cream"
                          >
                            Edit
                          </Link>
                          <button
                            type="button"
                            onClick={() => setDeleting(b)}
                            className="font-sans text-xs uppercase tracking-[0.18em] text-ember hover:text-cream"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!deleting}
        title="Delete this book?"
        message={`"${deleting?.title}" will be permanently deleted along with its files, requests and access grants. This cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        danger
        busy={deleteBusy}
        onConfirm={confirmDelete}
        onCancel={() => !deleteBusy && setDeleting(null)}
      />
    </div>
  );
}
