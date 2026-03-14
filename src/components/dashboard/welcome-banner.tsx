"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useUser } from "@/hooks/use-user";
import { useUsage } from "@/hooks/use-usage";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Crown, Zap, ArrowRight, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export function WelcomeBanner() {
  const { profile, loading: userLoading } = useUser();
  const { usage, loading: usageLoading, isPro } = useUsage();

  const isLoading = userLoading || usageLoading;
  const firstName = profile?.first_name || profile?.full_name?.split(" ")[0] || "Utilisateur";
  const plan = profile?.subscription_plan || "free";

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Bonjour";
    if (hour < 18) return "Bon apres-midi";
    return "Bonsoir";
  };

  const planConfig = {
    free: {
      label: "Free",
      icon: Zap,
      color: "bg-zinc-500/10 text-zinc-400",
      gradient: "from-zinc-500/10 to-transparent",
    },
    pro: {
      label: "Pro",
      icon: Sparkles,
      color: "bg-emerald-500/15 text-emerald-400",
      gradient: "from-emerald-500/10 via-teal-500/5 to-transparent",
    },
    premium: {
      label: "Premium",
      icon: Crown,
      color: "bg-purple-500/15 text-purple-400",
      gradient: "from-purple-500/10 via-pink-500/5 to-transparent",
    },
  };

  const currentPlan = planConfig[plan as keyof typeof planConfig] || planConfig.free;
  const PlanIcon = currentPlan.icon;

  const usagePercent = usage?.limit ? Math.min((usage.currentUsage / usage.limit) * 100, 100) : 0;

  return (
    <div className="relative overflow-hidden rounded-xl border border-border-default bg-bg-secondary">
      {/* Animated gradient background */}
      <div className={cn(
        "absolute inset-0 bg-gradient-to-r opacity-50",
        currentPlan.gradient
      )} />

      {/* Subtle grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: "32px 32px",
        }}
      />

      {/* Glow effects */}
      <div className="absolute top-0 right-0 w-[300px] h-[200px] bg-accent/8 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[200px] h-[150px] bg-teal-500/5 rounded-full blur-[80px] pointer-events-none" />

      <div className="relative px-4 py-4 sm:px-6 sm:py-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              {isLoading ? (
                <span className="inline-block h-7 w-48 animate-pulse rounded-lg bg-white/10" />
              ) : (
                <motion.h2
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-xl font-semibold text-text-primary"
                >
                  {getGreeting()}, {firstName}
                </motion.h2>
              )}
              {!isLoading && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 }}
                >
                  <Badge className={cn("font-medium", currentPlan.color)}>
                    <PlanIcon className="h-3 w-3 mr-1" />
                    {currentPlan.label}
                  </Badge>
                </motion.div>
              )}
            </div>

            {!isLoading && !isPro && usage && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="space-y-1.5"
              >
                <div className="flex items-center gap-2 text-sm text-text-muted">
                  <TrendingUp className="h-3.5 w-3.5" />
                  <span>
                    {usage.currentUsage}/{usage.limit ?? 5} générations IA ce mois
                  </span>
                  {usage.limit != null && usage.currentUsage >= usage.limit && (
                    <Badge variant="red" className="text-xs">
                      Limite atteinte
                    </Badge>
                  )}
                </div>
                {/* Usage progress bar */}
                <div className="w-32 sm:w-48 h-1.5 bg-bg-tertiary rounded-full overflow-hidden">
                  <motion.div
                    className={cn(
                      "h-full rounded-full",
                      usagePercent >= 100
                        ? "bg-red-500"
                        : usagePercent >= 80
                          ? "bg-amber-500"
                          : "bg-emerald-500"
                    )}
                    initial={{ width: 0 }}
                    animate={{ width: `${usagePercent}%` }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                  />
                </div>
              </motion.div>
            )}

            {!isLoading && isPro && (
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-sm text-emerald-400/80 flex items-center gap-1.5"
              >
                <Sparkles className="h-3.5 w-3.5" />
                Générations IA illimitées
              </motion.p>
            )}
          </div>

          {!isLoading && !isPro && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Link
                href="/pricing"
                className="group inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-sm font-semibold shadow-lg shadow-emerald-500/20 hover:shadow-xl hover:shadow-emerald-500/30 hover:scale-[1.02] transition-all duration-200"
              >
                <Sparkles className="h-4 w-4" />
                Passer à Pro
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
