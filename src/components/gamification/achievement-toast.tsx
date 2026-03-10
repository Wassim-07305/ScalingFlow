"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils/cn";
import { Trophy, Star, Zap, X } from "lucide-react";
import confetti from "canvas-confetti";

export interface AchievementData {
  id: string;
  type: "badge" | "level_up" | "challenge" | "milestone";
  title: string;
  description: string;
  xp?: number;
  icon?: string;
}

interface AchievementToastProps {
  achievement: AchievementData | null;
  onClose: () => void;
}

const TYPE_CONFIG = {
  badge: {
    icon: Trophy,
    color: "from-accent to-emerald-600",
    bgColor: "bg-accent/20",
    label: "Badge debloque !",
  },
  level_up: {
    icon: Star,
    color: "from-yellow-400 to-orange-500",
    bgColor: "bg-yellow-500/20",
    label: "Niveau superieur !",
  },
  challenge: {
    icon: Zap,
    color: "from-purple-400 to-pink-500",
    bgColor: "bg-purple-500/20",
    label: "Defi accompli !",
  },
  milestone: {
    icon: Trophy,
    color: "from-blue-400 to-cyan-500",
    bgColor: "bg-blue-500/20",
    label: "Milestone atteint !",
  },
};

function triggerConfetti() {
  const count = 200;
  const defaults = {
    origin: { y: 0.7 },
    zIndex: 9999,
  };

  function fire(particleRatio: number, opts: confetti.Options) {
    confetti({
      ...defaults,
      ...opts,
      particleCount: Math.floor(count * particleRatio),
    });
  }

  fire(0.25, {
    spread: 26,
    startVelocity: 55,
  });
  fire(0.2, {
    spread: 60,
  });
  fire(0.35, {
    spread: 100,
    decay: 0.91,
    scalar: 0.8,
  });
  fire(0.1, {
    spread: 120,
    startVelocity: 25,
    decay: 0.92,
    scalar: 1.2,
  });
  fire(0.1, {
    spread: 120,
    startVelocity: 45,
  });
}

export function AchievementToast({ achievement, onClose }: AchievementToastProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (achievement) {
      setIsVisible(true);
      triggerConfetti();

      // Auto-close after 5 seconds
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onClose, 300);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [achievement, onClose]);

  if (!achievement) return null;

  const config = TYPE_CONFIG[achievement.type];
  const Icon = config.icon;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 100, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.9 }}
          transition={{ type: "spring", damping: 20, stiffness: 300 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] pointer-events-auto"
        >
          <div
            className={cn(
              "relative overflow-hidden rounded-2xl border border-white/10",
              "bg-bg-secondary/95 backdrop-blur-xl shadow-2xl",
              "min-w-[320px] max-w-[400px]"
            )}
          >
            {/* Gradient background effect */}
            <div
              className={cn(
                "absolute inset-0 opacity-20 bg-gradient-to-r",
                config.color
              )}
            />

            {/* Shimmer effect */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
              initial={{ x: "-100%" }}
              animate={{ x: "100%" }}
              transition={{ duration: 1.5, repeat: 2 }}
            />

            <div className="relative p-5">
              {/* Close button */}
              <button
                onClick={() => {
                  setIsVisible(false);
                  setTimeout(onClose, 300);
                }}
                className="absolute top-3 right-3 p-1 rounded-lg text-text-muted hover:text-text-primary hover:bg-white/10 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="flex items-start gap-4">
                {/* Icon with animation */}
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", delay: 0.2, damping: 10 }}
                  className={cn(
                    "flex h-14 w-14 items-center justify-center rounded-2xl shrink-0",
                    config.bgColor
                  )}
                >
                  <Icon className={cn("h-7 w-7 text-white")} />
                </motion.div>

                <div className="flex-1 min-w-0 pt-1">
                  {/* Label */}
                  <motion.p
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                    className={cn(
                      "text-xs font-semibold uppercase tracking-wider mb-1",
                      "bg-gradient-to-r bg-clip-text text-transparent",
                      config.color
                    )}
                  >
                    {config.label}
                  </motion.p>

                  {/* Title */}
                  <motion.h3
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-lg font-bold text-text-primary mb-0.5"
                  >
                    {achievement.title}
                  </motion.h3>

                  {/* Description */}
                  <motion.p
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-sm text-text-secondary"
                  >
                    {achievement.description}
                  </motion.p>

                  {/* XP reward */}
                  {achievement.xp && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.4 }}
                      className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-accent/20 text-accent text-sm font-semibold"
                    >
                      <Zap className="h-4 w-4" />
                      +{achievement.xp} XP
                    </motion.div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
