"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface GenerateButtonProps {
  onClick: () => void;
  loading?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  className?: string;
  size?: "default" | "sm" | "lg" | "icon";
  icon?: React.ReactNode;
}

export function GenerateButton({
  onClick,
  loading = false,
  disabled = false,
  children,
  className,
  size = "lg",
  icon,
}: GenerateButtonProps) {
  return (
    <Button
      size={size}
      onClick={onClick}
      disabled={disabled || loading}
      className={cn(
        "relative overflow-hidden bg-gradient-to-r from-accent to-emerald-400 hover:from-accent/90 hover:to-emerald-400/90",
        "text-white font-semibold",
        "shadow-lg shadow-accent/25 hover:shadow-xl hover:shadow-accent/30",
        "transition-all duration-300",
        "disabled:opacity-50 disabled:shadow-none",
        !loading && !disabled && "hover:scale-[1.02] active:scale-[0.98]",
        className
      )}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      ) : (
        icon || <Sparkles className="h-4 w-4 mr-2" />
      )}
      {children}
    </Button>
  );
}
