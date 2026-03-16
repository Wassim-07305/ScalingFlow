"use client";

import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import {
  Zap,
  ShieldCheck,
  AlertTriangle,
  Lightbulb,
  Route,
  GraduationCap,
  ArrowRight,
  TrendingUp,
  Target,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ViabilityScore } from "@/components/onboarding/viability-score";
import { cn } from "@/lib/utils/cn";
import type { VaultAnalysis } from "@/lib/ai/prompts/vault-analysis";
import { PARCOURS } from "@/lib/parcours";

interface VaultResultsProps {
  analysis: VaultAnalysis;
  onContinue?: () => void;
}

const radarLabels: Record<string, string> = {
  marketing: "Marketing",
  vente: "Vente",
  copywriting: "Copywriting",
  tech: "Tech",
  design: "Design",
  strategie: "Stratégie",
};

const funnelLabels: Record<string, string> = {
  vsl: "VSL (Video Sales Letter)",
  social: "Social Media Funnel",
  hybride: "Hybride (VSL + Social)",
};

const parcoursLabels: Record<string, string> = Object.fromEntries(
  Object.entries(PARCOURS).map(([key, def]) => [key, def.label]),
);

const potentielVariant: Record<string, "default" | "yellow" | "red"> = {
  fort: "default",
  moyen: "yellow",
  faible: "red",
};

const potentielLabel: Record<string, string> = {
  fort: "Fort",
  moyen: "Moyen",
  faible: "Faible",
};

export function VaultResults({ analysis, onContinue }: VaultResultsProps) {
  // Formater les données pour le RadarChart
  const radarData = Object.entries(analysis.radar ?? {}).map(
    ([key, value]) => ({
      dimension: radarLabels[key] ?? key,
      value,
      fullMark: 100,
    }),
  );

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* En-tête */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-text-primary">
          Analyse de ton Vault
        </h2>
        <p className="mt-2 text-sm text-text-secondary">
          Cartographie complète de tes compétences et recommandations
          personnalisées
        </p>
      </div>

      {/* Radar + Score */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Radar Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-4 w-4 text-accent" />
              Radar de compétences
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart
                  cx="50%"
                  cy="50%"
                  outerRadius="70%"
                  data={radarData}
                >
                  <PolarGrid
                    stroke="rgba(255,255,255,0.08)"
                    gridType="polygon"
                  />
                  <PolarAngleAxis
                    dataKey="dimension"
                    stroke="#5C6370"
                    fontSize={12}
                    tickLine={false}
                  />
                  <PolarRadiusAxis
                    angle={90}
                    domain={[0, 100]}
                    stroke="rgba(255,255,255,0.06)"
                    fontSize={10}
                    tickCount={5}
                  />
                  <Radar
                    name="Competences"
                    dataKey="value"
                    stroke="#34D399"
                    fill="#34D399"
                    fillOpacity={0.2}
                    strokeWidth={2}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1C1F23",
                      border: "1px solid rgba(255,255,255,0.06)",
                      borderRadius: "8px",
                      color: "#FFFFFF",
                      fontSize: "13px",
                    }}
                    formatter={(value) => [`${value ?? 0}/100`, "Score"]}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Score avantage compétitif */}
        <Card className="flex flex-col items-center justify-center">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <TrendingUp className="h-4 w-4 text-accent" />
              Avantage compétitif
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            <ViabilityScore
              score={analysis.score_avantage_competitif ?? 0}
              size="lg"
            />
            <p className="text-center text-sm text-text-secondary">
              {analysis.score_avantage_competitif >= 80
                ? "Excellent ! Tu as un avantage compétitif très fort."
                : analysis.score_avantage_competitif >= 60
                  ? "Bon potentiel. Quelques axes d'amélioration identifiés."
                  : analysis.score_avantage_competitif >= 40
                    ? "Potentiel à développer. Focus sur tes forces."
                    : "En construction. Suis les étapes recommandées."}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Forces & Faiblesses */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Forces */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-accent" />
              Forces principales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {(analysis.forces_principales ?? []).map((force, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent-muted text-xs font-bold text-accent">
                    {i + 1}
                  </span>
                  <span className="text-sm text-text-primary">{force}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Faiblesses */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-warning" />
              Axes d&apos;amelioration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {(analysis.faiblesses ?? []).map((faiblesse, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-warning/12 text-xs font-bold text-warning">
                    {i + 1}
                  </span>
                  <span className="text-sm text-text-primary">{faiblesse}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Suggestions de productisation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-accent" />
            Suggestions de productisation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {(analysis.suggestions_productisation ?? []).map(
              (suggestion, i) => (
                <div
                  key={i}
                  className="rounded-[8px] border border-border-default bg-bg-tertiary p-4 transition-colors hover:border-border-hover"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-text-primary">
                      {suggestion.titre}
                    </h4>
                    <Badge variant={potentielVariant[suggestion.potentiel]}>
                      {potentielLabel[suggestion.potentiel]}
                    </Badge>
                  </div>
                  <p className="text-xs leading-relaxed text-text-secondary">
                    {suggestion.description}
                  </p>
                </div>
              ),
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recommandation funnel + Parcours */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Recommandation funnel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Route className="h-4 w-4 text-accent" />
              Funnel recommande
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3">
              <Badge variant="default" className="text-sm">
                {funnelLabels[analysis.recommandation_funnel] ??
                  analysis.recommandation_funnel ??
                  "Non defini"}
              </Badge>
            </div>
            <p className="text-sm leading-relaxed text-text-secondary">
              {analysis.recommandation_funnel_raison}
            </p>
          </CardContent>
        </Card>

        {/* Parcours recommande */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-accent" />
              Parcours recommande
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3">
              <Badge variant="blue" className="text-sm">
                {analysis.parcours_recommande}
              </Badge>
              <span className="text-sm font-medium text-text-primary">
                {parcoursLabels[analysis.parcours_recommande]}
              </span>
            </div>
            <p className="text-sm leading-relaxed text-text-secondary">
              {analysis.parcours_raison}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Prochaines étapes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-accent" />
            Prochaines étapes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="space-y-3">
            {(analysis.prochaines_etapes ?? []).map((etape, i) => (
              <li key={i} className="flex items-start gap-3">
                <span
                  className={cn(
                    "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                    "bg-accent-muted text-accent",
                  )}
                >
                  {i + 1}
                </span>
                <span className="text-sm text-text-primary">{etape}</span>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>

      {/* Bouton Continuer */}
      {onContinue && (
        <div className="flex justify-center pb-8">
          <Button size="lg" onClick={onContinue} className="gap-2">
            Continuer
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
