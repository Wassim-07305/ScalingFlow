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
        "flex flex-col items-center justify-center gap-4 py-12",
        className
      )}
    >
      {/* Neon pulse rings */}
      <div className="relative w-16 h-16">
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-neon-orange"
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.8, 0, 0.8],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-neon-blue"
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.8, 0, 0.8],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.5,
          }}
        />
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-neon-cyan"
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.8, 0, 0.8],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1,
          }}
        />
        {/* Center dot */}
        <motion.div
          className="absolute inset-[6px] rounded-full bg-neon-orange"
          animate={{
            boxShadow: [
              "0 0 20px rgba(255,107,44,0.5)",
              "0 0 40px rgba(255,107,44,0.8)",
              "0 0 20px rgba(255,107,44,0.5)",
            ],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut",
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
