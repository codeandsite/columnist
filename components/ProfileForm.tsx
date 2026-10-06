"use client";

import Image from "next/image";
import { useState } from "react";
import UploadZone from "@/components/UploadZone";
import { useToast } from "@/components/Toast";
import { avatarUrl } from "@/lib/storage";
import { formatDate, initials, classNames } from "@/lib/utils";
import type { Profile } from "@/lib/types";

export default function ProfileForm({ profile, userId }: { profile: Profile; userId: string }) {
  const { toast } = useToast();
  const [name, setName] = useState(profile.full_name ?? "");
  const [avatarPath, setAvatarPath] = useState<string | null>(profile.avatar_url);
  const [savingName, setSavingName] = useState(false);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const img = avatarUrl(avatarPath);

  async function saveName() {
    const trimmed = name.trim();
    if (!trimmed) {
      toast("Name cannot be empty.", "error");
      return;
    }
    setSavingName(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ full_name: trimmed }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast(body.error || "Could not save your name.", "error");
        return;
      }
      setName(body.profile?.full_name ?? trimmed);
      toast("Your name has been updated.", "success");
    } catch {
      toast("Network error. Please try again.", "error");
    } finally {
      setSavingName(false);
    }
  }

  async function changePassword() {
    if (newPassword !== confirmPassword) {
      toast("The two passwords do not match.", "error");
      return;
    }
    if (newPassword.length < 6) {
      toast("Password must be at least 6 characters long.", "error");
      return;
    }
    setSavingPassword(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast(body.error || "Could not change your password.", "error");
        return;
      }
      setNewPassword("");
      setConfirmPassword("");
      toast("Your password has been changed.", "success");
    } catch {
      toast("Network error. Please try again.", "error");
    } finally {
      setSavingPassword(false);
    }
  }

  const isPro = profile.membership === "pro";

  return (
    <div className="space-y-6">
      {/* Identity */}
      <section className="card-dark p-6 sm:p-8" aria-labelledby="profile-identity">
        <h2 id="profile-identity" className="font-serif text-2xl text-cream">
          Identity
        </h2>
        <div className="mt-6 flex flex-col gap-8 sm:flex-row sm:items-start">
          <div className="flex shrink-0 flex-col items-center gap-3">
            {img ? (
              <Image
                src={img}
                alt="Your avatar"
                width={96}
                height={96}
                className="h-24 w-24 rounded-full border border-gold/30 object-cover"
              />
            ) : (
              <div
                className="flex h-24 w-24 items-center justify-center rounded-full border border-gold/30 bg-wine font-serif text-3xl text-gold"
                aria-hidden="true"
              >
                {initials(name || profile.email)}
              </div>
            )}
          </div>
          <div className="flex-1">
            <UploadZone
              label="Profile photo"
              accept="image/*"
              maxSizeMB={5}
              hint="JPG or PNG, up to 5 MB."
              mode="direct"
              bucket="avatars"
              path={`${userId}/avatar`}
              onUploaded={async (r) => {
                try {
                  const res = await fetch("/api/profile", {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ avatar_url: r.path }),
                  });
                  const body = await res.json().catch(() => ({}));
                  if (!res.ok) throw new Error(body.error || "Failed to save avatar.");
                  setAvatarPath(r.path);
                } catch (e: any) {
                  toast(e?.message || "Could not save your avatar.", "error");
                }
              }}
            />
          </div>
        </div>

        <div className="mt-8 grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="profile-name" className="label-eyebrow mb-2 block">
              Full name
            </label>
            <input
              id="profile-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input-dark w-full"
              placeholder="Your name"
              autoComplete="name"
            />
          </div>
          <div>
            <label htmlFor="profile-email" className="label-eyebrow mb-2 block">
              Email
            </label>
            <input
              id="profile-email"
              type="email"
              value={profile.email ?? ""}
              readOnly
              disabled
              className="input-dark w-full cursor-not-allowed opacity-60"
            />
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-4">
          <button
            type="button"
            onClick={saveName}
            disabled={savingName}
            className="btn-crimson px-6 py-2.5 text-sm disabled:cursor-wait disabled:opacity-60"
          >
            {savingName ? "Saving…" : "Save changes"}
          </button>
          <span
            className={classNames(
              "font-sans text-[11px] font-semibold uppercase tracking-[0.22em]",
              isPro ? "border border-gold/60 px-3 py-1.5 text-gold" : "border border-cream/25 px-3 py-1.5 text-clay"
            )}
            aria-label={`Membership: ${profile.membership}`}
          >
            {isPro ? "Pro member" : "Free member"}
          </span>
          <span className="font-sans text-xs text-clay">
            Member since {formatDate(profile.created_at)}
          </span>
        </div>
      </section>

      {/* Password */}
      <section className="card-dark p-6 sm:p-8" aria-labelledby="profile-password">
        <h2 id="profile-password" className="font-serif text-2xl text-cream">
          Change password
        </h2>
        <p className="mt-2 font-sans text-sm text-clay">
          Choose a new password of at least 6 characters.
        </p>
        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="profile-new-password" className="label-eyebrow mb-2 block">
              New password
            </label>
            <div className="relative">
              <input
                id="profile-new-password"
                type={showNew ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="input-dark w-full pr-16"
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowNew((v) => !v)}
                className="absolute inset-y-0 right-0 px-4 font-sans text-xs uppercase tracking-widest text-sand hover:text-gold"
                aria-label={showNew ? "Hide new password" : "Show new password"}
              >
                {showNew ? "Hide" : "Show"}
              </button>
            </div>
          </div>
          <div>
            <label htmlFor="profile-confirm-password" className="label-eyebrow mb-2 block">
              Confirm password
            </label>
            <div className="relative">
              <input
                id="profile-confirm-password"
                type={showConfirm ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="input-dark w-full pr-16"
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowConfirm((v) => !v)}
                className="absolute inset-y-0 right-0 px-4 font-sans text-xs uppercase tracking-widest text-sand hover:text-gold"
                aria-label={showConfirm ? "Hide confirmation" : "Show confirmation"}
              >
                {showConfirm ? "Hide" : "Show"}
              </button>
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={changePassword}
          disabled={savingPassword}
          className="btn-outline mt-6 px-6 py-2.5 text-sm disabled:cursor-wait disabled:opacity-60"
        >
          {savingPassword ? "Updating…" : "Update password"}
        </button>
      </section>
    </div>
  );
}
