export default function LeaderboardLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header */}
      <div>
        <div className="h-7 w-44 bg-bg-secondary rounded-lg" />
        <div className="h-4 w-64 bg-bg-secondary rounded-lg mt-2" />
      </div>

      {/* Podium (top 3) */}
      <div className="flex items-end justify-center gap-4 py-6">
        {/* 2nd place */}
        <div className="flex flex-col items-center gap-2">
          <div className="h-14 w-14 rounded-full bg-bg-secondary" />
          <div className="h-4 w-20 bg-bg-secondary rounded-lg" />
          <div className="h-24 w-24 bg-bg-secondary rounded-xl" />
        </div>
        {/* 1st place */}
        <div className="flex flex-col items-center gap-2">
          <div className="h-16 w-16 rounded-full bg-bg-secondary" />
          <div className="h-4 w-24 bg-bg-secondary rounded-lg" />
          <div className="h-32 w-28 bg-bg-secondary rounded-xl" />
        </div>
        {/* 3rd place */}
        <div className="flex flex-col items-center gap-2">
          <div className="h-12 w-12 rounded-full bg-bg-secondary" />
          <div className="h-4 w-20 bg-bg-secondary rounded-lg" />
          <div className="h-20 w-24 bg-bg-secondary rounded-xl" />
        </div>
      </div>

      {/* Ranking list */}
      <div className="space-y-3">
        {Array.from({ length: 7 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 rounded-xl border border-border-default bg-bg-secondary p-4"
          >
            <div className="h-6 w-6 bg-bg-secondary rounded-lg shrink-0" />
            <div className="h-9 w-9 rounded-full bg-bg-secondary shrink-0" />
            <div className="flex-1">
              <div className="h-4 w-36 bg-bg-secondary rounded-lg" />
            </div>
            <div className="h-4 w-20 bg-bg-secondary rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}
