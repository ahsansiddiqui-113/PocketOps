import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { subscriptions, users, webhookEvents } from "@/db/schema";

function verifySignature(rawBody: string, signatureHeader: string | null, secret: string): boolean {
  if (!signatureHeader || !secret) return false;
  const hmac = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  const a = Buffer.from(hmac, "utf8");
  const b = Buffer.from(signatureHeader, "utf8");
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

type SubStatus = "active" | "past_due" | "canceled" | "expired";

function mapStatus(ls: string): SubStatus {
  switch (ls) {
    case "active":
    case "on_trial":
      return "active";
    case "past_due":
    case "unpaid":
      return "past_due";
    case "cancelled":
      return "canceled";
    default:
      return "expired";
  }
}

function parseDate(v: unknown): Date | null {
  if (typeof v !== "string") return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(req: Request) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-signature");
  const secret = process.env.BILLING_WEBHOOK_SECRET || "";

  if (!verifySignature(rawBody, signature, secret)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let payload: any;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Malformed JSON" }, { status: 400 });
  }

  const eventName: string = payload?.meta?.event_name || "";
  const userId: string | undefined = payload?.meta?.custom_data?.user_id;
  const subId = String(payload?.data?.id || "");
  const attrs = payload?.data?.attributes || {};

  // Deterministic key: identical replays dedupe. Body hash (not Date.now()) as fallback.
  const eventId =
    req.headers.get("x-event-id") ||
    `${eventName}:${subId}:${attrs.updated_at || crypto.createHash("sha256").update(rawBody).digest("hex")}`.slice(0, 128);

  // Claim the event and apply effects in ONE transaction: a failure rolls the claim back
  // so the provider's retry is processed instead of dropped.
  const result = await db.transaction(async (tx) => {
    const inserted = await tx.insert(webhookEvents).values({ eventId, eventName }).onConflictDoNothing().returning();
    if (inserted.length === 0) return "duplicate" as const;

    if (!userId || !UUID_RE.test(userId) || !subId) return "ignored" as const;

    const providerUpdatedAt = parseDate(attrs.updated_at) ?? new Date();

    if (
      eventName === "subscription_created" || eventName === "subscription_updated" ||
      eventName === "subscription_cancelled" || eventName === "subscription_resumed"
    ) {
      const mapped = mapStatus(String(attrs.status || "active"));
      // Malformed/missing dates must not throw (that would 500 forever on retries).
      const periodEnd =
        parseDate(attrs.renews_at) ?? parseDate(attrs.ends_at) ?? new Date(Date.now() + 30 * 86_400_000);
      const cancelAtPeriodEnd = Boolean(attrs.cancelled) || mapped === "canceled";

      const values = {
        providerSubscriptionId: subId,
        providerCustomerId: String(attrs.customer_id || ""),
        variantId: String(attrs.variant_id || ""),
        status: mapped,
        currentPeriodEnd: periodEnd,
        cancelAtPeriodEnd,
        providerUpdatedAt,
      };

      // Ignore stale deliveries: only apply if this event is not older than what we hold.
      const applied = await tx
        .insert(subscriptions)
        .values({ userId, provider: "lemonsqueezy", ...values })
        .onConflictDoUpdate({
          target: subscriptions.userId,
          set: { ...values, updatedAt: new Date() },
          setWhere: sql`${subscriptions.providerUpdatedAt} is null or ${subscriptions.providerUpdatedAt} <= ${providerUpdatedAt.toISOString()}::timestamptz`,
        })
        .returning({ id: subscriptions.id });

      if (applied.length === 0) return "stale" as const;

      // active + past_due (grace) = pro. A cancelled sub keeps pro until the paid period ends;
      // getViewer() also enforces period end, so a lost `expired` event can't grant Pro forever.
      const stillPaid = mapped === "canceled" && periodEnd.getTime() > Date.now();
      const nextPlan = mapped === "active" || mapped === "past_due" || stillPaid ? "pro" : "free";
      await tx.update(users).set({ plan: nextPlan, updatedAt: new Date() }).where(eq(users.id, userId));
    } else if (eventName === "subscription_expired") {
      // Only the subscription we currently track may downgrade the user; an expiry for an
      // OLD subscription must not cancel a newer one.
      const expired = await tx
        .update(subscriptions)
        .set({ status: "expired", providerUpdatedAt, updatedAt: new Date() })
        .where(and(eq(subscriptions.userId, userId), eq(subscriptions.providerSubscriptionId, subId)))
        .returning({ id: subscriptions.id });
      if (expired.length === 0) return "stale" as const;

      await tx.update(users).set({ plan: "free", updatedAt: new Date() }).where(eq(users.id, userId));
    }
    return "processed" as const;
  });

  if (result === "duplicate") return NextResponse.json({ received: true, duplicate: true }, { status: 200 });
  if (result === "ignored") return NextResponse.json({ received: true, ignored: "missing_ids" }, { status: 200 });
  if (result === "stale") return NextResponse.json({ received: true, ignored: "stale" }, { status: 200 });
  return NextResponse.json({ received: true }, { status: 200 });
}
