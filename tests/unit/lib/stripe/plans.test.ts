import { describe, it, expect } from "vitest";
import {
  PLANS,
  getPlanById,
  getPlanByPriceId,
  getPlanLimits,
  resolvePlanId,
  isPlanHigherOrEqual,
  PLAN_ORDER,
} from "@/lib/stripe/plans";

describe("Stripe Plans", () => {
  describe("PLANS", () => {
    it("has 3 plans defined", () => {
      expect(PLANS).toHaveLength(3);
    });

    it("has free, scale, and agency plans", () => {
      const ids = PLANS.map((p) => p.id);
      expect(ids).toEqual(["free", "scale", "agency"]);
    });

    it("marks scale as popular", () => {
      const scale = PLANS.find((p) => p.id === "scale");
      expect(scale?.popular).toBe(true);
    });

    it("free plan has price 0", () => {
      const free = PLANS.find((p) => p.id === "free");
      expect(free?.price).toBe(0);
    });

    it("all plans have stripePriceId", () => {
      for (const plan of PLANS) {
        expect(plan.stripePriceId).toBeTruthy();
      }
    });

    it("all plans have features array", () => {
      for (const plan of PLANS) {
        expect(Array.isArray(plan.features)).toBe(true);
        expect(plan.features.length).toBeGreaterThan(0);
      }
    });

    it("all plans have limits with aiGenerationsPerMonth", () => {
      for (const plan of PLANS) {
        expect(plan.limits.aiGenerationsPerMonth).toBeGreaterThan(0);
      }
    });

    it("annual prices are cheaper than monthly", () => {
      for (const plan of PLANS) {
        if (plan.price > 0) {
          expect(plan.annualPrice).toBeLessThan(plan.price);
        }
      }
    });

    it("generation limits increase with plan tier", () => {
      const limits = PLANS.map((p) => p.limits.aiGenerationsPerMonth);
      for (let i = 1; i < limits.length; i++) {
        expect(limits[i]).toBeGreaterThan(limits[i - 1]);
      }
    });
  });

  describe("getPlanById", () => {
    it("returns the correct plan for each valid id", () => {
      expect(getPlanById("free")?.price).toBe(0);
      expect(getPlanById("scale")?.price).toBe(149);
      expect(getPlanById("agency")?.price).toBe(297);
    });

    it("returns undefined for unknown id", () => {
      expect(getPlanById("enterprise")).toBeUndefined();
      expect(getPlanById("starter")).toBeUndefined();
      expect(getPlanById("pro")).toBeUndefined();
    });
  });

  describe("getPlanByPriceId", () => {
    it("returns plan for monthly priceId", () => {
      const plan = getPlanByPriceId("price_1TBYRxLzBHnogydhV4I41sES");
      expect(plan?.id).toBe("scale");
    });

    it("returns plan for agency priceId", () => {
      const plan = getPlanByPriceId("price_1TBYSOLzBHnogydhaimZzZP7");
      expect(plan?.id).toBe("agency");
    });

    it("returns plan for legacy priceId", () => {
      const plan = getPlanByPriceId("price_1TD6WmPIprzhdbzlwgJytiqG");
      expect(plan?.id).toBe("scale");
    });

    it("returns undefined for unknown priceId", () => {
      expect(getPlanByPriceId("price_unknown")).toBeUndefined();
    });
  });

  describe("resolvePlanId", () => {
    it("maps legacy premium to scale", () => {
      expect(resolvePlanId("premium")).toBe("scale");
    });

    it("maps legacy starter to free", () => {
      expect(resolvePlanId("starter")).toBe("free");
    });

    it("maps legacy pro to free", () => {
      expect(resolvePlanId("pro")).toBe("free");
    });

    it("returns same id for current plans", () => {
      expect(resolvePlanId("free")).toBe("free");
      expect(resolvePlanId("scale")).toBe("scale");
      expect(resolvePlanId("agency")).toBe("agency");
    });
  });

  describe("getPlanLimits", () => {
    it("returns free limits for unknown plan", () => {
      const limits = getPlanLimits("nonexistent");
      expect(limits.aiGenerationsPerMonth).toBe(10);
    });

    it("returns correct limits for scale", () => {
      const limits = getPlanLimits("scale");
      expect(limits.aiGenerationsPerMonth).toBe(500);
      expect(limits.metaAds).toBe(true);
      expect(limits.crm).toBe(true);
      expect(limits.whitelabel).toBe(true);
    });

    it("returns correct limits for agency", () => {
      const limits = getPlanLimits("agency");
      expect(limits.aiGenerationsPerMonth).toBe(1500);
      expect(limits.priorityQueue).toBe(true);
      expect(limits.whitelabelSubAccounts).toBe(5);
      expect(limits.coachingCalls).toBe(2);
    });

    it("free plan has no meta ads or crm", () => {
      const limits = getPlanLimits("free");
      expect(limits.metaAds).toBe(false);
      expect(limits.crm).toBe(false);
      expect(limits.agents).toBe("general_only");
    });

    it("legacy pro maps to free limits", () => {
      const limits = getPlanLimits("pro");
      expect(limits.aiGenerationsPerMonth).toBe(10);
    });
  });

  describe("isPlanHigherOrEqual", () => {
    it("agency is higher than scale", () => {
      expect(isPlanHigherOrEqual("agency", "scale")).toBe(true);
    });

    it("free is not higher than scale", () => {
      expect(isPlanHigherOrEqual("free", "scale")).toBe(false);
    });

    it("same plan returns true", () => {
      expect(isPlanHigherOrEqual("scale", "scale")).toBe(true);
    });

    it("legacy premium maps to scale", () => {
      expect(isPlanHigherOrEqual("premium", "scale")).toBe(true);
    });

    it("legacy pro maps to free (not higher than scale)", () => {
      expect(isPlanHigherOrEqual("pro", "scale")).toBe(false);
    });
  });
});
