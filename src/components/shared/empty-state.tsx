"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { type LucideIcon, ArrowRight, Plus } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  actionHref?: string;
  className?: string;
  variant?: "default" | "minimal" | "card";
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  actionHref,
  className,
  variant = "default",
}: EmptyStateProps) {
  const ActionIcon = actionHref || onAction ? Plus : ArrowRight;

  const button = actionLabel ? (
    actionHref ? (
      <Link href={actionHref}>
        <Button className="gap-2 shadow-lg shadow-emerald-500/20 hover:shadow-xl hover:shadow-emerald-500/30 hover:scale-[1.02] transition-all">
          <ActionIcon className="h-4 w-4" />
          {actionLabel}
        </Button>
      </Link>
    ) : onAction ? (
      <Button onClick={onAction} className="gap-2 shadow-lg shadow-emerald-500/20 hover:shadow-xl hover:shadow-emerald-500/30 hover:scale-[1.02] transition-all">
        <ActionIcon className="h-4 w-4" />
        {actionLabel}
      </Button>
    ) : null
  ) : null;

  if (variant === "minimal") {
    return (
      <div className={cn("flex flex-col items-center py-8", className)}>
        <Icon className="h-8 w-8 text-text-muted mb-3" />
        <p className="text-sm text-text-secondary">{title}</p>
      </div>
    );
  }

  if (variant === "card") {
    return (
      <div
        className={cn(
          "rounded-xl border border-dashed border-border-default bg-bg-secondary/50 p-8",
          className
        )}
      >
        <div className="flex flex-col items-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 mb-4">
            <Icon className="h-6 w-6 text-accent" />
          </div>
          <h3 className="text-sm font-medium text-text-primary mb-1">{title}</h3>
          <p className="text-xs text-text-muted max-w-xs mb-4">{description}</p>
          {button}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative flex flex-col items-center justify-center text-center py-20 px-6",
        className
      )}
    >
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-accent/3 rounded-full blur-[100px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="relative"
      >
        {/* Icon with glow effect */}
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-accent/20 rounded-2xl blur-xl" />
          <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-accent/20 to-teal-500/20 border border-accent/20">
            <Icon className="h-8 w-8 text-accent" />
          </div>
        </div>

        <motion.h3
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-lg font-semibold text-text-primary mb-2"
        >
          {title}
        </motion.h3>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-sm text-text-secondary max-w-md mb-8"
        >
          {description}
        </motion.p>

        {button && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            {button}
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
