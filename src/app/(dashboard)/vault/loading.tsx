export default function VaultLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header */}
      <div>
        <div className="h-7 w-32 bg-bg-secondary rounded-lg" />
        <div className="h-4 w-64 bg-bg-secondary rounded-lg mt-2" />
      </div>

      {/* Grid of cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 9 }).map((_, i) => (
          <div
            key={i}
            className="h-48 bg-bg-secondary rounded-xl border border-border-default"
          />
        ))}
      </div>
    </div>
  );
}
