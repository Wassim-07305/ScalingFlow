"use client";

import { cn } from "@/lib/utils/cn";

interface GlowCardProps extends React.HTMLAttributes<HTMLDivElement> {
  glowColor?: "orange" | "blue" | "cyan" | "purple";
  hoverable?: boolean;
}

export function GlowCard({
  className,
  glowColor = "orange",
  hoverable = true,
  children,
  ...props
}: GlowCardProps) {
  return (
    <div
      className={cn(
        "relative rounded-[16px] bg-bg-secondary border border-border-default p-6 transition-all duration-300",
        hoverable && "hover:border-border-hover",
        className
      )}
      {...props}
    >
      {/* Gradient border overlay */}
      <div
        className="absolute inset-0 rounded-[16px] pointer-events-none opacity-50 transition-opacity duration-300"
        style={{
          padding: "1px",
          background:
            glowColor === "orange"
              ? "linear-gradient(135deg, #FF6B2C, #3B82F6)"
              : glowColor === "blue"
              ? "linear-gradient(135deg, #3B82F6, #06D6A0)"
              : glowColor === "cyan"
              ? "linear-gradient(135deg, #06D6A0, #3B82F6)"
              : "linear-gradient(135deg, #8B5CF6, #FF6B2C)",
          WebkitMask:
            "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
          WebkitMaskComposite: "xor",
          maskComposite: "exclude",
          borderRadius: "16px",
        }}
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
