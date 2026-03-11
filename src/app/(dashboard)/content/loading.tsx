export default function ContentLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header */}
      <div>
        <div className="h-7 w-52 bg-bg-secondary rounded-lg" />
        <div className="h-4 w-80 bg-bg-secondary rounded-lg mt-2" />
      </div>

      {/* Tabs bar */}
      <div className="flex gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-9 w-28 bg-bg-secondary rounded-lg" />
        ))}
      </div>

      {/* Content area */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-44 bg-bg-secondary rounded-xl border border-border-default"
          />
        ))}
      </div>
    </div>
  );
}
