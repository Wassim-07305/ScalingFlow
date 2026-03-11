export default function AdsLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header */}
      <div>
        <div className="h-7 w-36 bg-bg-secondary rounded-lg" />
        <div className="h-4 w-64 bg-bg-secondary rounded-lg mt-2" />
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

      {/* Table */}
      <div className="h-72 bg-bg-secondary rounded-xl border border-border-default" />
    </div>
  );
}
