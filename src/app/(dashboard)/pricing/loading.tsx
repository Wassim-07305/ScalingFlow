export default function PricingLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header */}
      <div className="text-center">
        <div className="h-7 w-36 bg-bg-secondary rounded-lg mx-auto" />
        <div className="h-4 w-80 bg-bg-secondary rounded-lg mt-2 mx-auto" />
      </div>

      {/* Toggle (monthly/yearly) */}
      <div className="flex justify-center">
        <div className="h-10 w-56 bg-bg-secondary rounded-xl" />
      </div>

      {/* Pricing cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-border-default bg-bg-secondary p-6 space-y-5"
          >
            {/* Plan name */}
            <div className="h-5 w-24 bg-bg-secondary rounded-lg" />
            {/* Price */}
            <div className="h-10 w-32 bg-bg-secondary rounded-lg" />
            {/* Description */}
            <div className="h-4 w-full bg-bg-secondary rounded-lg" />
            {/* CTA button */}
            <div className="h-11 w-full bg-bg-secondary rounded-xl" />
            {/* Features list */}
            <div className="space-y-3 pt-4 border-t border-border-default">
              {Array.from({ length: 5 }).map((_, j) => (
                <div key={j} className="flex items-center gap-2">
                  <div className="h-4 w-4 bg-bg-secondary rounded-full shrink-0" />
                  <div className="h-4 flex-1 bg-bg-secondary rounded-lg" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
