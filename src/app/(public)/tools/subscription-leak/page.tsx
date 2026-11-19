import type { Metadata } from "next";
import { AdSlot } from "@/components/ads/AdSlot";
import { SubscriptionLeak } from "@/components/calculators/SubscriptionLeak";
import { getViewer } from "@/lib/viewer";

export const metadata: Metadata = {
  title: "Subscription Leak Finder",
  description: "Add up your recurring subscriptions and see what they cost per year and what they could be worth if invested.",
};

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const viewer = await getViewer();
  const items = Array.isArray(sp.items) ? sp.items[0] : sp.items;

  return (
    <div>
      <h1 className="mb-1 text-3xl font-bold">Subscription Leak Finder</h1>
      <p className="mb-5 text-muted-foreground">List every recurring charge. We normalise weekly, quarterly and yearly bills to a monthly cost.</p>
      <SubscriptionLeak initialItems={items} currencyCode={viewer?.currencyCode} />
      <AdSlot slotId={process.env.NEXT_PUBLIC_AD_SLOT_BANNER ?? ""} isPro={viewer?.isPro ?? false} />
    </div>
  );
}
