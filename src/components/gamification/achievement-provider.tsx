"use client";

import { useAchievementStore } from "@/stores/achievement-store";
import { AchievementToast } from "./achievement-toast";

export function AchievementProvider() {
  const { currentAchievement, dismissAchievement } = useAchievementStore();

  return (
    <AchievementToast
      achievement={currentAchievement}
      onClose={dismissAchievement}
    />
  );
}
