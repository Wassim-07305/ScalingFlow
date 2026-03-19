"use client";

import { useEffect, useState } from "react";
import {
  RefreshCw,
  TrendingUp,
  Package,
  Zap,
  CheckCircle2,
  ArrowRight,
  AlertCircle,
  Info,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils/cn";
import { useUser } from "@/hooks/use-user";
import { createClient } from "@/lib/supabase/client";
import type { BusinessScoreResult, BusinessScoreAxis } from "@/types/ai";
import { toast } from "sonner";

interface StoredScore {
  acquisition_score: number;
  offer_score: number;
  delivery_score: number;
  global_score: number;
  details: BusinessScoreResult;
  created_at: string;
}

function scoreColor(score: number): string {
  if (score >= 70) return "text-emerald-400";
  if (score >= 50) return "text-orange-400";
  return "text-red-400";
}

function scoreBarColor(score: number): string {
  if (score >= 70) return "bg-emerald-500";
  if (score >= 50) return "bg-orange-500";
  return "bg-red-500";
}

function scoreLabel(score: number): string {
  if (score >= 70) return "Scalable";
  if (score >= 50) return "En progression";
  return "Fondations à construire";
}

function priorityColor(priorite: string): string {
  if (priorite === "haute") return "text-red-400";
  if (priorite === "moyenne") return "text-orange-400";
  return "text-text-secondary";
}

function AxisCard({
  label,
  icon: Icon,
  axis,
  color,
}: {
  label: string;
  icon: React.ElementType;
  axis: BusinessScoreAxis;
  color: string;
}) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="rounded-xl border border-white/5 bg-bg-tertiary/50 p-4 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-lg",
              color,
            )}
          >
            <Icon className="h-4 w-4" />
          </div>
          <span className="text-sm font-medium text-text-primary">{label}</span>
        </div>
        <span
          className={cn("text-2xl font-bold tabular-nums", scoreColor(axis.score))}
        >
          {axis.score}
          <span className="text-xs text-text-secondary font-normal">/100</span>
        </span>
      </div>

      <Progress
        value={axis.score}
        className="h-1.5"
        style={
          {
            "--progress-color": axis.score >= 70
              ? "#34D399"
              : axis.score >= 50
                ? "#F97316"
                : "#F87171",
          } as React.CSSProperties
        }
      />

      <div className="space-y-1.5">
        {axis.forces.map((force, i) => (
          <div key={i} className="flex items-start gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 mt-0.5 shrink-0" />
            <span className="text-xs text-text-secondary leading-relaxed">
              {force}
            </span>
          </div>
        ))}
      </div>

      <button
        onClick={() => setExpanded((v) => !v)}
        className="flex items-center gap-1 text-xs text-accent hover:text-accent/80 transition-colors"
      >
        <ArrowRight
          className={cn(
            "h-3 w-3 transition-transform",
            expanded && "rotate-90",
          )}
        />
        {expanded ? "Masquer" : "Voir les recommandations"}
      </button>

      {expanded && (
        <div className="space-y-2 pt-1 border-t border-white/5">
          {axis.recommandations.map((rec, i) => (
            <div key={i} className="flex items-start gap-2">
              <span
                className={cn(
                  "mt-0.5 text-[10px] font-semibold uppercase tracking-wide shrink-0",
                  priorityColor(rec.priorite),
                )}
              >
                {rec.priorite}
              </span>
              <span className="text-xs text-text-secondary leading-relaxed">
                {rec.texte}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function BusinessScoreWidget() {
  const { user } = useUser();
  const [score, setScore] = useState<StoredScore | null>(null);
  const [loading, setLoading] = useState(true);
  const [recalculating, setRecalculating] = useState(false);

  useEffect(() => {
    if (!user) return;
    const supabase = createClient();
    supabase
      .from("business_scores")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }: { data: StoredScore | null }) => {
        if (data) setScore(data);
        setLoading(false);
      });
  }, [user]);

  async function handleRecalculate() {
    if (recalculating) return;
    setRecalculating(true);
    try {
      const res = await fetch("/api/ai/score-business", { method: "POST" });
      if (!res.ok) {
        const body = await res.json();
        toast.error(body.error ?? "Erreur lors du calcul du score.");
        return;
      }
      const result: BusinessScoreResult & { last_scored_at: string } =
        await res.json();
      setScore({
        acquisition_score: result.acquisition.score,
        offer_score: result.offre.score,
        delivery_score: result.delivery.score,
        global_score: result.global_score,
        details: result,
        created_at: result.last_scored_at,
      });
      toast.success("Score business mis à jour !");
    } catch {
      toast.error("Erreur réseau. Réessaie dans quelques instants.");
    } finally {
      setRecalculating(false);
    }
  }

  const details = score?.details;
  const hasScore = !!score;

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <CardTitle>Score de Scalabilité</CardTitle>
            <CardDescription className="mt-1">
              Analyse IA de ton potentiel de croissance sur 3 axes clés
            </CardDescription>
          </div>
          <button
            onClick={handleRecalculate}
            disabled={recalculating}
            className={cn(
              "flex items-center gap-2 rounded-lg border border-white/10 bg-bg-tertiary px-3 py-2 text-xs font-medium text-text-primary transition-all",
              "hover:border-accent/40 hover:text-accent",
              recalculating && "opacity-60 cursor-not-allowed",
            )}
          >
            <RefreshCw
              className={cn("h-3.5 w-3.5", recalculating && "animate-spin")}
            />
            {recalculating ? "Calcul en cours…" : "Recalculer mon score"}
          </button>
        </div>
      </CardHeader>

      <CardContent>
        {loading ? (
          <div className="space-y-4 animate-pulse">
            <div className="h-20 rounded-xl bg-white/5" />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-40 rounded-xl bg-white/5" />
              ))}
            </div>
          </div>
        ) : !hasScore ? (
          <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/10">
              <Info className="h-6 w-6 text-accent" />
            </div>
            <p className="text-sm font-medium text-text-primary">
              Aucun score calculé
            </p>
            <p className="text-xs text-text-secondary max-w-xs">
              Clique sur "Recalculer mon score" pour obtenir une analyse IA de
              la scalabilité de ton business.
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Global score */}
            <div className="flex items-center gap-5 rounded-xl border border-white/5 bg-bg-tertiary/50 p-4">
              <div className="text-center shrink-0">
                <div
                  className={cn(
                    "text-5xl font-bold tabular-nums",
                    scoreColor(score.global_score),
                  )}
                >
                  {score.global_score}
                </div>
                <div className="text-xs text-text-secondary mt-0.5">/100</div>
              </div>
              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={cn(
                      "text-sm font-semibold",
                      scoreColor(score.global_score),
                    )}
                  >
                    {scoreLabel(score.global_score)}
                  </span>
                  {details?.palier_ca && (
                    <span className="text-[10px] text-text-secondary border border-white/10 rounded px-1.5 py-0.5">
                      Palier {details.palier_ca} €/mois
                    </span>
                  )}
                </div>
                {details?.resume && (
                  <p className="text-xs text-text-secondary leading-relaxed line-clamp-2">
                    {details.resume}
                  </p>
                )}
                <div
                  className="h-2 w-full overflow-hidden rounded-full bg-bg-tertiary"
                >
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-700",
                      scoreBarColor(score.global_score),
                    )}
                    style={{ width: `${score.global_score}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Missing data warning */}
            {details?.donnees_manquantes &&
              details.donnees_manquantes.length > 0 && (
                <div className="flex items-start gap-2 rounded-lg border border-orange-500/20 bg-orange-500/5 p-3">
                  <AlertCircle className="h-4 w-4 text-orange-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-orange-300 leading-relaxed">
                    Score partiel — ajoute tes données pour un score complet :{" "}
                    <span className="font-medium">
                      {details.donnees_manquantes.join(", ")}
                    </span>
                  </p>
                </div>
              )}

            {/* 3 axes */}
            {details && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <AxisCard
                  label="Acquisition"
                  icon={TrendingUp}
                  axis={details.acquisition}
                  color="bg-blue-500/10 text-blue-400"
                />
                <AxisCard
                  label="Offre"
                  icon={Package}
                  axis={details.offre}
                  color="bg-emerald-500/10 text-emerald-400"
                />
                <AxisCard
                  label="Delivery"
                  icon={Zap}
                  axis={details.delivery}
                  color="bg-purple-500/10 text-purple-400"
                />
              </div>
            )}

            {score.created_at && (
              <p className="text-right text-[10px] text-text-secondary">
                Calculé le{" "}
                {new Date(score.created_at).toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
