"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { SchwartzAnalysisResult } from "@/types/ai";
import {
  Target,
  Lightbulb,
  Megaphone,
  FileText,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";

interface SchwartzDisplayProps {
  analysis: SchwartzAnalysisResult;
}

const NIVEAU_LABELS: Record<
  1 | 2 | 3 | 4 | 5,
  { label: string; color: string }
> = {
  1: { label: "Marché vierge", color: "bg-emerald-500" },
  2: { label: "Problème connu", color: "bg-blue-500" },
  3: { label: "Solutions connues", color: "bg-yellow-500" },
  4: { label: "Marché saturé", color: "bg-orange-500" },
  5: { label: "Hyper-saturé", color: "bg-red-500" },
};

const STRATEGIE_LABELS: Record<string, { label: string; description: string }> =
  {
    vsl: {
      label: "VSL (Video Sales Letter)",
      description: "Promesse directe via vidéo longue",
    },
    social_funnel: {
      label: "Entonnoir Social",
      description: "Nurturing via contenu social",
    },
    education_first: {
      label: "Éducation d'abord",
      description: "Créer la conscience du problème",
    },
    direct_response: {
      label: "Réponse directe",
      description: "Preuves massives et identification",
    },
  };

const PREUVE_COLORS: Record<string, "default" | "yellow" | "red"> = {
  faible: "default",
  moyen: "default",
  eleve: "yellow",
  tres_eleve: "red",
};

function InfoCard({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Icon className="h-4 w-4 text-accent" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

export function SchwartzDisplay({ analysis }: SchwartzDisplayProps) {
  const niveauInfo = NIVEAU_LABELS[analysis.niveau];
  const strategieInfo = STRATEGIE_LABELS[analysis.strategie_recommandee];
  const preuveColor = PREUVE_COLORS[analysis.niveau_preuve_requis] || "default";

  return (
    <div className="space-y-4">
      {/* Header avec niveau */}
      <Card className="border-accent/30 bg-gradient-to-r from-accent/5 to-transparent">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div
                className={`flex h-14 w-14 items-center justify-center rounded-xl ${niveauInfo.color} text-white font-bold text-2xl`}
              >
                {analysis.niveau}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-text-primary">
                  Niveau {analysis.niveau} — {niveauInfo.label}
                </h3>
                <p className="text-sm text-text-secondary">
                  Sophistication de marché selon Eugene Schwartz
                </p>
              </div>
            </div>
            <TrendingUp className="h-8 w-8 text-accent/50" />
          </div>
          <p className="text-sm text-text-primary leading-relaxed">
            {analysis.description}
          </p>
        </CardContent>
      </Card>

      {/* Grid d'informations */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Implications marketing */}
        <InfoCard icon={Lightbulb} title="Implications marketing">
          <p className="text-sm text-text-secondary leading-relaxed">
            {analysis.implication_marketing}
          </p>
        </InfoCard>

        {/* Stratégie recommandée */}
        <InfoCard icon={Target} title="Stratégie recommandée">
          <div className="space-y-2">
            <Badge variant="default" className="text-sm">
              {strategieInfo?.label || analysis.strategie_recommandee}
            </Badge>
            {strategieInfo?.description && (
              <p className="text-sm text-text-muted">
                {strategieInfo.description}
              </p>
            )}
          </div>
        </InfoCard>

        {/* Angle publicitaire */}
        <InfoCard icon={Megaphone} title="Angle publicitaire">
          <p className="text-sm text-text-secondary leading-relaxed">
            {analysis.angle_publicitaire}
          </p>
        </InfoCard>

        {/* Type de contenu */}
        <InfoCard icon={FileText} title="Contenu prioritaire">
          <p className="text-sm text-text-secondary leading-relaxed">
            {analysis.type_contenu_prioritaire}
          </p>
        </InfoCard>
      </div>

      {/* Niveau de preuve requis */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-accent" />
              <span className="font-medium text-text-primary">
                Niveau de preuve requis
              </span>
            </div>
            <Badge variant={preuveColor} className="capitalize">
              {analysis.niveau_preuve_requis.replace("_", " ")}
            </Badge>
          </div>
          <p className="text-sm text-text-muted mt-2">
            {analysis.niveau_preuve_requis === "faible" &&
              "Le prospect est réceptif, une preuve légère suffit."}
            {analysis.niveau_preuve_requis === "moyen" &&
              "Nécessite des témoignages et études de cas."}
            {analysis.niveau_preuve_requis === "eleve" &&
              "Preuve sociale massive, chiffres précis, garanties fortes."}
            {analysis.niveau_preuve_requis === "tres_eleve" &&
              "Preuves extrêmes, vidéo témoignages, résultats vérifiables."}
          </p>
        </CardContent>
      </Card>

      {/* Recommandations Schwartz */}
      {(analysis.schwartz_pricing_reco ||
        analysis.social_content_reco ||
        analysis.vsl_style_reco) && (
        <div className="grid gap-4 md:grid-cols-3">
          {analysis.schwartz_pricing_reco && (
            <InfoCard icon={Target} title="Pricing recommandé">
              <p className="text-sm text-text-secondary leading-relaxed">
                {analysis.schwartz_pricing_reco}
              </p>
            </InfoCard>
          )}
          {analysis.social_content_reco && (
            <InfoCard icon={FileText} title="Contenu social recommandé">
              <p className="text-sm text-text-secondary leading-relaxed">
                {analysis.social_content_reco}
              </p>
            </InfoCard>
          )}
          {analysis.vsl_style_reco && (
            <InfoCard icon={Megaphone} title="Style VSL recommandé">
              <p className="text-sm text-text-secondary leading-relaxed">
                {analysis.vsl_style_reco}
              </p>
            </InfoCard>
          )}
        </div>
      )}
    </div>
  );
}
