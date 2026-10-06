"use client";

import { classNames } from "@/lib/utils";

/** Compact on/off switch for admin tables. */
export default function ToggleSwitch({
  checked,
  onChange,
  label,
  disabled,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={classNames(
        "relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-50",
        checked ? "bg-gold" : "bg-cream/15"
      )}
    >
      <span
        className={classNames(
          "absolute top-0.5 h-5 w-5 rounded-full bg-cream shadow transition-all",
          checked ? "left-[22px]" : "left-0.5"
        )}
      />
    </button>
  );
}
