import type { TaxBracket } from "./tax-brackets";

export function calculateProgressiveTaxCents(
  annualGrossCents: number,
  preTaxDeductionsCents: number,
  brackets: TaxBracket[]
) {
  const gross = Math.max(0, Math.round(annualGrossCents));
  const deductions = Math.max(0, Math.min(gross, Math.round(preTaxDeductionsCents)));
  const taxable = Math.max(0, gross - deductions);

  let taxCents = 0;
  let prevCap = 0;
  let marginalRate = brackets[0]?.rate ?? 0;

  for (const bracket of brackets) {
    if (taxable <= prevCap) break;
    const upper = bracket.upToCents ?? taxable;
    const slice = Math.max(0, Math.min(taxable, upper) - prevCap);
    if (slice > 0) {
      taxCents += Math.round(slice * bracket.rate);
      marginalRate = bracket.rate;
    }
    if (bracket.upToCents === null) break;
    prevCap = bracket.upToCents;
  }

  const netAnnualCents = Math.max(0, gross - deductions - taxCents);
  const effectiveTaxRate = gross > 0 ? Math.round((taxCents / gross) * 10000) / 100 : 0;

  return {
    taxableIncomeCents: taxable,
    annualTaxCents: taxCents,
    netAnnualCents,
    netMonthlyCents: Math.round(netAnnualCents / 12),
    effectiveTaxRate,
    marginalTaxRatePercent: Math.round(marginalRate * 10000) / 100,
  };
}
