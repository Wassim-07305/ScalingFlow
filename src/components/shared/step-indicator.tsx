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
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium transition-colors duration-150",
                  isCompleted && "bg-accent text-bg-primary",
                  isCurrent && "bg-accent text-bg-primary",
                  !isCompleted &&
                    !isCurrent &&
                    "bg-bg-tertiary text-text-muted border border-border-default"
                )}
              >
                {isCompleted ? (
                  <Check className="h-3.5 w-3.5" strokeWidth={3} />
                ) : (
                  index + 1
                )}
              </div>
              <span
                className={cn(
                  "text-sm hidden sm:inline transition-colors duration-150",
                  isCurrent && "text-text-primary font-medium",
                  isCompleted && "text-accent",
                  !isCompleted && !isCurrent && "text-text-muted"
                )}
              >
                {step}
              </span>
            </div>

            {index < steps.length - 1 && (
              <div
                className={cn(
                  "h-[1px] w-8 transition-colors duration-150",
                  index < currentStep ? "bg-accent" : "bg-border-default"
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
