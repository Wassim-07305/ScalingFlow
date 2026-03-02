"use client";

import Image from "next/image";
import { ArrowLeft } from "lucide-react";

interface OnboardingTopBarProps {
  onBack: () => void;
  step: number;
  total: number;
  isFirst: boolean;
}

export function OnboardingTopBar({
  onBack,
  step,
  total,
  isFirst,
}: OnboardingTopBarProps) {
  return (
    <div className="relative z-10 flex items-center justify-between px-6 py-4">
      <button
        onClick={onBack}
        disabled={isFirst}
        className={`rounded-full p-2 transition-all ${
          isFirst
            ? "pointer-events-none opacity-0"
            : "text-white/50 hover:bg-white/10 hover:text-white"
        }`}
      >
        <ArrowLeft className="h-5 w-5" />
      </button>

      <div className="flex items-center gap-2">
        <Image
          src="/icons/icon-192.png"
          alt="Logo"
          width={24}
          height={24}
          className="rounded"
        />
        <span className="text-sm font-semibold text-white/70">ScalingFlow</span>
      </div>

      <span className="text-sm tabular-nums text-white/30">
        {step + 1}/{total}
      </span>
    </div>
  );
}
