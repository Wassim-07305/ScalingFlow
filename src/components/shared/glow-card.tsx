"use client";

import { cn } from "@/lib/utils/cn";

interface GlowCardProps extends React.HTMLAttributes<HTMLDivElement> {
  glowColor?: "orange" | "blue" | "cyan" | "purple";
  hoverable?: boolean;
}

export function GlowCard({
  className,
  hoverable = true,
  children,
  ...props
}: GlowCardProps) {
  return (
    <div
      className={cn(
        "rounded-[12px] bg-bg-secondary border border-border-default p-5 transition-colors duration-150",
        hoverable && "hover:border-border-hover",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
