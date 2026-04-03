/**
 * Skeleton — shimmer loading placeholders for dashboard pages.
 *
 * Usage:
 *   <Skeleton className="h-4 w-32" />
 *   <SkeletonCard />
 *   <SkeletonGrid cols={4} count={8} />
 *   <SkeletonTable rows={5} cols={6} />
 */

export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-lg bg-text/[0.06] ${className}`}
    />
  );
}

export function SkeletonCard({ aspectSquare = false }: { aspectSquare?: boolean }) {
  return (
    <div className="bg-bg border border-text/5 rounded-2xl overflow-hidden">
      {aspectSquare && <Skeleton className="aspect-square rounded-none" />}
      <div className="p-4 space-y-2.5">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  );
}

export function SkeletonGrid({
  cols = 4,
  count = 8,
  aspectSquare = false,
}: {
  cols?: number;
  count?: number;
  aspectSquare?: boolean;
}) {
  const gridClass =
    cols === 2 ? "grid-cols-2"
    : cols === 3 ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
    : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4";

  return (
    <div className={`grid ${gridClass} gap-3`}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} aspectSquare={aspectSquare} />
      ))}
    </div>
  );
}

export function SkeletonTable({ rows = 5, cols = 6 }: { rows?: number; cols?: number }) {
  return (
    <div className="bg-white rounded-2xl border border-text/5 overflow-hidden">
      <div className="p-4 border-b border-text/5">
        <Skeleton className="h-4 w-32" />
      </div>
      <div className="p-4 space-y-3">
        {/* Header row */}
        <div className="flex gap-4">
          {Array.from({ length: cols }).map((_, i) => (
            <Skeleton key={`h-${i}`} className="h-3 flex-1" />
          ))}
        </div>
        {/* Data rows */}
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="flex gap-4">
            {Array.from({ length: cols }).map((_, c) => (
              <Skeleton
                key={`${r}-${c}`}
                className={`h-4 flex-1 ${c === 0 ? "max-w-[60px]" : ""}`}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonStats({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white rounded-2xl border border-text/5 p-5 space-y-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-7 w-16" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonAchievements({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="border border-text/5 rounded-2xl p-4 text-center space-y-2">
          <Skeleton className="h-8 w-8 rounded-full mx-auto" />
          <Skeleton className="h-3 w-20 mx-auto" />
          <Skeleton className="h-2 w-full" />
          <Skeleton className="h-1.5 w-full rounded-full" />
        </div>
      ))}
    </div>
  );
}
