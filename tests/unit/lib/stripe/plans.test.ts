import { describe, it, expect } from "vitest";
import { PLANS, getPlanById, getPlanByPriceId } from "@/lib/stripe/plans";

describe("Stripe Plans", () => {
  describe("PLANS", () => {
    it("has 3 plans defined", () => {
      expect(PLANS).toHaveLength(3);
    });

    it("has free, pro, and premium plans", () => {
      const ids = PLANS.map((p) => p.id);
      expect(ids).toEqual(["free", "pro", "premium"]);
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
  });

  describe("getPlanById", () => {
    it("returns the correct plan for a valid id", () => {
      const plan = getPlanById("pro");
      expect(plan?.id).toBe("pro");
      expect(plan?.price).toBe(49);
    });

    it("returns undefined for unknown id", () => {
      expect(getPlanById("enterprise")).toBeUndefined();
    });
  });

  describe("getPlanByPriceId", () => {
    it("returns the correct plan for a valid priceId", () => {
      const plan = getPlanByPriceId("price_xxx_pro_monthly");
      expect(plan?.id).toBe("pro");
    });

    it("returns undefined for unknown priceId", () => {
      expect(getPlanByPriceId("price_unknown")).toBeUndefined();
    });
  });
});
