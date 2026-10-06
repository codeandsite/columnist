"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/Toast";
import ConfirmDialog from "@/components/ConfirmDialog";
import ToggleSwitch from "@/components/admin/ToggleSwitch";
import { Skeleton } from "@/components/Skeletons";
import { coverUrl } from "@/lib/storage";
import { classNames } from "@/lib/utils";
import type { Book, Category } from "@/lib/types";

type FileKind = "cover" | "epub" | "pdf";

const KIND_CONFIG: Record<
  FileKind,
  { label: string; accept: string; maxSizeMB: number; hint: string }
> = {
  cover: {
    label: "Cover Image",
    accept: "image/jpeg,image/png,image/webp",
    maxSizeMB: 8,
    hint: "JPG, PNG or WebP · up to 8 MB",
  },
  epub: {
    label: "EPUB File",
    accept: ".epub",
    maxSizeMB: 100,
    hint: ".epub · up to 100 MB · stored privately",
  },
  pdf: {
    label: "PDF File",
    accept: ".pdf",
    maxSizeMB: 100,
    hint: ".pdf · up to 100 MB · stored privately",
  },
};

function baseName(path: string | null): string | null {
  if (!path) return null;
  const parts = path.split("/");
  return parts[parts.length - 1];
}

/** Single-file uploader that POSTs FormData {file, kind} with progress. */
function FileUploader({
  bookId,
  kind,
  currentPath,
  onChanged,
}: {
  bookId: string;
  kind: FileKind;
  currentPath: string | null;
  onChanged: (path: string | null) => void;
}) {
  const { toast } = useToast();
  const cfg = KIND_CONFIG[kind];
  const inputRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [dragging, setDragging] = useState(false);

  const name = baseName(currentPath);

  async function upload(file: File) {
    setError(null);
    if (file.size > cfg.maxSizeMB * 1024 * 1024) {
      setError(`File is too large. Maximum ${cfg.maxSizeMB} MB.`);
      return;
    }
    setFileName(file.name);
    setProgress(0);
    try {
      const result = await new Promise<{ path: string; url?: string | null }>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", `/api/admin/books/${bookId}/files`);
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100));
        };
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              resolve(JSON.parse(xhr.responseText));
            } catch {
              reject(new Error("Invalid server response."));
            }
          } else {
            try {
              reject(new Error(JSON.parse(xhr.responseText).error || `Upload failed (${xhr.status}).`));
            } catch {
              reject(new Error(`Upload failed (${xhr.status}).`));
            }
          }
        };
        xhr.onerror = () => reject(new Error("Network error during upload."));
        const fd = new FormData();
        fd.append("file", file);
        fd.append("kind", kind);
        xhr.send(fd);
      });
      setProgress(100);
      onChanged(result.path);
      toast(`${cfg.label} uploaded.`, "success");
      // Let the "current file" panel take over again after a beat.
      setTimeout(() => {
        setProgress(null);
        setFileName(null);
      }, 2800);
    } catch (e: any) {
      setError(e?.message || "Upload failed.");
      setProgress(null);
      setFileName(null);
    }
  }

  async function remove() {
    setRemoving(true);
    try {
      const res = await fetch(`/api/admin/books/${bookId}/files?kind=${kind}`, { method: "DELETE" });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Delete failed.");
      onChanged(null);
      setProgress(null);
      setFileName(null);
      toast(`${cfg.label} removed.`, "success");
      setConfirmRemove(false);
    } catch (e: any) {
      toast(e?.message || "Delete failed.", "error");
    } finally {
      setRemoving(false);
    }
  }

  const preview = kind === "cover" && currentPath ? coverUrl(currentPath) : null;

  return (
    <div>
      <p className="mb-2 font-sans text-[11px] font-semibold uppercase tracking-[0.2em] text-sand">
        {cfg.label}
      </p>

      {currentPath && progress !== 100 && (
        <div className="mb-3 flex items-center justify-between gap-4 border border-gold/30 bg-wine/40 px-4 py-3">
          <div className="flex min-w-0 items-center gap-3">
            {preview && (
              <Image src={preview} alt="" width={28} height={40} className="h-10 w-7 shrink-0 object-cover" />
            )}
            <div className="min-w-0">
              <p className="truncate font-sans text-sm text-cream">{name}</p>
              <p className="font-sans text-xs text-clay">Current {kind} file</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setConfirmRemove(true)}
            className="shrink-0 font-sans text-xs uppercase tracking-[0.18em] text-ember hover:text-cream"
          >
            Remove
          </button>
        </div>
      )}

      <div
        role="button"
        tabIndex={0}
        aria-label={`${cfg.label} — drag a file here or click to browse`}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          const f = e.dataTransfer.files?.[0];
          if (f) upload(f);
        }}
        className={classNames(
          "flex cursor-pointer flex-col items-center justify-center border border-dashed px-6 py-8 text-center transition-colors",
          dragging ? "border-gold bg-wine/50" : "border-cream/20 bg-coal hover:border-gold/50"
        )}
      >
        <svg viewBox="0 0 24 24" className="h-7 w-7 text-gold/80" fill="none" stroke="currentColor" strokeWidth="1.4">
          <path d="M12 16V4m0 0l-4 4m4-4l4 4" />
          <path d="M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3" />
        </svg>
        <p className="mt-3 font-sans text-sm text-cream">
          {currentPath ? "Replace — drop a new file or " : "Drop a file or "}
          <span className="text-gold underline underline-offset-4">browse</span>
        </p>
        <p className="mt-2 font-sans text-xs text-clay">{cfg.hint}</p>
        {fileName && progress !== null && progress < 100 && (
          <p className="mt-2 font-sans text-xs text-sand">
            {fileName} — {progress}%
          </p>
        )}
        <input
          ref={inputRef}
          type="file"
          accept={cfg.accept}
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) upload(f);
            e.target.value = "";
          }}
        />
      </div>

      {progress !== null && progress < 100 && (
        <div className="mt-3" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
          <div className="h-1 w-full bg-cream/10">
            <div className="h-1 bg-gold transition-all duration-200" style={{ width: `${progress}%` }} />
          </div>
          <p className="mt-1 font-sans text-xs text-sand">Uploading… {progress}%</p>
        </div>
      )}
      {progress === 100 && fileName && (
        <p className="mt-3 font-sans text-xs text-gold">✓ {fileName} uploaded</p>
      )}
      {error && (
        <p className="mt-3 border border-ember/50 bg-ember/10 px-4 py-3 font-sans text-xs text-cream" role="alert">
          {error}
        </p>
      )}

      <ConfirmDialog
        open={confirmRemove}
        title={`Remove ${cfg.label.toLowerCase()}`}
        message={`Delete the current ${kind} file for this book? This cannot be undone.`}
        confirmLabel="Remove"
        cancelLabel="Keep"
        danger
        busy={removing}
        onConfirm={remove}
        onCancel={() => !removing && setConfirmRemove(false)}
      />
    </div>
  );
}

