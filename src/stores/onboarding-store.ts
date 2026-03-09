import { create } from "zustand";

export interface SituationDetails {
  poste?: string;
  secteur?: string;
  missions?: string;
  ca_actuel?: number;
  clients_count?: number;
  biggest_challenge?: string;
}

export interface VaultSkillCategory {
  name: string;
  level: "debutant" | "intermediaire" | "avance";
  details?: string;
}

export interface OnboardingFormData {
  // Step 0: Identity
  firstName: string;
  lastName: string;
  country: string;
  language: string;
  // Step 1: Situation
  situation: "" | "zero" | "salarie" | "freelance" | "entrepreneur";
  situationDetails: SituationDetails;
  // Step 2: Skills (legacy, kept for backward compat)
  skills: string[];
  // Step 3: Vault Skills (6 categories with levels)
  vaultSkills: VaultSkillCategory[];
  // Step 4: Expertise
  expertiseAnswers: Record<string, string>;
  // Step 5: Parcours
  parcours: "" | "A1" | "A2" | "A3" | "B" | "C";
  // Step 6: Experience
  experienceLevel: string;
  // Step 7: Revenue & Industries
  currentRevenue: number;
  targetRevenue: number;
  industries: string[];
  // Step 8: Objectives & Constraints
  objectives: string[];
  hoursPerWeek: number;
  deadline: string;
  teamSize: number;
  // Step 9: Budget
  budgetMonthly: number;
  // Step 10: Formations & Resources (optional)
  formations: string[];
}

export interface OnboardingState extends OnboardingFormData {
  step: number;
  setStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  setField: <K extends keyof OnboardingFormData>(
    key: K,
    value: OnboardingFormData[K]
  ) => void;
  reset: () => void;
}

const initialState: OnboardingFormData & { step: number } = {
  step: 0,
  // Identity
  firstName: "",
  lastName: "",
  country: "France",
  language: "fr",
  // Situation
  situation: "",
  situationDetails: {},
  // Skills (legacy)
  skills: [],
  // Vault Skills
  vaultSkills: [],
  // Expertise
  expertiseAnswers: {},
  // Parcours
  parcours: "",
  // Experience
  experienceLevel: "",
  // Revenue & Industries
  currentRevenue: 0,
  targetRevenue: 0,
  industries: [],
  // Objectives & Constraints
  objectives: [],
  hoursPerWeek: 0,
  deadline: "",
  teamSize: 1,
  // Budget
  budgetMonthly: 0,
  // Formations
  formations: [],
};

export const useOnboardingStore = create<OnboardingState>((set) => ({
  ...initialState,
  setStep: (step) => set({ step }),
  nextStep: () => set((state) => ({ step: state.step + 1 })),
  prevStep: () => set((state) => ({ step: Math.max(0, state.step - 1) })),
  setField: (key, value) => set({ [key]: value }),
  reset: () => set(initialState),
}));
