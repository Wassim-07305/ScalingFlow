"use client";

import { cn } from "@/lib/utils/cn";

interface MultiChipOption {
  value: string;
  label: string;
}

interface MultiChipSelectorProps {
  options: MultiChipOption[];
  value: string[];
  onChange: (value: string[]) => void;
}

export function MultiChipSelector({
  options,
  value,
  onChange,
}: MultiChipSelectorProps) {
  const toggle = (val: string) => {
    if (value.includes(val)) {
      onChange(value.filter((v) => v !== val));
    } else {
      onChange([...value, val]);
    }
  };

  return (
    <div className="flex flex-wrap gap-3">
      {options.map((opt) => {
        const selected = value.includes(opt.value);
        return (
          <button
            key={opt.value}
            onClick={() => toggle(opt.value)}
            className={cn(
              "rounded-xl border-2 px-5 py-3 text-base font-medium transition-all duration-200",
              selected
                ? "scale-105 border-emerald-400 bg-emerald-500/20 text-white shadow-lg shadow-emerald-500/20"
                : "border-white/10 bg-white/5 text-white/70 hover:border-white/30 hover:bg-white/10 hover:text-white"
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
