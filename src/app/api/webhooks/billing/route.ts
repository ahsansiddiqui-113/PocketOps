import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
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

  // Deterministic key: identical replays dedupe. Fall back to a body hash rather
  // than Date.now(), which would defeat idempotency.
  const eventId =
    req.headers.get("x-event-id") ||
    `${eventName}:${subId}:${attrs.updated_at || crypto.createHash("sha256").update(rawBody).digest("hex")}`.slice(0, 128);

  const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  // Claim the event and apply its effects in ONE transaction: if processing throws,
  // the claim rolls back and the provider's retry is processed instead of dropped.
  const result = await db.transaction(async (tx) => {
    const inserted = await tx
      .insert(webhookEvents)
      .values({ eventId, eventName })
      .onConflictDoNothing()
      .returning();
    if (inserted.length === 0) return "duplicate" as const;

    if (!userId || !uuidRe.test(userId) || !subId) return "ignored" as const;

    const periodEndRaw = attrs.renews_at || attrs.ends_at;
    const periodEnd = periodEndRaw ? new Date(periodEndRaw) : new Date(Date.now() + 30 * 86400_000);

    if (eventName === "subscription_created" || eventName === "subscription_updated" ||
        eventName === "subscription_cancelled" || eventName === "subscription_resumed") {
      const mapped = mapStatus(String(attrs.status || "active"));
      const cancelAtPeriodEnd = Boolean(attrs.cancelled) || mapped === "canceled";

      await tx
        .insert(subscriptions)
        .values({
          userId,
          provider: "lemonsqueezy",
          providerSubscriptionId: subId,
          providerCustomerId: String(attrs.customer_id || ""),
          variantId: String(attrs.variant_id || ""),
          status: mapped,
          currentPeriodEnd: periodEnd,
          cancelAtPeriodEnd,
        })
        .onConflictDoUpdate({
          target: subscriptions.userId,
          set: {
            providerSubscriptionId: subId,
            status: mapped,
            currentPeriodEnd: periodEnd,
            cancelAtPeriodEnd,
            updatedAt: new Date(),
          },
        });

      // active + past_due (grace) = pro. A cancelled sub keeps pro until the paid
      // period ends; the later `subscription_expired` event downgrades.
      const stillPaid = mapped === "canceled" && periodEnd.getTime() > Date.now();
      const nextPlan = mapped === "active" || mapped === "past_due" || stillPaid ? "pro" : "free";
      await tx.update(users).set({ plan: nextPlan, updatedAt: new Date() }).where(eq(users.id, userId));
    } else if (eventName === "subscription_expired") {
      await tx
        .update(subscriptions)
        .set({ status: "expired", updatedAt: new Date() })
        .where(eq(subscriptions.userId, userId));
      await tx.update(users).set({ plan: "free", updatedAt: new Date() }).where(eq(users.id, userId));
    }
    return "processed" as const;
  });

  if (result === "duplicate") {
    return NextResponse.json({ received: true, duplicate: true }, { status: 200 });
  }
  if (result === "ignored") {
    return NextResponse.json({ received: true, ignored: "missing_ids" }, { status: 200 });
  }
  return NextResponse.json({ received: true }, { status: 200 });
}
