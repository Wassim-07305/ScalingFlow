import Link from "next/link";
import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  actionHref?: string;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  actionHref,
  className,
}: EmptyStateProps) {
  const button = actionLabel ? (
    actionHref ? (
      <Link href={actionHref}>
        <Button size="sm" className="gap-2">
          {actionLabel}
          <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      </Link>
    ) : onAction ? (
      <Button onClick={onAction} size="sm" className="gap-2">
        {actionLabel}
        <ArrowRight className="h-3.5 w-3.5" />
      </Button>
    ) : null
  ) : null;

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center py-16 px-4",
        className
      )}
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/10 mb-4">
        <Icon className="h-7 w-7 text-accent" />
      </div>
      <h3 className="text-base font-semibold text-text-primary mb-1">
        {title}
      </h3>
      <p className="text-sm text-text-secondary max-w-sm mb-6">{description}</p>
      {button}
    </div>
  );
}
