import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { deleteBudgetAction } from "@/actions/budget.actions";
import { db } from "@/db";
import { savedBudgets } from "@/db/schema";
import { DeleteButton } from "@/components/dashboard/DeleteButton";
import { ExportButton } from "@/components/dashboard/ExportButton";
import { PendingBudgetImporter } from "@/components/dashboard/PendingBudgetImporter";
import { analyzeBudget } from "@/lib/calculators/budget";
import { formatMoneyFromCents } from "@/lib/currency";
import { requireViewer } from "@/lib/viewer";

export default async function BudgetsPage() {
  const viewer = await requireViewer("/dashboard/budgets");
  const budgets = await db.select().from(savedBudgets).where(eq(savedBudgets.userId, viewer.userId)).orderBy(desc(savedBudgets.createdAt));
  const fmt = (c: number) => formatMoneyFromCents(c, viewer.currencyCode);

  return (
    <div>
      <PendingBudgetImporter />
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Budgets</h1>
        <div className="flex gap-2">
          <ExportButton />
          <Link href="/tools/budget-splitter" className="btn btn-primary">New budget</Link>
        </div>
      </div>
      {budgets.length === 0 ? (
        <p className="text-sm text-muted-foreground">No saved budgets yet. Build one in the <Link className="underline" href="/tools/budget-splitter">Budget Splitter</Link>.</p>
      ) : (
        <ul className="space-y-3">
          {budgets.map((b) => {
            const a = analyzeBudget(b.netIncomeCents, b.allocations);
            return (
              <li key={b.id} className="card flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold">{b.title}</p>
                  <p className="text-sm text-muted-foreground">
                    Income {fmt(b.netIncomeCents)} · Needs {a.needsPercent}% · Savings {a.savingsPercent}% · Left {fmt(a.unallocatedCents)}
                  </p>
                </div>
                <DeleteButton label={`Delete ${b.title}`} action={deleteBudgetAction.bind(null, b.id)} />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
