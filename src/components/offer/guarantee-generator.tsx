"use client";

import { useState, useEffect, useMemo} from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AILoading } from "@/components/shared/ai-loading";
import { CopyExportBar } from "@/components/shared/copy-export-bar";
import { UpgradeWall } from "@/components/shared/upgrade-wall";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/use-user";
import { toast } from "sonner";
import { cn } from "@/lib/utils/cn";
import {
  Sparkles,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Target,
  TrendingUp,
  Clock,
  AlertTriangle,
  Brain,
  Check,
  Loader2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface Guarantee {
  type: string;
  name: string;
  description: string;
  pourcentage_remboursement: string;
  timeframe: string;
  conditions: string;
  metrique: string;
  clause_protection: string;
  risk_level: string;
  psychological_impact: string;
  // Legacy field support
  metric?: string;
}

interface GuaranteeResult {
  guarantees: Guarantee[];
  recommendation: string;
  recommended_index: number;
}

interface GuaranteeGeneratorProps {
  offerId?: string;
}

const TYPE_CONFIG: Record<
  string,
  {
    icon: typeof Shield;
    color: string;
    badgeVariant:
      | "default"
      | "blue"
      | "cyan"
      | "purple"
      | "red"
      | "yellow"
      | "muted";
  }
> = {
  "résultat garanti": {
    icon: Target,
    color: "text-accent",
    badgeVariant: "default",
  },
  satisfaction: {
    icon: ShieldCheck,
    color: "text-blue-400",
    badgeVariant: "blue",
  },
  "anti-risque": {
    icon: ShieldAlert,
    color: "text-purple-400",
    badgeVariant: "purple",
  },
  performance: {
    icon: TrendingUp,
    color: "text-cyan-400",
    badgeVariant: "cyan",
  },
};

const RISK_CONFIG: Record<
  string,
  {
    color: string;
    badgeVariant:
      | "default"
      | "blue"
      | "cyan"
      | "purple"
      | "red"
      | "yellow"
      | "muted";
  }
> = {
  faible: { color: "text-accent", badgeVariant: "default" },
  moyen: { color: "text-yellow-400", badgeVariant: "yellow" },
  élevé: { color: "text-red-400", badgeVariant: "red" },
};

export function GuaranteeGenerator({ offerId }: GuaranteeGeneratorProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GuaranteeResult | null>(null);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [usageLimited, setUsageLimited] = useState<{
    current: number;
    limit: number;
  } | null>(null);

  // Form fields
  const [niche, setNiche] = useState("");
  const [offerName, setOfferName] = useState("");
  const [price, setPrice] = useState<number>(0);
  const [duration, setDuration] = useState("");
  const [targetAvatar, setTargetAvatar] = useState("");

  const { user } = useUser();
  const supabase = useMemo(() => createClient(), []);

  // Auto-load from profile and offer
  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("niche, selected_market")
        .eq("id", user.id)
        .maybeSingle();

      if (profile) {
        setNiche(profile.niche || profile.selected_market || "");
      }

      if (offerId) {
        const { data: offer } = await supabase
          .from("offers")
          .select("offer_name, pricing_strategy")
          .eq("id", offerId)
          .maybeSingle();

        if (offer) {
          setOfferName(offer.offer_name || "");
          const ps = offer.pricing_strategy as { real_price?: number } | null;
          if (ps?.real_price) {
            setPrice(ps.real_price);
          }
        }
      }

      // Load latest market analysis for avatar
      const { data: market } = await supabase
        .from("market_analyses")
        .select("target_avatar")
        .eq("user_id", user.id)
        .eq("selected", true)
        .maybeSingle();

      if (market) {
        setTargetAvatar(
          typeof market.target_avatar === "string"
            ? market.target_avatar
            : JSON.stringify(market.target_avatar || ""),
        );
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, offerId]);

  const handleGenerate = async () => {
    if (!niche.trim()) {
      toast.error("Indique ta niche / ton marché");
      return;
    }
    if (!offerName.trim()) {
      toast.error("Indique le nom de ton offre");
      return;
    }

    setLoading(true);
    setResult(null);
    setUsageLimited(null);

    try {
      const res = await fetch("/api/ai/generate-guarantee", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          niche,
          offer_name: offerName,
          price,
          duration,
          target_avatar: targetAvatar,
        }),
      });

      if (res.status === 403) {
        const err = await res.json().catch(() => null);
        if (err?.usage) {
          setUsageLimited({ current: err.usage.used, limit: err.usage.limit });
          return;
        }
      }

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error || `Erreur ${res.status}`);
      }

      const data: GuaranteeResult = await res.json();
      setResult(data);
      setExpandedIndex(data.recommended_index);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Erreur lors de la génération",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!offerId || selectedIndex === null || !result) {
      toast.error("Sélectionne une garantie et assure-toi d'avoir une offre.");
      return;
    }

    setSaving(true);
    try {
      const guarantee = result.guarantees[selectedIndex];
      const { error } = await supabase
        .from("offers")
        .update({
          guarantees: guarantee.name,
          guarantee_details: guarantee,
        })
        .eq("id", offerId);

      if (error) throw error;
      toast.success("Garantie sauvegardée dans l'offre !");
    } catch {
      toast.error("Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
    }
  };

  const getContentForExport = () => {
    if (!result) return "";
    return result.guarantees
      .map(
        (g, i) =>
          `## Garantie ${i + 1} : ${g.name}\n\n` +
          `Type : ${g.type}\n\n` +
          `Description : ${g.description}\n\n` +
          `Remboursement : ${g.pourcentage_remboursement || "—"}\n\n` +
          `Durée : ${g.timeframe}\n\n` +
          `Conditions : ${g.conditions}\n\n` +
          `Métrique : ${g.metrique || g.metric || "—"}\n\n` +
          `Clause de protection : ${g.clause_protection || "—"}\n\n` +
          `Niveau de risque : ${g.risk_level}\n\n` +
          `Impact psychologique : ${g.psychological_impact}\n`,
      )
      .join("\n---\n\n");
  };

  if (usageLimited) {
    return (
      <UpgradeWall
        currentUsage={usageLimited.current}
        limit={usageLimited.limit}
      />
    );
  }

  if (loading) {
    return <AILoading text="Création de garanties irrésistibles" />;
  }

  return (
    <div className="space-y-6">
      {/* Input form */}
      {!result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-accent" />
              Générateur de Garanties
            </CardTitle>
            <CardDescription>
              Crée des garanties qui éliminent le risque perçu et augmentent tes
              conversions.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">
                Ta niche / marché
              </label>
              <input
                type="text"
                value={niche}
                onChange={(e) => setNiche(e.target.value)}
                placeholder="Ex : Coaching fitness pour entrepreneurs"
                className="w-full rounded-lg border border-border bg-bg-tertiary px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-accent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">
                Nom de ton offre
              </label>
              <input
                type="text"
                value={offerName}
                onChange={(e) => setOfferName(e.target.value)}
                placeholder="Ex : Programme SCALE 90"
                className="w-full rounded-lg border border-border bg-bg-tertiary px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-accent"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">
                  Prix de l&apos;offre (€)
                </label>
                <input
                  type="number"
                  value={price || ""}
                  onChange={(e) => setPrice(parseInt(e.target.value) || 0)}
                  placeholder="Ex : 2997"
                  className="w-full rounded-lg border border-border bg-bg-tertiary px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-accent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">
                  Durée de l&apos;accompagnement
                </label>
                <input
                  type="text"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  placeholder="Ex : 90 jours"
                  className="w-full rounded-lg border border-border bg-bg-tertiary px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-accent"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">
                Avatar client cible
              </label>
              <input
                type="text"
                value={targetAvatar}
                onChange={(e) => setTargetAvatar(e.target.value)}
                placeholder="Ex : Entrepreneur 30-45 ans, CA 5-50K/mois"
                className="w-full rounded-lg border border-border bg-bg-tertiary px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-accent"
              />
            </div>
            <Button onClick={handleGenerate} className="w-full">
              <Sparkles className="h-4 w-4 mr-2" />
              Générer 4 garanties irrésistibles
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {result && (
        <>
          <div className="text-center space-y-2">
            <h2 className="text-xl font-bold text-text-primary">
              4 garanties générées
            </h2>
            <p className="text-sm text-text-secondary">
              {result.recommendation}
            </p>
          </div>

          <div className="space-y-4">
            {result.guarantees.map((guarantee, index) => {
              const isExpanded = expandedIndex === index;
              const isRecommended = index === result.recommended_index;
              const isSelected = selectedIndex === index;
              const typeConf =
                TYPE_CONFIG[guarantee.type.toLowerCase()] ||
                TYPE_CONFIG["satisfaction"];
              const TypeIcon = typeConf.icon;
              const riskConf =
                RISK_CONFIG[guarantee.risk_level.toLowerCase()] ||
                RISK_CONFIG["moyen"];

              return (
                <Card
                  key={guarantee.name}
                  className={cn(
                    "cursor-pointer transition-all",
                    isSelected && "border-accent",
                    isRecommended && !isSelected && "border-accent/40",
                  )}
                  onClick={() => setExpandedIndex(isExpanded ? null : index)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            "h-10 w-10 rounded-xl flex items-center justify-center shrink-0",
                            `bg-${typeConf.color.replace("text-", "")}/10`,
                          )}
                        >
                          <TypeIcon className={cn("h-5 w-5", typeConf.color)} />
                        </div>
                        <div>
                          <CardTitle className="flex items-center gap-2 text-base flex-wrap">
                            {guarantee.name}
                            <Badge variant={typeConf.badgeVariant}>
                              {guarantee.type}
                            </Badge>
                            {isRecommended && (
                              <Badge variant="cyan">Recommandée</Badge>
                            )}
                          </CardTitle>
                          <p className="text-sm text-text-secondary mt-1">
                            {guarantee.description}
                          </p>
                        </div>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="h-5 w-5 text-text-muted shrink-0" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-text-muted shrink-0" />
                      )}
                    </div>
                  </CardHeader>

                  {isExpanded && (
                    <CardContent className="space-y-4 pt-2">
                      {/* 5 éléments CDC */}
                      <div className="grid gap-3 sm:grid-cols-3">
                        <div className="rounded-lg bg-bg-tertiary p-3">
                          <h4 className="text-xs font-semibold text-text-muted mb-1">
                            Remboursement
                          </h4>
                          <p className="text-lg font-bold text-accent">
                            {guarantee.pourcentage_remboursement || "—"}
                          </p>
                        </div>
                        <div className="rounded-lg bg-bg-tertiary p-3">
                          <h4 className="text-xs font-semibold text-text-muted flex items-center gap-1.5 mb-1">
                            <Clock className="h-3.5 w-3.5" />
                            Durée
                          </h4>
                          <p className="text-sm text-text-primary">
                            {guarantee.timeframe}
                          </p>
                        </div>
                        <div className="rounded-lg bg-bg-tertiary p-3">
                          <h4 className="text-xs font-semibold text-text-muted">
                            Risque vendeur
                          </h4>
                          <Badge
                            variant={riskConf.badgeVariant}
                            className="mt-1"
                          >
                            {guarantee.risk_level}
                          </Badge>
                        </div>
                      </div>

                      {/* Métrique déclencheur */}
                      <div className="rounded-lg bg-bg-tertiary p-3">
                        <h4 className="text-xs font-semibold text-text-muted flex items-center gap-1.5 mb-1">
                          <Target className="h-3.5 w-3.5" />
                          Métrique déclencheur
                        </h4>
                        <p className="text-sm text-text-primary">
                          {guarantee.metrique || guarantee.metric || "—"}
                        </p>
                      </div>

                      {/* Conditions */}
                      <div>
                        <h4 className="text-sm font-semibold text-text-primary flex items-center gap-2 mb-1">
                          <AlertTriangle className="h-4 w-4 text-yellow-400" />
                          Conditions d&apos;application
                        </h4>
                        <p className="text-sm text-text-secondary">
                          {guarantee.conditions}
                        </p>
                      </div>

                      {/* Clause de protection */}
                      {guarantee.clause_protection && (
                        <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-3">
                          <h4 className="text-sm font-semibold text-text-primary flex items-center gap-2 mb-1">
                            <Shield className="h-4 w-4 text-yellow-400" />
                            Clause de protection prestataire
                          </h4>
                          <p className="text-sm text-text-secondary">
                            {guarantee.clause_protection}
                          </p>
                        </div>
                      )}

                      {/* Impact psychologique */}
                      <div className="rounded-lg border border-accent/20 bg-accent/5 p-3">
                        <h4 className="text-sm font-semibold text-text-primary flex items-center gap-2 mb-1">
                          <Brain className="h-4 w-4 text-accent" />
                          Impact psychologique
                        </h4>
                        <p className="text-sm text-text-secondary italic">
                          {guarantee.psychological_impact}
                        </p>
                      </div>

                      {/* Select button */}
                      <Button
                        className="w-full"
                        variant={isSelected ? "default" : "secondary"}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedIndex(index);
                        }}
                      >
                        {isSelected ? (
                          <>
                            <Check className="h-4 w-4 mr-2" />
                            Sélectionnée
                          </>
                        ) : (
                          "Choisir cette garantie"
                        )}
                      </Button>
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </div>

          {/* Save & export */}
          <div className="flex items-center gap-3">
            {offerId && selectedIndex !== null && (
              <Button onClick={handleSave} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Sauvegarder dans l&apos;offre
              </Button>
            )}
            <Button
              variant="secondary"
              onClick={() => {
                setResult(null);
                setSelectedIndex(null);
              }}
            >
              Regénérer
            </Button>
          </div>

          <CopyExportBar
            copyContent={getContentForExport()}
            pdfContent={getContentForExport()}
            pdfTitle="Garanties d'Offre"
            pdfFilename="garanties-offre"
          />
        </>
      )}
    </div>
  );
}
