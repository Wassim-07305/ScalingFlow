import { cn } from "@/lib/utils/cn";

interface PageHeaderProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
  /** @deprecated Use children instead */
  actions?: React.ReactNode;
}

export function PageHeader({ title, description, children, actions }: PageHeaderProps) {
  const rightContent = children || actions;
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between mb-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {description && (
          <p className="text-text-secondary text-sm mt-1">{description}</p>
        )}
      </div>
      {rightContent && <div className="flex items-center gap-2 mt-4 sm:mt-0">{rightContent}</div>}
    </div>
  );
}
