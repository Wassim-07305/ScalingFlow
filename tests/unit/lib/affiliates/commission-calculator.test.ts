import { describe, it, expect } from "vitest";
import { calculateCommission } from "@/lib/affiliates/commission-calculator";

describe("calculateCommission", () => {
  it("calculates one_time commission correctly", () => {
    const result = calculateCommission({
      sourceAmount: 100,
      commissionType: "one_time",
      commissionRate: 20,
    });
    expect(result).toEqual({ amount: 20, rate: 20, eligible: true });
  });

  it("uses customRate over commissionRate when provided", () => {
    const result = calculateCommission({
      sourceAmount: 100,
      commissionType: "one_time",
      commissionRate: 20,
      customRate: 30,
    });
    expect(result).toEqual({ amount: 30, rate: 30, eligible: true });
  });

  it("returns eligible recurring commission within month limit", () => {
    const result = calculateCommission({
      sourceAmount: 49,
      commissionType: "recurring",
      commissionRate: 20,
      existingCommissionsCount: 3,
      recurringMonths: 12,
    });
    expect(result.eligible).toBe(true);
    expect(result.amount).toBe(9.8);
  });

  it("returns ineligible when recurring months exceeded", () => {
    const result = calculateCommission({
      sourceAmount: 49,
      commissionType: "recurring",
      commissionRate: 20,
      existingCommissionsCount: 12,
      recurringMonths: 12,
    });
    expect(result.eligible).toBe(false);
    expect(result.amount).toBe(0);
    expect(result.reason).toContain("12 mois");
  });

  it("allows unlimited recurring when recurringMonths is null", () => {
    const result = calculateCommission({
      sourceAmount: 49,
      commissionType: "recurring",
      commissionRate: 20,
      existingCommissionsCount: 100,
      recurringMonths: null,
    });
    expect(result.eligible).toBe(true);
    expect(result.amount).toBe(9.8);
  });

  it("handles zero sourceAmount", () => {
    const result = calculateCommission({
      sourceAmount: 0,
      commissionType: "one_time",
      commissionRate: 20,
    });
    expect(result.amount).toBe(0);
    expect(result.eligible).toBe(true);
  });

  it("rounds to 2 decimal places", () => {
    const result = calculateCommission({
      sourceAmount: 33.33,
      commissionType: "one_time",
      commissionRate: 15,
    });
    // 33.33 * 15 / 100 = 5.0
    expect(result.amount).toBe(5);
  });

  it("handles tiered commission type", () => {
    const result = calculateCommission({
      sourceAmount: 200,
      commissionType: "tiered",
      commissionRate: 25,
    });
    expect(result.amount).toBe(50);
    expect(result.eligible).toBe(true);
  });

  it("uses customRate=0 when explicitly set to 0", () => {
    const result = calculateCommission({
      sourceAmount: 100,
      commissionType: "one_time",
      commissionRate: 20,
      customRate: 0,
    });
    expect(result.amount).toBe(0);
    expect(result.rate).toBe(0);
  });

  it("falls back to commissionRate when customRate is null", () => {
    const result = calculateCommission({
      sourceAmount: 100,
      commissionType: "one_time",
      commissionRate: 20,
      customRate: null,
    });
    expect(result.amount).toBe(20);
    expect(result.rate).toBe(20);
  });
});
