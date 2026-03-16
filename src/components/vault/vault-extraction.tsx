"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AILoading } from "@/components/shared/ai-loading";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/use-user";
import { toast } from "sonner";
import {
  Sparkles,
  Send,
  CheckCircle,
  RotateCcw,
  RefreshCw,
  Key,
  Eye,
  EyeOff,
  Loader2 as Loader2Icon,
} from "lucide-react";

const EXTRACTION_QUESTIONS = [
  "Quel est le problème principal que tu résous pour tes clients ? Donne un exemple concret.",
  "Quelle est ta méthodologie ou ton process unique pour obtenir des résultats ?",
  "Quel est le résultat le plus impressionnant que tu as obtenu pour un client ?",
  "Qu'est-ce qui te différencie de tes concurrents directs ?",
  "Quelle erreur tes clients font-ils souvent avant de travailler avec toi ?",
  "Si tu devais résumer ton expertise en une phrase, ce serait quoi ?",
  "Quel est le moment 'déclic' que tes clients vivent en travaillant avec toi ?",
  "Quels outils ou frameworks utilises-tu que d'autres n'utilisent pas ?",
  "Quel est ton parcours qui te rend légitime dans ton domaine ?",
  "Si un prospect hésitait, quel argument le convaincrait à coup sûr ?",
];

interface ExtractionAnswer {
  question: string;
  answer: string;
}

