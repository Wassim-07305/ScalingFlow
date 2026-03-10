export default function ProgressLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header */}
      <div>
        <div className="h-7 w-44 bg-bg-secondary rounded-lg" />
        <div className="h-4 w-72 bg-bg-secondary rounded-lg mt-2" />
      </div>

      {/* Overall progress bar */}
      <div className="rounded-xl border border-border-default bg-bg-secondary p-5 space-y-3">
        <div className="flex justify-between">
          <div className="h-4 w-36 bg-bg-secondary rounded-lg" />
          <div className="h-4 w-12 bg-bg-secondary rounded-lg" />
        </div>
        <div className="h-3 w-full bg-bg-secondary rounded-full" />
      </div>

      {/* Progress cards grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-border-default bg-bg-secondary p-5 space-y-3"
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-bg-secondary rounded-lg shrink-0" />
              <div className="h-5 w-28 bg-bg-secondary rounded-lg" />
            </div>
            <div className="h-3 w-full bg-bg-secondary rounded-full" />
            <div className="flex justify-between">
              <div className="h-3 w-16 bg-bg-secondary rounded-lg" />
              <div className="h-3 w-10 bg-bg-secondary rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
