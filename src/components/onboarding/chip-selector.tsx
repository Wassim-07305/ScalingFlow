"use client";

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils/cn";

interface ChipOption {
  value: string;
  label: string;
  desc?: string;
}

interface ChipSelectorProps {
  options: ChipOption[];
  value: string;
  onChange: (value: string) => void;
  onAutoAdvance?: () => void;
  hasOther?: boolean;
  otherPlaceholder?: string;
  columns?: 1 | 2 | 3;
}

export function ChipSelector({
  options,
  value,
  onChange,
  onAutoAdvance,
  hasOther = false,
  otherPlaceholder = "Preciser...",
  columns = 1,
}: ChipSelectorProps) {
  const [showOther, setShowOther] = useState(false);
  const otherRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (showOther) otherRef.current?.focus();
  }, [showOther]);

  const handleSelect = (val: string) => {
    onChange(val);
    setShowOther(false);
    if (onAutoAdvance) {
      setTimeout(onAutoAdvance, 400);
    }
  };

  const gridClass =
    columns === 3
      ? "grid-cols-1 sm:grid-cols-3"
      : columns === 2
        ? "grid-cols-1 sm:grid-cols-2"
        : "grid-cols-1";

  return (
    <div className="space-y-3">
      <div className={cn("grid gap-3", gridClass)}>
        {options.map((opt) => (
          <button
            key={opt.value}
            onClick={() => handleSelect(opt.value)}
            className={cn(
              "rounded-xl border-2 px-5 py-4 text-left transition-all duration-200",
              value === opt.value
                ? "scale-[1.02] border-emerald-400 bg-emerald-500/20 text-white shadow-lg shadow-emerald-500/10"
                : "border-white/10 bg-white/5 text-white/70 hover:border-white/30 hover:bg-white/10"
            )}
          >
            <span className="text-base font-medium">{opt.label}</span>
            {opt.desc && (
              <p className="mt-1 text-sm text-white/40">{opt.desc}</p>
            )}
          </button>
        ))}

        {hasOther && (
          <button
            onClick={() => {
              setShowOther(true);
              onChange("");
            }}
            className={cn(
              "rounded-xl border-2 border-dashed px-5 py-4 text-left transition-all duration-200",
              showOther
                ? "border-emerald-400 bg-emerald-500/10"
                : "border-white/10 text-white/40 hover:border-white/30"
            )}
          >
            Autre
          </button>
        )}
      </div>

      {showOther && (
        <input
          ref={otherRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && value.trim() && onAutoAdvance) {
              onAutoAdvance();
            }
          }}
          placeholder={otherPlaceholder}
          className="w-full border-b-2 border-white/20 bg-transparent pb-3 text-xl font-medium text-white outline-none placeholder:text-white/25 focus:border-emerald-400"
        />
      )}
    </div>
  );
}
