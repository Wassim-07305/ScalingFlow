export default function AdsCreativesLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="h-7 w-36 bg-bg-secondary rounded-lg" />
          <div className="h-4 w-64 bg-bg-secondary rounded-lg mt-2" />
        </div>
        <div className="h-10 w-36 bg-bg-secondary rounded-lg" />
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-24 bg-bg-secondary rounded-xl border border-border-default"
          />
        ))}
      </div>

      {/* Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-52 bg-bg-secondary rounded-xl border border-border-default"
          />
        ))}
      </div>
    </div>
  );
}
