import { eq } from "drizzle-orm";
import { db } from "@/db";
import { subscriptions } from "@/db/schema";
import { UpgradeButtons } from "@/components/paywall/PaywallModal";
import { requireViewer } from "@/lib/viewer";

export default async function BillingPage() {
  const viewer = await requireViewer("/dashboard/billing");
  const [sub] = await db.select().from(subscriptions).where(eq(subscriptions.userId, viewer.userId)).limit(1);

  return (
    <div className="max-w-xl space-y-4">
      <h1 className="text-2xl font-bold">Billing</h1>
      <div className="card">
        <p className="text-sm text-muted-foreground">Current plan</p>
        <p className="text-xl font-semibold uppercase">{viewer.plan}</p>
        {sub && (
          <p className="mt-2 text-sm text-muted-foreground">
            Status: {sub.status}
            {sub.cancelAtPeriodEnd ? ` · ends ${sub.currentPeriodEnd.toISOString().slice(0, 10)}` : ` · renews ${sub.currentPeriodEnd.toISOString().slice(0, 10)}`}
          </p>
        )}
      </div>
      {!viewer.isPro && (
        <div className="card">
          <p className="mb-3 font-medium">Upgrade to Pro</p>
          <UpgradeButtons />
          <p className="mt-3 text-xs text-muted-foreground">After payment your plan updates within a few seconds.</p>
        </div>
      )}
    </div>
  );
}
