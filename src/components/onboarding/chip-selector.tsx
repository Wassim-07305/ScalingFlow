"use client";

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils/cn";
import { Check } from "lucide-react";

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
  otherPlaceholder = "Préciser...",
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

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        {options.map((opt, i) => {
          const selected = value === opt.value;
          return (
            <button
              key={opt.value}
              onClick={() => handleSelect(opt.value)}
              className={cn(
                "group relative rounded-xl border-2 px-5 py-3 text-left transition-all duration-300 ease-out animate-in fade-in slide-in-from-bottom-2",
                selected
                  ? "scale-[1.03] border-emerald-400 bg-emerald-500/20 text-white shadow-lg shadow-emerald-500/20"
                  : "border-white/10 bg-white/5 text-white/70 hover:border-white/25 hover:bg-white/10 hover:text-white active:scale-[0.98]"
              )}
              style={{ animationDelay: `${i * 50}ms`, animationFillMode: "both" }}
            >
              <div className="flex items-center gap-3">
                {/* Selection indicator */}
                <div
                  className={cn(
                    "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-300",
                    selected
                      ? "border-emerald-400 bg-emerald-400 scale-100"
                      : "border-white/20 scale-90 group-hover:border-white/40"
                  )}
                >
                  {selected && <Check className="h-3 w-3 text-black" />}
                </div>
                <div>
                  <span className="text-base font-medium">{opt.label}</span>
                  {opt.desc && (
                    <p className="mt-0.5 text-sm text-white/40">{opt.desc}</p>
                  )}
                </div>
              </div>
            </button>
          );
        })}

        {hasOther && (
          <button
            onClick={() => {
              setShowOther(true);
              onChange("");
            }}
            className={cn(
              "rounded-xl border-2 border-dashed px-5 py-3 text-left transition-all duration-200",
              showOther
                ? "border-emerald-400 bg-emerald-500/10 text-white"
                : "border-white/10 text-white/40 hover:border-white/30 hover:text-white/60"
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
          className="w-full rounded-xl border-2 border-white/20 bg-white/5 px-5 py-3.5 text-lg text-white outline-none placeholder:text-white/30 transition-all duration-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20"
        />
      )}
    </div>
  );
}
