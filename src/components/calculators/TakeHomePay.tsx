"use client";

import { useEffect, useMemo, useState } from "react";
import { calculateProgressiveTaxCents } from "@/lib/calculators/tax";
import { TAX_PROFILES } from "@/lib/calculators/tax-brackets";
import { dollarsToCents, formatMoneyFromCents } from "@/lib/currency";
import { replaceQuery } from "@/lib/url-state";

export function TakeHomePay({
  initial,
  currencyCode = "USD",
}: {
  initial: { gross: number; deductions: number; profile: string };
  currencyCode?: string;
}) {
  const [gross, setGross] = useState(String(initial.gross || ""));
  const [deductions, setDeductions] = useState(String(initial.deductions || ""));
  const [profile, setProfile] = useState(initial.profile in TAX_PROFILES ? initial.profile : "US-2026-SINGLE");

  useEffect(() => {
    replaceQuery({ gross, deductions, profile });
  }, [gross, deductions, profile]);

  const r = useMemo(
    () =>
      calculateProgressiveTaxCents(
        dollarsToCents(Number.parseFloat(gross) || 0),
        dollarsToCents(Number.parseFloat(deductions) || 0),
        TAX_PROFILES[profile].brackets
      ),
    [gross, deductions, profile]
  );
  const fmt = (c: number) => formatMoneyFromCents(c, currencyCode);

  return (
    <div className="card">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="gross" className="block text-sm font-medium">Annual gross salary</label>
          <input id="gross" className="input mt-1" inputMode="decimal" value={gross} onChange={(e) => setGross(e.target.value)} placeholder="75000" />
        </div>
        <div>
          <label htmlFor="ded" className="block text-sm font-medium">Annual pre-tax deductions</label>
          <input id="ded" className="input mt-1" inputMode="decimal" value={deductions} onChange={(e) => setDeductions(e.target.value)} placeholder="0" />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="profile" className="block text-sm font-medium">Tax profile</label>
          <select id="profile" className="input mt-1" value={profile} onChange={(e) => setProfile(e.target.value)}>
            {Object.entries(TAX_PROFILES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </div>
      </div>
      <dl className="mt-5 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
        <div><dt className="text-muted-foreground">Take-home / month</dt><dd className="text-lg font-semibold">{fmt(r.netMonthlyCents)}</dd></div>
        <div><dt className="text-muted-foreground">Take-home / year</dt><dd className="text-lg font-semibold">{fmt(r.netAnnualCents)}</dd></div>
        <div><dt className="text-muted-foreground">Effective rate</dt><dd className="text-lg font-semibold">{r.effectiveTaxRate}%</dd></div>
        <div><dt className="text-muted-foreground">Marginal rate</dt><dd className="text-lg font-semibold">{r.marginalTaxRatePercent}%</dd></div>
      </dl>
      <p className="mt-3 text-xs text-muted-foreground">
        Illustrative federal-style brackets only — excludes payroll, state and local taxes. Not tax advice.
      </p>
    </div>
  );
}
