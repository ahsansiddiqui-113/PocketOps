"use client";

import { useEffect, useMemo, useState } from "react";
import { analyzeSubscriptions, normalizeToMonthlyCents, type SubscriptionFrequency } from "@/lib/calculators/subscription";
import { dollarsToCents, formatMoneyFromCents } from "@/lib/currency";
import { replaceQuery } from "@/lib/url-state";

interface Row { id: string; name: string; amount: string; frequency: SubscriptionFrequency }
const FREQS: SubscriptionFrequency[] = ["weekly", "monthly", "quarterly", "yearly"];

let counter = 0;
const newId = () => `s${Date.now().toString(36)}${counter++}`;

/** URL format: items=Name~amount~freq,Name~amount~freq */
export function parseItemsParam(raw: string | undefined): Row[] {
  if (!raw) return [{ id: newId(), name: "", amount: "", frequency: "monthly" }];
  const rows = raw.split(",").slice(0, 30).map((part) => {
    const [name = "", amount = "", freq = "monthly"] = part.split("~").map(decodeURIComponent);
    const frequency = (FREQS as string[]).includes(freq) ? (freq as SubscriptionFrequency) : "monthly";
    return { id: newId(), name: name.slice(0, 60), amount, frequency };
  });
  return rows.length ? rows : [{ id: newId(), name: "", amount: "", frequency: "monthly" }];
}

export function SubscriptionLeak({ initialItems, currencyCode = "USD" }: { initialItems?: string; currencyCode?: string }) {
  const [rows, setRows] = useState<Row[]>(() => parseItemsParam(initialItems));
  const [rate, setRate] = useState(7);

  useEffect(() => {
    const encoded = rows
      .filter((r) => r.name || r.amount)
      .map((r) => [r.name, r.amount, r.frequency].map(encodeURIComponent).join("~"))
      .join(",");
    replaceQuery({ items: encoded });
  }, [rows]);

  const result = useMemo(
    () =>
      analyzeSubscriptions(
        rows.map((r) => ({
          id: r.id,
          name: r.name,
          amountCents: dollarsToCents(Number.parseFloat(r.amount) || 0),
          frequency: r.frequency,
        })),
        Math.max(0, rate) / 100
      ),
    [rows, rate]
  );

  const fmt = (c: number) => formatMoneyFromCents(c, currencyCode);
  const update = (id: string, patch: Partial<Row>) =>
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  return (
    <div className="card">
      <div className="space-y-2">
        {rows.map((r) => (
          <div key={r.id} className="grid grid-cols-12 gap-2">
            <input aria-label="Subscription name" className="input col-span-5" placeholder="Streaming, gym…"
              value={r.name} onChange={(e) => update(r.id, { name: e.target.value })} />
            <input aria-label="Amount" className="input col-span-3" inputMode="decimal" placeholder="9.99"
              value={r.amount} onChange={(e) => update(r.id, { amount: e.target.value })} />
            <select aria-label="Frequency" className="input col-span-3" value={r.frequency}
              onChange={(e) => update(r.id, { frequency: e.target.value as SubscriptionFrequency })}>
              {FREQS.map((f) => <option key={f}>{f}</option>)}
            </select>
            <button aria-label="Remove" className="btn col-span-1 px-0"
              onClick={() => setRows((rs) => (rs.length > 1 ? rs.filter((x) => x.id !== r.id) : rs))}>×</button>
          </div>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button className="btn" onClick={() => setRows((rs) => [...rs, { id: newId(), name: "", amount: "", frequency: "monthly" }])}>
          + Add subscription
        </button>
        <label className="text-sm">Assumed yearly return{" "}
          <input className="input inline-block w-20" inputMode="decimal" value={rate}
            onChange={(e) => setRate(Number.parseFloat(e.target.value) || 0)} />%
        </label>
      </div>

      <dl className="mt-5 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
        <div><dt className="text-muted-foreground">Per month</dt><dd className="text-lg font-semibold">{fmt(result.totalMonthlyCents)}</dd></div>
        <div><dt className="text-muted-foreground">Per year</dt><dd className="text-lg font-semibold">{fmt(result.annualRawCents)}</dd></div>
        <div><dt className="text-muted-foreground">Invested 5 yrs</dt><dd className="text-lg font-semibold">{fmt(result.fiveYearCompoundCents)}</dd></div>
        <div><dt className="text-muted-foreground">Invested 10 yrs</dt><dd className="text-lg font-semibold">{fmt(result.tenYearCompoundCents)}</dd></div>
      </dl>
      <p className="mt-3 text-xs text-muted-foreground">
        &quot;Invested&quot; shows what these payments could grow to if put into an investment instead. Illustrative only, not advice.
        Largest single drain:{" "}
        {(() => {
          const top = rows
            .map((r) => ({ r, m: normalizeToMonthlyCents(dollarsToCents(Number.parseFloat(r.amount) || 0), r.frequency) }))
            .sort((a, b) => b.m - a.m)[0];
          return top && top.m > 0 ? `${top.r.name || "Unnamed"} (${fmt(top.m)}/mo)` : "—";
        })()}
      </p>
    </div>
  );
}
