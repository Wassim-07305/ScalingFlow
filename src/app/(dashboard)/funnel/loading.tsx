export default function FunnelLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header */}
      <div>
        <div className="h-7 w-40 bg-bg-secondary rounded-lg" />
        <div className="h-4 w-72 bg-bg-secondary rounded-lg mt-2" />
      </div>

      {/* Step indicators */}
      <div className="flex gap-3 items-center">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="h-8 w-8 bg-bg-secondary rounded-full" />
            {i < 4 && <div className="h-0.5 w-10 bg-bg-secondary" />}
          </div>
        ))}
      </div>

      {/* Form area */}
      <div className="space-y-4">
        <div className="h-12 bg-bg-secondary rounded-xl border border-border-default" />
        <div className="h-12 bg-bg-secondary rounded-xl border border-border-default" />
        <div className="h-32 bg-bg-secondary rounded-xl border border-border-default" />
        <div className="h-10 w-36 bg-bg-secondary rounded-lg" />
      </div>
    </div>
  );
}
