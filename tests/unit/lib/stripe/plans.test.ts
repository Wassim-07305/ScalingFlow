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
    it("has 5 plans defined", () => {
      expect(PLANS).toHaveLength(5);
    });

    it("has free, starter, pro, scale, and agency plans", () => {
      const ids = PLANS.map((p) => p.id);
      expect(ids).toEqual(["free", "starter", "pro", "scale", "agency"]);
    });

    it("marks pro as popular", () => {
      const pro = PLANS.find((p) => p.id === "pro");
      expect(pro?.popular).toBe(true);
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
      expect(getPlanById("starter")?.price).toBe(29);
      expect(getPlanById("pro")?.price).toBe(59);
      expect(getPlanById("scale")?.price).toBe(149);
      expect(getPlanById("agency")?.price).toBe(299);
    });

    it("returns undefined for unknown id", () => {
      expect(getPlanById("enterprise")).toBeUndefined();
    });
  });

  describe("getPlanByPriceId", () => {
    it("returns plan for monthly priceId", () => {
      const plan = getPlanByPriceId("price_xxx_pro_monthly");
      expect(plan?.id).toBe("pro");
    });

    it("returns plan for annual priceId", () => {
      const plan = getPlanByPriceId("price_xxx_pro_annual");
      expect(plan?.id).toBe("pro");
    });

    it("returns undefined for unknown priceId", () => {
      expect(getPlanByPriceId("price_unknown")).toBeUndefined();
    });
  });

  describe("resolvePlanId", () => {
    it("maps legacy premium to scale", () => {
      expect(resolvePlanId("premium")).toBe("scale");
    });

    it("returns same id for current plans", () => {
      expect(resolvePlanId("free")).toBe("free");
      expect(resolvePlanId("pro")).toBe("pro");
      expect(resolvePlanId("agency")).toBe("agency");
    });
  });

  describe("getPlanLimits", () => {
    it("returns free limits for unknown plan", () => {
      const limits = getPlanLimits("nonexistent");
      expect(limits.aiGenerationsPerMonth).toBe(10);
    });

    it("returns correct limits for pro", () => {
      const limits = getPlanLimits("pro");
      expect(limits.aiGenerationsPerMonth).toBe(200);
      expect(limits.metaAds).toBe(true);
      expect(limits.crm).toBe(true);
    });

    it("free plan has no meta ads or crm", () => {
      const limits = getPlanLimits("free");
      expect(limits.metaAds).toBe(false);
      expect(limits.crm).toBe(false);
      expect(limits.agents).toBe("general_only");
    });
  });

  describe("isPlanHigherOrEqual", () => {
    it("pro is higher than starter", () => {
      expect(isPlanHigherOrEqual("pro", "starter")).toBe(true);
    });

    it("free is not higher than pro", () => {
      expect(isPlanHigherOrEqual("free", "pro")).toBe(false);
    });

    it("same plan returns true", () => {
      expect(isPlanHigherOrEqual("pro", "pro")).toBe(true);
    });

    it("legacy premium maps to scale", () => {
      expect(isPlanHigherOrEqual("premium", "scale")).toBe(true);
    });
  });
});
