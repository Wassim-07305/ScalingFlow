# Onboarding Redesign — Style Rivia

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Refondre l'onboarding ScalingFlow pour qu'il soit full-screen, immersif, 1 question par ecran, avec le style visuel de Rivia (animations, auto-advance, background anime) tout en gardant exactement les memes questions/donnees.

**Architecture:** Nouveau route group `(onboarding)` sans sidebar. Composant unique `OnboardingFlow` avec tableau de questions data-driven. Progressive save vers Supabase a chaque step. Reprise au step sauvegarde si l'utilisateur quitte et revient.

**Tech Stack:** Next.js 16 App Router, Framer Motion, canvas-confetti, Supabase, Tailwind CSS 4, Lucide React

---

## Contexte

### Ce qui change

- L'onboarding sort du layout `(dashboard)` — plus de sidebar, ecran complet
- 1 question par ecran (au lieu de multi-champs par step)
- Background anime avec blobs emeraude (a la Rivia, mais couleurs ScalingFlow)
- Auto-advance sur les chips single-select (400ms)
- Animations directionnelles (avant/arriere, axe Y)
- Progressive save vers Supabase a chaque navigation
- Reprise au step sauvegarde apres reload/retour
- Barre de progression animee en haut
- Navigation clavier (Entree pour avancer)
- Confetti a la completion

### Ce qui ne change PAS

- Les questions et donnees collectees (meme `OnboardingFormData`)
- L'analyse de marche IA a la fin (appel `/api/ai/analyze-market`)
- La selection de marche et sauvegarde dans `profiles`
- Le middleware de redirection (deja en place)

### Couleurs Rivia → ScalingFlow

| Rivia                                      | ScalingFlow                                                 |
| ------------------------------------------ | ----------------------------------------------------------- |
| `from-slate-950 via-blue-950 to-slate-900` | `from-[#050807] via-[#0a1a12] to-[#0B0E11]`                 |
| `border-blue-400 bg-blue-500/20`           | `border-emerald-400 bg-emerald-500/20`                      |
| `text-blue-400`                            | `text-emerald-400`                                          |
| blob `bg-blue-500/10`                      | blob `bg-emerald-500/10`                                    |
| blob `bg-indigo-500/10`                    | blob `bg-teal-500/10`                                       |
| blob `bg-purple-500/10`                    | blob `bg-cyan-500/10`                                       |
| confetti bleu/indigo/violet                | confetti `['#34D399','#10B981','#059669','#6EE7B7','#fff']` |

---

## Ecrans (22 total)

| #   | ID               | Type            | Titre                                           | Champ DB               |
| --- | ---------------- | --------------- | ----------------------------------------------- | ---------------------- |
| 0   | welcome          | welcome         | "Bienvenue sur ScalingFlow"                     | —                      |
| 1   | firstName        | text            | "Comment tu t'appelles ?"                       | `first_name`           |
| 2   | lastName         | text            | "Et ton nom de famille ?"                       | `last_name`            |
| 3   | country          | chips           | "Tu es base ou ?"                               | `country`              |
| 4   | language         | chips           | "Quelle est ta langue principale ?"             | `language`             |
| 5   | situation        | chips           | "Quelle est ta situation actuelle ?"            | `situation`            |
| 6   | situationDetails | multi-field     | "Dis-nous en plus..."                           | `situation_details`    |
| 7   | vaultSkills      | skill-matrix    | "Evalue tes competences"                        | `vault_skills`         |
| 8   | expertise_1      | textarea        | "Ton plus grand accomplissement pro ?"          | `expertise_answers.q1` |
| 9   | expertise_2      | textarea        | "Ta methode ou process unique ?"                | `expertise_answers.q2` |
| 10  | expertise_3      | textarea        | "Quel resultat concret pour un client ?"        | `expertise_answers.q3` |
| 11  | expertise_4      | textarea        | "Quel probleme resous-tu mieux que quiconque ?" | `expertise_answers.q4` |
| 12  | expertise_5      | textarea        | "Qu'est-ce que tes clients disent de toi ?"     | `expertise_answers.q5` |
| 13  | expertise_6      | textarea        | "Ton 'unfair advantage' ?"                      | `expertise_answers.q6` |
| 14  | parcours         | chips           | "Quel parcours te correspond ?"                 | `parcours`             |
| 15  | experienceLevel  | chips           | "Ton niveau d'experience ?"                     | `experience_level`     |
| 16  | currentRevenue   | text-euro       | "Ton revenu mensuel actuel ?"                   | `current_revenue`      |
| 17  | targetRevenue    | text-euro       | "Ton objectif de revenu mensuel ?"              | `target_revenue`       |
| 18  | industries       | chips-multi     | "Dans quelles industries as-tu travaille ?"     | `industries`           |
| 19  | objectives       | chips-multi     | "Tes objectifs principaux ?"                    | `objectives`           |
| 20  | budgetMonthly    | chips           | "Ton budget pub mensuel ?"                      | `budget_monthly`       |
| 21  | summary          | summary         | "Resume de ton profil"                          | —                      |
| 22  | marketAnalysis   | market-analysis | "Analyse de ton marche"                         | —                      |