type BookWithCats = Book & { categories: Category[] };

export default function BookForm({ bookId }: { bookId?: string }) {
  const { toast } = useToast();
  const router = useRouter();
  const isNew = !bookId;

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("0");
  const [featured, setFeatured] = useState(false);
  const [published, setPublished] = useState(false);
  const [selectedCats, setSelectedCats] = useState<string[]>([]);
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [coverPath, setCoverPath] = useState<string | null>(null);
  const [epubPath, setEpubPath] = useState<string | null>(null);
  const [pdfPath, setPdfPath] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/categories")
      .then((r) => r.json())
      .then((body) => setAllCategories(body.categories ?? []))
      .catch(() => setAllCategories([]));
  }, []);

  useEffect(() => {
    if (isNew) return;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/admin/books/${bookId}`);
        const body = await res.json();
        if (!res.ok) throw new Error(body.error || "Failed to load book.");
        const b = body.book as BookWithCats;
        setTitle(b.title ?? "");
        setAuthor(b.author ?? "");
        setShortDescription(b.short_description ?? "");
        setDescription(b.description ?? "");
        setPrice(String(b.price ?? 0));
        setFeatured(Boolean(b.featured));
        setPublished(Boolean(b.published));
        setSelectedCats((b.categories ?? []).map((c) => c.id));
        setCoverPath(b.cover_path ?? null);
        setEpubPath(b.epub_path ?? null);
        setPdfPath(b.pdf_path ?? null);
      } catch (e: any) {
        toast(e?.message || "Failed to load book.", "error");
      } finally {
        setLoading(false);
      }
    })();
  }, [bookId, isNew, toast]);

  function toggleCat(id: string) {
    setSelectedCats((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]));
  }

  async function save() {
    if (!title.trim()) {
      toast("Title is required.", "error");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title: title.trim(),
        author: author.trim() || "Unknown",
        short_description: shortDescription.trim() || null,
        description: description.trim() || null,
        price: price === "" ? 0 : Number(price),
        featured,
        published,
        category_ids: selectedCats,
      };
      const res = await fetch(isNew ? "/api/admin/books" : `/api/admin/books/${bookId}`, {
        method: isNew ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Save failed.");
      toast(isNew ? "Book created." : "Book saved.", "success");
      if (isNew) {
        router.push(`/admin/books/${body.book.id}`);
      } else {
        router.refresh();
      }
    } catch (e: any) {
      toast(e?.message || "Save failed.", "error");
    } finally {
      setSaving(false);
    }
  }

  async function removeBook() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/books/${bookId}`, { method: "DELETE" });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Delete failed.");
      toast("Book deleted.", "success");
      router.push("/admin/books");
    } catch (e: any) {
      toast(e?.message || "Delete failed.", "error");
      setDeleting(false);
      setConfirmDelete(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-1/2" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-12 w-1/3" />
      </div>
    );
  }

  const field = "input-dark";
  const label = "label-eyebrow mb-2 block";

  return (
    <div>
      <div className="grid gap-10 lg:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <div>
            <label htmlFor="bf-title" className={label}>Title *</label>
            <input id="bf-title" value={title} onChange={(e) => setTitle(e.target.value)} className={field} placeholder="Book title" />
          </div>
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="bf-author" className={label}>Author</label>
              <input id="bf-author" value={author} onChange={(e) => setAuthor(e.target.value)} className={field} placeholder="Author name" />
            </div>
            <div>
              <label htmlFor="bf-price" className={label}>Price (PKR)</label>
              <input
                id="bf-price"
                type="number"
                min="0"
                step="1"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className={field}
                placeholder="0"
              />
            </div>
          </div>
          <div>
            <label htmlFor="bf-short" className={label}>Short Description</label>
            <textarea id="bf-short" value={shortDescription} onChange={(e) => setShortDescription(e.target.value)} rows={2} className={field} placeholder="One or two lines for cards and listings" />
          </div>
          <div>
            <label htmlFor="bf-desc" className={label}>Full Description</label>
            <textarea id="bf-desc" value={description} onChange={(e) => setDescription(e.target.value)} rows={7} className={field} placeholder="Long-form description shown on the book page" />
          </div>

          <div>
            <p className={label}>Categories</p>
            {allCategories.length === 0 ? (
              <p className="font-sans text-sm text-clay">No categories yet — create some from the Categories page.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {allCategories.map((c) => {
                  const on = selectedCats.includes(c.id);
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => toggleCat(c.id)}
                      aria-pressed={on}
                      className={classNames(
                        "border px-4 py-2 font-sans text-xs uppercase tracking-[0.14em] transition-colors",
                        on
                          ? "border-gold bg-gold/15 text-gold"
                          : "border-cream/20 text-clay hover:border-cream/40 hover:text-cream"
                      )}
                    >
                      {c.name}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-8 border border-cream/10 bg-coal p-5">
            <div className="flex items-center gap-3">
              <ToggleSwitch checked={published} onChange={setPublished} label="Published" />
              <span className="font-sans text-sm text-cream">Published</span>
            </div>
            <div className="flex items-center gap-3">
              <ToggleSwitch checked={featured} onChange={setFeatured} label="Featured" />
              <span className="font-sans text-sm text-cream">Featured</span>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          {!isNew && bookId ? (
            <>
              <FileUploader bookId={bookId} kind="cover" currentPath={coverPath} onChanged={setCoverPath} />
              <FileUploader bookId={bookId} kind="epub" currentPath={epubPath} onChanged={setEpubPath} />
              <FileUploader bookId={bookId} kind="pdf" currentPath={pdfPath} onChanged={setPdfPath} />
            </>
          ) : (
            <div className="border border-cream/10 bg-coal p-6">
              <p className="font-sans text-sm leading-relaxed text-clay">
                Cover, EPUB and PDF uploads appear after the book is created. Save the book first —
                you will be taken to this page with the upload zones ready.
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="mt-10 flex flex-wrap items-center gap-4 border-t border-cream/10 pt-8">
        <button type="button" onClick={save} disabled={saving} className="btn-crimson px-8 py-4 text-sm">
          {saving ? "Saving…" : isNew ? "Create Book" : "Save Changes"}
        </button>
        {!isNew && (
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            className="inline-flex items-center justify-center gap-3 border border-ember/60 px-8 py-4 font-sans text-sm font-medium uppercase tracking-[0.18em] text-ember transition-colors hover:bg-ember hover:text-cream"
          >
            Delete Book
          </button>
        )}
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title="Delete this book?"
        message={`"${title}" will be permanently deleted along with its files, requests and access grants. This cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        danger
        busy={deleting}
        onConfirm={removeBook}
        onCancel={() => !deleting && setConfirmDelete(false)}
      />
    </div>
  );
}
