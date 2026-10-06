import { redirect } from "next/navigation";
import { guardUser } from "@/lib/auth";
import ProfileForm from "@/components/ProfileForm";
import Reveal from "@/components/Reveal";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const g = await guardUser();
  if (!g.ok) redirect("/login?next=/profile");
  if (!g.profile) redirect("/login?next=/profile");

  return (
    <div className="mx-auto max-w-4xl px-5 py-12 sm:px-8">
      <Reveal>
        <p className="label-eyebrow">Account</p>
        <h1 className="mt-3 font-serif text-4xl text-cream sm:text-5xl">Profile</h1>
        <p className="mt-3 font-sans text-sm text-clay">
          Manage how you appear on Columnist and keep your account secure.
        </p>
      </Reveal>
      <Reveal delay={100}>
        <div className="mt-10">
          <ProfileForm profile={g.profile} userId={g.userId} />
        </div>
      </Reveal>
    </div>
  );
}
