"use server";

import { z } from "zod";
import { and, count, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { recurringBills } from "@/db/schema";
import { PLAN_LIMITS } from "@/lib/plans";
import { getViewer } from "@/lib/viewer";

const createBillSchema = z.object({
  name: z.string().min(1).max(100),
  category: z.string().min(1).max(50).default("Utility"),
  amountCents: z.number().int().min(0).max(10_000_000_000),
  billingCycle: z.enum(["weekly", "monthly", "quarterly", "yearly"]),
  nextDueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  remindDaysBefore: z.number().int().min(0).max(30).default(2),
});

export async function createBillAction(rawInput: unknown) {
  const viewer = await getViewer();
  if (!viewer) return { ok: false as const, code: "UNAUTHENTICATED" as const };

  const parsed = createBillSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { ok: false as const, code: "INVALID_INPUT" as const, issues: parsed.error.issues };
  }

  if (!viewer.isPro) {
    const [{ value: existing }] = await db
      .select({ value: count() })
      .from(recurringBills)
      .where(eq(recurringBills.userId, viewer.userId));

    if (existing >= PLAN_LIMITS.free.maxRecurringBills) {
      return {
        ok: false as const,
        code: "UPGRADE_REQUIRED" as const,
        reason: "FREE_BILL_LIMIT_REACHED" as const,
      };
    }
  }

  const [created] = await db
    .insert(recurringBills)
    .values({ userId: viewer.userId, ...parsed.data })
    .returning();

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/bills");
  return { ok: true as const, bill: created };
}

export async function deleteBillAction(billId: string) {
  const viewer = await getViewer();
  if (!viewer) return { ok: false as const, code: "UNAUTHENTICATED" as const };
  if (!z.string().uuid().safeParse(billId).success) {
    return { ok: false as const, code: "INVALID_INPUT" as const };
  }

  await db
    .delete(recurringBills)
    .where(and(eq(recurringBills.id, billId), eq(recurringBills.userId, viewer.userId)));

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/bills");
  return { ok: true as const };
}
