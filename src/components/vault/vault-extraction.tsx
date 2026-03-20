"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AILoading } from "@/components/shared/ai-loading";
import { useUser } from "@/hooks/use-user";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import {
  Sparkles,
  CheckCircle,
  RotateCcw,
  Upload,
  ClipboardPaste,
  MessageSquare,
  ChevronRight,
  Loader2,
  BookOpen,
  Briefcase,
  Lightbulb,
  MessageCircle,
  ArrowRight,
  Pause,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ExtractedKnowledge } from "@/lib/ai/prompts/knowledge-extraction";
import { INTERVIEW_QUESTIONS_COUNT } from "@/lib/ai/prompts/knowledge-extraction";

type Tab = "upload" | "paste" | "interview";

function ExtractionStats({ stats }: { stats: Record<string, number> }) {
  const items = [
    { label: "Frameworks", count: stats.frameworks, icon: BookOpen },
    { label: "Cas clients", count: stats.case_studies, icon: Briefcase },
    { label: "Insights uniques", count: stats.unique_insights, icon: Lightbulb },
    {
      label: "Réponses objections",
      count: stats.objection_responses,
      icon: MessageCircle,
    },
  ];
  return (
    <div className="grid grid-cols-2 gap-3">
      {items.map(({ label, count, icon: Icon }) => (
        <div
          key={label}
          className="flex items-center gap-2 p-3 rounded-lg bg-bg-tertiary"
        >
          <Icon className="h-4 w-4 text-accent shrink-0" />
          <div>
            <p className="text-lg font-bold text-text-primary">{count}</p>
            <p className="text-xs text-text-muted">{label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function ExtractionPreview({ extraction }: { extraction: ExtractedKnowledge }) {
  return (
    <div className="space-y-4 text-sm">
      {extraction.frameworks?.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
            Frameworks ({extraction.frameworks.length})
          </p>
          <ul className="space-y-1">
            {extraction.frameworks.map((f, i) => (
              <li key={i} className="text-text-secondary">
                <span className="font-medium text-text-primary">{f.name}</span>
                {f.use_case && (
                  <span className="text-text-muted"> — {f.use_case}</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
      {extraction.unique_insights?.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
            Insights uniques ({extraction.unique_insights.length})
          </p>
          <ul className="space-y-1">
            {extraction.unique_insights.slice(0, 3).map((insight, i) => (
              <li key={i} className="flex items-start gap-2 text-text-secondary">
                <span className="text-accent mt-0.5">•</span>
                {insight}
              </li>
            ))}
            {extraction.unique_insights.length > 3 && (
              <li className="text-text-muted text-xs">
                + {extraction.unique_insights.length - 3} autres...
              </li>
            )}
          </ul>
        </div>
      )}
      {extraction.case_studies?.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
            Cas clients ({extraction.case_studies.length})
          </p>
          <ul className="space-y-1">
            {extraction.case_studies.slice(0, 2).map((cs, i) => (
              <li key={i} className="text-text-secondary">
                <span className="font-medium text-text-primary">
                  {cs.client_type}
                </span>{" "}
                → {cs.result}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export function VaultExtraction() {
  const { user, loading: authLoading } = useUser();
  const [activeTab, setActiveTab] = React.useState<Tab>("interview");
  const [loading, setLoading] = React.useState(true);
  const [generating, setGenerating] = React.useState(false);

  // Existing vault data
  const [existingExtraction, setExistingExtraction] =
    React.useState<ExtractedKnowledge | null>(null);
  const [showExisting, setShowExisting] = React.useState(false);

  // Preview state (before injecting)
  const [preview, setPreview] = React.useState<ExtractedKnowledge | null>(null);
  const [previewStats, setPreviewStats] = React.useState<Record<
    string,
    number
  > | null>(null);

  // Upload tab
  const [uploadFile, setUploadFile] = React.useState<File | null>(null);

  // Paste tab
  const [pastedContent, setPastedContent] = React.useState("");
  const MAX_CHARS = 190_000;

  // Interview tab
  const [interviewState, setInterviewState] = React.useState<{
    in_progress: boolean;
    question: string | null;
    question_index: number;
    ready_to_finalize: boolean;
    answers_count: number;
  } | null>(null);
  const [currentAnswer, setCurrentAnswer] = React.useState("");
  const [interviewLoading, setInterviewLoading] = React.useState(false);

  // Load existing data + interview state
  React.useEffect(() => {
    if (authLoading) return;
    if (!user) { setLoading(false); return; }

    const supabase = createClient();

    Promise.all([
      fetch("/api/ai/knowledge-interview").then((r) => r.json()),
      supabase
        .from("profiles")
        .select("vault_extraction")
        .eq("id", user.id)
        .single(),
    ])
      .then(([interviewData, profileRes]) => {
        if (interviewData?.in_progress) {
          setInterviewState({
            in_progress: true,
            question: interviewData.question,
            question_index: interviewData.question_index ?? 0,
            ready_to_finalize: false,
            answers_count: Object.keys(
              interviewData.state?.answers ?? {},
            ).length,
          });
          setActiveTab("interview");
        }
        const vault = profileRes?.data?.vault_extraction;
        if (vault) {
          setExistingExtraction(vault as ExtractedKnowledge);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user, authLoading]);

  // --- Upload handler ---
  const handleUpload = async () => {
    if (!uploadFile) return;
    setGenerating(true);
    try {
      const text = await uploadFile.text();
      const res = await fetch("/api/integrations/claude-extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      setPreview(data.extracted);
      setPreviewStats(data.stats);
      setExistingExtraction(data.extracted);
      toast.success("Extraction terminée !");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    } finally {
      setGenerating(false);
    }
  };

  // --- Paste handler ---
  const handlePaste = async () => {
    if (!pastedContent.trim()) return;
    setGenerating(true);
    try {
      const res = await fetch("/api/integrations/claude-extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: pastedContent }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      setPreview(data.extracted);
      setPreviewStats(data.stats);
      setExistingExtraction(data.extracted);
      toast.success("Extraction terminée !");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    } finally {
      setGenerating(false);
    }
  };

  // --- Interview handlers ---
  const handleInterviewStart = async () => {
    setInterviewLoading(true);
    try {
      const res = await fetch("/api/ai/knowledge-interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "start" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      setInterviewState({
        in_progress: true,
        question: data.question,
        question_index: 0,
        ready_to_finalize: false,
        answers_count: 0,
      });
      setCurrentAnswer("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    } finally {
      setInterviewLoading(false);
    }
  };

  const handleInterviewAnswer = async () => {
    if (!currentAnswer.trim() || !interviewState) return;
    setInterviewLoading(true);
    try {
      const res = await fetch("/api/ai/knowledge-interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "answer", answer: currentAnswer }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      setCurrentAnswer("");
      setInterviewState({
        in_progress: !data.ready_to_finalize,
        question: data.question,
        question_index: data.question_index,
        ready_to_finalize: !!data.ready_to_finalize,
        answers_count: (interviewState.answers_count ?? 0) + 1,
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    } finally {
      setInterviewLoading(false);
    }
  };

  const handleInterviewPause = async () => {
    // State is already saved on each answer — just clear local state
    setInterviewState(null);
    toast.success("Interview sauvegardée. Tu peux reprendre plus tard.");
  };

  const handleInterviewFinalize = async () => {
    setGenerating(true);
    try {
      const res = await fetch("/api/ai/knowledge-interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "finalize" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      setPreview(data.extracted);
      setPreviewStats(data.stats);
      setExistingExtraction(data.extracted);
      setInterviewState(null);
      toast.success("Expertise extraite et injectée dans ton Vault !");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    } finally {
      setGenerating(false);
    }
  };

  if (loading) return <AILoading text="Chargement" />;

  if (generating) {
    return (
      <AILoading text="Extraction et structuration de ton expertise en cours" />
    );
  }

  // Show preview/result
  if (preview && previewStats) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h3 className="font-semibold text-text-primary flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-accent" />
            Expertise extraite et injectée dans ton Vault
          </h3>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setPreview(null);
              setPreviewStats(null);
              setPastedContent("");
              setUploadFile(null);
            }}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Nouvelle extraction
          </Button>
        </div>

        <ExtractionStats stats={previewStats} />
        <ExtractionPreview extraction={preview} />
      </div>
    );
  }

  const tabs = [
    { id: "interview" as Tab, label: "Interview IA", icon: MessageSquare },
    { id: "paste" as Tab, label: "Copier-coller", icon: ClipboardPaste },
    { id: "upload" as Tab, label: "Upload fichier", icon: Upload },
  ];

  return (
    <div className="space-y-5">
      {/* Existing extraction summary */}
      {existingExtraction && !showExisting && (
        <Card className="border-accent/20 bg-accent/5">
          <CardContent className="py-3 px-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-accent" />
              <span className="text-sm text-text-secondary">
                Ton Vault contient déjà une extraction. Tu peux en ajouter
                une nouvelle.
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowExisting(!showExisting)}
            >
              Voir
              <ChevronRight className="h-3 w-3 ml-1" />
            </Button>
          </CardContent>
        </Card>
      )}

      {showExisting && existingExtraction && (
        <Card>
          <CardContent className="pt-4 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-text-primary">
                Extraction actuelle dans le Vault
              </h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowExisting(false)}
              >
                Masquer
              </Button>
            </div>
            <ExtractionPreview extraction={existingExtraction} />
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-bg-tertiary rounded-lg">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all",
              activeTab === id
                ? "bg-bg-secondary text-text-primary shadow-sm"
                : "text-text-muted hover:text-text-secondary",
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      {/* Tab content */}

      {/* === Interview IA === */}
      {activeTab === "interview" && (
        <div className="space-y-4">
          {!interviewState ? (
            <Card>
              <CardContent className="pt-6 text-center space-y-4">
                <MessageSquare className="h-10 w-10 text-accent mx-auto" />
                <div>
                  <h3 className="font-semibold text-text-primary mb-1">
                    Interview IA — Extraction conversationnelle
                  </h3>
                  <p className="text-sm text-text-muted max-w-md mx-auto">
                    L&apos;IA te pose {INTERVIEW_QUESTIONS_COUNT} questions pour
                    extraire ton expertise. L&apos;interview s&apos;adapte à tes
                    réponses. Tu peux la mettre en pause et reprendre plus tard.
                  </p>
                </div>
                <Button
                  onClick={handleInterviewStart}
                  disabled={interviewLoading}
                >
                  {interviewLoading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4 mr-2" />
                  )}
                  Commencer l&apos;interview
                </Button>
              </CardContent>
            </Card>
          ) : interviewState.ready_to_finalize ? (
            <Card>
              <CardContent className="pt-6 text-center space-y-4">
                <CheckCircle className="h-10 w-10 text-accent mx-auto" />
                <div>
                  <h3 className="font-semibold text-text-primary mb-1">
                    Interview terminée !
                  </h3>
                  <p className="text-sm text-text-muted">
                    {interviewState.answers_count} réponses collectées.
                    L&apos;IA va maintenant analyser et structurer ton expertise.
                  </p>
                </div>
                <Button onClick={handleInterviewFinalize} disabled={generating}>
                  {generating ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4 mr-2" />
                  )}
                  Analyser et injecter dans mon Vault
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {/* Progress */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-text-muted whitespace-nowrap">
                  Question {(interviewState.question_index ?? 0) + 1} /{" "}
                  {INTERVIEW_QUESTIONS_COUNT}
                </span>
                <div className="flex-1 h-1.5 bg-bg-tertiary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-accent rounded-full transition-all"
                    style={{
                      width: `${(((interviewState.question_index ?? 0) + 1) / INTERVIEW_QUESTIONS_COUNT) * 100}%`,
                    }}
                  />
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleInterviewPause}
                  className="shrink-0 text-text-muted"
                >
                  <Pause className="h-3 w-3 mr-1" />
                  Pause
                </Button>
              </div>

              {/* Question */}
              <Card className="border-accent/30">
                <CardContent className="pt-5 space-y-4">
                  <div className="flex items-start gap-2">
                    <Sparkles className="h-5 w-5 text-accent mt-0.5 shrink-0" />
                    <p className="font-medium text-text-primary">
                      {interviewState.question}
                    </p>
                  </div>

                  {interviewLoading ? (
                    <div className="flex items-center gap-2 py-2">
                      <Loader2 className="h-4 w-4 animate-spin text-accent" />
                      <span className="text-sm text-text-muted">
                        Génération de la prochaine question...
                      </span>
                    </div>
                  ) : (
                    <>
                      <textarea
                        value={currentAnswer}
                        onChange={(e) => setCurrentAnswer(e.target.value)}
                        placeholder="Ta réponse..."
                        rows={4}
                        className="w-full px-4 py-3 rounded-xl bg-bg-tertiary border border-border-default text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent resize-none text-sm"
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && e.metaKey)
                            handleInterviewAnswer();
                        }}
                      />
                      <div className="flex justify-between items-center">
                        <p className="text-xs text-text-muted">
                          Cmd + Enter pour valider
                        </p>
                        <Button
                          onClick={handleInterviewAnswer}
                          disabled={!currentAnswer.trim() || interviewLoading}
                        >
                          <ArrowRight className="h-4 w-4 mr-2" />
                          Suivant
                        </Button>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      )}

      {/* === Copier-coller === */}
      {activeTab === "paste" && (
        <div className="space-y-4">
          <p className="text-sm text-text-muted">
            Colle tes conversations Claude/ChatGPT, tes notes, ou tout contenu
            qui documente ton expertise.
          </p>
          <div className="space-y-2">
            <textarea
              value={pastedContent}
              onChange={(e) => {
                if (e.target.value.length <= MAX_CHARS)
                  setPastedContent(e.target.value);
              }}
              placeholder="Colle ton contenu ici..."
              rows={12}
              className="w-full px-4 py-3 rounded-xl bg-bg-tertiary border border-border-default text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent resize-none text-sm font-mono"
            />
            <div className="flex justify-between items-center">
              <span
                className={cn(
                  "text-xs",
                  pastedContent.length > MAX_CHARS * 0.9
                    ? "text-warning"
                    : "text-text-muted",
                )}
              >
                {pastedContent.length.toLocaleString("fr-FR")} /{" "}
                {MAX_CHARS.toLocaleString("fr-FR")} caractères
              </span>
              <Button
                onClick={handlePaste}
                disabled={pastedContent.trim().length < 50 || generating}
              >
                {generating ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4 mr-2" />
                )}
                Extraire l&apos;expertise
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* === Upload === */}
      {activeTab === "upload" && (
        <div className="space-y-4">
          <p className="text-sm text-text-muted">
            Upload un fichier d&apos;export (.txt, .md, .json) contenant tes
            conversations ou notes.
          </p>
          <div
            className={cn(
              "border-2 border-dashed rounded-xl p-8 text-center transition-colors",
              uploadFile
                ? "border-accent/50 bg-accent/5"
                : "border-border-default hover:border-accent/40",
            )}
          >
            <input
              type="file"
              accept=".txt,.md,.json,.csv"
              onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)}
              className="hidden"
              id="vault-file-upload"
            />
            <label
              htmlFor="vault-file-upload"
              className="cursor-pointer flex flex-col items-center gap-3"
            >
              <Upload className="h-8 w-8 text-text-muted" />
              {uploadFile ? (
                <div>
                  <p className="text-sm font-medium text-text-primary">
                    {uploadFile.name}
                  </p>
                  <p className="text-xs text-text-muted">
                    {(uploadFile.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-sm text-text-secondary">
                    Clique pour choisir un fichier
                  </p>
                  <p className="text-xs text-text-muted">.txt, .md, .json — max 10 MB</p>
                </div>
              )}
            </label>
          </div>
          <div className="flex justify-end">
            <Button
              onClick={handleUpload}
              disabled={!uploadFile || generating}
            >
              {generating ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4 mr-2" />
              )}
              Analyser le fichier
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
