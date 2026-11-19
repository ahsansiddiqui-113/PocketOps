"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createBudgetAction } from "@/actions/budget.actions";
import { PaywallModal } from "@/components/paywall/PaywallModal";
import { BucketBlocks } from "./BucketBlocks";
import { analyzeBudget } from "@/lib/calculators/budget";
import { dollarsToCents, formatMoneyFromCents } from "@/lib/currency";
import { PENDING_BUDGET_KEY, replaceQuery } from "@/lib/url-state";
import type { BudgetAllocationItem } from "@/db/schema";

type Bucket = "need" | "want" | "saving" | "debt";
const BUCKETS: { key: Bucket; label: string }[] = [
  { key: "need", label: "Needs (rent, food, utilities)" },
  { key: "want", label: "Wants (fun, dining out)" },
  { key: "saving", label: "Savings & investing" },
  { key: "debt", label: "Debt payments" },
];

const FLAG_TEXT = {
  DEFICIT: "You've allocated more than your income.",
  HIGH_FIXED_COST: "Needs + debt exceed 55% of income — little room to flex.",
  LOW_SAVINGS: "Savings are below the 20% target.",
} as const;

export interface BudgetSplitterInitial {
  income: number;
  need: number;
  want: number;
  saving: number;
  debt: number;
}

export function BudgetSplitter({
  initial,
  isAuthed,
  currencyCode = "USD",
}: {
  initial: BudgetSplitterInitial;
  isAuthed: boolean;
  currencyCode?: string;
}) {
  const router = useRouter();
  const [income, setIncome] = useState(String(initial.income || ""));
  const [amounts, setAmounts] = useState<Record<Bucket, string>>({
    need: String(initial.need || ""),
    want: String(initial.want || ""),
    saving: String(initial.saving || ""),
    debt: String(initial.debt || ""),
  });
  const [paywall, setPaywall] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, start] = useTransition();

  useEffect(() => {
    replaceQuery({ income, ...amounts });
  }, [income, amounts]);

  const { items, analysis, incomeCents } = useMemo(() => {
    const incomeCents = dollarsToCents(Number.parseFloat(income) || 0);
    const items: BudgetAllocationItem[] = BUCKETS.map((b) => ({
      id: b.key,
      label: b.label.split(" (")[0],
      bucket: b.key,
      amountCents: dollarsToCents(Number.parseFloat(amounts[b.key]) || 0),
    }));
    return { items, analysis: analyzeBudget(incomeCents, items), incomeCents };
  }, [income, amounts]);

  function save() {
    setMessage(null);
    const monthYear = new Date().toISOString().slice(0, 7);
    const payload = {
      title: `Budget ${monthYear}`,
      monthYear,
      netIncomeCents: incomeCents,
      allocations: items,
    };
    if (!isAuthed) {
      try {
        sessionStorage.setItem(PENDING_BUDGET_KEY, JSON.stringify(payload));
      } catch {
        /* storage unavailable: user will just re-enter */
      }
      router.push("/login?next=/dashboard/budgets");
      return;
    }
    start(async () => {
      const res = await createBudgetAction(payload);
      if (res.ok) router.push("/dashboard/budgets");
      else if (res.code === "UPGRADE_REQUIRED") setPaywall(res.reason);
      else setMessage("Couldn't save. Check your numbers and try again.");
    });
  }

  const fmt = (c: number) => formatMoneyFromCents(c, currencyCode);

  return (
    <div className="card">
      <label className="block text-sm font-medium" htmlFor="income">Monthly take-home income</label>
      <input id="income" className="input mt-1" inputMode="decimal" value={income}
        onChange={(e) => setIncome(e.target.value)} placeholder="5000" />

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {BUCKETS.map((b) => (
          <div key={b.key}>
            <label className="block text-sm" htmlFor={b.key}>{b.label}</label>
            <input id={b.key} className="input mt-1" inputMode="decimal" value={amounts[b.key]}
              onChange={(e) => setAmounts((a) => ({ ...a, [b.key]: e.target.value }))} placeholder="0" />
          </div>
        ))}
      </div>

      <BucketBlocks
        percents={{
          need: incomeCents > 0 ? Math.round((analysis.needsCents / incomeCents) * 100) : 0,
          want: incomeCents > 0 ? Math.round((analysis.wantsCents / incomeCents) * 100) : 0,
          saving: analysis.savingsPercent ? Math.round(analysis.savingsPercent) : 0,
          debt: incomeCents > 0 ? Math.round((analysis.debtCents / incomeCents) * 100) : 0,
        }}
      />

      <dl className="mt-5 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
        <div><dt className="text-muted-foreground">Allocated</dt><dd className="font-semibold">{fmt(analysis.totalAllocatedCents)}</dd></div>
        <div><dt className="text-muted-foreground">Unallocated</dt>
          <dd className={`font-semibold ${analysis.unallocatedCents < 0 ? "text-danger" : ""}`}>{fmt(analysis.unallocatedCents)}</dd></div>
        <div><dt className="text-muted-foreground">Needs</dt><dd className="font-semibold">{analysis.needsPercent}%</dd></div>
        <div><dt className="text-muted-foreground">Savings</dt><dd className="font-semibold">{analysis.savingsPercent}%</dd></div>
      </dl>

      {incomeCents > 0 && analysis.flags.length > 0 && (
        <ul className="mt-4 space-y-1 text-sm text-warn">
          {analysis.flags.map((f) => <li key={f}>⚠ {FLAG_TEXT[f]}</li>)}
        </ul>
      )}

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button className="btn btn-primary" onClick={save} disabled={pending || incomeCents === 0}>
          {isAuthed ? "Save budget" : "Sign up to save"}
        </button>
        <button className="btn" onClick={() => navigator.clipboard?.writeText(window.location.href)}>
          Copy share link
        </button>
        {message && <span role="alert" className="text-sm text-danger">{message}</span>}
      </div>

      <PaywallModal open={paywall !== null} reason={paywall ?? undefined} onClose={() => setPaywall(null)} />
    </div>
  );
}
