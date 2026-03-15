"use client";

import { cn } from "@/lib/utils/cn";
import { Check } from "lucide-react";

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
    <div className="space-y-2">
      <div className="flex flex-wrap gap-3">
        {options.map((opt, i) => {
          const selected = value.includes(opt.value);
          return (
            <button
              key={opt.value}
              onClick={() => toggle(opt.value)}
              className={cn(
                "group relative rounded-xl border-2 px-5 py-3 text-base font-medium transition-all duration-300 ease-out active:scale-[0.97] animate-in fade-in slide-in-from-bottom-2",
                selected
                  ? "scale-[1.03] border-emerald-400 bg-emerald-500/20 text-white shadow-lg shadow-emerald-500/20"
                  : "border-white/10 bg-white/5 text-white/70 hover:border-white/25 hover:bg-white/10 hover:text-white"
              )}
              style={{ animationDelay: `${i * 40}ms`, animationFillMode: "both" }}
            >
              <div className="flex items-center gap-2.5">
                {/* Selection indicator */}
                <div
                  className={cn(
                    "flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-all duration-300",
                    selected
                      ? "border-emerald-400 bg-emerald-400"
                      : "border-white/20 group-hover:border-white/40"
                  )}
                >
                  {selected && <Check className="h-3 w-3 text-black" />}
                </div>
                {opt.label}
              </div>
            </button>
          );
        })}
      </div>
      {value.length > 0 && (
        <p className="text-xs text-white/30 pl-1">
          {value.length} sélectionné{value.length > 1 ? "s" : ""}
        </p>
      )}
    </div>
  );
}
