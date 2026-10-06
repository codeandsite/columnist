"use client";

import { useCallback, useEffect, useState } from "react";
import { useToast } from "@/components/Toast";
import ConfirmDialog from "@/components/ConfirmDialog";
import EmptyState, { TableSkeleton } from "@/components/Skeletons";
import { slugify } from "@/lib/utils";
import type { Category } from "@/lib/types";

type CategoryRow = Category & { book_count: number };

interface FormState {
  name: string;
  slug: string;
  slugTouched: boolean;
  description: string;
  image_url: string;
}

const EMPTY_FORM: FormState = { name: "", slug: "", slugTouched: false, description: "", image_url: "" };

export default function AdminCategoriesPage() {
  const { toast } = useToast();
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<CategoryRow | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<CategoryRow | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/categories");
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Failed to load categories.");
      setCategories(body.categories ?? []);
    } catch (e: any) {
      toast(e?.message || "Failed to load categories.", "error");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  function openAdd() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  }

  function openEdit(c: CategoryRow) {
    setEditing(c);
    setForm({
      name: c.name,
      slug: c.slug,
      slugTouched: true,
      description: c.description ?? "",
      image_url: c.image_url ?? "",
    });
    setModalOpen(true);
  }

  function onNameChange(v: string) {
    setForm((f) => ({ ...f, name: v, slug: f.slugTouched ? f.slug : slugify(v) }));
  }

  async function save() {
    if (!form.name.trim()) {
      toast("Name is required.", "error");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        slug: (form.slug.trim() || slugify(form.name)).trim(),
        description: form.description.trim() || null,
        image_url: form.image_url.trim() || null,
      };
      const res = await fetch(
        editing ? `/api/admin/categories/${editing.id}` : "/api/admin/categories",
        {
          method: editing ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Save failed.");
      toast(editing ? "Category updated." : "Category created.", "success");
      setModalOpen(false);
      load();
    } catch (e: any) {
      toast(e?.message || "Save failed.", "error");
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleting) return;
    setDeleteBusy(true);
    try {
      const res = await fetch(`/api/admin/categories/${deleting.id}`, { method: "DELETE" });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Delete failed.");
      setCategories((c) => c.filter((x) => x.id !== deleting.id));
      toast(`"${deleting.name}" deleted.`, "success");
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
          <p className="label-eyebrow">Taxonomy</p>
          <h1 className="mt-3 font-serif text-4xl text-cream">Categories</h1>
        </div>
        <button type="button" onClick={openAdd} className="btn-crimson px-6 py-3 text-xs">
          + Add Category
        </button>
      </div>
      <div className="rule-gold mt-5" />

      <div className="mt-8">
        {loading ? (
          <TableSkeleton rows={6} cols={4} />
        ) : categories.length === 0 ? (
          <EmptyState
            title="No categories yet"
            message="Create your first category to start organising the catalog."
            action={
              <button type="button" onClick={openAdd} className="btn-crimson px-6 py-3 text-xs">
                + Add Category
              </button>
            }
          />
        ) : (
          <div className="overflow-x-auto border border-cream/10 bg-coal">
            <table className="table-dark w-full min-w-[640px]">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Slug</th>
                  <th>Books</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((c) => (
                  <tr key={c.id}>
                    <td className="font-medium text-cream">{c.name}</td>
                    <td className="font-mono text-xs text-clay">/{c.slug}</td>
                    <td>
                      <span className="inline-flex min-w-[2rem] items-center justify-center border border-gold/40 px-2 py-0.5 font-sans text-xs text-gold">
                        {c.book_count}
                      </span>
                    </td>
                    <td>
                      <div className="flex justify-end gap-3">
                        <button
                          type="button"
                          onClick={() => openEdit(c)}
                          className="font-sans text-xs uppercase tracking-[0.18em] text-gold hover:text-cream"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleting(c)}
                          className="font-sans text-xs uppercase tracking-[0.18em] text-ember hover:text-cream"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={editing ? "Edit category" : "Add category"}>
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => !saving && setModalOpen(false)} />
          <div className="relative w-full max-w-lg animate-fade-up border border-cream/15 bg-coal p-8 shadow-book">
            <h3 className="font-serif text-2xl text-cream">{editing ? "Edit Category" : "Add Category"}</h3>
            <div className="mt-6 space-y-5">
              <div>
                <label htmlFor="cat-name" className="label-eyebrow mb-2 block">Name *</label>
                <input
                  id="cat-name"
                  value={form.name}
                  onChange={(e) => onNameChange(e.target.value)}
                  className="input-dark"
                  placeholder="e.g. Philosophy"
                />
              </div>
              <div>
                <label htmlFor="cat-slug" className="label-eyebrow mb-2 block">Slug</label>
                <input
                  id="cat-slug"
                  value={form.slug}
                  onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value, slugTouched: true }))}
                  className="input-dark font-mono text-xs"
                  placeholder="auto-generated from name"
                />
              </div>
              <div>
                <label htmlFor="cat-desc" className="label-eyebrow mb-2 block">Description</label>
                <textarea
                  id="cat-desc"
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  rows={3}
                  className="input-dark"
                  placeholder="Short description for the category page"
                />
              </div>
              <div>
                <label htmlFor="cat-image" className="label-eyebrow mb-2 block">Image URL</label>
                <input
                  id="cat-image"
                  value={form.image_url}
                  onChange={(e) => setForm((f) => ({ ...f, image_url: e.target.value }))}
                  className="input-dark"
                  placeholder="https://… (optional)"
                />
              </div>
            </div>
            <div className="mt-8 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                disabled={saving}
                className="btn-outline px-6 py-3 text-xs disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={save}
                disabled={saving}
                className="btn-crimson px-6 py-3 text-xs disabled:opacity-50"
              >
                {saving ? "Saving…" : editing ? "Save Changes" : "Add Category"}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!deleting}
        title="Delete this category?"
        message={`"${deleting?.name}" will be deleted. ${deleting && deleting.book_count > 0 ? `It currently has ${deleting.book_count} linked book(s) and cannot be deleted until they are removed.` : "This cannot be undone."}`}
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
