"use client";

import { useState, useTransition } from "react";
import { createBillAction } from "@/actions/bill.actions";
import { PaywallModal } from "@/components/paywall/PaywallModal";
import { dollarsToCents } from "@/lib/currency";

export function BillForm() {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [paywall, setPaywall] = useState<string | null>(null);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formEl = e.currentTarget;
    const f = new FormData(formEl);
    setError(null);
    start(async () => {
      const res = await createBillAction({
        name: String(f.get("name") ?? ""),
        category: String(f.get("category") ?? "") || "Utility",
        amountCents: dollarsToCents(Number.parseFloat(String(f.get("amount") ?? "0"))),
        billingCycle: String(f.get("cycle")),
        nextDueDate: String(f.get("due")),
        remindDaysBefore: Number.parseInt(String(f.get("remind") ?? "2"), 10),
      });
      if (res.ok) formEl.reset();
      else if (res.code === "UPGRADE_REQUIRED") setPaywall(res.reason);
      else setError("Please check the fields and try again.");
    });
  }

  return (
    <form onSubmit={onSubmit} className="card grid gap-3 sm:grid-cols-6">
      <input name="name" className="input sm:col-span-2" placeholder="Name (e.g. Rent)" required maxLength={100} aria-label="Bill name" />
      <input name="amount" className="input" inputMode="decimal" placeholder="Amount" required aria-label="Amount" />
      <select name="cycle" className="input" defaultValue="monthly" aria-label="Billing cycle">
        <option>weekly</option><option>monthly</option><option>quarterly</option><option>yearly</option>
      </select>
      <input name="due" type="date" className="input" required aria-label="Next due date" />
      <input name="remind" type="number" min={0} max={30} defaultValue={2} className="input" aria-label="Remind days before" />
      <input name="category" className="input sm:col-span-3" placeholder="Category (optional)" maxLength={50} aria-label="Category" />
      <button className="btn btn-primary sm:col-span-3" disabled={pending}>{pending ? "Adding…" : "Add bill"}</button>
      {error && <p role="alert" className="text-sm text-danger sm:col-span-6">{error}</p>}
      <PaywallModal open={paywall !== null} reason={paywall ?? undefined} onClose={() => setPaywall(null)} />
    </form>
  );
}