> Note : le step `situationDetails` (6) n'apparait que si `situation` n'est pas vide. Le step `resources/formations` est retire car peu utilise — il peut etre ajoute plus tard dans les parametres.

---

## Task 1 : Installer canvas-confetti

**Files:**

- Modify: `package.json`

**Step 1: Installer la dependance**

```bash
npm install canvas-confetti
npm install -D @types/canvas-confetti
```

**Step 2: Verifier l'installation**

```bash
node -e "require('canvas-confetti')"
```

Expected: pas d'erreur.

**Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add canvas-confetti for onboarding completion"
```

---

## Task 2 : Creer le route group (onboarding)

**Files:**

- Create: `src/app/(onboarding)/layout.tsx`
- Create: `src/app/(onboarding)/onboarding/page.tsx`
- Delete: `src/app/(dashboard)/onboarding/page.tsx`

**Step 1: Creer le layout (onboarding)**

```tsx
// src/app/(onboarding)/layout.tsx
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Si onboarding deja fait, redirect vers dashboard
  const { data: profile } = await supabase
    .from("profiles")
    .select("onboarding_completed")
    .eq("id", user.id)
    .single();

  if (profile?.onboarding_completed) {
    redirect("/");
  }

  return <>{children}</>;
}
```

**Step 2: Creer la page onboarding**

```tsx
// src/app/(onboarding)/onboarding/page.tsx
import { OnboardingFlow } from "@/components/onboarding/onboarding-flow";

export default function OnboardingPage() {
  return <OnboardingFlow />;
}
```

**Step 3: Supprimer l'ancienne page**

```bash
rm src/app/\(dashboard\)/onboarding/page.tsx
```

**Step 4: Verifier que le build passe (sans OnboardingFlow encore)**

Creer un fichier placeholder `src/components/onboarding/onboarding-flow.tsx` :

```tsx
"use client";

export function OnboardingFlow() {
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      Onboarding Flow (en construction)
    </div>
  );
}
```

```bash
npm run build
```

Expected: build OK.

**Step 5: Commit**

```bash
git add -A
git commit -m "feat: create (onboarding) route group with dedicated layout"
```

---

## Task 3 : Composants UI reutilisables

**Files:**

- Create: `src/components/onboarding/animated-background.tsx`
- Create: `src/components/onboarding/onboarding-progress-bar.tsx`
- Create: `src/components/onboarding/onboarding-top-bar.tsx`
- Create: `src/components/onboarding/chip-selector.tsx`
- Create: `src/components/onboarding/multi-chip-selector.tsx`

### 3a — AnimatedBackground

Inspirer directement du composant Rivia (`/Users/wassim/Projets/Rivia/src/pages/OnboardingPage.tsx` lignes 270-284). 3 blobs animes en emeraude/teal/cyan, fond gradient sombre.

```tsx
// src/components/onboarding/animated-background.tsx
"use client";

export function AnimatedBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {/* Blob 1 — emeraude */}
      <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl animate-pulse" />
      {/* Blob 2 — teal (decale) */}
      <div
        className="absolute -right-32 top-1/3 h-80 w-80 rounded-full bg-teal-500/10 blur-3xl"
        style={{ animation: "pulse 4s ease-in-out infinite 1s" }}
      />
      {/* Blob 3 — cyan (bas) */}
      <div
        className="absolute -bottom-32 left-1/3 h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl"
        style={{ animation: "pulse 5s ease-in-out infinite 2s" }}
      />
    </div>
  );
}
```

### 3b — OnboardingProgressBar

Barre fixe en haut de l'ecran, largeur animee.

```tsx
// src/components/onboarding/onboarding-progress-bar.tsx
"use client";

