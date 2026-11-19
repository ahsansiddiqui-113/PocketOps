import { describe, expect, it } from "vitest";
import { analyzeBudget } from "@/lib/calculators/budget";
import { analyzeSubscriptions, futureValueMonthlySeriesCents, normalizeToMonthlyCents } from "@/lib/calculators/subscription";
import { calculateProgressiveTaxCents } from "@/lib/calculators/tax";
import { TAX_PROFILES } from "@/lib/calculators/tax-brackets";
import { dollarsToCents, formatMoneyFromCents } from "@/lib/currency";

describe("currency", () => {
  it("round-trips $1,234.56 as 123456 cents", () => {
    expect(dollarsToCents(1234.56)).toBe(123456);
    expect(formatMoneyFromCents(123456)).toBe("$1,234.56");
  });
  it("guards non-finite input", () => {
    expect(dollarsToCents(NaN)).toBe(0);
    expect(formatMoneyFromCents(Infinity)).toBe("$0.00");
  });
});

describe("budget", () => {
  it("handles zero income without dividing by zero", () => {
    const r = analyzeBudget(0, [{ id: "1", label: "Rent", bucket: "need", amountCents: 100 }]);
    expect(r.needsPercent).toBe(0);
    expect(r.flags).toContain("DEFICIT");
  });
  it("flags high fixed cost and low savings", () => {
    const r = analyzeBudget(100000, [
      { id: "1", label: "Rent", bucket: "need", amountCents: 50000 },
      { id: "2", label: "Loan", bucket: "debt", amountCents: 10000 },
    ]);
    expect(r.flags).toEqual(["HIGH_FIXED_COST", "LOW_SAVINGS"]);
  });
  it("clamps negative amounts", () => {
    const r = analyzeBudget(1000, [{ id: "1", label: "x", bucket: "want", amountCents: -500 }]);
    expect(r.wantsCents).toBe(0);
  });
});

describe("subscriptions", () => {
  it("normalises cycles to monthly", () => {
    expect(normalizeToMonthlyCents(1200, "yearly")).toBe(100);
    expect(normalizeToMonthlyCents(300, "quarterly")).toBe(100);
    expect(normalizeToMonthlyCents(100, "weekly")).toBe(433);
  });
  it("future value is >= raw total when rate positive and handles zero", () => {
    expect(futureValueMonthlySeriesCents(0, 0.07, 5)).toBe(0);
    expect(futureValueMonthlySeriesCents(1000, 0, 1)).toBe(12000);
    const r = analyzeSubscriptions([{ id: "1", name: "a", amountCents: 1000, frequency: "monthly" }]);
    expect(r.fiveYearCompoundCents).toBeGreaterThan(r.annualRawCents * 5);
  });
});

describe("tax", () => {
  it("applies progressive brackets", () => {
    const r = calculateProgressiveTaxCents(5000000, 0, TAX_PROFILES["US-2026-SINGLE"].brackets);
    // 10% of 11,925 + 12% of (48,475-11,925) + 22% of (50,000-48,475)
    // = 1,192.50 + 4,386.00 + 335.50 = 5,914.00
    expect(r.annualTaxCents).toBe(591400);
    expect(r.marginalTaxRatePercent).toBe(22);
  });
  it("never goes negative and handles zero gross", () => {
    const r = calculateProgressiveTaxCents(0, 500, TAX_PROFILES["FLAT-15"].brackets);
    expect(r.netAnnualCents).toBe(0);
    expect(r.effectiveTaxRate).toBe(0);
  });
});
