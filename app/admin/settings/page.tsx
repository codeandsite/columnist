"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/components/Toast";
import { Skeleton } from "@/components/Skeletons";

export default function AdminSettingsPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [siteName, setSiteName] = useState("");
  const [tagline, setTagline] = useState("");
  const [contactEmail, setContactEmail] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/admin/settings");
        const body = await res.json();
        if (!res.ok) throw new Error(body.error || "Failed to load settings.");
        const s = body.settings ?? {};
        setSiteName(s.site_name ?? "");
        setTagline(s.tagline ?? "");
        setContactEmail(s.contact_email ?? "");
      } catch (e: any) {
        toast(e?.message || "Failed to load settings.", "error");
      } finally {
        setLoading(false);
      }
    })();
  }, [toast]);

  async function save() {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          settings: {
            site_name: siteName.trim(),
            tagline: tagline.trim(),
            contact_email: contactEmail.trim(),
          },
        }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Save failed.");
      toast("Settings saved.", "success");
    } catch (e: any) {
      toast(e?.message || "Save failed.", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <p className="label-eyebrow">Configuration</p>
      <h1 className="mt-3 font-serif text-4xl text-cream">Settings</h1>
      <div className="rule-gold mt-5" />

      <div className="card-dark mt-10 max-w-2xl p-6 lg:p-8">
        {loading ? (
          <div className="space-y-5">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : (
          <div className="space-y-6">
            <div>
              <label htmlFor="set-site-name" className="label-eyebrow mb-2 block">Site Name</label>
              <input
                id="set-site-name"
                value={siteName}
                onChange={(e) => setSiteName(e.target.value)}
                className="input-dark"
                placeholder="Columnist"
              />
            </div>
            <div>
              <label htmlFor="set-tagline" className="label-eyebrow mb-2 block">Tagline</label>
              <input
                id="set-tagline"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                className="input-dark"
                placeholder="Ebooks for a wiser you"
              />
            </div>
            <div>
              <label htmlFor="set-contact" className="label-eyebrow mb-2 block">Contact Email</label>
              <input
                id="set-contact"
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                className="input-dark"
                placeholder="hello@columnist.site"
              />
            </div>
            <div className="pt-2">
              <button type="button" onClick={save} disabled={saving} className="btn-crimson px-8 py-4 text-sm">
                {saving ? "Saving…" : "Save Settings"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
