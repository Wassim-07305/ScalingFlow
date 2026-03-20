import { describe, it, expect } from "vitest";
import {
  FEATURE_GATES,
  isFeatureUnlocked,
  getRequiredLevel,
  getLockedFeatures,
  getUnlockedFeatures,
  getXPForLevel,
  getXPToNextLevel,
} from "@/lib/gamification/feature-gates";

describe("Feature Gates", () => {
  describe("FEATURE_GATES", () => {
    it("has features defined", () => {
      expect(FEATURE_GATES.length).toBeGreaterThan(0);
    });

    it("has level 0 features accessible immediately", () => {
      const level0 = FEATURE_GATES.filter((g) => g.requiredLevel === 0);
      expect(level0.length).toBeGreaterThan(0);
      const features = level0.map((g) => g.feature);
      expect(features).toContain("onboarding");
      expect(features).toContain("market");
      expect(features).toContain("offer");
    });
  });

  describe("isFeatureUnlocked", () => {
    it("unlocks level 0 features at level 0", () => {
      expect(isFeatureUnlocked(0, "onboarding")).toBe(true);
      expect(isFeatureUnlocked(0, "market")).toBe(true);
    });

    it("locks level 1 features at level 0", () => {
      expect(isFeatureUnlocked(0, "funnel")).toBe(false);
      expect(isFeatureUnlocked(0, "assets")).toBe(false);
    });

    it("unlocks level 1 features at level 1", () => {
      expect(isFeatureUnlocked(1, "funnel")).toBe(true);
    });

    it("unlocks level 2 features at level 2", () => {
      expect(isFeatureUnlocked(2, "ads")).toBe(true);
      expect(isFeatureUnlocked(2, "content")).toBe(true);
    });

    it("returns true for unknown features (not gated)", () => {
      expect(isFeatureUnlocked(0, "unknown_feature")).toBe(true);
    });

    it("higher level unlocks all lower features", () => {
      expect(isFeatureUnlocked(10, "portal")).toBe(true);
      expect(isFeatureUnlocked(10, "onboarding")).toBe(true);
    });
  });

  describe("getRequiredLevel", () => {
    it("returns correct level for known features", () => {
      expect(getRequiredLevel("onboarding")).toBe(0);
      expect(getRequiredLevel("funnel")).toBe(1);
      expect(getRequiredLevel("ads")).toBe(2);
      expect(getRequiredLevel("launch")).toBe(3);
      expect(getRequiredLevel("portal")).toBe(4);
    });

    it("returns 0 for unknown features", () => {
      expect(getRequiredLevel("unknown")).toBe(0);
    });
  });

  describe("getLockedFeatures", () => {
    it("returns all features for level 0 except level 0 ones", () => {
      const locked = getLockedFeatures(0);
      const features = locked.map((g) => g.feature);
      expect(features).not.toContain("onboarding");
      expect(features).toContain("funnel");
      expect(features).toContain("portal");
    });

    it("returns empty array for max level", () => {
      const locked = getLockedFeatures(100);
      expect(locked).toHaveLength(0);
    });
  });

  describe("getUnlockedFeatures", () => {
    it("returns only level 0 features for level 0", () => {
      const unlocked = getUnlockedFeatures(0);
      for (const gate of unlocked) {
        expect(gate.requiredLevel).toBe(0);
      }
    });

    it("returns all features for high level", () => {
      const unlocked = getUnlockedFeatures(100);
      expect(unlocked).toHaveLength(FEATURE_GATES.length);
    });
  });

  describe("getXPForLevel", () => {
    it("returns 0 for level 0 or below", () => {
      expect(getXPForLevel(0)).toBe(0);
      expect(getXPForLevel(-1)).toBe(0);
    });

    it("returns correct thresholds", () => {
      expect(getXPForLevel(1)).toBe(0);
      expect(getXPForLevel(2)).toBe(100);
      expect(getXPForLevel(3)).toBe(250);
    });

    it("caps at max level threshold for very high levels", () => {
      const maxXP = getXPForLevel(100);
      expect(maxXP).toBe(10000);
    });
  });

  describe("getXPToNextLevel", () => {
    it("calculates remaining XP correctly", () => {
      // Level 1 needs 0 XP, level 2 needs 100 XP
      expect(getXPToNextLevel(50, 1)).toBe(50);
    });

    it("returns 0 when already past threshold", () => {
      expect(getXPToNextLevel(200, 1)).toBe(0);
    });
  });
});
