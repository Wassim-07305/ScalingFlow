export default function RoadmapLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header */}
      <div>
        <div className="h-7 w-36 bg-bg-secondary rounded-lg" />
        <div className="h-4 w-72 bg-bg-secondary rounded-lg mt-2" />
      </div>

      {/* Timeline / Milestones */}
      <div className="space-y-6">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex gap-4">
            {/* Timeline line + dot */}
            <div className="flex flex-col items-center">
              <div className="h-5 w-5 bg-bg-secondary rounded-full shrink-0" />
              {i < 4 && <div className="w-0.5 flex-1 bg-bg-secondary mt-1" />}
            </div>
            {/* Milestone card */}
            <div className="flex-1 rounded-xl border border-border-default bg-bg-secondary p-5 space-y-3 mb-2">
              <div className="flex items-center justify-between">
                <div className="h-5 w-40 bg-bg-secondary rounded-lg" />
                <div className="h-5 w-20 bg-bg-secondary rounded-lg" />
              </div>
              <div className="h-4 w-full bg-bg-secondary rounded-lg" />
              <div className="h-4 w-3/4 bg-bg-secondary rounded-lg" />
              {/* Progress */}
              <div className="h-2 w-full bg-bg-secondary rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
