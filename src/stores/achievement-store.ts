import { create } from "zustand";
import type { AchievementData } from "@/components/gamification/achievement-toast";

interface AchievementState {
  currentAchievement: AchievementData | null;
  queue: AchievementData[];
  showAchievement: (achievement: AchievementData) => void;
  dismissAchievement: () => void;
}

export const useAchievementStore = create<AchievementState>((set, get) => ({
  currentAchievement: null,
  queue: [],

  showAchievement: (achievement) => {
    const { currentAchievement, queue } = get();

    if (currentAchievement) {
      // Ajouter a la queue si un achievement est deja affiche
      set({ queue: [...queue, achievement] });
    } else {
      set({ currentAchievement: achievement });
    }
  },

  dismissAchievement: () => {
    const { queue } = get();

    if (queue.length > 0) {
      // Afficher le prochain achievement de la queue
      const [next, ...rest] = queue;
      set({ currentAchievement: next, queue: rest });
    } else {
      set({ currentAchievement: null });
    }
  },
}));

// Helper pour afficher un achievement depuis n'importe ou
export function triggerAchievement(achievement: AchievementData) {
  useAchievementStore.getState().showAchievement(achievement);
}
