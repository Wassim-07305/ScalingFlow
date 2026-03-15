"use client";

import { motion } from "framer-motion";

interface OnboardingProgressBarProps {
  step: number;
  total: number;
}

export function OnboardingProgressBar({
  step,
  total,
}: OnboardingProgressBarProps) {
  const progress = total > 0 ? ((step + 1) / total) * 100 : 0;

  return (
    <div
      className="fixed left-0 right-0 top-0 z-50 h-1.5 bg-white/5"
      role="progressbar"
      aria-valuenow={step + 1}
      aria-valuemin={1}
      aria-valuemax={total}
      aria-label={`Étape ${step + 1} sur ${total}`}
    >
      <motion.div
        className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 relative overflow-hidden"
        initial={{ width: 0 }}
        animate={{ width: `${progress}%` }}
        transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
      >
        {/* Shimmer effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-[shimmer_2s_ease-in-out_infinite]" />
      </motion.div>
      {/* Glow at the tip */}
      <motion.div
        className="absolute top-0 h-1.5 w-8 bg-emerald-400/50 blur-md"
        animate={{ left: `calc(${progress}% - 16px)` }}
        transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
      />
    </div>
  );
}
