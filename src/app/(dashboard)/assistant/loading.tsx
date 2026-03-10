export default function AssistantLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header */}
      <div>
        <div className="h-7 w-36 bg-bg-secondary rounded-lg" />
        <div className="h-4 w-64 bg-bg-secondary rounded-lg mt-2" />
      </div>

      {/* Chat area */}
      <div className="rounded-xl border border-border-default bg-bg-secondary flex flex-col h-[60vh]">
        {/* Messages area */}
        <div className="flex-1 p-4 space-y-4">
          {/* Assistant message */}
          <div className="flex gap-3">
            <div className="h-8 w-8 rounded-full bg-bg-secondary shrink-0" />
            <div className="space-y-2 max-w-[70%]">
              <div className="h-4 w-64 bg-bg-secondary rounded-lg" />
              <div className="h-4 w-48 bg-bg-secondary rounded-lg" />
            </div>
          </div>
          {/* User message */}
          <div className="flex gap-3 justify-end">
            <div className="space-y-2 max-w-[70%]">
              <div className="h-4 w-52 bg-bg-secondary rounded-lg ml-auto" />
            </div>
            <div className="h-8 w-8 rounded-full bg-bg-secondary shrink-0" />
          </div>
          {/* Assistant message */}
          <div className="flex gap-3">
            <div className="h-8 w-8 rounded-full bg-bg-secondary shrink-0" />
            <div className="space-y-2 max-w-[70%]">
              <div className="h-4 w-72 bg-bg-secondary rounded-lg" />
              <div className="h-4 w-56 bg-bg-secondary rounded-lg" />
              <div className="h-4 w-40 bg-bg-secondary rounded-lg" />
            </div>
          </div>
        </div>

        {/* Input bar */}
        <div className="p-4 border-t border-border-default">
          <div className="h-12 bg-bg-secondary rounded-xl" />
        </div>
      </div>
    </div>
  );
}
