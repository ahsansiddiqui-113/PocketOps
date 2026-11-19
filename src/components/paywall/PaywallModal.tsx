"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { createCheckoutAction } from "@/actions/billing.actions";

const REASONS: Record<string, string> = {
  FREE_BUDGET_LIMIT_REACHED: "Free accounts can save 1 budget. Upgrade to Pro for unlimited budgets.",
  FREE_BILL_LIMIT_REACHED: "Free accounts can track 3 recurring bills. Upgrade to Pro for unlimited bills.",
  EXPORT_IS_PRO: "CSV export is a Pro feature.",
};

export function UpgradeButtons() {
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function go(cycle: "monthly" | "annual") {
    setError(null);
    start(async () => {
      const res = await createCheckoutAction(cycle);
      if (res.ok) {
        window.location.href = res.url;
      } else if (res.code === "UNAUTHENTICATED") {
        window.location.href = "/login?next=/pricing";
      } else if (res.code === "BILLING_NOT_CONFIGURED") {
        setError("Billing isn't configured yet. Set the Lemon Squeezy env vars.");
      } else {
        setError("Couldn't start checkout. Please try again.");
      }
    });
  }

  return (
    <div>
      <div className="flex flex-wrap gap-3">
        <button className="btn btn-primary" disabled={pending} onClick={() => go("annual")}>
          Pro — $36/year (save 25%)
        </button>
        <button className="btn" disabled={pending} onClick={() => go("monthly")}>
          Pro — $4/month
        </button>
      </div>
      {error && <p role="alert" className="mt-2 text-sm text-danger">{error}</p>}
    </div>
  );
}

export function PaywallModal({
  open,
  reason,
  onClose,
}: {
  open: boolean;
  reason?: string;
  onClose: () => void;
}) {
  if (!open) return null;
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="paywall-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div className="card w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <h2 id="paywall-title" className="text-xl font-semibold">Upgrade to ClearLedger Pro</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {(reason && REASONS[reason]) || "Unlock unlimited history, reminders, exports and an ad-free experience."}
        </p>
        <ul className="mt-3 list-disc pl-5 text-sm">
          <li>Unlimited budgets and bills</li>
          <li>Email bill reminders</li>
          <li>CSV export</li>
          <li>Premium guides, no ads</li>
        </ul>
        <div className="mt-5">
          <UpgradeButtons />
        </div>
        <div className="mt-4 flex justify-between text-sm">
          <Link href="/pricing" className="underline">Compare plans</Link>
          <button className="underline" onClick={onClose}>Not now</button>
        </div>
      </div>
    </div>
  );
}
