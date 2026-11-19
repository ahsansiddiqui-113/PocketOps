export type SubscriptionFrequency = "weekly" | "monthly" | "quarterly" | "yearly";

export interface SubscriptionItemInput {
  id: string;
  name: string;
  amountCents: number;
  frequency: SubscriptionFrequency;
}

export function normalizeToMonthlyCents(
  amountCents: number,
  frequency: SubscriptionFrequency
): number {
  const safe = Math.max(0, Math.round(amountCents));
  switch (frequency) {
    case "weekly":
      return Math.round((safe * 52) / 12);
    case "monthly":
      return safe;
    case "quarterly":
      return Math.round(safe / 3);
    case "yearly":
      return Math.round(safe / 12);
  }
}

export function futureValueMonthlySeriesCents(
  monthlyPaymentCents: number,
  annualRate: number,
  years: number
): number {
  const pmt = Math.max(0, monthlyPaymentCents);
  const months = Math.max(1, Math.round(years * 12));
  if (pmt === 0) return 0;
  if (annualRate <= 0) return pmt * months;

  const r = annualRate / 12;
  const fv = pmt * ((Math.pow(1 + r, months) - 1) / r);
  return Math.round(fv);
}

export function analyzeSubscriptions(
  items: SubscriptionItemInput[],
  annualReturnRate = 0.07
) {
  const totalMonthlyCents = items.reduce(
    (acc, item) => acc + normalizeToMonthlyCents(item.amountCents, item.frequency),
    0
  );

  return {
    totalMonthlyCents,
    annualRawCents: totalMonthlyCents * 12,
    fiveYearCompoundCents: futureValueMonthlySeriesCents(totalMonthlyCents, annualReturnRate, 5),
    tenYearCompoundCents: futureValueMonthlySeriesCents(totalMonthlyCents, annualReturnRate, 10),
  };
}
