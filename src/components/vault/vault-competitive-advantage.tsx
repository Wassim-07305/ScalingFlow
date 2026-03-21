"use client";

import React, { useMemo } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AILoading } from "@/components/shared/ai-loading";
import { cn } from "@/lib/utils/cn";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/use-user";
import { toast } from "sonner";
import { Sparkles, Trophy, Target, TrendingUp, Shield } from "lucide-react";

interface NicheScore {
  niche: string;
  score: number;
  strengths: string[];
  weaknesses: string[];
  opportunity: string;
  recommendation: string;
}

interface CompetitiveAdvantage {
  overall_score: number;
  top_niche: string;
  niches: NicheScore[];
  unique_positioning: string;
  key_differentiators: string[];
}

export function VaultCompetitiveAdvantage() {
  const { user } = useUser();
  const [loading, setLoading] = React.useState(true);
  const [generating, setGenerating] = React.useState(false);
  const [advantage, setAdvantage] = React.useState<CompetitiveAdvantage | null>(
    null,
  );

  React.useEffect(() => {
    if (!user) return;
    const fetchExisting = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("profiles")
        .select("competitive_advantage")
        .eq("id", user.id)
        .maybeSingle();
      if (data?.competitive_advantage) {
        setAdvantage(
          data.competitive_advantage as unknown as CompetitiveAdvantage,
        );
      }
      setLoading(false);
    };
    fetchExisting();
  }, [user]);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const response = await fetch("/api/ai/competitive-advantage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) throw new Error("Erreur lors de l'analyse");
      const data = await response.json();
      setAdvantage(data);
      toast.success("Analyse d'avantage compétitif terminée !");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    } finally {
      setGenerating(false);
    }
  };

  if (loading) return <AILoading text="Chargement" />;

  if (generating) {
    return <AILoading text="Analyse de ton avantage compétitif par niche" />;
  }

  if (!advantage) {
    return (
      <div className="text-center py-12">
        <Trophy className="h-12 w-12 text-text-muted mx-auto mb-4" />
        <h3 className="font-semibold text-text-primary mb-2">
          Score d&apos;avantage compétitif
        </h3>
        <p className="text-sm text-text-secondary mb-6 max-w-md mx-auto">
          L&apos;IA analyse tes compétences et ton profil pour calculer ton
          avantage compétitif dans différentes niches.
        </p>
        <Button size="lg" onClick={handleGenerate}>
          <Sparkles className="h-4 w-4 mr-2" />
          Analyser mon avantage
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overall score */}
      <Card className="border-accent/30">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-muted">Score global</p>
              <p className="text-4xl font-bold text-accent">
                {advantage.overall_score}/100
              </p>
              <p className="text-sm text-text-secondary mt-1">
                Meilleure niche :{" "}
                <span className="text-accent font-medium">
                  {advantage.top_niche}
                </span>
              </p>
            </div>
            <Button variant="outline" onClick={handleGenerate}>
              <Sparkles className="h-4 w-4 mr-2" />
              Recalculer
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Unique positioning */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-accent" />
            Positionnement unique
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-text-secondary">
            {advantage.unique_positioning}
          </p>
          <div className="flex flex-wrap gap-2 mt-3">
            {advantage.key_differentiators.map((d, i) => (
              <Badge key={i} variant="default">
                {d}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Niche scores */}
      <div className="grid gap-4 md:grid-cols-2">
        {advantage.niches.map((niche, i) => (
          <Card
            key={i}
            className={cn(
              niche.niche === advantage.top_niche && "border-accent/30",
            )}
          >
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Target className="h-4 w-4 text-accent" />
                  {niche.niche}
                </CardTitle>
                <Badge
                  variant={
                    niche.score >= 70
                      ? "default"
                      : niche.score >= 40
                        ? "blue"
                        : "muted"
                  }
                >
                  {niche.score}/100
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="h-2 bg-bg-tertiary rounded-full overflow-hidden">
                <div
                  className="h-full bg-accent rounded-full"
                  style={{ width: `${niche.score}%` }}
                />
              </div>

              <div>
                <p className="text-xs text-text-muted uppercase mb-1">Forces</p>
                <div className="flex flex-wrap gap-1">
                  {niche.strengths.map((s, j) => (
                    <Badge key={j} variant="default" className="text-xs">
                      {s}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs text-text-muted uppercase mb-1">
                  Faiblesses
                </p>
                <div className="flex flex-wrap gap-1">
                  {niche.weaknesses.map((w, j) => (
                    <Badge key={j} variant="muted" className="text-xs">
                      {w}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="p-2 rounded-lg bg-bg-tertiary">
                <p className="text-xs text-text-muted uppercase mb-1">
                  <TrendingUp className="h-3 w-3 inline mr-1" />
                  Opportunité
                </p>
                <p className="text-xs text-text-secondary">
                  {niche.opportunity}
                </p>
              </div>

              <p className="text-xs text-accent italic">
                {niche.recommendation}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
