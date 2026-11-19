import "server-only";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { auth } from "@/lib/auth";
import { isProPlan, type UserPlan } from "@/lib/plans";

export interface Viewer {
  userId: string;
  email: string;
  name: string;
  plan: UserPlan;
  isPro: boolean;
  currencyCode: string;
}

/**
 * Returns the signed-in viewer with the plan read from Postgres (the source of
 * truth that the billing webhook writes), or null for anonymous visitors.
 */
export async function getViewer(): Promise<Viewer | null> {
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
    })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  if (!row) return null;
  return {
    userId: row.id,
    email: row.email,
    name: row.name,
    plan: row.plan,
    isPro: isProPlan(row.plan),
    currencyCode: row.currencyCode,
  };
}

/** For protected pages: pages render in parallel with their layout, so each must guard itself. */
export async function requireViewer(): Promise<Viewer> {
  const viewer = await getViewer();
  if (!viewer) redirect("/login?next=/dashboard");
  return viewer;
}
