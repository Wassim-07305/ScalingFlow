"use client";

import { useState, useCallback } from "react";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/use-user";
import { toast } from "sonner";
import {
  Loader2,
  CheckCircle,
  XCircle,
  Trophy,
  RotateCcw,
  ArrowRight,
  Sparkles,
  Brain,
} from "lucide-react";

interface QuizQuestion {
  question: string;
  options: string[];
  correct_index: number;
  explanation: string;
}

interface ModuleQuizProps {
  moduleId: string;
  moduleTitle: string;
  onComplete?: (score: number, total: number, passed: boolean) => void;
}

export function ModuleQuiz({
  moduleId,
  moduleTitle,
  onComplete,
}: ModuleQuizProps) {
  const { user } = useUser();
  const supabase = createClient();

  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [started, setStarted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [score, setScore] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [saving, setSaving] = useState(false);

  const PASS_THRESHOLD = 0.7;
  const XP_PER_CORRECT = 20;

  const fetchQuestions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/ai/generate-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ moduleId, moduleTitle }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erreur lors de la génération du quiz");
      }

      const data = await res.json();
      if (!data.questions || data.questions.length === 0) {
        throw new Error("Aucune question générée");
      }

      setQuestions(data.questions);
      setStarted(true);
      setCurrentIndex(0);
      setSelectedAnswer(null);
      setConfirmed(false);
      setScore(0);
      setShowResults(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erreur inconnue";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [moduleId, moduleTitle]);

  const handleConfirm = () => {
    if (selectedAnswer === null) return;
    setConfirmed(true);
    if (selectedAnswer === questions[currentIndex].correct_index) {
      setScore((prev) => prev + 1);
    }
  };

  const handleNext = async () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedAnswer(null);
      setConfirmed(false);
    } else {
      // Quiz terminé
      const finalScore =
        selectedAnswer === questions[currentIndex].correct_index
          ? score
          : score;
      // score was already updated in handleConfirm
      await finishQuiz(score);
    }
  };

  const finishQuiz = async (finalScore: number) => {
    setShowResults(true);
    setSaving(true);

    const totalQuestions = questions.length;
    const passed = finalScore / totalQuestions >= PASS_THRESHOLD;

    try {
      // Sauvegarder le résultat dans Supabase
      if (user) {
        await supabase.from("academy_quiz_results").insert({
          user_id: user.id,
          module_id: moduleId,
          score: finalScore,
          total_questions: totalQuestions,
          passed,
        });

        // Attribuer des XP
        const xpAmount = finalScore * XP_PER_CORRECT + (passed ? 50 : 0);
        try {
          await fetch("/api/gamification/award", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              activityType: "quiz.completed",
              xpOverride: xpAmount,
              data: {
                module_id: moduleId,
                score: finalScore,
                total: totalQuestions,
                passed,
              },
            }),
          });
        } catch {
          // Non-bloquant
        }
      }

      onComplete?.(finalScore, totalQuestions, passed);
    } catch {
      toast.error("Erreur lors de la sauvegarde du résultat");
    } finally {
      setSaving(false);
    }
  };

  const handleRetry = () => {
    setQuestions([]);
    setStarted(false);
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setConfirmed(false);
    setScore(0);
    setShowResults(false);
    fetchQuestions();
  };

  // ─── État initial : bouton pour lancer ──────────────────────
  if (!started && !loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center text-center gap-4 py-4">
            <div className="h-14 w-14 rounded-2xl bg-accent/15 flex items-center justify-center">
              <Brain className="h-7 w-7 text-accent" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-text-primary mb-1">
                Quiz du module
              </h3>
              <p className="text-sm text-text-secondary max-w-sm">
                Teste tes connaissances sur &laquo;&nbsp;{moduleTitle}&nbsp;&raquo;.
                5 questions générées par l&apos;IA. Il faut 70% pour valider.
              </p>
            </div>
            <Button onClick={fetchQuestions} className="gap-2">
              <Sparkles className="h-4 w-4" />
              Lancer le quiz
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // ─── Chargement ─────────────────────────────────────────────
  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center gap-3 py-8">
            <Loader2 className="h-6 w-6 animate-spin text-accent" />
            <p className="text-sm text-text-muted">
              Génération des questions en cours...
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // ─── Écran de résultats ─────────────────────────────────────
  if (showResults) {
    const totalQuestions = questions.length;
    const percentage = Math.round((score / totalQuestions) * 100);
    const passed = percentage >= PASS_THRESHOLD * 100;
    const xpEarned = score * XP_PER_CORRECT + (passed ? 50 : 0);

    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center text-center gap-5 py-4">
            <div
              className={cn(
                "h-16 w-16 rounded-full flex items-center justify-center",
                passed ? "bg-accent/15" : "bg-red-500/15"
              )}
            >
              {passed ? (
                <Trophy className="h-8 w-8 text-accent" />
              ) : (
                <XCircle className="h-8 w-8 text-red-400" />
              )}
            </div>

            <div>
              <h3 className="text-xl font-bold text-text-primary mb-1">
                {passed ? "Bravo, quiz réussi !" : "Quiz non validé"}
              </h3>
              <p className="text-sm text-text-secondary">
                {passed
                  ? "Tu maîtrises bien ce module. Continue comme ça !"
                  : "Il faut au moins 70% pour valider. Réessaie après avoir revu le module."}
              </p>
            </div>

            <div className="flex items-center gap-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-text-primary">
                  {percentage}%
                </p>
                <p className="text-xs text-text-muted">Score</p>
              </div>
              <div className="h-10 w-px bg-border-default" />
              <div className="text-center">
                <p className="text-3xl font-bold text-text-primary">
                  {score}/{totalQuestions}
                </p>
                <p className="text-xs text-text-muted">Bonnes réponses</p>
              </div>
              <div className="h-10 w-px bg-border-default" />
              <div className="text-center">
                <p className="text-3xl font-bold text-accent">+{xpEarned}</p>
                <p className="text-xs text-text-muted">XP gagnés</p>
              </div>
            </div>

            {passed && (
              <Badge variant="cyan" className="text-sm px-3 py-1">
                Module validé
              </Badge>
            )}

            {saving && (
              <p className="text-xs text-text-muted flex items-center gap-1">
                <Loader2 className="h-3 w-3 animate-spin" />
                Sauvegarde...
              </p>
            )}

            <Button
              variant="ghost"
              onClick={handleRetry}
              className="gap-2 mt-2"
            >
              <RotateCcw className="h-4 w-4" />
              Refaire le quiz
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // ─── Question en cours ──────────────────────────────────────
  const question = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;
  const isCorrect =
    confirmed && selectedAnswer === question.correct_index;
  const isWrong =
    confirmed && selectedAnswer !== question.correct_index;

  return (
    <Card>
      <CardContent className="pt-6 space-y-5">
        {/* Barre de progression */}
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs text-text-muted font-medium">
            Question {currentIndex + 1}/{questions.length}
          </span>
          <Progress value={progress} className="h-1.5 flex-1 max-w-[200px]" />
          <Badge variant="muted" className="text-xs">
            Score : {score}
          </Badge>
        </div>

        {/* Question */}
        <h3 className="text-base font-semibold text-text-primary leading-relaxed">
          {question.question}
        </h3>

        {/* Options */}
        <div className="space-y-2.5">
          {question.options.map((option, idx) => {
            const isSelected = selectedAnswer === idx;
            const isCorrectOption = idx === question.correct_index;

            let borderClass = "border-border-default hover:border-border-hover";
            let bgClass = "bg-bg-tertiary";

            if (confirmed) {
              if (isCorrectOption) {
                borderClass = "border-accent";
                bgClass = "bg-accent/10";
              } else if (isSelected && !isCorrectOption) {
                borderClass = "border-red-500/50";
                bgClass = "bg-red-500/10";
              } else {
                borderClass = "border-border-default opacity-50";
              }
            } else if (isSelected) {
              borderClass = "border-accent";
              bgClass = "bg-accent/5";
            }

            return (
              <button
                key={idx}
                onClick={() => !confirmed && setSelectedAnswer(idx)}
                disabled={confirmed}
                className={cn(
                  "w-full text-left p-3.5 rounded-xl border transition-all flex items-center gap-3",
                  borderClass,
                  bgClass,
                  !confirmed && "cursor-pointer"
                )}
              >
                <div
                  className={cn(
                    "flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold border",
                    confirmed && isCorrectOption
                      ? "bg-accent text-white border-accent"
                      : confirmed && isSelected && !isCorrectOption
                        ? "bg-red-500 text-white border-red-500"
                        : isSelected
                          ? "bg-accent/20 text-accent border-accent"
                          : "bg-bg-secondary text-text-muted border-border-default"
                  )}
                >
                  {confirmed && isCorrectOption ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : confirmed && isSelected && !isCorrectOption ? (
                    <XCircle className="h-4 w-4" />
                  ) : (
                    String.fromCharCode(65 + idx)
                  )}
                </div>
                <span
                  className={cn(
                    "text-sm",
                    confirmed && isCorrectOption
                      ? "text-accent font-medium"
                      : confirmed && isSelected && !isCorrectOption
                        ? "text-red-400"
                        : "text-text-primary"
                  )}
                >
                  {option}
                </span>
              </button>
            );
          })}
        </div>

        {/* Explication */}
        {confirmed && (
          <div
            className={cn(
              "p-3.5 rounded-xl border text-sm",
              isCorrect
                ? "bg-accent/5 border-accent/30 text-accent"
                : "bg-red-500/5 border-red-500/30 text-red-400"
            )}
          >
            <p className="font-medium mb-1">
              {isCorrect ? "Bonne réponse !" : "Mauvaise réponse"}
            </p>
            <p className="text-text-secondary text-xs leading-relaxed">
              {question.explanation}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-1">
          {!confirmed ? (
            <Button
              onClick={handleConfirm}
              disabled={selectedAnswer === null}
              className="gap-2"
            >
              Valider
              <CheckCircle className="h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={handleNext} className="gap-2">
              {currentIndex < questions.length - 1
                ? "Question suivante"
                : "Voir les résultats"}
              <ArrowRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
