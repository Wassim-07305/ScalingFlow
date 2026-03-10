export default function AcademyLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header */}
      <div>
        <div className="h-7 w-40 bg-bg-secondary rounded-lg" />
        <div className="h-4 w-72 bg-bg-secondary rounded-lg mt-2" />
      </div>

      {/* Category tabs */}
      <div className="flex gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-9 w-24 bg-bg-secondary rounded-lg" />
        ))}
      </div>

      {/* Course cards grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-border-default bg-bg-secondary overflow-hidden"
          >
            {/* Thumbnail */}
            <div className="h-36 bg-bg-secondary" />
            {/* Card body */}
            <div className="p-4 space-y-3">
              <div className="h-5 w-3/4 bg-bg-secondary rounded-lg" />
              <div className="h-4 w-full bg-bg-secondary rounded-lg" />
              <div className="flex items-center justify-between">
                <div className="h-4 w-20 bg-bg-secondary rounded-lg" />
                <div className="h-4 w-16 bg-bg-secondary rounded-lg" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
