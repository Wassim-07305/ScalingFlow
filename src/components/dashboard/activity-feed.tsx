"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useUser } from "@/hooks/use-user";
import { createClient } from "@/lib/supabase/client";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Zap,
  Package,
  Filter,
  Megaphone,
  PenTool,
  FileText,
  Globe,
  Target,
  Award,
  Activity,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface ActivityItem {
  id: string;
  activity_type: string;
  activity_data: Record<string, unknown>;
  created_at: string;
}

const activityMeta: Record<
  string,
  { label: string; icon: React.ElementType; color: string }
> = {
  "generation.market_analysis": {
    label: "Analyse de marché générée",
    icon: Globe,
    color: "text-info",
  },
  "generation.persona": {
    label: "Persona généré",
    icon: Target,
    color: "text-accent",
  },
  "generation.competitors": {
    label: "Analyse concurrentielle",
    icon: Globe,
    color: "text-info",
  },
  "generation.offer": {
    label: "Offre créée",
    icon: Package,
    color: "text-accent",
  },
  "generation.category_os": {
    label: "Positionnement généré",
    icon: Package,
    color: "text-accent",
  },
  "generation.brand": {
    label: "Identité de marque créée",
    icon: Award,
    color: "text-[#A78BFA]",
  },
  "generation.funnel": {
    label: "Funnel généré",
    icon: Filter,
    color: "text-info",
  },
  "generation.ads": {
    label: "Publicités générées",
    icon: Megaphone,
    color: "text-accent",
  },
  "generation.content_strategy": {
    label: "Stratégie contenu créée",
    icon: PenTool,
    color: "text-[#A78BFA]",
  },
  "generation.reels": {
    label: "Scripts Reels générés",
    icon: PenTool,
    color: "text-[#A78BFA]",
  },
  "generation.youtube": {
    label: "Script YouTube généré",
    icon: PenTool,
    color: "text-[#A78BFA]",
  },
  "generation.vsl": {
    label: "VSL généré",
    icon: FileText,
    color: "text-info",
  },
  "generation.pitch_deck": {
    label: "Pitch deck généré",
    icon: FileText,
    color: "text-info",
  },
  "generation.sales_letter": {
    label: "Lettre de vente générée",
    icon: FileText,
    color: "text-info",
  },
  "validation.offer": {
    label: "Offre validée",
    icon: Award,
    color: "text-accent",
  },
  "generation.vault_analysis": {
    label: "Vault analyse",
    icon: Zap,
    color: "text-accent",
  },
  "milestone.completed": {
    label: "Milestone atteint",
    icon: Award,
    color: "text-accent",
  },
};

export function ActivityFeed() {
  const { user } = useUser();
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetch = async () => {
      setLoading(true);
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from("activity_log")
          .select("id, activity_type, activity_data, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(10);

        if (data) setActivities(data as ActivityItem[]);
      } catch {
        // Show empty state rather than infinite skeleton
      } finally {
        setLoading(false);
      }
    };

    fetch();
  }, [user]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-accent" />
          Activité récente
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-12 rounded-lg bg-bg-tertiary animate-pulse"
              />
            ))}
          </div>
        ) : activities.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/10 mb-3">
              <Zap className="h-6 w-6 text-accent" />
            </div>
            <p className="text-sm font-medium text-text-primary mb-1">
              Pas encore d&apos;activité
            </p>
            <p className="text-xs text-text-muted mb-4">
              Ton historique apparaîtra ici dès ta première génération.
            </p>
            <a
              href="/offer"
              className="text-xs font-medium text-accent hover:underline"
            >
              Créer ta première offre →
            </a>
          </div>
        ) : (
          <div className="space-y-1">
            {activities.map((a, idx) => {
              const meta = activityMeta[a.activity_type] || {
                label: a.activity_type,
                icon: Zap,
                color: "text-text-muted",
              };
              const Icon = meta.icon;
              const xp = a.activity_data?.xp_awarded as number | undefined;

              return (
                <div
                  key={a.id}
                  className="flex items-center gap-3 py-2.5 px-2 rounded-xl hover:bg-bg-tertiary transition-all duration-200"
                  style={{ animationDelay: `${idx * 50}ms` }}
                >
                  <div
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-lg bg-bg-tertiary shrink-0",
                      meta.color,
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-text-primary truncate">
                      {meta.label}
                    </p>
                    <p className="text-xs text-text-muted">
                      {format(new Date(a.created_at), "d MMM a HH:mm", {
                        locale: fr,
                      })}
                    </p>
                  </div>
                  {xp && (
                    <span className="text-xs font-medium text-accent shrink-0">
                      +{xp} XP
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
