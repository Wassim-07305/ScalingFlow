export default function OfferLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header */}
      <div>
        <div className="h-7 w-44 bg-bg-secondary rounded-lg" />
        <div className="h-4 w-80 bg-bg-secondary rounded-lg mt-2" />
      </div>

      {/* Form + Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form */}
        <div className="space-y-4">
          <div className="h-12 bg-bg-secondary rounded-xl border border-border-default" />
          <div className="h-12 bg-bg-secondary rounded-xl border border-border-default" />
          <div className="h-32 bg-bg-secondary rounded-xl border border-border-default" />
          <div className="h-10 w-36 bg-bg-secondary rounded-lg" />
        </div>
        {/* Preview */}
        <div className="h-80 bg-bg-secondary rounded-xl border border-border-default" />
      </div>
    </div>
  );
}
