"use server";

import { eq } from "drizzle-orm";
import { db } from "@/db";
import { recurringBills, savedBudgets } from "@/db/schema";
import { centsToDollars } from "@/lib/currency";
import { getViewer } from "@/lib/viewer";

function csvCell(value: string | number): string {
  let s = String(value);
  // Neutralise spreadsheet formula injection.
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
}

/** Pro-only CSV export of budgets and bills. */
export async function exportDataCsvAction() {
  const viewer = await getViewer();
  if (!viewer) return { ok: false as const, code: "UNAUTHENTICATED" as const };
  if (!viewer.isPro) {
    return { ok: false as const, code: "UPGRADE_REQUIRED" as const, reason: "EXPORT_IS_PRO" as const };
  }

  const budgets = await db.select().from(savedBudgets).where(eq(savedBudgets.userId, viewer.userId));
  const bills = await db.select().from(recurringBills).where(eq(recurringBills.userId, viewer.userId));

  const lines: string[] = [];
  lines.push("type,title,month_or_due,category_or_bucket,label,amount");
  for (const b of budgets) {
    lines.push(
      ["budget_income", b.title, b.monthYear, "", "Net income", centsToDollars(b.netIncomeCents)]
        .map(csvCell)
        .join(",")
    );
    for (const a of b.allocations) {
      lines.push(
        ["budget_item", b.title, b.monthYear, a.bucket, a.label, centsToDollars(a.amountCents)]
          .map(csvCell)
          .join(",")
      );
    }
  }
  for (const bill of bills) {
    lines.push(
      ["bill", bill.name, bill.nextDueDate, bill.category, bill.billingCycle, centsToDollars(bill.amountCents)]
        .map(csvCell)
        .join(",")
    );
  }

  return { ok: true as const, filename: "clearledger-export.csv", csv: lines.join("\n") };
}
