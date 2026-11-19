import "server-only";
import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { subscriptions, users } from "@/db/schema";
import { auth } from "@/lib/auth";
import type { UserPlan } from "@/lib/plans";

export interface Viewer {
  userId: string;
  email: string;
  name: string;
  plan: UserPlan;
  isPro: boolean;
  currencyCode: string;
}

/**
 * Returns the signed-in viewer, or null for anonymous visitors. Memoised per request so the
 * layout and page don't each hit the session + database.
 *
 * Pro is `users.plan = 'pro'` (written by the billing webhook) AND the subscription must not
 * be past its paid period: if an `expired` webhook is ever lost, a cancelled sub still stops
 * granting Pro once `currentPeriodEnd` passes.
 */
export const getViewer = cache(async (): Promise<Viewer | null> => {
  // headers() must stay OUTSIDE the try: it throws Next's dynamic-rendering signal,
  // and swallowing that would let pages be prerendered with no viewer.
  const reqHeaders = await headers();
  let session;
  try {
    session = await auth.api.getSession({ headers: reqHeaders });
  } catch {
    return null;
  }
  if (!session?.user?.id) return null;

  const [row] = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      plan: users.plan,
      currencyCode: users.currencyCode,
      subStatus: subscriptions.status,
      periodEnd: subscriptions.currentPeriodEnd,
    })
    .from(users)
    .leftJoin(subscriptions, eq(subscriptions.userId, users.id))
    .where(eq(users.id, session.user.id))
    .limit(1);

  if (!row) return null;

  const lapsed =
    row.subStatus === "expired" ||
    (row.subStatus === "canceled" && row.periodEnd !== null && row.periodEnd.getTime() <= Date.now());
  const plan: UserPlan = row.plan === "pro" && !lapsed ? "pro" : "free";

  return {
    userId: row.id,
    email: row.email,
    name: row.name,
    plan,
    isPro: plan === "pro",
    currencyCode: row.currencyCode,
  };
});

/** For protected pages: pages render in parallel with their layout, so each must guard itself. */
export async function requireViewer(returnTo = "/dashboard"): Promise<Viewer> {
  const viewer = await getViewer();
  if (!viewer) redirect(`/login?next=${encodeURIComponent(returnTo)}`);
  return viewer;
}
