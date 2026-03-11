export default function SalesLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header */}
      <div>
        <div className="h-7 w-36 bg-bg-secondary rounded-lg" />
        <div className="h-4 w-72 bg-bg-secondary rounded-lg mt-2" />
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-9 w-28 bg-bg-secondary rounded-lg" />
        ))}
      </div>

      {/* Content area */}
      <div className="h-64 bg-bg-secondary rounded-xl border border-border-default" />
      <div className="h-48 bg-bg-secondary rounded-xl border border-border-default" />
    </div>
  );
}
