"use client";

import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { OnboardingState } from "@/stores/onboarding-store";

const QUESTIONS = [
  { key: "q1", label: "Quel est ton plus grand accomplissement professionnel ?" },
  { key: "q2", label: "Quelle est ta méthode ou process unique ?" },
  { key: "q3", label: "Quel résultat concret as-tu obtenu pour un client ?" },
  { key: "q4", label: "Quel problème résous-tu mieux que quiconque ?" },
  { key: "q5", label: "Qu'est-ce que tes clients disent de toi ?" },
  { key: "q6", label: "Quel est ton 'unfair advantage' ?" },
];

interface StepProps {
  store: OnboardingState;
}

export function StepExpertise({ store }: StepProps) {
  const updateAnswer = (key: string, value: string) => {
    store.setField("expertiseAnswers", {
      ...store.expertiseAnswers,
      [key]: value,
    });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-xl font-bold text-text-primary">
          Ton expertise unique
        </h2>
        <p className="text-text-secondary text-sm">
          Ces réponses permettront à l&apos;IA de créer du contenu ultra-personnalisé.
          Réponds avec le plus de détails possible.
        </p>
      </div>

      <div className="space-y-5">
        {QUESTIONS.map((q, index) => (
          <div key={q.key} className="space-y-2">
            <Label className="text-text-primary">
              <span className="text-accent font-bold mr-1.5">{index + 1}.</span>
              {q.label}
            </Label>
            <Textarea
              value={store.expertiseAnswers[q.key] || ""}
              onChange={(e) => updateAnswer(q.key, e.target.value)}
              placeholder="Décris en quelques phrases..."
              rows={3}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
