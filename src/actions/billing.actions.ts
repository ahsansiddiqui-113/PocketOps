"use server";

import { z } from "zod";
import { getViewer } from "@/lib/viewer";

/**
 * Creates a Lemon Squeezy hosted checkout carrying the user id as custom data,
 * so the webhook can map the subscription back to our user.
 */
export async function createCheckoutAction(cycle: "monthly" | "annual") {
  const viewer = await getViewer();
  if (!viewer) return { ok: false as const, code: "UNAUTHENTICATED" as const };
  if (viewer.isPro) return { ok: false as const, code: "ALREADY_PRO" as const };

  if (!z.enum(["monthly", "annual"]).safeParse(cycle).success) {
    return { ok: false as const, code: "INVALID_INPUT" as const };
  }

  const apiKey = process.env.LEMONSQUEEZY_API_KEY;
  const storeId = process.env.LEMONSQUEEZY_STORE_ID;
  const variantId =
    cycle === "monthly"
      ? process.env.LEMONSQUEEZY_MONTHLY_VARIANT_ID
      : process.env.LEMONSQUEEZY_ANNUAL_VARIANT_ID;

  if (!apiKey || !storeId || !variantId) {
    return { ok: false as const, code: "BILLING_NOT_CONFIGURED" as const };
  }

  const res = await fetch("https://api.lemonsqueezy.com/v1/checkouts", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: "application/vnd.api+json",
      "Content-Type": "application/vnd.api+json",
    },
    body: JSON.stringify({
      data: {
        type: "checkouts",
        attributes: {
          checkout_data: { email: viewer.email, custom: { user_id: viewer.userId } },
          product_options: {
            redirect_url: `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/dashboard/billing`,
          },
        },
        relationships: {
          store: { data: { type: "stores", id: storeId } },
          variant: { data: { type: "variants", id: variantId } },
        },
      },
    }),
  });

  if (!res.ok) return { ok: false as const, code: "PROVIDER_ERROR" as const };
  const json = (await res.json()) as { data?: { attributes?: { url?: string } } };
  const url = json.data?.attributes?.url;
  if (!url) return { ok: false as const, code: "PROVIDER_ERROR" as const };
  return { ok: true as const, url };
}
