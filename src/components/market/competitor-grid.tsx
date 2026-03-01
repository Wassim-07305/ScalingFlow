"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Shield,
  AlertTriangle,
  Lightbulb,
  Target,
  DollarSign,
} from "lucide-react";

interface Competitor {
  name: string;
  positioning: string;
  pricing_estimate: string;
  strengths: string[];
  weaknesses: string[];
  differentiation: string;
}

interface CompetitorGridProps {
  competitors: Competitor[];
  marketGaps?: string[];
  positioningOpportunities?: string[];
  recommendedDifferentiation?: string;
}

function CompetitorCard({ competitor }: { competitor: Competitor }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{competitor.name}</span>
          <Badge variant="muted" className="flex items-center gap-1">
            <DollarSign className="h-3 w-3" />
            {competitor.pricing_estimate}
          </Badge>
        </CardTitle>
        <p className="text-sm text-text-secondary">{competitor.positioning}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Forces */}
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-text-muted uppercase tracking-wider flex items-center gap-1.5">
            <Shield className="h-3 w-3 text-accent" />
            Forces
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {competitor.strengths.map((s, i) => (
              <Badge key={i} variant="default" className="text-xs">
                {s}
              </Badge>
            ))}
          </div>
        </div>

        {/* Faiblesses */}
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-text-muted uppercase tracking-wider flex items-center gap-1.5">
            <AlertTriangle className="h-3 w-3 text-warning" />
            Faiblesses
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {competitor.weaknesses.map((w, i) => (
              <Badge key={i} variant="yellow" className="text-xs">
                {w}
              </Badge>
            ))}
          </div>
        </div>

        {/* Differenciation */}
        <div className="space-y-1.5">
          <h4 className="text-xs font-medium text-text-muted uppercase tracking-wider flex items-center gap-1.5">
            <Target className="h-3 w-3 text-info" />
            Differenciation
          </h4>
          <p className="text-sm text-text-secondary">{competitor.differentiation}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export function CompetitorGrid({
  competitors,
  marketGaps,
  positioningOpportunities,
  recommendedDifferentiation,
}: CompetitorGridProps) {
  return (
    <div className="space-y-6">
      {/* Grille des concurrents */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {competitors.map((competitor, i) => (
          <CompetitorCard key={i} competitor={competitor} />
        ))}
      </div>

      {/* Synthese strategique */}
      {(marketGaps || positioningOpportunities || recommendedDifferentiation) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Lacunes du marche */}
          {marketGaps && marketGaps.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Lightbulb className="h-4 w-4 text-warning" />
                  Lacunes du marche
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {marketGaps.map((gap, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-text-secondary">
                      <span className="text-warning mt-0.5">-</span>
                      {gap}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Opportunites de positionnement */}
          {positioningOpportunities && positioningOpportunities.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Target className="h-4 w-4 text-accent" />
                  Opportunites de positionnement
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {positioningOpportunities.map((opp, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-text-secondary">
                      <span className="text-accent mt-0.5">-</span>
                      {opp}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Differenciation recommandee */}
      {recommendedDifferentiation && (
        <Card className="border-accent/30 bg-accent/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Target className="h-4 w-4 text-accent" />
              Differenciation recommandee
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-text-primary leading-relaxed">
              {recommendedDifferentiation}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
