import { describe, it, expect } from "vitest";
import {
  BADGE_DEFINITIONS,
  BADGE_MAP,
  getBadgeDefinition,
} from "@/lib/gamification/badges";

describe("Badge Definitions", () => {
  it("has badge definitions defined", () => {
    expect(BADGE_DEFINITIONS.length).toBeGreaterThan(0);
  });

  it("all badges have required fields", () => {
    for (const badge of BADGE_DEFINITIONS) {
      expect(badge.id).toBeTruthy();
      expect(badge.name).toBeTruthy();
      expect(badge.description).toBeTruthy();
      expect(badge.icon).toBeDefined();
      expect(badge.color).toBeTruthy();
    }
  });

  it("all badge IDs are unique", () => {
    const ids = BADGE_DEFINITIONS.map((b) => b.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("includes generation badges", () => {
    const genBadges = BADGE_DEFINITIONS.filter((b) => b.id.startsWith("gen_") || b.id === "first_gen");
    expect(genBadges.length).toBeGreaterThan(0);
  });

  it("includes level badges", () => {
    const levelBadges = BADGE_DEFINITIONS.filter((b) => b.id.startsWith("level_"));
    expect(levelBadges.length).toBeGreaterThan(0);
  });

  it("includes tier badges", () => {
    const tierBadges = BADGE_DEFINITIONS.filter((b) => b.id.startsWith("tier_"));
    expect(tierBadges.length).toBe(4);
  });
});

describe("BADGE_MAP", () => {
  it("has same size as BADGE_DEFINITIONS", () => {
    expect(BADGE_MAP.size).toBe(BADGE_DEFINITIONS.length);
  });

  it("can look up badges by ID", () => {
    expect(BADGE_MAP.get("first_gen")).toBeDefined();
    expect(BADGE_MAP.get("first_gen")?.name).toBe("Premier pas");
  });
});

describe("getBadgeDefinition", () => {
  it("returns badge for valid ID", () => {
    const badge = getBadgeDefinition("first_gen");
    expect(badge).toBeDefined();
    expect(badge?.id).toBe("first_gen");
  });

  it("returns undefined for unknown ID", () => {
    expect(getBadgeDefinition("nonexistent")).toBeUndefined();
  });
});
