"use client";

import { cn } from "@/lib/utils/cn";

interface GlowCardProps extends React.HTMLAttributes<HTMLDivElement> {
  glowColor?: "orange" | "blue" | "cyan" | "purple" | "emerald";
  hoverable?: boolean;
  intensity?: "subtle" | "medium" | "strong";
}

const glowStyles = {
  orange: {
    border: "hover:border-orange-500/40",
    shadow: "hover:shadow-[0_0_30px_rgba(249,115,22,0.15)]",
    glow: "after:bg-gradient-to-r after:from-orange-500/20 after:to-amber-500/20",
  },
  blue: {
    border: "hover:border-blue-500/40",
    shadow: "hover:shadow-[0_0_30px_rgba(59,130,246,0.15)]",
    glow: "after:bg-gradient-to-r after:from-blue-500/20 after:to-cyan-500/20",
  },
  cyan: {
    border: "hover:border-cyan-500/40",
    shadow: "hover:shadow-[0_0_30px_rgba(6,182,212,0.15)]",
    glow: "after:bg-gradient-to-r after:from-cyan-500/20 after:to-teal-500/20",
  },
  purple: {
    border: "hover:border-purple-500/40",
    shadow: "hover:shadow-[0_0_30px_rgba(139,92,246,0.15)]",
    glow: "after:bg-gradient-to-r after:from-purple-500/20 after:to-pink-500/20",
  },
  emerald: {
    border: "hover:border-emerald-500/40",
    shadow: "hover:shadow-[0_0_30px_rgba(52,211,153,0.15)]",
    glow: "after:bg-gradient-to-r after:from-emerald-500/20 after:to-teal-500/20",
  },
};

export function GlowCard({
  className,
  glowColor = "emerald",
  hoverable = true,
  intensity = "medium",
  children,
  ...props
}: GlowCardProps) {
  const colors = glowStyles[glowColor];

  return (
    <div
      className={cn(
        "relative rounded-xl bg-bg-secondary border border-border-default p-5 transition-all duration-300",
        hoverable && [colors.border, colors.shadow, "hover:translate-y-[-2px]"],
        // Glow effect pseudo-element
        hoverable &&
          intensity !== "subtle" && [
            "after:absolute after:inset-0 after:rounded-xl after:opacity-0 after:transition-opacity after:duration-300 after:-z-10 after:blur-xl",
            colors.glow,
            "hover:after:opacity-100",
          ],
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
