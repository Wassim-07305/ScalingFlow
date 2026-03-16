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
  Link2,
  BookOpen,
  FileText,
  Loader2,
  ArrowUpRight,
  CheckCircle2,
  RotateCcw,
} from "lucide-react";

interface ScoreSection {
  score: number;
  max: number;
  strengths: string[];
  improvements: string[];
  key_moment: string;
}

interface PlaybookAction {
  title: string;
  description: string;
  priority: "haute" | "moyenne" | "basse";
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
    tonality_energy?: ScoreSection;
    conversation_control?: ScoreSection;
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
  speaker_analysis?: {
    seller_talk_ratio: number;
    prospect_talk_ratio: number;
    ideal_ratio_met: boolean;
    longest_monologue_seller: string;
    longest_monologue_prospect: string;
    interruptions: number;
    silence_management: string;
  };
  playbook?: PlaybookAction[];
  next_steps: string[];
  training_focus: string[];
}

const SCORE_LABELS: Record<string, string> = {
  discovery: "Discovery",
  rapport_building: "Rapport",
  problem_reframing: "Recadrage",
  objection_handling: "Objections",
  closing: "Closing",
  tonality_energy: "Tonalité & Énergie",
  conversation_control: "Contrôle de conversation",
};

const SCORE_ICONS: Record<string, string> = {
  discovery: "🔍",
  rapport_building: "🤝",
  problem_reframing: "🎯",
  objection_handling: "🛡️",
  closing: "🏆",
  tonality_energy: "🎤",
  conversation_control: "⚡",
};

const PROSPECT_ORIGINS = [
  { key: "instagram_dm", label: "Instagram DM" },
  { key: "linkedin", label: "LinkedIn" },
  { key: "ads_meta", label: "Ads Meta" },
  { key: "bouche_a_oreille", label: "Bouche à oreille" },
  { key: "autre", label: "Autre" },
];

const ANALYSIS_FOCUSES = [
  { key: "global", label: "Global" },
  { key: "decouverte", label: "Découverte" },
  { key: "pitch", label: "Pitch" },
  { key: "closing", label: "Closing" },
];

const CALL_RESULTS = [
  { key: "close", label: "Closé" },
  { key: "ghoste", label: "Ghosté" },
  { key: "parti", label: "Parti" },
  { key: "en_cours", label: "En cours" },
];

const PRIORITY_CONFIG = {
  haute: {
    color: "text-red-400",
    bg: "bg-red-400/10",
    border: "border-red-400/20",
  },
  moyenne: {
    color: "text-yellow-400",
    bg: "bg-yellow-400/10",
    border: "border-yellow-400/20",
  },
  basse: {
    color: "text-blue-400",
    bg: "bg-blue-400/10",
    border: "border-blue-400/20",
  },
};

/* ── Score ring component ── */

function ScoreRing({
  score,
  max,
  size = 72,
  strokeWidth = 5,
  className,
}: {
  score: number;
  max: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
}) {
  const pct = (score / max) * 100;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;

  const color =
    pct >= 80
      ? "stroke-emerald-400"
      : pct >= 60
        ? "stroke-yellow-400"
        : "stroke-red-400";
  const textColor =
    pct >= 80
      ? "text-emerald-400"
      : pct >= 60
        ? "text-yellow-400"
        : "text-red-400";

  return (
    <div
      className={cn(
        "relative inline-flex items-center justify-center",
        className,
      )}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          className="stroke-bg-tertiary"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          className={cn(color, "transition-all duration-700 ease-out")}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <span className={cn("absolute text-lg font-bold", textColor)}>
        {score}
      </span>
    </div>
  );
}

interface CallAnalyzerProps {
  initialResult?: Record<string, unknown> | null;
  onResultClear?: () => void;
}

