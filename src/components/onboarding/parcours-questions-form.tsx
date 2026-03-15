"use client";

import { cn } from "@/lib/utils/cn";
import { Check } from "lucide-react";
import { PARCOURS_QUESTIONS } from "./skill-categories";

interface ParcoursQuestionsFormProps {
  parcours: string;
  value: Record<string, unknown>;
  onChange: (data: Record<string, unknown>) => void;
}

const PARCOURS_TITLES: Record<string, string> = {
  A1: "Parcours A1 — Je pars de zéro",
  A2: "Parcours A2 — Salarié en reconversion",
  A3: "Parcours A3 — Freelance qui veut scaler",
  B: "Parcours B — Business existant à scaler",
  C: "Parcours C — Business existant à pivoter",
};

export function ParcoursQuestionsForm({
  parcours,
  value,
  onChange,
}: ParcoursQuestionsFormProps) {
  const questions = PARCOURS_QUESTIONS[parcours] || [];

  if (questions.length === 0) {
    return (
      <p className="text-sm text-white/40">
        Aucune question supplémentaire pour ce parcours.
      </p>
    );
  }

  const setField = (key: string, val: unknown) => {
    onChange({ ...value, [key]: val });
  };

  const toggleMulti = (key: string, optionValue: string) => {
    const current = (value[key] as string[]) || [];
    if (current.includes(optionValue)) {
      setField(
        key,
        current.filter((v) => v !== optionValue),
      );
    } else {
      setField(key, [...current, optionValue]);
    }
  };

  return (
    <div className="space-y-5">
      <p className="text-xs font-medium uppercase tracking-wider text-emerald-400/60">
        {PARCOURS_TITLES[parcours] || parcours}
      </p>

      {questions.map((q, idx) => {
        if (q.type === "select" && q.options) {
          return (
            <div key={q.key}>
              <label className="mb-2 block text-sm font-medium text-white/50">
                {q.label}
              </label>
              <div className="flex flex-wrap gap-2">
                {q.options.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setField(q.key, opt.value)}
                    className={cn(
                      "rounded-lg border px-4 py-2 text-sm font-medium transition-all",
                      value[q.key] === opt.value
                        ? "border-emerald-400/50 bg-emerald-500/15 text-emerald-300"
                        : "border-white/15 text-white/50 hover:border-white/30 hover:text-white/70",
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          );
        }

        if (q.type === "multi-select" && q.options) {
          const selected = (value[q.key] as string[]) || [];
          return (
            <div key={q.key}>
              <label className="mb-2 block text-sm font-medium text-white/50">
                {q.label}
              </label>
              <div className="flex flex-wrap gap-2">
                {q.options.map((opt) => {
                  const isActive = selected.includes(opt.value);
                  return (
                    <button
                      key={opt.value}
                      onClick={() => toggleMulti(q.key, opt.value)}
                      className={cn(
                        "flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm transition-all",
                        isActive
                          ? "border-emerald-400/50 bg-emerald-500/15 text-emerald-300"
                          : "border-white/15 text-white/50 hover:border-white/30",
                      )}
                    >
                      {isActive && <Check className="h-3 w-3" />}
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        }

        if (q.type === "number") {
          return (
            <div key={q.key}>
              <label className="mb-2 block text-sm font-medium text-white/50">
                {q.label}
              </label>
              <input
                {...(idx === 0 ? { "data-autofocus": true } : {})}
                type="number"
                value={String(value[q.key] || "")}
                onChange={(e) => setField(q.key, Number(e.target.value))}
                placeholder={q.placeholder}
                className="w-full rounded-xl border-2 border-white/20 bg-white/5 px-5 py-3.5 text-lg text-white outline-none placeholder:text-white/25 transition-all duration-300 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20"
              />
            </div>
          );
        }

        // Default: text input
        return (
          <div key={q.key}>
            <label className="mb-2 block text-sm font-medium text-white/50">
              {q.label}
            </label>
            <input
              {...(idx === 0 ? { "data-autofocus": true } : {})}
              type="text"
              value={String(value[q.key] || "")}
              onChange={(e) => setField(q.key, e.target.value)}
              placeholder={q.placeholder}
              className="w-full rounded-xl border-2 border-white/20 bg-white/5 px-5 py-3.5 text-lg text-white outline-none placeholder:text-white/25 transition-all duration-300 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20"
            />
          </div>
        );
      })}
    </div>
  );
}
