"use client";

import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AILoading } from "@/components/shared/ai-loading";
import { cn } from "@/lib/utils/cn";
import { toast } from "sonner";
import {
  Sparkles,
  Mic,
  Star,
  ThumbsUp,
  ThumbsDown,
  AlertTriangle,
  TrendingUp,
  MessageSquare,
  Target,
  ChevronDown,
  ChevronUp,
  Upload,
} from "lucide-react";

interface ScoreSection {
  score: number;
  max: number;
  strengths: string[];
  improvements: string[];
  key_moment: string;
}

interface CallAnalysisResult {
  overall_score: number;
  overall_verdict: string;
  scores: {
    discovery: ScoreSection;
    rapport_building: ScoreSection;
    problem_reframing: ScoreSection;
    objection_handling: ScoreSection;
    closing: ScoreSection;
  };
  key_phrases_to_keep: Array<{ phrase: string; why: string }>;
  key_phrases_to_improve: Array<{ phrase: string; suggestion: string }>;
  objections_detected: Array<{
    objection: string;
    handling: string;
    score: number;
    better_response: string;
  }>;
  client_signals: {
    buying_signals: string[];
    warning_signals: string[];
    emotional_triggers: string[];
  };
  next_steps: string[];
  training_focus: string[];
}

const SCORE_LABELS: Record<string, string> = {
  discovery: "Discovery",
  rapport_building: "Rapport",
  problem_reframing: "Recadrage",
  objection_handling: "Objections",
  closing: "Closing",
};

