"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ViabilityScore } from "@/components/onboarding/viability-score";
import { cn } from "@/lib/utils/cn";
import type { MarketAnalysisResult } from "@/types/ai";
import { Target, Users, TrendingUp, Check, ChevronDown, ChevronUp } from "lucide-react";

interface MarketAnalysisProps {
  result: MarketAnalysisResult;
  onSelect: (marketIndex: number) => void;
}

export function MarketAnalysis({ result, onSelect }: MarketAnalysisProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(
    result.recommended_market_index
  );
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">
          3 opportunités identifiées
        </h2>
        <p className="text-text-secondary">
          {result.reasoning}
        </p>
      </div>

      <div className="space-y-4">
        {result.markets.map((market, index) => {
          const isExpanded = expandedIndex === index;
          const isRecommended = index === result.recommended_market_index;
          const isSelected = selectedIndex === index;

          return (
            <motion.div
              key={market.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.15 }}
            >
              <Card
                className={cn(
                  "cursor-pointer transition-all duration-300",
                  isSelected && "border-accent",
                  isRecommended && !isSelected && "border-accent/50"
                )}
                onClick={() => setExpandedIndex(isExpanded ? null : index)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <ViabilityScore score={market.viability_score} size="sm" />
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          {market.name}
                          {isRecommended && (
                            <Badge variant="cyan">Recommandé</Badge>
                          )}
                        </CardTitle>
                        <p className="text-sm text-text-secondary mt-1">
                          {market.description}
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
                    {/* Problems */}
                    <div>
                      <h4 className="text-sm font-semibold text-text-primary flex items-center gap-2 mb-2">
                        <Target className="h-4 w-4 text-accent" />
                        Problèmes identifiés
                      </h4>
                      <ul className="space-y-1">
                        {market.problems.map((problem) => (
                          <li
                            key={problem}
                            className="text-sm text-text-secondary pl-4 relative before:content-['•'] before:absolute before:left-0 before:text-accent"
                          >
                            {problem}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Avatar */}
                    <div>
                      <h4 className="text-sm font-semibold text-text-primary flex items-center gap-2 mb-2">
                        <Users className="h-4 w-4 text-info" />
                        Avatar client : {market.avatar.name}
                      </h4>
                      <p className="text-sm text-text-secondary">
                        {market.avatar.role} — CA {market.avatar.revenue}
                      </p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {market.avatar.pain_points.map((pain) => (
                          <Badge key={pain} variant="red">
                            {pain}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Demand signals */}
                    <div>
                      <h4 className="text-sm font-semibold text-text-primary flex items-center gap-2 mb-2">
                        <TrendingUp className="h-4 w-4 text-accent" />
                        Signaux de demande
                      </h4>
                      <div className="flex flex-wrap gap-1">
                        {market.demand_signals.map((signal) => (
                          <Badge key={signal} variant="cyan">
                            {signal}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Why good fit */}
                    <div className="rounded-[8px] bg-bg-tertiary p-3">
                      <p className="text-sm text-text-secondary">
                        <span className="text-accent font-semibold">Pourquoi ce marché : </span>
                        {market.why_good_fit}
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
                          Sélectionné
                        </>
                      ) : (
                        "Choisir ce marché"
                      )}
                    </Button>
                  </CardContent>
                )}
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Confirm selection */}
      {selectedIndex !== null && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <Button
            size="lg"
            onClick={() => onSelect(selectedIndex)}
            className="px-10"
          >
            Valider et passer à la création d'offre
          </Button>
        </motion.div>
      )}
    </div>
  );
}
