"use client";

import React from "react";
import { cn } from "@/lib/utils/cn";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AILoading } from "@/components/shared/ai-loading";
import {
  Sparkles,
  FileText,
  Users,
  TrendingUp,
  Quote,
  Star,
  Send,
} from "lucide-react";
import { UnipilePublishDialog } from "@/components/shared/unipile-publish-dialog";

interface CaseStudyGeneratorProps {
  className?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initialData?: any;
}

export function CaseStudyGenerator({
  className,
  initialData,
}: CaseStudyGeneratorProps) {
  const [loading, setLoading] = React.useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [caseStudy, setCaseStudy] = React.useState<any>(initialData || null);
  const [error, setError] = React.useState<string | null>(null);
  const [metric, setMetric] = React.useState("");
  const [value, setValue] = React.useState("");
  const [publishDialogOpen, setPublishDialogOpen] = React.useState(false);
  const [publishContent, setPublishContent] = React.useState("");

  React.useEffect(() => {
    if (initialData) setCaseStudy(initialData);
  }, [initialData]);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/ai/generate-assets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "case_study", metric, value }),
      });

      if (!response.ok) throw new Error("Erreur lors de la génération");
      const data = await response.json();
      setCaseStudy(data.ai_raw_response || data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AILoading text="Rédaction de ton étude de cas" className={className} />
    );
  }

  if (!caseStudy) {
    return (
      <div className={cn("space-y-6 max-w-md mx-auto py-8", className)}>
        {error && <p className="text-sm text-danger text-center">{error}</p>}

        <div className="text-center mb-2">
          <h3 className="text-sm font-medium text-text-primary">
            Paramètres de l&apos;étude de cas
          </h3>
          <p className="text-xs text-text-secondary mt-1">
            Renseigne la métrique clé et le résultat obtenu
          </p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="metric">Métrique clé</Label>
            <Input
              id="metric"
              placeholder="Ex : Chiffre d'affaires"
              value={metric}
              onChange={(e) => setMetric(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="value">Résultat obtenu</Label>
            <Input
              id="value"
              placeholder="Ex : x3 en 90 jours"
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
          </div>
        </div>

        <div className="text-center">
          <Button size="lg" onClick={handleGenerate}>
            <Sparkles className="h-4 w-4 mr-2" />
            Générer l&apos;étude de cas
          </Button>
        </div>
      </div>
    );
  }

  const problem = caseStudy.problem || {};
  const solution = caseStudy.solution || {};
  const results = caseStudy.results || {};
  const testimonial = caseStudy.testimonial || {};
  const quantitative = results.quantitative || [];
  const qualitative = results.qualitative || [];

  return (
    <div className={cn("space-y-6", className)}>
      {/* Title */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <h3 className="font-semibold text-text-primary text-lg">
            {caseStudy.title || "Étude de cas"}
          </h3>
          <Badge variant="purple">Étude de cas</Badge>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            const text = [
              caseStudy.title,
              problem.client_profile && `Profil : ${problem.client_profile}`,
              problem.initial_situation &&
                `Situation : ${problem.initial_situation}`,
              solution.approach && `Solution : ${solution.approach}`,
              results.roi && `ROI : ${results.roi}`,
              testimonial.quote && `"${testimonial.quote}"`,
            ]
              .filter(Boolean)
              .join("\n\n");
            setPublishContent(text);
            setPublishDialogOpen(true);
          }}
        >
          <Send className="h-3.5 w-3.5 mr-1.5" />
          Partager
        </Button>
      </div>

      {/* Problem section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-danger" />
            <CardTitle>Problème</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {problem.client_profile && (
            <div>
              <p className="text-xs text-text-muted font-medium mb-1">
                Profil client
              </p>
              <p className="text-sm text-text-secondary">
                {problem.client_profile}
              </p>
            </div>
          )}
          {problem.initial_situation && (
            <div>
              <p className="text-xs text-text-muted font-medium mb-1">
                Situation initiale
              </p>
              <p className="text-sm text-text-secondary">
                {problem.initial_situation}
              </p>
            </div>
          )}
          {problem.challenges && problem.challenges.length > 0 && (
            <div>
              <p className="text-xs text-text-muted font-medium mb-1">Défis</p>
              <ul className="space-y-1">
                {problem.challenges.map((challenge: string, i: number) => (
                  <li
                    key={i}
                    className="text-sm text-text-secondary flex items-start gap-2"
                  >
                    <span className="text-danger mt-0.5">--</span>
                    {challenge}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {problem.previous_attempts && (
            <div>
              <p className="text-xs text-text-muted font-medium mb-1">
                Tentatives précédentes
              </p>
              <p className="text-sm text-text-secondary">
                {problem.previous_attempts}
              </p>
            </div>
          )}
          {problem.financial_impact && (
            <div>
              <p className="text-xs text-text-muted font-medium mb-1">
                Impact financier
              </p>
              <p className="text-sm text-text-secondary">
                {problem.financial_impact}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Solution section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-info" />
            <CardTitle>Solution</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {solution.approach && (
            <div>
              <p className="text-xs text-text-muted font-medium mb-1">
                Approche
              </p>
              <p className="text-sm text-text-secondary">{solution.approach}</p>
            </div>
          )}
          {solution.implementation_steps &&
            solution.implementation_steps.length > 0 && (
              <div>
                <p className="text-xs text-text-muted font-medium mb-1">
                  Étapes de mise en oeuvre
                </p>
                <ol className="space-y-1">
                  {solution.implementation_steps.map(
                    (step: string, i: number) => (
                      <li
                        key={i}
                        className="text-sm text-text-secondary flex items-start gap-2"
                      >
                        <Badge
                          variant="muted"
                          className="text-xs mt-0.5 shrink-0"
                        >
                          {i + 1}
                        </Badge>
                        {step}
                      </li>
                    ),
                  )}
                </ol>
              </div>
            )}
          {solution.timeline && (
            <div>
              <p className="text-xs text-text-muted font-medium mb-1">
                Timeline
              </p>
              <p className="text-sm text-text-secondary">{solution.timeline}</p>
            </div>
          )}
          {solution.customizations && (
            <div>
              <p className="text-xs text-text-muted font-medium mb-1">
                Personnalisations
              </p>
              <p className="text-sm text-text-secondary">
                {solution.customizations}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-accent" />
            <CardTitle>Résultats</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {quantitative.length > 0 && (
            <div>
              <p className="text-xs text-text-muted font-medium mb-2">
                Métriques quantitatives
              </p>
              <div className="rounded-lg border border-border-default overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-bg-tertiary">
                      <th className="text-left px-3 py-2 text-text-muted font-medium">
                        Métrique
                      </th>
                      <th className="text-left px-3 py-2 text-text-muted font-medium">
                        Avant
                      </th>
                      <th className="text-left px-3 py-2 text-text-muted font-medium">
                        Après
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {quantitative.map(
                      (
                        row: { metric: string; before: string; after: string },
                        i: number,
                      ) => (
                        <tr key={i} className="border-t border-border-default">
                          <td className="px-3 py-2 text-text-primary font-medium">
                            {row.metric}
                          </td>
                          <td className="px-3 py-2 text-text-secondary">
                            {row.before}
                          </td>
                          <td className="px-3 py-2 text-accent font-medium">
                            {row.after}
                          </td>
                        </tr>
                      ),
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {qualitative.length > 0 && (
            <div>
              <p className="text-xs text-text-muted font-medium mb-1">
                Résultats qualitatifs
              </p>
              <ul className="space-y-1">
                {qualitative.map((item: string, i: number) => (
                  <li
                    key={i}
                    className="text-sm text-text-secondary flex items-start gap-2"
                  >
                    <span className="text-accent mt-0.5">--</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {results.roi && (
            <div>
              <p className="text-xs text-text-muted font-medium mb-1">ROI</p>
              <p className="text-sm text-accent font-semibold">{results.roi}</p>
            </div>
          )}
          {results.timeline_to_results && (
            <div>
              <p className="text-xs text-text-muted font-medium mb-1">
                Délai d&apos;obtention
              </p>
              <p className="text-sm text-text-secondary">
                {results.timeline_to_results}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Testimonial section */}
      {(testimonial.quote || testimonial.client_name) && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Quote className="h-4 w-4 text-warning" />
              <CardTitle>Témoignage</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {testimonial.quote && (
              <blockquote className="text-sm text-text-secondary italic border-l-2 border-accent/40 pl-4">
                &ldquo;{testimonial.quote}&rdquo;
              </blockquote>
            )}
            {testimonial.client_name && (
              <p className="text-sm text-text-muted">
                -- {testimonial.client_name}
              </p>
            )}
            {testimonial.rating && (
              <div className="flex items-center gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={cn(
                      "h-4 w-4",
                      i < testimonial.rating
                        ? "text-warning fill-warning"
                        : "text-border-default",
                    )}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <UnipilePublishDialog
        open={publishDialogOpen}
        onOpenChange={setPublishDialogOpen}
        content={publishContent}
      />
    </div>
  );
}