export function CallAnalyzer() {
  const [loading, setLoading] = React.useState(false);
  const [result, setResult] = React.useState<CallAnalysisResult | null>(null);
  const [transcript, setTranscript] = React.useState("");
  const [callType, setCallType] = React.useState("discovery");
  const [expandedSection, setExpandedSection] = React.useState<string | null>("discovery");
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith(".txt") && !file.name.endsWith(".srt") && !file.name.endsWith(".vtt")) {
      toast.error("Format accepte : .txt, .srt, .vtt");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Fichier trop volumineux (max 5 Mo)");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result as string;
      setTranscript(text);
      toast.success(`Fichier "${file.name}" charge (${text.length} caracteres)`);
    };
    reader.onerror = () => toast.error("Erreur de lecture du fichier");
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleAnalyze = async () => {
    if (transcript.trim().length < 50) {
      toast.error("Le transcript doit contenir au moins 50 caractères");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/ai/analyze-call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript, call_type: callType }),
      });

      if (!response.ok) throw new Error("Erreur lors de l'analyse");
      const data = await response.json();
      setResult(data);
      toast.success("Analyse du call terminée !");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <AILoading text="Analyse approfondie de ton call de vente" />;
  }

  if (!result) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <Mic className="h-10 w-10 text-accent mx-auto mb-3" />
          <h3 className="font-semibold text-text-primary mb-1">Analyse de call de vente</h3>
          <p className="text-sm text-text-secondary max-w-md mx-auto">
            Colle le transcript de ton appel et l&apos;IA analysera ta performance : discovery, objections, closing et plus.
          </p>
        </div>

        <Card>
          <CardContent className="pt-6 space-y-4">
            <div>
              <label className="text-sm font-medium text-text-primary mb-2 block">
                Type d&apos;appel
              </label>
              <div className="flex gap-2">
                {[
                  { key: "discovery", label: "Discovery" },
                  { key: "closing", label: "Closing" },
                  { key: "setting", label: "Setting" },
                  { key: "follow_up", label: "Follow-up" },
                ].map((t) => (
                  <button
                    key={t.key}
                    onClick={() => setCallType(t.key)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                      callType === t.key
                        ? "bg-accent text-white"
                        : "bg-bg-tertiary text-text-secondary hover:text-text-primary"
                    )}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-text-primary">
                  Transcript de l&apos;appel
                </label>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-bg-tertiary text-text-secondary hover:text-text-primary transition-all"
                >
                  <Upload className="h-3.5 w-3.5" />
                  Importer fichier
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".txt,.srt,.vtt"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
              <textarea
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                placeholder={`Colle ici le transcript ou importe un fichier (.txt, .srt, .vtt)...\n\nVendeur : Bonjour, merci d'avoir pris le temps...\nProspect : Oui, j'ai vu votre publicité et...\n...`}
                rows={12}
                className="w-full px-4 py-3 rounded-xl bg-bg-tertiary border border-border-default text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent resize-none text-sm"
              />
              <p className="text-xs text-text-muted mt-1">
                {transcript.length} caractères — minimum 50
              </p>
            </div>

            <Button
              size="lg"
              onClick={handleAnalyze}
              disabled={transcript.trim().length < 50}
              className="w-full"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Analyser le call
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Display results
  const getScoreColor = (score: number, max: number) => {
    const pct = (score / max) * 100;
    if (pct >= 80) return "text-green-400";
    if (pct >= 60) return "text-yellow-400";
    return "text-red-400";
  };

  return (
    <div className="space-y-6">
      {/* Overall score */}
      <Card className="border-accent/30">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-muted">Score global</p>
              <p className={cn("text-4xl font-bold", getScoreColor(result.overall_score, 10))}>
                {result.overall_score}/10
              </p>
              <p className="text-sm text-text-secondary mt-1">{result.overall_verdict}</p>
            </div>
            <Button variant="outline" onClick={() => { setResult(null); setTranscript(""); }}>
              Nouveau call
            </Button>
          </div>

          {/* Score breakdown bar */}
          <div className="grid grid-cols-5 gap-2 mt-4">
            {Object.entries(result.scores).map(([key, section]) => (
              <div key={key} className="text-center">
                <p className={cn("text-lg font-bold", getScoreColor(section.score, section.max))}>
                  {section.score}
                </p>
                <p className="text-xs text-text-muted">{SCORE_LABELS[key]}</p>
                <div className="h-1.5 bg-bg-tertiary rounded-full mt-1 overflow-hidden">
                  <div
                    className="h-full bg-accent rounded-full"
                    style={{ width: `${(section.score / section.max) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Detailed scores */}
      {Object.entries(result.scores).map(([key, section]) => (
        <Card key={key}>
          <CardHeader
            className="cursor-pointer py-3"
            onClick={() => setExpandedSection(expandedSection === key ? null : key)}
          >
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <span className={cn("text-lg font-bold", getScoreColor(section.score, section.max))}>
                  {section.score}/{section.max}
                </span>
                {SCORE_LABELS[key]}
              </CardTitle>
              {expandedSection === key ? (
                <ChevronUp className="h-4 w-4 text-text-muted" />
              ) : (
                <ChevronDown className="h-4 w-4 text-text-muted" />
              )}
            </div>
          </CardHeader>
          {expandedSection === key && (
            <CardContent className="pt-0 space-y-3">
              <div className="p-3 rounded-lg bg-bg-tertiary">
                <p className="text-xs text-text-muted uppercase mb-1">Moment clé</p>
                <p className="text-sm text-text-secondary italic">{section.key_moment}</p>
              </div>
              <div className="grid md:grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-text-muted uppercase mb-1 flex items-center gap-1">
                    <ThumbsUp className="h-3 w-3 text-green-400" /> Forces
                  </p>
                  <ul className="space-y-1">
                    {section.strengths.map((s, i) => (
                      <li key={i} className="text-xs text-text-secondary flex items-start gap-1">
                        <span className="text-green-400">+</span> {s}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-xs text-text-muted uppercase mb-1 flex items-center gap-1">
                    <ThumbsDown className="h-3 w-3 text-red-400" /> Améliorations
                  </p>
                  <ul className="space-y-1">
                    {section.improvements.map((s, i) => (
                      <li key={i} className="text-xs text-text-secondary flex items-start gap-1">
                        <span className="text-red-400">-</span> {s}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          )}
        </Card>
      ))}

      {/* Key phrases */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Star className="h-4 w-4 text-yellow-400" />
              Phrases à garder
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-2">
            {result.key_phrases_to_keep.map((p, i) => (
              <div key={i} className="p-2 rounded-lg bg-bg-tertiary">
                <p className="text-xs text-accent font-medium italic">&ldquo;{p.phrase}&rdquo;</p>
                <p className="text-xs text-text-muted mt-1">{p.why}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-400" />
              Phrases à améliorer
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-2">
            {result.key_phrases_to_improve.map((p, i) => (
              <div key={i} className="p-2 rounded-lg bg-bg-tertiary">
                <p className="text-xs text-red-400 line-through italic">&ldquo;{p.phrase}&rdquo;</p>
                <p className="text-xs text-accent mt-1">&ldquo;{p.suggestion}&rdquo;</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Client signals */}
      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-accent" />
            Signaux du prospect
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid md:grid-cols-3 gap-3">
            <div>
              <p className="text-xs text-text-muted uppercase mb-1">Signaux d&apos;achat</p>
              {result.client_signals.buying_signals.map((s, i) => (
                <Badge key={i} variant="default" className="text-xs mr-1 mb-1">{s}</Badge>
              ))}
            </div>
            <div>
              <p className="text-xs text-text-muted uppercase mb-1">Signaux d&apos;alerte</p>
              {result.client_signals.warning_signals.map((s, i) => (
                <Badge key={i} variant="red" className="text-xs mr-1 mb-1">{s}</Badge>
              ))}
            </div>
            <div>
              <p className="text-xs text-text-muted uppercase mb-1">Déclencheurs émotionnels</p>
              {result.client_signals.emotional_triggers.map((s, i) => (
                <Badge key={i} variant="blue" className="text-xs mr-1 mb-1">{s}</Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Next steps & Training */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-accent" />
              Prochaines étapes
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <ul className="space-y-1">
              {result.next_steps.map((s, i) => (
                <li key={i} className="text-xs text-text-secondary flex items-start gap-2">
                  <span className="text-accent">{"\u2192"}</span> {s}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Target className="h-4 w-4 text-accent" />
              Focus entraînement
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <ul className="space-y-1">
              {result.training_focus.map((s, i) => (
                <li key={i} className="text-xs text-text-secondary flex items-start gap-2">
                  <span className="text-accent">{"\u2022"}</span> {s}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
