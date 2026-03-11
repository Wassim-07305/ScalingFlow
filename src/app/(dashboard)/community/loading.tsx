export default function CommunityLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header */}
      <div>
        <div className="h-7 w-44 bg-bg-secondary rounded-lg" />
        <div className="h-4 w-72 bg-bg-secondary rounded-lg mt-2" />
      </div>

      {/* New post box */}
      <div className="rounded-xl border border-border-default bg-bg-secondary p-4">
        <div className="flex gap-3 items-center">
          <div className="h-10 w-10 rounded-full bg-bg-secondary shrink-0" />
          <div className="h-10 flex-1 bg-bg-secondary rounded-lg" />
        </div>
      </div>

      {/* Post feed */}
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-border-default bg-bg-secondary p-5 space-y-4"
          >
            {/* Post header */}
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-bg-secondary shrink-0" />
              <div className="space-y-1">
                <div className="h-4 w-32 bg-bg-secondary rounded-lg" />
                <div className="h-3 w-20 bg-bg-secondary rounded-lg" />
              </div>
            </div>
            {/* Post body */}
            <div className="space-y-2">
              <div className="h-4 w-full bg-bg-secondary rounded-lg" />
              <div className="h-4 w-4/5 bg-bg-secondary rounded-lg" />
              <div className="h-4 w-3/5 bg-bg-secondary rounded-lg" />
            </div>
            {/* Post actions */}
            <div className="flex gap-6 pt-2 border-t border-border-default">
              <div className="h-4 w-16 bg-bg-secondary rounded-lg" />
              <div className="h-4 w-20 bg-bg-secondary rounded-lg" />
              <div className="h-4 w-16 bg-bg-secondary rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
