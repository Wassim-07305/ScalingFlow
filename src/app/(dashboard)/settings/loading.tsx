export default function SettingsLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header */}
      <div>
        <div className="h-7 w-36 bg-bg-secondary rounded-lg" />
        <div className="h-4 w-64 bg-bg-secondary rounded-lg mt-2" />
      </div>

      {/* Settings sections */}
      {Array.from({ length: 3 }).map((_, section) => (
        <div
          key={section}
          className="rounded-xl border border-border-default bg-bg-secondary p-6 space-y-5"
        >
          {/* Section title */}
          <div className="h-5 w-40 bg-bg-secondary rounded-lg" />

          {/* Form fields */}
          <div className="grid gap-4 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 w-28 bg-bg-secondary rounded-lg" />
                <div className="h-10 bg-bg-secondary rounded-lg" />
              </div>
            ))}
          </div>

          {/* Save button */}
          <div className="flex justify-end">
            <div className="h-10 w-32 bg-bg-secondary rounded-xl" />
          </div>
        </div>
      ))}
    </div>
  );
}
