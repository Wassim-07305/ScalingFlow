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
    <div className="fixed left-0 right-0 top-0 z-50 h-1 bg-white/10">
      <motion.div
        className="h-full bg-gradient-to-r from-emerald-500 to-teal-500"
        initial={{ width: 0 }}
        animate={{ width: `${progress}%` }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      />
    </div>
  );
}
