import { classNames } from "@/lib/utils";

/** Palette-true status badges: pending = sand outline, approved = gold solid, rejected = ember. */
export default function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={classNames(
        "inline-flex items-center px-3 py-1 font-sans text-[11px] font-semibold uppercase tracking-[0.18em]",
        status === "pending" && "border border-sand/60 text-sand",
        status === "approved" && "bg-gold text-ink",
        status === "rejected" && "bg-ember text-cream"
      )}
    >
      {status}
    </span>
  );
}

export function MembershipBadge({ membership }: { membership: string }) {
  return (
    <span
      className={classNames(
        "inline-flex items-center px-3 py-1 font-sans text-[11px] font-semibold uppercase tracking-[0.18em]",
        membership === "pro" ? "bg-gold text-ink" : "border border-cream/25 text-clay"
      )}
    >
      {membership}
    </span>
  );
}
