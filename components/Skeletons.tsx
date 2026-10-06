import { classNames } from "@/lib/utils";

/* ── Loading skeletons ─────────────────────────────────────────── */

export function Skeleton({ className }: { className?: string }) {
  return <div className={classNames("animate-pulse bg-cream/[0.07]", className)} aria-hidden="true" />;
}

export function BookCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={classNames("flex flex-col gap-4", className)}>
      <Skeleton className="aspect-[2/3] w-full" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  );
}

export function BookGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4" aria-label="Loading books">
      {Array.from({ length: count }).map((_, i) => (
        <BookCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-8" aria-label="Loading dashboard">
      <Skeleton className="h-10 w-64" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28" />
        ))}
      </div>
      <Skeleton className="h-64" />
    </div>
  );
}

export function TableSkeleton({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="space-y-3" aria-label="Loading">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-3">
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton key={c} className="h-10 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function ReaderSkeleton() {
  return (
    <div className="flex h-screen flex-col bg-ink" aria-label="Loading reader">
      <Skeleton className="h-16 w-full" />
      <div className="mx-auto w-full max-w-3xl flex-1 space-y-4 px-6 py-12">
        <Skeleton className="h-8 w-2/3" />
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-4 w-full" />
        ))}
      </div>
    </div>
  );
}

/* ── Empty state ───────────────────────────────────────────────── */

export default function EmptyState({
  title,
  message,
  action,
}: {
  title: string;
  message: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center px-6 py-20 text-center">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-gold/30">
        <svg viewBox="0 0 24 24" className="h-7 w-7 text-gold/80" fill="none" stroke="currentColor" strokeWidth="1.4">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V4H6.5A2.5 2.5 0 0 0 4 6.5v13Z" />
          <path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5" />
        </svg>
      </div>
      <h3 className="font-serif text-2xl text-cream">{title}</h3>
      <p className="mt-3 max-w-md font-sans text-sm leading-relaxed text-clay">{message}</p>
      {action && <div className="mt-8">{action}</div>}
    </div>
  );
}
