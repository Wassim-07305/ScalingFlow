"use client";

import { cn } from "@/lib/utils/cn";

interface GlowCardProps extends React.HTMLAttributes<HTMLDivElement> {
  glowColor?: "emerald" | "orange" | "blue" | "cyan" | "purple";
  hoverable?: boolean;
}

const glowColors = {
  emerald: "hover:shadow-emerald-500/10 hover:border-emerald-500/20",
  orange: "hover:shadow-orange-500/10 hover:border-orange-500/20",
  blue: "hover:shadow-blue-500/10 hover:border-blue-500/20",
  cyan: "hover:shadow-cyan-500/10 hover:border-cyan-500/20",
  purple: "hover:shadow-purple-500/10 hover:border-purple-500/20",
};

export function GlowCard({
  className,
  glowColor = "emerald",
  hoverable = true,
  children,
  ...props
}: GlowCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl bg-bg-secondary border border-border-default p-5 transition-all duration-300",
        hoverable && [
          "hover:shadow-lg",
          glowColors[glowColor],
        ],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
