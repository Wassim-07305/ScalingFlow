"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useUser } from "@/hooks/use-user";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils/cn";
import {
  Sparkles,
  Archive,
  Globe,
  Package,
  Palette,
  Filter,
  FileText,
  Megaphone,
  PenTool,
  Handshake,
  ArrowRight,
  Loader2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface Recommendation {
  id: string;
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
  priority: "high" | "medium" | "low";
}

export function SmartRecommendations() {
  const { user, profile, loading: userLoading } = useUser();
  const router = useRouter();
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || userLoading) return;

    const analyze = async () => {
      const supabase = createClient();

      // Requêtes parallèles pour analyser la progression
      const [
        vaultRes,
        marketRes,
        offersRes,
        brandsRes,
        funnelsRes,
        adsRes,
        contentRes,
        assetsRes,
      ] = await Promise.all([
        supabase
          .from("profiles")
          .select("vault_completed, vault_analysis, selected_market, market_viability_score")
          .eq("id", user.id)
          .single(),
        supabase
          .from("market_analyses")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id),
        supabase
          .from("offers")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id),
        supabase
          .from("brand_identities")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id),
        supabase
          .from("funnels")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id),
        supabase
          .from("ad_creatives")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id),
        supabase
          .from("content_pieces")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id),
        supabase
          .from("sales_assets")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id),
      ]);

      const p = vaultRes.data;
      const recs: Recommendation[] = [];

      // Logique de recommandation basée sur le parcours utilisateur
      if (!p?.vault_completed) {
        recs.push({
          id: "vault",
          title: "Complète ton Vault",
          description: "Définis tes compétences et ta situation pour que l'IA personnalise tout ton contenu.",
          href: "/vault",
          icon: Archive,
          priority: "high",
        });
      }

      if ((marketRes.count ?? 0) === 0) {
        recs.push({
          id: "market",
          title: "Analyse ton marché",
          description: "Identifie ton marché cible, valide la demande et trouve ton positionnement.",
          href: "/market",
          icon: Globe,
          priority: p?.vault_completed ? "high" : "medium",
        });
      }

      if ((offersRes.count ?? 0) === 0) {
        recs.push({
          id: "offer",
          title: "Crée ton offre",
          description: "Génère une offre irrésistible avec pricing, garantie et positionnement.",
          href: "/offer",
          icon: Package,
          priority: (marketRes.count ?? 0) > 0 ? "high" : "medium",
        });
      }

      if ((brandsRes.count ?? 0) === 0 && (offersRes.count ?? 0) > 0) {
        recs.push({
          id: "brand",
          title: "Définis ton identité de marque",
          description: "Crée un branding cohérent : nom, couleurs, ton et message clé.",
          href: "/brand",
          icon: Palette,
          priority: "medium",
        });
      }

      if ((funnelsRes.count ?? 0) === 0 && (offersRes.count ?? 0) > 0) {
        recs.push({
          id: "funnel",
          title: "Construis ton funnel de vente",
          description: "Génère les pages de capture, vente et merci pour convertir tes visiteurs.",
          href: "/funnel",
          icon: Filter,
          priority: "high",
        });
      }

      if ((adsRes.count ?? 0) === 0 && (funnelsRes.count ?? 0) > 0) {
        recs.push({
          id: "ads",
          title: "Lance tes publicites",
          description: "Crée des créatives publicitaires pour attirer du trafic vers ton funnel.",
          href: "/ads",
          icon: Megaphone,
          priority: "high",
        });
      }

      if ((contentRes.count ?? 0) === 0 && (offersRes.count ?? 0) > 0) {
        recs.push({
          id: "content",
          title: "Généré du contenu organique",
          description: "Crée des idées de posts, reels et articles pour attirer une audience.",
          href: "/content",
          icon: PenTool,
          priority: "medium",
        });
      }

      if ((assetsRes.count ?? 0) === 0 && (funnelsRes.count ?? 0) > 0) {
        recs.push({
          id: "assets",
          title: "Crée tes assets de vente",
          description: "Génère un VSL, des emails de séquence ou un pitch deck pour closer.",
          href: "/assets",
          icon: FileText,
          priority: "medium",
        });
      }

      // Si tout est fait, felicitations
      if (recs.length === 0) {
        recs.push({
          id: "sales",
          title: "Prepare tes scripts de vente",
          description: "Tu as tout en place ! Peaufine tes scripts de closing pour maximiser tes conversions.",
          href: "/sales",
          icon: Handshake,
          priority: "low",
        });
      }

      // Trier par priorité et limiter à 3
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      recs.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
      setRecommendations(recs.slice(0, 3));
      setLoading(false);
    };

    analyze();
  }, [user, userLoading]);

  if (loading || userLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-accent" />
            Recommandations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-text-muted" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const priorityStyles = {
    high: "border-accent/30 bg-accent/5",
    medium: "border-info/20 bg-info/5",
    low: "border-border-default bg-bg-secondary",
  };

  const priorityLabels = {
    high: { text: "Prioritaire", variant: "cyan" as const },
    medium: { text: "Recommande", variant: "blue" as const },
    low: { text: "Optionnel", variant: "muted" as const },
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-accent" />
          Prochaines étapes
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {recommendations.map((rec) => {
            const Icon = rec.icon;
            const pStyle = priorityStyles[rec.priority];
            const pLabel = priorityLabels[rec.priority];

            return (
              <button
                key={rec.id}
                onClick={() => router.push(rec.href)}
                className={cn(
                  "w-full flex items-center gap-4 p-4 rounded-xl border transition-all hover:scale-[1.01] text-left",
                  pStyle
                )}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-bg-tertiary shrink-0">
                  <Icon className="h-5 w-5 text-accent" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h4 className="text-sm font-medium text-text-primary">{rec.title}</h4>
                    <Badge variant={pLabel.variant} className="text-[10px]">
                      {pLabel.text}
                    </Badge>
                  </div>
                  <p className="text-xs text-text-muted line-clamp-1">{rec.description}</p>
                </div>
                <ArrowRight className="h-4 w-4 text-text-muted shrink-0" />
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
