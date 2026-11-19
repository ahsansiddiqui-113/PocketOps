import { asc, eq } from "drizzle-orm";
import { deleteBillAction } from "@/actions/bill.actions";
import { db } from "@/db";
import { recurringBills } from "@/db/schema";
import { BillForm } from "@/components/dashboard/BillForm";
import { DeleteButton } from "@/components/dashboard/DeleteButton";
import { formatMoneyFromCents } from "@/lib/currency";
import { requireViewer } from "@/lib/viewer";

export default async function BillsPage() {
  const viewer = await requireViewer("/dashboard/bills");
  const bills = await db.select().from(recurringBills).where(eq(recurringBills.userId, viewer.userId)).orderBy(asc(recurringBills.nextDueDate));

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold">Recurring bills</h1>
      {!viewer.isPro && (
        <p className="text-sm text-muted-foreground">Free plan: up to 3 bills, no email reminders. Pro unlocks unlimited bills and reminders.</p>
      )}
      <BillForm />
      <ul className="space-y-2">
        {bills.map((b) => (
          <li key={b.id} className="card flex flex-wrap items-center justify-between gap-3 text-sm">
            <div>
              <p className="font-medium">{b.name} <span className="text-muted-foreground">· {b.category}</span></p>
              <p className="text-muted-foreground">Due {b.nextDueDate} · {b.billingCycle} · remind {b.remindDaysBefore}d before</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-semibold">{formatMoneyFromCents(b.amountCents, viewer.currencyCode)}</span>
              <DeleteButton label={`Delete ${b.name}`} action={deleteBillAction.bind(null, b.id)} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
