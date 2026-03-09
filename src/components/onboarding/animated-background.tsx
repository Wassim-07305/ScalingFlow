"use client";

export function AnimatedBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl animate-pulse" />
      <div
        className="absolute -right-32 top-1/3 h-80 w-80 rounded-full bg-teal-500/10 blur-3xl"
        style={{ animation: "pulse 4s ease-in-out infinite 1s" }}
      />
      <div
        className="absolute -bottom-32 left-1/3 h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl"
        style={{ animation: "pulse 5s ease-in-out infinite 2s" }}
      />
    </div>
  );
}

/** Rivia-style gradient background class for onboarding screens */
export const onboardingBg = "bg-gradient-to-br from-slate-950 via-emerald-950 to-slate-900";
