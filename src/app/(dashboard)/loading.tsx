export default function DashboardLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Page header */}
      <div>
        <div className="h-7 w-40 bg-bg-tertiary rounded" />
        <div className="h-4 w-64 bg-bg-tertiary rounded mt-2" />
      </div>

      {/* Welcome banner */}
      <div className="h-28 bg-bg-secondary rounded-xl border border-border-default" />

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-24 bg-bg-secondary rounded-xl border border-border-default"
          />
        ))}
      </div>

      {/* Progress bar */}
      <div className="h-16 bg-bg-secondary rounded-xl border border-border-default" />

      {/* Pipeline + Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-64 bg-bg-secondary rounded-xl border border-border-default" />
        <div className="h-64 bg-bg-secondary rounded-xl border border-border-default" />
      </div>

      {/* Recommendations */}
      <div className="h-48 bg-bg-secondary rounded-xl border border-border-default" />

      {/* Activity feed */}
      <div className="h-56 bg-bg-secondary rounded-xl border border-border-default" />

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-52 bg-bg-secondary rounded-xl border border-border-default" />
        <div className="h-52 bg-bg-secondary rounded-xl border border-border-default" />
      </div>
    </div>
  );
}
