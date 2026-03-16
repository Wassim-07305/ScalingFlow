"use client";

import { cn } from "@/lib/utils/cn";

interface ViabilityScoreProps {
  score: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function ViabilityScore({
  score,
  size = "md",
  className,
}: ViabilityScoreProps) {
  const getColor = () => {
    if (score >= 80)
      return { stroke: "#06D6A0", bg: "rgba(6, 214, 160, 0.15)" };
    if (score >= 60)
      return { stroke: "#3B82F6", bg: "rgba(59, 130, 246, 0.15)" };
    if (score >= 40)
      return { stroke: "#FBBF24", bg: "rgba(251, 191, 36, 0.15)" };
    return { stroke: "#EF4444", bg: "rgba(239, 68, 68, 0.15)" };
  };

  const colors = getColor();
  const dimensions = {
    sm: { size: 48, strokeWidth: 4, fontSize: "text-xs", r: 18 },
    md: { size: 80, strokeWidth: 5, fontSize: "text-lg", r: 32 },
    lg: { size: 120, strokeWidth: 6, fontSize: "text-2xl", r: 50 },
  };

  const d = dimensions[size];
  const circumference = 2 * Math.PI * d.r;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div
      className={cn(
        "relative inline-flex items-center justify-center",
        className,
      )}
      style={{ width: d.size, height: d.size }}
    >
      <svg width={d.size} height={d.size} className="-rotate-90">
        {/* Background circle */}
        <circle
          cx={d.size / 2}
          cy={d.size / 2}
          r={d.r}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={d.strokeWidth}
        />
        {/* Progress circle */}
        <circle
          cx={d.size / 2}
          cy={d.size / 2}
          r={d.r}
          fill="none"
          stroke={colors.stroke}
          strokeWidth={d.strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 1s ease-out" }}
        />
      </svg>
      <span
        className={cn(
          "absolute font-bold font-[family-name:var(--font-mono)]",
          d.fontSize,
        )}
        style={{ color: colors.stroke }}
      >
        {score}
      </span>
    </div>
  );
}
