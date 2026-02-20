import { create } from "zustand";

export interface OnboardingState {
  step: number;
  skills: string[];
  experienceLevel: string;
  currentRevenue: number;
  targetRevenue: number;
  industries: string[];
  objectives: string[];
  budgetMonthly: number;
  setStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  setField: <K extends keyof OnboardingFormData>(
    key: K,
    value: OnboardingFormData[K]
  ) => void;
  reset: () => void;
}

export type OnboardingFormData = {
  skills: string[];
  experienceLevel: string;
  currentRevenue: number;
  targetRevenue: number;
  industries: string[];
  objectives: string[];
  budgetMonthly: number;
};

const initialState: OnboardingFormData & { step: number } = {
  step: 0,
  skills: [],
  experienceLevel: "",
  currentRevenue: 0,
  targetRevenue: 0,
  industries: [],
  objectives: [],
  budgetMonthly: 0,
};

export const useOnboardingStore = create<OnboardingState>((set) => ({
  ...initialState,
  setStep: (step) => set({ step }),
  nextStep: () => set((state) => ({ step: state.step + 1 })),
  prevStep: () => set((state) => ({ step: Math.max(0, state.step - 1) })),
  setField: (key, value) => set({ [key]: value }),
  reset: () => set(initialState),
}));
