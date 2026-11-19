"use server";

import { z } from "zod";
import { eq, count, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { savedBudgets } from "@/db/schema";
import { PLAN_LIMITS } from "@/lib/plans";
import { getViewer } from "@/lib/viewer";

const allocationSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1).max(80),
  bucket: z.enum(["need", "want", "saving", "debt"]),
  amountCents: z.number().int().min(0).max(10_000_000_000),
});

const createBudgetSchema = z.object({
  title: z.string().min(1).max(100),
  monthYear: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/),
  netIncomeCents: z.number().int().min(0).max(10_000_000_000),
  allocations: z.array(allocationSchema).min(1).max(50),
  notes: z.string().max(1000).optional(),
});

export async function createBudgetAction(rawInput: unknown) {
  const viewer = await getViewer();
  if (!viewer) return { ok: false as const, code: "UNAUTHENTICATED" as const };

  const parsed = createBudgetSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { ok: false as const, code: "INVALID_INPUT" as const, issues: parsed.error.issues };
  }

  if (!viewer.isPro) {
    const [{ value: existingCount }] = await db
      .select({ value: count() })
      .from(savedBudgets)
      .where(eq(savedBudgets.userId, viewer.userId));

    if (existingCount >= PLAN_LIMITS.free.maxSavedBudgets) {
      return {
        ok: false as const,
        code: "UPGRADE_REQUIRED" as const,
        reason: "FREE_BUDGET_LIMIT_REACHED" as const,
      };
    }
  }

  const [created] = await db
    .insert(savedBudgets)
    .values({
      userId: viewer.userId,
      title: parsed.data.title,
      monthYear: parsed.data.monthYear,
      netIncomeCents: parsed.data.netIncomeCents,
      allocations: parsed.data.allocations,
      notes: parsed.data.notes ?? null,
    })
    .returning();

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/budgets");
  return { ok: true as const, budget: created };
}

export async function deleteBudgetAction(budgetId: string) {
  const viewer = await getViewer();
  if (!viewer) return { ok: false as const, code: "UNAUTHENTICATED" as const };

  const idOk = z.string().uuid().safeParse(budgetId).success;
  if (!idOk) return { ok: false as const, code: "INVALID_INPUT" as const };

  await db
    .delete(savedBudgets)
    .where(and(eq(savedBudgets.id, budgetId), eq(savedBudgets.userId, viewer.userId)));

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/budgets");
  return { ok: true as const };
}
