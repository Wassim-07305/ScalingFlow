"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AILoading } from "@/components/shared/ai-loading";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/use-user";
import { toast } from "sonner";
import { Sparkles, Send, CheckCircle, RotateCcw } from "lucide-react";

const EXTRACTION_QUESTIONS = [
  "Quel est le probleme principal que tu resous pour tes clients ? Donne un exemple concret.",
  "Quelle est ta methodologie ou ton process unique pour obtenir des resultats ?",
  "Quel est le resultat le plus impressionnant que tu as obtenu pour un client ?",
  "Qu'est-ce qui te differencie de tes concurrents directs ?",
  "Quelle erreur tes clients font-ils souvent avant de travailler avec toi ?",
  "Si tu devais resumer ton expertise en une phrase, ce serait quoi ?",
  "Quel est le moment 'declic' que tes clients vivent en travaillant avec toi ?",
  "Quels outils ou frameworks utilises-tu que d'autres n'utilisent pas ?",
  "Quel est ton parcours qui te rend legitime dans ton domaine ?",
  "Si un prospect hesitait, quel argument le convaincrait a coup sur ?",
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
  const [extractionResult, setExtractionResult] = React.useState<string | null>(null);
  const [existingExtraction, setExistingExtraction] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!user) return;
    const fetchExisting = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("profiles")
        .select("vault_extraction")
        .eq("id", user.id)
        .single();
      if (data?.vault_extraction) {
        setExistingExtraction(
          typeof data.vault_extraction === "string"
            ? data.vault_extraction
            : JSON.stringify(data.vault_extraction, null, 2)
        );
      }
      setLoading(false);
    };
    fetchExisting();
  }, [user]);

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

      if (!response.ok) throw new Error("Erreur lors de la generation");
      const data = await response.json();
      const result = typeof data.extraction === "string"
        ? data.extraction
        : JSON.stringify(data.extraction, null, 2);
      setExtractionResult(result);
      setExistingExtraction(result);
      toast.success("Extraction d'expertise terminee !");
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
    return <AILoading text="Analyse de tes reponses et creation du document d'expertise" />;
  }

  // Show existing extraction if available and not in questionnaire mode
  if (existingExtraction && answers.length === 0 && !extractionResult) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-text-primary flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-accent" />
            Extraction d&apos;expertise completee
          </h3>
          <Button variant="outline" onClick={handleRestart}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Refaire l&apos;extraction
          </Button>
        </div>
        <Card>
          <CardContent className="pt-6">
            <pre className="text-sm text-text-secondary whitespace-pre-wrap font-sans">
              {existingExtraction}
            </pre>
          </CardContent>
        </Card>
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
            Extraction terminee
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
              width: `${((currentStep + answers.length) / EXTRACTION_QUESTIONS.length) * 100}%`,
            }}
          />
        </div>
      </div>

      {/* Previous answers */}
      {answers.map((a, i) => (
        <div key={i} className="space-y-2">
          <div className="flex items-start gap-2">
            <Sparkles className="h-4 w-4 text-accent mt-0.5 shrink-0" />
            <p className="text-sm font-medium text-text-primary">{a.question}</p>
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
            placeholder="Ta reponse..."
            rows={4}
            className="w-full px-4 py-3 rounded-xl bg-bg-tertiary border border-border-default text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent resize-none text-sm"
            onKeyDown={(e) => {
              if (e.key === "Enter" && e.metaKey) handleSubmitAnswer();
            }}
          />

          <div className="flex justify-between items-center">
            <p className="text-xs text-text-muted">Cmd + Enter pour valider</p>
            <Button onClick={handleSubmitAnswer} disabled={!currentAnswer.trim()}>
              <Send className="h-4 w-4 mr-2" />
              {currentStep < EXTRACTION_QUESTIONS.length - 1 ? "Suivant" : "Terminer"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
