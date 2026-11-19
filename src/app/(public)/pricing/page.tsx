import type { Metadata } from "next";
import Link from "next/link";
import { UpgradeButtons } from "@/components/paywall/PaywallModal";
import { PLAN_LIMITS } from "@/lib/plans";
import { getViewer } from "@/lib/viewer";

export const metadata: Metadata = { title: "Pricing" };

export default async function PricingPage() {
  const viewer = await getViewer();
  const f = PLAN_LIMITS.free;

  return (
    <div>
      <h1 className="text-3xl font-bold">Simple pricing</h1>
      <p className="mt-2 text-muted-foreground">Every calculator is free forever. Pro adds persistence, automation and no ads.</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <section className="card">
          <h2 className="text-xl font-semibold">Free</h2>
          <p className="text-2xl font-bold">$0</p>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm">
            <li>All calculators and public guides</li>
            <li>{f.maxSavedBudgets} saved budget</li>
            <li>{f.maxRecurringBills} tracked recurring bills</li>
            <li>Ad-supported</li>
          </ul>
          {!viewer && <Link href="/register" className="btn mt-4">Create free account</Link>}
        </section>

        <section className="card border-primary">
          <h2 className="text-xl font-semibold">Pro</h2>
          <p className="text-2xl font-bold">$4<span className="text-base font-normal">/mo</span> <span className="text-sm font-normal text-muted-foreground">or $36/yr</span></p>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm">
            <li>Unlimited budgets and bills</li>
            <li>Email bill reminders</li>
            <li>CSV export</li>
            <li>Premium deep-dive guides</li>
            <li>No ads, anywhere</li>
          </ul>
          <div className="mt-4">
            {viewer?.isPro ? (
              <p className="text-sm font-medium text-primary">You&apos;re on Pro. Thank you!</p>
            ) : viewer ? (
              <UpgradeButtons />
            ) : (
              <Link href="/login?next=/pricing" className="btn btn-primary">Log in to upgrade</Link>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
