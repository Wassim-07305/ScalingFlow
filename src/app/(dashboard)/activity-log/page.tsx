"use client";

import { useEffect, useState, useCallback } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import { useUser } from "@/hooks/use-user";
import { createClient } from "@/lib/supabase/client";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils/cn";
import {
  Activity,
  Zap,
  Package,
  Filter,
  Megaphone,
  PenTool,
  FileText,
  Globe,
  Target,
  Award,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface ActivityItem {
  id: string;
  activity_type: string;
  activity_data: Record<string, unknown>;
  created_at: string;
}

const ACTIVITY_META: Record<
  string,
  { label: string; icon: React.ElementType; color: string; category: string }
> = {
  "generation.market_analysis": {
    label: "Analyse de marché générée",
    icon: Globe,
    color: "text-info",
    category: "Marché",
  },
  "generation.persona": {
    label: "Persona généré",
    icon: Target,
    color: "text-accent",
    category: "Marché",
  },
  "generation.competitors": {
    label: "Analyse concurrentielle",
    icon: Globe,
    color: "text-info",
    category: "Marché",
  },
  "generation.offer": {
    label: "Offre créée",
    icon: Package,
    color: "text-accent",
    category: "Offre",
  },
  "generation.category_os": {
    label: "Positionnement généré",
    icon: Package,
    color: "text-accent",
    category: "Offre",
  },
  "generation.brand": {
    label: "Identité de marque créée",
    icon: Award,
    color: "text-[#A78BFA]",
    category: "Marque",
  },
  "generation.funnel": {
    label: "Funnel généré",
    icon: Filter,
    color: "text-info",
    category: "Funnel",
  },
  "generation.ads": {
    label: "Publicités générées",
    icon: Megaphone,
    color: "text-accent",
    category: "Ads",
  },
  "generation.content_strategy": {
    label: "Stratégie contenu créée",
    icon: PenTool,
    color: "text-[#A78BFA]",
    category: "Contenu",
  },
  "generation.reels": {
    label: "Scripts Reels générés",
    icon: PenTool,
    color: "text-[#A78BFA]",
    category: "Contenu",
  },
  "generation.youtube": {
    label: "Script YouTube généré",
    icon: PenTool,
    color: "text-[#A78BFA]",
    category: "Contenu",
  },
  "generation.vsl": {
    label: "VSL généré",
    icon: FileText,
    color: "text-info",
    category: "Assets",
  },
  "generation.pitch_deck": {
    label: "Pitch deck généré",
    icon: FileText,
    color: "text-info",
    category: "Assets",
  },
  "generation.sales_letter": {
    label: "Lettre de vente générée",
    icon: FileText,
    color: "text-info",
    category: "Assets",
  },
  "validation.offer": {
    label: "Offre validée",
    icon: Award,
    color: "text-accent",
    category: "Offre",
  },
  "generation.vault_analysis": {
    label: "Coffre-fort analysé",
    icon: Zap,
    color: "text-accent",
    category: "Vault",
  },
  "milestone.completed": {
    label: "Jalon atteint",
    icon: Award,
    color: "text-accent",
    category: "Progression",
  },
  "generation.roadmap": {
    label: "Roadmap générée",
    icon: Target,
    color: "text-accent",
    category: "Roadmap",
  },
  "generation.sales": {
    label: "Script de vente généré",
    icon: FileText,
    color: "text-info",
    category: "Vente",
  },
};

const CATEGORIES = [
  "Tout",
  "Marché",
  "Offre",
  "Marque",
  "Funnel",
  "Ads",
  "Contenu",
  "Assets",
  "Vault",
  "Vente",
  "Roadmap",
  "Progression",
];

const PAGE_SIZE = 20;

export default function ActivityLogPage() {
  const { user, loading: userLoading } = useUser();
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [category, setCategory] = useState("Tout");

  const fetchActivities = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const supabase = createClient();

    // Construire les filtres par catégorie
    const categoryTypes =
      category === "Tout"
        ? null
        : Object.entries(ACTIVITY_META)
            .filter(([, meta]) => meta.category === category)
            .map(([type]) => type);

    // Requête count
    let countQuery = supabase
      .from("activity_log")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id);

    if (categoryTypes) {
      countQuery = countQuery.in("activity_type", categoryTypes);
    }

    const { count } = await countQuery;
    setTotal(count ?? 0);

    // Requete data
    let dataQuery = supabase
      .from("activity_log")
      .select("id, activity_type, activity_data, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

    if (categoryTypes) {
      dataQuery = dataQuery.in("activity_type", categoryTypes);
    }

    const { data } = await dataQuery;
    setActivities((data as ActivityItem[]) ?? []);
    setLoading(false);
  }, [user, page, category]);

  useEffect(() => {
    if (userLoading || !user) return;
    fetchActivities();
  }, [user, userLoading, fetchActivities]);

  // Reset page quand on change de catégorie
  useEffect(() => {
    setPage(0);
  }, [category]);

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const totalXp = activities.reduce(
    (sum, a) => sum + ((a.activity_data?.xp_awarded as number) ?? 0),
    0,
  );

  if (userLoading || (loading && activities.length === 0)) {
    return (
      <div>
        <PageHeader
          title="Historique d'activité"
          description="Retrouve toutes tes actions et générations IA."
        />
        <div className="space-y-3 mt-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="py-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-bg-tertiary animate-pulse shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-48 bg-bg-tertiary rounded animate-pulse" />
                    <div className="h-3 w-32 bg-bg-tertiary rounded animate-pulse" />
                  </div>
                  <div className="h-5 w-14 bg-bg-tertiary rounded-full animate-pulse shrink-0" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Historique d'activité"
        description="Retrouve toutes tes actions et générations IA."
      >
        <div className="flex items-center gap-2 text-sm text-text-muted">
          <Activity className="h-4 w-4" />
          <span>
            {total} activité{total > 1 ? "s" : ""}
          </span>
          {totalXp > 0 && (
            <Badge variant="muted" className="ml-1">
              +{totalXp} XP sur cette page
            </Badge>
          )}
        </div>
      </PageHeader>

      {/* Filtres par catégorie */}
      <div className="flex flex-wrap gap-2 mb-6">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
              category === cat
                ? "bg-accent text-white"
                : "bg-bg-secondary text-text-muted hover:bg-bg-tertiary hover:text-text-primary",
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Liste des activités */}
      {activities.length === 0 ? (
        <EmptyState
          icon={Activity}
          title="Aucune activité"
          description={
            category === "Tout"
              ? "Ton historique apparaîtra ici dès ta première génération."
              : `Aucune activité dans la catégorie « ${category} ».`
          }
        />
      ) : (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-1">
              {activities.map((a) => {
                const meta = ACTIVITY_META[a.activity_type] || {
                  label: a.activity_type,
                  icon: Zap,
                  color: "text-text-muted",
                  category: "Autre",
                };
                const Icon = meta.icon;
                const xp = a.activity_data?.xp_awarded as number | undefined;

                return (
                  <div
                    key={a.id}
                    className="flex items-center gap-3 py-3 px-3 rounded-lg hover:bg-bg-tertiary transition-colors"
                  >
                    <div
                      className={cn(
                        "flex h-9 w-9 items-center justify-center rounded-xl bg-bg-tertiary shrink-0",
                        meta.color,
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-text-primary">{meta.label}</p>
                      <p className="text-xs text-text-muted">
                        {format(
                          new Date(a.created_at),
                          "EEEE d MMMM yyyy 'a' HH:mm",
                          {
                            locale: fr,
                          },
                        )}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant="muted" className="text-[10px]">
                        {meta.category}
                      </Badge>
                      {xp && (
                        <span className="text-xs font-medium text-accent">
                          +{xp} XP
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-4 mt-4 border-t border-border">
                <p className="text-xs text-text-muted">
                  Page {page + 1} sur {totalPages}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={page === 0}
                    className="p-1.5 rounded-lg hover:bg-bg-tertiary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() =>
                      setPage((p) => Math.min(totalPages - 1, p + 1))
                    }
                    disabled={page >= totalPages - 1}
                    className="p-1.5 rounded-lg hover:bg-bg-tertiary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
