export default function BrandLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header */}
      <div>
        <div className="h-7 w-44 bg-bg-secondary rounded-lg" />
        <div className="h-4 w-72 bg-bg-secondary rounded-lg mt-2" />
      </div>

      {/* Form + Preview layout */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Form section */}
        <div className="space-y-4 rounded-xl border border-border-default bg-bg-secondary p-6">
          {/* Logo upload */}
          <div className="h-24 w-24 bg-bg-secondary rounded-xl mx-auto" />
          {/* Form fields */}
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 w-28 bg-bg-secondary rounded-lg" />
              <div className="h-10 bg-bg-secondary rounded-lg" />
            </div>
          ))}
          {/* Color palette */}
          <div className="space-y-2">
            <div className="h-4 w-32 bg-bg-secondary rounded-lg" />
            <div className="flex gap-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="h-10 w-10 bg-bg-secondary rounded-full"
                />
              ))}
            </div>
          </div>
          {/* Font selectors */}
          <div className="space-y-2">
            <div className="h-4 w-24 bg-bg-secondary rounded-lg" />
            <div className="h-10 bg-bg-secondary rounded-lg" />
          </div>
        </div>

        {/* Preview section */}
        <div className="rounded-xl border border-border-default bg-bg-secondary p-6">
          <div className="h-6 w-28 bg-bg-secondary rounded-lg mb-4" />
          <div className="h-64 bg-bg-secondary rounded-xl" />
        </div>
      </div>
    </div>
  );
}
