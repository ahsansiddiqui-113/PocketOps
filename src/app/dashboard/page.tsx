import Link from "next/link";
import { count, eq, asc } from "drizzle-orm";
import { db } from "@/db";
import { recurringBills, savedBudgets } from "@/db/schema";
import { formatMoneyFromCents } from "@/lib/currency";
import { PLAN_LIMITS } from "@/lib/plans";
import { requireViewer } from "@/lib/viewer";

export default async function DashboardHome() {
  const viewer = await requireViewer();
  const limits = PLAN_LIMITS[viewer.plan];

  const [{ value: budgetCount }] = await db.select({ value: count() }).from(savedBudgets).where(eq(savedBudgets.userId, viewer.userId));
  const bills = await db.select().from(recurringBills).where(eq(recurringBills.userId, viewer.userId)).orderBy(asc(recurringBills.nextDueDate)).limit(5);

  const cap = (n: number) => (Number.isFinite(n) ? String(n) : "∞");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Welcome back, {viewer.name}</h1>
      <div className="grid gap-4 sm:grid-cols-2">
        <Link href="/dashboard/budgets" className="card hover:bg-muted">
          <p className="text-sm text-muted-foreground">Saved budgets</p>
          <p className="text-2xl font-bold">{budgetCount} / {cap(limits.maxSavedBudgets)}</p>
        </Link>
        <Link href="/dashboard/bills" className="card hover:bg-muted">
          <p className="text-sm text-muted-foreground">Tracked bills</p>
          <p className="text-2xl font-bold">{bills.length === 5 ? "5+" : bills.length} / {cap(limits.maxRecurringBills)}</p>
        </Link>
      </div>

      <section>
        <h2 className="mb-2 text-lg font-semibold">Upcoming bills</h2>
        {bills.length === 0 ? (
          <p className="text-sm text-muted-foreground">No bills yet. <Link className="underline" href="/dashboard/bills">Add one</Link>.</p>
        ) : (
          <ul className="space-y-2">
            {bills.map((b) => (
              <li key={b.id} className="card flex justify-between text-sm">
                <span>{b.name} · {b.nextDueDate}</span>
                <span className="font-medium">{formatMoneyFromCents(b.amountCents, viewer.currencyCode)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {!viewer.isPro && (
        <section className="card">
          <p className="font-medium">Want unlimited budgets, reminders and exports?</p>
          <Link href="/dashboard/billing" className="btn btn-primary mt-3">Upgrade to Pro</Link>
        </section>
      )}
    </div>
  );
}
