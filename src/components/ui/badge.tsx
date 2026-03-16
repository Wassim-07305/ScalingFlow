import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils/cn";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "bg-accent-muted text-accent",
        blue: "bg-info/12 text-info",
        cyan: "bg-accent-muted text-accent",
        purple: "bg-[rgba(139,92,246,0.12)] text-[#A78BFA]",
        red: "bg-danger/12 text-danger",
        yellow: "bg-warning/12 text-warning",
        muted: "bg-bg-tertiary text-text-secondary",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends
    React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
