export default function ActivityLogLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header */}
      <div>
        <div className="h-7 w-52 bg-bg-secondary rounded-lg" />
        <div className="h-4 w-80 bg-bg-secondary rounded-lg mt-2" />
      </div>

      {/* Filter bar */}
      <div className="flex gap-3">
        <div className="h-10 w-48 bg-bg-secondary rounded-lg" />
        <div className="h-10 w-36 bg-bg-secondary rounded-lg" />
        <div className="h-10 w-36 bg-bg-secondary rounded-lg" />
      </div>

      {/* Activity list rows */}
      <div className="space-y-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 rounded-xl border border-border-default bg-bg-secondary p-4"
          >
            <div className="h-9 w-9 rounded-full bg-bg-secondary shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-3/5 bg-bg-secondary rounded-lg" />
              <div className="h-3 w-2/5 bg-bg-secondary rounded-lg" />
            </div>
            <div className="h-4 w-20 bg-bg-secondary rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}
