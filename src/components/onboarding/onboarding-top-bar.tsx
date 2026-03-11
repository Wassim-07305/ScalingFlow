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
    <div className="relative z-10 flex items-center justify-between px-6 py-5">
      <button
        onClick={onBack}
        disabled={isFirst}
        aria-label="Etape precedente"
        className={`flex h-10 w-10 items-center justify-center rounded-xl transition-all ${
          isFirst
            ? "cursor-not-allowed opacity-0"
            : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
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
        <span className="text-sm text-white/60">ScalingFlow</span>
      </div>

      <span className="text-sm tabular-nums text-white/30">
        {step + 1}/{total}
      </span>
    </div>
  );
}
