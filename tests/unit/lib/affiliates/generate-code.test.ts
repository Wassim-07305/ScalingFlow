import { describe, it, expect } from "vitest";
import { generateAffiliateCode } from "@/lib/affiliates/generate-code";

describe("generateAffiliateCode", () => {
  it("generates code in PREFIX-XXXX format", () => {
    const code = generateAffiliateCode("Thomas");
    expect(code).toMatch(/^[A-Z]{1,6}-[A-Z2-9]{4}$/);
  });

  it("normalizes accented characters", () => {
    const code = generateAffiliateCode("Éloïse");
    expect(code).toMatch(/^ELOISE-[A-Z2-9]{4}$/);
  });

  it("converts to uppercase", () => {
    const code = generateAffiliateCode("marie");
    expect(code).toMatch(/^MARIE-[A-Z2-9]{4}$/);
  });

  it("truncates prefix to max 6 characters", () => {
    const code = generateAffiliateCode("Alexandre");
    expect(code).toMatch(/^ALEXAN-[A-Z2-9]{4}$/);
  });

  it("defaults to SF for empty name", () => {
    const code = generateAffiliateCode("");
    expect(code).toMatch(/^SF-[A-Z2-9]{4}$/);
  });

  it("defaults to SF for name with only special characters", () => {
    const code = generateAffiliateCode("123-!@#");
    expect(code).toMatch(/^SF-[A-Z2-9]{4}$/);
  });

  it("does not include confusing characters (I, O, 0, 1) in suffix", () => {
    // Run multiple times to increase probability of catching issues
    for (let i = 0; i < 50; i++) {
      const code = generateAffiliateCode("Test");
      const suffix = code.split("-")[1];
      expect(suffix).not.toMatch(/[IO01]/);
    }
  });

  it("generates different codes each time (random suffix)", () => {
    const codes = new Set<string>();
    for (let i = 0; i < 20; i++) {
      codes.add(generateAffiliateCode("Test"));
    }
    // With 4 chars from 30 options, collisions are extremely unlikely
    expect(codes.size).toBeGreaterThan(1);
  });
});
