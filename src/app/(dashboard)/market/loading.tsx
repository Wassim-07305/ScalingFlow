export default function MarketLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header */}
      <div>
        <div className="h-7 w-56 bg-bg-secondary rounded-lg" />
        <div className="h-4 w-72 bg-bg-secondary rounded-lg mt-2" />
      </div>

      {/* Form area */}
      <div className="h-64 bg-bg-secondary rounded-xl border border-border-default" />

      {/* Results area */}
      <div className="space-y-4">
        <div className="h-5 w-40 bg-bg-secondary rounded-lg" />
        <div className="h-48 bg-bg-secondary rounded-xl border border-border-default" />
        <div className="h-48 bg-bg-secondary rounded-xl border border-border-default" />
      </div>
    </div>
  );
}
