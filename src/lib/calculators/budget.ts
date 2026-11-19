import type { BudgetAllocationItem } from "@/db/schema";

export interface BudgetAnalysis {
  totalAllocatedCents: number;
  unallocatedCents: number;
  needsCents: number;
  wantsCents: number;
  savingsCents: number;
  debtCents: number;
  needsPercent: number;
  wantsPercent: number;
  savingsPercent: number;
  flags: Array<"DEFICIT" | "HIGH_FIXED_COST" | "LOW_SAVINGS">;
}

export function analyzeBudget(
  netIncomeCents: number,
  items: BudgetAllocationItem[],
  targetSavingsPercent = 20
): BudgetAnalysis {
  const safeIncome = Math.max(0, Math.round(netIncomeCents));

  let needsCents = 0;
  let wantsCents = 0;
  let savingsCents = 0;
  let debtCents = 0;

  for (const item of items) {
    const amt = Math.max(0, Math.round(item.amountCents));
    if (item.bucket === "need") needsCents += amt;
    else if (item.bucket === "want") wantsCents += amt;
    else if (item.bucket === "saving") savingsCents += amt;
    else if (item.bucket === "debt") debtCents += amt;
  }

  const totalAllocatedCents = needsCents + wantsCents + savingsCents + debtCents;
  const unallocatedCents = safeIncome - totalAllocatedCents;

  const pct = (part: number) =>
    safeIncome > 0 ? Math.round((part / safeIncome) * 1000) / 10 : 0;

  const needsPercent = pct(needsCents);
  const wantsPercent = pct(wantsCents);
  const savingsPercent = pct(savingsCents);

  const flags: BudgetAnalysis["flags"] = [];
  if (unallocatedCents < 0) flags.push("DEFICIT");
  if (safeIncome > 0 && (needsCents + debtCents) / safeIncome > 0.55) {
    flags.push("HIGH_FIXED_COST");
  }
  if (savingsPercent < targetSavingsPercent) {
    flags.push("LOW_SAVINGS");
  }

  return {
    totalAllocatedCents,
    unallocatedCents,
    needsCents,
    wantsCents,
    savingsCents,
    debtCents,
    needsPercent,
    wantsPercent,
    savingsPercent,
    flags,
  };
}
