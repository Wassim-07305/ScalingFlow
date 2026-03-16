interface PageHeaderProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
  /** @deprecated Use children instead */
  actions?: React.ReactNode;
  /** Optional badge text displayed next to title */
  badge?: string;
}

export function PageHeader({
  title,
  description,
  children,
  actions,
  badge,
}: PageHeaderProps) {
  const rightContent = children || actions;
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8">
      <div className="space-y-1">
        <div className="flex items-center gap-2 sm:gap-3">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight bg-gradient-to-r from-text-primary to-text-primary/70 bg-clip-text">
            {title}
          </h1>
          {badge && (
            <span className="inline-flex items-center rounded-full bg-accent/10 px-2.5 py-0.5 text-xs font-medium text-accent">
              {badge}
            </span>
          )}
        </div>
        {description && (
          <p className="text-text-secondary text-sm max-w-xl">{description}</p>
        )}
      </div>
      {rightContent && (
        <div className="flex items-center gap-3 mt-4 sm:mt-0">
          {rightContent}
        </div>
      )}
    </div>
  );
}
