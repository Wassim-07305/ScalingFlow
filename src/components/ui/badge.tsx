import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils/cn";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "bg-neon-orange-glow text-neon-orange",
        blue: "bg-neon-blue-glow text-neon-blue",
        cyan: "bg-neon-cyan-glow text-neon-cyan",
        purple: "bg-neon-purple-glow text-neon-purple",
        red: "bg-neon-red/15 text-neon-red",
        yellow: "bg-neon-yellow/15 text-neon-yellow",
        muted: "bg-bg-tertiary text-text-secondary",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
