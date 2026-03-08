import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center py-16 px-4 rounded-xl border border-dashed border-border-default bg-gradient-to-b from-bg-secondary to-transparent",
        className
      )}
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/10 mb-5">
        <Icon className="h-7 w-7 text-accent/70" />
      </div>
      <h3 className="text-base font-semibold text-text-primary mb-1.5">
        {title}
      </h3>
      <p className="text-sm text-text-secondary max-w-sm mb-6">{description}</p>
      {actionLabel && onAction && (
        <Button onClick={onAction} size="sm">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