export function VaultExtraction() {
  const { user } = useUser();
  const [currentStep, setCurrentStep] = React.useState(0);
  const [answers, setAnswers] = React.useState<ExtractionAnswer[]>([]);
  const [currentAnswer, setCurrentAnswer] = React.useState("");
  const [generating, setGenerating] = React.useState(false);
  const [extractionResult, setExtractionResult] = React.useState<string | null>(
    null,
  );
  const [existingExtraction, setExistingExtraction] = React.useState<
    string | null
  >(null);
  const [loading, setLoading] = React.useState(true);
  const [updating, setUpdating] = React.useState(false);

  // Clé API Claude
  const [apiKey, setApiKey] = React.useState("");
  const [showApiKey, setShowApiKey] = React.useState(false);
  const [savingKey, setSavingKey] = React.useState(false);
  const [apiKeyLoaded, setApiKeyLoaded] = React.useState(false);

  React.useEffect(() => {
    if (!user) return;
    const fetchExisting = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("profiles")
        .select("vault_extraction, claude_api_key")
        .eq("id", user.id)
        .single();
      if (data?.vault_extraction) {
        setExistingExtraction(
          typeof data.vault_extraction === "string"
            ? data.vault_extraction
            : JSON.stringify(data.vault_extraction, null, 2),
        );
      }
      if (data?.claude_api_key) {
        setApiKey(data.claude_api_key);
      }
      setApiKeyLoaded(true);
      setLoading(false);
    };
    fetchExisting();
  }, [user]);

  const handleSaveApiKey = async () => {
    if (!user) return;
    setSavingKey(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("profiles")
        .update({ claude_api_key: apiKey.trim() || null })
        .eq("id", user.id);
      if (error) throw error;
      toast.success("Clé API sauvegardée !");
    } catch {
      toast.error("Erreur lors de la sauvegarde de la clé API");
    } finally {
      setSavingKey(false);
    }
  };

  const handleUpdate = async () => {
    if (!user) return;
    setUpdating(true);
    try {
      const response = await fetch("/api/ai/vault-extraction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ update: true }),
      });

      if (!response.ok) throw new Error("Erreur lors de la mise à jour");
      const data = await response.json();
      const result =
        typeof data.extraction === "string"
          ? data.extraction
          : JSON.stringify(data.extraction, null, 2);
      setExistingExtraction(result);
      setExtractionResult(result);

      // Update vault_updated_at
      const supabase = createClient();
      await supabase
        .from("profiles")
        .update({ vault_updated_at: new Date().toISOString() })
        .eq("id", user.id);

      toast.success("Extraction mise à jour avec les dernières données !");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    } finally {
      setUpdating(false);
    }
  };

  const handleSubmitAnswer = () => {
    if (!currentAnswer.trim()) return;

    const newAnswers = [
      ...answers,
      { question: EXTRACTION_QUESTIONS[currentStep], answer: currentAnswer },
    ];
    setAnswers(newAnswers);
    setCurrentAnswer("");

    if (currentStep < EXTRACTION_QUESTIONS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleGenerateExtraction(newAnswers);
    }
  };

  const handleGenerateExtraction = async (finalAnswers: ExtractionAnswer[]) => {
    setGenerating(true);
    try {
      const response = await fetch("/api/ai/vault-extraction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: finalAnswers }),
      });

      if (!response.ok) throw new Error("Erreur lors de la génération");
      const data = await response.json();
      const result =
        typeof data.extraction === "string"
          ? data.extraction
          : JSON.stringify(data.extraction, null, 2);
      setExtractionResult(result);
      setExistingExtraction(result);
      toast.success("Extraction d'expertise terminée !");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    } finally {
      setGenerating(false);
    }
  };

  const handleRestart = () => {
    setCurrentStep(0);
    setAnswers([]);
    setCurrentAnswer("");
    setExtractionResult(null);
  };

  if (loading) return <AILoading text="Chargement" />;

  if (generating) {
    return (
      <AILoading text="Analyse de tes réponses et création du document d'expertise" />
    );
  }

  // Show existing extraction if available and not in questionnaire mode
  if (existingExtraction && answers.length === 0 && !extractionResult) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h3 className="font-semibold text-text-primary flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-accent" />
            Extraction d&apos;expertise complétée
          </h3>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={handleUpdate}
              disabled={updating}
            >
              {updating ? (
                <Loader2Icon className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Mettre à jour
            </Button>
            <Button variant="outline" onClick={handleRestart}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Refaire l&apos;extraction
            </Button>
          </div>
        </div>
        <Card>
          <CardContent className="pt-6">
            <pre className="text-sm text-text-secondary whitespace-pre-wrap font-sans">
              {existingExtraction}
            </pre>
          </CardContent>
        </Card>

        {/* Section clé API Claude */}
        {apiKeyLoaded && (
          <Card>
            <CardContent className="pt-6 space-y-3">
              <div className="flex items-center gap-2">
                <Key className="h-4 w-4 text-accent" />
                <h4 className="text-sm font-semibold text-text-primary">
                  Clé API Claude personnelle
                </h4>
              </div>
              <p className="text-xs text-text-muted">
                Ta clé est utilisée uniquement pour l&apos;extraction de
                mémoire. Elle est stockée de manière sécurisée.
              </p>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    type={showApiKey ? "text" : "password"}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="sk-ant-..."
                    className="w-full px-3 py-2 pr-10 rounded-lg bg-bg-tertiary border border-border-default text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-bg-secondary transition-colors"
                  >
                    {showApiKey ? (
                      <EyeOff className="h-4 w-4 text-text-muted" />
                    ) : (
                      <Eye className="h-4 w-4 text-text-muted" />
                    )}
                  </button>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSaveApiKey}
                  disabled={savingKey}
                >
                  {savingKey ? (
                    <Loader2Icon className="h-4 w-4 animate-spin" />
                  ) : (
                    "Sauvegarder"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  // Show result
  if (extractionResult) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-text-primary flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-accent" />
            Extraction terminée
          </h3>
          <Button variant="outline" onClick={handleRestart}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Recommencer
          </Button>
        </div>
        <Card>
          <CardContent className="pt-6">
            <pre className="text-sm text-text-secondary whitespace-pre-wrap font-sans">
              {extractionResult}
            </pre>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Questionnaire flow
  return (
    <div className="space-y-6">
      {/* Progress */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-text-muted">
          Question {currentStep + 1} / {EXTRACTION_QUESTIONS.length}
        </span>
        <div className="flex-1 h-1.5 bg-bg-tertiary rounded-full overflow-hidden">
          <div
            className="h-full bg-accent rounded-full transition-all"
            style={{
              width: `${(currentStep / EXTRACTION_QUESTIONS.length) * 100}%`,
            }}
          />
        </div>
      </div>

      {/* Previous answers */}
      {answers.map((a, i) => (
        <div key={i} className="space-y-2">
          <div className="flex items-start gap-2">
            <Sparkles className="h-4 w-4 text-accent mt-0.5 shrink-0" />
            <p className="text-sm font-medium text-text-primary">
              {a.question}
            </p>
          </div>
          <div className="ml-6 p-3 rounded-lg bg-bg-tertiary">
            <p className="text-sm text-text-secondary">{a.answer}</p>
          </div>
        </div>
      ))}

      {/* Current question */}
      <Card className="border-accent/30">
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-start gap-2">
            <Sparkles className="h-5 w-5 text-accent mt-0.5 shrink-0" />
            <p className="font-medium text-text-primary">
              {EXTRACTION_QUESTIONS[currentStep]}
            </p>
          </div>

          <textarea
            value={currentAnswer}
            onChange={(e) => setCurrentAnswer(e.target.value)}
            placeholder="Ta réponse..."
            rows={4}
            className="w-full px-4 py-3 rounded-xl bg-bg-tertiary border border-border-default text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent resize-none text-sm"
            onKeyDown={(e) => {
              if (e.key === "Enter" && e.metaKey) handleSubmitAnswer();
            }}
          />

          <div className="flex justify-between items-center">
            <p className="text-xs text-text-muted">Cmd + Enter pour valider</p>
            <Button
              onClick={handleSubmitAnswer}
              disabled={!currentAnswer.trim()}
            >
              <Send className="h-4 w-4 mr-2" />
              {currentStep < EXTRACTION_QUESTIONS.length - 1
                ? "Suivant"
                : "Terminer"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
