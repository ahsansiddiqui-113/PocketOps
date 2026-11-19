import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { and, eq, lte, ne, or, isNull, sql } from "drizzle-orm";
import { db } from "@/db";
import { recurringBills, users } from "@/db/schema";
import { formatMoneyFromCents } from "@/lib/currency";
import { sendEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

function authorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const a = Buffer.from(req.headers.get("authorization") ?? "");
  const b = Buffer.from(`Bearer ${secret}`);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export async function GET(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const todayStr = new Date().toISOString().slice(0, 10); // 'YYYY-MM-DD' (UTC)

  // 1. Active Pro bills inside their reminder window, not yet reminded for this due date.
  const dueSoon = await db
    .select({
      billId: recurringBills.id,
      billName: recurringBills.name,
      amountCents: recurringBills.amountCents,
      nextDueDate: recurringBills.nextDueDate,
      userEmail: users.email,
      currencyCode: users.currencyCode,
    })
    .from(recurringBills)
    .innerJoin(users, eq(recurringBills.userId, users.id))
    .where(
      and(
        eq(recurringBills.isActive, true),
        eq(users.plan, "pro"),
        lte(
          recurringBills.nextDueDate,
          sql`(${todayStr}::date + make_interval(days => ${recurringBills.remindDaysBefore}::int))::date`
        ),
        or(
          isNull(recurringBills.lastRemindedForDate),
          ne(recurringBills.lastRemindedForDate, recurringBills.nextDueDate)
        )
      )
    );

  let sentCount = 0;
  for (const row of dueSoon) {
    const sent = await sendEmail({
      to: row.userEmail,
      subject: `Upcoming Bill: ${row.billName} due ${row.nextDueDate}`,
      text: `Your recurring item "${row.billName}" (${formatMoneyFromCents(
        row.amountCents,
        row.currencyCode
      )}) is scheduled for ${row.nextDueDate}.`,
    });

    // Only mark reminded when the email really went out (or email is unconfigured,
    // so dev runs don't loop forever); a failed send is retried on the next run.
    if (sent.ok || sent.skipped) {
      await db
        .update(recurringBills)
        .set({ lastRemindedForDate: row.nextDueDate })
        .where(eq(recurringBills.id, row.billId));
    }
    if (sent.ok) sentCount += 1;
  }

  // 2. Roll past-due bills forward by their cycle until they are in the future,
  //    so a bill missed for several cycles doesn't lag behind.
  await db.execute(sql`
    UPDATE recurring_bills
    SET next_due_date = CASE billing_cycle
      WHEN 'weekly' THEN (next_due_date + INTERVAL '7 days')::date
      WHEN 'monthly' THEN (next_due_date + INTERVAL '1 month')::date
      WHEN 'quarterly' THEN (next_due_date + INTERVAL '3 months')::date
      WHEN 'yearly' THEN (next_due_date + INTERVAL '1 year')::date
    END
    WHERE is_active = true AND next_due_date < ${todayStr}::date
  `);

  return NextResponse.json({ ok: true, remindersSent: sentCount, date: todayStr });
}
