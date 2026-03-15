"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useUser } from "@/hooks/use-user";
import { createClient } from "@/lib/supabase/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils/cn";
import {
  Archive,
  Globe,
  Package,
  Palette,
  Filter,
  FileText,
  Megaphone,
  PenTool,
  CheckCircle2,
  Circle,
  ArrowRight,
} from "lucide-react";

interface PipelineStep {
  label: string;
  href: string;
  icon: React.ElementType;
  completed: boolean;
  count?: number;
}

export function BusinessPipeline() {
  const { user, profile, loading: userLoading } = useUser();
  const [steps, setSteps] = useState<PipelineStep[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchPipeline = async () => {
      setLoading(true);
      try {
        const supabase = createClient();

        const [
          { count: marketsCount },
          { count: offersCount },
          { count: brandsCount },
          { count: funnelsCount },
          { count: assetsCount },
          { count: adsCount },
          { count: contentCount },
        ] = await Promise.all([
          supabase.from("market_analyses").select("*", { count: "exact", head: true }).eq("user_id", user.id),
          supabase.from("offers").select("*", { count: "exact", head: true }).eq("user_id", user.id),
          supabase.from("brand_identities").select("*", { count: "exact", head: true }).eq("user_id", user.id),
          supabase.from("funnels").select("*", { count: "exact", head: true }).eq("user_id", user.id),
          supabase.from("sales_assets").select("*", { count: "exact", head: true }).eq("user_id", user.id),
          supabase.from("ad_creatives").select("*", { count: "exact", head: true }).eq("user_id", user.id),
          supabase.from("content_pieces").select("*", { count: "exact", head: true }).eq("user_id", user.id),
        ]);

        const vaultDone = profile?.vault_completed ?? false;

        setSteps([
          { label: "Vault", href: "/vault", icon: Archive, completed: vaultDone },
          { label: "Marché", href: "/market", icon: Globe, completed: (marketsCount ?? 0) > 0, count: marketsCount ?? 0 },
          { label: "Offre", href: "/offer", icon: Package, completed: (offersCount ?? 0) > 0, count: offersCount ?? 0 },
          { label: "Marque", href: "/brand", icon: Palette, completed: (brandsCount ?? 0) > 0, count: brandsCount ?? 0 },
          { label: "Funnel", href: "/funnel", icon: Filter, completed: (funnelsCount ?? 0) > 0, count: funnelsCount ?? 0 },
          { label: "Assets", href: "/assets", icon: FileText, completed: (assetsCount ?? 0) > 0, count: assetsCount ?? 0 },
          { label: "Ads", href: "/ads", icon: Megaphone, completed: (adsCount ?? 0) > 0, count: adsCount ?? 0 },
          { label: "Contenu", href: "/content", icon: PenTool, completed: (contentCount ?? 0) > 0, count: contentCount ?? 0 },
        ]);
      } catch {
        // Show empty pipeline rather than infinite skeleton
      } finally {
        setLoading(false);
      }
    };

    fetchPipeline();
  }, [user, profile]);

  const isLoading = userLoading || loading;
  const completedCount = steps.filter((s) => s.completed).length;
  const totalSteps = steps.length;
  const progressPercent = totalSteps > 0 ? Math.round((completedCount / totalSteps) * 100) : 0;

  // Find the first incomplete step to suggest
  const nextStep = steps.find((s) => !s.completed);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Pipeline business</CardTitle>
          {!isLoading && (
            <span className="text-xs text-text-muted font-normal">
              {completedCount}/{totalSteps} étapes
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-10 rounded-lg bg-bg-tertiary animate-pulse" />
            ))}
          </div>
        ) : (
          <>
            {/* Progress bar */}
            <div className="mb-4">
              <div className="h-2 rounded-full bg-bg-tertiary overflow-hidden">
                <div
                  className="h-full rounded-full bg-accent transition-all duration-700"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <p className="text-xs text-text-muted mt-1.5">
                {progressPercent}% de ton business est structuré
              </p>
            </div>

            {/* Steps */}
            <div className="space-y-1">
              {steps.map((step) => {
                const Icon = step.icon;
                return (
                  <Link
                    key={step.href}
                    href={step.href}
                    className={cn(
                      "flex items-center gap-3 py-2.5 px-3 rounded-xl transition-all duration-200 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50",
                      step.completed
                        ? "hover:bg-bg-tertiary"
                        : "hover:bg-accent/5"
                    )}
                  >
                    {step.completed ? (
                      <CheckCircle2 className="h-5 w-5 text-accent shrink-0" />
                    ) : (
                      <Circle className="h-5 w-5 text-text-muted shrink-0 group-hover:text-accent transition-colors" />
                    )}
                    <div className="flex-1 min-w-0 flex items-center gap-2">
                      <Icon className={cn("h-4 w-4 shrink-0", step.completed ? "text-text-secondary" : "text-text-muted")} />
                      <span className={cn(
                        "text-sm",
                        step.completed
                          ? "text-text-secondary"
                          : "text-text-primary font-medium"
                      )}>
                        {step.label}
                      </span>
                      {step.count !== undefined && step.count > 0 && (
                        <span className="text-xs text-text-muted">({step.count})</span>
                      )}
                    </div>
                    {!step.completed && (
                      <ArrowRight className="h-4 w-4 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                    )}
                  </Link>
                );
              })}
            </div>

            {/* Next step suggestion */}
            {nextStep && (
              <Link
                href={nextStep.href}
                className="mt-4 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent/10 text-accent text-sm font-medium hover:bg-accent/15 transition-colors"
              >
                <nextStep.icon className="h-4 w-4" />
                Prochaine étape : {nextStep.label}
                <ArrowRight className="h-3.5 w-3.5 ml-auto" />
              </Link>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
