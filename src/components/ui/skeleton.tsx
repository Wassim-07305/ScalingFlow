import { cn } from "@/lib/utils/cn";

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("rounded-[8px] bg-bg-tertiary animate-pulse", className)}
      {...props}
    />
  );
}

function SkeletonLine({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <Skeleton className={cn("h-4 w-full", className)} {...props} />;
}

function SkeletonText({
  lines = 3,
  className,
}: {
  lines?: number;
  className?: string;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <SkeletonLine key={i} style={{ width: `${100 - i * 15}%` }} />
      ))}
    </div>
  );
}

function SkeletonCircle({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <Skeleton className={cn("h-10 w-10 rounded-full", className)} {...props} />
  );
}

function SkeletonCard({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded-[12px] border border-border-default bg-bg-secondary p-5 space-y-3",
        className,
      )}
    >
      <SkeletonLine className="w-1/3 h-5" />
      <SkeletonText lines={2} />
    </div>
  );
}

function SkeletonDashboard() {
  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Welcome Banner */}
      <Skeleton className="h-24 w-full" />
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
      {/* Progress */}
      <Skeleton className="h-16 w-full" />
      {/* Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SkeletonCard className="h-48" />
        <SkeletonCard className="h-48" />
      </div>
    </div>
  );
}

function SkeletonTable({
  rows = 5,
  cols = 4,
}: {
  rows?: number;
  cols?: number;
}) {
  return (
    <div className="space-y-3">
      <div
        className="grid gap-4"
        style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
      >
        {Array.from({ length: cols }).map((_, i) => (
          <SkeletonLine key={i} className="h-3" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="grid gap-4 py-3 border-t border-border-default"
          style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
        >
          {Array.from({ length: cols }).map((_, j) => (
            <SkeletonLine key={j} className="h-4" />
          ))}
        </div>
      ))}
    </div>
  );
}

export {
  Skeleton,
  SkeletonLine,
  SkeletonText,
  SkeletonCircle,
  SkeletonCard,
  SkeletonDashboard,
  SkeletonTable,
};
