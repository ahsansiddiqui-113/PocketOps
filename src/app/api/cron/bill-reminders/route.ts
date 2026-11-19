import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { and, eq, gte, isNull, lt, lte, ne, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { recurringBills, users } from "@/db/schema";
import { formatMoneyFromCents } from "@/lib/currency";
import { rollForward } from "@/lib/dates";
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

  const todayStr = new Date().toISOString().slice(0, 10); // 'YYYY-MM-DD' (UTC; no per-user timezone yet)

  // 1. Active Pro bills inside their reminder window. Only today-or-future dates: a bill that is
  //    already overdue is rolled forward below, not emailed with a stale date.
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
        gte(recurringBills.nextDueDate, todayStr),
        lte(
          recurringBills.nextDueDate,
          sql`(${todayStr}::date + make_interval(days => ${recurringBills.remindDaysBefore}::int))::date`
        ),
        or(isNull(recurringBills.lastRemindedForDate), ne(recurringBills.lastRemindedForDate, recurringBills.nextDueDate))
      )
    );

  let sentCount = 0;
  for (const row of dueSoon) {
    // Claim first (atomic): if another run already claimed this due date, skip. Two overlapping
    // invocations therefore can't both email.
    const claimed = await db
      .update(recurringBills)
      .set({ lastRemindedForDate: row.nextDueDate })
      .where(
        and(
          eq(recurringBills.id, row.billId),
          or(isNull(recurringBills.lastRemindedForDate), ne(recurringBills.lastRemindedForDate, row.nextDueDate))
        )
      )
      .returning({ id: recurringBills.id });
    if (claimed.length === 0) continue;

    const sent = await sendEmail({
      to: row.userEmail,
      subject: `Upcoming Bill: ${row.billName} due ${row.nextDueDate}`,
      text: `Your recurring item "${row.billName}" (${formatMoneyFromCents(
        row.amountCents,
        row.currencyCode
      )}) is scheduled for ${row.nextDueDate}.`,
    });

    if (sent.ok) {
      sentCount += 1;
    } else if (!sent.skipped) {
      // Real send failure: release the claim so the next run retries.
      await db.update(recurringBills).set({ lastRemindedForDate: null }).where(eq(recurringBills.id, row.billId));
    }
  }

  // 2. Roll every overdue bill forward past today in one step (all missed cycles), computed from
  //    the original date + anchor day so a bill due on the 31st doesn't drift to the 28th.
  const overdue = await db
    .select({
      id: recurringBills.id,
      nextDueDate: recurringBills.nextDueDate,
      billingCycle: recurringBills.billingCycle,
      anchorDay: recurringBills.anchorDay,
    })
    .from(recurringBills)
    .where(and(eq(recurringBills.isActive, true), lt(recurringBills.nextDueDate, todayStr)));

  for (const bill of overdue) {
    const next = rollForward(bill.nextDueDate, bill.billingCycle, todayStr, bill.anchorDay);
    await db.update(recurringBills).set({ nextDueDate: next }).where(eq(recurringBills.id, bill.id));
  }

  return NextResponse.json({ ok: true, remindersSent: sentCount, rolledForward: overdue.length, date: todayStr });
}
