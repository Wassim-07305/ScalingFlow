"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface StepIndicatorProps {
  steps: string[];
  currentStep: number;
  className?: string;
}

export function StepIndicator({
  steps,
  currentStep,
  className,
}: StepIndicatorProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      {steps.map((step, index) => {
        const isCompleted = index < currentStep;
        const isCurrent = index === currentStep;

        return (
          <div key={step} className="flex items-center gap-2">
            {/* Step circle */}
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition-all duration-300",
                  isCompleted &&
                    "bg-neon-cyan text-white shadow-[0_0_15px_rgba(6,214,160,0.4)]",
                  isCurrent &&
                    "bg-neon-orange text-white shadow-[0_0_15px_rgba(255,107,44,0.4)]",
                  !isCompleted &&
                    !isCurrent &&
                    "bg-bg-tertiary text-text-muted border border-border-default"
                )}
              >
                {isCompleted ? (
                  <Check className="h-4 w-4" strokeWidth={3} />
                ) : (
                  index + 1
                )}
              </div>
              <span
                className={cn(
                  "text-sm hidden sm:inline transition-colors duration-200",
                  isCurrent && "text-text-primary font-medium",
                  isCompleted && "text-neon-cyan",
                  !isCompleted && !isCurrent && "text-text-muted"
                )}
              >
                {step}
              </span>
            </div>

            {/* Connector line */}
            {index < steps.length - 1 && (
              <div
                className={cn(
                  "h-[2px] w-8 transition-colors duration-300",
                  index < currentStep ? "bg-neon-cyan" : "bg-border-default"
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
