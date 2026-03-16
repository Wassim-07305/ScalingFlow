"use client";

import { motion } from "framer-motion";
import { Sparkles, Brain, Zap } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface AILoadingProps {
  text?: string;
  className?: string;
  variant?: "default" | "minimal" | "immersive";
}

export function AILoading({
  text = "L'IA analyse...",
  className,
  variant = "default",
}: AILoadingProps) {
  if (variant === "minimal") {
    return (
      <div className={cn("flex items-center gap-3 py-4", className)}>
        <div className="relative w-5 h-5">
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-border-default border-t-accent"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
        </div>
        <span className="text-sm text-text-secondary">{text}</span>
      </div>
    );
  }

  if (variant === "immersive") {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center gap-6 py-16",
          className,
        )}
      >
        {/* Animated orb with glow */}
        <div className="relative">
          <motion.div
            className="absolute inset-0 rounded-full bg-accent/20 blur-xl"
            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
          <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500/20 to-teal-500/20 p-[2px]">
            <div className="w-full h-full rounded-full bg-bg-primary flex items-center justify-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
              >
                <Brain className="w-8 h-8 text-accent" />
              </motion.div>
            </div>
          </div>
          {/* Orbiting particles */}
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 rounded-full bg-accent"
              style={{ top: "50%", left: "50%", marginTop: -4, marginLeft: -4 }}
              animate={{
                x: [0, 40, 0, -40, 0],
                y: [-40, 0, 40, 0, -40],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "linear",
                delay: i * 1,
              }}
            />
          ))}
        </div>

        <div className="text-center space-y-2">
          <p className="text-lg font-medium text-text-primary">{text}</p>
          <p className="text-sm text-text-muted">
            Cela peut prendre quelques secondes
          </p>
        </div>

        {/* Progress bar */}
        <div className="w-48 h-1 bg-bg-tertiary rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-emerald-500 to-teal-500"
            initial={{ x: "-100%" }}
            animate={{ x: "100%" }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>
      </div>
    );
  }

  // Default variant
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-5 py-12",
        className,
      )}
    >
      {/* Animated spinner with glow */}
      <div className="relative">
        <motion.div
          className="absolute inset-0 rounded-full bg-accent/30 blur-lg"
          animate={{ scale: [1, 1.3, 1], opacity: [0.4, 0.7, 0.4] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        />
        <div className="relative w-14 h-14">
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-border-default"
            style={{ borderTopColor: "rgb(52, 211, 153)" }}
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
          <motion.div
            className="absolute inset-2 rounded-full border-2 border-border-default"
            style={{ borderRightColor: "rgb(45, 212, 191)" }}
            animate={{ rotate: -360 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-accent" />
          </div>
        </div>
      </div>

      {/* Text with animated dots */}
      <div className="flex items-center gap-1.5 text-text-secondary">
        <span className="text-sm font-medium">{text}</span>
        <div className="flex gap-0.5">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-accent"
              animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1, 0.8] }}
              transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