import { motion } from "framer-motion";

interface OnboardingProgressBarProps {
  step: number;
  total: number;
}

export function OnboardingProgressBar({
  step,
  total,
}: OnboardingProgressBarProps) {
  const progress = total > 0 ? ((step + 1) / total) * 100 : 0;

  return (
    <div className="fixed left-0 right-0 top-0 z-50 h-1 bg-white/10">
      <motion.div
        className="h-full bg-gradient-to-r from-emerald-500 to-teal-500"
        initial={{ width: 0 }}
        animate={{ width: `${progress}%` }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      />
    </div>
  );
}
```

### 3c — OnboardingTopBar

Back, Logo, Step counter.

```tsx
// src/components/onboarding/onboarding-top-bar.tsx
"use client";

import Image from "next/image";
import { ArrowLeft } from "lucide-react";

interface OnboardingTopBarProps {
  onBack: () => void;
  step: number;
  total: number;
  isFirst: boolean;
}

export function OnboardingTopBar({
  onBack,
  step,
  total,
  isFirst,
}: OnboardingTopBarProps) {
  return (
    <div className="relative z-10 flex items-center justify-between px-6 py-4">
      {/* Back */}
      <button
        onClick={onBack}
        disabled={isFirst}
        className={`rounded-full p-2 transition-all ${
          isFirst
            ? "opacity-0 pointer-events-none"
            : "text-white/50 hover:text-white hover:bg-white/10"
        }`}
      >
        <ArrowLeft className="h-5 w-5" />
      </button>

      {/* Logo */}
      <div className="flex items-center gap-2">
        <Image
          src="/icons/icon-192.png"
          alt="Logo"
          width={24}
          height={24}
          className="rounded"
        />
        <span className="text-sm font-semibold text-white/70">ScalingFlow</span>
      </div>

      {/* Step counter */}
      <span className="text-sm tabular-nums text-white/30">
        {step + 1}/{total}
      </span>
    </div>
  );
}
```

### 3d — ChipSelector (single-select, auto-advance)

Inspire de Rivia lignes 287-367. Auto-advance apres 400ms. Bouton "Autre" optionnel.

```tsx
// src/components/onboarding/chip-selector.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils/cn";

interface ChipOption {
  value: string;
  label: string;
  desc?: string;
}

interface ChipSelectorProps {
  options: ChipOption[];
  value: string;
  onChange: (value: string) => void;
  onAutoAdvance?: () => void;
  hasOther?: boolean;
  otherPlaceholder?: string;
  columns?: 1 | 2 | 3;
}

export function ChipSelector({
  options,
  value,
  onChange,
  onAutoAdvance,
  hasOther = false,
  otherPlaceholder = "Preciser...",
  columns = 1,
}: ChipSelectorProps) {
  const [showOther, setShowOther] = useState(false);
  const otherRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (showOther) otherRef.current?.focus();
  }, [showOther]);

  const handleSelect = (val: string) => {
    onChange(val);
    setShowOther(false);
    if (onAutoAdvance) {
      setTimeout(onAutoAdvance, 400);
    }
  };

  const gridClass =
    columns === 3
      ? "grid-cols-1 sm:grid-cols-3"
      : columns === 2
        ? "grid-cols-1 sm:grid-cols-2"
        : "grid-cols-1";

  return (
    <div className="space-y-3">
      <div className={cn("grid gap-3", gridClass)}>
        {options.map((opt) => (
          <button
            key={opt.value}
            onClick={() => handleSelect(opt.value)}
            className={cn(
              "rounded-xl border-2 px-5 py-4 text-left transition-all duration-200",
              value === opt.value
                ? "border-emerald-400 bg-emerald-500/20 text-white scale-[1.02] shadow-lg shadow-emerald-500/10"
                : "border-white/10 bg-white/5 text-white/70 hover:border-white/30 hover:bg-white/10",
            )}
          >
            <span className="text-base font-medium">{opt.label}</span>
            {opt.desc && (
              <p className="mt-1 text-sm text-white/40">{opt.desc}</p>
            )}
          </button>
        ))}

        {hasOther && (
          <button
            onClick={() => {
              setShowOther(true);
              onChange("");
            }}
            className={cn(
              "rounded-xl border-2 border-dashed px-5 py-4 text-left transition-all duration-200",
              showOther
                ? "border-emerald-400 bg-emerald-500/10"
                : "border-white/10 text-white/40 hover:border-white/30",
            )}
          >
            Autre
          </button>
        )}
      </div>

      {showOther && (
        <input
          ref={otherRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && value.trim() && onAutoAdvance) {
              onAutoAdvance();
            }
          }}
          placeholder={otherPlaceholder}
          className="w-full border-b-2 border-white/20 bg-transparent pb-3 text-xl font-medium text-white outline-none placeholder:text-white/25 focus:border-emerald-400"
        />
      )}
    </div>
  );
}
```

### 3e — MultiChipSelector (multi-select, pas d'auto-advance)

```tsx
// src/components/onboarding/multi-chip-selector.tsx
"use client";