export function CallAnalyzer({ initialResult, onResultClear }: CallAnalyzerProps = {}) {
  const [loading, setLoading] = React.useState(false);
  const [result, setResult] = React.useState<CallAnalysisResult | null>(
    (initialResult as unknown as CallAnalysisResult | null) ?? null,
  );
  const [transcript, setTranscript] = React.useState("");
  const [callType, setCallType] = React.useState("discovery");
  const [recordingUrl, setRecordingUrl] = React.useState("");
  const [prospectOrigin, setProspectOrigin] = React.useState("");
  const [analysisFocus, setAnalysisFocus] = React.useState("global");
  const [callResult, setCallResult] = React.useState("");
  const [expandedSection, setExpandedSection] = React.useState<string | null>(
    "discovery",
  );
  const [scriptLoading, setScriptLoading] = React.useState(false);
  const [generatedScript, setGeneratedScript] = React.useState<string | null>(
    null,
  );
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Load result from history
  React.useEffect(() => {
    if (initialResult) {
      setResult(initialResult as unknown as CallAnalysisResult);
    }
  }, [initialResult]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (
      !file.name.endsWith(".txt") &&
      !file.name.endsWith(".srt") &&
      !file.name.endsWith(".vtt")
    ) {
      toast.error("Format accepté : .txt, .srt, .vtt");
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
      toast.success(
        `Fichier "${file.name}" chargé (${text.length} caractères)`,
      );
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
    setGeneratedScript(null);
    try {
      const response = await fetch("/api/ai/analyze-call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcript,
          call_type: callType,
          recording_url: recordingUrl || undefined,
          prospect_origin: prospectOrigin || undefined,
          analysis_focus: analysisFocus,
          call_result: callResult || undefined,
        }),
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

  const handleGenerateScript = async () => {
    if (!result) return;
    setScriptLoading(true);
    try {
      const response = await fetch("/api/ai/generate-assets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "sales_script",
          scriptType: callType,
          analysisContext: {
            overall_score: result.overall_score,
            weaknesses: Object.entries(result.scores)
              .filter(([, s]) => s.score < 7)
              .map(([k, s]) => ({
                area: SCORE_LABELS[k],
                improvements: s.improvements,
              })),
            training_focus: result.training_focus,
            playbook: result.playbook,
          },
        }),
      });

      if (!response.ok) throw new Error("Erreur lors de la génération");
      const data = await response.json();
      const content = data.ai_raw_response || data;
      setGeneratedScript(
        typeof content === "string"
          ? content
          : JSON.stringify(content, null, 2),
      );
      toast.success("Script personnalisé généré !");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    } finally {
      setScriptLoading(false);
    }
  };

  if (loading) {
    return <AILoading text="Analyse approfondie de ton call de vente" />;
  }

  /* ═══════════════════════════════════════════
     Form — Input state
     ═══════════════════════════════════════════ */

  if (!result) {
    return (
      <div className="space-y-6">
        {/* Hero header */}
        <div className="text-center py-2">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-accent/20 to-accent/5 border border-accent/10 mx-auto mb-4">
            <Mic className="h-7 w-7 text-accent" />
          </div>
          <h3 className="text-lg font-bold text-text-primary mb-1">
            Analyse de call de vente
          </h3>
          <p className="text-sm text-text-secondary max-w-md mx-auto">
            Colle le transcript de ton appel et l&apos;IA analysera ta
            performance : discovery, objections, closing et plus.
          </p>
        </div>

        <Card>
          <CardContent className="pt-6 space-y-5">
            {/* Call type */}
            <div>
              <label className="text-sm font-medium text-text-primary mb-2.5 block">
                Type d&apos;appel
              </label>
              <div className="flex gap-2 flex-wrap">
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
                      "px-4 py-2 rounded-xl text-sm font-medium transition-all border",
                      callType === t.key
                        ? "bg-accent/10 text-accent border-accent/30"
                        : "bg-bg-tertiary text-text-secondary border-border-default/50 hover:text-text-primary hover:border-border-default",
                    )}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Recording URL */}
            <div>
              <label className="text-sm font-medium text-text-primary mb-2 block">
                Lien d&apos;enregistrement{" "}
                <span className="text-text-muted font-normal">(optionnel)</span>
              </label>
              <div className="relative">
                <Link2 className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
                <input
                  value={recordingUrl}
                  onChange={(e) => setRecordingUrl(e.target.value)}
                  placeholder="https://fathom.video/... ou Zoom/Loom link"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-bg-tertiary border border-border-default/50 text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent/40 text-sm transition-colors"
                />
              </div>
            </div>

            {/* Context fields row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Prospect origin */}
              <div>
                <label className="text-sm font-medium text-text-primary mb-2 block">
                  Origine du prospect
                </label>
                <div className="relative">
                  <select
                    value={prospectOrigin}
                    onChange={(e) => setProspectOrigin(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-bg-tertiary border border-border-default/50 text-text-primary text-sm focus:outline-none focus:border-accent/40 appearance-none transition-colors cursor-pointer"
                  >
                    <option value="">Sélectionner...</option>
                    {PROSPECT_ORIGINS.map((o) => (
                      <option key={o.key} value={o.key}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted pointer-events-none" />
                </div>
              </div>

              {/* Analysis focus */}
              <div>
                <label className="text-sm font-medium text-text-primary mb-2 block">
                  Focus de l&apos;analyse
                </label>
                <div className="relative">
                  <select
                    value={analysisFocus}
                    onChange={(e) => setAnalysisFocus(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-bg-tertiary border border-border-default/50 text-text-primary text-sm focus:outline-none focus:border-accent/40 appearance-none transition-colors cursor-pointer"
                  >
                    {ANALYSIS_FOCUSES.map((f) => (
                      <option key={f.key} value={f.key}>
                        {f.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted pointer-events-none" />
                </div>
              </div>

              {/* Call result */}
              <div>
                <label className="text-sm font-medium text-text-primary mb-2 block">
                  Résultat du call
                </label>
                <div className="relative">
                  <select
                    value={callResult}
                    onChange={(e) => setCallResult(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-bg-tertiary border border-border-default/50 text-text-primary text-sm focus:outline-none focus:border-accent/40 appearance-none transition-colors cursor-pointer"
                  >
                    <option value="">Sélectionner...</option>
                    {CALL_RESULTS.map((r) => (
                      <option key={r.key} value={r.key}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Transcript */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-text-primary">
                  Transcript de l&apos;appel
                </label>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-border-default/50 bg-bg-tertiary text-text-secondary hover:text-text-primary hover:border-border-default transition-all"
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
                onChange={(e) => {
                  if (e.target.value.length <= 500_000) {
                    setTranscript(e.target.value);
                  } else {
                    toast.error(
                      "Le transcript ne peut pas dépasser 500 000 caractères",
                    );
                  }
                }}
                placeholder={`Colle ici le transcript ou importe un fichier (.txt, .srt, .vtt)...\n\nVendeur : Bonjour, merci d'avoir pris le temps...\nProspect : Oui, j'ai vu votre publicité et...\n...`}
                rows={10}
                maxLength={500000}
                className="w-full px-4 py-3 rounded-xl bg-bg-tertiary border border-border-default/50 text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent/40 resize-none text-sm leading-relaxed transition-colors"
              />
              <div className="flex items-center justify-between mt-1.5">
                <p className="text-xs text-text-muted">
                  {transcript.length.toLocaleString("fr-FR")} / 500 000
                  caractères
                </p>
                <p className="text-xs text-text-muted">Minimum 50 caractères</p>
              </div>
            </div>

            <Button
              size="lg"
              onClick={handleAnalyze}
              disabled={transcript.trim().length < 50}
              className="w-full rounded-xl"
              aria-label="Analyser le call de vente"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Analyser le call
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  /* ═══════════════════════════════════════════
     Results view
     ═══════════════════════════════════════════ */

  const getScoreColor = (score: number, max: number) => {
    const pct = (score / max) * 100;
    if (pct >= 80) return "text-emerald-400";
    if (pct >= 60) return "text-yellow-400";
    return "text-red-400";
  };

  const getScoreBg = (score: number, max: number) => {
    const pct = (score / max) * 100;
    if (pct >= 80) return "bg-emerald-400/10 border-emerald-400/20";
    if (pct >= 60) return "bg-yellow-400/10 border-yellow-400/20";
    return "bg-red-400/10 border-red-400/20";
  };

  return (
    <div className="space-y-5">
      {/* Overall score — hero card */}
      <Card className="border-accent/20 bg-gradient-to-br from-accent/5 via-bg-secondary to-bg-secondary">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            {/* Score ring */}
            <ScoreRing
              score={result.overall_score}
              max={10}
              size={100}
              strokeWidth={7}
              className="shrink-0"
            />

            <div className="flex-1 text-center sm:text-left">
              <p className="text-xs text-text-muted uppercase tracking-wider mb-1">
                Score global
              </p>
              <p className="text-sm text-text-secondary leading-relaxed">
                {result.overall_verdict}
              </p>

              {/* Context badges */}
              <div className="flex flex-wrap gap-2 mt-3 justify-center sm:justify-start">
                {prospectOrigin && (
                  <Badge variant="muted" className="text-xs">
                    {PROSPECT_ORIGINS.find((o) => o.key === prospectOrigin)
                      ?.label || prospectOrigin}
                  </Badge>
                )}
                {callResult && (
                  <Badge
                    variant={
                      callResult === "close"
                        ? "default"
                        : callResult === "ghoste" || callResult === "parti"
                          ? "red"
                          : "yellow"
                    }
                    className="text-xs"
                  >
                    {CALL_RESULTS.find((r) => r.key === callResult)?.label ||
                      callResult}
                  </Badge>
                )}
                {recordingUrl && (
                  <a
                    href={recordingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-accent hover:underline"
                  >
                    <Link2 className="h-3 w-3" />
                    Enregistrement
                    <ArrowUpRight className="h-3 w-3" />
                  </a>
                )}
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setResult(null);
                setTranscript("");
                setGeneratedScript(null);
                onResultClear?.();
              }}
              className="shrink-0"
            >
              <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
              Nouveau call
            </Button>
          </div>

          {/* Score breakdown — mini rings */}
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 mt-6 pt-5 border-t border-border-default/30">
            {Object.entries(result.scores).map(([key, section]) => (
              <button
                key={key}
                onClick={() =>
                  setExpandedSection(expandedSection === key ? null : key)
                }
                className={cn(
                  "flex flex-col items-center gap-1.5 p-2 rounded-xl transition-all",
                  expandedSection === key
                    ? "bg-accent/5 ring-1 ring-accent/20"
                    : "hover:bg-bg-tertiary",
                )}
              >
                <span className="text-base">{SCORE_ICONS[key]}</span>
                <span
                  className={cn(
                    "text-lg font-bold",
                    getScoreColor(section.score, section.max),
                  )}
                >
                  {section.score}
                </span>
                <span className="text-[10px] text-text-muted leading-none">
                  {SCORE_LABELS[key]}
                </span>
                <div className="w-full h-1 bg-bg-tertiary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-accent rounded-full transition-all duration-500"
                    style={{
                      width: `${(section.score / section.max) * 100}%`,
                    }}
                  />
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Detailed scores */}
      {Object.entries(result.scores).map(([key, section]) => (
        <Card
          key={key}
          className={cn(
            "transition-all",
            expandedSection === key && "border-accent/20",
          )}
        >
          <CardHeader
            className="cursor-pointer py-3"
            onClick={() =>
              setExpandedSection(expandedSection === key ? null : key)
            }
          >
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-3">
                <span
                  className={cn(
                    "inline-flex items-center justify-center h-8 w-8 rounded-lg text-sm font-bold border",
                    getScoreBg(section.score, section.max),
                    getScoreColor(section.score, section.max),
                  )}
                >
                  {section.score}
                </span>
                <span>{SCORE_LABELS[key]}</span>
                <span className="text-xs text-text-muted font-normal">
                  /{section.max}
                </span>
              </CardTitle>
              {expandedSection === key ? (
                <ChevronUp className="h-4 w-4 text-text-muted" />
              ) : (
                <ChevronDown className="h-4 w-4 text-text-muted" />
              )}
            </div>
          </CardHeader>
          {expandedSection === key && (
            <CardContent className="pt-0 space-y-4">
              {/* Key moment */}
              <div className="p-3.5 rounded-xl bg-gradient-to-r from-accent/5 to-transparent border border-accent/10">
                <p className="text-[10px] text-accent uppercase tracking-wider font-semibold mb-1">
                  Moment clé
                </p>
                <p className="text-sm text-text-secondary italic leading-relaxed">
                  {section.key_moment}
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                {/* Strengths */}
                <div className="p-3.5 rounded-xl bg-emerald-400/5 border border-emerald-400/10">
                  <p className="text-[10px] text-emerald-400 uppercase tracking-wider font-semibold mb-2 flex items-center gap-1.5">
                    <ThumbsUp className="h-3 w-3" /> Forces
                  </p>
                  <ul className="space-y-1.5">
                    {section.strengths.map((s, i) => (
                      <li
                        key={i}
                        className="text-xs text-text-secondary flex items-start gap-2"
                      >
                        <span className="text-emerald-400 mt-0.5 shrink-0">
                          +
                        </span>
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
                {/* Improvements */}
                <div className="p-3.5 rounded-xl bg-red-400/5 border border-red-400/10">
                  <p className="text-[10px] text-red-400 uppercase tracking-wider font-semibold mb-2 flex items-center gap-1.5">
                    <ThumbsDown className="h-3 w-3" /> Améliorations
                  </p>
                  <ul className="space-y-1.5">
                    {section.improvements.map((s, i) => (
                      <li
                        key={i}
                        className="text-xs text-text-secondary flex items-start gap-2"
                      >
                        <span className="text-red-400 mt-0.5 shrink-0">-</span>
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          )}
        </Card>
      ))}

      {/* Playbook */}
      {result.playbook && result.playbook.length > 0 && (
        <Card className="border-accent/20">
          <CardHeader className="py-4">
            <CardTitle className="text-sm flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent/10">
                <BookOpen className="h-4 w-4 text-accent" />
              </div>
              Playbook — Actions concrètes
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-2.5">
            {result.playbook.map((action, i) => {
              const config =
                PRIORITY_CONFIG[action.priority] || PRIORITY_CONFIG.moyenne;
              return (
                <div
                  key={i}
                  className={cn(
                    "p-4 rounded-xl border transition-all",
                    config.bg,
                    config.border,
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5 min-w-0">
                      <CheckCircle2
                        className={cn("h-4 w-4 mt-0.5 shrink-0", config.color)}
                      />
                      <div>
                        <p className="text-sm font-medium text-text-primary">
                          {action.title}
                        </p>
                        <p className="text-xs text-text-secondary mt-1 leading-relaxed">
                          {action.description}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant={
                        action.priority === "haute"
                          ? "red"
                          : action.priority === "moyenne"
                            ? "yellow"
                            : "blue"
                      }
                      className="text-[10px] shrink-0"
                    >
                      {action.priority}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

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
              <div
                key={i}
                className="p-3 rounded-xl bg-emerald-400/5 border border-emerald-400/10"
              >
                <p className="text-xs text-accent font-medium italic">
                  &ldquo;{p.phrase}&rdquo;
                </p>
                <p className="text-xs text-text-muted mt-1.5">{p.why}</p>
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
              <div
                key={i}
                className="p-3 rounded-xl bg-bg-tertiary border border-border-default/30"
              >
                <p className="text-xs text-red-400 line-through italic">
                  &ldquo;{p.phrase}&rdquo;
                </p>
                <p className="text-xs text-accent mt-1.5 font-medium">
                  &ldquo;{p.suggestion}&rdquo;
                </p>
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
          <div className="grid md:grid-cols-3 gap-4">
            <div className="p-3.5 rounded-xl bg-emerald-400/5 border border-emerald-400/10">
              <p className="text-[10px] text-emerald-400 uppercase tracking-wider font-semibold mb-2">
                Signaux d&apos;achat
              </p>
              <div className="flex flex-wrap gap-1.5">
                {result.client_signals.buying_signals.map((s, i) => (
                  <Badge key={i} variant="default" className="text-xs">
                    {s}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="p-3.5 rounded-xl bg-red-400/5 border border-red-400/10">
              <p className="text-[10px] text-red-400 uppercase tracking-wider font-semibold mb-2">
                Signaux d&apos;alerte
              </p>
              <div className="flex flex-wrap gap-1.5">
                {result.client_signals.warning_signals.map((s, i) => (
                  <Badge key={i} variant="red" className="text-xs">
                    {s}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="p-3.5 rounded-xl bg-blue-400/5 border border-blue-400/10">
              <p className="text-[10px] text-blue-400 uppercase tracking-wider font-semibold mb-2">
                Déclencheurs émotionnels
              </p>
              <div className="flex flex-wrap gap-1.5">
                {result.client_signals.emotional_triggers.map((s, i) => (
                  <Badge key={i} variant="blue" className="text-xs">
                    {s}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Speaker Analysis */}
      {result.speaker_analysis && (
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Mic className="h-4 w-4 text-accent" />
              Analyse des speakers
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg bg-bg-tertiary p-3 text-center">
                <p className="text-xs text-text-muted">Vendeur</p>
                <p className="text-2xl font-bold text-blue-400">
                  {result.speaker_analysis.seller_talk_ratio}%
                </p>
              </div>
              <div className="rounded-lg bg-bg-tertiary p-3 text-center">
                <p className="text-xs text-text-muted">Prospect</p>
                <p className="text-2xl font-bold text-accent">
                  {result.speaker_analysis.prospect_talk_ratio}%
                </p>
              </div>
              <div className="rounded-lg bg-bg-tertiary p-3 text-center">
                <p className="text-xs text-text-muted">Interruptions</p>
                <p
                  className={cn(
                    "text-2xl font-bold",
                    result.speaker_analysis.interruptions <= 2
                      ? "text-accent"
                      : "text-yellow-400",
                  )}
                >
                  {result.speaker_analysis.interruptions}
                </p>
              </div>
            </div>
            <div
              className={cn(
                "rounded-lg p-3 border text-xs",
                result.speaker_analysis.ideal_ratio_met
                  ? "bg-accent/5 border-accent/20 text-accent"
                  : "bg-yellow-500/5 border-yellow-500/20 text-yellow-400",
              )}
            >
              {result.speaker_analysis.ideal_ratio_met
                ? "Ratio de parole idéal respecté"
                : "Ratio de parole à améliorer — le prospect devrait parler plus"}
            </div>
            <div className="text-xs text-text-secondary space-y-1">
              <p>
                <span className="text-text-muted">Gestion des silences :</span>{" "}
                {result.speaker_analysis.silence_management}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

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
            <ul className="space-y-2">
              {result.next_steps.map((s, i) => (
                <li
                  key={i}
                  className="text-xs text-text-secondary flex items-start gap-2 p-2 rounded-lg bg-bg-tertiary/50"
                >
                  <span className="text-accent shrink-0 mt-0.5">
                    {"\u2192"}
                  </span>
                  {s}
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
            <ul className="space-y-2">
              {result.training_focus.map((s, i) => (
                <li
                  key={i}
                  className="text-xs text-text-secondary flex items-start gap-2 p-2 rounded-lg bg-bg-tertiary/50"
                >
                  <span className="text-accent shrink-0 mt-0.5">
                    {"\u2022"}
                  </span>
                  {s}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Generate Script Button */}
      <Card className="border-accent/20 bg-gradient-to-r from-accent/5 via-bg-secondary to-bg-secondary">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 shrink-0">
                <FileText className="h-5 w-5 text-accent" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-text-primary">
                  Script personnalisé
                </h3>
                <p className="text-xs text-text-secondary mt-0.5">
                  Génère un script de vente adapté basé sur les faiblesses
                  identifiées dans ton analyse.
                </p>
              </div>
            </div>
            <Button
              onClick={handleGenerateScript}
              disabled={scriptLoading}
              className="shrink-0 rounded-xl"
            >
              {scriptLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4 mr-2" />
              )}
              Générer le script
            </Button>
          </div>

          {/* Generated script */}
          {generatedScript && (
            <div className="mt-5 p-5 rounded-xl bg-bg-tertiary border border-border-default/50">
              <div className="flex items-center justify-between mb-3">
                <Badge variant="default" className="text-xs">
                  Script généré
                </Badge>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(generatedScript);
                    toast.success("Script copié !");
                  }}
                  className="text-xs text-accent hover:text-accent-hover transition-colors font-medium"
                >
                  Copier
                </button>
              </div>
              <pre className="text-sm text-text-secondary whitespace-pre-wrap font-sans leading-relaxed max-h-96 overflow-y-auto">
                {generatedScript}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
