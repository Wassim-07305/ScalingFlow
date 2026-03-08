"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils/cn";

interface AILoadingProps {
  text?: string;
  className?: string;
}

export function AILoading({
  text = "L'IA analyse...",
  className,
}: AILoadingProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-5 py-16",
        className
      )}
    >
      {/* Spinner with glow */}
      <div className="relative w-12 h-12">
        <motion.div
          className="absolute inset-0 rounded-full bg-accent/20 blur-xl"
          animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-border-default border-t-accent"
          animate={{ rotate: 360 }}
          transition={{
            duration: 1,
            repeat: Infinity,
            ease: "linear",
          }}
        />
        <motion.div
          className="absolute inset-1.5 rounded-full border-2 border-transparent border-b-accent/40"
          animate={{ rotate: -360 }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      </div>

      {/* Text with typing dots */}
      <div className="flex items-center gap-1 text-text-secondary text-sm">
        <span>{text}</span>
        <motion.span
          animate={{ opacity: [0, 1, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          .
        </motion.span>
        <motion.span
          animate={{ opacity: [0, 1, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
        >
          .
        </motion.span>
        <motion.span
          animate={{ opacity: [0, 1, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: 0.6 }}
        >
          .
        </motion.span>
      </div>
    </div>
  );
}