import { cn } from "@/lib/utils/cn";

interface MultiChipOption {
  value: string;
  label: string;
}

interface MultiChipSelectorProps {
  options: MultiChipOption[];
  value: string[];
  onChange: (value: string[]) => void;
}

export function MultiChipSelector({
  options,
  value,
  onChange,
}: MultiChipSelectorProps) {
  const toggle = (val: string) => {
    if (value.includes(val)) {
      onChange(value.filter((v) => v !== val));
    } else {
      onChange([...value, val]);
    }
  };

  return (
    <div className="flex flex-wrap gap-3">
      {options.map((opt) => {
        const selected = value.includes(opt.value);
        return (
          <button
            key={opt.value}
            onClick={() => toggle(opt.value)}
            className={cn(
              "rounded-full border-2 px-5 py-2.5 text-sm font-medium transition-all duration-200",
              selected
                ? "border-emerald-400 bg-emerald-500/20 text-white shadow-lg shadow-emerald-500/10"
                : "border-white/10 bg-white/5 text-white/70 hover:border-white/30",
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
```

**Commit:**

```bash
git add src/components/onboarding/animated-background.tsx \
        src/components/onboarding/onboarding-progress-bar.tsx \
        src/components/onboarding/onboarding-top-bar.tsx \
        src/components/onboarding/chip-selector.tsx \
        src/components/onboarding/multi-chip-selector.tsx
git commit -m "feat: add Rivia-style onboarding UI components"
```

---

## Task 4 : Skill Matrix component

**Files:**

- Create: `src/components/onboarding/onboarding-skill-matrix.tsx`

Meme logique que `step-skills-vault.tsx` mais style Rivia : fond sombre, accents emeraude, border white/10.

Les 6 categories avec icones :

- Marketing Digital (Megaphone)
- Vente & Closing (HandCoins)
- Copywriting (PenTool)
- Tech & Automatisation (Cpu)
- Design & Creatif (Palette)
- Business & Strategie (BarChart3)

3 niveaux : Debutant / Intermediaire / Avance — toggle on/off.

Props: `value: VaultSkillCategory[]`, `onChange: (skills: VaultSkillCategory[]) => void`

**Commit:**

```bash
git add src/components/onboarding/onboarding-skill-matrix.tsx
git commit -m "feat: add skill matrix component for onboarding"
```

---

## Task 5 : Summary View component

**Files:**

- Create: `src/components/onboarding/onboarding-summary.tsx`

Affiche toutes les reponses regroupees par section dans des cards `rounded-2xl border border-white/10 bg-white/5 p-5` :

**Sections :**

1. **Identite** — Prenom, Nom, Pays, Langue
2. **Situation** — Type + details conditionnels
3. **Competences** — Les 6 categories avec leur niveau
4. **Expertise** — Les 6 reponses (tronquees si longues)
5. **Parcours** — Le parcours selectionne (A1/A2/A3/B/C)
6. **Chiffres** — Experience, Revenu actuel, Objectif, Budget
7. **Objectifs** — Industries, Objectifs

Headers en `text-emerald-400 text-xs font-medium uppercase tracking-wider`.

**Commit:**

```bash
git add src/components/onboarding/onboarding-summary.tsx
git commit -m "feat: add summary review component for onboarding"
```

---

## Task 6 : Questions configuration

**Files:**

- Create: `src/components/onboarding/questions.ts`

Fichier data-driven definissant les 22 ecrans. Chaque question suit cette interface :

```typescript
import type { LucideIcon } from "lucide-react";

export type QuestionType =
  | "welcome"
  | "text"
  | "text-euro"
  | "textarea"
  | "chips"
  | "chips-multi"
  | "multi-field"
  | "skill-matrix"
  | "summary"
  | "market-analysis";

export interface ChipOption {
  value: string;
  label: string;
  desc?: string;
}

export interface Question {
  id: string;
  type: QuestionType;
  title: string;
  subtitle?: string;
  field?: string;
  placeholder?: string;
  chips?: ChipOption[];
  hasOther?: boolean;
  chipColumns?: 1 | 2 | 3;
  showWhen?: (data: Record<string, unknown>) => boolean;
}
```

Toutes les constantes de `onboarding-wizard.tsx` (SKILLS, EXPERIENCE_LEVELS, INDUSTRIES, BUDGETS, pays, langues, situations, parcours, objectifs) sont deplacees ici en tant que chips des questions correspondantes.

Le step `situationDetails` (6) a un `showWhen` conditionnel :

```typescript
showWhen: (data) => data.situation !== "" && data.situation !== undefined;
```

Les champs conditionnels de `situationDetails` dependent de la `situation` selectionnee :

- `zero` → textarea "biggest_challenge"
- `salarie` → text "poste" + text "secteur"
- `freelance` → textarea "missions" + textarea "biggest_challenge"
- `entrepreneur` → number "ca_actuel" + number "clients_count" + textarea "biggest_challenge"

Le composant `OnboardingFlow` gerera cette logique dans le rendu du step multi-field.

**Commit:**

```bash
git add src/components/onboarding/questions.ts
git commit -m "feat: add data-driven question definitions for onboarding"
```

---

## Task 7 : Composant principal OnboardingFlow

**Files:**

- Create: `src/components/onboarding/onboarding-flow.tsx` (remplace le placeholder)

C'est le coeur de la refonte. ~500-600 lignes. Suit le pattern de Rivia `OnboardingPage.tsx`.

### Structure :

```tsx
"use client";

// Imports: React, Framer Motion, Next Router, Supabase, confetti, useUser
// Imports: tous les composants (AnimatedBackground, ProgressBar, TopBar, ChipSelector, etc.)
// Import: QUESTIONS depuis questions.ts
// Import: MarketAnalysis, AILoading

export function OnboardingFlow() {
  // State
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [formData, setFormData] = useState<Record<string, unknown>>({
    ...defaults,
  });
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [loading, setLoading] = useState(true); // Chargement initial du profil
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  // Hook user
  const { user } = useUser();
  const router = useRouter();
  const supabase = createClient();

  // Filtrer les questions visibles (showWhen)
  const visibleQuestions = useMemo(
    () => QUESTIONS.filter((q) => !q.showWhen || q.showWhen(formData)),
    [formData],
  );
  const totalSteps = visibleQuestions.length;
  const currentQuestion = visibleQuestions[step];
  const isFirst = step === 0;
  const isLast = step === totalSteps - 1;

  // Charger le profil existant au mount (pour reprendre)
  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single()
      .then(({ data }) => {
        if (data) {
          // Remplir formData depuis les colonnes du profil
          // Reprendre au step sauvegarde : data.onboarding_step
          setStep(data.onboarding_step || 0);
        }
        setLoading(false);
      });
  }, [user]);

  // Progressive save
  const saveProgress = useCallback(async () => {
    if (!user) return;
    await supabase
      .from("profiles")
      .update({
        onboarding_step: step,
        first_name: formData.firstName,
        last_name: formData.lastName,
        // ... mapper tous les champs formData → colonnes profiles
      })
      .eq("id", user.id);
  }, [user, step, formData]);

  // Navigation
  const goNext = useCallback(async () => {
    if (step > 0) await saveProgress();
    if (currentQuestion.type === "summary") {
      handleAnalyze();
      return;
    }
    setDirection(1);
    setStep((s) => Math.min(s + 1, totalSteps - 1));
  }, [step, saveProgress, currentQuestion, totalSteps]);

  const goPrev = useCallback(() => {
    if (step === 0) return;
    setDirection(-1);
    setStep((s) => s - 1);
  }, [step]);

  // Auto-focus
  useEffect(() => {
    const timer = setTimeout(() => inputRef.current?.focus(), 350);
    return () => clearTimeout(timer);
  }, [step]);

  // Keyboard (Enter)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        const tag = (e.target as HTMLElement)?.tagName;
        if (tag === "TEXTAREA") return;
        e.preventDefault();
        goNext();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [goNext]);

  // Market analysis (identique a l'actuel)
  const handleAnalyze = async () => {
    /* ... meme logique ... */
  };
  const handleSelectMarket = async (index: number) => {
    /* ... save profile complet + onboarding_completed: true ... */
    // Confetti !
    confetti({
      particleCount: 150,
      spread: 100,
      origin: { y: 0.6 },
      colors: ["#34D399", "#10B981", "#059669", "#6EE7B7", "#fff"],
    });
    setTimeout(() => {
      router.push("/offer");
      router.refresh();
    }, 2000);
  };

  // Render question
  const renderQuestion = (q: Question) => {
    switch (q.type) {
      case "welcome":
      // Logo anime, titre "Bienvenue sur ScalingFlow", sous-titre, bouton "C'est parti"
      case "text":
      // Input underlined : border-b-2 border-white/20 bg-transparent text-2xl
      case "text-euro":
      // Meme que text mais avec prefixe "€"
      case "textarea":
      // Textarea rounded-xl border-2 border-white/20 bg-white/5
      case "chips":
      // <ChipSelector> avec auto-advance
      case "chips-multi":
      // <MultiChipSelector>
      case "multi-field":
      // Champs conditionnels selon situation (renderSituationDetails)
      case "skill-matrix":
      // <OnboardingSkillMatrix>
      case "summary":
      // <OnboardingSummary>
      case "market-analysis":
      // N'est pas un ecran dans QUESTIONS — gere par handleAnalyze
    }
  };

  // Layout
  return (
    <div className="relative flex min-h-screen flex-col bg-gradient-to-br from-[#050807] via-[#0a1a12] to-[#0B0E11]">
      <AnimatedBackground />
      <OnboardingProgressBar step={step} total={totalSteps} />
      <OnboardingTopBar
        onBack={goPrev}
        step={step}
        total={totalSteps}
        isFirst={isFirst}
      />

      <div className="relative z-10 mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center px-6 py-8">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            initial={{ y: direction > 0 ? 40 : -40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: direction > 0 ? -40 : 40, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            <h2 className="mb-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">
              {currentQuestion.title}
            </h2>
            {currentQuestion.subtitle && (
              <p className="mb-8 text-base text-white/40">
                {currentQuestion.subtitle}
              </p>
            )}
            {renderQuestion(currentQuestion)}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bouton Continuer (visible pour text, textarea, multi-field, skill-matrix, chips-multi) */}
      {/* Pas visible pour chips (auto-advance) ni welcome (bouton inline) */}
      {needsContinueButton(currentQuestion) && (
        <div className="relative z-10 px-6 pb-8 text-center">
          <button
            onClick={goNext}
            className="rounded-xl bg-emerald-500 px-8 py-3 font-semibold text-white transition hover:bg-emerald-400 disabled:opacity-30"
          >
            Continuer
          </button>
        </div>
      )}
    </div>
  );
}
```

### Points critiques :

- Le `formData` utilise les memes cles que `OnboardingFormData` du store Zustand
- Le mapping vers les colonnes Supabase est identique a `handleSelectMarket` dans l'ancien wizard
- Le chargement initial reconstruit `formData` depuis le profil Supabase (reprise)
- Les chips auto-advance appellent `goNext` directement (pas le `saveProgress` — il sera fait au step suivant)

**Commit:**

```bash
git add src/components/onboarding/onboarding-flow.tsx
git commit -m "feat: implement main onboarding flow with Rivia-style UX"
```

---

## Task 8 : Cleanup — supprimer les anciens fichiers

**Files:**

- Delete: `src/components/onboarding/onboarding-wizard.tsx`
- Delete: `src/components/onboarding/step-identity.tsx`
- Delete: `src/components/onboarding/step-situation.tsx`
- Delete: `src/components/onboarding/step-skills-vault.tsx`
- Delete: `src/components/onboarding/step-expertise.tsx`
- Delete: `src/components/onboarding/step-parcours.tsx`
- Delete: `src/components/onboarding/step-objectives.tsx`
- Delete: `src/components/onboarding/step-resources.tsx`
- Delete: `src/components/shared/step-indicator.tsx` (verifier si utilise ailleurs d'abord)
- Keep: `src/components/onboarding/market-analysis.tsx`
- Keep: `src/components/onboarding/viability-score.tsx`
- Keep or delete: `src/stores/onboarding-store.ts` (plus necessaire si progressive save, mais verifier qu'il n'est pas importe ailleurs)

```bash
# Verifier que step-indicator et onboarding-store ne sont pas importes ailleurs
grep -r "step-indicator\|StepIndicator" src/ --include="*.tsx" --include="*.ts"
grep -r "onboarding-store\|useOnboardingStore" src/ --include="*.tsx" --include="*.ts"
```

Si uniquement utilises dans les fichiers supprimes → supprimer aussi.

```bash
rm src/components/onboarding/onboarding-wizard.tsx \
   src/components/onboarding/step-identity.tsx \
   src/components/onboarding/step-situation.tsx \
   src/components/onboarding/step-skills-vault.tsx \
   src/components/onboarding/step-expertise.tsx \
   src/components/onboarding/step-parcours.tsx \
   src/components/onboarding/step-objectives.tsx \
   src/components/onboarding/step-resources.tsx
```

**Commit:**

```bash
git add -A
git commit -m "chore: remove old onboarding wizard and step components"
```

---

## Task 9 : Build + Test E2E

**Step 1: Build**

```bash
npm run build
```

Expected: build OK, 0 erreurs TypeScript.

**Step 2: Test E2E dans le navigateur**

1. Ouvrir `http://localhost:3002/onboarding`
2. Verifier : ecran welcome full-screen, background anime, logo, bouton "C'est parti"
3. Cliquer → ecran prenom, input underlined, auto-focus
4. Taper un prenom, Entree → slide vers nom
5. Naviguer tous les ecrans jusqu'au resume
6. Verifier le resume : toutes les sections affichees
7. Lancer l'analyse IA
8. Selectionner un marche → confetti → redirect vers `/offer`
9. Verifier : profil Supabase mis a jour (`onboarding_completed: true`)

**Step 3: Test de reprise**

1. Commencer l'onboarding, aller au step 5
2. Recharger la page
3. Verifier : reprend au step 5 avec les donnees precedentes

**Commit:**

```bash
git add -A
git commit -m "feat: complete onboarding redesign — Rivia-style full-screen UX"
```

---

## Task 10 : Deploy

```bash
git push origin main
npx vercel --prod
```

---

## Fichiers finaux

| Fichier                                                 | Action                           |
| ------------------------------------------------------- | -------------------------------- |
| `src/app/(onboarding)/layout.tsx`                       | CREATE                           |
| `src/app/(onboarding)/onboarding/page.tsx`              | CREATE                           |
| `src/components/onboarding/onboarding-flow.tsx`         | CREATE                           |
| `src/components/onboarding/questions.ts`                | CREATE                           |
| `src/components/onboarding/animated-background.tsx`     | CREATE                           |
| `src/components/onboarding/onboarding-progress-bar.tsx` | CREATE                           |
| `src/components/onboarding/onboarding-top-bar.tsx`      | CREATE                           |
| `src/components/onboarding/chip-selector.tsx`           | CREATE                           |
| `src/components/onboarding/multi-chip-selector.tsx`     | CREATE                           |
| `src/components/onboarding/onboarding-skill-matrix.tsx` | CREATE                           |
| `src/components/onboarding/onboarding-summary.tsx`      | CREATE                           |
| `src/app/(dashboard)/onboarding/page.tsx`               | DELETE                           |
| `src/components/onboarding/onboarding-wizard.tsx`       | DELETE                           |
| `src/components/onboarding/step-*.tsx` (7 fichiers)     | DELETE                           |
| `src/components/shared/step-indicator.tsx`              | DELETE (si pas utilise ailleurs) |
| `src/stores/onboarding-store.ts`                        | DELETE (si pas utilise ailleurs) |
| `src/components/onboarding/market-analysis.tsx`         | KEEP                             |
| `src/components/onboarding/viability-score.tsx`         | KEEP                             |
