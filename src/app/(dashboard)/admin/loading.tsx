export default function AdminLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header */}
      <div>
        <div className="h-7 w-48 bg-bg-secondary rounded-lg" />
        <div className="h-4 w-72 bg-bg-secondary rounded-lg mt-2" />
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-24 bg-bg-secondary rounded-xl border border-border-default"
          />
        ))}
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border-default bg-bg-secondary overflow-hidden">
        {/* Table header */}
        <div className="flex gap-4 p-4 border-b border-border-default">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-4 flex-1 bg-bg-secondary rounded-lg" />
          ))}
        </div>
        {/* Table rows */}
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="flex gap-4 p-4 border-b border-border-default last:border-b-0"
          >
            {Array.from({ length: 5 }).map((_, j) => (
              <div key={j} className="h-4 flex-1 bg-bg-secondary rounded-lg" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
