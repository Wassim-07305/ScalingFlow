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
    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between mb-8">
      <div>
        <div className="flex items-center gap-2.5">
          <div className="h-2 w-2 rounded-full bg-accent animate-pulse" />
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        </div>
        {description && (
          <p className="text-text-secondary text-sm mt-1.5 ml-[18px]">{description}</p>
        )}
      </div>
      {rightContent && <div className="flex items-center gap-2 mt-4 sm:mt-0">{rightContent}</div>}
    </div>
  );
}
